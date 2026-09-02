/**
 * Shared types for the IoT / Emergency domain.
 */

/** Vital signs reported by an IoT device */
export interface IotVitals {
  heartbeat: number;
  movement: boolean;
  jerkyMovement: boolean;
  latitude: number;
  longitude: number;
}

/** Payload sent by an IoT device to the server */
export interface IotDataPayload {
  deviceId: string;
  heartbeat: number;
  movement: boolean;
  jerkyMovement: boolean;
  latitude: number;
  longitude: number;
}

/** Data required to register a new user + IoT device */
export interface IotRegisterData {
  email: string;
  name: string;
  phone?: string;
  password: string;
  iotDeviceId: string;
  emergencyContact?: string;
}

/** Raw IoT log document shape */
export interface IIotLog {
  _id: string;
  deviceId: string;
  userId?: string;
  heartbeat: number;
  movement: boolean;
  jerkyMovement: boolean;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

/** Raw emergency alert document shape */
export interface IEmergencyAlert {
  _id: string;
  userId: string;
  hospitalId: string;
  detectionMethod: "IOT_DEVICE" | "MANUAL";
  heartbeat: number;
  movement: boolean;
  jerkyMovement: boolean;
  userLatitude: number;
  userLongitude: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
