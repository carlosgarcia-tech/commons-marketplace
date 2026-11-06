import CategoryModel from '../mongo/models/CategoryModel.js';
import { log } from '../../logger/logger.js';

const categories = [
    {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and accessories',
        level: 0,
        isActive: true,
    },
    {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion and apparel',
        level: 0,
        isActive: true,
    },
    {
        name: 'Books',
        slug: 'books',
        description: 'Books, magazines, and publications',
        level: 0,
        isActive: true,
    },
    {
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Home improvement and garden supplies',
        level: 0,
        isActive: true,
    },
    {
        name: 'Sports',
        slug: 'sports',
        description: 'Sports equipment and accessories',
        level: 0,
        isActive: true,
    },
];

const subCategories = [
    {
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'Mobile phones and accessories',
        parent: null,
        level: 1,
        isActive: true,
    },
    {
        name: 'Laptops',
        slug: 'laptops',
        description: 'Portable computers',
        parent: null,
        level: 1,
        isActive: true,
    },
    {
        name: "Men's Clothing",
        slug: 'mens-clothing',
        description: "Men's fashion",
        parent: null,
        level: 1,
        isActive: true,
    },
    {
        name: "Women's Clothing",
        slug: 'womens-clothing',
        description: "Women's fashion",
        parent: null,
        level: 1,
        isActive: true,
    },
];

/**
 * Seed categories.
 * @returns {Promise<void>}
 */
export const seedCategories = async () => {
    try {
        const existingCategories = await CategoryModel.countDocuments();
        if (existingCategories > 0) {
            log.info('Categories already seeded, skipping');
            return;
        }

        const mainCategories = await CategoryModel.insertMany(categories);
        log.info(`Seeded ${mainCategories.length} main categories`);

        const electronics = mainCategories.find((c) => c.slug === 'electronics');
        const clothing = mainCategories.find((c) => c.slug === 'clothing');

        const subCategoriesWithParents = subCategories
            .map((sub) => {
                if (sub.slug === 'smartphones' || sub.slug === 'laptops') {
                    return { ...sub, parent: electronics?._id };
                }
                if (sub.slug === 'mens-clothing' || sub.slug === 'womens-clothing') {
                    return { ...sub, parent: clothing?._id };
                }
                return sub;
            })
            .filter((sub) => sub.parent);

        if (subCategoriesWithParents.length > 0) {
            await CategoryModel.insertMany(subCategoriesWithParents);
            log.info(`Seeded ${subCategoriesWithParents.length} subcategories`);
        }

        log.info('Categories seeded successfully');
    } catch (error) {
        log.error('Error seeding categories', { error: error.message });
        throw error;
    }
};

export default seedCategories;
