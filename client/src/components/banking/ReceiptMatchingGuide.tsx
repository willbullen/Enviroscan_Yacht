import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Receipt,
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Upload,
  ScanLine,
  FileCheck,
  Link,
  ImageIcon
} from 'lucide-react';

interface ReceiptMatchingGuideProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
}

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const ReceiptMatchingGuide: React.FC<ReceiptMatchingGuideProps> = ({
  currentStep,
  onSelectStep,
}) => {
  const steps: Step[] = [
    {
      title: 'AI Receipt Matching Overview',
      description: 'Understanding the receipt processing workflow',
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>
            AI Receipt Matching is a powerful feature that uses advanced OCR (Optical Character Recognition) and machine learning to automatically extract information from your receipts and match them to expenses.
          </p>

          <div className="space-y-2">
            <h4 className="font-medium">Benefits of AI Receipt Matching:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Reduced manual data entry for expense documentation</li>
              <li>Improved accuracy of expense records</li>
              <li>Automated categorization of expenses</li>
              <li>Simplified audit preparation with digital receipt storage</li>
              <li>Faster expense reconciliation process</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">The Receipt Matching Workflow:</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Upload receipt images or PDFs</li>
              <li>AI processing extracts key information</li>
              <li>System suggests matching expenses</li>
              <li>User verifies or adjusts matches</li>
              <li>Receipt is linked to expense record for future reference</li>
            </ol>
          </div>

          <div className="rounded-md bg-muted p-3">
            <p className="text-sm font-medium">Note: This guide will walk you through the process of uploading, processing, and matching receipts to your expense records.</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Uploading Receipts',
      description: 'Getting receipts into the system',
      icon: <Upload className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>
            The first step in the receipt matching process is uploading your receipt images or PDFs to the system.
          </p>

          <div className="space-y-2">
            <h4 className="font-medium">Supported File Formats:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Images</strong>: JPG, JPEG, PNG (clear photos of receipts)</li>
              <li><strong>Documents</strong>: PDF (scanned receipts or digital invoices)</li>
              <li>Maximum file size: 10MB per receipt</li>
              <li>Maximum batch upload: 10 files at once</li>
            </ul>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Upload Methods:</h4>
            <ol className="list-decimal pl-5 space-y-2">
              <li><strong>Drag and Drop</strong>: Simply drag receipt files onto the upload area</li>
              <li><strong>File Browser</strong>: Click the upload area to browse for files</li>
              <li><strong>Bulk Upload</strong>: Select multiple files to upload in a batch</li>
            </ol>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Best Practices for Receipt Quality:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ensure receipts are well-lit and clearly legible</li>
              <li>Capture the entire receipt, including all edges</li>
              <li>Avoid glare, shadows, or creases when photographing</li>
              <li>For digital receipts, save as PDF rather than taking screenshots</li>
              <li>Check that date, amount, and vendor information is visible</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: 'AI Processing',
      description: 'How the system extracts receipt information',
      icon: <ScanLine className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>
            After uploading, the system uses AI-powered OCR technology to extract and analyze information from your receipts.
          </p>

          <div className="space-y-2">
            <h4 className="font-medium">Data Extraction Process:</h4>
            <ol className="list-decimal pl-5 space-y-2">
              <li>The system analyzes the receipt image using OCR technology</li>
              <li>AI algorithms identify key fields (date, amount, vendor, etc.)</li>
              <li>Machine learning improves accuracy based on your data patterns</li>
              <li>Extracted data is validated for format and reasonability</li>
              <li>Processing results are presented with a confidence score</li>
            </ol>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Information Extracted:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Date</strong>: Transaction or service date</li>
              <li><strong>Amount</strong>: Total payment including taxes/fees</li>
              <li><strong>Vendor</strong>: Business or service provider name</li>
              <li><strong>Description</strong>: Items or services purchased (when available)</li>
              <li><strong>Category</strong>: Suggested expense category based on content</li>
              <li><strong>Tax</strong>: Tax amounts when separately itemized</li>
            </ul>
          </div>

          <div className="rounded-md bg-blue-50 p-3 border border-blue-200 text-blue-800 mt-4">
            <h4 className="font-medium">Understanding Confidence Scores</h4>
            <p className="text-sm mt-1">
              Each extracted data point is assigned a confidence score (0-100%). Higher scores indicate greater certainty in the accuracy of the extracted information. Always review data with scores below 80%.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Matching Receipts to Expenses',
      description: 'Connecting receipts with expense records',
      icon: <Link className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>
            Once information is extracted, the system suggests potential expense matches or helps you create new expense records.
          </p>

          <div className="space-y-2">
            <h4 className="font-medium">Automatic Matching:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>The system searches for existing expenses that match the receipt</li>
              <li>Matching criteria include amount, date, and vendor information</li>
              <li>Potential matches are ranked by confidence level</li>
              <li>You can select the correct match from suggested options</li>
              <li>Once confirmed, the receipt is permanently linked to the expense</li>
            </ul>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Creating New Expenses from Receipts:</h4>
            <ol className="list-decimal pl-5 space-y-2">
              <li>If no match exists, select "Create New Expense"</li>
              <li>A pre-filled expense form is generated from the receipt data</li>
              <li>Review and edit any fields as needed</li>
              <li>Assign the expense to the appropriate category and account</li>
              <li>Save to create a new expense with the receipt attached</li>
            </ol>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Manual Matching:</h4>
            <p className="text-sm">
              For cases where automatic matching doesn't find the correct expense, you can manually search and select the appropriate expense record to link with the receipt.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Managing Receipt Records',
      description: 'Organizing and accessing receipt data',
      icon: <FileCheck className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>
            After processing and matching, you'll need to manage your receipt records for organization and compliance.
          </p>

          <div className="space-y-2">
            <h4 className="font-medium">Receipt Status Types:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Unprocessed</strong>: Receipt uploaded but not yet processed</li>
              <li><strong>Processing</strong>: AI analysis currently in progress</li>
              <li><strong>Processed</strong>: Data extracted but not matched to an expense</li>
              <li><strong>Matched</strong>: Successfully linked to an expense record</li>
              <li><strong>Error</strong>: Processing failed and requires manual review</li>
            </ul>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Accessing Receipt Records:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>View receipts in the Receipt Matching tab</li>
              <li>Filter by status, date range, or recognition confidence</li>
              <li>Search by vendor name or amount</li>
              <li>Access receipt images directly from linked expense records</li>
              <li>Download original receipt files or processed data as needed</li>
            </ul>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Financial Compliance and Auditing:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>All receipt images are securely stored for compliance purposes</li>
              <li>Receipt matching provides a clear audit trail for expenses</li>
              <li>Original receipt files are preserved alongside extracted data</li>
              <li>Metadata includes upload date and processing history</li>
              <li>Export receipt data and images for external audits as needed</li>
            </ul>
          </div>

          <div className="rounded-md bg-green-50 p-3 border border-green-200 text-green-800 mt-4">
            <h4 className="font-medium">Best Practice</h4>
            <p className="text-sm mt-1">
              Process receipts promptly after expenses occur for optimal matching accuracy. This reduces backlog and ensures timely financial record updates.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      onSelectStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      onSelectStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    onSelectStep(-1);
  };

  return (
    <Card className="border shadow-md">
      <CardHeader className="bg-muted/30 border-b">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Receipt Matching Guide</CardTitle>
            <CardDescription>Learn how to use AI-powered receipt processing</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex mb-6 border rounded-lg divide-x overflow-hidden">
          {steps.map((step, index) => (
            <button
              key={index}
              className={`flex-1 py-3 px-4 text-sm font-medium truncate transition-colors ${
                currentStep === index
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
              onClick={() => onSelectStep(index)}
            >
              {step.title}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <div className="flex items-center mb-4">
            {steps[currentStep].icon}
            <div className="ml-3">
              <h3 className="text-lg font-semibold">{steps[currentStep].title}</h3>
              <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
            </div>
          </div>
          <div className="prose prose-sm max-w-none">{steps[currentStep].content}</div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Close Guide
          </Button>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentStep === steps.length - 1}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReceiptMatchingGuide;