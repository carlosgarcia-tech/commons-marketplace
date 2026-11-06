import { runSeeders } from '../../../../src/infrastructure/database/seeders/index.js';
import * as categorySeeder from '../../../../src/infrastructure/database/seeders/categorySeeder.js';

jest.mock('../../../../src/infrastructure/database/seeders/categorySeeder.js', () => ({
    seedCategories: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../../src/infrastructure/logger/logger.js', () => ({
    log: {
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

describe('Seeders Index', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('runSeeders', () => {
        it('should run all seeders', async () => {
            await runSeeders();

            expect(categorySeeder.seedCategories).toHaveBeenCalled();
        });

        it('should log start and completion', async () => {
            await runSeeders();

            const { log } = require('../../../../src/infrastructure/logger/logger.js');
            expect(log.info).toHaveBeenCalledWith('Starting database seeding...');
            expect(log.info).toHaveBeenCalledWith('Database seeding completed');
        });
    });
});
