import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
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

// Default color for external vessels
const EXTERNAL_VESSEL_COLOR = "#94a3b8"; // slate-400

// Function to create custom yacht icon that rotates based on heading
const createShipIcon = (vesselId: number, heading = 0, isExternal = false) => {
  // For external vessels, use slate color
  const color = isExternal 
    ? EXTERNAL_VESSEL_COLOR 
    : (vesselColors[vesselId as keyof typeof vesselColors] || "#3b82f6");
  
  // For external vessels, use a simpler ship icon
  if (isExternal) {
    return L.divIcon({
      className: 'custom-ship-icon',
      html: `<div style="color: ${color}; transform: rotate(${heading}deg);" class="ship-marker">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${color}" 
                   stroke="white" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round">
                   <!-- Simple ship shape -->
                   <path d="M12 3 L16 8 L18 14 L18 18 L6 18 L6 14 L8 8 Z" fill="${color}" />
                   <!-- Simple bridge -->
                   <rect x="10" y="10" width="4" height="4" fill="white" stroke="${color}" />
               </svg>
             </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
  }
  
  // For fleet vessels, use detailed yacht icon
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

interface InteractiveVesselMapProps {
  height?: string | number;
  width?: string | number;
  className?: string;
  selectedVesselId?: number | null; 
  onVesselSelect?: (vesselId: number) => void;
  allowMapClick?: boolean;
  onMapPositionSelect?: (latitude: number, longitude: number) => void;
  showAllVessels?: boolean;
}

const InteractiveVesselMap = React.forwardRef<{ 
  focusVessel: (vesselId: number) => void;
  focusPosition: (latitude: number, longitude: number) => void; 
}, InteractiveVesselMapProps>(
  (props, ref) => {
    const { 
      height = 400, 
      width = '100%', 
      className = '', 
      selectedVesselId = null, 
      onVesselSelect,
      allowMapClick = false,
      onMapPositionSelect,
      showAllVessels = false
    } = props;
    
    const { vessels } = useVessel();
    const [refreshInterval] = useState<number>(60000); // 1 minute by default
    const mapRef = useRef<L.Map | null>(null);
    const [markerRefs, setMarkerRefs] = useState<{ [key: number]: L.Marker | null }>({});
    const [externalVessels, setExternalVessels] = useState<any[]>([]);
    
    // State to track the toggle
    const [localShowAllVessels, setLocalShowAllVessels] = useState(showAllVessels);

    // Effect to sync the local state with props
    useEffect(() => {
      setLocalShowAllVessels(showAllVessels);
    }, [showAllVessels]);
    
    // State to track current map bounds
    const [mapBounds, setMapBounds] = useState({
      north: 90,
      south: -90,
      east: 180,
      west: -180
    });

    // Query to fetch fleet vessels with integrated AIS data
    const vesselDataQuery = useQuery({
      queryKey: ['/api/marine/fleet-vessels'],
      queryFn: async () => {
        const response = await fetch('/api/marine/fleet-vessels');
        if (!response.ok) {
          throw new Error('Failed to fetch fleet vessels');
        }
        return response.json();
      },
      refetchInterval: refreshInterval,
    });
    
    // Query to fetch additional vessels (if showing all vessels)
    const vesselPositionsQuery = useQuery({
      queryKey: ['/api/marine/vessel-positions', localShowAllVessels, mapBounds],
      queryFn: async () => {
        if (!localShowAllVessels) {
          return [];
        }
        
        // Construct URL with map bounds for filtering
        let url = `/api/marine/vessel-positions?showAll=true&north=${mapBounds.north}&south=${mapBounds.south}&east=${mapBounds.east}&west=${mapBounds.west}`;
        
        console.log(`Fetching vessels in bounds: N:${mapBounds.north.toFixed(4)}, S:${mapBounds.south.toFixed(4)}, E:${mapBounds.east.toFixed(4)}, W:${mapBounds.west.toFixed(4)}`);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch vessel positions');
        }
        return response.json();
      },
      refetchInterval: refreshInterval,
      enabled: localShowAllVessels, // Only fetch when showing all vessels
    });

    // Process external vessels from AIS stream
    useEffect(() => {
      if (localShowAllVessels && vesselPositionsQuery.data) {
        const positionData = vesselPositionsQuery.data as any[];
        
        // Find vessels that are not in our fleet
        const externalVesselData = positionData.filter(pos => {
          // Check if this vessel is not in our fleet
          return !vessels.some(v => v.mmsi === pos.mmsi || v.id === pos.vesselId);
        }).map(pos => {
          // Generate a synthetic vessel ID for external vessels (negative to avoid conflicts)
          // Use the full MMSI for uniqueness to avoid duplicate keys
          const syntheticId = -Math.abs(parseInt(pos.mmsi));
          return {
            id: syntheticId,
            name: pos.name || `Vessel ${pos.mmsi}`,
            type: 'External Vessel',
            mmsi: pos.mmsi,
            length: 0, // Unknown
            width: 0, // Unknown
            latitude: pos.latitude,
            longitude: pos.longitude,
            heading: pos.heading || 0,
            speed: pos.speed || 0,
            lastUpdate: pos.timestamp,
            isExternal: true // Flag to identify external vessels
          };
        });
        
        setExternalVessels(externalVesselData);
      } else {
        setExternalVessels([]);
      }
    }, [localShowAllVessels, vessels, vesselPositionsQuery.data]);

    // Combined data (fleet vessel info with integrated AIS data + additional external vessels)
    const vesselData = React.useMemo(() => {
      // Use the fleet vessel data from the new endpoint
      const fleetVesselsWithPositions = vesselDataQuery.data ? vesselDataQuery.data : vessels.map(v => ({
        ...v,
        latitude: 25.7617 + (Math.random() * 0.5), // Default to Miami area only if API fails
        longitude: -80.1918 + (Math.random() * 0.5),
        heading: Math.floor(Math.random() * 360),
        speed: Math.floor(Math.random() * 15),
        lastUpdate: new Date().toISOString(),
      }));
      
      // Combine fleet vessels with external vessels if localShowAllVessels is true
      return localShowAllVessels ? [...fleetVesselsWithPositions, ...externalVessels] : fleetVesselsWithPositions;
    }, [vessels, vesselDataQuery.data, externalVessels, localShowAllVessels]);

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
    
    // Focus on specific coordinates
    const focusPosition = (latitude: number, longitude: number, zoom: number = 13) => {
      if (mapRef.current) {
        mapRef.current.setView([latitude, longitude], zoom);
      }
    };

    // Expose methods via ref
    React.useImperativeHandle(ref, () => ({
      focusVessel,
      focusPosition
    }));

    // Handle vessel click
    const handleVesselClick = (vesselId: number) => {
      focusVessel(vesselId);
    };

    // Custom component to handle map initialization and updates
    const MapController = () => {
      const map = useMap();
      const [clickMarker, setClickMarker] = useState<L.Marker | null>(null);
      
      // Store the map reference on mount
      useEffect(() => {
        mapRef.current = map;
      }, [map]);

      // Focus on selected vessel if one is provided
      useEffect(() => {
        if (selectedVesselId && map) {
          const vessel = vesselData.find(v => v.id === selectedVesselId);
          if (vessel && vessel.latitude !== undefined && vessel.longitude !== undefined) {
            map.setView([vessel.latitude, vessel.longitude], 13);
            
            // Open popup if marker exists
            const marker = markerRefs[selectedVesselId];
            if (marker) {
              marker.openPopup();
            }
          }
        }
      }, [selectedVesselId, map]);
      
      // Update map bounds and handle map events
      useMapEvents({
        moveend: (e) => {
          // Update map bounds when the view changes
          const map = e.target;
          const bounds = map.getBounds();
          setMapBounds({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
          });
        },
        zoomend: (e) => {
          // Update map bounds when zoom changes
          const map = e.target;
          const bounds = map.getBounds();
          setMapBounds({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
          });
        },
        click: (e) => {
          if (allowMapClick) {
            const { lat, lng } = e.latlng;
            
            // Remove previous temporary marker if it exists
            if (clickMarker) {
              clickMarker.remove();
            }
            
            // Create a new marker at the clicked position
            const newMarker = L.marker([lat, lng], {
              icon: L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="w-6 h-6 rounded-full bg-primary border-2 border-white flex items-center justify-center text-white text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v8M8 12h8" />
                        </svg>
                      </div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })
            }).addTo(map);
            
            // Open a popup with the coordinates
            newMarker.bindPopup(
              `<div class="text-xs">
                <div class="font-medium">Selected Position</div>
                <div>${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
                <div class="text-xs text-blue-500 cursor-pointer mt-1" id="use-position">
                  Use this position
                </div>
              </div>`
            ).openPopup();
            
            // Setup event listener for the "Use this position" link
            setTimeout(() => {
              const usePositionLink = document.getElementById('use-position');
              if (usePositionLink) {
                usePositionLink.addEventListener('click', () => {
                  // Call the onMapPositionSelect callback if provided
                  if (props.onMapPositionSelect) {
                    props.onMapPositionSelect(lat, lng);
                  }
                  newMarker.closePopup();
                });
              }
            }, 100);
            
            // Store the marker reference
            setClickMarker(newMarker);
          }
        }
      });
      
      return null;
    };

    // Custom control for the map
    const VesselToggleControl = () => {
      const map = useMap();
      
      // Create toggle control
      useEffect(() => {
        // Create a custom control
        const toggleControl = L.Control.extend({
          options: {
            position: 'topright'
          },
          
          onAdd: function() {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            container.style.background = 'white';
            container.style.padding = '8px';
            container.style.borderRadius = '4px';
            container.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
            
            const toggleWrapper = document.createElement('div');
            toggleWrapper.className = 'flex items-center gap-2';
            
            // Create toggle label
            const label = document.createElement('div');
            label.textContent = 'Show All Vessels';
            label.className = 'text-xs font-medium';
            
            // Create toggle switch
            const toggleContainer = document.createElement('label');
            toggleContainer.className = 'relative inline-flex items-center cursor-pointer';
            
            const toggle = document.createElement('input');
            toggle.type = 'checkbox';
            toggle.className = 'sr-only peer';
            toggle.checked = localShowAllVessels;
            
            const toggleBg = document.createElement('div');
            toggleBg.className = `w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
              peer-focus:ring-blue-300 rounded-full peer 
              peer-checked:after:translate-x-full peer-checked:after:border-white 
              after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
              after:bg-white after:border-gray-300 after:border after:rounded-full 
              after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600`;
            
            toggleContainer.appendChild(toggle);
            toggleContainer.appendChild(toggleBg);
            
            toggleWrapper.appendChild(label);
            toggleWrapper.appendChild(toggleContainer);
            container.appendChild(toggleWrapper);
            
            // Prevent click events from propagating to the map
            L.DomEvent.disableClickPropagation(container);
            
            // Add change event listener
            toggle.addEventListener('change', (e) => {
              // Update the state
              if (e.target instanceof HTMLInputElement) {
                setLocalShowAllVessels(e.target.checked);
              }
            });
            
            return container;
          }
        });
        
        // Add the control to the map
        const control = new toggleControl();
        map.addControl(control);
        
        // Cleanup on unmount
        return () => {
          map.removeControl(control);
        };
      }, [map, localShowAllVessels]);
      
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
          
          {/* Custom toggle control */}
          <VesselToggleControl />
          
          {vesselData.map((vessel) => {
            // Only render marker if vessel has valid coordinates
            return vessel.latitude !== undefined && vessel.longitude !== undefined ? (
              <Marker 
                key={`vessel-${vessel.id}-${vessel.mmsi}`}
                position={[vessel.latitude, vessel.longitude]}
                icon={createShipIcon(vessel.id, vessel.heading, vessel.isExternal)}
                eventHandlers={{
                  click: () => handleVesselClick(vessel.id),
                  add: (e) => {
                    // Store marker reference on initial add only
                    setMarkerRefs(prev => ({ ...prev, [vessel.id]: e.target }));
                  }
                }}
              >
                <Popup>
                  <div className="p-1">
                    <div className="text-sm font-medium">
                      {vessel.name}
                      {vessel.isExternal && (
                        <span className="ml-1 px-1 py-0.5 text-xs bg-slate-100 text-slate-700 rounded">External</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {vessel.type}
                      {!vessel.isExternal && ` • ${vessel.length}m`}
                    </div>
                    <div className="text-xs mt-2 grid grid-cols-2 gap-y-1">
                      <div><span className="font-medium">Position:</span> {vessel.latitude !== undefined ? vessel.latitude.toFixed(4) : 'N/A'}, {vessel.longitude !== undefined ? vessel.longitude.toFixed(4) : 'N/A'}</div>
                      <div><span className="font-medium">MMSI:</span> {vessel.mmsi || 'N/A'}</div>
                      <div><span className="font-medium">Speed:</span> {vessel.speed !== undefined ? `${vessel.speed} knots` : 'N/A'}</div>
                      <div><span className="font-medium">Heading:</span> {vessel.heading !== undefined ? `${vessel.heading}°` : 'N/A'}</div>
                    </div>
                    <div className="text-xs mt-2">
                      <span className="font-medium">Last Update:</span> {new Date(vessel.lastUpdate).toLocaleTimeString()}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ) : null;
          })}
          
          <MapController />
        </MapContainer>
      </div>
    );
  }
);

// Display name for debugging
InteractiveVesselMap.displayName = 'InteractiveVesselMap';

export default InteractiveVesselMap;