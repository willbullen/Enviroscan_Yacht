// Script to test admin login
import fetch from 'node-fetch';

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
      }),
    });
    
    console.log(`Response status: ${response.status}`);
    
    const responseText = await response.text();
    console.log('Response content type:', response.headers.get('content-type'));
    
    if (!response.ok) {
      console.error('Login failed');
      try {
        const errorJson = JSON.parse(responseText);
        console.error('Error details:', errorJson);
      } catch (e) {
        console.error('Raw error response:', responseText);
      }
      return;
    }
    
    try {
      const data = JSON.parse(responseText);
      console.log('Login successful!');
      console.log('User data:', data);
    } catch (e) {
      console.error('Error parsing response as JSON:', e);
      console.error('Raw response:', responseText);
    }
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

testAdminLogin();