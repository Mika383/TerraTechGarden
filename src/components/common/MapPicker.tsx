// src/components/common/MapPicker.tsx
import React, { useCallback, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

interface Props {
  onLocationSelect: (lat: number, lng: number) => void;
  lat?: number;
  lng?: number;
}

const containerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 10.762622,
  lng: 106.660172, // Ho Chi Minh City
};

const MapPicker: React.FC<Props> = ({ onLocationSelect, lat, lng }) => {
  const [position, setPosition] = useState<{ lat: number; lng: number }>(
    lat && lng ? { lat, lng } : defaultCenter
  );

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      setPosition(newPos);
      onLocationSelect(newPos.lat, newPos.lng);
    }
  }, [onLocationSelect]);

  if (!isLoaded) return <p>Đang tải bản đồ...</p>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={position}
      zoom={14}
      onClick={onMapClick}
    >
      <Marker position={position} draggable onDragEnd={(e) => {
        const newPos = {
          lat: e.latLng?.lat() ?? position.lat,
          lng: e.latLng?.lng() ?? position.lng,
        };
        setPosition(newPos);
        onLocationSelect(newPos.lat, newPos.lng);
      }} />
    </GoogleMap>
  );
};

export default React.memo(MapPicker);
