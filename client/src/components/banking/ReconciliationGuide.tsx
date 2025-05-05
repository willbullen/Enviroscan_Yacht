import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileCheck, 
  DownloadCloud, 
  Search, 
  CheckCircle, 
  FileText, 
  ChevronRight,
  CheckCircle2,
  Circle,
  HelpCircle,
  Info,
  AlertCircle,
  ReceiptText,
  CheckSquare,
  ArrowDownUp,
  Link
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReconciliationGuideProps {
  currentStep?: number;
  onSelectStep?: (step: number) => void;
  className?: string;
}

export const ReconciliationGuide: React.FC<ReconciliationGuideProps> = ({
  currentStep = 0,
  onSelectStep,
  className
}) => {
  const steps = [
    {
      title: 'Import Transactions',
      description: 'Fetch bank transaction data',
      icon: <DownloadCloud className="h-5 w-5" />,
      details: 'Use banking connections to import transaction data, or manually upload CSV files from your bank. The system will format and organize the data for reconciliation.'
    },
    {
      title: 'Review Transactions',
      description: 'Verify imported transaction data',
      icon: <Search className="h-5 w-5" />,
      details: 'Review your imported transactions for accuracy. Verify dates, amounts, and transaction details to ensure data quality before proceeding with reconciliation.'
    },
    {
      title: 'Match Expenses',
      description: 'Link transactions to expense records',
      icon: <Link className="h-5 w-5" />,
      details: 'The system will automatically suggest matches between bank transactions and expense records. You can confirm matches, create new expenses, or manually match items.'
    },
    {
      title: 'Upload Receipts',
      description: 'Attach receipts to expenses',
      icon: <ReceiptText className="h-5 w-5" />,
      details: 'Upload receipts for each transaction to maintain complete documentation. The AI-powered receipt scanning can extract and match receipt data to transactions.'
    },
    {
      title: 'Finalize Reconciliation',
      description: 'Confirm reconciled transactions',
      icon: <CheckSquare className="h-5 w-5" />,
      details: 'Mark transactions as reconciled once all documentation is complete. Reconciled transactions are locked to prevent further changes and maintain audit trails.'
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
              <span>Transaction Reconciliation Guide</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-1 p-0 h-6 w-6">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>This guide explains the process for reconciling banking transactions with expense records.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Button variant="link" className="text-xs font-normal" onClick={() => onSelectStep && onSelectStep(-1)}>
              Hide Guide
            </Button>
          </CardTitle>
          <CardDescription>
            Follow these steps to reconcile banking transactions
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
                                <DownloadCloud className="h-3.5 w-3.5 mr-1" />
                                Import Transactions
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Fetch transactions from connected banking providers</p>
                            </TooltipContent>
                          </Tooltip>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      )}
                      
                      {index === 1 && (
                        <div className="mt-2 flex flex-col gap-2 text-primary text-xs">
                          <div className="flex items-center">
                            <p>Transaction statuses:</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1 p-1 border rounded">
                              <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                              <span>New</span>
                            </div>
                            <div className="flex items-center gap-1 p-1 border rounded">
                              <div className="w-2 h-2 rounded-full bg-amber-500 mr-1"></div>
                              <span>Pending</span>
                            </div>
                            <div className="flex items-center gap-1 p-1 border rounded">
                              <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                              <span>Matched</span>
                            </div>
                            <div className="flex items-center gap-1 p-1 border rounded">
                              <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                              <span>Exception</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {index === 2 && (
                        <div className="mt-2 flex flex-col gap-2 text-primary text-xs">
                          <div className="flex items-center">
                            <p>Matching options:</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="gap-1">
                                <ArrowDownUp className="h-3 w-3" />
                                Auto-match
                              </Badge>
                              <span className="text-muted-foreground">System suggests likely matches</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="gap-1">
                                <Link className="h-3 w-3" />
                                Manual
                              </Badge>
                              <span className="text-muted-foreground">Manually select matching expenses</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {index === 3 && (
                        <div className="mt-2 flex items-center gap-2 text-primary text-xs">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7">
                                <ReceiptText className="h-3.5 w-3.5 mr-1" />
                                Upload Receipts
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Upload and match receipt images to transactions</p>
                            </TooltipContent>
                          </Tooltip>
                          <ChevronRight className="h-3.5 w-3.5" />
                          <span className="text-muted-foreground ml-1">AI-powered receipt scanning available</span>
                        </div>
                      )}
                      
                      {index === 4 && (
                        <div className="mt-2 flex flex-col gap-2 text-primary text-xs">
                          <div className="flex items-center">
                            <p>Reconciliation Report:</p>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 p-0">
                                  <Info className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>Generate reports of reconciled transactions</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3" />
                              <span>Reconciled</span>
                            </Badge>
                            <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-200">
                              <AlertCircle className="h-3 w-3" />
                              <span>Exceptions</span>
                            </Badge>
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