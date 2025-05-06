// Using dynamic import for ESM modules
async function testBankingApi() {
  const { default: fetch } = await import('node-fetch');
  const { CookieJar } = await import('tough-cookie');
  const { default: fetchCookie } = await import('fetch-cookie');
  
  try {
    // Create a cookie jar for storing cookies
    const jar = new CookieJar();
    const fetchWithCookies = fetchCookie(fetch, jar);
    
    // First login to get authentication
    const loginResponse = await fetchWithCookies('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'adminpassword'
      })
    });
    
    console.log('Login response status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.error('Login failed:', errorData);
      return;
    }
    
    // Cookies are automatically handled by the cookie jar
    // Now try to fetch banking transactions for vessel 6
    const transactionsResponse = await fetchWithCookies('http://localhost:5000/api/banking/transactions/vessel/6', {
      method: 'GET'
    });
    
    console.log('Transactions API response status:', transactionsResponse.status);
    
    if (!transactionsResponse.ok) {
      try {
        const errorData = await transactionsResponse.text();
        console.error('Error fetching transactions:', errorData);
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }
      return;
    }
    
    const data = await transactionsResponse.json();
    console.log('Banking transactions data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error during API test:', error);
  }
}

testBankingApi();