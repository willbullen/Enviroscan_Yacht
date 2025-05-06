import { Router, Request } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { IStorage } from '../storage';
import { analyzeReceiptImage, findPotentialMatches, generateExpenseRecord } from '../openai';

// Extend the session to include user ID
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

const router = Router();

// Set up multer for file uploads - store in memory
const multerStorage = multer.memoryStorage();
const upload = multer({ 
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return cb(null, false);
    }
    cb(null, true);
  }
});

export default function setupReceiptRoutes(storage: IStorage) {
  // Get all receipts for a vessel
  router.get('/receipts/:vesselId', async (req, res) => {
    try {
      // Check authentication first
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required. Please log in.' });
      }
      
      const vesselId = parseInt(req.params.vesselId);
      if (isNaN(vesselId)) {
        return res.status(400).json({ error: 'Invalid vessel ID' });
      }
      
      // Get expenses with receipts for this vessel
      const expenses = await storage.getExpensesWithReceiptsByVessel(vesselId);
      
      // Convert expenses to receipt format
      const receipts = expenses.map(expense => ({
        id: `r-${expense.id}`,
        uploadDate: expense.createdAt.toISOString(),
        filename: expense.receiptUrl ? expense.receiptUrl.split('/').pop() || 'receipt.jpg' : 'unknown.jpg',
        status: 'processed', // Default to processed since reconciled doesn't exist on the type
        extractedData: {
          date: expense.expenseDate.toISOString(),
          vendor: expense.vendorId ? `Vendor #${expense.vendorId}` : 'Unknown Vendor',
          amount: parseFloat(expense.total),
          description: expense.description || 'No description',
          category: expense.category || 'Uncategorized'
        },
        matchedExpenseId: expense.id,
        thumbnailUrl: expense.receiptUrl,
        errorMessage: ''
      }));
      
      return res.json(receipts);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch receipts', 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  // Define a route for receipt analysis
  router.post('/analyze', upload.single('receipt'), async (req, res) => {
    try {
      // Check authentication first - use the same pattern as other authenticated routes
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required. Please log in.' });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Use user ID from passport rather than session directly
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Store userId for later use
      const userId = req.user.id;

      // Check that vessel is provided
      const vesselId = parseInt(req.body.vesselId);
      if (!vesselId) {
        return res.status(400).json({ error: 'Vessel ID is required' });
      }

      // Convert file buffer to base64
      const base64Image = req.file.buffer.toString('base64');

      // Call OpenAI to analyze the receipt
      const analysisResult = await analyzeReceiptImage(base64Image);

      // Get the vessel's expenses to find potential matches
      const expenses = await storage.getExpensesByVessel(vesselId);

      // Find potential matches with existing expenses
      const potentialMatches = await findPotentialMatches(analysisResult, expenses);

      // Generate a suggested expense record
      const suggestedExpense = await generateExpenseRecord(analysisResult);
      
      // Save the image to disk for future reference
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const filename = `${randomUUID()}-${Date.now()}.jpg`;
      const filepath = path.join(uploadsDir, filename);
      
      fs.writeFileSync(filepath, req.file.buffer);
      
      // Add receipt URL to the suggested expense
      const receiptUrl = `/uploads/${filename}`;
      suggestedExpense.receiptUrl = receiptUrl;
      
      return res.json({
        analysis: analysisResult,
        potentialMatches,
        suggestedExpense,
        receiptUrl
      });
    } catch (error) {
      console.error('Error analyzing receipt:', error);
      return res.status(500).json({ 
        error: 'Failed to analyze receipt', 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Route to link a receipt to an existing expense
  router.post('/link-to-expense', async (req, res) => {
    try {
      // Check authentication first
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required. Please log in.' });
      }
      
      // Use user ID from passport rather than session directly
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userId = req.user.id;
      
      const { 
        expenseId, 
        receiptUrl, 
        addNotes = false, 
        notes 
      } = req.body;
      
      if (!expenseId || !receiptUrl) {
        return res.status(400).json({ error: 'Expense ID and receipt URL are required' });
      }
      
      // Get the existing expense
      const expense = await storage.getExpense(parseInt(expenseId));
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      
      // Update the expense with the receipt URL and optional notes
      const updateData: Record<string, any> = {
        receiptUrl,
      };
      
      // Only update notes if needed
      if (addNotes && notes) {
        updateData.notes = expense.notes ? `${expense.notes}\n${notes}` : notes;
      }
      
      const result = await storage.updateExpense(parseInt(expenseId), updateData);
      
      return res.json({ 
        success: true, 
        message: 'Receipt linked to expense successfully',
        expense: result
      });
    } catch (error) {
      console.error('Error linking receipt to expense:', error);
      return res.status(500).json({ 
        error: 'Failed to link receipt to expense', 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Route to create a new expense from receipt data
  router.post('/create-expense', async (req, res) => {
    try {
      // Check authentication first
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required. Please log in.' });
      }
      
      // Use user ID from passport rather than session directly
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userId = req.user.id;
      
      const { 
        expenseData, 
        vesselId 
      } = req.body;
      
      // Log the incoming data for debugging
      console.log("RECEIPT DEBUG - Raw request body:", JSON.stringify(req.body, null, 2));
      console.log("RECEIPT DEBUG - Raw expenseData:", JSON.stringify(expenseData, null, 2));
      
      if (!expenseData || !vesselId) {
        return res.status(400).json({ error: 'Expense data and vessel ID are required' });
      }
      
      // Create a fresh clean object with proper typing
      let expenseData_cleaned: Record<string, any> = {};
      
      // Copy all fields except for expenseDate for now
      if (typeof expenseData === 'object' && expenseData !== null) {
        Object.keys(expenseData).forEach(key => {
          if (key !== 'expenseDate') {
            expenseData_cleaned[key] = expenseData[key];
          }
        });
      }
      
      console.log("RECEIPT DEBUG - expenseData after initial cleanup:", JSON.stringify(expenseData_cleaned, null, 2));
      
      // Now handle the date specifically
      let expenseDateISO: string;
      
      if (expenseData.expenseDate) {
        try {
          console.log("RECEIPT DEBUG - Original expenseDate:", expenseData.expenseDate);
          console.log("RECEIPT DEBUG - Type of expenseDate:", typeof expenseData.expenseDate);
          
          // Handle date based on its type
          if (typeof expenseData.expenseDate === 'string') {
            const dateObj = new Date(expenseData.expenseDate);
            if (!isNaN(dateObj.getTime())) {
              expenseDateISO = dateObj.toISOString();
            } else {
              console.warn(`Invalid date string: "${expenseData.expenseDate}"`);
              expenseDateISO = new Date().toISOString();
            }
          } else if (expenseData.expenseDate instanceof Date) {
            expenseDateISO = expenseData.expenseDate.toISOString();
          } else {
            console.warn(`Unexpected expenseDate type: ${typeof expenseData.expenseDate}`);
            expenseDateISO = new Date().toISOString();
          }
        } catch (dateError) {
          console.error(`Error processing expenseDate: ${dateError}`);
          expenseDateISO = new Date().toISOString();
        }
      } else {
        expenseDateISO = new Date().toISOString();
      }
      
      console.log("RECEIPT DEBUG - Final expenseDateISO:", expenseDateISO);
      
      // Required fields for an expense record
      // The database expects a Date object for expenseDate, not an ISO string
      const requiredFields = {
        description: expenseData.description || 'Receipt Expense',
        total: expenseData.total?.toString() || '0',
        status: expenseData.status || 'pending',
        category: expenseData.category || 'Other',
        paymentMethod: expenseData.paymentMethod || 'Unknown',
        expenseDate: new Date(expenseDateISO), // Convert ISO string to Date object
        accountId: expenseData.accountId || 1, // Default account ID
      };
      
      // Combine all the data
      const newExpense = {
        ...expenseData_cleaned,
        ...requiredFields,
        vesselId: parseInt(vesselId, 10),
        createdById: userId, 
        createdAt: new Date(), // Using Date objects directly instead of ISO strings
        updatedAt: new Date()
      };
      
      console.log("RECEIPT DEBUG - Final expense object:", JSON.stringify(newExpense, null, 2));
      
      // Create the new expense
      const createdExpense = await storage.createExpense(newExpense);
      
      return res.json({ 
        success: true, 
        message: 'Expense created successfully from receipt',
        expense: createdExpense
      });
    } catch (error) {
      console.error('Error creating expense from receipt:', error);
      return res.status(500).json({ 
        error: 'Failed to create expense from receipt', 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  return router;
}