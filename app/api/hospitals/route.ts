import connectDB from "../../../lib/db";
import Hospital from "@/models/Hospital";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Establish the connection using your utility in lib/db.ts
    await connectDB();

    // 2. Fetch all hospitals from the 'hospitals' collection using the Mongoose model
    // .lean() makes the query faster by returning plain JavaScript objects
    const hospitals = await Hospital.find({}).lean();

    // 3. Return the data in the format your frontend map expects
    return NextResponse.json({ 
      ok: true, 
      hospitals 
    });

  } catch (error: any) {
    console.error("❌ API Route Error:", error);
    
    // Return a structured error so the frontend doesn't crash
    return NextResponse.json(
      { 
        ok: false, 
        error: error.message || "Failed to fetch hospitals from database" 
      }, 
      { status: 500 }
    );
  }
}