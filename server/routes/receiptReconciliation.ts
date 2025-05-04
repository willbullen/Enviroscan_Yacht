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
      
      if (!expenseData || !vesselId) {
        return res.status(400).json({ error: 'Expense data and vessel ID are required' });
      }
      
      // Add vessel ID and user ID to the expense data
      // Also ensure the expenseDate is a properly formatted ISO string
      let expenseData_fixed = { ...expenseData };
      
      // Make sure expenseDate is properly formatted if it exists
      if (expenseData_fixed.expenseDate) {
        try {
          // Try to convert expenseDate to a proper Date object if it's not already
          const expenseDate = new Date(expenseData_fixed.expenseDate);
          // Check if date is valid
          if (isNaN(expenseDate.getTime())) {
            console.warn(`Invalid expenseDate received: "${expenseData_fixed.expenseDate}", using current date`);
            expenseData_fixed.expenseDate = new Date().toISOString();
          } else {
            // Format as ISO string if valid
            expenseData_fixed.expenseDate = expenseDate.toISOString();
          }
        } catch (dateError) {
          console.warn(`Error processing expenseDate: ${dateError}, using current date`);
          expenseData_fixed.expenseDate = new Date().toISOString();
        }
      } else {
        // If no expenseDate provided, use current date
        expenseData_fixed.expenseDate = new Date().toISOString();
      }
      
      const newExpense = {
        ...expenseData_fixed,
        vesselId,
        createdById: userId, // Use the userId from passport
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log("Creating expense with data:", JSON.stringify(newExpense, null, 2));
      
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