import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CreditCard,
  ArrowRight, 
  ArrowLeft,
  Building2,
  Key,
  ShieldCheck,
  Link,
  Lock,
  Landmark
} from 'lucide-react';

interface BankingConnectionGuideProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
}

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const BankingConnectionGuide: React.FC<BankingConnectionGuideProps> = ({
  currentStep,
  onSelectStep,
}) => {
  const steps: Step[] = [
    {
      title: 'Banking Integration Overview',
      description: 'Understanding banking connections and data flow',
      icon: <Landmark className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>
            The Banking Integration feature allows you to connect your yacht's bank accounts to the system, enabling automatic synchronization of financial transactions.
          </p>

          <div className="space-y-2">
            <h4 className="font-medium">Key Benefits:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Automatic transaction import from connected bank accounts</li>
              <li>Reduced manual data entry and fewer errors</li>
              <li>Simplified reconciliation process</li>
              <li>Real-time financial data for better decision making</li>
              <li>Enhanced financial reporting capabilities</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Supported Banking Providers:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Centtrip</strong> - Multi-currency maritime financial services</li>
              <li><strong>Revolut</strong> - Global business banking solutions</li>
              <li>More providers will be added in future updates</li>
            </ul>
          </div>

          <div className="rounded-md bg-muted p-3">
            <p className="text-sm font-medium">Note: This guide will walk you through the process of connecting bank accounts, securing API credentials, and configuring your banking integration.</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Obtaining API Credentials',
      description: 'Getting API keys from your banking providers',
      icon: <Key className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>
            To connect your bank accounts, you'll need to obtain API credentials from your banking providers. These credentials allow secure access to your account data.
          </p>

          <div className="space-y-2">
            <h4 className="font-medium">For Centtrip Accounts:</h4>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Log in to your Centtrip business account portal</li>
              <li>Navigate to Settings → API Integration</li>
              <li>Request API access if not already enabled</li>
              <li>Once approved, generate API credentials</li>
              <li>Save your API Key and Secret securely</li>
            </ol>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="font-medium">For Revolut Accounts:</h4>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Log in to Revolut Business dashboard</li>
              <li>Go to Developer → API</li>
              <li>Create a new API integration</li>
              <li>Set permissions for account access and transactions</li>
              <li>Generate and save your API key</li>
            </ol>
          </div>

          <div className="rounded-md bg-amber-50 p-3 border border-amber-200 text-amber-800">
            <h4 className="font-medium flex items-center">
              <ShieldCheck className="h-5 w-5 mr-2" />
              Security Notice
            </h4>
            <p className="text-sm mt-1">
              Keep your API credentials secure and never share them. The system encrypts all API keys and sensitive data in storage.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Configuring Banking Connections',
      description: 'Setting up connections in the system',
      icon: <Link className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>
            After obtaining your API credentials, you'll need to configure the banking connections in the system settings.
          </p>

          <div className="space-y-2">
            <h4 className="font-medium">Configuration Steps:</h4>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Navigate to Settings → Banking Integration</li>
              <li>Select the banking provider you want to connect</li>
              <li>Enter the API credentials from the previous step</li>
              <li>Test the connection to verify credentials</li>
              <li>Assign accounts to specific vessels (if applicable)</li>
              <li>Save your configuration</li>
            </ol>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Account Mapping:</h4>
            <p className="text-sm">
              You can map each bank account to specific expense categories or financial accounts in your chart of accounts. This ensures transactions are properly categorized during import.
            </p>
          </div>

          <div className="rounded-md bg-blue-50 p-3 border border-blue-200 text-blue-800 mt-4">
            <h4 className="font-medium">Test Mode Available</h4>
            <p className="text-sm mt-1">
              If you don't have API credentials yet, you can use the system in "Test Mode" with generated data to familiarize yourself with the functionality.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Managing Banking Connections',
      description: 'Monitoring and maintaining your connections',
      icon: <Building2 className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>
            Once your banking connections are configured, you'll need to manage and maintain them to ensure smooth operation.
          </p>

          <div className="space-y-2">
            <h4 className="font-medium">Regular Maintenance:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Periodically sync transactions manually or set up automatic syncing</li>
              <li>Monitor connection status and resolve any issues</li>
              <li>Update API credentials if they expire or need rotation</li>
              <li>Review and adjust account mappings as needed</li>
            </ul>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Troubleshooting:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>If transactions aren't importing, check connection status</li>
              <li>Verify API credentials are valid and haven't expired</li>
              <li>Ensure account permissions are properly configured</li>
              <li>Contact banking provider if persistent issues occur</li>
            </ul>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Security Best Practices:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Rotate API credentials periodically (every 3-6 months)</li>
              <li>Use read-only API access when possible</li>
              <li>Review authorized connections regularly</li>
              <li>Monitor for unusual transaction activity</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: 'Security and Privacy',
      description: 'Understanding data protection measures',
      icon: <Lock className="h-8 w-8 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>
            Security and privacy are paramount when connecting financial accounts. The system implements multiple layers of protection for your banking data.
          </p>

          <div className="space-y-2">
            <h4 className="font-medium">Security Measures:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Encryption</strong> - All API credentials and financial data are encrypted at rest and in transit</li>
              <li><strong>Access Control</strong> - Role-based permissions restrict who can view or modify banking connections</li>
              <li><strong>Secure Connections</strong> - All API communications use TLS/SSL encryption</li>
              <li><strong>Audit Logging</strong> - All access and changes to financial data are logged for security review</li>
              <li><strong>Credential Isolation</strong> - API keys are stored in secure, isolated credential storage</li>
            </ul>
          </div>

          <div className="space-y-2 mt-4">
            <h4 className="font-medium">Data Privacy:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Only essential financial data is retrieved from banking providers</li>
              <li>Data retention policies follow maritime financial regulations</li>
              <li>Personal information is minimized and protected</li>
              <li>Data is not shared with third parties</li>
            </ul>
          </div>

          <div className="rounded-md bg-green-50 p-3 border border-green-200 text-green-800 mt-4">
            <h4 className="font-medium flex items-center">
              <ShieldCheck className="h-5 w-5 mr-2" />
              Compliance
            </h4>
            <p className="text-sm mt-1">
              The banking integration is designed to comply with financial regulations including PCI-DSS, GDPR, and international maritime financial standards.
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
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Banking Connection Guide</CardTitle>
            <CardDescription>Learn how to set up and manage banking connections</CardDescription>
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

export default BankingConnectionGuide;