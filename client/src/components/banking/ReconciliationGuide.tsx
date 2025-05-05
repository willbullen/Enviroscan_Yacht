import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Link,
  ChevronRight, 
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  Filter,
  Clock,
  FileCheck,
  LucideSearch
} from 'lucide-react';

interface ReconciliationGuideProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
}

const ReconciliationGuide: React.FC<ReconciliationGuideProps> = ({ 
  currentStep, 
  onSelectStep
}) => {
  const steps = [
    {
      title: 'Transaction Reconciliation Overview',
      icon: <Link className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p>
            Transaction reconciliation is the process of matching your banking transactions with your vessel's expenses and deposits to maintain accurate financial records.
          </p>
          <h4 className="font-medium">Benefits:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Ensures all expenses are properly tracked</li>
            <li>Identifies discrepancies between recorded and actual expenses</li>
            <li>Provides accurate financial reporting</li>
            <li>Reduces manual data entry through automation</li>
          </ul>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Reconciliation Best Practices</AlertTitle>
            <AlertDescription>
              We recommend reconciling your transactions at least weekly to ensure your financial data stays up-to-date.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      title: 'Understanding Transaction Status',
      icon: <CheckCircle className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p>
            Each transaction in the system has a status that indicates its reconciliation state:
          </p>
          
          <h4 className="font-medium">Transaction Status Types:</h4>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="bg-amber-50 text-amber-700 border border-amber-200 rounded px-2 py-0.5 flex items-center text-xs mr-2 mt-0.5">
                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                Unmatched
              </div>
              <div>
                <p className="font-medium">New transactions from your banking providers that have not been matched to any expense or deposit.</p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5 flex items-center text-xs mr-2 mt-0.5">
                <Link className="h-3.5 w-3.5 mr-1" />
                Matched
              </div>
              <div>
                <p className="font-medium">Transactions that have been linked to a corresponding expense or deposit but need final verification.</p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="bg-green-50 text-green-700 border border-green-200 rounded px-2 py-0.5 flex items-center text-xs mr-2 mt-0.5">
                <FileCheck className="h-3.5 w-3.5 mr-1" />
                Reconciled
              </div>
              <div>
                <p className="font-medium">Transactions that have been verified and confirmed as accurate, completing the reconciliation process.</p>
              </div>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'Finding Transactions to Reconcile',
      icon: <LucideSearch className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p>
            The system provides several tools to help you find and filter transactions that need reconciliation:
          </p>
          
          <h4 className="font-medium">Search and Filter Options:</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <span className="font-medium">Search Bar:</span> Find transactions by description, reference number, or provider
            </li>
            <li>
              <span className="font-medium">Date Range Filter:</span> Focus on transactions from a specific time period
            </li>
            <li>
              <span className="font-medium">Status Filter:</span> View only unmatched, matched, or reconciled transactions
            </li>
            <li>
              <span className="font-medium">Type Filter:</span> Filter by credits (deposits) or debits (expenses)
            </li>
            <li>
              <span className="font-medium">Provider Filter:</span> View transactions from specific banking providers
            </li>
          </ul>
          
          <Alert className="bg-blue-50 border-blue-200 text-blue-800">
            <Filter className="h-4 w-4 text-blue-800" />
            <AlertTitle>Pro Tip: Quick Filters</AlertTitle>
            <AlertDescription>
              For routine reconciliation, start by filtering for "Unmatched" status to quickly find transactions that need attention.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      title: 'Matching and Reconciling Transactions',
      icon: <FileCheck className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p>
            The matching and reconciliation process involves linking banking transactions to your vessel's expenses or deposits:
          </p>
          
          <h4 className="font-medium">Step-by-Step Reconciliation:</h4>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Locate an unmatched transaction in the list</li>
            <li>Click the "Match" button to open the matching dialog</li>
            <li>Review the system's suggested expense matches, which are ranked by confidence level</li>
            <li>Select the correct expense or create a new one if needed</li>
            <li>Confirm the match to update the transaction status to "Matched"</li>
            <li>Review matched transactions and mark them as "Reconciled" when verified</li>
          </ol>
          
          <h4 className="font-medium mt-4">Automated Matching:</h4>
          <p>
            The system uses AI to automatically suggest the best matches based on:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Transaction amounts</li>
            <li>Dates and timing</li>
            <li>Description and vendor information</li>
            <li>Historical matching patterns</li>
          </ul>
          
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Batch Reconciliation</AlertTitle>
            <AlertDescription>
              You can select multiple transactions using the checkboxes and perform batch actions like marking them as reconciled.
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

export default ReconciliationGuide;