// import { NextRequest, NextResponse } from 'next/server';
// import { User } from '@/lib/models/User';
// import bcrypt from 'bcryptjs';

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { email, name, phone, password, iotDeviceId, emergencyContact } =
//       body;

//     // Validate
//     if (!email || !name || !password || !iotDeviceId) {
//       return NextResponse.json(
//         { error: 'Missing required fields' },
//         { status: 400 }
//       );
//     }

//     // Hash password
//     const passwordHash = await bcrypt.hash(password, 10);

//     // Register user
//     const user = await User.registerUser({
//       email,
//       name,
//       phone,
//       password_hash: passwordHash,
//       is_registered: true,
//       iot_device_id: iotDeviceId,
//       emergency_contact: emergencyContact,
//     });

//     return NextResponse.json({
//       status: 'success',
//       message: 'User registered with IoT device',
//       user: {
//         id: user.id,
//         email: user.email,
//         name: user.name,
//         iot_device_id: user.iot_device_id
//       }
//     });
//   } catch (error) {
//     console.error('Registration Error:', error);
//     return NextResponse.json(
//       { error: 'Registration failed' },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/user'; // Ensure path matches your folder structure
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await connectDB(); // 1. Always connect first!

    const body = await request.json();
    const { email, name, phone, password, iotDeviceId, emergencyContact } = body;

    // 2. Validate input
    if (!email || !name || !password || !iotDeviceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 3. Check if user or device already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { iot_device_id: iotDeviceId }] 
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email or IoT Device ID already registered' },
        { status: 400 }
      );
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Register user using Mongoose
    const user = await User.create({
      email,
      name,
      phone,
      password_hash: passwordHash,
      is_registered: true,
      iot_device_id: iotDeviceId,
      emergency_contact: emergencyContact,
    });

    return NextResponse.json({
      status: 'success',
      message: 'User registered with IoT device',
      user: {
        id: user._id, // MongoDB uses _id
        email: user.email,
        name: user.name,
        iot_device_id: user.iot_device_id
      }
    });

  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { error: 'Registration failed', details: error.message },
      { status: 500 }
    );
  }
}