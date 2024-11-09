import express, {
    NextFunction,
    Request,
    Response,
} from 'express';
import {testData} from './modules/test.js';
import {authService} from './modules/auth-service.js';
import {routingService} from './modules/routing-service.js';

export const router = express.Router();

function logRequestMiddleware(req: Request, res: Response, next: NextFunction): void {
    console.log(`--- [router] ${req.method} ${req.path}`); //// TEST
    next();
}

/**
 * @route GET /
 */
router.get(
    '/',
    logRequestMiddleware,
    (req: Request, res: Response): void => {
        res.json(testData);
    }
);

/**
 * @route POST /generate-message-login
 */
router.post(
    '/generate-message-login',
    logRequestMiddleware,
    async (req: Request, res: Response): Promise<void> => {
        const {walletAddress, chainId} = req.body;
        const responseData = await routingService.generateMessageLogin(walletAddress, chainId);
        res.status(responseData.status).json(responseData);
    }
);

/**
 * @route POST /verify-signature
 */
router.post(
    '/verify-signature',
    logRequestMiddleware,
    async (req: Request, res: Response): Promise<void> => {
        const {typedData, signature, token} = req.body;
        const responseData = await routingService.verifySignature(typedData, signature, token);
        res.status(responseData.status).json(responseData);
    }
);

/**
 * @route POST /auth-test
 */
router.post(
    '/auth-test',
    logRequestMiddleware,
    authService.verifyJwtTokenMiddleware, // protected endpoint
    async (req: Request, res: Response): Promise<void> => {
        const responseData = {
            status: 200,
            success: true,
            data: {
                walletAddress: req.walletAddress,
                chainId: req.chainId,
                testResponse: 'Test response for valid JWT token'},
        };
        res.status(responseData.status).json(responseData);
    }
);
