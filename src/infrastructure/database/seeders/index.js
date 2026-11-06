import { seedCategories } from './categorySeeder.js';
import { log } from '../../logger/logger.js';

/**
 * Run all seeders.
 * @returns {Promise<void>}
 */
export const runSeeders = async () => {
    log.info('Starting database seeding...');

    await seedCategories();

    log.info('Database seeding completed');
};

export default runSeeders;
