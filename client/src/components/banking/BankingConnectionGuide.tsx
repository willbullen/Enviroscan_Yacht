import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  List, 
  ChevronRight,
  CheckCircle2,
  Circle,
  HelpCircle,
  Info,
  Lock
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BankingConnectionGuideProps {
  currentStep?: number;
  onSelectStep?: (step: number) => void;
  className?: string;
}

export const BankingConnectionGuide: React.FC<BankingConnectionGuideProps> = ({
  currentStep = 0,
  onSelectStep,
  className
}) => {
  const steps = [
    {
      title: 'Configure API Settings',
      description: 'Set up API credentials for banking providers',
      icon: <Settings className="h-5 w-5" />,
      details: 'Add your banking API keys in the Settings page. These secure credentials allow the system to connect to your financial institutions and retrieve transaction data.'
    },
    {
      title: 'Connect Bank Accounts',
      description: 'Link your financial accounts to the system',
      icon: <CreditCard className="h-5 w-5" />,
      details: 'Connect your Centtrip, Revolut, or other supported banking providers to retrieve transaction data automatically. Each connection provides real-time access to your account information.'
    },
    {
      title: 'Sync Transactions',
      description: 'Import banking transactions into the system',
      icon: <RefreshCw className="h-5 w-5" />,
      details: 'Once connected, you can sync transactions from your bank accounts. The system will retrieve the latest transactions and prepare them for reconciliation.'
    },
    {
      title: 'Match & Reconcile',
      description: 'Match transactions to expenses',
      icon: <CheckCircle className="h-5 w-5" />,
      details: 'The system helps you match imported transactions with existing expenses to keep your financial records accurate. Unmatched transactions can be converted to new expenses if needed.'
    },
    {
      title: 'Generate Reports',
      description: 'Create financial reports and statements',
      icon: <List className="h-5 w-5" />,
      details: 'Once reconciled, you can generate accurate financial reports showing your reconciled and unreconciled transactions. These reports help maintain compliance and provide financial visibility.'
    }
  ];

  const handleStepClick = (stepIndex: number) => {
    if (onSelectStep) {
      onSelectStep(stepIndex);
    }
  };

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center">
              <span>Banking Integration Guide</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-1 p-0 h-6 w-6">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>This guide explains the step-by-step process for connecting and reconciling your banking transactions.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Button variant="link" className="text-xs font-normal" onClick={() => onSelectStep && onSelectStep(-1)}>
              Hide Guide
            </Button>
          </CardTitle>
          <CardDescription>
            Follow these steps to set up banking integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {steps.map((step, index) => (
              <div 
                key={index}
                onClick={() => handleStepClick(index)}
                className={`cursor-pointer rounded-md transition-colors border ${currentStep === index ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'}`}
              >
                <div className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${index < currentStep ? 'bg-primary text-primary-foreground' : 'border-primary'}`}>
                      {index < currentStep ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <>
                          {index === currentStep ? (
                            <Circle className="h-5 w-5 fill-primary text-primary-foreground" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{step.title}</h3>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  
                  {currentStep === index && (
                    <div className="mt-3 text-sm text-muted-foreground pl-10 border-l-2 border-primary/20">
                      <p>{step.details}</p>
                      
                      {index === 0 && (
                        <div className="mt-2 flex items-center gap-2 text-primary text-xs">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7">
                                <Settings className="h-3.5 w-3.5 mr-1" />
                                Banking Settings
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Configure your banking API connections</p>
                            </TooltipContent>
                          </Tooltip>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      )}
                      
                      {index === 1 && (
                        <div className="mt-2 flex items-center gap-2 text-primary text-xs">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Centtrip
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Revolut
                              </Badge>
                            </div>
                            <p className="text-muted-foreground italic">API credentials required for secure connections</p>
                          </div>
                        </div>
                      )}
                      
                      {index === 2 && (
                        <div className="mt-2 flex items-center gap-2 text-primary text-xs">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7">
                                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                Sync Transactions
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Fetch the latest transactions from connected accounts</p>
                            </TooltipContent>
                          </Tooltip>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      )}
                      
                      {index === 3 && (
                        <div className="mt-2 flex items-center gap-2 text-primary text-xs">
                          <div className="flex gap-2">
                            <div className="flex items-center px-3 py-1 rounded-sm border">
                              <div className="w-2 h-2 rounded-full mr-2 bg-amber-500"></div>
                              Unmatched
                            </div>
                            <div className="flex items-center px-3 py-1 rounded-sm border">
                              <div className="w-2 h-2 rounded-full mr-2 bg-green-500"></div>
                              Reconciled
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {index === 4 && (
                        <div className="mt-2 flex flex-col gap-2 text-primary text-xs">
                          <div className="flex items-center">
                            <p>Generate financial reports:</p>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 p-0">
                                  <Info className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>Export reconciled data for financial reporting</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1 p-1 border rounded">
                              <List className="h-3.5 w-3.5" />
                              <span>Reconciliation</span>
                            </div>
                            <div className="flex items-center gap-1 p-1 border rounded">
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>Audit</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};