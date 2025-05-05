import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Interface for receipt analysis results
export interface ReceiptAnalysisResult {
  vendor: string;
  date: string;
  total: number;
  items: {
    description: string;
    amount: number;
  }[];
  category?: string;
  receiptNumber?: string;
  taxAmount?: number;
  currency?: string;
  paymentMethod?: string;
  suspiciousElements?: string[];
}

/**
 * Analyzes a receipt image to extract relevant information
 * @param base64Image The receipt image in base64 format
 * @returns Structured data extracted from the receipt
 */
export async function analyzeReceiptImage(base64Image: string): Promise<ReceiptAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are an expert receipt analyzer for a marine vessel expense management system. " +
            "Extract the following information from the receipt image: " +
            "1. Vendor name " +
            "2. Date of purchase " +
            "3. Total amount " +
            "4. Individual items/services with their costs " +
            "5. Receipt/Invoice number if available " +
            "6. Tax amount if specified " +
            "7. Currency " +
            "8. Payment method if mentioned " +
            "9. Suggest an expense category (Fuel, Provisions, Maintenance, Crew Salaries, Insurance, Dockage, Repairs, Supplies, Communications, Travel, Entertainment, Administration, Medical, Safety, Training, Other) " +
            "10. Flag any suspicious elements (unusual amounts, unclear items, etc.) " +
            "Respond with valid JSON in this exact format: " +
            "{ " +
            "\"vendor\": string, " +
            "\"date\": string (YYYY-MM-DD), " +
            "\"total\": number, " +
            "\"items\": [{ \"description\": string, \"amount\": number }], " +
            "\"receiptNumber\": string (optional), " +
            "\"taxAmount\": number (optional), " +
            "\"currency\": string (optional), " +
            "\"paymentMethod\": string (optional), " +
            "\"category\": string (one of the predefined categories), " +
            "\"suspiciousElements\": string[] (optional list of concerns) " +
            "}"
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this receipt image and extract all relevant information for expense tracking:"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as ReceiptAnalysisResult;
  } catch (error) {
    console.error('Error analyzing receipt:', error);
    throw new Error('Failed to analyze receipt image');
  }
}

/**
 * Compares extracted receipt data with existing expenses to find potential matches
 * @param receiptData The extracted receipt data
 * @param expenses Array of existing expenses
 * @returns Array of potential matches with confidence scores
 */
export async function findPotentialMatches(
  receiptData: ReceiptAnalysisResult, 
  expenses: any[]
): Promise<{expenseId: number, confidence: number, reasons: string[]}[]> {
  // Filter expenses to only include those within a reasonable date range
  // and with similar amounts to improve matching accuracy
  try {
    const receiptDate = new Date(receiptData.date);
    const receiptTotal = receiptData.total;
    
    // First do some basic filtering to reduce the number of candidates
    // Look for expenses that are within 7 days and with total within 10% of receipt
    const potentialMatches = expenses.filter(expense => {
      const expenseDate = new Date(expense.expenseDate);
      const daysDifference = Math.abs((expenseDate.getTime() - receiptDate.getTime()) / (1000 * 3600 * 24));
      
      const expenseAmount = parseFloat(expense.total);
      const amountDifference = Math.abs(expenseAmount - receiptTotal);
      const percentDifference = amountDifference / receiptTotal;
      
      return daysDifference <= 7 && percentDifference <= 0.1;
    });
    
    if (potentialMatches.length === 0) {
      return [];
    }
    
    // For the remaining candidates, use GPT to evaluate and score matches
    const matchResults = await Promise.all(potentialMatches.map(async (expense) => {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: 
              "You are an expert at matching receipts to expense records. " +
              "Compare the receipt data with the expense record and determine the likelihood they represent the same transaction. " +
              "Consider factors like vendor name similarity, date proximity, amount match, and description relevance. " +
              "Provide a confidence score from 0 to 1 (0 = definitely not a match, 1 = definitely a match) " +
              "and list specific reasons supporting your assessment."
          },
          {
            role: "user",
            content: `Receipt data: ${JSON.stringify(receiptData, null, 2)}\n\nExpense record: ${JSON.stringify({
              id: expense.id,
              date: expense.expenseDate,
              amount: expense.total,
              description: expense.description,
              vendor: expense.vendorName, // This may come from a join or related data
              category: expense.category,
              status: expense.status
            }, null, 2)}`
          }
        ],
        response_format: { type: "json_object" },
      });
      
      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        expenseId: expense.id,
        confidence: result.confidence || 0,
        reasons: result.reasons || []
      };
    }));
    
    // Sort by confidence score (highest first)
    return matchResults.sort((a, b) => b.confidence - a.confidence);
  } catch (error) {
    console.error('Error finding potential matches:', error);
    return [];
  }
}

/**
 * Generates an expense record from receipt data
 * @param receiptData The extracted receipt data
 * @returns Formatted expense record ready for database insertion
 */
