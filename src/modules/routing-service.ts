import * as starknet from 'starknet';
import {
    AuthedResponse,
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
        console.log(`--- [generateMessageLogin] args:`, arguments); //// TEST
        return await starknetService.generateMessageLogin(walletAddress, chainId);
    }

    public async verifySignature(
        typedData: starknet.TypedData,
        signature: starknet.Signature,
        token: string,
    ): Promise<VerifySignatureResponse> {
        console.log(`--- [verifySignature] args:`, arguments); //// TEST
        return await starknetService.verifySignature(typedData, signature, token);
    }

    public async authTest(
        data: any,
        token: string,
    ): Promise<AuthedResponse> {
        console.log(`--- [authTest] args:`, arguments); //// TEST
        return await starknetService.authTest(data, token);
    }
}

const routingService: RoutingService = RoutingService.getInstance(); // singleton

export {
    routingService,
}
