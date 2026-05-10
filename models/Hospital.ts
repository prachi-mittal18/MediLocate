import mongoose, { Schema, model, models } from "mongoose";

const HospitalSchema = new Schema({
  name: { type: String, required: true },
  location: {
    type: {
      type: String, 
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    }
  },
  address: { type: String, required: true },
  phone: String,
  ambulance_phone: String,
  website_url: String,
  available_beds: { type: Number, default: 0 },
}, { timestamps: true });

// 2dsphere index is vital for $near queries
HospitalSchema.index({ location: "2dsphere" });

// Attach the static method directly to the schema
HospitalSchema.statics.getNearbyHospitals = async function(userLat: number, userLng: number, radiusKm: number) {
  return await this.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [userLng, userLat] // Longitude first!
        },
        $maxDistance: radiusKm * 1000 
      }
    }
  });
};

const HospitalModel = models.Hospital || model("Hospital", HospitalSchema);
export default HospitalModel;