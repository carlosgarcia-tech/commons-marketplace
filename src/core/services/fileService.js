import { supabaseAdmin as supabase } from '../../infrastructure/supabase/config/supabaseClient.js';
import { internalServerError } from '../../presentation/exceptions/internalServerError.js';
import { log } from '../../infrastructure/logger/logger.js';
import sharp from 'sharp';
import { getEnvironmentConfig } from '../../config/environment.js';

const envConfig = getEnvironmentConfig();
const isTest = envConfig.nodeEnv === 'test';

// Fail fast with an actionable message instead of a cryptic storage
// error when the bucket name is missing from the environment.
const getBucket = () => {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET;
    if (!bucket) {
        throw internalServerError(
            'Image storage is not configured: SUPABASE_STORAGE_BUCKET is empty. Set the bucket name in the deployment environment and make sure the bucket exists in Supabase.',
        );
    }
    return bucket;
};

/**
 * Optimizes an image using sharp
 * Resizes to max dimension, converts to webp/jpeg, compresses
 * @param {Buffer} buffer - Original image buffer
 * @param {string} mimetype - Original mimetype
 * @returns {Promise<Buffer>} - Optimized image buffer
 */
const optimizeImage = async (buffer, mimetype) => {
    if (isTest) {
        return buffer;
    }

    try {
        const image = sharp(buffer);
        const metadata = await image.metadata();

        let optimized = image.clone();

        if (metadata.width > 1200 || metadata.height > 1200) {
            optimized = optimized.resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true,
            });
        }

        if (mimetype === 'image/png') {
            optimized = optimized.png({ quality: 80, progressive: true });
        } else if (mimetype === 'image/gif') {
            optimized = optimized.gif();
        } else if (mimetype === 'image/webp') {
            optimized = optimized.webp({ quality: 80 });
        } else {
            optimized = optimized.jpeg({ quality: 80, progressive: true });
        }

        return optimized.toBuffer();
    } catch (error) {
        log.warn('Image optimization failed, using original', {
            error: error.message,
        });
        return buffer;
    }
};

/**
 * Generates a thumbnail for product grids.
 * @param {Buffer} buffer - Original image buffer
 * @returns {Promise<Buffer>} - Thumbnail buffer
 * @todo Export this function for product thumbnail generation
 */
export const generateThumbnail = async (buffer) => {
    if (isTest) {
        return buffer;
    }

    try {
        return sharp(buffer)
            .resize(300, 300, {
                fit: 'cover',
                position: 'center',
            })
            .jpeg({ quality: 70, progressive: true })
            .toBuffer();
    } catch (error) {
        log.warn('Thumbnail generation failed', { error: error.message });
        return buffer;
    }
};

/**
 * Generates a unique filename for the file
 * @param {string} originalName - Original filename
 * @param {string} prefix - Optional prefix (e.g., 'user', 'product')
 * @returns {string} - Unique filename
 */
const generateFileName = (originalName, prefix = '') => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return prefix
        ? `${prefix}_${timestamp}_${randomString}_${cleanName}`
        : `${timestamp}_${randomString}_${cleanName}`;
};

/**
 * Extracts file path from Supabase URL
 * @param {string} imageUrl - Complete image URL
 * @returns {string} - File path in the bucket
 */
const extractPathFromUrl = (imageUrl) => {
    if (!imageUrl) return null;

    const match = imageUrl.match(/\/object\/(public|authenticated)\/[^/]+\/(.+)$/);
    return match ? match[2] : imageUrl.split('/').pop();
};

/**
 * Uploads a single image to Supabase bucket
 * @param {object} file - Multer file object (req.file)
 * @param {object} options - Upload options
 * @param {string} options.folder - Folder within the bucket (e.g., 'users', 'products')
 * @param {string} options.prefix - Prefix for filename
 * @returns {Promise<string>} - Public URL of the image
 */
