export interface Report {
    id: string;
    address: string;
    locationHierarchy: string;
    tweet: string;
    victimCount: number;
    status: string;
    region: string;
    district: string;
    neighborhood: string;
    phoneNumber: string;
    needs: string;
    isDroneValidated: boolean;
    coordinates: {
      latitude: string;
      longitude: string;
    };
  }