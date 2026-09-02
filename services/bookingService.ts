/**
 * Booking Service — all booking-related business logic.
 */

import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import type { CreateBookingData } from "@/types/booking";

/**
 * Create a new appointment booking.
 */
export async function createBooking(data: CreateBookingData) {
  await connectDB();
  return Booking.create(data);
}
