import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload,
  Receipt,
  RefreshCw,
  Check,
  FileText,
  Sparkles,
  AlertCircle,
  Search,
  FileCheck,
  Pencil,
  Trash,
  CreditCard,
  Download,
  Eye,
  ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { Spinner } from '@/components/ui/spinner';
import { useDropzone } from 'react-dropzone';

interface ReceiptMatchingProps {
  vesselId: number;
}

interface Receipt {
  id: string;
  uploadDate: string;
  filename: string;
  status: 'processing' | 'processed' | 'matched' | 'error';
  extractedData?: {
    date: string;
    vendor: string;
    amount: number;
    description: string;
    category?: string;
  };
  matchedExpenseId?: number;
  errorMessage?: string;
  thumbnailUrl?: string;
}

const ReceiptMatching: React.FC<ReceiptMatchingProps> = ({ vesselId }) => {
  const { useLiveBankingData, bankingAPICredentialsSet } = useSystemSettings();
  const [receipts, setReceipts] = useState<Receipt[]>([
    {
      id: 'r-001',
      uploadDate: '2025-05-01T10:20:00Z',
      filename: 'fuel_receipt_monaco.jpg',
      status: 'matched',
      extractedData: {
        date: '2025-05-01T09:45:00Z',
        vendor: 'Monaco Yacht Services',
        amount: 12500.00,
        description: 'Fuel Purchase - 5000L Marine Diesel',
        category: 'Fuel'
      },
      matchedExpenseId: 1001,
      thumbnailUrl: '/receipts/fuel_receipt_thumb.jpg'
    },
    {
      id: 'r-002',
      uploadDate: '2025-05-03T14:30:00Z',
      filename: 'port_fees_may2025.pdf',
      status: 'processed',
      extractedData: {
        date: '2025-05-02T14:00:00Z',
        vendor: 'Port de Monaco',
        amount: 8750.50,
        description: 'Docking Fees - May 2025',
        category: 'Port Fees'
      },
      thumbnailUrl: '/receipts/port_fees_thumb.jpg'
    },
    {
      id: 'r-003',
      uploadDate: '2025-05-05T09:15:00Z',
      filename: 'catering_invoice.jpg',
      status: 'processing',
      thumbnailUrl: '/receipts/catering_thumb.jpg'
    }
  ]);
  
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 5,
    onDrop: (acceptedFiles) => {
      setUploadedFiles(acceptedFiles);
      
      // Simulate processing
      if (acceptedFiles.length > 0) {
        handleProcessReceipts(acceptedFiles);
      }
    }
  });
  
  const handleProcessReceipts = (files: File[]) => {
    setIsProcessing(true);
    
    // Simulate API call for receipt processing
    setTimeout(() => {
      setIsProcessing(false);
      
      // Add new receipts to the list
      const newReceipts = files.map((file, index) => ({
        id: `r-new-${Date.now()}-${index}`,
        uploadDate: new Date().toISOString(),
        filename: file.name,
        status: 'processing' as const,
        thumbnailUrl: URL.createObjectURL(file)
      }));
      
      setReceipts([...newReceipts, ...receipts]);
      setUploadedFiles([]);
      
      // Simulate processing completion for the first receipt after 5 seconds
      if (newReceipts.length > 0) {
        setTimeout(() => {
          setReceipts(prevReceipts => {
            const updated = [...prevReceipts];
            const index = updated.findIndex(r => r.id === newReceipts[0].id);
            
            if (index !== -1) {
              updated[index] = {
                ...updated[index],
                status: 'processed',
                extractedData: {
                  date: new Date().toISOString(),
                  vendor: 'Extracted Vendor Name',
                  amount: Math.round(Math.random() * 5000) / 100,
                  description: 'Auto-extracted description from receipt'
                }
              };
            }
            
            return updated;
          });
        }, 5000);
      }
    }, 2000);
  };
  
  const handleViewReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowReceiptDialog(true);
  };
  
  const handleCreateExpenseFromReceipt = (receipt: Receipt) => {
    // In a real app, this would navigate to the expense form with pre-filled data
    console.log('Creating expense from receipt:', receipt);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy');
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };
  
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Processing
          </Badge>
        );
      case 'processed':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            Processed
          </Badge>
        );
      case 'matched':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
            <Check className="h-3.5 w-3.5" />
            Matched
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Receipts</CardTitle>
          <CardDescription>
            Upload receipts for AI processing. Supported formats: JPG, PNG, PDF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-md p-8 text-center
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              cursor-pointer transition-colors
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            
            {isDragActive ? (
              <p>Drop the files here...</p>
            ) : (
              <>
                <p className="font-medium">Drag and drop receipt files here, or click to select files</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Our AI will extract date, vendor, amount, and description automatically
                </p>
              </>
            )}
          </div>
          
          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium">Uploaded Files:</h4>
              <ul className="text-sm space-y-1">
                {uploadedFiles.map((file, index) => (
                  <li key={index} className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-primary" />
                    {file.name} ({Math.round(file.size / 1024)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={() => handleProcessReceipts(uploadedFiles)}
            disabled={uploadedFiles.length === 0 || isProcessing}
          >
            {isProcessing ? (
              <>
                <Spinner size="xs" className="mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Process Receipts
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Receipt className="h-8 w-8 mb-1" />
                    <p>No receipts uploaded yet</p>
                    <p className="text-sm">Upload receipts to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              receipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-muted rounded flex items-center justify-center overflow-hidden">
                        {receipt.thumbnailUrl ? (
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        ) : (
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium truncate max-w-[150px]">
                          {receipt.filename}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Uploaded {formatDate(receipt.uploadDate)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {receipt.extractedData?.date ? (
                      formatDate(receipt.extractedData.date)
                    ) : (
                      <span className="text-muted-foreground italic">Pending</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {receipt.extractedData?.vendor || (
                      <span className="text-muted-foreground italic">Pending</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="truncate max-w-[200px]">
                      {receipt.extractedData?.description || (
                        <span className="text-muted-foreground italic">Pending</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {receipt.extractedData?.amount ? (
                      formatAmount(receipt.extractedData.amount)
                    ) : (
                      <span className="text-muted-foreground italic">Pending</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(receipt.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleViewReceipt(receipt)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {receipt.status === 'processed' && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleCreateExpenseFromReceipt(receipt)}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {receipt.status !== 'processing' && (
                        <Button variant="ghost" size="icon">
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {!useLiveBankingData && (
        <Alert className="bg-amber-50 text-amber-800 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-800" />
          <AlertTitle>Using Test Data</AlertTitle>
          <AlertDescription>
            You're viewing simulated receipt data. Toggle to live mode in settings to use actual AI receipt processing.
          </AlertDescription>
        </Alert>
      )}
      
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
            <DialogDescription>
              View receipt details and extracted information
            </DialogDescription>
          </DialogHeader>
          
          {selectedReceipt && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Receipt Image</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center min-h-[300px] bg-muted rounded-md">
                  {selectedReceipt.thumbnailUrl ? (
                    <div className="flex flex-col items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">Receipt image preview</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-16 w-16 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">No preview available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Extracted Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedReceipt.status === 'processing' ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Spinner size="md" className="mb-4" />
                        <p className="text-muted-foreground">Processing receipt...</p>
                      </div>
                    ) : selectedReceipt.status === 'error' ? (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Processing Error</AlertTitle>
                        <AlertDescription>
                          {selectedReceipt.errorMessage || 'Failed to process receipt. Please try again.'}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">Date</div>
                          <div>
                            {selectedReceipt.extractedData?.date ? 
                              formatDate(selectedReceipt.extractedData.date) : 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">Vendor</div>
                          <div>
                            {selectedReceipt.extractedData?.vendor || 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">Description</div>
                          <div>
                            {selectedReceipt.extractedData?.description || 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">Amount</div>
                          <div className="font-bold">
                            {selectedReceipt.extractedData?.amount ? 
                              formatAmount(selectedReceipt.extractedData.amount) : 'N/A'}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">Category</div>
                          <div>
                            {selectedReceipt.extractedData?.category || 'Uncategorized'}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
                
                {selectedReceipt.status === 'processed' && (
                  <Button 
                    className="w-full"
                    onClick={() => {
                      handleCreateExpenseFromReceipt(selectedReceipt);
                      setShowReceiptDialog(false);
                    }}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Create Expense from Receipt
                  </Button>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReceiptMatching;