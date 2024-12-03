import axios, {AxiosInstance} from 'axios';
import esb from 'elastic-builder';
// import * as InfluenceSDK from '@influenceth/sdk'; //// TO DO: enable if / when needed
import {
    BuildingData,
    BuildingDataForEmptyLot,
    CrewData,
    LotData,
} from '../types.js';
import cache from '../cache.js';
import utils from '../utils.js';
import {ChainId} from '../starknet-service.js';
import {playerByAddress} from '../../data/player-by-address.js';

/**
 * Provider:
 * https://github.com/influenceth/sdk
 * 
 * Labels:
 * https://github.com/influenceth/sdk/blob/master/src/lib/entity.js
 * 
 * Search indexes:
 * https://github.com/jisensee/influence-typed-sdk/blob/main/src/api/search.ts
 * 
 * Sample complex elastic search:
 * https://discord.com/channels/814990637178290177/833489140703952907/1266516969314844713
 */

const INFLUENCE_API_URL = 'https://api.influenceth.io';
const INFLUENCE_API_URL_SEPOLIA = 'https://api-prerelease.influenceth.io';

const ETHEREUM_ADDRESS_LENGTH = 42;
const SWAY_PER_LOT = 6922;

const BONUS_TYPE_PRETTY = {
    fissile: 'Fissiles',
    metal: 'Metals',
    organic: 'Organics',
    rareearth: 'Rare-Earth',
    volatile: 'Volatiles',
    yield: 'Yield',
};

/**
 * Singleton
 */
class ProviderInfluenceth {
    private static instance: ProviderInfluenceth;

    private axiosInstance: AxiosInstance|null = null;
    private axiosInstanceSepolia: AxiosInstance|null = null;

    public static getInstance(): ProviderInfluenceth {
        if (!ProviderInfluenceth.instance) {
            ProviderInfluenceth.instance = new ProviderInfluenceth();
        }
        return ProviderInfluenceth.instance;
    }

