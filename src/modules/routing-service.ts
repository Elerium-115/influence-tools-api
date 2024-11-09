import * as starknet from 'starknet';
import {
    ChainId,
    GenerateMessageLoginResponse,
    VerifySignatureResponse,
    starknetService,
} from './starknet-service.js';

/**
 * Singleton
 */
class RoutingService {
    private static instance: RoutingService;

    public static getInstance(): RoutingService {
        if (!RoutingService.instance) {
            RoutingService.instance = new RoutingService();
        }
        return RoutingService.instance;
    }

    public async generateMessageLogin(
        walletAddress: string,
        chainId: ChainId,
    ): Promise<GenerateMessageLoginResponse> {
        return await starknetService.generateMessageLogin(walletAddress, chainId);
    }

    public async verifySignature(
        typedData: starknet.TypedData,
        signature: starknet.Signature,
        token: string,
    ): Promise<VerifySignatureResponse> {
        return await starknetService.verifySignature(typedData, signature, token);
    }
}

const routingService: RoutingService = RoutingService.getInstance(); // singleton

export {
    routingService,
}
