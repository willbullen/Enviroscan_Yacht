import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Building, 
  ChevronRight, 
  Settings, 
  KeyRound, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  ChevronLeft
} from 'lucide-react';

interface BankingConnectionGuideProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
}

const BankingConnectionGuide: React.FC<BankingConnectionGuideProps> = ({ 
  currentStep, 
  onSelectStep
}) => {
  const steps = [
    {
      title: 'Banking API Overview',
      icon: <Building className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p>
            The Banking API integration connects your vessel's financial accounts with banking providers like Centtrip and Revolut to automate transaction tracking.
          </p>
          <h4 className="font-medium">Benefits:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Automatic transaction syncing</li>
            <li>Simplified expense reconciliation</li>
            <li>Reduced manual data entry</li>
            <li>Real-time financial visibility</li>
          </ul>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Test Mode Available</AlertTitle>
            <AlertDescription>
              If you don't have API credentials yet, you can use Test Mode to explore the features with sample data.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      title: 'Obtaining API Credentials',
      icon: <KeyRound className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p>
            To connect with your banking providers, you'll need to obtain API credentials from their developer portals:
          </p>
          
          <h4 className="font-medium">Centtrip API:</h4>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Log in to your Centtrip business account</li>
            <li>Navigate to Settings → API Access</li>
            <li>Complete the API request form</li>
            <li>Save your API Key and Secret securely</li>
          </ol>
          
          <h4 className="font-medium mt-4">Revolut API:</h4>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Log in to Revolut Business portal</li>
            <li>Go to Developer → API Settings</li>
            <li>Generate a new API key with appropriate permissions</li>
            <li>Record your Client ID and API Secret</li>
          </ol>
          
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Security Best Practices</AlertTitle>
            <AlertDescription>
              API credentials provide access to your financial data. Store them securely and never share them with unauthorized individuals.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      title: 'Configuring Banking Connections',
      icon: <Settings className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p>
            Once you have your API credentials, you can configure them in the Banking Providers tab:
          </p>
          
          <ol className="list-decimal pl-5 space-y-2">
            <li>Select the Banking tab in Financial Management</li>
            <li>Click the "Configure" button next to your banking provider</li>
            <li>Enter your API Key and Secret in the configuration dialog</li>
            <li>Save your credentials</li>
            <li>The system will test the connection and show the status</li>
          </ol>
          
          <h4 className="font-medium mt-4">Connection Status:</h4>
          <ul className="space-y-2">
            <li className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span><strong>Connected:</strong> The API connection is working</span>
            </li>
            <li className="flex items-center">
              <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
              <span><strong>Disconnected:</strong> Check your credentials or provider status</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'Syncing Banking Data',
      icon: <RefreshCw className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p>
            After configuring your banking connections, you can sync transaction data from your providers:
          </p>
          
          <ol className="list-decimal pl-5 space-y-2">
            <li>Navigate to the Transactions tab</li>
            <li>Click the "Sync Banking Data" button</li>
            <li>The system will retrieve recent transactions from your banking providers</li>
            <li>New transactions will appear in the list with "Unmatched" status</li>
          </ol>
          
          <h4 className="font-medium mt-4">Sync Settings:</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>By default, the system syncs the last 30 days of transactions</li>
            <li>You can configure sync frequency in the provider settings</li>
            <li>Manual sync can be performed at any time</li>
          </ul>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>First-Time Sync</AlertTitle>
            <AlertDescription>
              The first sync may take longer as the system imports your historical transaction data.
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

export default BankingConnectionGuide;