export const uploadImage = async (file, options = {}) => {
    try {
        const { folder = '', prefix = '' } = options;
        const fileName = generateFileName(file.originalname, prefix);
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        log.debug('Uploading image', { fileName, filePath, mimetype: file.mimetype });

        const optimizedBuffer = await optimizeImage(file.buffer, file.mimetype);

        const { data, error } = await supabase.storage
            .from(getBucket())
            .upload(filePath, optimizedBuffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (error) {
            log.error('Upload error', { error: error.message, filePath });
            throw error;
        }

        const { data: urlData } = supabase.storage.from(getBucket()).getPublicUrl(data.path);

        log.info('Image uploaded successfully', { publicUrl: urlData.publicUrl });
        return urlData.publicUrl;
    } catch (error) {
        log.error('Error uploading image', { error: error.message, fileName: file.originalname });
        throw internalServerError(`Error uploading image: ${error.message}`);
    }
};

/**
 * Uploads multiple images to Supabase bucket
 * @param {Array<object>} files - Array of Multer file objects (req.files)
 * @param {object} options - Upload options
 * @param {string} options.folder - Folder within the bucket
 * @param {string} options.prefix - Prefix for filenames
 * @returns {Promise<Array<string>>} - Array of public URLs
 */
export const uploadMultipleImages = async (files, options = {}) => {
    try {
        const { folder = '', prefix = '' } = options;

        log.debug('Uploading multiple images', { count: files.length, folder, prefix });

        const uploadPromises = files.map((file) => {
            const fileName = generateFileName(file.originalname, prefix);
            const filePath = folder ? `${folder}/${fileName}` : fileName;

            return supabase.storage.from(getBucket()).upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });
        });

        const results = await Promise.all(uploadPromises);

        const errors = results.filter((result) => result.error);
        if (errors.length > 0) {
            log.error('Multiple upload errors', { errorCount: errors.length, errors });
            throw new Error('One or more uploads failed');
        }

        const publicUrls = results.map((result) => {
            const { data: urlData } = supabase.storage
                .from(getBucket())
                .getPublicUrl(result.data.path);
            return urlData.publicUrl;
        });

        log.info('Multiple images uploaded successfully', { count: publicUrls.length });
        return publicUrls;
    } catch (error) {
        log.error('Error uploading multiple images', { error: error.message, count: files.length });
        throw internalServerError(`Error uploading images: ${error.message}`);
    }
};

/**
 * Deletes an image from the bucket
 * @param {string} imageUrl - Complete image URL
 * @returns {Promise<boolean>} - true if successfully deleted
 */
export const deleteImage = async (imageUrl) => {
    try {
        if (!imageUrl) {
            throw new Error('No image URL provided');
        }

        const filePath = extractPathFromUrl(imageUrl);
        log.debug('Deleting image', { imageUrl, filePath });

        const { error } = await supabase.storage.from(getBucket()).remove([filePath]);

        if (error) {
            log.error('Supabase delete error', { error: error.message, filePath });
            throw error;
        }

        log.info('Image deleted successfully', { filePath });
        return true;
    } catch (error) {
        log.error('Error deleting image', { error: error.message, imageUrl });
        throw internalServerError(`Error deleting image: ${error.message}`);
    }
};

/**
 * Deletes multiple images from the bucket
 * @param {Array<string>} imageUrls - Array of image URLs
 * @returns {Promise<object>} - { success: number, failed: number, errors: Array }
 */
export const deleteMultipleImages = async (imageUrls) => {
    try {
        if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
            throw new Error('No image URLs provided');
        }

        const filePaths = imageUrls.filter((url) => url).map((url) => extractPathFromUrl(url));
        log.debug('Deleting multiple images', { count: filePaths.length });

        const { data, error } = await supabase.storage.from(getBucket()).remove(filePaths);

        if (error) {
            log.error('Supabase multiple delete error', {
                error: error.message,
                count: filePaths.length,
            });
            throw error;
        }

        const result = {
            success: data?.length || 0,
            failed: filePaths.length - (data?.length || 0),
            deletedPaths: data,
        };

        log.info('Multiple images deleted', result);
        return result;
    } catch (error) {
        log.error('Error deleting multiple images', {
            error: error.message,
            count: imageUrls.length,
        });
        throw internalServerError(`Error deleting multiple images: ${error.message}`);
    }
};

/**
 * Replaces an image (deletes old one and uploads new one)
 * @param {string} oldImageUrl - URL of image to replace
 * @param {object} newFile - New file to upload
 * @param {object} options - Upload options
 * @param {string} defaultImageUrl - Default image URL that should not be deleted
 * @returns {Promise<string>} - URL of the new image
 */
export const replaceImage = async (oldImageUrl, newFile, options = {}, defaultImageUrl = null) => {
    try {
        log.debug('Replacing image', { oldImageUrl, newFileName: newFile.originalname });

        const newImageUrl = await uploadImage(newFile, options);

        if (oldImageUrl && oldImageUrl !== defaultImageUrl) {
            try {
                await deleteImage(oldImageUrl);
            } catch (error) {
                log.warn('Could not delete old image', { error: error.message, oldImageUrl });
            }
        }

        log.info('Image replaced successfully', { oldImageUrl, newImageUrl });
        return newImageUrl;
    } catch (error) {
        log.error('Error replacing image', { error: error.message, oldImageUrl });
        throw internalServerError(`Error replacing image: ${error.message}`);
    }
};
