import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileCheck,
  ArrowRight, 
  ArrowLeft,
  BarChartBig,
  CheckSquare,
  FileSearch,
  BadgeAlert,
  RefreshCw,
  Banknote
} from 'lucide-react';

interface ReconciliationGuideProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
}

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const ReconciliationGuide: React.FC<ReconciliationGuideProps> = ({
  currentStep,
  onSelectStep,
}) => {
  const steps: Step[] = [
    {
      title: 'Transaction Reconciliation Overview',
      description: 'Understanding the reconciliation process',
      icon: <Banknote className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>
            Transaction reconciliation is the process of matching financial transactions from bank statements with your vessel's recorded expenses and deposits to ensure accuracy and completeness.
          </p>

          <div className="space-y-2">
            <h4 className="font-medium">Why Reconcile Transactions?</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Verify all financial transactions are properly recorded</li>
              <li>Identify and resolve discrepancies in a timely manner</li>
              <li>Prevent fraud and detect unauthorized transactions</li>
              <li>Maintain accurate financial records for reporting</li>
              <li>Ensure budget adherence and financial control</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Reconciliation Workflow:</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Import transactions from banking providers</li>
              <li>Review unmatched transactions for categorization</li>
              <li>Match transactions to existing expenses or deposits</li>
              <li>Create new expense records for unmatched transactions</li>
              <li>Finalize reconciliation and generate reports</li>
            </ol>
          </div>

          <div className="rounded-md bg-muted p-3">
            <p className="text-sm font-medium">Note: This guide will walk you through the process of reconciling transactions, handling exceptions, and maintaining accurate financial records.</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Importing and Reviewing Transactions',
      description: 'Getting transactions into the system',
      icon: <FileSearch className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>
            The first step in the reconciliation process is importing transactions from your banking providers and reviewing them for accuracy.
          </p>

          <div className="space-y-2">
            <h4 className="font-medium">Importing Transactions:</h4>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Navigate to the Banking tab in Financial Management</li>
              <li>Select the Transactions tab</li>
              <li>Click "Sync Transactions" to import the latest data</li>
              <li>The system will automatically import new transactions</li>
              <li>Transactions will be initially marked as "Unmatched"</li>
            </ol>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Reviewing Imported Transactions:</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li>Review the transaction list for accuracy and completeness</li>
              <li>Use filters to sort by date, amount, or transaction type</li>
              <li>Verify that all expected transactions are present</li>
              <li>Check for any unusual or unexpected transactions</li>
              <li>Mark any suspicious transactions for investigation</li>
            </ul>
          </div>

          <div className="rounded-md bg-blue-50 p-3 border border-blue-200 text-blue-800 mt-4">
            <h4 className="font-medium">Tip: Frequent Synchronization</h4>
            <p className="text-sm mt-1">
              For optimal financial management, sync transactions at least weekly to keep your records up-to-date and make reconciliation more manageable.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Matching Transactions',
      description: 'Connecting transactions to expenses',
      icon: <CheckSquare className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>
            Matching transactions involves linking bank transactions to corresponding expense or deposit records in your system.
          </p>

          <div className="space-y-2">
            <h4 className="font-medium">Automatic Matching:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>The system attempts to automatically match transactions based on:</li>
              <li className="ml-5">Amount and date correspondence</li>
              <li className="ml-5">Transaction reference numbers</li>
              <li className="ml-5">Vendor information and descriptions</li>
              <li>Automatic matches are marked as "Matched" and require verification</li>
              <li>Confidence scores indicate the likelihood of correct matching</li>
            </ul>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Manual Matching:</h4>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Select an unmatched transaction from the list</li>
              <li>Click the "Match" button to view potential matches</li>
              <li>Review the suggested expense records</li>
              <li>Select the correct expense to link to the transaction</li>
              <li>Confirm the match to update both records</li>
            </ol>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Batch Matching:</h4>
            <p className="text-sm">
              For multiple similar transactions, you can select several records and match them as a batch to save time. Use this feature for recurring expenses like crew salaries or regular service payments.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Handling Exceptions',
      description: 'Managing unmatched and discrepant transactions',
      icon: <BadgeAlert className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>
            Not all transactions will have matching expense records. This section covers how to handle unmatched transactions and reconciliation exceptions.
          </p>

          <div className="space-y-2">
            <h4 className="font-medium">Creating New Expense Records:</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Select an unmatched transaction</li>
              <li>Click "Create Expense" to generate a new expense record</li>
              <li>The system will pre-fill information from the transaction</li>
              <li>Add any missing details such as category and description</li>
              <li>Save the new expense record to complete the match</li>
            </ol>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Handling Discrepancies:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Amount discrepancies (transaction and expense amounts differ)</li>
              <li>Date discrepancies (timing differences in recording)</li>
              <li>Split transactions (one payment covering multiple expenses)</li>
              <li>Bundled transactions (multiple payments in one transaction)</li>
              <li>Unknown or unidentifiable transactions</li>
            </ul>
          </div>

          <div className="rounded-md bg-amber-50 p-3 border border-amber-200 text-amber-800 mt-4">
            <h4 className="font-medium">Important</h4>
            <p className="text-sm mt-1">
              Always investigate unmatched transactions thoroughly. Unknown transactions could represent errors, fraud, or forgotten expenses that need proper documentation.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Finalizing Reconciliation',
      description: 'Completing the reconciliation process',
      icon: <BarChartBig className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>
            The final step is to mark transactions as reconciled and generate reports for financial review and record-keeping.
          </p>

          <div className="space-y-2">
            <h4 className="font-medium">Verification Steps:</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Review all matched transactions for accuracy</li>
              <li>Ensure no unmatched transactions remain (or document reasons)</li>
              <li>Verify that totals match between bank statements and system records</li>
              <li>Check for any pending transactions that should be considered</li>
              <li>Generate a reconciliation summary for approval</li>
            </ol>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Mark as Reconciled:</h4>
            <p className="text-sm">
              Once all transactions are properly matched and verified, select the transactions and click "Mark as Reconciled." This action finalizes the reconciliation and updates the transaction status for reporting.
            </p>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Reconciliation Reporting:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Generate a reconciliation report for the period</li>
              <li>Review reconciliation statistics and metrics</li>
              <li>Export reconciliation data for accounting systems</li>
              <li>Document any exceptions or special handling</li>
              <li>Archive the reconciliation for audit purposes</li>
            </ul>
          </div>

          <div className="rounded-md bg-green-50 p-3 border border-green-200 text-green-800 mt-4">
            <h4 className="font-medium">Best Practice</h4>
            <p className="text-sm mt-1">
              Complete reconciliation on a regular schedule (weekly or monthly) rather than letting transactions accumulate, which makes the process more difficult and time-consuming.
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
            <FileCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Transaction Reconciliation Guide</CardTitle>
            <CardDescription>Learn how to match and reconcile financial transactions</CardDescription>
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

export default ReconciliationGuide;