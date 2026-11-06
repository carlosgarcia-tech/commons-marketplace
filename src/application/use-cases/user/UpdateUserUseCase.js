import { UpdateUserDTO } from '../../dtos/users/index.js';
import { UserResponseDTO } from '../../dtos/users/index.js';

export const updateUserUseCase =
    (userRepository, fileService) => async (userId, updateUserDTO, file) => {
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            throw Error('A valid user ID must be provided for update');
        }

        const validation = UpdateUserDTO.validate(updateUserDTO);
        if (!validation.valid) {
            throw Error(validation.errors[0]);
        }

        const sanitizedData = UpdateUserDTO.sanitize(updateUserDTO);

        if (file) {
            const avatarUrl = await fileService.uploadImage(file);
            sanitizedData.profilePicUrl = avatarUrl;
        }

        const updatedUser = await userRepository.updateById(userId.trim(), sanitizedData);
        if (!updatedUser) {
            throw Error(`User with ID '${userId}' not found for update`);
        }
        return UserResponseDTO.from(updatedUser);
    };
