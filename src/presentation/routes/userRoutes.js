import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isRole, canModifyUser } from '../middlewares/authorizationMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import * as UserValidator from '../validators/userValidator.js';
import { upload } from '../../infrastructure/web/express.js';

export const createUserRoutes = (userController) => {
    const router = express.Router();

    router.post(
        '/',
        UserValidator.createUserValidation(),
        validate,
        authenticate,
        userController.createUser,
    );

    router.get('/', authenticate, isRole('Admin'), userController.getAllUsers);
    router.get('/profile', authenticate, userController.getUserProfile);

    router.patch(
        '/profile/picture',
        authenticate,
        upload.single('profilePicture'),
        userController.updateProfilePicture,
    );

    router.get(
        '/:id',
        UserValidator.userIdParamValidation(),
        validate,
        authenticate,
        userController.getUserById,
    );

    router.put(
        '/:id',
        UserValidator.userIdParamValidation(),
        validate,
        authenticate,
        canModifyUser,
        upload.single('avatar'),
        userController.updateUserById,
    );

    router.delete(
        '/:id',
        UserValidator.userIdParamValidation(),
        validate,
        authenticate,
        isRole('Admin'),
        userController.deleteUserById,
    );

    return router;
};
