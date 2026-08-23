import { forbiddenException } from '../exceptions/forbiddenException.js';

export const extractUserRole = (req) => {
    return req.user?.app_metadata?.role?.toLowerCase() || 'buyer';
};

export const isRole =
    (...roles) =>
    (req, res, next) => {
        const userRole = extractUserRole(req);
        const normalizedRoles = roles.map((r) => r.toLowerCase());

        if (!userRole || !normalizedRoles.includes(userRole)) {
            return next(forbiddenException('Insufficient permissions.'));
        }
        next();
    };

export const createIsProductOwnerOrAdmin = (getProductByIdUseCase) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const userRole = extractUserRole(req);
            const productId = req.params.productId || req.params.id;
            const product = await getProductByIdUseCase(productId);

            if (!product) {
                return next(forbiddenException('Product not found.'));
            }

            if (userRole === 'admin' || product.sellerId === userId) {
                return next();
            }

            return next(forbiddenException('You are not allowed to modify this product.'));
        } catch (error) {
            return next(error);
        }
    };
};

export const isAdmin = (req, res, next) => {
    const userRole = extractUserRole(req);

    if (userRole !== 'admin') {
        return next(forbiddenException('Admin access only.'));
    }
    next();
};

export const canModifyUser = (req, res, next) => {
    try {
        const userId = req.user?.id;
        const userRole = extractUserRole(req);
        const targetUserId = req.params.id;

        if (userRole === 'admin' || userId === targetUserId) {
            return next();
        }

        return next(forbiddenException('You are not allowed to modify this user.'));
    } catch (error) {
        return next(error);
    }
};
