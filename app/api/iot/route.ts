import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
// Import the model (default) and the class/vitals (named)
import IotLogModel, { IotDevice, IotVitals } from '@/models/IOTdevice';
import UserModel from '@/models/user';
import HospitalModel from '@/models/Hospital';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { deviceId, heartbeat, movement, jerkyMovement, latitude, longitude } = body;

    // 1. Validate
    if (!deviceId || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // 2. Find User
    const user = await UserModel.findOne({ iot_device_id: deviceId });

    // 3. Log Data (Using the Default Export IotLogModel)
    // FIX: Match the Schema property names exactly!
    const newLog = await IotLogModel.create({
      deviceId,           // Match Schema: deviceId
      userId: user?._id,  // Match Schema: userId
      heartbeat,
      movement,
      jerkyMovement,      // Match Schema: jerkyMovement
      latitude,
      longitude
    });

    const vitals: IotVitals = { heartbeat, movement, jerkyMovement, latitude, longitude };

    // 4. Emergency Detection using your logic class
    const isEmergency = IotDevice.detectEmergency(vitals);

    if (isEmergency && user) {
      // Find hospitals using the static method from Hospital model
      const hospitals = await (HospitalModel as any).getNearbyHospitals(latitude, longitude, 5);

      if (hospitals && hospitals.length > 0) {
        const nearest = hospitals[0];
        
        // Use your class to create the alert record
        await IotDevice.createEmergencyAlert(user._id, nearest._id, vitals, 'IOT_DEVICE');

        return NextResponse.json({
          status: 'emergency_triggered',
          hospital: nearest.name,
          phone: nearest.ambulance_phone || nearest.phone
        });
      }
    }

    return NextResponse.json({ status: 'success', loggedId: newLog._id });

  } catch (error: any) {
    console.error('IoT Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}