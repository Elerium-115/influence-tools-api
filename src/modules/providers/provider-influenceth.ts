import axios, {AxiosInstance} from 'axios';
import esb from 'elastic-builder';
// import * as InfluenceSDK from '@influenceth/sdk'; //// TO DO: enable if / when needed
import {
    BuildingData,
    BuildingDataForEmptyLot,
    CrewData,
    CrewsIdsData,
    LotData,
    ShipData,
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

const ELASTIC_SEARCH_SIZE_MAX = 1000;

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
    ): {[key: string]: CrewData} {
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
    ): Promise<{[key: string]: CrewData}|{error: any}> {
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

    private parseCrewsIds(
        chainId: ChainId,
        address: string,
        rawData: any,
    ): CrewsIdsData {
        const parsedCrewsId: number[] = [];
        try {
            for (const crewDataRaw of rawData.hits.hits) {
                const crewData = crewDataRaw._source;
                parsedCrewsId.push(crewData.id as number);
            }
        } catch (error: any) {
            console.log(`--- [parseCrewsIds] ERROR:`, error); //// TEST
        }
        const crewsIdsData: CrewsIdsData = {
            crewsIds: parsedCrewsId,
            _timestamp: Date.now(),
        };
        cache.crewsIdsControlledByChainAndAddress[chainId][address] = crewsIdsData;
        return crewsIdsData;
    }

    public async fetchCrewsIdsControlled(
        chainId: ChainId,
        address: string,
    ): Promise<CrewsIdsData|{error: any}> {
        try {
            const axiosInstance = await this.getAxiosInstance(chainId);
            const query = esb.boolQuery()
                .filter(
                    esb.termQuery('Crew.delegatedTo', address), // search by controller address
                );
            const requestBody = esb.requestBodySearch()
                .query(query)
                .size(ELASTIC_SEARCH_SIZE_MAX);
            const response = await axiosInstance.post('/_search/crew', requestBody.toJSON());
            const rawData = response.data;
            return this.parseCrewsIds(chainId, address, rawData);
        } catch (error: any) {
            console.log(`--- [fetchCrewsIdsControlled] ERROR:`, error); //// TEST
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
    ): {[key: string]: LotData} {
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
    ): Promise<{[key: string]: LotData}|{error: any}> {
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
        const buildingName: string = rawData.Name?.name || '';
        const crewName: string = rawData.meta.crew?.name || '';
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

    private async parseBuildingsData(
        chainId: ChainId,
        rawData: any,
        lotsIdsRequested: string[] = [],
    ): Promise<BuildingData[]> {
        const buildingsData: BuildingData[] = [];
        try {
            const lotsIdsWithBuildingData: string[] = [];
            for (const buildingDataRaw of rawData.hits.hits) {
                const buildingData = buildingDataRaw._source;
                const parsedBuildingData = this.parseBuildingData(buildingData);
                parsedBuildingData._timestamp = Date.now();
                const lotId = parsedBuildingData.lotId;
                cache.buildingsDataByChainAndLotId[chainId][lotId] = parsedBuildingData;
                lotsIdsWithBuildingData.push(lotId);
                buildingsData.push(parsedBuildingData);
            }
            await this.injectShipTypesIntoBuildingsData(chainId, buildingsData);
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
        /**
         * NOT setting "cache.buildingsDataControlledByChainAndAddress" here,
         * b/c this parser is called from functionally-different contexts.
         */
        return buildingsData;
    }

    public async fetchBuildingsDataByLotsIds(
        chainId: ChainId,
        lotsIds: string[],
    ): Promise<BuildingData[]|{error: any}> {
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
            return await this.parseBuildingsData(chainId, rawData, lotsIds);
        } catch (error: any) {
            console.log(`--- [fetchBuildingsDataByLotsIds] ERROR:`, error); //// TEST
            return {error};
        }
    }

    public async fetchBuildingsDataControlled(
        chainId: ChainId,
        address: string,
    ): Promise<BuildingData[]|{error: any}> {
        /**
         * FIRST: fetch + cache the crews IDs controlled by address (if any).
         * 
         * NOTE: Fetch data only for address without a FRESH cache.
         */
        const cachedData = cache.crewsIdsControlledByChainAndAddress[chainId][address];
        if (!cache.isFreshCache(cachedData, cache.MS.HOUR)) {
            try {
                await this.fetchCrewsIdsControlled(chainId, address);
            } catch (error: any) {
                console.log(`--- [fetchBuildingsDataControlled] crews ERROR:`, error); //// TEST
                return {error};
            }
        }
        // At this point, the list of controlled crews IDs should be cached
        const crewsIdsControlled = cache.crewsIdsControlledByChainAndAddress[chainId][address]?.crewsIds || [];
        if (!crewsIdsControlled || !crewsIdsControlled.length) {
            return [];
        }
        // THEN: fetch the buildings data for buildings controlled by [crews controlled by] address
        try {
            const axiosInstance = await this.getAxiosInstance(chainId);
            const query = esb.boolQuery()
                .mustNot(
                    esb.termQuery('Building.status', 0), // exclude "unplanned" buildings
                )
                .must(
                    esb.termQuery('Control.controller.label', 1) // controller must be a crew
                )
                .filter(
                    esb.termsQuery('Control.controller.id', crewsIdsControlled), // search by list of crews IDs
                );
            const requestBody = esb.requestBodySearch()
                .query(query)
                .size(ELASTIC_SEARCH_SIZE_MAX);
            const response = await axiosInstance.post('/_search/building', requestBody.toJSON());
            const rawData = response.data;
            return await this.parseBuildingsData(chainId, rawData);
        } catch (error: any) {
            console.log(`--- [fetchBuildingsDataControlled] buildings ERROR:`, error); //// TEST
            return {error};
        }
    }
    // Buildings -- END

    // Ships -- START
    private parseShipData(rawData: any): ShipData {
        // console.log(`--- [parseShipData] rawData:`, rawData); //// TEST
        const shipId: string = rawData.id.toString();
        const shipType: number = rawData.Ship.shipType;
        const metadata: ShipData = {
            // _raw: rawData, //// TEST
            shipId,
            shipType,
        };
        // console.log(`---> [parseShipData] metadata:`, metadata); //// TEST
        return metadata;
    }

    private parseShipsData(
        chainId: ChainId,
        rawData: any,
    ): {[key: string]: ShipData} {
        const parsedShipDataById: {[key: string]: ShipData} = {};
        try {
            for (const shipDataRaw of rawData.hits.hits) {
                const shipData = shipDataRaw._source;
                const parsedShipData = this.parseShipData(shipData);
                parsedShipData._timestamp = Date.now();
                parsedShipDataById[shipData.id] = parsedShipData;
                cache.shipsDataByChainAndId[chainId][shipData.id] = parsedShipData;
            }
        } catch (error: any) {
            console.log(`--- [parseShipsData] ERROR:`, error); //// TEST
        }
        return parsedShipDataById;
    }

    public async fetchShipsData(
        chainId: ChainId,
        shipsIds: string[],
    ): Promise<{[key: string]: ShipData}|{error: any}> {
        try {
            const axiosInstance = await this.getAxiosInstance(chainId);
            const query = esb.boolQuery()
                .filter(
                    esb.termsQuery('id', shipsIds), // search by list of ship IDs
                );
            const requestBody = esb.requestBodySearch()
                .query(query)
                .size(shipsIds.length);
            const response = await axiosInstance.post('/_search/ship', requestBody.toJSON());
            const rawData = response.data;
            return this.parseShipsData(chainId, rawData);
        } catch (error: any) {
            console.log(`--- [fetchShipsData] ERROR:`, error); //// TEST
            return {error};
        }
    }

    /**
     * Fetch and inject "shipType" into all "dryDocks" with an active ship integration
     */
    private async injectShipTypesIntoBuildingsData(
        chainId: ChainId,
        buildingsData: BuildingData[],
    ): Promise<void> {
        const shipsIds: number[] = buildingsData
            .filter(buildingData => buildingData.dryDocks?.length && buildingData.dryDocks[0].outputShip)
            .map(buildingData => buildingData.dryDocks[0].outputShip.id);
        // Fetch data only for IDs without a FRESH cache
        const cachedData = cache.shipsDataByChainAndId[chainId];
        const cachedIds = Object.keys(cachedData)
            .filter(shipId => cache.isFreshCache(cachedData[shipId], cache.MS.HOUR));
        const nonCachedIds = shipsIds.map(id => id.toString())
            .filter(idString => !cachedIds.includes(idString));
        if (nonCachedIds.length) {
            const data = await this.fetchShipsData(chainId, nonCachedIds);
            if (data.error) {
                console.log(`--- [injectIntegratingShipTypesIntoBuildingsData] ERROR:`, data.error); //// TEST
                return;
            }
        }
        // At this point, the data for all IDs should be cached
        shipsIds.forEach(shipId => {
            const shipType = cache.shipsDataByChainAndId[chainId][shipId].shipType;
            const buildingData = buildingsData
                .find(buildingData => buildingData.dryDocks?.length && buildingData.dryDocks[0].outputShip && buildingData.dryDocks[0].outputShip.id === shipId);
            if (buildingData) {
                buildingData.dryDocks[0].outputShip.type = shipType;
            }
        });
    }
    // Ships -- END
}

const providerInfluenceth: ProviderInfluenceth = ProviderInfluenceth.getInstance(); // singleton

export {
    providerInfluenceth,
}
