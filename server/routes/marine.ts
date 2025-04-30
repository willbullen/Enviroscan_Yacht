import express from 'express';
import fetch from 'node-fetch';
import WebSocket from 'ws';

const router = express.Router();

// AIS Stream API configuration
const AIS_API_KEY = process.env.AIS_API_KEY || ''; // API key should be set in environment variables
const AIS_STREAM_WS_URL = 'wss://stream.aisstream.io/v0/stream';
const MARINE_TRAFFIC_API_URL = 'https://services.marinetraffic.com/api';
const BACKUP_API_URL = 'https://api.aisstream.io/v1';
// Internal cache for vessel positions received from AIS Stream
const vesselPositionsCache: Record<string, any> = {};

// Function to initialize AIS Stream WebSocket connection (if needed)
// AIS Stream primarily uses WebSockets for real-time tracking
let wsInitialized = false;
// Initialize and export the function so it can be called from other modules
export function initAisStreamWebsocket() {
  if (wsInitialized || !AIS_API_KEY) return;
  
  try {
    // Connect to AIS Stream WebSocket API
    const ws = new WebSocket(AIS_STREAM_WS_URL);
    
    // Handle WebSocket connection open
    ws.on('open', function open() {
      console.log('Connected to AIS Stream WebSocket');
      
      // Subscribe to specific vessel types (e.g., 30=fishing, 37=pleasure craft)
      const subscriptionMessage = {
        APIKey: AIS_API_KEY,
        BoundingBoxes: [[
          [-180, -90], // Southwest point
          [180, 90]    // Northeast point (whole world)
        ]],
        FilterMessageTypes: ["PositionReport"]
      };
      
      ws.send(JSON.stringify(subscriptionMessage));
    });
    
    // Handle incoming messages
    ws.on('message', function incoming(data: WebSocket.Data) {
      try {
        // Make sure data is a Buffer or string before trying to parse
        let jsonData;
        if (Buffer.isBuffer(data)) {
          jsonData = JSON.parse(data.toString());
        } else if (typeof data === 'string') {
          jsonData = JSON.parse(data);
        } else {
          console.log('Received non-string/buffer data:', typeof data);
          return; // Skip processing for other data types
        }
        
        // Log message type for debugging
        console.log(`Received message type: ${jsonData?.MessageType || 'unknown'}`);
        
        // Process AIS message
        if (jsonData && jsonData.MessageType === 'PositionReport') {
          let vesselPosition;
          
          // Check if message is in the new format where data is nested in PositionReport object
          if (jsonData.Message && jsonData.Message.PositionReport) {
            vesselPosition = jsonData.Message.PositionReport;
            
            // Check if MMSI exists in the new format (as UserID)
            if (!vesselPosition.UserID) {
              console.log('Position report missing UserID:', vesselPosition);
              return;
            }
            
            const mmsi = vesselPosition.UserID.toString();
            
            // Update vessel cache with the new data format
            vesselPositionsCache[mmsi] = {
              mmsi: mmsi,
              vesselId: parseInt(mmsi.slice(-8), 10) % 1000, // Generate vessel ID from MMSI
              name: 'AIS Vessel ' + mmsi.slice(-5), // Most AIS messages don't include name
              latitude: vesselPosition.Latitude || 0,
              longitude: vesselPosition.Longitude || 0,
              speed: vesselPosition.Sog || 0, // Speed over ground
              heading: vesselPosition.TrueHeading || 0,
              timestamp: new Date().toISOString()
            };
            
            console.log(`Updated position for vessel MMSI: ${mmsi} (New Format)`);
          }
          // Handle the old format where data is directly in Message
          else if (jsonData.Message) {
            vesselPosition = jsonData.Message;
            
            // Ensure MMSI exists before processing
            if (!vesselPosition.MMSI) {
              console.log('Received position report without MMSI:', vesselPosition);
              return;
            }
            
            const mmsi = vesselPosition.MMSI.toString();
            
            // Update vessel cache
            vesselPositionsCache[mmsi] = {
              mmsi: mmsi,
              vesselId: parseInt(mmsi.slice(-8), 10) % 1000, // Generate vessel ID from MMSI
              name: vesselPosition.ShipName || 'Unknown',
              latitude: vesselPosition.Latitude || 0,
              longitude: vesselPosition.Longitude || 0,
              speed: vesselPosition.SOG || 0,
              heading: vesselPosition.Heading || 0,
              timestamp: new Date().toISOString()
            };
            
            console.log(`Updated position for vessel MMSI: ${mmsi} (Old Format)`);
          }
          
          console.log(`Updated position for vessel MMSI: ${mmsi}`);
        }
      } catch (error) {
        console.error('Error processing AIS message:', error);
      }
    });
    
    // Handle errors
    ws.on('error', function error(err) {
      console.error('AIS Stream WebSocket error:', err);
    });
    
    // Handle close
    ws.on('close', function close() {
      console.log('AIS Stream WebSocket connection closed');
      wsInitialized = false;
      
      // Try to reconnect after a delay
      setTimeout(() => {
        initAisStreamWebsocket();
      }, 10000);
    });
    
    wsInitialized = true;
  } catch (error) {
    console.error('Failed to initialize AIS Stream WebSocket:', error);
  }
}

