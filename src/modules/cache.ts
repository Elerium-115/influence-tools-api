import {CrewData} from './types.js';

// Add more providers here => 'influenceth'|'otherprovider'
export type AccessTokensKey = 'influenceth';

const accessTokens: {[key in AccessTokensKey]?: string|null} = {};

const asteroidsMetadataById: {[key: string]: Object} = {};

/**
 * NOTE: each key is a lowercase address
 */
const asteroidsPlanByAddress: {[key: string]: Object} = {};

const crewsDataById: {[key: string]: CrewData} = {};

const shipsDataById: {[key: string]: Object} = {};

const inventoriesDataByLabelAndId: {[key: string]: Object} = {
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

const productionPlanDataById: {[key: string]: Object} = {};

export default {
    accessTokens,
    asteroidsMetadataById,
    asteroidsPlanByAddress,
    crewsDataById,
    inventoriesDataByLabelAndId,
    ownedAsteroidsIdsByAddress,
    productionPlanDataById,
    shipsDataById,
}

//// TO DO: expire "asteroidsMetadataById" for a given asteroid if older than e.g. 1 day (in case the name changes)
//// -- similar to how "ownedAsteroidsIdsByAddress" is expired for a given address
//// -- do the same for ALL cached consts?
//// ____
