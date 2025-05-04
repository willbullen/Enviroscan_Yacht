import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, FileCheck, AlertCircle, Receipt, Check, X, ZoomIn, Link } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVessel } from "@/contexts/VesselContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface ExpenseMatch {
  expenseId: number;
  confidence: number;
  reasons: string[];
  expense?: any;
}

interface ReceiptAnalysis {
  vendor: string;
  date: string;
  total: number;
  items: { description: string; amount: number }[];
  category?: string;
  receiptNumber?: string;
  taxAmount?: number;
  currency?: string;
  paymentMethod?: string;
  suspiciousElements?: string[];
}

interface ReceiptReconciliationDialogProps {
  expenses: any[];
  onSuccess?: () => void;
}

const ReceiptReconciliationDialog: React.FC<ReceiptReconciliationDialogProps> = ({ 
  expenses,
  onSuccess 
}) => {
  const { toast } = useToast();
  const { currentVessel } = useVessel();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "analysis" | "match" | "create">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ReceiptAnalysis | null>(null);
  const [matches, setMatches] = useState<ExpenseMatch[]>([]);
  const [suggestedExpense, setSuggestedExpense] = useState<any | null>(null);
  const [matchOption, setMatchOption] = useState<"existing" | "new">("existing");
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);
  const [addNotes, setAddNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const resetState = () => {
    setFile(null);
    setStep("upload");
    setIsUploading(false);
    setReceiptUrl(null);
    setAnalysis(null);
    setMatches([]);
    setSuggestedExpense(null);
    setMatchOption("existing");
    setSelectedExpenseId(null);
    setAddNotes(false);
    setNotes("");
    setIsProcessing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file || !currentVessel) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("receipt", file);
    formData.append("vesselId", currentVessel.id.toString());

    try {
      const result = await fetch("/api/receipts/analyze", {
        method: "POST",
        body: formData,
        credentials: "include" // Add this to include session cookies
      }).then(res => {
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Authentication required. Please log in first.");
          } else {
            throw new Error(`Error: ${res.status}`);
          }
        }
        return res.json();
      });

      setReceiptUrl(result.receiptUrl);
      setAnalysis(result.analysis);
      
      // Process potential matches with corresponding expense data
      const matchesWithData = result.potentialMatches.map((match: ExpenseMatch) => {
        const matchedExpense = expenses.find(exp => exp.id === match.expenseId);
        return {
          ...match,
          expense: matchedExpense
        };
      });
      
      setMatches(matchesWithData);
      setSuggestedExpense(result.suggestedExpense);
      
      // If we have matches, go to matching step, otherwise offer to create new expense
      if (matchesWithData.length > 0) {
        setStep("match");
        setMatchOption("existing");
        setSelectedExpenseId(matchesWithData[0].expenseId);
      } else {
        setStep("create");
        setMatchOption("new");
      }
    } catch (error) {
      console.error("Error analyzing receipt:", error);
      toast({
        title: "Error",
        description: "Failed to analyze receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLinkToExpense = async () => {
    if (!selectedExpenseId || !receiptUrl) return;
    
    setIsProcessing(true);
    
    try {
      const payload = {
        expenseId: selectedExpenseId,
        receiptUrl,
        addNotes,
        notes: addNotes ? notes : ""
      };
      
      await apiRequest("/api/receipts/link-to-expense", "POST", payload, {
        credentials: "include" // Add credentials for this API request
      });
      
      toast({
        title: "Success",
        description: "Receipt linked to expense successfully.",
        variant: "default",
      });
      
      // Invalidate expense queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/expenses/vessel/${currentVessel?.id}`] });
      
      setOpen(false);
      resetState();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error linking receipt to expense:", error);
      toast({
        title: "Error",
        description: "Failed to link receipt to expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateExpense = async () => {
    if (!suggestedExpense || !currentVessel) return;
    
    setIsProcessing(true);
    
    try {
      const payload = {
        expenseData: {
          ...suggestedExpense,
          notes: addNotes ? notes : suggestedExpense.notes
        },
        vesselId: currentVessel.id
      };
      
      await apiRequest("/api/receipts/create-expense", "POST", payload, {
        credentials: "include" // Add credentials for this API request
      });
      
      toast({
        title: "Success",
        description: "New expense created from receipt successfully.",
        variant: "default",
      });
      
      // Invalidate expense queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/expenses/vessel/${currentVessel?.id}`] });
      
      setOpen(false);
      resetState();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating expense from receipt:", error);
      toast({
        title: "Error",
        description: "Failed to create expense from receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getCurrencyFormatted = (amount: number | string) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Receipt className="h-4 w-4 mr-2" />
          Receipts Reconciliation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receipt Reconciliation</DialogTitle>
          <DialogDescription>
            Upload and analyze receipts to match with existing expenses or create new ones.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="grid gap-6">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload a receipt image to start the analysis
              </p>
              <Input
                id="receipt-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Label htmlFor="receipt-upload" className="block">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  type="button" 
                  onClick={() => document.getElementById('receipt-upload')?.click()}
                >
                  Select Receipt Image
                </Button>
              </Label>
              {file && (
                <div className="mt-4 text-left flex items-center">
                  <FileCheck className="h-4 w-4 text-primary mr-2" />
                  <span className="text-sm truncate flex-1">{file.name}</span>
                  <Badge variant="outline" className="ml-2">
                    {(file.size / 1024).toFixed(0)} KB
                  </Badge>
                </div>
              )}
            </div>

            {file && (
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmit} 
                  disabled={!file || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Start Analysis"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {step === "analysis" && analysis && (
          <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Receipt Image</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  {receiptUrl && (
                    <div className="relative aspect-auto max-h-[300px] overflow-hidden rounded border">
                      <img 
                        src={receiptUrl} 
                        alt="Receipt" 
                        className="object-contain w-full h-full" 
                      />
                      <div className="absolute top-2 right-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8 rounded-full bg-primary/10 backdrop-blur-sm"
                          onClick={() => window.open(receiptUrl, '_blank')}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Analysis Results</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="font-medium">Vendor:</dt>
                    <dd>{analysis.vendor}</dd>
                    
                    <dt className="font-medium">Date:</dt>
                    <dd>{formatDate(analysis.date)}</dd>
                    
                    <dt className="font-medium">Total:</dt>
                    <dd className="font-semibold">{getCurrencyFormatted(analysis.total)}</dd>
                    
                    {analysis.receiptNumber && (
                      <>
                        <dt className="font-medium">Receipt #:</dt>
                        <dd>{analysis.receiptNumber}</dd>
                      </>
                    )}
                    
                    {analysis.category && (
                      <>
                        <dt className="font-medium">Category:</dt>
                        <dd>
                          <Badge variant="outline">{analysis.category}</Badge>
                        </dd>
                      </>
                    )}
                    
                    {analysis.paymentMethod && (
                      <>
                        <dt className="font-medium">Payment Method:</dt>
                        <dd>{analysis.paymentMethod}</dd>
                      </>
                    )}
                  </dl>

                  {analysis.suspiciousElements && analysis.suspiciousElements.length > 0 && (
                    <Alert className="mt-4" variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Potential Issues</AlertTitle>
                      <AlertDescription>
                        <ul className="text-sm list-disc pl-4 mt-2">
                          {analysis.suspiciousElements.map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>

            <Separator />

            <div>
              <h3 className="text-base font-medium mb-2">Line Items</h3>
              <div className="border rounded-md">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-4 text-left">Description</th>
                      <th className="py-2 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.items.map((item, i) => (
                      <tr key={i} className={i % 2 ? "bg-muted/50" : ""}>
                        <td className="py-2 px-4">{item.description}</td>
                        <td className="py-2 px-4 text-right">{getCurrencyFormatted(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button 
                onClick={() => matches.length > 0 ? setStep("match") : setStep("create")}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "match" && (
          <div className="grid gap-6">
            <Tabs defaultValue="match" className="w-full">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="match">Match to Existing</TabsTrigger>
                <TabsTrigger value="create">Create New</TabsTrigger>
              </TabsList>
              
              {/* Match to existing expense tab */}
              <TabsContent value="match" className="pt-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium mb-2">Potential Matches:</h3>
                  
                  <RadioGroup 
                    value={selectedExpenseId?.toString() || ""} 
                    onValueChange={value => {
                      setSelectedExpenseId(parseInt(value));
                      setMatchOption("existing");
                    }}
                  >
                    {matches.map((match) => (
                      <div key={match.expenseId} className="border rounded-lg mb-3 overflow-hidden">
                        <div className="flex items-start p-3">
                          <RadioGroupItem 
                            value={match.expenseId.toString()} 
                            id={`expense-${match.expenseId}`}
                            className="mt-1"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex justify-between items-start">
                              <Label 
                                htmlFor={`expense-${match.expenseId}`}
                                className="font-medium cursor-pointer"
                              >
                                {match.expense?.description || `Expense #${match.expenseId}`}
                              </Label>
                              <Badge variant={match.confidence > 0.7 ? "default" : "outline"}>
                                {Math.round(match.confidence * 100)}% match
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Amount:</span>
                                <span className="font-medium">
                                  {match.expense?.total 
                                    ? getCurrencyFormatted(match.expense.total) 
                                    : "Unknown"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Date:</span>
                                <span>
                                  {match.expense?.expenseDate 
                                    ? formatDate(match.expense.expenseDate) 
                                    : "Unknown"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Category:</span>
                                <span>{match.expense?.category || "Unknown"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <span>{match.expense?.status || "Unknown"}</span>
                              </div>
                            </div>
                            
                            {match.reasons && match.reasons.length > 0 && (
                              <div className="mt-3 border-t pt-2">
                                <p className="text-xs text-muted-foreground mb-1">Match Reasons:</p>
                                <ul className="text-xs list-disc pl-4">
                                  {match.reasons.map((reason, i) => (
                                    <li key={i}>{reason}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox 
                        id="add-notes" 
                        checked={addNotes}
                        onCheckedChange={(checked) => setAddNotes(checked === true)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="add-notes" className="text-sm">
                          Add notes to the expense
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Include additional information or context for this receipt
                        </p>
                      </div>
                    </div>
                    
                    {addNotes && (
                      <Textarea
                        className="mt-3"
                        placeholder="Enter notes about this receipt..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    )}
                  </div>
                </div>
              </TabsContent>
              
              {/* Create new expense tab */}
              <TabsContent value="create" className="pt-4">
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Create New Expense</AlertTitle>
                    <AlertDescription>
                      No suitable matches were found or you've chosen to create a new expense.
                    </AlertDescription>
                  </Alert>
                  
                  {suggestedExpense && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Suggested Expense</CardTitle>
                        <CardDescription>
                          This expense will be created based on the receipt data.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Description:</p>
                            <p className="font-medium">{suggestedExpense.description}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Amount:</p>
                            <p className="font-medium">{getCurrencyFormatted(suggestedExpense.total)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Date:</p>
                            <p>{formatDate(suggestedExpense.expenseDate)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Category:</p>
                            <p>{suggestedExpense.category}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Payment Method:</p>
                            <p>{suggestedExpense.paymentMethod}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Reference Number:</p>
                            <p>{suggestedExpense.referenceNumber || "N/A"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox 
                        id="add-notes-new" 
                        checked={addNotes}
                        onCheckedChange={(checked) => setAddNotes(checked === true)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="add-notes-new" className="text-sm">
                          Add custom notes
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Override the automatically generated notes
                        </p>
                      </div>
                    </div>
                    
                    {addNotes && (
                      <Textarea
                        className="mt-3"
                        placeholder="Enter notes about this expense..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setStep("analysis")}
                disabled={isProcessing}
              >
                Back
              </Button>
              
              {matchOption === "existing" ? (
                <Button 
                  onClick={handleLinkToExpense}
                  disabled={!selectedExpenseId || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4 mr-2" />
                      Link to Expense
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleCreateExpense}
                  disabled={!suggestedExpense || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Create Expense
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
        
        {step === "create" && (
          <div className="grid gap-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Matching Expenses Found</AlertTitle>
              <AlertDescription>
                We couldn't find any expenses that match this receipt. You can create a new expense record based on the receipt data.
              </AlertDescription>
            </Alert>
            
            {suggestedExpense && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Suggested Expense</CardTitle>
                  <CardDescription>
                    This expense will be created based on the receipt data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Description:</p>
                      <p className="font-medium">{suggestedExpense.description}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Amount:</p>
                      <p className="font-medium">{getCurrencyFormatted(suggestedExpense.total)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date:</p>
                      <p>{formatDate(suggestedExpense.expenseDate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Category:</p>
                      <p>{suggestedExpense.category}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Payment Method:</p>
                      <p>{suggestedExpense.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Reference Number:</p>
                      <p>{suggestedExpense.referenceNumber || "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="border rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="add-notes-create" 
                  checked={addNotes}
                  onCheckedChange={(checked) => setAddNotes(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="add-notes-create" className="text-sm">
                    Add custom notes
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Override the automatically generated notes
                  </p>
                </div>
              </div>
              
              {addNotes && (
                <Textarea
                  className="mt-3"
                  placeholder="Enter notes about this expense..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setStep("analysis")}
                disabled={isProcessing}
              >
                Back
              </Button>
              <Button 
                onClick={handleCreateExpense}
                disabled={!suggestedExpense || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Expense
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptReconciliationDialog;