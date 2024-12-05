import {
    BuildingData,
    BuildingDataForEmptyLot,
    BuildingsDataList,
    CrewData,
    CrewsIdsData,
    LotData,
    ShipData,
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

const crewsDataByChainAndId: {[key in ChainId]: {[key: string]: CrewData}} = {
    'SN_MAIN': {},
    'SN_SEPOLIA': {},
};

/**
 * The list of crews IDs which are controlled by (as opposed to
 * owned by) each address. The address must be all lowercase.
 */
const crewsIdsControlledByChainAndAddress: {[key in ChainId]: {[key: string]: CrewsIdsData}} = {
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

/**
 * The buildings data for buildings controlled by [any of the crews
 * controlled by] each address. The address must be all lowercase.
 * 
 * NOTE: excluding empty lots.
 */
const buildingsDataControlledByChainAndAddress: {[key in ChainId]: {[key: string]: BuildingsDataList}} = {
    'SN_MAIN': {},
    'SN_SEPOLIA': {},
};

const shipsDataByChainAndId: {[key in ChainId]: {[key: string]: ShipData}} = {
    'SN_MAIN': {},
    'SN_SEPOLIA': {},
};

function isFreshCache(data: any, cacheExpiresInMilliseconds: number): boolean {
    if (!data || !data._timestamp) {
        return false;
    }
    return Date.now() - data._timestamp < cacheExpiresInMilliseconds;
}

export default {
    MS,
    accessTokens,
    buildingsDataByChainAndLotId,
    buildingsDataControlledByChainAndAddress,
    crewsDataByChainAndId,
    crewsIdsControlledByChainAndAddress,
    isFreshCache,
    lotsDataByChainAndId,
    shipsDataByChainAndId,
}
