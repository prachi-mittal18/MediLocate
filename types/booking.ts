/**
 * Shared types for the Booking domain.
 */

/** Data required to create a new booking */
export interface CreateBookingData {
  hospitalId: string;
  patientName: string;
  department: string;
  appointmentDate: string;
}

/** Raw booking document shape (matches Mongoose schema) */
export interface IBooking {
  _id: string;
  hospitalId: string;
  patientName: string;
  department: string;
  appointmentDate: string;
  status: string;
  createdAt: Date;
}

/** Standard API response wrapper */
export interface BookingResponse {
  ok: boolean;
  booking?: IBooking;
  error?: string;
}
