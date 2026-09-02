/**
 * Booking Controller — request parsing, service delegation, response formatting.
 */

import { NextResponse } from "next/server";
import * as bookingService from "@/services/bookingService";

/**
 * Handle POST /api/bookings — create a new booking.
 */
export async function handleCreateBooking(request: Request) {
  try {
    const body = await request.json();
    const newBooking = await bookingService.createBooking(body);

    return NextResponse.json({ ok: true, booking: newBooking });
  } catch (error: any) {
    console.error("❌ Booking Controller Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
