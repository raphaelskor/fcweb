'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Contactability } from '@/lib/types';
import { DateTimeFormatter } from '@/lib/utils/formatters';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers with colors
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "><div style="
      width: 12px;
      height: 12px;
      background-color: white;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    "></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const getMarkerColor = (result: string) => {
  if (result.includes('PTP') || result.includes('Paid') || result.includes('Hot Prospect')) {
    return '#10b981'; // Green
  } else if (result.includes('Refuse') || result.includes('Not Found') || result.includes('Salah')) {
    return '#ef4444'; // Red
  } else if (result.includes('Follow Up') || result.includes('Negotiation')) {
    return '#f59e0b'; // Yellow
  }
  return '#6b7280'; // Gray
};

const getActionColor = (action?: string) => {
  if (action === 'RPC') return '#3b82f6'; // Blue
  if (action === 'TPC') return '#a855f7'; // Purple
  if (action === 'OPC') return '#6b7280'; // Gray
  return '#6b7280';
};

// Component to fit map bounds to markers
function FitBounds({ visits }: { visits: Contactability[] }) {
  const map = useMap();

  useEffect(() => {
    if (visits.length > 0) {
      const validCoords = visits
        .filter(v => v.latitude && v.longitude)
        .map(v => [parseFloat(v.latitude), parseFloat(v.longitude)] as [number, number]);

      if (validCoords.length > 0) {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [visits, map]);

  return null;
}

interface LocationMapProps {
  visits: Contactability[];
}

export default function LocationMap({ visits }: LocationMapProps) {
  const mapRef = useRef(null);

  // Filter visits with valid coordinates
  const validVisits = visits.filter(v => v.latitude && v.longitude);

  if (validVisits.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">No location data available</p>
      </div>
    );
  }

  // Get center point (first valid visit)
  const centerLat = parseFloat(validVisits[0].latitude);
  const centerLng = parseFloat(validVisits[0].longitude);

  // Create polyline coordinates (connecting visits chronologically)
  const polylineCoords = validVisits
    .sort((a, b) => new Date(a.Contact_Date).getTime() - new Date(b.Contact_Date).getTime())
    .map(v => [parseFloat(v.latitude), parseFloat(v.longitude)] as [number, number]);

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      {/* OpenStreetMap Tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Polyline connecting visits */}
      {polylineCoords.length > 1 && (
        <Polyline
          positions={polylineCoords}
          color="#3b82f6"
          weight={2}
          opacity={0.6}
          dashArray="5, 10"
        />
      )}

      {/* Markers for each visit */}
      {validVisits.map((visit, index) => {
        const lat = parseFloat(visit.latitude);
        const lng = parseFloat(visit.longitude);
        const markerColor = getMarkerColor(visit.Contact_Result);

        return (
          <Marker
            key={visit.id || index}
            position={[lat, lng]}
            icon={createCustomIcon(markerColor)}
          >
            <Popup maxWidth={300}>
              <div className="p-2">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: `${getActionColor(visit.Visit_Action)}20`,
                      color: getActionColor(visit.Visit_Action),
                    }}
                  >
                    {visit.Visit_Action}
                  </span>
                  <span
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: `${markerColor}20`,
                      color: markerColor,
                    }}
                  >
                    {visit.Contact_Result}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <div>
                    <strong>Date:</strong> {DateTimeFormatter.format(visit.Contact_Date, 'full')}
                  </div>
                  {visit.Visit_Location && (
                    <div>
                      <strong>Location:</strong> {visit.Visit_Location}
                    </div>
                  )}
                  {visit.Person_Contacted && (
                    <div>
                      <strong>Person:</strong> {visit.Person_Contacted}
                    </div>
                  )}
                  {visit.Visit_Notes && (
                    <div>
                      <strong>Notes:</strong> {visit.Visit_Notes.substring(0, 100)}
                      {visit.Visit_Notes.length > 100 && '...'}
                    </div>
                  )}
                  <div className="pt-2 border-t mt-2">
                    <strong>Coordinates:</strong> {visit.latitude}, {visit.longitude}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Fit bounds to show all markers */}
      <FitBounds visits={validVisits} />
    </MapContainer>
  );
}
