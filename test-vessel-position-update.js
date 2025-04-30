import fetch from 'node-fetch';

// This script tests the vessel position update process for AIS-tracked vessels
// It will update the position of a vessel in the database and verify the changes
async function testVesselPositionUpdate() {
  try {
    console.log('Testing vessel position update process');

    // 1. First, get current vessels to see what MMSIs we have
    console.log('\n1. Fetching current vessels...');
    const vesselsResponse = await fetch('http://localhost:5000/api/marine/fleet-vessels');
    const vessels = await vesselsResponse.json();
    
    console.log(`Found ${vessels.length} vessels:`);
    vessels.forEach(vessel => {
      console.log(`- ${vessel.name} (ID: ${vessel.id}, MMSI: ${vessel.mmsi || 'Not set'})`);
      if (vessel.latitude && vessel.longitude) {
        console.log(`  Current position: ${vessel.latitude}, ${vessel.longitude}`);
      } else {
        console.log('  No position data');
      }
    });

    // Find a vessel with MMSI to test with
    const testVessel = vessels.find(v => v.mmsi);
    
    if (!testVessel) {
      console.log('\nNo vessels with MMSI found for testing. Please add MMSI to at least one vessel.');
      return;
    }

    console.log(`\n2. Selected test vessel: ${testVessel.name} (MMSI: ${testVessel.mmsi})`);
    
    // 3. Manually update vessel position using our new endpoint
    console.log('\n3. Manually updating vessel position...');
    
    // Generate random position data for the test
    const testLat = 36.14 + (Math.random() * 0.1);
    const testLon = 14.23 + (Math.random() * 0.1);
    const testHeading = Math.floor(Math.random() * 360);
    const testSpeed = 5 + (Math.random() * 10);
    
    console.log(`Generated test position data:`);
    console.log(`- Latitude: ${testLat.toFixed(6)}`);
    console.log(`- Longitude: ${testLon.toFixed(6)}`);
    console.log(`- Heading: ${testHeading}`);
    console.log(`- Speed: ${testSpeed.toFixed(2)}`);
    
    // Send the position update
    const updateResponse = await fetch('http://localhost:5000/api/marine/update-vessel-position', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mmsi: testVessel.mmsi,
        latitude: testLat,
        longitude: testLon,
        heading: testHeading,
        speed: testSpeed
      })
    });
    
    const updateResult = await updateResponse.json();
    
    if (!updateResponse.ok) {
      console.log(`❌ FAIL: Failed to update vessel position: ${JSON.stringify(updateResult)}`);
      return;
    }
    
    console.log(`Successfully updated position for vessel ${updateResult.vessel.name}:`);
    
    // 4. Wait for a moment to allow for DB updates
    console.log('\n4. Waiting 5 seconds for database updates...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 5. Check if vessel in database has updated position
    console.log('\n5. Checking if vessel position was updated in database...');
    const updatedVesselsResponse = await fetch('http://localhost:5000/api/marine/fleet-vessels');
    const updatedVessels = await updatedVesselsResponse.json();
    
    const updatedTestVessel = updatedVessels.find(v => v.id === testVessel.id);
    
    if (updatedTestVessel.latitude && updatedTestVessel.longitude) {
      console.log(`Updated position for ${updatedTestVessel.name}:`);
      console.log(`- Latitude: ${updatedTestVessel.latitude}`);
      console.log(`- Longitude: ${updatedTestVessel.longitude}`);
      console.log(`- Heading: ${updatedTestVessel.heading || 'Not updated'}`);
      console.log(`- Speed: ${updatedTestVessel.speed || 'Not updated'}`);
      
      const positionChanged = 
        updatedTestVessel.latitude !== testVessel.latitude ||
        updatedTestVessel.longitude !== testVessel.longitude;
        
      if (positionChanged) {
        console.log('\n✅ SUCCESS: Vessel position was updated in database!');
      } else {
        console.log('\n❌ FAIL: Vessel position was not updated in database.');
      }
    } else {
      console.log(`\n❌ FAIL: No position data found for ${updatedTestVessel.name} after update.`);
    }
    
  } catch (error) {
    console.error('Error testing vessel position update:', error);
  }
}

testVesselPositionUpdate();