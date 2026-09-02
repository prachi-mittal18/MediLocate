import { NextRequest } from "next/server";
import { handleIotData } from "@/controllers/iotController";

export async function POST(request: NextRequest) {
  return handleIotData(request);
}