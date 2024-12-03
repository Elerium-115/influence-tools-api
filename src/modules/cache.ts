import {
    BuildingData,
    BuildingDataForEmptyLot,
    CrewData,
    LotData,
} from './types.js';
import {ChainId} from './starknet-service.js';

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

export default {
    accessTokens,
    asteroidsMetadataById,
    asteroidsPlanByAddress,
    buildingsDataByChainAndLotId,
    crewsDataByChainAndId,
    inventoriesDataByLabelAndId,
    lotsDataByChainAndId,
    ownedAsteroidsIdsByAddress,
    productionPlanDataById,
    shipsDataById,
}

//// TO DO: expire "asteroidsMetadataById" for a given asteroid if older than e.g. 1 day (in case the name changes)
//// -- similar to how "ownedAsteroidsIdsByAddress" is expired for a given address
//// -- do the same for ALL cached consts?
//// ____
