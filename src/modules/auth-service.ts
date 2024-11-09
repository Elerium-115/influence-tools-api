import dotenv from 'dotenv';
import {
    NextFunction,
    Request,
    Response,
} from 'express';
import * as jose from 'jose';

dotenv.config();

const JWT_ALGO = 'HS256';
const JWT_SECRET = process.env.JWT_SECRET;

interface JWTPayloadForAuth {
    walletAddress: string,
    chainId: string,
    nonce?: string,
}

// Extend the "Request" interface with the properties extracted from a valid JWT payload
declare global {
    namespace Express {
        interface Request {
            walletAddress?: string;
            chainId?: string,
        }
    }
}

/**
 * Singleton
 */
class AuthService {
    private static instance: AuthService;

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    public async generateJwtToken(
        payload: jose.JWTPayload,
        expiration: string,
    ): Promise<string> {
        // Sign the JWT with the secret key and expiration time
        const secret = new TextEncoder().encode(JWT_SECRET);
        return await new jose.SignJWT(payload)
            .setProtectedHeader({alg: JWT_ALGO})
            .setExpirationTime(expiration)
            .sign(secret);
    }

    public async verifyJwtToken(token: string): Promise<jose.JWTPayload> {
        const secret = new TextEncoder().encode(JWT_SECRET);
        try {
            // Extract the payload, if the token is valid and NOT expired
            const {payload} = await jose.jwtVerify(token, secret, {algorithms: [JWT_ALGO]});
            return payload;
        } catch (error: any) {
            throw new Error('Token verification failed');
        }
    }

    /**
     * Middleware to check the JWT token on protected routes.
     * Defined as arrow function, to ensure "this" is bound
     * when this function is passed as a standalone function.
     */
    public verifyJwtTokenMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            const responseData = {
                status: 401,
                success: false,
                error: 'Authorization header missing',
            };
            res.status(responseData.status).json(responseData);
            return;
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            const responseData = {
                status: 401,
                success: false,
                error: 'Token missing',
            };
            res.status(responseData.status).json(responseData);
            return;
        }
        try {
            const payload = await this.verifyJwtToken(token) as any as JWTPayloadForAuth;
            // Attach the decoded user info to the request object
            req.walletAddress = payload.walletAddress;
            req.chainId = payload.chainId;
        } catch (error: any) {
            const responseData = {
                status: 401,
                success: false,
                error: 'Token invalid or expired',
            };
            res.status(responseData.status).json(responseData);
            return;
        }
        // Proceed to the next middleware or route handler
        next();
    }
}

const authService: AuthService = AuthService.getInstance(); // singleton

export {
    JWTPayloadForAuth,
    authService,
}
