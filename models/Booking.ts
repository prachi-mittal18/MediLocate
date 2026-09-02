import mongoose, { Schema, model, models } from "mongoose";

// 1. We must make sure the Hospital model is registered 
// so the 'ref' below doesn't point to an undefined model.
import "./Hospital"; 

const BookingSchema = new Schema({
  hospitalId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Hospital', 
    required: [true, "Hospital ID is required"] 
  },
  patientName: { 
    type: String, 
    required: [true, "Patient name is required"] 
  },
  department: { 
    type: String, 
    required: [true, "Department is required"] 
  },
  appointmentDate: { 
    type: String, 
    required: [true, "Date is required"] 
  },
  status: { 
    type: String, 
    default: "Confirmed" 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// 2. The standard Next.js model check
const Booking = models.Booking || model("Booking", BookingSchema);

export default Booking;