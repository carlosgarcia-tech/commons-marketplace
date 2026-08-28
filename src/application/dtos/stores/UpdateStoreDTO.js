/**
 * @typedef {object} UpdateStoreDTO
 * @property {string} [storeName] - The new name for the store.
 * @property {string} [description] - The new description for the store.
 * @property {string} [logo] - The new logo URL for the store.
 * @property {string[]} [categoryIds] - Array of category IDs the store sells.
 * @property {string} [seoTitle] - The new SEO title.
 * @property {string} [seoDescription] - The new SEO description.
 */

/**
 * Factory function to create an UpdateStoreDTO object.
 * It filters out undefined properties.
 * @param {object} data - Raw data for updating a store.
 * @param {string} [data.storeName] - The new name for the store, if provided.
 * @param {string} [data.description] - The new description for the store, if provided.
 * @param {string} [data.logo] - The new logo URL for the store, if provided.
 * @param {string[]} [data.categoryIds] - Array of category IDs, if provided.
 * @param {string} [data.seoTitle] - The new SEO title, if provided.
 * @param {string} [data.seoDescription] - The new SEO description, if provided.
 * @returns {UpdateStoreDTO} A frozen DTO containing only the valid fields to be updated.
 * @throws {Error} If no valid fields are provided.
 */
export function createUpdateStoreDTO({
    storeName,
    description,
    logo,
    categoryIds,
    seoTitle,
    seoDescription,
}) {
    const dto = {};

    if (storeName !== undefined) dto.storeName = storeName;
    if (description !== undefined) dto.description = description;
    if (logo !== undefined) dto.logo = logo;
    if (categoryIds !== undefined) dto.categoryIds = categoryIds;
    if (seoTitle !== undefined) dto.seoTitle = seoTitle;
    if (seoDescription !== undefined) dto.seoDescription = seoDescription;

    if (Object.keys(dto).length === 0) {
        throw new Error(
            'At least one field (storeName, description, logo, categoryIds, seoTitle, seoDescription) must be provided for an update.',
        );
    }

    return Object.freeze(dto);
}
