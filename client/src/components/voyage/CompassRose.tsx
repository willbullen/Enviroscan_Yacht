import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';

// Component to add a compass rose to the map
interface CompassRoseProps {
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  size?: number;
  className?: string;
}

export function CompassRose({ 
  position = 'bottomleft', 
  size = 150,
  className = ''
}: CompassRoseProps) {
  const map = useMap();
  
  useEffect(() => {
    // Compass rose custom control
    const CompassControl = L.Control.extend({
      options: {
        position: position
      },

      onAdd: function() {
        const container = L.DomUtil.create('div', `leaflet-compass-rose ${className}`);
        
        // SVG compass rose design
        // This is a traditional marine compass rose design with cardinal and intercardinal points
        container.innerHTML = `
          <svg width="${size}" height="${size}" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Outer circle -->
            <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="2" />
            
            <!-- Inner circle -->
            <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1" />
            
            <!-- Cardinal points star -->
            <path d="M100 5 L100 195 M5 100 L195 100" stroke="rgba(255,255,255,0.9)" stroke-width="2" />
            
            <!-- Intercardinal points -->
            <path d="M29 29 L171 171 M29 171 L171 29" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" />
            
            <!-- Cardinal points labels -->
            <text x="100" y="15" text-anchor="middle" fill="white" font-weight="bold" font-size="16">N</text>
            <text x="185" y="104" text-anchor="middle" fill="white" font-weight="bold" font-size="16">E</text>
            <text x="100" y="195" text-anchor="middle" fill="white" font-weight="bold" font-size="16">S</text>
            <text x="15" y="104" text-anchor="middle" fill="white" font-weight="bold" font-size="16">W</text>
            
            <!-- Intercardinal points labels -->
            <text x="160" y="40" text-anchor="middle" fill="white" font-size="12">NE</text>
            <text x="160" y="165" text-anchor="middle" fill="white" font-size="12">SE</text>
            <text x="40" y="165" text-anchor="middle" fill="white" font-size="12">SW</text>
            <text x="40" y="40" text-anchor="middle" fill="white" font-size="12">NW</text>
            
            <!-- Center decoration -->
            <circle cx="100" cy="100" r="5" fill="rgba(59, 130, 246, 0.9)" stroke="white" stroke-width="1" />
            
            <!-- North arrow -->
            <path d="M100 25 L95 40 L100 35 L105 40 Z" fill="rgba(59, 130, 246, 0.9)" stroke="white" stroke-width="1" />
          </svg>
        `;
        
        // Apply some styling
        container.style.background = 'rgba(0, 0, 0, 0.4)';
        container.style.borderRadius = '50%';
        container.style.padding = '0px';
        container.style.margin = '20px';
        container.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
        container.style.width = `${size}px`;
        container.style.height = `${size}px`;
        container.style.pointerEvents = 'none'; // Allow clicking through the compass
        
        return container;
      }
    });
    
    // Add the control to the map
    const compassControl = new CompassControl();
    map.addControl(compassControl);
    
    // Cleanup on unmount
    return () => {
      if (compassControl) {
        map.removeControl(compassControl);
      }
    };
  }, [map, position, size, className]);
  
  return null;
}