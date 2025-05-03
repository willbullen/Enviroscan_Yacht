import fetch from 'node-fetch';

async function fetchWaypoints() {
  try {
    // First login
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const cookies = loginResponse.headers.get('set-cookie');
    
    // Then fetch waypoints with the session cookie
    const waypointsResponse = await fetch('http://localhost:3000/api/waypoints?voyageId=5', {
      headers: { 'Cookie': cookies }
    });
    
    const waypoints = await waypointsResponse.json();
    console.log(JSON.stringify(waypoints, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

fetchWaypoints();