// apps/web-ui/src/types/transport.ts

export interface TransportStopStudent {
  studentId: string;
  firstName?: string;
  lastName?: string;
  class?: string;
  className?: string;
  section?: string;
  sectionName?: string;
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  profileImage?: string;
}

export interface TransportStop {
  stopId: string;
  name: string;
  latitude: number;
  longitude: number;
  order: number;
  pickupTime?: string;
  dropTime?: string;
  students?: TransportStopStudent[];
  coordinates?: [number, number]; // Temporary for UI compatibility [lng, lat]
}

export interface TransportDriver {
  name: string;
  phone: string;
  licenseNumber: string; // Required by backend
  profileImage?: string;
}

export interface TransportRoute {
  _id: string; // Internal MongoDB ID
  schoolId: string;
  routeId: string;
  routeName: string;
  routeNumber?: string;
  color?: string;
  busNumber?: string;
  vehicleNumber?: string; // Add for UI compatibility if needed, though schema uses busNumber
  driver?: TransportDriver;
  driverName?: string; // Add for UI compatibility
  driverPhone?: string; // Add for UI compatibility
  stops: TransportStop[];
  routeCoordinates?: number[][]; // array of [lat, lng]
  currentLocation?: {
    latitude?: number;
    longitude?: number;
    lastUpdated?: string; // ISO date string
    speed?: number;
    heading?: number;
  };
  status?: 'active' | 'inactive';
  totalStudents?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTransportRoutePayload {
  routeId: string; // Required by backend
  routeName: string;
  routeNumber?: string;
  busNumber?: string;
  vehicleNumber?: string; // UI sends this
  driverName?: string; // UI sends this
  driverPhone?: string; // UI sends this
  licenseNumber?: string; // UI sends this (temporary flat property)
  driver?: Partial<TransportDriver>;
  stops: Partial<TransportStop>[];
  status?: 'active' | 'inactive';
}
