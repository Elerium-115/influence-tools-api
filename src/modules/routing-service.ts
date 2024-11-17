import * as starknet from 'starknet';
import {
    CrewData,
    CrewDataByIdResponse,
    LotData,
    LotDataByIdResponse,
} from './types.js';
import cache from './cache.js';
import {
    ChainId,
    GenerateMessageLoginResponse,
    VerifySignatureResponse,
    starknetService,
} from './starknet-service.js';
import {providerInfluenceth} from './providers/provider-influenceth.js';

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

    public async handlePostCrewsDataByIds(crewsIds: string[]): Promise<CrewDataByIdResponse> {
        // Fetch data only for NON-cached IDs
        const cachedData = cache.crewsDataById;
        const cachedIds = Object.keys(cachedData);
        const nonCachedIds = crewsIds.filter(id => !cachedIds.includes(id));
        if (nonCachedIds.length) {
            const data = await providerInfluenceth.fetchCrewsDataByIds(nonCachedIds);
            if (data.error) {
                return {
                    status: 500,
                    success: false,
                    error: data.error,
                };
            }
        }
        /**
         * At this point, the data for all IDs should be cached,
         * via "fetchCrewsDataByIds" > "parseCrewsData".
         */
        const finalData: {[key: string]: CrewData} = {};
        crewsIds.forEach(crewId => {
            finalData[crewId] = cache.crewsDataById[crewId];
        });
        return {
            status: 200,
            success: true,
            data: finalData,
        };
    }

    public async handlePostLotsDataByIds(lotsIds: string[]): Promise<LotDataByIdResponse> {
        // Fetch data only for NON-cached IDs
        const cachedData = cache.lotsDataById;
        const cachedIds = Object.keys(cachedData);
        const nonCachedIds = lotsIds.filter(id => !cachedIds.includes(id));
        if (nonCachedIds.length) {
            const data = await providerInfluenceth.fetchLotsDataByIds(nonCachedIds);
            if (data.error) {
                return {
                    status: 500,
                    success: false,
                    error: data.error,
                };
            }
        }
        /**
         * At this point, the data for all IDs should be cached,
         * via "fetchLotsDataByIds" > "parseLotsData".
         */
        const finalData: {[key: string]: LotData} = {};
        lotsIds.forEach(lotId => {
            finalData[lotId] = cache.lotsDataById[lotId];
        });
        return {
            status: 200,
            success: true,
            data: finalData,
        };
    }
}

const routingService: RoutingService = RoutingService.getInstance(); // singleton

export {
    routingService,
}
