import { AuthDTO } from '../../dtos/users/AuthDTO.js';
import { CreateUserDTO } from '../../dtos/users/CreateUserDTO.js';
import { UserResponseDTO } from '../../dtos/users/UserResponseDTO.js';

export const loginUseCase = (authRepository, userRepository) => async (authDTO) => {
    const { email, password } = authDTO;

    const loginResponse = await authRepository.signIn(email, password);

    // Roles live exclusively in MongoDB: Supabase only authenticates
    // identity. First-time logins provision a 'buyer' profile (schema
    // default); role changes are made directly on the Mongo document.
    let user = await userRepository.findById(loginResponse.user.id);

    if (!user) {
        const newUserDTO = CreateUserDTO.from({
            _id: loginResponse.user.id,
            email: email,
            name: null,
            isApprovedSeller: false,
        });
        user = await userRepository.create(newUserDTO);
    }

    return AuthDTO.loginResponse(loginResponse.session, {
        token: loginResponse.session.access_token,
        user: user ? UserResponseDTO.from(user) : null,
    });
};
