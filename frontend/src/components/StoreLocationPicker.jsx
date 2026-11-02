// src/components/StoreLocationPicker.jsx
import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default leaflet pin marker icon issue in Vite/React
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

const customIcon = new L.Icon({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Addis Ababa Center & Bounds
const ADDIS_CENTER = [9.0300, 38.7400]; // Mercato / City Center
const ADDIS_BOUNDS = [
  [8.8500, 38.6500], // Southwest
  [9.0800, 38.9000], // Northeast
];

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  const eventHandlers = useMemo(
    () => ({
      dragend(e) {
        const marker = e.target;
        if (marker != null) {
          const { lat, lng } = marker.getLatLng();
          setPosition([lat, lng]);
        }
      },
    }),
    [setPosition]
  );

  return position === null ? null : (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      icon={customIcon}
    />
  );
}

export default function StoreLocationPicker({ onLocationSelect }) {
  const [position, setPosition] = useState(ADDIS_CENTER);

  // Update parent form whenever position changes
  const updatePosition = (newPos) => {
    setPosition(newPos);
    if (onLocationSelect) {
      onLocationSelect({ lat: newPos[0], lng: newPos[1] });
    }
  };

  // HTML5 Geolocation Auto-Detect
  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          updatePosition([latitude, longitude]);
        },
        (err) => {
          alert('Could not detect location automatically. Please select on the map.');
        }
      );
    }
  };

  return (
    <div className="store-location-picker">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ fontWeight: 'bold' }}>Pin Exact Store Location on Map *</label>
        <button
          type="button"
          onClick={handleDetectLocation}
          style={{ padding: '6px 12px', cursor: 'pointer', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}
        >
          📍 Detect My Location
        </button>
      </div>

      <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc' }}>
        <MapContainer
          center={ADDIS_CENTER}
          zoom={13}
          maxBounds={ADDIS_BOUNDS}
          maxBoundsViscosity={0.8}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={updatePosition} />
        </MapContainer>
      </div>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
        Drag the marker or tap anywhere on the map to set your physical shop location.
      </p>
    </div>
  );
}