// Get vessel positions from AIS Stream API
router.get('/vessel-positions', async (req, res) => {
  try {
    // Initialize WebSocket if not already done
    if (!wsInitialized && AIS_API_KEY) {
      initAisStreamWebsocket();
    }
    
    // If we don't have an API key, return mock data for development
    if (!AIS_API_KEY) {
      console.log('No AIS API key provided, returning mock position data');
      return res.json(mockVesselPositions);
    }
    
    // Check if the request asks for all vessels
    const showAllVessels = req.query.showAll === 'true';
    
    // If showAllVessels is true, return all vessels in the cache
    if (showAllVessels) {
      console.log('Returning all vessels from cache, count:', Object.keys(vesselPositionsCache).length);
      // Convert vesselsPositionsCache object to array
      const allVessels = Object.values(vesselPositionsCache);
      
      // Only return vessels with valid coordinates
      const validVessels = allVessels.filter(vessel => 
        vessel && vessel.latitude && vessel.longitude && 
        vessel.latitude !== 0 && vessel.longitude !== 0
      );
      
      if (validVessels.length > 0) {
        return res.json(validVessels);
      } else {
        console.log('No valid vessels in cache, returning mock data');
        return res.json(mockVesselPositions);
      }
    }
    
    // Otherwise use vessel MMSIs from query params or use default fleet
    let mmsiList = req.query.mmsi ? 
      Array.isArray(req.query.mmsi) ? 
        req.query.mmsi.map(String) : 
        [String(req.query.mmsi)] : 
      ['366998410', '366759530', '367671640']; // Default vessels to track
      
    // Check if we have any of the requested vessels in our cache
    const result: any[] = [];
    let foundVessels = false;
    
    // First try to get positions from our WebSocket cache
    mmsiList.forEach(mmsi => {
      if (vesselPositionsCache[mmsi]) {
        result.push(vesselPositionsCache[mmsi]);
        foundVessels = true;
      }
    });
    
    // If no results from our WebSocket cache, use the mock vessels
    if (!foundVessels) {
      console.log('No vessels found in position cache, returning mock data');
      return res.json(mockVesselPositions);
    }
    
    res.json(result);
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
    const response = await fetch(`${BACKUP_API_URL}/vessels`, {
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
    
    // Always return mock data for now until API issue is fixed
    console.log('Searching for vessels with query:', query);
    
    // Filter mock data to match the search query (name or MMSI)
    const searchResults = mockVesselDetails.filter(vessel => 
      vessel.name.toLowerCase().includes(String(query).toLowerCase()) || 
      vessel.mmsi.includes(String(query))
    );
    
    return res.json(searchResults);
    
    /* The following code is temporarily disabled due to API connectivity issues
    // If we have an API key, try to use the real AIS Stream API
    if (AIS_API_KEY) {
      try {
        // Make the request to the AIS Stream API search endpoint
        const response = await fetch(`${BACKUP_API_URL}/search`, {
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
        
        return res.json(formattedResults);
      } catch (error) {
        console.error('Error with AIS API, falling back to mock data:', error);
        // Fall back to mock data on error
      }
    }
    */
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
  },
  {
    mmsi: '235087450',
    name: 'Serenity Dream',
    type: 'Super Yacht',
    length: 75,
    width: 12.3,
    flag: 'Malta'
  },
  {
    mmsi: '319085400',
    name: 'Royal Serenity',
    type: 'Mega Yacht',
    length: 92,
    width: 14.8,
    flag: 'Cayman Islands'
  },
  {
    mmsi: '538005451',
    name: 'Northern Explorer',
    type: 'Expedition Yacht',
    length: 68,
    width: 11.5,
    flag: 'Norway'
  },
  {
    mmsi: '232025611',
    name: 'Mediterranean Blue',
    type: 'Sailing Yacht',
    length: 38,
    width: 8.2,
    flag: 'Greece'
  },
  {
    mmsi: '273458901',
    name: 'Atlantic Voyager',
    type: 'Motor Yacht',
    length: 45,
    width: 9.0,
    flag: 'Bermuda'
  }
];

export default router;