


import mongoose, { Schema, model, models, Document } from "mongoose";

// --- Interfaces ---
export interface IotVitals {
  heartbeat: number;
  movement: boolean;
  jerkyMovement: boolean;
  latitude: number;
  longitude: number;
}

// --- Mongoose Schemas ---

// 1. Device Logs Schema
const IotLogSchema = new Schema({
  deviceId: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  heartbeat: Number,
  movement: Boolean,
  jerkyMovement: Boolean,
  latitude: Number,
  longitude: Number,
  timestamp: { type: Date, default: Date.now }
});

// 2. Emergency Alert Schema
const EmergencyAlertSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalId: String, // Or ObjectId if you have a Hospital model
  detectionMethod: { type: String, enum: ['IOT_DEVICE', 'MANUAL'] },
  heartbeat: Number,
  movement: Boolean,
  jerkyMovement: Boolean,
  userLatitude: Number,
  userLongitude: Number,
  status: { type: String, default: 'active' }
}, { timestamps: true });

// Register Models
export const IotLog = models.IotLog || model("IotLog", IotLogSchema);
export const EmergencyAlert = models.EmergencyAlert || model("EmergencyAlert", EmergencyAlertSchema);

// --- The Logic Class ---
export class IotDevice {
  // Log IoT data to MongoDB
  static async logDeviceData(
    deviceId: string,
    userId: string | null, // MongoDB uses string ObjectIds
    vitals: IotVitals
  ) {
    try {
      const newLog = new IotLog({
        deviceId,
        userId,
        ...vitals
      });
      return await newLog.save();
    } catch (error) {
      console.error('Error logging IoT data:', error);
      throw error;
    }
  }

  // Detect emergency condition (Logic remains the same!)
  static detectEmergency(vitals: IotVitals): boolean {
    const abnormalHeartbeat = vitals.heartbeat < 40 || vitals.heartbeat > 140;
    const noMovement = vitals.movement === false;
    const erraticMovement = vitals.jerkyMovement === true;

    const conditions = [abnormalHeartbeat, noMovement, erraticMovement];
    return conditions.filter(c => c).length >= 2;
  }

  // Create emergency alert in MongoDB
  static async createEmergencyAlert(
    userId: string,
    hospitalId: string,
    vitals: IotVitals,
    detectionMethod: 'IOT_DEVICE' | 'MANUAL'
  ) {
    try {
      const alert = new EmergencyAlert({
        userId,
        hospitalId,
        detectionMethod,
        heartbeat: vitals.heartbeat,
        movement: vitals.movement,
        jerkyMovement: vitals.jerkyMovement,
        userLatitude: vitals.latitude,
        userLongitude: vitals.longitude,
        status: 'active'
      });
      return await alert.save();
    } catch (error) {
      console.error('Error creating emergency alert:', error);
      throw error;
    }
  }
}


const IotLogModel = models.IotLog || model("IotLog", IotLogSchema);

export default IotLogModel;