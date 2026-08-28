import { UserRepositoryImpl } from '../database/mongo/repositories/userRepository.js';
import { AuthRepositoryImpl } from '../supabase/repositories/AuthRepositoryImpl.js';
import { CategoryRepositoryImpl } from '../database/mongo/repositories/CategoryRepository.js';
import { ProductRepositoryImpl } from '../database/mongo/repositories/ProductRepository.js';
import { StoreRepositoryImpl } from '../database/mongo/repositories/StoreRepository.js';
import { ReviewRepositoryImpl } from '../database/mongo/repositories/ReviewRepository.js';
import * as fileService from '../../core/services/fileService.js';
import * as chatRepositoryImpl from '../ably/repositories/ChatRepositoryImpl.js';
import * as messageRepository from '../database/mongo/repositories/MessageRepository.js';
import * as conversationRepository from '../database/mongo/repositories/ConversationRepository.js';
import * as sellerRequestRepository from '../database/mongo/repositories/SellerRequestRepository.js';
import { WishlistRepositoryImpl } from '../database/mongo/repositories/WishlistRepository.js';

// --- Use Cases (Application Layer) ---
// Auth
import { registerUseCase } from '../../application/use-cases/auth/RegisterUseCase.js';
import { loginUseCase } from '../../application/use-cases/auth/LoginUseCase.js';
import { logoutUseCase } from '../../application/use-cases/auth/LogoutUseCase.js';
import { refreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase.js';
// User
import {
    createUserUseCase,
    getUserByIdUseCase,
    getAllUsersUseCase,
    updateUserUseCase,
    deleteUserUseCase,
    getCurrentUserProfileUseCase,
    updateUserProfilePictureUseCase,
} from '../../application/use-cases/user/index.js';
// Category
import {
    createCategoryUseCase,
    getAllCategoriesUseCase,
    getCategoryByIdUseCase,
    updateCategoryUseCase,
    deleteCategoryUseCase,
    getMainCategoriesUseCase,
    getSubcategoriesUseCase,
} from '../../application/use-cases/category/index.js';
// Product
import {
    createProductUseCase,
    getAllProductsUseCase,
    getProductByIdUseCase,
    updateProductUseCase,
    deleteProductUseCase,
    getStoreProductsUseCase,
    getRelatedProductsUseCase,
    searchProductsUseCase,
} from '../../application/use-cases/product/index.js';
// Store
import {
    createStoreUseCase,
    getStoreByUserIdUseCase,
    getStoreByIdUseCase,
    getMyStoresUseCase,
    getAllStoresUseCase,
    updateStoreUseCase,
    deleteStoreUseCase,
    getPendingStoresUseCase,
    getStoresByStatusUseCase,
    updateStoreStatusUseCase,
    getStoreCategoriesUseCase,
} from '../../application/use-cases/store/index.js';
// Review
import {
    createReviewUseCase,
    getAllReviewsUseCase,
    getReviewByIdUseCase,
    updateReviewUseCase,
    deleteReviewUseCase,
} from '../../application/use-cases/review/index.js';
// Chat
import {
    sendMessageUseCase,
    getConversationMessagesUseCase,
    getUserConversationsUseCase,
    markMessagesAsReadUseCase,
    generateChatTokenUseCase,
} from '../../application/use-cases/chat/index.js';
// Admin
import { createGetAdminStatsUseCase } from '../../application/use-cases/admin/GetAdminStatsUseCase.js';
// Seller Request
import {
    createSellerRequestUseCase,
    getAllSellerRequestsUseCase,
    getSellerRequestByIdUseCase,
    getSellerRequestByUserIdUseCase,
    updateSellerRequestStatusUseCase,
    deleteSellerRequestUseCase,
} from '../../application/use-cases/sellerRequest/index.js';

// Coupon (demo)
import { claimCouponUseCase } from '../../application/use-cases/coupon/index.js';

// Wishlist
import {
    getWishlistUseCase,
    addToWishlistUseCase,
    removeFromWishlistUseCase,
    checkWishlistUseCase,
    clearWishlistUseCase,
} from '../../application/use-cases/wishlist/index.js';

// --- Controllers & Middlewares (Presentation Layer) ---
import { createAuthController } from '../../presentation/controllers/authController.js';
import { createUserController } from '../../presentation/controllers/userController.js';
import { categoryController as createCategoryController } from '../../presentation/controllers/categoryController.js';
import { createProductController } from '../../presentation/controllers/productController.js';
import { createStoreController } from '../../presentation/controllers/storeController.js';
import * as chatControllerModule from '../../presentation/controllers/chatController.js';
import { createWishlistController } from '../../presentation/controllers/wishlistController.js';
import { createAdminController } from '../../presentation/controllers/adminController.js';
import { createReviewController } from '../../presentation/controllers/reviewController.js';
import { createSellerRequestController } from '../../presentation/controllers/sellerRequestController.js';
import { createCouponController } from '../../presentation/controllers/couponController.js';
import { createCanModifyProduct } from '../../presentation/middlewares/productAuthorizationMiddleware.js';
import { createCanModifyStore } from '../../presentation/middlewares/storeAuthorizationMiddleware.js';

import * as userService from '../../core/services/userService.js';

export const createContainer = () => {
    // --- Infrastructure Layer ---
    const userRepo = UserRepositoryImpl;
    const authRepo = AuthRepositoryImpl;
    const categoryRepo = CategoryRepositoryImpl;
    const productRepo = ProductRepositoryImpl;
    const storeRepo = StoreRepositoryImpl;
    const reviewRepo = ReviewRepositoryImpl;
    const chatRepo = chatRepositoryImpl;
    const messageRepo = messageRepository;
    const conversationRepo = conversationRepository;
    const sellerRequestRepo = sellerRequestRepository;
    const wishlistRepo = WishlistRepositoryImpl;

    // --- Application Layer (Use Cases) ---
    // Auth
    const registerUC = registerUseCase(authRepo, userRepo);
    const loginUC = loginUseCase(authRepo, userRepo);
    const logoutUC = logoutUseCase(authRepo);
    const refreshTokenUC = refreshTokenUseCase(authRepo);

    // User
    const createUserUC = createUserUseCase(userRepo);
    const getUserByIdUC = getUserByIdUseCase(userRepo);
    const getAllUsersUC = getAllUsersUseCase(userRepo);
    const updateUserUC = updateUserUseCase(userRepo, fileService);
    const deleteUserUC = deleteUserUseCase(userRepo);
    const getCurrentUserProfileUC = getCurrentUserProfileUseCase(userRepo, authRepo);
    const updateUserProfilePictureUC = updateUserProfilePictureUseCase(userRepo, fileService);

    // Category
    const createCategoryUC = createCategoryUseCase(categoryRepo);
    const getAllCategoriesUC = getAllCategoriesUseCase(categoryRepo);
    const getCategoryByIdUC = getCategoryByIdUseCase(categoryRepo);
    const updateCategoryUC = updateCategoryUseCase(categoryRepo);
    const deleteCategoryUC = deleteCategoryUseCase(categoryRepo);
    const getMainCategoriesUC = getMainCategoriesUseCase(categoryRepo);
    const getSubcategoriesUC = getSubcategoriesUseCase(categoryRepo);

    // Product
    const createProductUC = createProductUseCase(productRepo, storeRepo, categoryRepo);
    const getAllProductsUC = getAllProductsUseCase(productRepo);
    const getProductByIdUC = getProductByIdUseCase(productRepo);
    const updateProductUC = updateProductUseCase(productRepo, categoryRepo);
    const deleteProductUC = deleteProductUseCase(productRepo, storeRepo);
    const getStoreProductsUC = getStoreProductsUseCase(productRepo, storeRepo);
    const getRelatedProductsUC = getRelatedProductsUseCase(productRepo);
    const searchProductsUC = searchProductsUseCase(productRepo);

    // Store
    const createStoreUC = createStoreUseCase(storeRepo, userRepo, categoryRepo, fileService);
    const getStoreByUserIdUC = getStoreByUserIdUseCase(storeRepo);
    const getStoreByIdUC = getStoreByIdUseCase(storeRepo);
    const getMyStoresUC = getMyStoresUseCase(storeRepo);
    const getAllStoresUC = getAllStoresUseCase(storeRepo);
    const updateStoreUC = updateStoreUseCase(storeRepo, categoryRepo, fileService);
    const deleteStoreUC = deleteStoreUseCase(storeRepo, productRepo, fileService);
    const getPendingStoresUC = getPendingStoresUseCase(storeRepo);
    const getStoresByStatusUC = getStoresByStatusUseCase(storeRepo);
    const updateStoreStatusUC = updateStoreStatusUseCase(storeRepo);
    const getStoreCategoriesUC = getStoreCategoriesUseCase(storeRepo, productRepo, categoryRepo);

    // Review
    const createReviewUC = createReviewUseCase(reviewRepo, userRepo, productRepo, storeRepo);
    const getAllReviewsUC = getAllReviewsUseCase(reviewRepo);
    const getReviewByIdUC = getReviewByIdUseCase(reviewRepo);
    const updateReviewUC = updateReviewUseCase(reviewRepo);
    const deleteReviewUC = deleteReviewUseCase(reviewRepo);

    // Chat
    const sendMessageUC = sendMessageUseCase({
        messageRepository: messageRepo,
        conversationRepository: conversationRepo,
        chatRepository: chatRepo,
        userRepository: userRepo,
        getUserBasicInfo: userService.getUserBasicInfo,
    });

    const getConversationMessagesUC = getConversationMessagesUseCase({
        messageRepository: messageRepo,
        conversationRepository: conversationRepo,
        userRepository: userRepo,
        getUserBasicInfo: userService.getUserBasicInfo,
    });

    const getUserConversationsUC = getUserConversationsUseCase({
        conversationRepository: conversationRepo,
        userRepository: userRepo,
        getUserBasicInfo: userService.getUserBasicInfo,
    });

    const markMessagesAsReadUC = markMessagesAsReadUseCase({
        messageRepository: messageRepo,
        conversationRepository: conversationRepo,
        chatRepository: chatRepo,
    });

    const generateChatTokenUC = generateChatTokenUseCase({ chatRepository: chatRepo });

    // Admin
    const getAdminStatsUC = createGetAdminStatsUseCase(
        userRepo,
        productRepo,
        categoryRepo,
        storeRepo,
    );

    // Seller Request
    const createSellerRequestUC = createSellerRequestUseCase(sellerRequestRepo);
    const getAllSellerRequestsUC = getAllSellerRequestsUseCase(sellerRequestRepo);
    const getSellerRequestByIdUC = getSellerRequestByIdUseCase(sellerRequestRepo);
    const getSellerRequestByUserIdUC = getSellerRequestByUserIdUseCase(sellerRequestRepo);
    const updateSellerRequestStatusUC = updateSellerRequestStatusUseCase(
        sellerRequestRepo,
        authRepo,
        userRepo,
    );
    const deleteSellerRequestUC = deleteSellerRequestUseCase(sellerRequestRepo);

    // Coupon (demo)
    const claimCouponUC = claimCouponUseCase();

    // Wishlist
    const getWishlistUC = getWishlistUseCase(wishlistRepo);
    const addToWishlistUC = addToWishlistUseCase(wishlistRepo, productRepo);
    const removeFromWishlistUC = removeFromWishlistUseCase(wishlistRepo);
    const checkWishlistUC = checkWishlistUseCase(wishlistRepo);
    const clearWishlistUC = clearWishlistUseCase(wishlistRepo);

    // --- Presentation Layer (Controllers & Middlewares) ---
    // Middlewares
    const canModifyProduct = createCanModifyProduct(getProductByIdUC, storeRepo);
    const canModifyStore = createCanModifyStore(storeRepo);

    // Controllers
    const authController = createAuthController(registerUC, loginUC, logoutUC, refreshTokenUC);

    const userController = createUserController(
        createUserUC,
        getAllUsersUC,
        getUserByIdUC,
        updateUserUC,
        deleteUserUC,
        getCurrentUserProfileUC,
        updateUserProfilePictureUC,
    );

    const categoryController = createCategoryController({
        resolve: (dependency) =>
            ({
                createCategoryUseCase: createCategoryUC,
                getAllCategoriesUseCase: getAllCategoriesUC,
                getCategoryByIdUseCase: getCategoryByIdUC,
                updateCategoryUseCase: updateCategoryUC,
                deleteCategoryUseCase: deleteCategoryUC,
                getMainCategoriesUseCase: getMainCategoriesUC,
                getSubcategoriesUseCase: getSubcategoriesUC,
            })[dependency],
    });

    const productController = createProductController({
        createProductUseCase: createProductUC,
        getAllProductsUseCase: getAllProductsUC,
        getProductByIdUseCase: getProductByIdUC,
        updateProductUseCase: updateProductUC,
        deleteProductUseCase: deleteProductUC,
        getStoreProductsUseCase: getStoreProductsUC,
        getRelatedProductsUseCase: getRelatedProductsUC,
        searchProductsUseCase: searchProductsUC,
    });

    const storeController = createStoreController({
        createStoreUseCase: createStoreUC,
        getStoreByUserIdUseCase: getStoreByUserIdUC,
        getStoreByIdUseCase: getStoreByIdUC,
        getMyStoresUseCase: getMyStoresUC,
        getAllStoresUseCase: getAllStoresUC,
        updateStoreUseCase: updateStoreUC,
        deleteStoreUseCase: deleteStoreUC,
        getPendingStoresUseCase: getPendingStoresUC,
        getStoresByStatusUseCase: getStoresByStatusUC,
        updateStoreStatusUseCase: updateStoreStatusUC,
        getStoreCategoriesUseCase: getStoreCategoriesUC,
    });

    const reviewController = createReviewController({
        resolve: (dependency) =>
            ({
                createReviewUseCase: createReviewUC,
                getAllReviewsUseCase: getAllReviewsUC,
                getReviewByIdUseCase: getReviewByIdUC,
                updateReviewUseCase: updateReviewUC,
                deleteReviewUseCase: deleteReviewUC,
            })[dependency],
    });

    const chatController = {
        sendMessage: chatControllerModule.sendMessage({ sendMessageUseCase: sendMessageUC }),
        getConversationMessages: chatControllerModule.getConversationMessages({
            getConversationMessagesUseCase: getConversationMessagesUC,
        }),
        getUserConversations: chatControllerModule.getUserConversations({
            getUserConversationsUseCase: getUserConversationsUC,
        }),
        markMessagesAsRead: chatControllerModule.markMessagesAsRead({
            markMessagesAsReadUseCase: markMessagesAsReadUC,
        }),
        generateChatToken: chatControllerModule.generateChatToken({
            generateChatTokenUseCase: generateChatTokenUC,
        }),
        getConversationByParticipant: chatControllerModule.getConversationByParticipant({
            conversationRepository: conversationRepo,
        }),
    };

    const adminController = createAdminController(getAdminStatsUC);

    const sellerRequestController = createSellerRequestController({
        createSellerRequest: createSellerRequestUC,
        getAllSellerRequests: getAllSellerRequestsUC,
        getSellerRequestById: getSellerRequestByIdUC,
        getSellerRequestByUserId: getSellerRequestByUserIdUC,
        updateSellerRequestStatus: updateSellerRequestStatusUC,
        deleteSellerRequest: deleteSellerRequestUC,
    });

    const couponController = createCouponController({
        claimCouponUseCase: claimCouponUC,
    });

    const wishlistController = createWishlistController({
        getWishlistUseCase: getWishlistUC,
        addToWishlistUseCase: addToWishlistUC,
        removeFromWishlistUseCase: removeFromWishlistUC,
        checkWishlistUseCase: checkWishlistUC,
        clearWishlistUseCase: clearWishlistUC,
    });

    // --- Container Return ---
    return {
        // Controllers
        authController,
        userController,
        categoryController,
        productController,
        storeController,
        reviewController,
        chatController,
        wishlistController,
        adminController,
        sellerRequestController,
        couponController,

        // Middlewares
        canModifyProduct,
        canModifyStore,

        // Servicios
        userService,

        // Repositories
        userRepository: userRepo,
        messageRepository: messageRepo,
        conversationRepository: conversationRepo,
        chatRepository: chatRepo,
        storeRepository: storeRepo,
        categoryRepository: categoryRepo,
        wishlistRepository: wishlistRepo,
    };
};
