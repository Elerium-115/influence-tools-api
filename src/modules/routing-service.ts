import * as starknet from 'starknet';
import {
    BuildingData,
    BuildingsDataList,
    BuildingsDataListResponse,
    CrewData,
    CrewDataByIdResponse,
    LotData,
    LotDataByIdResponse,
    ShipData,
    ShipDataByIdResponse,
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

    public async handlePostCrewsData(
        chainId: ChainId,
        crewsIds: string[],
    ): Promise<CrewDataByIdResponse> {
        // Fetch data only for IDs without a FRESH cache
        const cachedData = cache.crewsDataByChainAndId[chainId];
        const cachedIds = Object.keys(cachedData)
            .filter(crewId => cache.isFreshCache(cachedData[crewId], cache.MS.HOUR));
        const nonCachedIds = crewsIds.filter(id => !cachedIds.includes(id));
        if (nonCachedIds.length) {
            const data = await providerInfluenceth.fetchCrewsData(chainId, nonCachedIds);
            if (data.error) {
                return {
                    status: 500,
                    success: false,
                    error: data.error,
                };
            }
        }
        // At this point, the data for all IDs should be cached
        const finalData: {[key: string]: CrewData} = {};
        crewsIds.forEach(crewId => {
            finalData[crewId] = cache.crewsDataByChainAndId[chainId][crewId];
        });
        return {
            status: 200,
            success: true,
            data: finalData,
        };
    }

    public async handlePostLotsData(
        chainId: ChainId,
        lotsIds: string[],
    ): Promise<LotDataByIdResponse> {
        // Fetch data only for IDs without a FRESH cache
        const cachedData = cache.lotsDataByChainAndId[chainId];
        const cachedIds = Object.keys(cachedData)
            .filter(lotId => cache.isFreshCache(cachedData[lotId], cache.MS.MINUTE));
        const nonCachedIds = lotsIds.filter(id => !cachedIds.includes(id));
        if (nonCachedIds.length) {
            const data = await providerInfluenceth.fetchLotsData(chainId, nonCachedIds);
            if (data.error) {
                return {
                    status: 500,
                    success: false,
                    error: data.error,
                };
            }
        }
        // At this point, the data for all IDs should be cached
        const finalData: {[key: string]: LotData} = {};
        lotsIds.forEach(lotId => {
            finalData[lotId] = cache.lotsDataByChainAndId[chainId][lotId];
        });
        return {
            status: 200,
            success: true,
            data: finalData,
        };
    }

    public async handlePostBuildingsDataControlled(
        chainId: ChainId,
        address: string,
    ): Promise<BuildingsDataListResponse> {
        // Fetch data only for address without a FRESH cache
        const cachedData = cache.buildingsDataControlledByChainAndAddress[chainId][address];
        if (!cache.isFreshCache(cachedData, cache.MS.HOUR)) {
            const data = await providerInfluenceth.fetchBuildingsDataControlled(chainId, address);
            if ((data as any).error) {
                return {
                    status: 500,
                    success: false,
                    error: (data as any).error,
                };
            }
            const buildingsDataList: BuildingsDataList = {
                buildingsData: data as BuildingData[],
                _timestamp: Date.now(),
            };
            cache.buildingsDataControlledByChainAndAddress[chainId][address] = buildingsDataList;
        }
        // At this point, the data for address should be cached
        const finalData = cache.buildingsDataControlledByChainAndAddress[chainId][address];
        return {
            status: 200,
            success: true,
            data: finalData,
        };
    }

    public async handlePostShipsData(
        chainId: ChainId,
        shipsIds: string[],
    ): Promise<ShipDataByIdResponse> {
        // Fetch data only for IDs without a FRESH cache
        const cachedData = cache.shipsDataByChainAndId[chainId];
        const cachedIds = Object.keys(cachedData)
            .filter(shipId => cache.isFreshCache(cachedData[shipId], cache.MS.HOUR));
        const nonCachedIds = shipsIds.filter(id => !cachedIds.includes(id));
        if (nonCachedIds.length) {
            const data = await providerInfluenceth.fetchShipsData(chainId, nonCachedIds);
            if (data.error) {
                return {
                    status: 500,
                    success: false,
                    error: data.error,
                };
            }
        }
        // At this point, the data for all IDs should be cached
        const finalData: {[key: string]: ShipData} = {};
        shipsIds.forEach(shipId => {
            finalData[shipId] = cache.shipsDataByChainAndId[chainId][shipId];
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
