import { updateSellerRequestStatusUseCase } from '../../../../src/application/use-cases/sellerRequest/UpdateSellerRequestStatusUseCase.js';

describe('UpdateSellerRequestStatusUseCase', () => {
    let sellerRequestRepository;
    let authRepository;
    let userRepository;
    let useCase;

    beforeEach(() => {
        sellerRequestRepository = {
            findById: jest.fn(),
            updateById: jest.fn(),
        };
        authRepository = {
            updateUserAppMetadata: jest.fn(),
        };
        userRepository = {
            updateById: jest.fn(),
        };
        useCase = updateSellerRequestStatusUseCase(
            sellerRequestRepository,
            authRepository,
            userRepository,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should approve request and update user role in both MongoDB and Supabase', async () => {
        const requestId = 'req123';
        const updateData = {
            status: 'approved',
            adminComment: 'Approved by admin',
        };
        const existingRequest = {
            id: requestId,
            userId: 'user123',
            status: 'pending',
            message: 'Test message',
        };
        const updatedRequest = {
            ...existingRequest,
            status: 'approved',
            adminComment: updateData.adminComment,
        };

        sellerRequestRepository.findById.mockResolvedValue(existingRequest);
        sellerRequestRepository.updateById.mockResolvedValue(updatedRequest);
        userRepository.updateById.mockResolvedValue({ role: 'seller', isApprovedSeller: true });
        authRepository.updateUserAppMetadata.mockResolvedValue({ role: 'seller' });

        const result = await useCase(requestId, updateData);

        expect(sellerRequestRepository.findById).toHaveBeenCalledWith(requestId);
        expect(sellerRequestRepository.updateById).toHaveBeenCalledWith(requestId, {
            status: 'approved',
            adminComment: 'Approved by admin',
        });
        expect(userRepository.updateById).toHaveBeenCalledWith('user123', {
            role: 'seller',
        });
        expect(authRepository.updateUserAppMetadata).toHaveBeenCalledWith('user123', {
            role: 'seller',
        });
        expect(result).toEqual(updatedRequest);
    });

    it('should reject request without updating user role', async () => {
        const requestId = 'req123';
        const updateData = {
            status: 'rejected',
            adminComment: 'Does not meet requirements',
        };
        const existingRequest = {
            id: requestId,
            userId: 'user123',
            status: 'pending',
        };
        const updatedRequest = {
            ...existingRequest,
            status: 'rejected',
            adminComment: updateData.adminComment,
        };

        sellerRequestRepository.findById.mockResolvedValue(existingRequest);
        sellerRequestRepository.updateById.mockResolvedValue(updatedRequest);

        const result = await useCase(requestId, updateData);

        expect(sellerRequestRepository.updateById).toHaveBeenCalledWith(requestId, {
            status: 'rejected',
            adminComment: 'Does not meet requirements',
        });
        expect(userRepository.updateById).not.toHaveBeenCalled();
        expect(authRepository.updateUserAppMetadata).not.toHaveBeenCalled();
        expect(result).toEqual(updatedRequest);
    });

    it('should throw notFoundException when request does not exist', async () => {
        const requestId = 'nonexistent123';
        const updateData = { status: 'approved' };

        sellerRequestRepository.findById.mockResolvedValue(null);

        await expect(useCase(requestId, updateData)).rejects.toThrow('Seller request not found');
        expect(sellerRequestRepository.updateById).not.toHaveBeenCalled();
        expect(userRepository.updateById).not.toHaveBeenCalled();
        expect(authRepository.updateUserAppMetadata).not.toHaveBeenCalled();
    });

    it('should throw badRequestException when request is already approved', async () => {
        const requestId = 'req123';
        const updateData = { status: 'rejected' };
        const existingRequest = {
            id: requestId,
            userId: 'user123',
            status: 'approved',
        };

        sellerRequestRepository.findById.mockResolvedValue(existingRequest);

        await expect(useCase(requestId, updateData)).rejects.toThrow(
            'Only pending requests can be updated',
        );
        expect(sellerRequestRepository.updateById).not.toHaveBeenCalled();
        expect(userRepository.updateById).not.toHaveBeenCalled();
        expect(authRepository.updateUserAppMetadata).not.toHaveBeenCalled();
    });

    it('should throw badRequestException when request is already rejected', async () => {
        const requestId = 'req123';
        const updateData = { status: 'approved' };
        const existingRequest = {
            id: requestId,
            userId: 'user123',
            status: 'rejected',
        };

        sellerRequestRepository.findById.mockResolvedValue(existingRequest);

        await expect(useCase(requestId, updateData)).rejects.toThrow(
            'Only pending requests can be updated',
        );
        expect(sellerRequestRepository.updateById).not.toHaveBeenCalled();
        expect(userRepository.updateById).not.toHaveBeenCalled();
    });

    it('should update with empty adminComment when not provided', async () => {
        const requestId = 'req123';
        const updateData = { status: 'rejected' };
        const existingRequest = {
            id: requestId,
            userId: 'user123',
            status: 'pending',
        };
        const updatedRequest = {
            ...existingRequest,
            status: 'rejected',
            adminComment: '',
        };

        sellerRequestRepository.findById.mockResolvedValue(existingRequest);
        sellerRequestRepository.updateById.mockResolvedValue(updatedRequest);

        const result = await useCase(requestId, updateData);

        expect(sellerRequestRepository.updateById).toHaveBeenCalledWith(requestId, {
            status: 'rejected',
            adminComment: '',
        });
        expect(result).toEqual(updatedRequest);
    });

    it('should rollback to pending status when userRepository fails on approval', async () => {
        const requestId = 'req123';
        const updateData = { status: 'approved' };
        const existingRequest = {
            id: requestId,
            userId: 'user123',
            status: 'pending',
        };
        const updatedRequest = {
            ...existingRequest,
            status: 'approved',
            adminComment: '',
        };

        sellerRequestRepository.findById.mockResolvedValue(existingRequest);
        sellerRequestRepository.updateById.mockResolvedValue(updatedRequest);
        userRepository.updateById.mockRejectedValue(new Error('MongoDB error'));

        await expect(useCase(requestId, updateData)).rejects.toThrow(
            'Error updating user role: MongoDB error',
        );

        expect(userRepository.updateById).toHaveBeenCalled();
        expect(authRepository.updateUserAppMetadata).not.toHaveBeenCalled();
        expect(sellerRequestRepository.updateById).toHaveBeenCalledTimes(2);
        expect(sellerRequestRepository.updateById).toHaveBeenLastCalledWith(requestId, {
            status: 'pending',
            adminComment: 'Error updating user role. Please try again.',
        });
    });

    it('should rollback to pending status when authRepository fails on approval', async () => {
        const requestId = 'req123';
        const updateData = { status: 'approved' };
        const existingRequest = {
            id: requestId,
            userId: 'user123',
            status: 'pending',
        };
        const updatedRequest = {
            ...existingRequest,
            status: 'approved',
            adminComment: '',
        };

        sellerRequestRepository.findById.mockResolvedValue(existingRequest);
        sellerRequestRepository.updateById.mockResolvedValue(updatedRequest);
        userRepository.updateById.mockResolvedValue({ role: 'seller', isApprovedSeller: true });
        authRepository.updateUserAppMetadata.mockRejectedValue(new Error('Supabase error'));

        await expect(useCase(requestId, updateData)).rejects.toThrow(
            'Error updating user role: Supabase error',
        );

        expect(userRepository.updateById).toHaveBeenCalled();
        expect(authRepository.updateUserAppMetadata).toHaveBeenCalled();
        expect(sellerRequestRepository.updateById).toHaveBeenCalledTimes(2);
        expect(sellerRequestRepository.updateById).toHaveBeenLastCalledWith(requestId, {
            status: 'pending',
            adminComment: 'Error updating user role. Please try again.',
        });
    });
});
