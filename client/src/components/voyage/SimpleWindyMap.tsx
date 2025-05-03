import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cloud, RefreshCw } from 'lucide-react';

// Define windyInit for TypeScript
declare global {
  interface Window {
    windyInit: (options: any, callback: (api: any) => void) => void;
  }
}

// Define props interface
interface SimpleWindyMapProps {
  latitude?: number;
  longitude?: number;
  voyageId?: number;
}

export function SimpleWindyMap({ 
  latitude = 43.0,
  longitude = 5.0,
  voyageId 
}: SimpleWindyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  // Fetch API key
  useEffect(() => {
    async function fetchApiKey() {
      try {
        const response = await fetch('/api/config/windy-keys');
        if (!response.ok) {
          throw new Error(`Failed to fetch API key: ${response.status}`);
        }
        
        const data = await response.json();
        if (data && data.WINDY_MAP_FORECAST_KEY) {
          console.log('Successfully retrieved Windy API key');
          setApiKey(data.WINDY_MAP_FORECAST_KEY);
        } else {
          throw new Error('No API key found in response');
        }
      } catch (error) {
        console.error('Error fetching API key:', error);
        setError('Failed to fetch API key. Please try again later.');
        setLoading(false);
      }
    }
    
    fetchApiKey();
  }, []);
  
  // Initialize Windy map directly in HTML structure
  useEffect(() => {
    if (!apiKey || !mapContainer.current || initialized) return;
    
    try {
      // Display initialization message
      console.log('Initializing Windy map with API key');
      
      // Create a script tag for Windy API
      const script = document.createElement('script');
      script.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
      script.async = true;
      
      // Handle the script load event
      script.onload = () => {
        console.log('Windy script loaded');
        
        // Check if windyInit is available
        if (typeof window.windyInit !== 'function') {
          console.error('windyInit function not found after loading the script');
          setError('Failed to initialize Windy map. Please try again later.');
          setLoading(false);
          return;
        }
        
        // Wait a bit to ensure everything is properly loaded
        setTimeout(() => {
          try {
            // Initialize Windy
            window.windyInit({
              key: apiKey,
              container: mapContainer.current,
              lat: latitude,
              lon: longitude,
              zoom: 7
            }, (api) => {
              console.log('Windy initialized successfully');
              
              // The Windy API instance is ready
              setInitialized(true);
              setLoading(false);
              
              // Example: change overlay to rain
              api.store.set('overlay', 'wind');
            });
          } catch (err) {
            console.error('Error initializing Windy:', err);
            setError('Error initializing the weather map.');
            setLoading(false);
          }
        }, 500);
      };
      
      // Handle script loading error
      script.onerror = () => {
        console.error('Failed to load Windy script');
        setError('Failed to load weather map. Please try again later.');
        setLoading(false);
      };
      
      // Add the script to the document
      document.body.appendChild(script);
      
      // Cleanup function
      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    } catch (err) {
      console.error('Error setting up Windy map:', err);
      setError('Error setting up the weather map.');
      setLoading(false);
    }
  }, [apiKey, latitude, longitude, initialized]);
  
  // Handle reload
  const handleReload = () => {
    window.location.reload();
  };
  
  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <Cloud className="h-5 w-5 mr-2" />
            Weather Map Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleReload} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="w-full rounded-md overflow-hidden">
      <div className="relative w-full" style={{ height: "500px" }}>
        {/* Map container - Windy will render here */}
        <div 
          ref={mapContainer} 
          className="absolute inset-0 w-full h-full"
        />
        
        {/* Loading state */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading weather map...</p>
          </div>
        )}
      </div>
    </div>
  );
}