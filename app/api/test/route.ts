import connectDB from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ 
      message: "Success! Your D: drive project is connected to the MongoDB Cluster. ✅" 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      message: "Connection failed. ❌", 
      error: error.message 
    }, { status: 500 });
  }
}