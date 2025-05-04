import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { IStorage } from '../storage';
import { analyzeReceiptImage, findPotentialMatches, generateExpenseRecord } from '../openai';

const router = Router();

// Set up multer for file uploads - store in memory
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

export default function setupReceiptRoutes(storage: IStorage) {
  // Define a route for receipt analysis
  router.post('/analyze', upload.single('receipt'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Check for user session
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

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
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
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
      const expense = await storage.getExpenseById(expenseId);
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      
      // Update the expense with the receipt URL and optional notes
      const updatedExpense = {
        ...expense,
        receiptUrl,
        notes: addNotes && notes ? (expense.notes ? `${expense.notes}\n${notes}` : notes) : expense.notes
      };
      
      await storage.updateExpense(expenseId, updatedExpense);
      
      return res.json({ 
        success: true, 
        message: 'Receipt linked to expense successfully',
        expense: updatedExpense
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
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const { 
        expenseData, 
        vesselId 
      } = req.body;
      
      if (!expenseData || !vesselId) {
        return res.status(400).json({ error: 'Expense data and vessel ID are required' });
      }
      
      // Add vessel ID and user ID to the expense data
      const newExpense = {
        ...expenseData,
        vesselId,
        createdById: req.session.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
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