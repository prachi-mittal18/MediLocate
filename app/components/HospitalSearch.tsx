'use client';

import { useState, useEffect } from 'react';

export default function HospitalSearch() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [radius, setRadius] = useState(5);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
      });
    }
  };

  const handleSearchHospitals = async () => {
    if (latitude === null || longitude === null) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/hospitals/search?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
      );
      const data = await response.json();
      setHospitals(data.hospitals);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHospitalClick = (hospital: any) => {
    window.open(hospital.googleMapsUrl, '_blank');
  };

  return (
    <div className="hospital-search">
      <button onClick={handleGetLocation}>📍 Use Current Location</button>

      {latitude && longitude && (
        <>
          <p>
            Location: {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </p>

          <div className="radius-control">
            <label>Radius: {radius} km</label>
            <input
              type="range"
              min="1"
              max="50"
              value={radius}
              onChange={(e) => setRadius(parseFloat(e.target.value))}
            />
          </div>

          <button onClick={handleSearchHospitals} disabled={loading}>
            {loading ? 'Searching...' : 'Find Hospitals'}
          </button>

          {hospitals.length > 0 && (
            <div className="hospital-list">
              {hospitals.map((hospital) => (
                <div key={hospital.id} className="hospital-card">
                  <h3>{hospital.name}</h3>
                  <p>{hospital.address}</p>
                  <p>Distance: {hospital.distance_km.toFixed(1)} km</p>
                  <button onClick={() => handleHospitalClick(hospital)}>
                    Get Directions
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}