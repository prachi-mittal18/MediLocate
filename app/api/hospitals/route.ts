import { handleGetAllHospitals } from "@/controllers/hospitalController";

export async function GET() {
  return handleGetAllHospitals();
}