/**
 * Shared types for the User domain.
 */

/** Raw user document shape (matches Mongoose schema) */
export interface IUser {
  _id: string;
  email: string;
  phone?: string;
  name?: string;
  password_hash: string;
  is_registered: boolean;
  iot_device_id?: string;
  emergency_contact?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Public-safe user info returned by APIs (no password hash) */
export interface UserPublicInfo {
  id: string;
  email: string;
  name?: string;
  iot_device_id?: string;
}
