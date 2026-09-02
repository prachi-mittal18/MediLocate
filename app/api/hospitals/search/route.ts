import { NextRequest } from "next/server";
import { handleSearchHospitals } from "@/controllers/hospitalController";

export async function GET(request: NextRequest) {
  return handleSearchHospitals(request);
}