// //import pool from '../db';
// import pool from '../lib/db';

// export interface IUser {
//   id?: number;
//   email: string;
//   phone?: string;
//   name: string;
//   password_hash: string;
//   is_registered: boolean;
//   iot_device_id?: string;
//   emergency_contact?: string;
// }

// export class User {
//   // Register user with IoT device
//   static async registerUser(userData: IUser) {
//     const query = `
//       INSERT INTO users (
//         email, phone, name, password_hash, 
//         is_registered, iot_device_id, emergency_contact
//       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
//       RETURNING id, email, name, iot_device_id;
//     `;
    
//     try {
//       const result = await pool.query(query, [
//         userData.email,
//         userData.phone,
//         userData.name,
//         userData.password_hash,
//         true,
//         userData.iot_device_id,
//         userData.emergency_contact
//       ]);
//       return result.rows[0];
//     } catch (error) {
//       console.error('Error registering user:', error);
//       throw error;
//     }
//   }

//   // Get user by IoT device ID
//   static async getUserByDeviceId(deviceId: string) {
//     const query = `
//       SELECT * FROM users 
//       WHERE iot_device_id = $1 AND is_registered = true;
//     `;
    
//     try {
//       const result = await pool.query(query, [deviceId]);
//       return result.rows[0] || null;
//     } catch (error) {
//       console.error('Error fetching user:', error);
//       throw error;
//     }
//   }

//   // Get user by email
//   static async getUserByEmail(email: string) {
//     const query = 'SELECT * FROM users WHERE email = $1;';
    
//     try {
//       const result = await pool.query(query, [email]);
//       return result.rows[0] || null;
//     } catch (error) {
//       console.error('Error fetching user:', error);
//       throw error;
//     }
//   }
// }

import mongoose, { Schema, model, models } from "mongoose";

// Define the structure of your User document
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  name: { type: String },
  password_hash: { type: String, required: true },
  is_registered: { type: Boolean, default: true },
  iot_device_id: { type: String, unique: true, sparse: true }, // sparse allows multiple nulls
  emergency_contact: { type: String },
}, { 
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Next.js fix: use existing model if it exists, otherwise create it
const User = models.User || model("User", UserSchema);

export default User;