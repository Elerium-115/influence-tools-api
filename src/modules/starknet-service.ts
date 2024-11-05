import dotenv from 'dotenv';
import * as crypto from 'crypto';
import * as jose from 'jose';
import * as starknet from 'starknet';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ALGO = 'HS256';

type ChainId = 'SN_MAIN'|'SN_SEPOLIA';

interface JWTPayloadForAuth {
    walletAddress: string,
    chainId: string,
    nonce?: string,
}

interface GenerateMessageLoginResponse {
    typedData: starknet.TypedData,
    token: string,
}

interface VerifySignatureResponse {
    success: boolean,
    token?: string, // if "success" TRUE
    error?: string, // if "success" FALSE
}

interface AuthedResponse {
    success: boolean,
    data?: any, // if "success" TRUE
    error?: string, // if "success" FALSE
}

/**
 * Singleton
 */
class StarknetService {
    private static instance: StarknetService;

    public static getInstance(): StarknetService {
        if (!StarknetService.instance) {
            StarknetService.instance = new StarknetService();
        }
        return StarknetService.instance;
    }

    private getRpcNodeUrl(chainId: string): string {
        // Source: http://starknetjs.com/docs/guides/connect_network
        if (chainId === 'SN_MAIN') {
            // Mainnet
            return 'https://starknet-mainnet.public.blastapi.io/rpc/v0_7';
        } else {
            // Sepolia
            return 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7';
        }
    }

    private makeTypedData(
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

    private async generateJwtToken(
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

    private async verifyJwtToken(token: string): Promise<jose.JWTPayload> {
        const secret = new TextEncoder().encode(JWT_SECRET);
        try {
            // Extract the payload, if the token is valid and NOT expired
            const {payload} = await jose.jwtVerify(token, secret, {algorithms: [JWT_ALGO]});
            return payload;
        } catch (error: any) {
            throw new Error('Token verification failed');
        }
    }

    public async generateMessageLogin(
        walletAddress: string,
        chainId: ChainId,
    ): Promise<GenerateMessageLoginResponse> {
        // Generate secure random nonce
        const nonce = crypto.randomBytes(8).toString('hex');
        // Generate JWT token that includes walletAddress, chainId, and nonce
        const token = await this.generateJwtToken({walletAddress, chainId, nonce}, '5 minutes');
        // Generate "typedData" message to be signed in the client
        const typedData = this.makeTypedData(
            'Login to Influence Tools',
            walletAddress,
            chainId,
            nonce,
        );
        return {typedData, token};
    }

    public async verifySignature(
        typedData: starknet.TypedData,
        signature: starknet.Signature,
        token: string,
    ): Promise<VerifySignatureResponse> {
        try {
            // Verify JWT token and extract its payload
            const {walletAddress, chainId, nonce} = await this.verifyJwtToken(token) as any as JWTPayloadForAuth;
            // Ensure matching data in "typedData"
            const isMatchingAddress = (typedData.message as any).walletAddress === walletAddress;
            const isMatchingChainId = typedData.domain.chainId === chainId;
            const isMatchingNonce = (typedData.message as any).nonce === nonce;
            if (!isMatchingAddress || !isMatchingChainId || !isMatchingNonce) {
                return {success: false, error: 'Invalid wallet address, chain ID, or nonce.'};
                // return res.status(400).json({success: false, error: 'Invalid wallet address, chain ID, or nonce.'}); //// TO USE @ API
            }
            /**
             * Verify the signature.
             * Source: https://dev.to/bastienfaivre/a-guide-on-starknet-signatures-a3m
             */
            const nodeUrl = this.getRpcNodeUrl(chainId);
            const rpcProvider = new starknet.RpcProvider({nodeUrl});
            // "0x123" is a placeholder for the user's private key
            const verifierAccount = new starknet.Account(rpcProvider, walletAddress, '0x123');
            const isValidSignature = await verifierAccount.verifyMessage(typedData, signature);
            if (isValidSignature) {
                // Generate long-term JWT auth token that includes walletAddress, chainId
                const token = await this.generateJwtToken({walletAddress, chainId}, '1 week');
                return {success: true, token};
                // res.json({success: true}); //// TO USE @ API
            } else {
                return {success: false, error: 'Signature verification failed.'};
                // res.status(400).json({success: false, error: 'Signature verification failed.'}); //// TO USE @ API
            }
        } catch (error: any) {
            return {success: false, error: error.message};
            // res.status(500).json({success: false, error: error.message}); //// TO USE @ API
        }
    }

    public async authTest(
        data: any,
        token: string,
    ): Promise<AuthedResponse> {
        //// TO USE @ API
        /*
        const {data} = req.body;
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({success: false, error: 'Authorization header missing'});
        }
        const token = authHeader.split(' ')[1];
        */
        if (!token) {
            // return res.status(401).json({success: false, error: 'Token missing'}); //// TO USE @ API
            return {success: false, error: 'Token missing'};
        }
        try {
            // Verify JWT token and extract its payload
            const {walletAddress, chainId} = await this.verifyJwtToken(token) as any as JWTPayloadForAuth;
            console.log(`--- [authTest] proceed for authed user:`, {walletAddress, chainId}); //// TEST
            //// ...
        } catch (error: any) {
            // return res.status(401).json({success: false, error: 'Token invalid or expired'}); //// TO USE @ API
            return {success: false, error: 'Token invalid or expired'};
        }
        return {success: true, data: {testResponse: 'Test Response'}}; //// TEST
    }
}

const starknetService: StarknetService = StarknetService.getInstance(); // singleton

export {
    AuthedResponse,
    ChainId,
    GenerateMessageLoginResponse,
    VerifySignatureResponse,
    starknetService,
}
