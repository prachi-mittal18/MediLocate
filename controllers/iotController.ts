/**
 * IoT Controller — request parsing, validation, service delegation, response formatting.
 */

import { NextRequest, NextResponse } from "next/server";
import * as iotService from "@/services/iotService";

/**
 * Handle POST /api/iot — process incoming IoT data.
 */
export async function handleIotData(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, heartbeat, movement, jerkyMovement, latitude, longitude } = body;

    // Validate required fields
    if (!deviceId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const result = await iotService.processIotData({
      deviceId,
      heartbeat,
      movement,
      jerkyMovement,
      latitude,
      longitude,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ IoT Controller Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle POST /api/iot/register — register a user with an IoT device.
 */
export async function handleRegisterDevice(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, phone, password, iotDeviceId, emergencyContact } = body;

    // Validate required fields
    if (!email || !name || !password || !iotDeviceId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await iotService.registerUser({
      email,
      name,
      phone,
      password,
      iotDeviceId,
      emergencyContact,
    });

    return NextResponse.json({
      status: "success",
      message: "User registered with IoT device",
      user,
    });
  } catch (error: any) {
    console.error("❌ IoT Registration Error:", error);

    // Distinguish validation errors from server errors
    const status = error.message.includes("already registered") ? 400 : 500;
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status }
    );
  }
}
