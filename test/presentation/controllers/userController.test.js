import { createUserController } from '../../../src/presentation/controllers/userController.js';
import { CreateUserDTO } from '../../../src/application/dtos/users/CreateUserDTO.js';
import { UpdateUserDTO } from '../../../src/application/dtos/users/UpdateUserDTO.js';

jest.mock('../../../src/application/dtos/users/CreateUserDTO.js');
jest.mock('../../../src/application/dtos/users/UpdateUserDTO.js');

describe('UserController', () => {
    let controller;
    let createUserUC;
    let getAllUsersUC;
    let getUserByIdUC;
    let updateUserUC;
    let deleteUserUC;
    let getCurrentUserProfileUC;
    let updateUserProfilePictureUC;
    let req;
    let res;
    let next;

    beforeEach(() => {
        createUserUC = jest.fn();
        getAllUsersUC = jest.fn();
        getUserByIdUC = jest.fn();
        updateUserUC = jest.fn();
        deleteUserUC = jest.fn();
        getCurrentUserProfileUC = jest.fn();
        updateUserProfilePictureUC = jest.fn();

        controller = createUserController(
            createUserUC,
            getAllUsersUC,
            getUserByIdUC,
            updateUserUC,
            deleteUserUC,
            getCurrentUserProfileUC,
            updateUserProfilePictureUC,
        );

        req = {
            body: {},
            params: {},
            query: {},
            user: { id: 'user123' },
            token: 'jwt-token-123',
            file: null,
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };

        next = jest.fn();

        CreateUserDTO.from.mockImplementation((data) => data);
        UpdateUserDTO.from.mockImplementation((data) => data);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createUser', () => {
        it('should create a user successfully and return 201 status', async () => {
            const userData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
            };
            const createdUser = {
                id: 'user123',
                ...userData,
                createdAt: new Date(),
            };

            req.body = userData;
            CreateUserDTO.from.mockReturnValue(userData);
            createUserUC.mockResolvedValue(createdUser);

            await controller.createUser(req, res, next);

            expect(CreateUserDTO.from).toHaveBeenCalledWith({
                _id: 'user123',
                name: 'John Doe',
                lastName: undefined,
                phoneNumber: undefined,
                address: undefined,
                profilePicUrl: undefined,
            });
            expect(createUserUC).toHaveBeenCalledWith(userData);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(createdUser);
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle errors during user creation and call next', async () => {
            const userData = { name: 'John Doe', email: 'john@example.com' };
            const error = new Error('Email already exists');

            req.body = userData;
            CreateUserDTO.from.mockReturnValue(userData);
            createUserUC.mockRejectedValue(error);

            await controller.createUser(req, res, next);

            expect(CreateUserDTO.from).toHaveBeenCalledWith({
                _id: 'user123',
                name: 'John Doe',
                lastName: undefined,
                phoneNumber: undefined,
                address: undefined,
                profilePicUrl: undefined,
            });
            expect(createUserUC).toHaveBeenCalledWith(userData);
            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        it('should handle DTO validation errors', async () => {
            const invalidUserData = { name: 'John' };

            req.body = invalidUserData;
            CreateUserDTO.from.mockImplementation(() => {
                throw new Error('Invalid user data');
            });

            await controller.createUser(req, res, next);

            expect(CreateUserDTO.from).toHaveBeenCalledWith({
                _id: 'user123',
                name: 'John',
                lastName: undefined,
                phoneNumber: undefined,
                address: undefined,
                profilePicUrl: undefined,
            });
            expect(createUserUC).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect(next.mock.calls[0][0].message).toBe('Invalid user data');
        });
    });

    describe('getAllUsers', () => {
        it('should return all users successfully with query parameters', async () => {
            const queryParams = { page: 1, limit: 10 };
            const users = [
                { id: 'user1', name: 'User One' },
                { id: 'user2', name: 'User Two' },
            ];
            const paginatedResponse = {
                data: users,
                pagination: { page: 1, limit: 10, total: 2 },
            };

            req.query = queryParams;
            getAllUsersUC.mockResolvedValue(paginatedResponse);

            await controller.getAllUsers(req, res, next);

            expect(getAllUsersUC).toHaveBeenCalledWith(queryParams);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(paginatedResponse);
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle empty query parameters', async () => {
            req.query = {};
            const users = [{ id: 'user1', name: 'User One' }];
            const response = { data: users, pagination: { page: 1, limit: 20, total: 1 } };

            getAllUsersUC.mockResolvedValue(response);

            await controller.getAllUsers(req, res, next);

            expect(getAllUsersUC).toHaveBeenCalledWith({});
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(response);
        });

        it('should handle errors during user retrieval and call next', async () => {
            const error = new Error('Database error');
            getAllUsersUC.mockRejectedValue(error);

            await controller.getAllUsers(req, res, next);

            expect(getAllUsersUC).toHaveBeenCalledWith(req.query);
            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('getUserById', () => {
        it('should return user by ID successfully', async () => {
            const userId = 'user123';
            const user = { id: userId, name: 'John Doe', email: 'john@example.com' };

            req.params.id = userId;
            getUserByIdUC.mockResolvedValue(user);

            await controller.getUserById(req, res, next);

            expect(getUserByIdUC).toHaveBeenCalledWith(userId);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(user);
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle user not found', async () => {
            const userId = 'non-existent-id';

            req.params.id = userId;
            getUserByIdUC.mockResolvedValue(null);

            await controller.getUserById(req, res, next);

            expect(getUserByIdUC).toHaveBeenCalledWith(userId);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(null);
        });

        it('should handle errors during user retrieval by ID and call next', async () => {
            const userId = 'user123';
            const error = new Error('User not found');

            req.params.id = userId;
            getUserByIdUC.mockRejectedValue(error);

            await controller.getUserById(req, res, next);

            expect(getUserByIdUC).toHaveBeenCalledWith(userId);
            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('updateUserById', () => {
        it('should update user successfully and return updated user', async () => {
            const userId = 'user123';
            const updateData = {
                name: 'Updated Name',
                lastName: 'Doe',
                phoneNumber: '1234567890',
                address: '123 Main St',
            };
            const updatedUser = { id: userId, ...updateData, updatedAt: new Date() };

            req.params.id = userId;
            req.body = updateData;
            updateUserUC.mockResolvedValue(updatedUser);

            await controller.updateUserById(req, res, next);

            expect(updateUserUC).toHaveBeenCalledWith(userId, updateData, null);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(updatedUser);
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle errors during user update and call next', async () => {
            const userId = 'user123';
            const updateData = { name: 'Updated Name', lastName: 'Doe' };

            req.params.id = userId;
            req.body = updateData;
            updateUserUC.mockRejectedValue(new Error('Update failed'));

            await controller.updateUserById(req, res, next);

            expect(updateUserUC).toHaveBeenCalledWith(userId, updateData, null);
            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect(next.mock.calls[0][0].message).toBe('Update failed');
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should handle DTO validation errors during update', async () => {
            const userId = 'user123';
            const invalidUpdateData = { email: 'invalid-email' };

            req.params.id = userId;
            req.body = invalidUpdateData;
            updateUserUC.mockRejectedValue(new Error('Invalid email format'));

            await controller.updateUserById(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect(next.mock.calls[0][0].message).toBe('Invalid email format');
        });
    });

    describe('deleteUserById', () => {
        it('should delete user successfully and return 204 status', async () => {
            const userId = 'user123';

            req.params.id = userId;
            deleteUserUC.mockResolvedValue();

            await controller.deleteUserById(req, res, next);

            expect(deleteUserUC).toHaveBeenCalledWith(userId);
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle errors during user deletion and call next', async () => {
            const userId = 'user123';

            req.params.id = userId;
            deleteUserUC.mockRejectedValue(new Error('Deletion failed'));

            await controller.deleteUserById(req, res, next);

            expect(deleteUserUC).toHaveBeenCalledWith(userId);
            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect(next.mock.calls[0][0].message).toBe('Deletion failed');
            expect(res.status).not.toHaveBeenCalled();
            expect(res.send).not.toHaveBeenCalled();
        });
    });

    describe('getUserProfile', () => {
        it('should return current user profile successfully', async () => {
            const userProfile = {
                id: 'user123',
                name: 'John Doe',
                email: 'john@example.com',
                profilePicture: 'profile.jpg',
            };

            getCurrentUserProfileUC.mockResolvedValue(userProfile);

            await controller.getUserProfile(req, res, next);

            expect(getCurrentUserProfileUC).toHaveBeenCalledWith('user123', 'jwt-token-123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(userProfile);
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle errors during profile retrieval and call next', async () => {
            getCurrentUserProfileUC.mockRejectedValue(new Error('Profile not found'));

            await controller.getUserProfile(req, res, next);

            expect(getCurrentUserProfileUC).toHaveBeenCalledWith('user123', 'jwt-token-123');
            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect(next.mock.calls[0][0].message).toBe('Profile not found');
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should handle missing token', async () => {
            req.token = undefined;
            const userProfile = { id: 'user123', name: 'John Doe' };

            getCurrentUserProfileUC.mockResolvedValue(userProfile);

            await controller.getUserProfile(req, res, next);

            expect(getCurrentUserProfileUC).toHaveBeenCalledWith('user123', undefined);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(userProfile);
        });
    });

    describe('updateProfilePicture', () => {
        it('should update profile picture successfully', async () => {
            const mockFile = {
                filename: 'profile.jpg',
                path: '/uploads/profile.jpg',
                mimetype: 'image/jpeg',
            };
            const updatedUser = {
                id: 'user123',
                name: 'John Doe',
                profilePicture: 'profile.jpg',
            };

            req.file = mockFile;
            updateUserProfilePictureUC.mockResolvedValue(updatedUser);

            await controller.updateProfilePicture(req, res, next);

            expect(updateUserProfilePictureUC).toHaveBeenCalledWith('user123', mockFile);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(updatedUser);
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle errors during profile picture update and call next', async () => {
            const mockFile = { filename: 'profile.jpg' };

            req.file = mockFile;
            updateUserProfilePictureUC.mockRejectedValue(new Error('File upload failed'));

            await controller.updateProfilePicture(req, res, next);

            expect(updateUserProfilePictureUC).toHaveBeenCalledWith('user123', mockFile);
            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect(next.mock.calls[0][0].message).toBe('File upload failed');
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should handle missing file', async () => {
            req.file = undefined;

            updateUserProfilePictureUC.mockRejectedValue(new Error('No file provided'));

            await controller.updateProfilePicture(req, res, next);

            expect(updateUserProfilePictureUC).toHaveBeenCalledWith('user123', undefined);
            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect(next.mock.calls[0][0].message).toBe('No file provided');
        });

        it('should handle missing user in request', async () => {
            req.user = undefined;

            await controller.updateProfilePicture(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(TypeError));
            const capturedError = next.mock.calls[0][0];
            expect(capturedError.message).toMatch(/cannot read properties of undefined/i);
            expect(updateUserProfilePictureUC).not.toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing user in getUserProfile', async () => {
            req.user = undefined;

            await controller.getUserProfile(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(TypeError));
            const capturedError = next.mock.calls[0][0];
            expect(capturedError.message).toMatch(/cannot read properties of undefined/i);
        });

        it('should handle use cases returning null or undefined', async () => {
            req.params.id = 'user123';
            getUserByIdUC.mockResolvedValue(null);

            await controller.getUserById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(null);
        });

        it('should handle empty response from getAllUsers', async () => {
            const emptyResponse = { data: [], pagination: { page: 1, limit: 10, total: 0 } };
            getAllUsersUC.mockResolvedValue(emptyResponse);

            await controller.getAllUsers(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(emptyResponse);
        });

        it('should handle non-Error objects thrown by use cases', async () => {
            const stringError = 'String error message';
            getAllUsersUC.mockRejectedValue(stringError);

            await controller.getAllUsers(req, res, next);

            expect(next).toHaveBeenCalledWith(stringError);
        });
    });

    describe('Response Validation', () => {
        it('should return user with correct structure in createUser', async () => {
            const userData = { name: 'John Doe', email: 'john@example.com' };
            const createdUser = {
                id: 'user123',
                ...userData,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            req.body = userData;
            CreateUserDTO.from.mockReturnValue(userData);
            createUserUC.mockResolvedValue(createdUser);

            await controller.createUser(req, res, next);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: expect.any(String),
                    name: expect.any(String),
                    email: expect.any(String),
                    createdAt: expect.any(Date),
                }),
            );
        });

        it('should return paginated response in getAllUsers', async () => {
            const paginatedResponse = {
                data: [{ id: 'user1', name: 'User One' }],
                pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
            };

            getAllUsersUC.mockResolvedValue(paginatedResponse);

            await controller.getAllUsers(req, res, next);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.any(Array),
                    pagination: expect.objectContaining({
                        page: expect.any(Number),
                        limit: expect.any(Number),
                        total: expect.any(Number),
                    }),
                }),
            );
        });
    });
});
