import * as crypto from 'crypto';
import * as starknet from 'starknet';
import {authService, JWTPayloadForAuth} from './auth-service.js';

type ChainId = 'SN_MAIN'|'SN_SEPOLIA';

interface GenerateMessageLoginResponse {
    status: number,
    success: boolean,
    typedData?: starknet.TypedData, // if "success" TRUE
    token?: string, // if "success" TRUE
    error?: string, // if "success" FALSE
}

interface VerifySignatureResponse {
    status: number,
    success: boolean,
    token?: string, // if "success" TRUE
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

    public async generateMessageLogin(
        walletAddress: string,
        chainId: ChainId,
    ): Promise<GenerateMessageLoginResponse> {
        // console.log(`--- [generateMessageLogin] args:`, arguments); //// TEST
        if (!walletAddress || !chainId) {
            return {
                status: 400,
                success: false,
                error: 'Invalid wallet address or chain ID.',
            };
        }
        // Generate secure random nonce
        const nonce = crypto.randomBytes(8).toString('hex');
        // Generate JWT token that includes walletAddress, chainId, and nonce
        const token = await authService.generateJwtToken({walletAddress, chainId, nonce}, '5 minutes');
        // Generate "typedData" message to be signed in the client
        const typedData = this.makeTypedData(
            'Login to Influence Tools',
            walletAddress,
            chainId,
            nonce,
        );
        return {
            status: 200,
            success: true,
            typedData,
            token,
        };
    }

    public async verifySignature(
        typedData: starknet.TypedData,
        signature: starknet.Signature,
        token: string,
    ): Promise<VerifySignatureResponse> {
        // console.log(`--- [verifySignature] args:`, arguments); //// TEST
        try {
            // Verify JWT token and extract its payload
            const payload = await authService.verifyJwtToken(token) as any as JWTPayloadForAuth;
            const {walletAddress, chainId, nonce} = payload;
            // Ensure matching data in "typedData"
            const isMatchingAddress = (typedData.message as any).walletAddress === walletAddress;
            const isMatchingChainId = typedData.domain.chainId === chainId;
            const isMatchingNonce = (typedData.message as any).nonce === nonce;
            if (!isMatchingAddress || !isMatchingChainId || !isMatchingNonce) {
                return {
                    status: 400,
                    success: false,
                    error: 'Invalid wallet address, chain ID, or nonce.',
                };
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
                const token = await authService.generateJwtToken({walletAddress, chainId}, '1 week');
                return {
                    status: 200,
                    success: true,
                    token,
                };
            } else {
                return {
                    status: 400,
                    success: false,
                    error: 'Signature verification failed.',
                };
            }
        } catch (error: any) {
            return {
                status: 500,
                success: false,
                error: error.message,
            };
        }
    }
}

const starknetService: StarknetService = StarknetService.getInstance(); // singleton

export {
    ChainId,
    GenerateMessageLoginResponse,
    VerifySignatureResponse,
    starknetService,
}
