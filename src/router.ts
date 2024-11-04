import dotenv from 'dotenv';
import express, {Request, Response} from 'express';
import * as crypto from 'crypto';
import * as jose from 'jose';
import * as starknet from 'starknet';
import {testData} from './modules/test.js';

export const router = express.Router();

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ALGO = 'HS256';

type ChainId = 'SN_MAIN'|'SN_SEPOLIA';

async function generateJwtToken(payload: jose.JWTPayload, expiration: string): Promise<string> {
    // Sign the JWT with the secret key and expiration time
    const secret = new TextEncoder().encode(JWT_SECRET);
    return await new jose.SignJWT(payload)
        .setProtectedHeader({alg: JWT_ALGO})
        .setExpirationTime(expiration)
        .sign(secret);
}

function makeTypedData(
    message: string,
    walletAddress: string,
    chainId: ChainId,
    nonce: string,
    domainName: string = 'Influence Tools by Elerium115',
): starknet.TypedData {
    return {
        types: {
            StarkNetDomain: [
                {name: 'name', type: 'felt'},
                {name: 'chainId', type: 'felt'},
                {name: 'version', type: 'felt'},
            ],
            StarknetMessage: [
                {name: 'message', type: 'felt'},
                {name: 'nonce', type: 'felt'},
                {name: 'walletAddress', type: 'felt'},
            ],
        },
        primaryType: 'StarknetMessage',
        domain: {
            name: domainName,
            version: '0.0.1',
            chainId,
        },
        message: {
            message,
            nonce,
            walletAddress,
        },
    };
}

/**
 * @route GET /
 */
router.get(
    '/',
    (req: Request, res: Response) => {
        console.log(`--- [router] GET /`); //// TEST
        res.json(testData);
    }
);

/**
 * @route POST /generate-message-login
 */
router.post(
    '/generate-message-login',
    async (req: Request, res: Response) => {
        console.log(`--- [router] GET /generate-message-login`); //// TEST
        const {walletAddress, chainId} = req.body;
        // Generate secure random nonce
        const nonce = crypto.randomBytes(8).toString('hex');
        // Generate JWT token that includes walletAddress, chainId, and nonce
        const token = await generateJwtToken({walletAddress, chainId, nonce}, '5 minutes');
        // Generate "typedData" message to be signed in the client
        const typedData = makeTypedData(
            'Login to Industry Planner',
            walletAddress,
            chainId,
            nonce,
        );
        res.json({typedData, token});
    }
);
