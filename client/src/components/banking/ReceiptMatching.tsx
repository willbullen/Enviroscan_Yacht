import React, { useState } from "react";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { FileUploader } from "@/components/ui/file-uploader";
import { AlertCircle, FileCheck, FileText, Image, CheckCircle, Upload } from "lucide-react";
import { format } from "date-fns";

// Types
interface Expense {
  id: number;
  vesselId: number;
  accountId: number;
  amount: number;
  currency: string;
  description: string;
  purchaseDate: string;
  category: string;
  vendor: string;
  receipt?: string;
  status: "pending" | "matched" | "unmatched";
  transactionId?: number;
}

interface ReceiptAnalysisResult {
  vendor: string;
  amount: number;
  currency: string;
  date: string;
  items: string[];
  category: string;
  confidence: number;
  description: string;
}

interface ExpenseWithParsedReceipt extends Expense {
  parsedReceipt?: ReceiptAnalysisResult;
}

const ReceiptMatching: React.FC = () => {
  const { settings } = useSystemSettings();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseWithParsedReceipt | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ReceiptAnalysisResult | null>(null);
  
  // Mock data for demo
  const demoExpenses: ExpenseWithParsedReceipt[] = [
    {
      id: 1,
      vesselId: 1,
      accountId: 1,
      amount: 1250.00,
      currency: "USD",
      description: "Engine Parts",
      purchaseDate: "2025-04-28",
      category: "Maintenance",
      vendor: "MTU Supplies Ltd.",
      receipt: "/uploads/receipts/mtu-parts.jpg",
      status: "unmatched",
    },
    {
      id: 2,
      vesselId: 1,
      accountId: 1,
      amount: 350.50,
      currency: "EUR",
      description: "Cleaning Supplies",
      purchaseDate: "2025-04-29",
      category: "Supplies",
      vendor: "Marine Cleaning Co.",
      receipt: "/uploads/receipts/cleaning-supplies.jpg",
      status: "matched",
      transactionId: 2
    }
  ];

  // Mock data for expenses without receipts
  const expensesWithoutReceipts: ExpenseWithParsedReceipt[] = [
    {
      id: 3,
      vesselId: 1,
      accountId: 2,
      amount: 2750.00,
      currency: "GBP",
      description: "Crew Uniforms",
      purchaseDate: "2025-05-01",
      category: "Crew",
      vendor: "Yacht Uniforms Inc.",
      status: "unmatched"
    },
    {
      id: 4,
      vesselId: 1,
      accountId: 1,
      amount: 150.25,
      currency: "USD",
      description: "Office Supplies",
      purchaseDate: "2025-05-02",
      category: "Administrative",
      vendor: "Office Depot",
      status: "unmatched"
    }
  ];

  // Format currency
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Handle file upload
  const handleFileUpload = async (files: File[]) => {
    if (!selectedExpense || !files.length) return;
    
    const file = files[0];
    
    // Check if AI receipt matching is disabled
    if (!settings.aiReceiptMatching) {
      // Simply update the expense with the receipt
      toast({
        title: "Receipt Uploaded",
        description: "Receipt was attached to the expense (AI analysis disabled)",
      });
      setIsDialogOpen(false);
      return;
    }
    
    // Start analyzing with AI
    setIsAnalyzing(true);
    
    if (settings.useMockBankingData) {
      // Simulate AI analysis in demo mode
      setTimeout(() => {
        const mockResult: ReceiptAnalysisResult = {
          vendor: selectedExpense.vendor,
          amount: selectedExpense.amount,
          currency: selectedExpense.currency,
          date: selectedExpense.purchaseDate,
          items: ["Item 1", "Item 2", "Item 3"],
          category: selectedExpense.category,
          confidence: 0.92,
          description: selectedExpense.description
        };
        
        setAnalysisResult(mockResult);
        setIsAnalyzing(false);
        
        toast({
          title: "Receipt Analyzed",
          description: "AI has successfully analyzed the receipt (demo mode)",
        });
      }, 2000);
      
      return;
    }
    
    try {
      // In a real app, this would use OpenAI to analyze the receipt
      const formData = new FormData();
      formData.append('receipt', file);
      formData.append('expenseId', selectedExpense.id.toString());
      
      const response = await fetch('/api/receipts/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        setAnalysisResult(result);
        
        toast({
          title: "Receipt Analyzed",
          description: "AI has successfully analyzed the receipt",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Analysis Failed",
          description: errorData.message || "Failed to analyze receipt",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during receipt analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle applying the analysis results
  const applyAnalysisResults = async () => {
    if (!selectedExpense || !analysisResult) return;
    
    if (settings.useMockBankingData) {
      // Simulate updating the expense in demo mode
      toast({
        title: "Expense Updated",
        description: "Expense details updated from receipt analysis (demo mode)",
      });
      setIsDialogOpen(false);
      setAnalysisResult(null);
      return;
    }
    
    try {
      // In a real app, this would update the expense with AI-extracted details
      const response = await fetch(`/api/expenses/${selectedExpense.id}/update-from-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisResult),
      });
      
      if (response.ok) {
        toast({
          title: "Expense Updated",
          description: "Expense details updated from receipt analysis",
        });
        setIsDialogOpen(false);
        setAnalysisResult(null);
      } else {
        const errorData = await response.json();
        toast({
          title: "Update Failed",
          description: errorData.message || "Failed to update expense",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating the expense",
        variant: "destructive",
      });
    }
  };
  
  // Open upload dialog
  const openUploadDialog = (expense: ExpenseWithParsedReceipt) => {
    setSelectedExpense(expense);
    setAnalysisResult(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h3 className="text-lg font-medium">Receipt Processing & AI Analysis</h3>
        
        <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
          <Button>
            <Upload className="mr-2 h-4 w-4" /> Upload New Receipt
          </Button>
        </div>
      </div>

      {!settings.aiReceiptMatching && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>AI Receipt Analysis Disabled:</strong> Enable AI receipt matching in Settings to automatically extract details from receipts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expenses with Receipts */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses with Receipts</CardTitle>
          <CardDescription>
            Expenses that have receipts attached. AI will analyze these to extract details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demoExpenses.map((expense) => (
              <Card key={expense.id} className="overflow-hidden">
                <div className="relative h-40 bg-muted">
                  {expense.receipt ? (
                    <img
                      src={expense.receipt}
                      alt={`Receipt for ${expense.description}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FileText className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant={expense.status === 'matched' ? 'default' : 'outline'}>
                      {expense.status === 'matched' ? 'Matched' : 'Unmatched'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h4 className="font-medium">{expense.description}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatAmount(expense.amount, expense.currency)} • {formatDate(expense.purchaseDate)}
                  </p>
                  <p className="text-sm">{expense.vendor}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <Button variant="outline" size="sm" className="w-full">
                    <Image className="mr-2 h-4 w-4" /> View Receipt
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expenses Without Receipts */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses Without Receipts</CardTitle>
          <CardDescription>
            Expenses that need receipts attached for documentation and reconciliation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expensesWithoutReceipts.map((expense) => (
              <Card key={expense.id} className="overflow-hidden">
                <div className="relative h-40 bg-muted flex items-center justify-center">
                  <FileText className="h-16 w-16 text-muted-foreground/30" />
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline">No Receipt</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h4 className="font-medium">{expense.description}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatAmount(expense.amount, expense.currency)} • {formatDate(expense.purchaseDate)}
                  </p>
                  <p className="text-sm">{expense.vendor}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <Button size="sm" className="w-full" onClick={() => openUploadDialog(expense)}>
                    <Upload className="mr-2 h-4 w-4" /> Upload Receipt
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Receipt Upload & Analysis Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Receipt</DialogTitle>
            <DialogDescription>
              {settings.aiReceiptMatching
                ? "Upload a receipt and our AI will analyze it to extract details."
                : "Upload a receipt to attach to this expense."}
            </DialogDescription>
          </DialogHeader>
          
          {selectedExpense && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <div className="text-sm font-medium">Expense Details</div>
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-muted/50">
                  <div>
                    <span className="text-sm text-muted-foreground">Description:</span>
                    <div className="font-medium">{selectedExpense.description}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <div className="font-medium">{formatAmount(selectedExpense.amount, selectedExpense.currency)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Date:</span>
                    <div className="font-medium">{formatDate(selectedExpense.purchaseDate)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Vendor:</span>
                    <div className="font-medium">{selectedExpense.vendor}</div>
                  </div>
                </div>
              </div>
              
              {!analysisResult ? (
                <div className="space-y-4">
                  <div className="text-sm font-medium">Upload Receipt</div>
                  <FileUploader 
                    onUpload={handleFileUpload}
                    acceptedFileTypes={["image/jpeg", "image/png", "application/pdf"]}
                    maxFiles={1}
                    maxSize={5 * 1024 * 1024} // 5MB
                  />
                  
                  {isAnalyzing && (
                    <div className="flex flex-col items-center justify-center p-4">
                      <Spinner size="lg" className="mb-2" />
                      <p className="text-sm text-center text-muted-foreground">
                        {settings.aiReceiptMatching
                          ? "AI is analyzing your receipt..."
                          : "Processing your receipt..."}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Analysis Results</div>
                    <Badge variant="outline" className="ml-2">
                      {Math.round(analysisResult.confidence * 100)}% Confidence
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-green-50">
                    <div>
                      <span className="text-sm text-muted-foreground">Vendor:</span>
                      <div className="font-medium">{analysisResult.vendor}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Amount:</span>
                      <div className="font-medium">{formatAmount(analysisResult.amount, analysisResult.currency)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Date:</span>
                      <div className="font-medium">{formatDate(analysisResult.date)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Category:</span>
                      <div className="font-medium">{analysisResult.category}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">Items:</span>
                      <div className="font-medium">
                        <ul className="list-disc pl-5 text-sm">
                          {analysisResult.items.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            {analysisResult ? (
              <>
                <Button variant="outline" onClick={() => setAnalysisResult(null)}>
                  Try Again
                </Button>
                <Button onClick={applyAnalysisResults}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Apply Changes
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReceiptMatching;