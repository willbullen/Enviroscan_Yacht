import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Scan, 
  Search, 
  CheckCircle, 
  FileCheck, 
  ChevronRight,
  CheckCircle2,
  Circle,
  HelpCircle,
  Info,
  Database,
  FileSpreadsheet,
  Sparkles,
  Receipt
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReceiptMatchingGuideProps {
  currentStep?: number;
  onSelectStep?: (step: number) => void;
  className?: string;
}

export const ReceiptMatchingGuide: React.FC<ReceiptMatchingGuideProps> = ({
  currentStep = 0,
  onSelectStep,
  className
}) => {
  const steps = [
    {
      title: 'Upload Receipts',
      description: 'Import receipt images or PDFs',
      icon: <Upload className="h-5 w-5" />,
      details: 'Upload receipts from any device by dragging and dropping files or browsing your computer. Supported formats include JPG, PNG, and PDF.'
    },
    {
      title: 'AI Processing',
      description: 'Extract data from receipts automatically',
      icon: <Sparkles className="h-5 w-5" />,
      details: 'AI technology automatically extracts key information from receipts, including vendor name, date, amount, payment method, and line items.'
    },
    {
      title: 'Match With Expenses',
      description: 'Link receipts to expense records',
      icon: <Search className="h-5 w-5" />,
      details: 'The system will suggest matches between your receipts and existing expenses. Confirm matches or create new expense records from receipt data.'
    },
    {
      title: 'Verify Data',
      description: 'Review and confirm extracted information',
      icon: <CheckCircle className="h-5 w-5" />,
      details: 'Verify that the data extracted from receipts is accurate. You can manually adjust any fields if needed before finalizing the expense record.'
    },
    {
      title: 'Organize & Archive',
      description: 'Store receipts securely for future reference',
      icon: <Database className="h-5 w-5" />,
      details: 'All receipt images are securely stored and linked to their corresponding expenses for easy retrieval during audits or financial reviews.'
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
              <span>AI Receipt Matching Guide</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-1 p-0 h-6 w-6">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>This guide explains how to use AI-powered receipt matching to streamline expense documentation.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Button variant="link" className="text-xs font-normal" onClick={() => onSelectStep && onSelectStep(-1)}>
              Hide Guide
            </Button>
          </CardTitle>
          <CardDescription>
            Follow these steps to match receipts with expenses
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
                                <Upload className="h-3.5 w-3.5 mr-1" />
                                Upload Receipts
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Upload receipt images or documents</p>
                            </TooltipContent>
                          </Tooltip>
                          <span className="text-muted-foreground ml-1">Drag & drop supported</span>
                        </div>
                      )}
                      
                      {index === 1 && (
                        <div className="mt-2 flex items-center gap-2 text-primary text-xs">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1 bg-purple-50 text-purple-700 border-purple-200">
                              <Sparkles className="h-3 w-3" />
                              <span>AI-Powered</span>
                            </Badge>
                            <span className="text-muted-foreground">Using advanced OCR technology</span>
                          </div>
                        </div>
                      )}
                      
                      {index === 2 && (
                        <div className="mt-2 flex flex-col gap-2 text-primary text-xs">
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center px-3 py-1 rounded-sm border bg-blue-50 text-blue-700">
                                  <Receipt className="h-3.5 w-3.5 mr-1" />
                                  <span>Auto-Match</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>System automatically matches receipts based on date, amount, and vendor</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center px-3 py-1 rounded-sm border">
                                  <Search className="h-3.5 w-3.5 mr-1" />
                                  <span>Manual Match</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Manually select which expense to match with a receipt</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      )}
                      
                      {index === 3 && (
                        <div className="mt-2 flex flex-col gap-2 text-primary text-xs">
                          <div className="flex items-center">
                            <p>Verify extracted fields:</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1 p-1 border rounded">
                              <FileSpreadsheet className="h-3.5 w-3.5" />
                              <span>Amount</span>
                            </div>
                            <div className="flex items-center gap-1 p-1 border rounded">
                              <FileSpreadsheet className="h-3.5 w-3.5" />
                              <span>Date</span>
                            </div>
                            <div className="flex items-center gap-1 p-1 border rounded">
                              <FileSpreadsheet className="h-3.5 w-3.5" />
                              <span>Vendor</span>
                            </div>
                            <div className="flex items-center gap-1 p-1 border rounded">
                              <FileSpreadsheet className="h-3.5 w-3.5" />
                              <span>Details</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {index === 4 && (
                        <div className="mt-2 flex flex-col gap-2 text-primary text-xs">
                          <div className="flex items-center">
                            <p>Receipt storage benefits:</p>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 p-0">
                                  <Info className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>All receipts are securely stored and accessible for audit purposes</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1 p-1 border rounded">
                              <FileCheck className="h-3.5 w-3.5" />
                              <span>Audit Compliance</span>
                            </div>
                            <div className="flex items-center gap-1 p-1 border rounded">
                              <Database className="h-3.5 w-3.5" />
                              <span>Secure Storage</span>
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