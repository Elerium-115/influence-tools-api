interface StandardResponse {
    status: number,
    success: boolean,
    data?: any, // if "success" TRUE
    error?: string, // if "success" FALSE
}

// label = 1
interface CrewData {
    _raw?: any,
    _timestamp?: number,
    crewId: string,
    delegatedToAddress: string,
    delegatedToName: string|null,
    ownerAddress: string,
    ownerName: string|null,
}

interface CrewDataByIdResponse extends StandardResponse {
    data?: {[key: string]: CrewData},
}

interface CrewsIdsData {
    _timestamp?: number,
    crewsIds: number [],
}

// label = 4
interface LotData {
    _raw?: any,
    _timestamp?: number,
    lotId: string,
    buildingData: BuildingData|BuildingDataForEmptyLot,
}

interface LotDataByIdResponse extends StandardResponse {
    data?: {[key: string]: LotData},
}

// label = 5
interface BuildingData {
    _raw?: any,
    _timestamp?: number,
    buildingId: string,
    buildingDetails: any,
    buildingName: string|null,
    crewName: string|null,
    lotId: string,
    dryDocks: any[],
    extractors: any[],
    processors: any[],
    isEmptyLot: false,
}

interface BuildingDataForEmptyLot {
    _timestamp?: number,
    lotId: string,
    isEmptyLot: true,
}

interface BuildingsDataList {
    _timestamp?: number,
    buildingsData: BuildingData[],
}

interface BuildingsDataListResponse extends StandardResponse {
    data?: BuildingsDataList,
}

// label = 6
interface ShipData {
    _raw?: any,
    _timestamp?: number,
    shipId: string,
    shipType: number,
}

interface ShipDataByIdResponse extends StandardResponse {
    data?: {[key: string]: ShipData},
}

export {
    BuildingData,
    BuildingDataForEmptyLot,
    BuildingsDataList,
    BuildingsDataListResponse,
    CrewData,
    CrewDataByIdResponse,
    CrewsIdsData,
    LotData,
    LotDataByIdResponse,
    ShipData,
    ShipDataByIdResponse,
    StandardResponse,
}
