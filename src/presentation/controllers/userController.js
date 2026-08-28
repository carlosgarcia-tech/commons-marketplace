import { CreateUserDTO } from '../../application/dtos/users/CreateUserDTO.js';

export const createUserController = (
    createUserUC,
    getAllUsersUC,
    getUserByIdUC,
    updateUserUC,
    deleteUserUC,
    getCurrentUserProfileUC,
    updateUserProfilePictureUC,
) => ({
    createUser: async (req, res, next) => {
        try {
            // The MongoDB profile _id must be tied to the authenticated
            // Supabase subject. Deriving it here (instead of trusting the
            // client body) prevents an attacker from provisioning a profile
            // under someone else's ID to bypass ownership checks.
            const { name, lastName, phoneNumber, address, profilePicUrl } = req.body;
            const dto = CreateUserDTO.from({
                _id: req.user.id,
                name,
                lastName,
                phoneNumber,
                address,
                profilePicUrl,
            });
            const result = await createUserUC(dto);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    },

    getAllUsers: async (req, res, next) => {
        try {
            const result = await getAllUsersUC(req.query);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    getUserById: async (req, res, next) => {
        try {
            const result = await getUserByIdUC(req.params.id);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    updateUserById: async (req, res, next) => {
        try {
            const { name, lastName, phoneNumber, address } = req.body;
            const file = req.file;

            const updateData = {
                name,
                lastName,
                phoneNumber,
                address,
            };

            const result = await updateUserUC(req.params.id, updateData, file);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    deleteUserById: async (req, res, next) => {
        try {
            await deleteUserUC(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    },

    getUserProfile: async (req, res, next) => {
        try {
            const result = await getCurrentUserProfileUC(req.user.id, req.token);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    updateProfilePicture: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const file = req.file;
            const result = await updateUserProfilePictureUC(userId, file);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },
});
