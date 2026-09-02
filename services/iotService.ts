/**
 * IoT Service — all IoT + emergency-detection business logic.
 * Absorbs the old lib/iotDetection.ts and the registration route logic.
 */

import connectDB from "@/lib/db";
import { IotLog, EmergencyAlert } from "@/models/IotLog";
import UserModel from "@/models/User";
import { getNearbyHospitals } from "@/services/hospitalService";
import type { IotVitals, IotDataPayload, IotRegisterData } from "@/types/iot";
import bcrypt from "bcryptjs";

// ── Logging ──────────────────────────────────────────────────────────

/**
 * Persist a single IoT data reading.
 */
export async function logDeviceData(
  deviceId: string,
  userId: string | null,
  vitals: IotVitals
) {
  const newLog = new IotLog({ deviceId, userId, ...vitals });
  return newLog.save();
}

// ── Emergency Detection ──────────────────────────────────────────────

/**
 * Determine if a set of vitals constitutes an emergency.
 * Rule: 2 or more of the following must be true:
 *  - abnormal heartbeat (< 40 or > 140)
 *  - no movement
 *  - jerky / erratic movement
 */
export function detectEmergency(vitals: IotVitals): boolean {
  const abnormalHeartbeat = vitals.heartbeat < 40 || vitals.heartbeat > 140;
  const noMovement = vitals.movement === false;
  const erraticMovement = vitals.jerkyMovement === true;

  const conditions = [abnormalHeartbeat, noMovement, erraticMovement];
  return conditions.filter((c) => c).length >= 2;
}

/**
 * Create a persistent emergency-alert record.
 */
export async function createEmergencyAlert(
  userId: string,
  hospitalId: string,
  vitals: IotVitals,
  detectionMethod: "IOT_DEVICE" | "MANUAL"
) {
  const alert = new EmergencyAlert({
    userId,
    hospitalId,
    detectionMethod,
    heartbeat: vitals.heartbeat,
    movement: vitals.movement,
    jerkyMovement: vitals.jerkyMovement,
    userLatitude: vitals.latitude,
    userLongitude: vitals.longitude,
    status: "active",
  });
  return alert.save();
}

// ── Full IoT Pipeline ────────────────────────────────────────────────

/**
 * Process an incoming IoT data packet end-to-end:
 *  1. Find the user tied to the device
 *  2. Log the vitals
 *  3. Detect emergencies
 *  4. If emergency + known user → find nearest hospital → create alert
 */
export async function processIotData(payload: IotDataPayload) {
  await connectDB();

  const { deviceId, heartbeat, movement, jerkyMovement, latitude, longitude } =
    payload;

  // 1. Find the user associated with this device
  const user = await UserModel.findOne({ iot_device_id: deviceId });

  // 2. Log the data
  const newLog = await IotLog.create({
    deviceId,
    userId: user?._id,
    heartbeat,
    movement,
    jerkyMovement,
    latitude,
    longitude,
  });

  // 3. Emergency detection
  const vitals: IotVitals = {
    heartbeat,
    movement,
    jerkyMovement,
    latitude,
    longitude,
  };
  const isEmergency = detectEmergency(vitals);

  if (isEmergency && user) {
    const hospitals = await getNearbyHospitals(latitude, longitude, 5);

    if (hospitals && hospitals.length > 0) {
      const nearest: any = hospitals[0];
      await createEmergencyAlert(
        user._id,
        nearest._id,
        vitals,
        "IOT_DEVICE"
      );

      return {
        status: "emergency_triggered" as const,
        hospital: nearest.name,
        phone: nearest.ambulance_phone || nearest.phone,
      };
    }
  }

  return { status: "success" as const, loggedId: newLog._id };
}

// ── User + Device Registration ───────────────────────────────────────

/**
 * Register a new user and link them to an IoT device.
 */
export async function registerUser(data: IotRegisterData) {
  await connectDB();

  const { email, name, phone, password, iotDeviceId, emergencyContact } = data;

  // Check if user or device already exists
  const existingUser = await UserModel.findOne({
    $or: [{ email }, { iot_device_id: iotDeviceId }],
  });

  if (existingUser) {
    throw new Error("Email or IoT Device ID already registered");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await UserModel.create({
    email,
    name,
    phone,
    password_hash: passwordHash,
    is_registered: true,
    iot_device_id: iotDeviceId,
    emergency_contact: emergencyContact,
  });

  return {
    id: user._id,
    email: user.email,
    name: user.name,
    iot_device_id: user.iot_device_id,
  };
}
