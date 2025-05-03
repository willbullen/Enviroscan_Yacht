import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cloud, RefreshCw } from 'lucide-react';

// Define props interface
interface WindyIframeMapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  voyageId?: number;
}

export function WindyIframeMap({ 
  latitude = 43.0, 
  longitude = 5.0, 
  zoom = 7,
  voyageId 
}: WindyIframeMapProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch the Windy API key from the server
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
          setLoading(false);
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
  
  // Create the iframe URL with the API key
  const getWindyUrl = () => {
    if (!apiKey) return '';
    
    // Build the Windy embed URL with parameters
    return `https://embed.windy.com/embed2.html?lat=${latitude}&lon=${longitude}&zoom=${zoom}&level=surface&overlay=wind&product=ecmwf&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1&key=${apiKey}`;
  };
  
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
  
  // Loading state
  if (loading) {
    return (
      <div className="w-full rounded-md overflow-hidden">
        <div className="h-[500px] flex items-center justify-center bg-muted/20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading weather map...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full rounded-md overflow-hidden border">
      <iframe 
        title="Windy Weather Map"
        src={getWindyUrl()}
        width="100%" 
        height="500" 
        frameBorder="0"
        style={{ border: 0 }}
        allowFullScreen
      ></iframe>
    </div>
  );
}