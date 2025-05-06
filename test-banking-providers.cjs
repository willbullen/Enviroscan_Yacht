// Test Banking Providers and Connections
const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const ws = require('ws');
const { neonConfig } = require('@neondatabase/serverless');

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function checkAndCreateData() {
  try {
    console.log("Connecting to database...");
    
    // Check for existing banking providers
    const providers = await db.execute(
      `SELECT * FROM banking_providers WHERE vessel_id IN (4, 5, 6) LIMIT 5`
    );
    
    if (providers.length > 0) {
      console.log("Existing banking providers found:");
      console.table(providers);
    } else {
      console.log("No banking providers found. Creating test data...");
      
      // Insert sample banking providers for different vessels using correct schema
      await db.execute(`
        INSERT INTO banking_providers (name, code, logo_url, api_endpoint, is_active, vessel_id, created_at, updated_at)
        VALUES 
        ('Revolut Business', 'REVOLUT', 'https://logos.eastwindyachts.com/revolut.svg', 'https://api.revolut.com/business', true, 4, now(), now()),
        ('Centtrip Maritime', 'CENTTRIP', 'https://logos.eastwindyachts.com/centtrip.svg', 'https://api.centtrip.com/v1', true, 5, now(), now()),
        ('HSBC Corporate', 'HSBC', 'https://logos.eastwindyachts.com/hsbc.svg', 'https://api.hsbc.com/corporate', true, 6, now(), now())
      `);
      
      console.log("Banking providers created.");
      
      // Get the IDs of the providers we just created
      const newProvidersResult = await db.execute(
        `SELECT * FROM banking_providers WHERE vessel_id IN (4, 5, 6)`
      );
      
      const newProviders = newProvidersResult.rows || [];
      
      console.log("Created providers:");
      console.table(newProviders);
      
      // Create bank connections for each provider
      for (const provider of newProviders) {
        await db.execute(`
          INSERT INTO bank_connections (provider_id, vessel_id, connection_status, last_sync_at, credentials, connection_details, created_at, updated_at)
          VALUES 
          (${provider.id}, ${provider.vessel_id}, 'active', now(), '{"encrypted": "credential_placeholder_${provider.id}"}', '{"name": "${provider.name} Connection", "account_type": "business"}', now(), now())
        `);
      }
      
      console.log("Bank connections created.");
      
      // Get the bank connections we just created
      const connectionsResult = await db.execute(
        `SELECT * FROM bank_connections`
      );
      
      const connections = connectionsResult.rows || [];
      
      console.log("Created connections:");
      console.table(connections);
    }
    
    // Check for existing transaction reconciliations
    const reconciliationsResult = await db.execute(
      `SELECT * FROM transaction_reconciliations LIMIT 5`
    );
    
    const reconciliations = reconciliationsResult.rows || [];
    
    if (reconciliations.length > 0) {
      console.log("Existing transaction reconciliations found:");
      console.table(reconciliations);
    } else {
      console.log("No transaction reconciliations found.");
      
      // Get some transactions and expenses to link
      const transactionsResult = await db.execute(
        `SELECT * FROM transactions LIMIT 3`
      );
      
      const expensesResult = await db.execute(
        `SELECT * FROM expenses LIMIT 3`
      );
      
      const transactions = transactionsResult.rows || [];
      const expenses = expensesResult.rows || [];
      
      if (transactions.length > 0 && expenses.length > 0) {
        // Create sample reconciliations
        for (let i = 0; i < Math.min(transactions.length, expenses.length); i++) {
          await db.execute(`
            INSERT INTO transaction_reconciliations (transaction_id, expense_id, status, match_confidence, reconciled_by, reconciled_at, notes, created_at, updated_at)
            VALUES 
            (${transactions[i].id}, ${expenses[i].id}, 'matched', 0.95, 5, now(), 'Automatically matched transaction with expense', now(), now())
          `);
        }
        
        console.log("Transaction reconciliations created.");
        
        // Get the reconciliations we just created
        const newReconciliationsResult = await db.execute(
          `SELECT * FROM transaction_reconciliations`
        );
        
        const newReconciliations = newReconciliationsResult.rows || [];
        
        console.log("Created reconciliations:");
        console.table(newReconciliations);
      } else {
        console.log("Not enough transactions or expenses to create reconciliations.");
      }
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkAndCreateData();