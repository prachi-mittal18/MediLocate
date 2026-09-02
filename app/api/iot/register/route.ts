import { NextRequest } from "next/server";
import { handleRegisterDevice } from "@/controllers/iotController";

export async function POST(request: NextRequest) {
  return handleRegisterDevice(request);
}