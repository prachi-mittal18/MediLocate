
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Hello from MediLocate Pro API",
    time: new Date().toISOString(),
  });
}
