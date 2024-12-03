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

interface StandardResponse {
    status: number,
    success: boolean,
    data?: any, // if "success" TRUE
    error?: string, // if "success" FALSE
}

export {
    BuildingData,
    BuildingDataForEmptyLot,
    CrewData,
    CrewDataByIdResponse,
    LotData,
    LotDataByIdResponse,
    StandardResponse,
}
