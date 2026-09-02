import mongoose, { Schema, model, models } from "mongoose";

// --- Mongoose Schemas ---
// (Interfaces have moved to types/iot.ts)

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
    hospitalId: String,
    detectionMethod: { type: String, enum: ['IOT_DEVICE', 'MANUAL'] },
    heartbeat: Number,
    movement: Boolean,
    jerkyMovement: Boolean,
    userLatitude: Number,
    userLongitude: Number,
    status: { type: String, default: 'active' }
}, { timestamps: true });

// Register each model exactly once
export const IotLog = models.IotLog || model("IotLog", IotLogSchema);
export const EmergencyAlert = models.EmergencyAlert || model("EmergencyAlert", EmergencyAlertSchema);

export default IotLog;