    private async getAxiosInstance(chainId: ChainId): Promise<AxiosInstance> {
        switch (chainId) {
            case 'SN_SEPOLIA':
                if (!this.axiosInstanceSepolia) {
                    const token = await utils.loadAccessToken('influenceth-prerelease');
                    this.axiosInstanceSepolia = axios.create({
                        baseURL: INFLUENCE_API_URL_SEPOLIA,
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                }
                return this.axiosInstanceSepolia;
            case 'SN_MAIN':
            default:
                if (!this.axiosInstance) {
                    const token = await utils.loadAccessToken('influenceth');
                    this.axiosInstance = axios.create({
                        baseURL: INFLUENCE_API_URL,
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                }
                return this.axiosInstance;
        }
    }

    public async fetchAccessToken(
        chainId: ChainId,
        clientId: string,
        clientKey: string,
    ): Promise<string|null> {
        try {
            // NOT using "getAxiosInstance" b/c that requires the access token to already be loaded
            const baseURL = chainId === 'SN_SEPOLIA' ? INFLUENCE_API_URL_SEPOLIA : INFLUENCE_API_URL;
            const axiosInstance = axios.create({baseURL});
            const data = {
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientKey,
            };
            // In case of error "unsupported_grant_type" => try to also set header "Content-Type: application/json"
            const response = await axiosInstance.post('/v1/auth/token', data);
            return response.data.access_token;
        } catch (error: any) {
            console.log(`--- [fetchAccessToken] ERROR:`, error); //// TEST
            return null;
        }
    }

    // Crews -- START
    private parseCrewData(rawData: any): CrewData {
        // console.log(`--- [parseCrewData] rawData:`, rawData); //// TEST
        const crewId: string = rawData.id.toString();
        const delegatedToAddress: string = rawData.Crew.delegatedTo;
        const ownerAddress: string = rawData.Nft.owners.ethereum ? rawData.Nft.owners.ethereum : rawData.Nft.owners.starknet;
        const metadata: CrewData = {
            // _raw: rawData, //// TEST
            crewId,
            delegatedToAddress,
            delegatedToName: playerByAddress[delegatedToAddress.toLowerCase()] || null,
            ownerAddress,
            ownerName: playerByAddress[ownerAddress.toLowerCase()] || null,
        };
        // console.log(`---> [parseCrewData] metadata:`, metadata); //// TEST
        return metadata;
    }

    private parseCrewsData(
        chainId: ChainId,
        rawData: any,
    ): any {
        const parsedCrewDataById: {[key: string]: CrewData} = {};
        try {
            for (const crewDataRaw of rawData.hits.hits) {
                const crewData = crewDataRaw._source;
                const parsedCrewData = this.parseCrewData(crewData);
                parsedCrewData._timestamp = Date.now();
                parsedCrewDataById[crewData.id] = parsedCrewData;
                cache.crewsDataByChainAndId[chainId][crewData.id] = parsedCrewData;
            }
        } catch (error: any) {
            console.log(`--- [parseCrewsData] ERROR:`, error); //// TEST
        }
        return parsedCrewDataById;
    }

    public async fetchCrewsData(
        chainId: ChainId,
        crewsIds: string[],
    ): Promise<any> {
        try {
            const axiosInstance = await this.getAxiosInstance(chainId);
            const query = esb.boolQuery()
                .filter(
                    esb.termsQuery('id', crewsIds), // search by list of crew IDs
                );
            const requestBody = esb.requestBodySearch()
                .query(query)
                .size(crewsIds.length);
            const response = await axiosInstance.post('/_search/crew', requestBody.toJSON());
            const rawData = response.data;
            return this.parseCrewsData(chainId, rawData);
        } catch (error: any) {
            console.log(`--- [fetchCrewsData] ERROR:`, error); //// TEST
            return {error};
        }
    }
    // Crews -- END

    // Lots -- START
    private parseLotData(
        chainId: ChainId,
        rawData: any,
    ): LotData {
        // console.log(`--- [parseLotData] rawData:`, rawData); //// TEST
        const lotId: string = rawData.id.toString();
        const buildingData: BuildingData|BuildingDataForEmptyLot = cache.buildingsDataByChainAndLotId[chainId][lotId];
        const metadata: LotData = {
            // _raw: rawData, //// TEST
            lotId,
            buildingData,
        };
        // console.log(`---> [parseLotData] metadata:`, metadata); //// TEST
        return metadata;
    }

    private parseLotsData(
        chainId: ChainId,
        rawData: any,
        lotsIdsRequested: string[],
    ): any {
        const parsedLotsDataById: {[key: string]: LotData} = {};
        try {
            const lotsIdsWithLotData: string[] = [];
            for (const lotDataRaw of rawData.hits.hits) {
                const lotData = lotDataRaw._source;
                const parsedLotData = this.parseLotData(chainId, lotData);
                parsedLotData._timestamp = Date.now();
                const lotId = parsedLotData.lotId; // NOT using "lotData.id" re: type mismatch
                parsedLotsDataById[lotId] = parsedLotData;
                cache.lotsDataByChainAndId[chainId][lotId] = parsedLotData;
                lotsIdsWithLotData.push(lotId);
            }
            // Any lots for which NO lot data was received are assumed as Empty Lots
            lotsIdsRequested.filter(lotId => !lotsIdsWithLotData.includes(lotId))
                .forEach(emptyLotId => {
                    const buildingDataForEmptyLot: BuildingDataForEmptyLot = {
                        _timestamp: Date.now(),
                        lotId: emptyLotId,
                        isEmptyLot: true,
                    };
                    const emptyLotData: LotData = {
                        _timestamp: Date.now(),
                        lotId: emptyLotId,
                        buildingData: buildingDataForEmptyLot,
                    };
                    parsedLotsDataById[emptyLotId] = emptyLotData;
                    cache.lotsDataByChainAndId[chainId][emptyLotId] = emptyLotData;
                });
        } catch (error: any) {
            console.log(`--- [parseLotsData] ERROR:`, error); //// TEST
        }
        return parsedLotsDataById;
    }

    public async fetchLotsData(
        chainId: ChainId,
        lotsIds: string[],
    ): Promise<any> {
        /**
         * FIRST: fetch + cache the buildings data for "lotsIds" (if any).
         * 
         * NOTE: NOT using any previously cached data for buildings here,
         * b/c any query for new lots-data also needs to trigger
         * a query for new buildings-data associated with those lots.
         */
        try {
            await this.fetchBuildingsDataByLotsIds(chainId, lotsIds);
        } catch (error: any) {
            console.log(`--- [fetchLotsData] buildings ERROR:`, error); //// TEST
            // NO buildings data will be available when parsing the lots data (unless previously cached)
        }
        // THEN: fetch the lots data for "lotsIds"
        try {
            const axiosInstance = await this.getAxiosInstance(chainId);
            const query = esb.boolQuery()
                .filter(
                    esb.termsQuery('id', lotsIds.map(id => Number(id))), // search by list of lot IDs
                );
            const requestBody = esb.requestBodySearch()
                .query(query)
                .size(lotsIds.length);
            const response = await axiosInstance.post('/_search/lot', requestBody.toJSON());
            const rawData = response.data;
            return this.parseLotsData(chainId, rawData, lotsIds);
        } catch (error: any) {
            console.log(`--- [fetchLotsData] lots ERROR:`, error); //// TEST
            return {error};
        }
    }
    // Lots -- END

    // Buildings -- START
    private parseBuildingData(rawData: any): BuildingData {
        // console.log(`--- [parseBuildingData] rawData:`, rawData); //// TEST
        const buildingId: string = rawData.id.toString();
        const buildingDetails: any = rawData.Building;
        const buildingName: string|null = rawData.Name?.name || null;
        const crewName: string|null = rawData.meta.crew?.name || null;
        const lotId: string = rawData.Location.location.id.toString();
        const dryDocks: any[] = rawData.DryDocks;
        const extractors: any[] = rawData.Extractors;
        const processors: any[] = rawData.Processors;
        const metadata: BuildingData = {
            // _raw: rawData, //// TEST
            buildingId,
            buildingDetails,
            buildingName,
            crewName,
            lotId,
            dryDocks,
            extractors,
            processors,
            isEmptyLot: false,
        };
        // console.log(`---> [parseBuildingData] metadata:`, metadata); //// TEST
        return metadata;
    }

    private parseBuildingsData(
        chainId: ChainId,
        rawData: any,
        lotsIdsRequested: string[],
    ): void {
        try {
            const lotsIdsWithBuildingData: string[] = [];
            for (const buildingDataRaw of rawData.hits.hits) {
                const buildingData = buildingDataRaw._source;
                const parsedBuildingData = this.parseBuildingData(buildingData);
                parsedBuildingData._timestamp = Date.now();
                const lotId = parsedBuildingData.lotId;
                cache.buildingsDataByChainAndLotId[chainId][lotId] = parsedBuildingData;
                lotsIdsWithBuildingData.push(lotId);
            }
            // Any lots for which NO building data was received are assumed as Empty Lots
            lotsIdsRequested.filter(lotId => !lotsIdsWithBuildingData.includes(lotId))
                .forEach(emptyLotId => {
                    const buildingDataForEmptyLot: BuildingDataForEmptyLot = {
                        _timestamp: Date.now(),
                        lotId: emptyLotId,
                        isEmptyLot: true,
                    };
                    cache.buildingsDataByChainAndLotId[chainId][emptyLotId] = buildingDataForEmptyLot;
                });
        } catch (error: any) {
            console.log(`--- [parseBuildingsData] ERROR:`, error); //// TEST
        }
    }

    public async fetchBuildingsDataByLotsIds(
        chainId: ChainId,
        lotsIds: string[],
    ): Promise<any> {
        try {
            const axiosInstance = await this.getAxiosInstance(chainId);
            const query = esb.boolQuery()
                .mustNot(
                    esb.termQuery('Building.status', 0), // exclude "unplanned" buildings
                )
                .filter(
                    esb.termsQuery('Location.location.id', lotsIds.map(id => Number(id))), // search by list of lot IDs
                );
            const requestBody = esb.requestBodySearch()
                .query(query)
                .size(lotsIds.length);
            const response = await axiosInstance.post('/_search/building', requestBody.toJSON());
            const rawData = response.data;
            return this.parseBuildingsData(chainId, rawData, lotsIds);
        } catch (error: any) {
            console.log(`--- [fetchBuildingsDataByLotsIds] ERROR:`, error); //// TEST
            return {error};
        }
    }
    // Buildings -- END
}

const providerInfluenceth: ProviderInfluenceth = ProviderInfluenceth.getInstance(); // singleton

export {
    providerInfluenceth,
}
