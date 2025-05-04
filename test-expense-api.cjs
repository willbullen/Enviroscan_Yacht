const fetch = require('node-fetch');

async function main() {
  // First, log in
  console.log('Logging in...');
  const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    }),
    credentials: 'include'
  });

  if (!loginResponse.ok) {
    console.error('Login failed:', await loginResponse.text());
    return;
  }

  const cookies = loginResponse.headers.get('set-cookie');
  console.log('Login successful. Cookies:', cookies);

  // Now query the expenses API
  console.log('\nFetching expenses...');
  const expensesResponse = await fetch('http://localhost:5000/api/expenses/vessel/6', {
    headers: {
      'Cookie': cookies
    }
  });

  if (!expensesResponse.ok) {
    console.error('Error fetching expenses:', await expensesResponse.text());
    return;
  }

  const expenses = await expensesResponse.json();
  console.log('Expenses:', JSON.stringify(expenses, null, 2));
}

main().catch(err => console.error('Error:', err));