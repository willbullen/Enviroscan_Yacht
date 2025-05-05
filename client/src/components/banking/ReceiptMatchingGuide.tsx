import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Receipt, 
  ChevronRight, 
  ChevronLeft,
  Upload,
  Sparkles,
  Link,
  Lightbulb,
  BrainCircuit,
  Camera
} from 'lucide-react';

interface ReceiptMatchingGuideProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
}

const ReceiptMatchingGuide: React.FC<ReceiptMatchingGuideProps> = ({ 
  currentStep, 
  onSelectStep
}) => {
  const steps = [
    {
      title: 'AI Receipt Matching Overview',
      icon: <Receipt className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p>
            The AI Receipt Matching system automatically extracts and processes receipt information, matching it to your expense records to streamline financial management.
          </p>
          <h4 className="font-medium">Benefits:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Automated data extraction from receipts</li>
            <li>Reduction in manual data entry</li>
            <li>Smart matching to existing expenses</li>
            <li>Digital receipt storage and organization</li>
            <li>Simplified expense reconciliation</li>
          </ul>
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Time-Saving Automation</AlertTitle>
            <AlertDescription>
              Receipt matching can save up to 10 hours of administrative work per month for a typical vessel's financial management.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      title: 'Uploading Receipts',
      icon: <Upload className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p>
            You can upload receipts in various formats for processing by our AI system:
          </p>
          
          <h4 className="font-medium">Supported File Types:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Images:</strong> JPG, PNG, HEIC (iPhone photos)</li>
            <li><strong>Documents:</strong> PDF</li>
            <li><strong>Maximum Size:</strong> 20MB per file</li>
          </ul>
          
          <h4 className="font-medium mt-4">Upload Methods:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <span className="font-medium">Drag and Drop:</span> Simply drag receipt files to the upload area
            </li>
            <li>
              <span className="font-medium">File Browser:</span> Click the upload area to select files from your device
            </li>
            <li>
              <span className="font-medium">Mobile Capture:</span> Scan receipts directly from the mobile app
            </li>
          </ul>
          
          <Alert>
            <Camera className="h-4 w-4" />
            <AlertTitle>Receipt Capture Tips</AlertTitle>
            <AlertDescription>
              When photographing receipts, ensure good lighting, flatten the receipt, and include all edges for best AI recognition results.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      title: 'AI Processing & Data Extraction',
      icon: <BrainCircuit className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p>
            After uploading, our AI system processes your receipts to extract key information:
          </p>
          
          <h4 className="font-medium">Extracted Data Fields:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Date:</strong> Purchase or service date</li>
            <li><strong>Vendor:</strong> Name of the merchant or service provider</li>
            <li><strong>Amount:</strong> Total payment amount and currency</li>
            <li><strong>Description:</strong> Item or service details</li>
            <li><strong>Category:</strong> Expense classification (where detectable)</li>
            <li><strong>Payment Method:</strong> Credit card, cash, etc. (where available)</li>
          </ul>
          
          <h4 className="font-medium mt-4">Processing Status:</h4>
          <ul className="space-y-2">
            <li className="flex items-center">
              <div className="bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5 text-xs mr-2">
                Processing
              </div>
              <span>Receipt is being analyzed by the AI system</span>
            </li>
            <li className="flex items-center">
              <div className="bg-purple-50 text-purple-700 border border-purple-200 rounded px-2 py-0.5 text-xs mr-2">
                Processed
              </div>
              <span>Data extraction is complete, ready for matching</span>
            </li>
            <li className="flex items-center">
              <div className="bg-green-50 text-green-700 border border-green-200 rounded px-2 py-0.5 text-xs mr-2">
                Matched
              </div>
              <span>Receipt has been matched to an expense</span>
            </li>
          </ul>
          
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>AI Learning</AlertTitle>
            <AlertDescription>
              Our AI system continually improves its recognition accuracy based on your correction patterns and vessel-specific vendors.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      title: 'Matching Receipts to Expenses',
      icon: <Link className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p>
            Once a receipt is processed, you can match it to an existing expense or create a new one:
          </p>
          
          <h4 className="font-medium">Matching Options:</h4>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <span className="font-medium">Automatic Matching:</span> The system automatically suggests matches based on date, amount, and vendor information
            </li>
            <li>
              <span className="font-medium">Manual Matching:</span> Select from a list of potential matches or search for a specific expense
            </li>
            <li>
              <span className="font-medium">Create New Expense:</span> Generate a new expense record directly from the receipt data
            </li>
          </ol>
          
          <h4 className="font-medium mt-4">Working with Matched Receipts:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>View the original receipt image at any time by clicking on it</li>
            <li>Edit the extracted data if corrections are needed</li>
            <li>Change matches if the initial match was incorrect</li>
            <li>Download the receipt for external record-keeping</li>
          </ul>
          
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Expense Management Tip</AlertTitle>
            <AlertDescription>
              For best results, upload receipts soon after expenses occur to help the system find accurate matches based on recent transactions.
            </AlertDescription>
          </Alert>
        </div>
      )
    }
  ];

  return (
    <Card className="border-primary/20 bg-primary/5 mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            {steps[currentStep].icon}
            <span>Guide: {steps[currentStep].title}</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => onSelectStep(-1)}>
            Close Guide
          </Button>
        </div>
        <CardDescription>
          Step {currentStep + 1} of {steps.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {steps[currentStep].content}
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <div className="flex gap-1">
          {steps.map((_, index) => (
            <div 
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentStep ? 'bg-primary' : 'bg-muted'
              }`}
              onClick={() => onSelectStep(index)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReceiptMatchingGuide;