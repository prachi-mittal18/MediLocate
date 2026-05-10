import connectDB from "@/lib/db";
// NOTICE: We use 'Bookings' with an 's' because that is your filename!
import Booking from "@/models/Bookings"; 
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    
    // This uses the 'Booking' model we imported from the 'Bookings.ts' file
    const newBooking = await Booking.create(body);
    
    return NextResponse.json({ ok: true, booking: newBooking });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}