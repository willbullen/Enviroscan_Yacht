import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { useVessel } from '@/contexts/VesselContext';
import "leaflet/dist/leaflet.css";

// Vessel icon colors by vessel ID
const vesselColors = {
  1: "#3b82f6", // blue
  2: "#10b981", // emerald
  3: "#ef4444", // red
  4: "#8b5cf6"  // purple
};

// Function to create custom yacht icon that rotates based on heading
const createShipIcon = (vesselId: number, heading = 0) => {
  const color = vesselColors[vesselId as keyof typeof vesselColors] || "#3b82f6";
  
  return L.divIcon({
    className: 'custom-ship-icon',
    html: `<div style="color: ${color}; transform: rotate(${heading}deg);" class="ship-marker">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" 
                 stroke="white" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round">
                 <!-- Detailed top view of a luxury yacht -->
                 <path d="M12 2 L16 6 L18 10 L20 14 L20 18 L4 18 L4 14 L6 10 L8 6 Z" fill="${color}" />
                 <!-- Stern details -->
                 <path d="M8 18 L8 20 L16 20 L16 18" fill="${color}" />
                 <!-- Cabin/bridge structure -->
                 <rect x="9" y="8" width="6" height="6" fill="white" stroke="${color}" />
                 <!-- Deck details -->
                 <line x1="8" y1="10" x2="9" y2="10" stroke="white" stroke-width="0.5" />
                 <line x1="15" y1="10" x2="16" y2="10" stroke="white" stroke-width="0.5" />
                 <line x1="8" y1="12" x2="9" y2="12" stroke="white" stroke-width="0.5" />
                 <line x1="15" y1="12" x2="16" y2="12" stroke="white" stroke-width="0.5" />
                 <!-- Bow accent -->
                 <circle cx="12" cy="5" r="0.8" fill="white" />
             </svg>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

interface SimpleVesselMapProps {
  height?: string | number;
  width?: string | number;
  className?: string;
  selectedVesselId?: number | null;
  onVesselSelect?: (vesselId: number) => void;
}

const SimpleVesselMap = React.forwardRef<{ focusVessel: (vesselId: number) => void }, SimpleVesselMapProps>(({
  height = 400,
  width = '100%',
  className = '',
  selectedVesselId = null,
  onVesselSelect
}, ref) => {
  const { vessels } = useVessel();
  const [refreshInterval] = useState<number>(60000); // 1 minute by default

  // Query to fetch vessel positions
  const vesselPositionsQuery = useQuery({
    queryKey: ['/api/marine/vessel-positions'],
    refetchInterval: refreshInterval,
  });

  // Combined data (static vessel info + latest positions)
  const vesselData = React.useMemo(() => {
    if (!vesselPositionsQuery.data) return vessels.map(v => ({
      ...v,
      latitude: 25.7617 + (Math.random() * 0.5), // Default to Miami area for testing
      longitude: -80.1918 + (Math.random() * 0.5),
      heading: Math.floor(Math.random() * 360),
      speed: Math.floor(Math.random() * 15),
      lastUpdate: new Date().toISOString(),
    }));

    // Combine static vessel data with position data
    return vessels.map(vessel => {
      const positionData = (vesselPositionsQuery.data as any[]).find(
        (pos: any) => pos.mmsi === vessel.mmsi || pos.vesselId === vessel.id
      );
      
      if (positionData) {
        return {
          ...vessel,
          latitude: positionData.latitude,
          longitude: positionData.longitude,
          heading: positionData.heading || 0,
          speed: positionData.speed || 0,
          lastUpdate: positionData.timestamp,
        };
      }
      
      // If no position data, return default values
      return {
        ...vessel,
        latitude: 25.7617 + (Math.random() * 0.5), // Default to Miami area for testing
        longitude: -80.1918 + (Math.random() * 0.5),
        heading: Math.floor(Math.random() * 360),
        speed: Math.floor(Math.random() * 15),
        lastUpdate: new Date().toISOString(),
      };
    });
  }, [vessels, vesselPositionsQuery.data]);

  // Track map reference and markers for programmatic control
  const mapRef = useRef<L.Map | null>(null);
  const [markerRefs, setMarkerRefs] = useState<{ [key: number]: L.Marker | null }>({});

  // Focus vessel method exposed via ref
  const focusVessel = (vesselId: number) => {
    const vessel = vesselData.find(v => v.id === vesselId);
    if (vessel && mapRef.current) {
      // Zoom to vessel position
      mapRef.current.setView([vessel.latitude, vessel.longitude], 13);
      
      // Open the popup for this vessel if it exists
      const marker = markerRefs[vesselId];
      if (marker) {
        marker.openPopup();
      }

      // Call onVesselSelect if provided
      if (onVesselSelect) {
        onVesselSelect(vesselId);
      }
    }
  };

  // Expose the focusVessel method via ref
  React.useImperativeHandle(ref, () => ({
    focusVessel
  }));

  // Handle vessel selection from map
  const handleVesselClick = (vesselId: number) => {
    focusVessel(vesselId);
  };

  // Custom component to handle map initialization
  const MapController = () => {
    const map = useMap();
    
    // Store the map reference
    React.useEffect(() => {
      mapRef.current = map;
    }, [map]);

    // Focus on selected vessel if one is provided
    React.useEffect(() => {
      if (selectedVesselId && map) {
        const vessel = vesselData.find(v => v.id === selectedVesselId);
        if (vessel) {
          map.setView([vessel.latitude, vessel.longitude], 13);
          
          // Open popup if marker exists
          const marker = markerRefs[selectedVesselId];
          if (marker) {
            marker.openPopup();
          }
        }
      }
    }, [selectedVesselId]);
    
    return null;
  };

  return (
    <div style={{ height, width }} className={className}>
      <MapContainer
        center={[25.7617, -80.1918]} // Default to Miami
        zoom={9}
        style={{ height: '100%', width: '100%', borderRadius: 'calc(var(--radius) - 2px)' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {vesselData.map((vessel) => (
          <Marker 
            key={vessel.id}
            position={[vessel.latitude, vessel.longitude]}
            icon={createShipIcon(vessel.id, vessel.heading)}
            eventHandlers={{
              click: () => handleVesselClick(vessel.id)
            }}
            ref={(marker) => {
              if (marker) {
                setMarkerRefs(prev => ({ ...prev, [vessel.id]: marker }));
              }
            }}
          >
            <Popup>
              <div className="p-1">
                <div className="text-sm font-medium">{vessel.name}</div>
                <div className="text-xs text-muted-foreground">{vessel.type} • {vessel.length}</div>
                <div className="text-xs mt-2 grid grid-cols-2 gap-y-1">
                  <div><span className="font-medium">Position:</span> {vessel.latitude.toFixed(4)}, {vessel.longitude.toFixed(4)}</div>
                  <div><span className="font-medium">Flag:</span> Malta</div>
                  <div><span className="font-medium">Speed:</span> {vessel.speed} knots</div>
                  <div><span className="font-medium">Heading:</span> {vessel.heading}°</div>
                </div>
                <div className="text-xs mt-2">
                  <span className="font-medium">Last Update:</span> {new Date(vessel.lastUpdate).toLocaleTimeString()}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        <MapController />
      </MapContainer>
    </div>
  );
};

export default SimpleVesselMap;