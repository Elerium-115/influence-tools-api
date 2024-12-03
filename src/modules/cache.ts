import {
    BuildingData,
    BuildingDataForEmptyLot,
    CrewData,
    LotData,
} from './types.js';
import {ChainId} from './starknet-service.js';

const MS: {[key: string]: number} = {};
MS.SECOND = 1000;
MS.MINUTE = 60 * MS.SECOND;
MS.HOUR = 60 * MS.MINUTE;
MS.DAY = 24 * MS.HOUR;
MS.WEEK = 7 * MS.DAY;
MS.MONTH = 30 * MS.DAY;
MS.YEAR = 365 * MS.DAY;

// Add more providers here => 'influenceth'|...|'otherprovider'
export type AccessTokensKey = 'influenceth'|'influenceth-prerelease';

const accessTokens: {[key in AccessTokensKey]?: string|null} = {};

const asteroidsMetadataById: {[key: string]: any} = {};

/**
 * NOTE: each key is a lowercase address
 */
const asteroidsPlanByAddress: {[key: string]: any} = {};

const crewsDataByChainAndId: {[key in ChainId]: {[key: string]: CrewData}} = {
    'SN_MAIN': {},
    'SN_SEPOLIA': {},
};

const lotsDataByChainAndId: {[key in ChainId]: {[key: string]: LotData}} = {
    'SN_MAIN': {},
    'SN_SEPOLIA': {},
};

const buildingsDataByChainAndLotId: {[key in ChainId]: {[key: string]: BuildingData|BuildingDataForEmptyLot}} = {
    'SN_MAIN': {},
    'SN_SEPOLIA': {},
};

const shipsDataById: {[key: string]: any} = {};

const inventoriesDataByLabelAndId: {[key: string]: any} = {
    5: {}, // buildings
    6: {}, // ships
};

interface OwnedAsteroidsIdsByAddress {
    asteroidsIds: number[],
    date: number, // timestamp
}

/**
 * NOTE: each key is a lowercase address
 */
const ownedAsteroidsIdsByAddress: {[key: string]: OwnedAsteroidsIdsByAddress} = {};

const productionPlanDataById: {[key: string]: any} = {};

function isFreshCache(data: any, cacheExpiresInMilliseconds: number): boolean {
    if (!data || !data._timestamp) {
        return false;
    }
    return Date.now() - data._timestamp < cacheExpiresInMilliseconds;
}

export default {
    MS,
    accessTokens,
    asteroidsMetadataById,
    asteroidsPlanByAddress,
    buildingsDataByChainAndLotId,
    crewsDataByChainAndId,
    inventoriesDataByLabelAndId,
    isFreshCache,
    lotsDataByChainAndId,
    ownedAsteroidsIdsByAddress,
    productionPlanDataById,
    shipsDataById,
}

//// TO DO: expire "asteroidsMetadataById" for a given asteroid if older than e.g. 1 day (in case the name changes)
//// -- similar to how "ownedAsteroidsIdsByAddress" is expired for a given address
//// -- do the same for ALL cached consts?
//// ____
