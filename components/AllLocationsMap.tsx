'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Contactability } from '@/lib/types';
import { DateTimeFormatter } from '@/lib/utils/formatters';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface AllLocationsMapProps {
  visits: Contactability[];
  selectedVisit?: Contactability | null;
  onVisitClick?: (visit: Contactability) => void;
}

// Helper to get marker color based on result
function getMarkerColor(result?: string): string {
  if (!result) return '#6b7280';
  
  const r = result.toLowerCase();
  if (r.includes('ptp') || r.includes('promise') || r.includes('paid')) {
    return '#10b981'; // green
  }
  if (r.includes('refuse') || r.includes('not found') || r.includes('unreachable')) {
    return '#ef4444'; // red
  }
  if (r.includes('follow up') || r.includes('negotiation') || r.includes('hot prospect')) {
    return '#f59e0b'; // amber
  }
  return '#6b7280'; // gray
}

// Create custom icon with color
function createCustomIcon(color: string, isSelected: boolean = false): L.DivIcon {
  const size = isSelected ? 40 : 30;
  const zIndex = isSelected ? 1000 : 0;
  
  return L.divIcon({
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px;">
        <div style="
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: ${size * 0.6}px;
          height: ${size}px;
          background-color: ${color};
          border-radius: 50% 50% 50% 0;
          transform: translateX(-50%) rotate(-45deg);
          border: ${isSelected ? '3px' : '2px'} solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
        <div style="
          position: absolute;
          bottom: ${size * 0.45}px;
          left: 50%;
          transform: translateX(-50%);
          width: ${size * 0.3}px;
          height: ${size * 0.3}px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// Component to fit map bounds
function FitBounds({ visits }: { visits: Contactability[] }) {
  const map = useMap();

  useEffect(() => {
    if (visits.length === 0) return;

    const validCoordinates = visits
      .filter(v => v.latitude && v.longitude)
      .map(v => [parseFloat(v.latitude!), parseFloat(v.longitude!)]);

    if (validCoordinates.length > 0) {
      const bounds = L.latLngBounds(validCoordinates as L.LatLngTuple[]);
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
      });
    }
  }, [visits, map]);

  return null;
}

// Component to highlight selected marker
function HighlightSelected({ visit }: { visit?: Contactability | null }) {
  const map = useMap();

  useEffect(() => {
    if (visit?.latitude && visit?.longitude) {
      const lat = parseFloat(visit.latitude);
      const lng = parseFloat(visit.longitude);
      map.setView([lat, lng], 16, { animate: true });
    }
  }, [visit, map]);

  return null;
}

export default function AllLocationsMap({ visits, selectedVisit, onVisitClick }: AllLocationsMapProps) {
  // Default center (Jakarta)
  const defaultCenter: [number, number] = [-6.2088, 106.8456];
  
  // Filter valid coordinates
  const validVisits = useMemo(() => {
    return visits.filter(v => v.latitude && v.longitude);
  }, [visits]);

  // Calculate map center
  const mapCenter: [number, number] = useMemo(() => {
    if (validVisits.length === 0) return defaultCenter;
    
    const avgLat = validVisits.reduce((sum, v) => sum + parseFloat(v.latitude!), 0) / validVisits.length;
    const avgLng = validVisits.reduce((sum, v) => sum + parseFloat(v.longitude!), 0) / validVisits.length;
    
    return [avgLat, avgLng];
  }, [validVisits]);

  // Create custom cluster icon
  const createClusterCustomIcon = (cluster: any) => {
    const count = cluster.getChildCount();
    let size = 40;
    let color = '#3b82f6'; // blue
    
    if (count > 100) {
      size = 60;
      color = '#dc2626'; // red
    } else if (count > 50) {
      size = 55;
      color = '#f59e0b'; // amber
    } else if (count > 20) {
      size = 50;
      color = '#10b981'; // green
    }

    return L.divIcon({
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${size > 50 ? '16px' : '14px'};
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        ">
          ${count}
        </div>
      `,
      className: '',
      iconSize: [size, size],
    });
  };

  if (validVisits.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-gray-600">No visit locations with coordinates found</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={mapCenter}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={createClusterCustomIcon}
        maxClusterRadius={50}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={true}
        zoomToBoundsOnClick={true}
      >
        {validVisits.map((visit) => {
          const lat = parseFloat(visit.latitude!);
          const lng = parseFloat(visit.longitude!);
          const color = getMarkerColor(visit.Contact_Result);
          const isSelected = selectedVisit?.id === visit.id;

          return (
            <Marker
              key={visit.id}
              position={[lat, lng]}
              icon={createCustomIcon(color, isSelected)}
              eventHandlers={{
                click: () => {
                  if (onVisitClick) {
                    onVisitClick(visit);
                  }
                },
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="font-semibold text-gray-900 mb-2">
                    {visit.client_name}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="font-medium">Date:</span>{' '}
                      {DateTimeFormatter.format(visit.Contact_Date, 'full')}
                    </div>
                    <div>
                      <span className="font-medium">Action:</span> {visit.Visit_Action}
                    </div>
                    <div>
                      <span className="font-medium">Result:</span>{' '}
                      <span style={{ color }}>{visit.Contact_Result}</span>
                    </div>
                    {visit.Visit_Location && (
                      <div>
                        <span className="font-medium">Location:</span>{' '}
                        {visit.Visit_Location}
                      </div>
                    )}
                    {visit.Person_Contacted && (
                      <div>
                        <span className="font-medium">Person:</span> {visit.Person_Contacted}
                      </div>
                    )}
                    {visit.Visit_Notes && (
                      <div>
                        <span className="font-medium">Notes:</span>{' '}
                        <div className="text-gray-700 mt-1">{visit.Visit_Notes}</div>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 pt-1 border-t">
                      {lat.toFixed(6)}, {lng.toFixed(6)}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>

      <FitBounds visits={validVisits} />
      {selectedVisit && <HighlightSelected visit={selectedVisit} />}
    </MapContainer>
  );
}

