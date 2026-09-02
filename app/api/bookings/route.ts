import { handleCreateBooking } from "@/controllers/bookingController";

export async function POST(req: Request) {
  return handleCreateBooking(req);
}