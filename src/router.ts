import express, {Request, Response} from 'express';
import {testData} from './modules/test.js';
import {routingService} from './modules/routing-service.js';

export const router = express.Router();

/**
 * @route GET /
 */
router.get(
    '/',
    (req: Request, res: Response): void => {
        console.log(`--- [router] GET /`); //// TEST
        res.json(testData);
    }
);

/**
 * @route POST /generate-message-login
 */
router.post(
    '/generate-message-login',
    async (req: Request, res: Response): Promise<void> => {
        console.log(`--- [router] GET /generate-message-login`); //// TEST
        const {walletAddress, chainId} = req.body;
        const responseData = await routingService.generateMessageLogin(walletAddress, chainId);
        res.json(responseData);
    }
);

/**
 * @route POST /verify-signature
 */
router.post(
    '/verify-signature',
    async (req: Request, res: Response): Promise<void> => {
        console.log(`--- [router] GET /verify-signature`); //// TEST
        const {typedData, signature, token} = req.body;
        const responseData = await routingService.verifySignature(typedData, signature, token);
        res.json(responseData);
    }
);

/**
 * @route POST /auth-test
 */
router.post(
    '/auth-test',
    async (req: Request, res: Response): Promise<void> => {
        console.log(`--- [router] GET /auth-test`); //// TEST
        const {data} = req.body;
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            res.status(401).json({success: false, error: 'Authorization header missing'});
            return;
        }
        const token = authHeader.split(' ')[1];
        const responseData = await routingService.authTest(data, token);
        res.json(responseData);
    }
);
