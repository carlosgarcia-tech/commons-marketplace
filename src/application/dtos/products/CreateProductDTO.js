/**
 * @typedef {object} CreateProductDTO
 * @property {string} name - The product name.
 * @property {string} description - The product description.
 * @property {number} price - The product price.
 * @property {number} stock - The available quantity.
 * @property {string} categoryId - The ID of the category this product belongs to.
 * @property {string} [subCategoryId] - The ID of the sub-category.
 * @property {string} sellerId - The ID of the seller publishing this product.
 * @property {string} storeId - The ID of the store this product belongs to.
 * @property {string} mainImageUrl - The URL of the main product image.
 * @property {string[]} [imageUrls] - Array of additional product images.
 * @property {string} [slug] - The product slug.
 * @property {string} [seoTitle] - The SEO title.
 * @property {string} [seoDescription] - The SEO description.
 * @property {string} [ogImage] - The Open Graph image URL.
 */

/**
 * Factory function to create a CreateProductDTO object.
 * @param {object} data - Raw data for creating a product.
 * @param {string} data.name - The product name.
 * @param {string} data.description - The product description.
 * @param {number} data.price - The product price.
 * @param {number} data.stock - The available quantity.
 * @param {string} data.categoryId - The ID of the category this product belongs to.
 * @param {string} [data.subCategoryId] - The ID of the sub-category.
 * @param {string} data.sellerId - The ID of the seller publishing this product.
 * @param {string} data.storeId - The ID of the store this product belongs to.
 * @param {string} data.mainImageUrl - The URL of the main product image.
 * @param {string[]} [data.imageUrls] - Array of additional product images.
 * @param {string} [data.slug] - The product slug.
 * @param {string} [data.seoTitle] - The SEO title.
 * @param {string} [data.seoDescription] - The SEO description.
 * @param {string} [data.ogImage] - The Open Graph image URL.
 * @returns {CreateProductDTO} A new DTO object.
 */
export function createCreateProductDTO({
    name,
    slug,
    seoTitle,
    seoDescription,
    description,
    price,
    stock,
    categoryId,
    subCategoryId,
    sellerId,
    storeId,
    mainImageUrl,
    imageUrls = [],
    ogImage,
}) {
    if (
        !name ||
        price == null ||
        stock == null ||
        !categoryId ||
        !sellerId ||
        !storeId ||
        !mainImageUrl
    ) {
        throw new Error(
            'Missing required fields for creating a product. categoryId, sellerId, storeId, and mainImageUrl are required.',
        );
    }

    const autoSlug =
        name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') +
        '-' +
        Date.now().toString(36);

    const autoSeoTitle = (seoTitle ?? name ?? '').slice(0, 70);
    const autoSeoDescription = (seoDescription ?? description ?? '').slice(0, 160);

    return {
        name,
        slug: slug || autoSlug,
        seoTitle: autoSeoTitle,
        seoDescription: autoSeoDescription,
        description,
        price,
        stock,
        categoryId,
        subCategoryId: subCategoryId || null,
        sellerId,
        storeId,
        mainImageUrl,
        imageUrls,
        ogImage: ogImage || mainImageUrl,
    };
}
