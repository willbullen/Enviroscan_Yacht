import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// AIS Stream API configuration
const AIS_API_URL = 'https://api.aisstream.io/v1';
const AIS_API_KEY = process.env.AIS_API_KEY || ''; // API key should be set in environment variables

// Get vessel positions from AIS Stream API
router.get('/vessel-positions', async (req, res) => {
  try {
    // If we don't have an API key, return mock data for development
    if (!AIS_API_KEY) {
      console.log('No AIS API key provided, returning mock position data');
      return res.json(mockVesselPositions);
    }
    
    // Get vessel MMSIs from query params or use default fleet
    let mmsiList = req.query.mmsi ? 
      Array.isArray(req.query.mmsi) ? 
        req.query.mmsi.map(String) : 
        [String(req.query.mmsi)] : 
      ['366998410', '366759530', '367671640']; // Default vessels to track
    
    // Make the request to the AIS Stream API for vessel positions
    const response = await fetch(`${AIS_API_URL}/positions`, {
      method: 'POST',
      headers: {
        'x-api-key': AIS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mmsi: mmsiList
      })
    });
    
    if (!response.ok) {
      throw new Error(`AIS API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json() as { 
      vessels?: Array<{
        vessel?: {
          mmsi: string;
          name?: string;
        };
        position?: {
          lat?: number;
          lon?: number;
          sog?: number;
          heading?: number;
        };
        lastPosUpdate?: string;
      }>
    };
    
    // Format the response to match our application's expected structure
    const formattedPositions = data.vessels?.map(vessel => {
      // Extract vessel info with type safety
      const vesselData = vessel.vessel || { mmsi: '', name: '' };
      
      // Find matching vessel ID in our mock data (for mapping to our internal IDs)
      // In a real application, this would be a database lookup
      const mockVessel = mockVesselPositions.find(v => v.mmsi === vesselData.mmsi);
      const vesselId = mockVessel?.vesselId || 0;
      
      return {
        mmsi: vesselData.mmsi,
        vesselId: vesselId,
        name: vesselData.name || 'Unknown',
        latitude: vessel.position?.lat || 0,
        longitude: vessel.position?.lon || 0,
        speed: vessel.position?.sog || 0,
        heading: vessel.position?.heading || 0,
        timestamp: vessel.lastPosUpdate || new Date().toISOString()
      };
    }) || [];
    
    // If no results returned, use mock data (to ensure we always have data for demo)
    if (formattedPositions.length === 0) {
      console.log('No vessels found in AIS Stream, returning mock data');
      return res.json(mockVesselPositions);
    }
    
    res.json(formattedPositions);
  } catch (error) {
    console.error('Error fetching vessel positions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vessel positions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get vessel details from AIS Stream API
router.get('/vessel-details/:mmsi', async (req, res) => {
  try {
    const { mmsi } = req.params;
    
    // If we don't have an API key, return mock data for development
    if (!AIS_API_KEY) {
      console.log('No AIS API key provided, returning mock vessel details');
      const mockVessel = mockVesselDetails.find(v => v.mmsi === mmsi);
      return res.json(mockVessel || { 
        mmsi,
        name: 'Unknown Vessel',
        type: 'Unknown',
        length: 0,
        width: 0,
        flag: 'Unknown'
      });
    }
    
    // Make the request to the AIS Stream API with POST request for vessel details
    const response = await fetch(`${AIS_API_URL}/vessels`, {
      method: 'POST',
      headers: {
        'x-api-key': AIS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mmsi: [mmsi]
      })
    });
    
    if (!response.ok) {
      throw new Error(`AIS API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json() as {
      vessels?: Array<{
        mmsi: string;
        name?: string;
        shipType?: string;
        dimension?: {
          length?: number;
          width?: number;
        };
        flag?: string;
        imo?: string;
        callsign?: string;
      }>
    };
    
    // Check if vessel was found
    if (!data.vessels || data.vessels.length === 0) {
      // No vessel found, return default data
      console.log(`No data found for vessel with MMSI ${mmsi}`);
      const mockVessel = mockVesselDetails.find(v => v.mmsi === mmsi);
      return res.json(mockVessel || { 
        mmsi,
        name: 'Unknown Vessel',
        type: 'Unknown',
        length: 0,
        width: 0,
        flag: 'Unknown'
      });
    }
    
    // Format the response to match our application's expected structure
    const vessel = data.vessels[0];
    const formattedVessel = {
      mmsi: vessel.mmsi,
      name: vessel.name || 'Unknown',
      type: vessel.shipType || 'Unknown',
      length: vessel.dimension?.length || 0,
      width: vessel.dimension?.width || 0,
      flag: vessel.flag || 'Unknown',
      imo: vessel.imo || '',
      callsign: vessel.callsign || ''
    };
    
    res.json(formattedVessel);
  } catch (error) {
    console.error('Error fetching vessel details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vessel details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Search for vessels by name, MMSI, or IMO using AIS Stream
router.get('/search-vessels', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // If we don't have an API key, return mock data for development
    if (!AIS_API_KEY) {
      console.log('No AIS API key provided, returning mock search results');
      
      // Simple mock search for development - would be replaced by API call
      const searchResults = mockVesselDetails.filter(vessel => 
        vessel.name.toLowerCase().includes(String(query).toLowerCase()) || 
        vessel.mmsi.includes(String(query))
      );
      
      return res.json(searchResults);
    }
    
    // Make the request to the AIS Stream API search endpoint
    // AIS Stream requires POST for search, with a specific format
    const response = await fetch(`${AIS_API_URL}/search`, {
      method: 'POST',
      headers: {
        'x-api-key': AIS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: String(query)
      })
    });
    
    if (!response.ok) {
      throw new Error(`AIS API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json() as {
      vessels?: Array<{
        mmsi: string;
        name?: string;
        shipType?: string;
        dimension?: {
          length?: number;
          width?: number;
        };
        flag?: string;
        imo?: string;
        callsign?: string;
      }>
    };
    
    // Format the response to match our application's expected structure
    const formattedResults = data.vessels?.map(vessel => ({
      mmsi: vessel.mmsi,
      name: vessel.name || 'Unknown',
      type: vessel.shipType || 'Unknown',
      length: vessel.dimension?.length || 0,
      width: vessel.dimension?.width || 0,
      flag: vessel.flag || 'Unknown',
      imo: vessel.imo || '',
      callsign: vessel.callsign || ''
    })) || [];
    
    res.json(formattedResults);
  } catch (error) {
    console.error('Error searching vessels:', error);
    res.status(500).json({ 
      error: 'Failed to search vessels',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mock data for development when no API key is available
const mockVesselPositions = [
  {
    mmsi: '366998410',
    vesselId: 1,
    name: 'Serenity',
    latitude: 25.7617,
    longitude: -80.1918,
    speed: 12.5,
    heading: 135,
    timestamp: new Date().toISOString()
  },
  {
    mmsi: '366759530',
    vesselId: 2,
    name: 'Blue Horizon',
    latitude: 25.8102,
    longitude: -80.1251,
    speed: 0,
    heading: 270,
    timestamp: new Date().toISOString()
  },
  {
    mmsi: '367671640',
    vesselId: 3,
    name: 'Ocean Explorer',
    latitude: 25.6789,
    longitude: -80.2345,
    speed: 8.3,
    heading: 45,
    timestamp: new Date().toISOString()
  }
];

const mockVesselDetails = [
  {
    mmsi: '366998410',
    name: 'Serenity',
    type: 'Yacht',
    length: 48,
    width: 8.5,
    flag: 'USA'
  },
  {
    mmsi: '366759530',
    name: 'Blue Horizon',
    type: 'Motor Yacht',
    length: 55,
    width: 9.2,
    flag: 'UK'
  },
  {
    mmsi: '367671640',
    name: 'Ocean Explorer',
    type: 'Sailing Yacht',
    length: 32,
    width: 7.1,
    flag: 'France'
  }
];

export default router;