export async function generateExpenseRecord(receiptData: ReceiptAnalysisResult): Promise<any> {
  // Format the receipt data into a structure that matches our expense schema
  try {
    // Convert the string date to a proper Date object with error handling
    // If the date format is invalid, fall back to today's date
    let expenseDate;
    try {
      expenseDate = new Date(receiptData.date);
      // Check if the date is valid
      if (isNaN(expenseDate.getTime())) {
        console.warn(`Invalid date format received: "${receiptData.date}", using current date instead`);
        expenseDate = new Date();
      }
    } catch (error) {
      console.warn(`Error parsing date "${receiptData.date}": ${error}, using current date instead`);
      expenseDate = new Date();
    }
    
    return {
      description: `${receiptData.vendor} - ${receiptData.items.length} items`,
      expenseDate: expenseDate.toISOString(), // Ensure properly formatted date string
      total: receiptData.total.toString(),
      paymentMethod: receiptData.paymentMethod || 'Unknown',
      referenceNumber: receiptData.receiptNumber || '',
      status: 'pending',
      category: receiptData.category || 'Other',
      notes: receiptData.suspiciousElements ? 
        `AI Flags: ${receiptData.suspiciousElements.join(', ')}` : 
        'Created from receipt via AI analysis'
    };
  } catch (error) {
    console.error('Error generating expense record:', error);
    // Return a minimal valid record with default values if something goes wrong
    return {
      description: receiptData.vendor ? `${receiptData.vendor} receipt` : 'Receipt analysis',
      expenseDate: new Date().toISOString(),
      total: receiptData.total?.toString() || '0',
      paymentMethod: 'Unknown',
      referenceNumber: '',
      status: 'pending',
      category: 'Other',
      notes: 'Error occurred during receipt analysis'
    };
  }
}

/**
 * Analyzes expense descriptions and suggests appropriate categories
 * @param expenseDescription The expense description text
 * @param amount The expense amount
 * @returns Object with suggested category and confidence score
 */
export async function categorizeExpense(
  expenseDescription: string,
  amount: number
): Promise<{ category: string; confidence: number; explanation: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are an expert financial categorization system for maritime vessels. " +
            "Your task is to categorize expense descriptions into one of the following categories: " +
            "- FUE: Fuel and energy costs " +
            "- MNT: Maintenance and repairs " +
            "- PRV: Provisions and supplies " +
            "- CRW: Crew salaries and benefits " +
            "- INS: Insurance " +
            "- DOC: Dockage and port fees " +
            "- COM: Communications and technology " +
            "- TRV: Travel and transportation " +
            "- ENT: Entertainment and guest expenses " +
            "- ADM: Administrative and legal " +
            "- MED: Medical supplies and services " +
            "- SAF: Safety equipment and compliance " +
            "- TRN: Training and certification " +
            "- OTH: Other expenses " +
            "\n\n" +
            "Respond with valid JSON in this exact format: " +
            "{ " +
            "\"category\": string (one of the category codes above), " +
            "\"confidence\": number (between 0 and 1, indicating confidence level), " +
            "\"explanation\": string (brief explanation of why this category was chosen) " +
            "}"
        },
        {
          role: "user",
          content: `Please categorize the following expense: "${expenseDescription}" with amount $${amount.toFixed(2)}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      category: result.category || 'OTH',
      confidence: result.confidence || 0,
      explanation: result.explanation || 'No explanation provided'
    };
  } catch (error) {
    console.error('Error categorizing expense:', error);
    return {
      category: 'OTH',
      confidence: 0,
      explanation: 'Error during categorization'
    };
  }
}

/**
 * Batch categorizes multiple expenses at once
 * @param expenses Array of expenses with descriptions and amounts
 * @returns Array of categorization results
 */
export async function batchCategorizeExpenses(
  expenses: Array<{ id: number; description: string; amount: number }>
): Promise<Array<{ id: number; category: string; confidence: number; explanation: string }>> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are an expert financial categorization system for maritime vessels. " +
            "Your task is to categorize multiple expense descriptions into the following categories: " +
            "- FUE: Fuel and energy costs " +
            "- MNT: Maintenance and repairs " +
            "- PRV: Provisions and supplies " +
            "- CRW: Crew salaries and benefits " +
            "- INS: Insurance " +
            "- DOC: Dockage and port fees " +
            "- COM: Communications and technology " +
            "- TRV: Travel and transportation " +
            "- ENT: Entertainment and guest expenses " +
            "- ADM: Administrative and legal " +
            "- MED: Medical supplies and services " +
            "- SAF: Safety equipment and compliance " +
            "- TRN: Training and certification " +
            "- OTH: Other expenses " +
            "\n\n" +
            "Respond with valid JSON in this exact format: " +
            "[ " +
            "  { " +
            "    \"id\": number (matching the input expense id), " +
            "    \"category\": string (one of the category codes above), " +
            "    \"confidence\": number (between 0 and 1, indicating confidence level), " +
            "    \"explanation\": string (brief explanation of why this category was chosen) " +
            "  }, " +
            "  ... " +
            "]"
        },
        {
          role: "user",
          content: `Please categorize the following expenses:\n\n${JSON.stringify(expenses, null, 2)}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const results = JSON.parse(response.choices[0].message.content || '[]');
    if (!Array.isArray(results)) {
      throw new Error('Invalid response format from categorization service');
    }
    
    return results.map(result => ({
      id: result.id,
      category: result.category || 'OTH',
      confidence: result.confidence || 0,
      explanation: result.explanation || 'No explanation provided'
    }));
  } catch (error) {
    console.error('Error batch categorizing expenses:', error);
    // Return a fallback with default values
    return expenses.map(expense => ({
      id: expense.id,
      category: 'OTH',
      confidence: 0,
      explanation: 'Error during batch categorization'
    }));
  }
}

export default {
  analyzeReceiptImage,
  findPotentialMatches,
  generateExpenseRecord,
  categorizeExpense,
  batchCategorizeExpenses
};