import { NextResponse } from "next/server";

const globalForEmergency = globalThis as typeof globalThis & {
  __latestEmergency?: any;
};

export async function GET() {
  const emergency =
    globalForEmergency.__latestEmergency || null;

  return NextResponse.json({
    emergency,
  });
}