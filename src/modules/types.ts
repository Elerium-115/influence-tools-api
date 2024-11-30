// label = 1
interface CrewData {
    _raw?: any,
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
    lotId: string,
    buildingData: BuildingData|null, // null for Empty Lot
}

interface LotDataByIdResponse extends StandardResponse {
    data?: {[key: string]: LotData},
}

// label = 5
interface BuildingData {
    _raw?: any,
    buildingId: string,
    buildingDetails: any,
    buildingName: string|null,
    crewName: string|null,
    lotId: string,
    dryDocks: any[],
    extractors: any[],
    processors: any[],
}

interface StandardResponse {
    status: number,
    success: boolean,
    data?: any, // if "success" TRUE
    error?: string, // if "success" FALSE
}

export {
    BuildingData,
    CrewData,
    CrewDataByIdResponse,
    LotData,
    LotDataByIdResponse,
    StandardResponse,
}
