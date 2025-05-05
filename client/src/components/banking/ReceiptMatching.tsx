import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { FileUploader } from '@/components/ui/file-uploader';
import { Spinner } from '@/components/ui/spinner';
import {
  Upload,
  Scan,
  ReceiptText,
  Sparkles,
  AlertCircle,
  FileCheck,
  Eye,
  Link2,
  CheckCircle2,
  Info,
  RefreshCw,
  ImageIcon,
  FileIcon
} from 'lucide-react';

interface ReceiptMatchingProps {
  vesselId: number;
}

interface Receipt {
  id: string;
  filename: string;
  uploadDate: string;
  size: number;
  status: 'unprocessed' | 'processing' | 'processed' | 'matched' | 'error';
  matchedExpenseId?: number;
  expenseName?: string;
  extractedAmount?: number;
  extractedDate?: string;
  extractedVendor?: string;
  confidence?: number;
}

export const ReceiptMatching: React.FC<ReceiptMatchingProps> = ({ vesselId }) => {
  const { useLiveBankingData, bankingAPICredentialsSet } = useSystemSettings();
  const [activeTab, setActiveTab] = useState('pending');
  const [uploadedFiles, setUploadedFiles] = useState<{name: string; size: number; status?: 'uploading' | 'success' | 'error'}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [processingReceipt, setProcessingReceipt] = useState<string | null>(null);
  
  // Mock receipts data - in a real app this would come from an API call
  const mockReceipts: Receipt[] = [
    {
      id: 'r-001',
      filename: 'fuel_receipt_05032025.jpg',
      uploadDate: '2025-05-03T14:23:45Z',
      size: 1254000,
      status: 'processed',
      extractedAmount: 8750.50,
      extractedDate: '2025-05-01',
      extractedVendor: 'Mediterranean Yacht Services',
      confidence: 0.92
    },
    {
      id: 'r-002',
      filename: 'monaco_docking_fee.pdf',
      uploadDate: '2025-05-03T15:10:20Z',
      size: 2540000,
      status: 'matched',
      matchedExpenseId: 5432,
      expenseName: 'Docking fees - Port de Monaco',
      extractedAmount: 12500.00,
      extractedDate: '2025-05-02',
      extractedVendor: 'Port de Monaco',
      confidence: 0.89
    },
    {
      id: 'r-003',
      filename: 'crew_payroll_receipt.pdf',
      uploadDate: '2025-05-03T16:45:12Z',
      size: 1850000,
      status: 'matched',
      matchedExpenseId: 5433,
      expenseName: 'Crew payroll payment',
      extractedAmount: 28750.00,
      extractedDate: '2025-05-03',
      extractedVendor: 'Yacht Crew Solutions',
      confidence: 0.95
    },
    {
      id: 'r-004',
      filename: 'maintenance_supplies.jpg',
      uploadDate: '2025-05-04T09:20:33Z',
      size: 956000,
      status: 'unprocessed'
    },
    {
      id: 'r-005',
      filename: 'insurance_payment.pdf',
      uploadDate: '2025-05-04T10:15:40Z',
      size: 1420000,
      status: 'processing'
    },
    {
      id: 'r-006',
      filename: 'catering_invoice.pdf',
      uploadDate: '2025-05-04T11:30:22Z',
      size: 1650000,
      status: 'error'
    }
  ];

  // Filter receipts based on active tab
  const filteredReceipts = mockReceipts.filter(receipt => {
    if (activeTab === 'pending') {
      return ['unprocessed', 'processing', 'processed', 'error'].includes(receipt.status);
    } else if (activeTab === 'matched') {
      return receipt.status === 'matched';
    }
    return true;
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleFilesSelected = async (files: File[]) => {
    // Convert files to the format expected by FileUploader
    const newFiles = files.map(file => ({
      name: file.name,
      size: file.size,
      status: 'uploading' as const
    }));
    
    setUploadedFiles([...uploadedFiles, ...newFiles]);
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
    
    // Simulate upload completion
    setTimeout(() => {
      clearInterval(interval);
      setIsUploading(false);
      setUploadProgress(100);
      
      // Update file status to success
      setUploadedFiles(prev => 
        prev.map(file => 
          file.status === 'uploading' ? { ...file, status: 'success' as const } : file
        )
      );
      
      // After successful upload, clear the files list after a short delay
      setTimeout(() => {
        setUploadedFiles([]);
      }, 2000);
    }, 3000);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
  };

  const handleProcessReceipt = (receiptId: string) => {
    setProcessingReceipt(receiptId);
    
    // Simulate API call
    setTimeout(() => {
      setProcessingReceipt(null);
    }, 2000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status: Receipt['status']) => {
    switch (status) {
      case 'unprocessed':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Unprocessed
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            Processing
          </Badge>
        );
      case 'processed':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Processed
          </Badge>
        );
      case 'matched':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Link2 className="h-3.5 w-3.5 mr-1.5" />
            Matched
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  const getActionButtons = (receipt: Receipt) => {
    const buttons = [];
    
    // View button for all receipts
    buttons.push(
      <Button key="view" variant="ghost" size="sm" className="h-8 px-2">
        <Eye className="h-4 w-4 mr-1.5" />
        View
      </Button>
    );
    
    // Process button for unprocessed receipts
    if (receipt.status === 'unprocessed') {
      buttons.push(
        <Button 
          key="process" 
          variant="default" 
          size="sm" 
          className="h-8 px-2"
          onClick={() => handleProcessReceipt(receipt.id)}
          disabled={processingReceipt === receipt.id}
        >
          {processingReceipt === receipt.id ? (
            <>
              <Spinner size="xs" className="mr-1.5" />
              Processing...
            </>
          ) : (
            <>
              <Scan className="h-4 w-4 mr-1.5" />
              Process
            </>
          )}
        </Button>
      );
    }
    
    // Match button for processed receipts
    if (receipt.status === 'processed') {
      buttons.push(
        <Button key="match" variant="default" size="sm" className="h-8 px-2">
          <Link2 className="h-4 w-4 mr-1.5" />
          Match
        </Button>
      );
    }
    
    // Retry button for error receipts
    if (receipt.status === 'error') {
      buttons.push(
        <Button key="retry" variant="outline" size="sm" className="h-8 px-2">
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Retry
        </Button>
      );
    }
    
    return (
      <div className="flex space-x-1">
        {buttons}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Receipt Matching</h2>
        <div>
          <Button className="h-9">
            <Upload className="h-4 w-4 mr-2" />
            Upload Receipts
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Receipts</CardTitle>
          <CardDescription>
            Upload receipts for automatic data extraction and expense matching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploader
            onFilesSelected={handleFilesSelected}
            onFileRemoved={handleRemoveFile}
            maxFiles={10}
            maxSize={10 * 1024 * 1024} // 10MB
            uploading={isUploading}
            progress={uploadProgress}
            uploadedFiles={uploadedFiles}
          />
        </CardContent>
        <CardFooter className="bg-muted/20 border-t flex justify-between items-center p-3">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-primary mr-2" />
            <span className="text-sm font-medium">AI-powered receipt scanning</span>
          </div>
          <Badge variant="outline" className="text-xs">
            Supports JPG, PNG, PDF
          </Badge>
        </CardFooter>
      </Card>

      <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all">
            All Receipts
            <Badge variant="secondary" className="ml-1 px-1.5 h-5">
              {mockReceipts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            <Badge variant="secondary" className="ml-1 px-1.5 h-5">
              {mockReceipts.filter(r => r.status !== 'matched').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="matched">
            Matched
            <Badge variant="secondary" className="ml-1 px-1.5 h-5">
              {mockReceipts.filter(r => r.status === 'matched').length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Extracted Data</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReceipts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No receipts found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReceipts.map((receipt) => (
                        <TableRow key={receipt.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {receipt.filename.toLowerCase().endsWith('.pdf') ? (
                                <FileIcon className="h-9 w-9 text-red-500 bg-red-50 p-1.5 rounded" />
                              ) : (
                                <ImageIcon className="h-9 w-9 text-blue-500 bg-blue-50 p-1.5 rounded" />
                              )}
                              <div className="flex flex-col">
                                <span className="font-medium">{receipt.filename}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatFileSize(receipt.size)}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(receipt.uploadDate)}</TableCell>
                          <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                          <TableCell>
                            {receipt.status === 'matched' || receipt.status === 'processed' ? (
                              <div className="text-sm">
                                {receipt.extractedAmount && (
                                  <div><span className="font-medium">Amount:</span> ${receipt.extractedAmount.toLocaleString()}</div>
                                )}
                                {receipt.extractedDate && (
                                  <div><span className="font-medium">Date:</span> {new Date(receipt.extractedDate).toLocaleDateString()}</div>
                                )}
                                {receipt.extractedVendor && (
                                  <div><span className="font-medium">Vendor:</span> {receipt.extractedVendor}</div>
                                )}
                                {receipt.confidence && (
                                  <div className="text-xs text-muted-foreground flex items-center mt-1">
                                    <Info className="h-3 w-3 mr-1" />
                                    Confidence: {Math.round(receipt.confidence * 100)}%
                                  </div>
                                )}
                              </div>
                            ) : receipt.status === 'error' ? (
                              <div className="text-sm text-red-500">
                                Processing failed
                              </div>
                            ) : receipt.status === 'processing' ? (
                              <div className="text-sm text-muted-foreground flex items-center">
                                <Spinner size="xs" className="mr-2" />
                                Extracting data...
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                Not processed yet
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {getActionButtons(receipt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {!useLiveBankingData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Using Test Data</AlertTitle>
          <AlertDescription>
            You're viewing simulated receipt data. In live mode, the AI-powered OCR will extract data from your actual receipts.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ReceiptMatching;