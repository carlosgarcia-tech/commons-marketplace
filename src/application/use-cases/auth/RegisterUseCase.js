import { AuthDTO } from '../../dtos/users/AuthDTO.js';
import { CreateUserDTO } from '../../dtos/users/CreateUserDTO.js';
import { UserResponseDTO } from '../../dtos/users/UserResponseDTO.js';

export const registerUseCase = (authRepository, userRepository) => async (authDTO) => {
    const { email, password } = authDTO;

    const authResponse = await authRepository.signUp(email, password);

    if (authResponse.user && !authResponse.session) {
        return {
            needsEmailConfirmation: true,
            message: 'Por favor, revisa tu correo electrónico para confirmar tu cuenta',
        };
    }

    const supabaseId = authResponse.user.id;
    const newUserDTO = {
        _id: supabaseId,
        name: null,
        email: email,
        isApprovedSeller: false,
    };

    const userCreatedDTO = CreateUserDTO.from(newUserDTO);
    const createdUser = await userRepository.create(userCreatedDTO);

    return AuthDTO.registerResponse(UserResponseDTO.from(createdUser));
};
