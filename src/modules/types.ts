// label = 1
interface CrewData {
    _raw?: any,
    crewId: string,
    delegatedToAddress: string,
    delegatedToName: string|null,
    ownerAddress: string,
    ownerName: string|null,
}

// label = 4
interface LotData {
    _raw?: any,
    lotId: string,
    buildingData: BuildingData,
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

export {
    BuildingData,
    CrewData,
    LotData,
}
