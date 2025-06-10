// src/LocationPicker.js
import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

function LocationMarker({ setCoords, setLocationText, clearLocationError }) {
  const [position, setPosition] = useState([31.9, 35.2]);

  useMapEvents({
    click(e) {
      const coords = [e.latlng.lat, e.latlng.lng];
      setPosition(coords);
      setCoords(coords);
      clearLocationError?.();

      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}`)
        .then((res) => res.json())
        .then((data) => {
          setLocationText(data.display_name);
        })
        .catch(() => {
          setLocationText(`${coords[0]}, ${coords[1]}`);
        });
    },
  });

  return <Marker position={position} />;
}

export default function LocationPicker({ setCoords, setLocationText, clearLocationError }) {
  return (
    <MapContainer
      center={[31.9, 35.2]}
      zoom={8}
      scrollWheelZoom={true}
      style={{
        height: "300px",
        width: "100%",
        marginBottom: "24px",
        borderRadius: "12px",
        border: "2px solid #1976d2",
      }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker
        setCoords={setCoords}
        setLocationText={setLocationText}
        clearLocationError={clearLocationError}
      />
    </MapContainer>
  );
}
