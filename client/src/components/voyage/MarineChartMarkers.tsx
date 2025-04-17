import React from 'react';
import { useMap, Marker, Popup } from 'react-leaflet';
import * as L from 'leaflet';
import { Navigation, AlertTriangle, Anchor } from 'lucide-react';

// Types for marine markers
interface MarineMarker {
  id: number;
  position: [number, number];
  type: 'cardinal-north' | 'cardinal-south' | 'cardinal-east' | 'cardinal-west' | 'lateral' | 'isolated-danger' | 'safe-water' | 'special';
  name: string;
  description?: string;
}

// Custom icon for different cardinal markers
const createCardinalIcon = (type: string) => {
  let bgColor = '#000';
  let fgColor = '#fff';
  let borderColor = '#fff';
  let symbol = '';
  let shape = 'circle'; // default shape
  
  // Define colors, symbols, and shapes based on marker type
  // Following international marine navigation standards
  switch (type) {
    case 'cardinal-north':
      bgColor = '#000'; // Black
      fgColor = '#fff';
      symbol = '▲▲';
      shape = 'diamond'; // Diamond with arrow pointing up
      break;
    case 'cardinal-south':
      bgColor = '#000'; // Black
      fgColor = '#fff';
      symbol = '▼▼';
      shape = 'diamond'; // Diamond with arrow pointing down
      break;
    case 'cardinal-east':
      bgColor = '#000'; // Black
      fgColor = '#fff';
      symbol = '▲▼';
      shape = 'diamond'; // Diamond with arrows pointing away
      break;
    case 'cardinal-west':
      bgColor = '#000'; // Black
      fgColor = '#fff';
      symbol = '▼▲';
      shape = 'diamond'; // Diamond with arrows pointing towards center
      break;
    case 'lateral':
      bgColor = '#f00'; // Red for port hand
      fgColor = '#fff';
      symbol = '⬤';
      break;
    case 'isolated-danger':
      bgColor = '#f00'; // Red with black bands
      fgColor = '#fff';
      borderColor = '#000';
      symbol = '✕';
      shape = 'danger';
      break;
    case 'safe-water':
      bgColor = '#fff'; // White with red vertical stripes
      fgColor = '#f00';
      borderColor = '#f00';
      symbol = '⊙';
      break;
    case 'special':
      bgColor = '#ff0'; // Yellow
      fgColor = '#000';
      symbol = '⬡';
      break;
    default:
      bgColor = '#fff';
      fgColor = '#000';
      symbol = '?';
  }
  
  // Create different HTML based on shape
  let html = '';
  if (shape === 'diamond') {
    html = `
      <div style="
        width: 20px; 
        height: 20px; 
        background-color: ${bgColor}; 
        transform: rotate(45deg);
        border: 2px solid ${borderColor};
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          transform: rotate(-45deg);
          color: ${fgColor};
          font-size: 10px;
          font-weight: bold;
          position: absolute;
        ">${symbol}</div>
      </div>
    `;
  } else if (shape === 'danger') {
    html = `
      <div style="
        width: 22px; 
        height: 22px; 
        background-color: ${bgColor}; 
        border-radius: 50%;
        border: 2px solid ${borderColor};
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          width: 100%;
          height: 4px;
          background-color: ${borderColor};
          top: 50%;
          transform: translateY(-50%);
        "></div>
        <div style="
          color: ${fgColor};
          font-size: 12px;
          font-weight: bold;
          z-index: 2;
        ">${symbol}</div>
      </div>
    `;
  } else {
    // Default circular marker
    html = `
      <div style="
        background-color: ${bgColor}; 
        width: 20px; 
        height: 20px; 
        border-radius: 50%; 
        border: 2px solid ${borderColor};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: ${fgColor};
        font-weight: bold;
      ">${symbol}</div>
    `;
  }
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: html,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -15]
  });
};

// Sample marine navigation markers with realistic maritime coordinates
// In a real application, these would come from a maritime database or API
const SAMPLE_MARKERS: MarineMarker[] = [
  // San Francisco Bay area aids to navigation
  {
    id: 1,
    position: [37.810, -122.465], 
    type: 'cardinal-north',
    name: 'Point Bonita North Cardinal',
    description: 'Pass to the north of this mark - San Francisco approach'
  },
  {
    id: 2,
    position: [37.765, -122.341],
    type: 'cardinal-south',
    name: 'Alameda South Channel Marker',
    description: 'Pass to the south of this mark - Oakland approach'
  },
  {
    id: 3,
    position: [37.827, -122.426],
    type: 'lateral',
    name: 'Golden Gate Bridge East Approach',
    description: 'Port side channel marker - Keep to starboard when entering'
  },
  {
    id: 4,
    position: [37.749, -122.692],
    type: 'isolated-danger',
    name: 'Duxbury Reef Hazard',
    description: 'Isolated danger - Reef system, shallow waters'
  },
  {
    id: 5,
    position: [37.846, -122.466],
    type: 'safe-water',
    name: 'Marin Headlands Approach',
    description: 'Safe water - Deep channel marker'
  },
  {
    id: 6,
    position: [37.795, -122.394],
    type: 'special',
    name: 'Ferry Terminal Advisory',
    description: 'Special purpose - High traffic ferry operations'
  },
  {
    id: 7,
    position: [37.775, -122.365],
    type: 'cardinal-east',
    name: 'Bay Bridge East Navigation',
    description: 'Pass to the east of this mark - Oakland Inner Harbor'
  },
  {
    id: 8,
    position: [37.811, -122.409],
    type: 'cardinal-west',
    name: 'Alcatraz West Marker',
    description: 'Pass to the west of this mark - Avoid shallow waters'
  }
];

interface MarineChartMarkersProps {
  // This could take custom markers or fetch from an API
  customMarkers?: MarineMarker[];
  // Allow toggling the display of these markers
  visible?: boolean;
}

export function MarineChartMarkers({ 
  customMarkers = SAMPLE_MARKERS, 
  visible = true 
}: MarineChartMarkersProps) {
  const map = useMap();
  
  // If not visible, don't render anything
  if (!visible) return null;
  
  // Fit these markers to view when map is first loaded if there are waypoints
  React.useEffect(() => {
    if (customMarkers.length > 0) {
      // Already handled by other component - just for reference
      // const bounds = L.latLngBounds(customMarkers.map(marker => marker.position));
      // map.fitBounds(bounds.pad(0.2));
    }
  }, [customMarkers, map]);
  
  return (
    <>
      {customMarkers.map(marker => (
        <Marker
          key={`marine-marker-${marker.id}`}
          position={marker.position}
          icon={createCardinalIcon(marker.type)}
        >
          <Popup>
            <div className="p-1">
              <div className="font-bold text-sm mb-1 flex items-center">
                {marker.type.includes('cardinal') && (
                  <Navigation className="h-3 w-3 mr-1" />
                )}
                {marker.type === 'isolated-danger' && (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                )}
                {marker.type === 'lateral' && (
                  <Anchor className="h-3 w-3 mr-1" />
                )}
                {marker.name}
              </div>
              {marker.description && (
                <div className="text-xs text-muted-foreground">
                  {marker.description}
                </div>
              )}
              <div className="text-xs mt-1">
                <span className="bg-primary/10 text-primary px-1 py-0.5 rounded">
                  {marker.type.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}