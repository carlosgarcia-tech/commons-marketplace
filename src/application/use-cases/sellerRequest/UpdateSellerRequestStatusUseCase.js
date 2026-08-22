import { badRequestException, notFoundException } from '../../../presentation/exceptions/index.js';

/**
 * Updates seller request status use case
 * @param {object} sellerRequestRepository - Seller request repository
 * @param {object} authRepository - Auth repository for updating user role in Supabase
 * @param {object} userRepository - User repository for updating user role in MongoDB
 * @returns {Function} Use case function
 */
export const updateSellerRequestStatusUseCase = (
    sellerRequestRepository,
    authRepository,
    userRepository,
) => {
    return async (requestId, updateData) => {
        const request = await sellerRequestRepository.findById(requestId);

        if (!request) {
            throw notFoundException('Seller request not found');
        }

        if (request.status !== 'pending') {
            throw badRequestException('Only pending requests can be updated');
        }

        const updatedRequest = await sellerRequestRepository.updateById(requestId, {
            status: updateData.status,
            adminComment: updateData.adminComment || '',
        });

        if (updateData.status === 'approved') {
            try {
                await userRepository.updateById(request.userId, {
                    role: 'seller',
                });

                await authRepository.updateUserAppMetadata(request.userId, { role: 'seller' });
            } catch (error) {
                await sellerRequestRepository.updateById(requestId, {
                    status: 'pending',
                    adminComment: 'Error updating user role. Please try again.',
                });

                throw new Error('Error updating user role: ' + error.message);
            }
        }

        return updatedRequest;
    };
};
