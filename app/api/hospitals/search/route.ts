import { NextRequest, NextResponse } from 'next/server';
import { Hospital } from '@/lib/models/Hospital';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const latitude = parseFloat(searchParams.get('latitude') || '0');
    const longitude = parseFloat(searchParams.get('longitude') || '0');
    const radius = parseFloat(searchParams.get('radius') || '5');

    if (latitude === 0 || longitude === 0) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Get nearby hospitals
    const hospitals = await Hospital.getNearbyHospitals(
      latitude,
      longitude,
      radius
    );

    // Add Google Maps URLs
    const hospitalsWithUrls = hospitals.map((hospital) => ({
      ...hospital,
      googleMapsUrl: Hospital.generateGoogleMapsUrl(
        latitude,
        longitude,
        hospital.latitude,
        hospital.longitude,
        hospital.name
      )
    }));

    return NextResponse.json({
      status: 'success',
      count: hospitalsWithUrls.length,
      hospitals: hospitalsWithUrls
    });
  } catch (error) {
    console.error('Search Error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}