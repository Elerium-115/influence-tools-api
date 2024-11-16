import axios, {AxiosInstance} from 'axios';
import esb from 'elastic-builder';
import {CrewData} from '../types.js';
import cache from '../cache.js';
import utils from '../utils.js';
import {playerByAddress} from '../../data/player-by-address.js';

/**
 * Provider:
 * https://github.com/influenceth/sdk
 */

const INFLUENCE_API_URL = 'https://api.influenceth.io';

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

    public static getInstance(): ProviderInfluenceth {
        if (!ProviderInfluenceth.instance) {
            ProviderInfluenceth.instance = new ProviderInfluenceth();
        }
        return ProviderInfluenceth.instance;
    }

    private async getAxiosInstance(): Promise<AxiosInstance> {
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

    public async fetchAccessToken(clientId: string, clientKey: string): Promise<string|null> {
        try {
            // NOT using "getAxiosInstance" b/c that requires the access token to already be loaded
            const axiosInstance = axios.create({baseURL: INFLUENCE_API_URL});
            const data = {
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientKey,
            };
            // In case of error "unsupported_grant_type" => try to also set header "Content-Type: application/json"
            const response = await axiosInstance.post('/v1/auth/token', data);
            // console.log(`--- [fetchAccessToken] response.data KEYS:`, Object.keys(response.data)); //// TEST
            return response.data.access_token;
        } catch (error: any) {
            console.log(`--- [fetchAccessToken] ERROR:`, error); //// TEST
            return null;
        }
    }

    private parseCrewData(rawData: any): CrewData {
        // console.log(`--- [parseCrewData] rawData:`, rawData); //// TEST
        const crewId: string = rawData.id;
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

    private parseCrewsData(rawData: any): any {
        const parsedCrewDataById: {[key: string]: CrewData} = {};
        try {
            for (const crewDataRaw of rawData.hits.hits) {
                const crewData = crewDataRaw._source;
                const parsedCrewData = this.parseCrewData(crewData);
                parsedCrewDataById[crewData.id] = parsedCrewData;
                cache.crewsDataById[crewData.id] = parsedCrewData;
            }
        } catch (error: any) {
            console.log(`--- [parseCrewsData] ERROR:`, error); //// TEST
        }
        return parsedCrewDataById;
    }

    public async fetchCrewsDataByIds(crewsIds: string[]): Promise<any> {
        // console.log(`--- [fetchCrewsDataByIds] crewsIds:`, crewsIds); //// TEST
        try {
            const axiosInstance = await this.getAxiosInstance();
            const query = esb.boolQuery()
                .filter(
                    esb.termsQuery('id', crewsIds), // search by list of crew IDs
                );
            const requestBody = esb.requestBodySearch()
                .query(query)
                .size(crewsIds.length);
            const response = await axiosInstance.post('/_search/crew', requestBody.toJSON());
            const rawData = response.data;
            // console.log(`--- [fetchCrewsDataByIds] rawData KEYS:`, Object.keys(rawData)); //// TEST
            return this.parseCrewsData(rawData);
        } catch (error: any) {
            console.log(`--- [fetchCrewsDataByIds] ERROR:`, error); //// TEST
            return {error};
        }
    }
}

const providerInfluenceth: ProviderInfluenceth = ProviderInfluenceth.getInstance(); // singleton

export {
    providerInfluenceth,
}
