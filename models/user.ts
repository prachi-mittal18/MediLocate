

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
export const UserModel = models.User || model("User", UserSchema);
export default UserModel;