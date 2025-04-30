import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// AIS API configuration
const AIS_API_URL = 'https://ais.saterview.com/api';
const AIS_API_KEY = process.env.AIS_API_KEY || ''; // API key should be set in environment variables

// Get vessel positions from AIS API
router.get('/vessel-positions', async (req, res) => {
  try {
    // If we don't have an API key, return mock data for development
    if (!AIS_API_KEY) {
      console.log('No AIS API key provided, returning mock position data');
      return res.json(mockVesselPositions);
    }
    
    // Get vessel MMSIs from query params or use default fleet
    const mmsiList = req.query.mmsi ? 
      Array.isArray(req.query.mmsi) ? 
        req.query.mmsi.join(',') : 
        req.query.mmsi : 
      '366998410,366759530,367671640'; // Default vessels to track
    
    // Make the request to the AIS API
    const response = await fetch(`${AIS_API_URL}/positions?mmsi=${mmsiList}`, {
      headers: {
        'Authorization': `ApiKey ${AIS_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`AIS API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching vessel positions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vessel positions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get vessel details from AIS API
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
    
    // Make the request to the AIS API
    const response = await fetch(`${AIS_API_URL}/vessels/${mmsi}`, {
      headers: {
        'Authorization': `ApiKey ${AIS_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`AIS API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching vessel details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vessel details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Search for vessels by name, MMSI, or IMO
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
    
    // Make the request to the AIS API search endpoint
    const response = await fetch(`${AIS_API_URL}/search?q=${encodeURIComponent(String(query))}`, {
      headers: {
        'Authorization': `ApiKey ${AIS_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`AIS API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    res.json(data);
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