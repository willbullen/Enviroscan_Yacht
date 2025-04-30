import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FolderKanban, 
  FileText, 
  PenTool, 
  CheckCircle, 
  Users, 
  ChevronRight,
  FileCheck,
  Database,
  Circle,
  CheckCircle2,
  HelpCircle,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FormLifecycleGuideProps {
  currentStep?: number;
  onSelectStep?: (step: number) => void;
  className?: string;
}

export const FormLifecycleGuide: React.FC<FormLifecycleGuideProps> = ({
  currentStep = 0,
  onSelectStep,
  className
}) => {
  const steps = [
    {
      title: 'Create Category',
      description: 'Organize forms into logical categories',
      icon: <FolderKanban className="h-5 w-5" />,
      details: 'Categories help you organize forms by department, function, or any other grouping that makes sense for your organization.'
    },
    {
      title: 'Design Template',
      description: 'Define the structure of your form',
      icon: <FileText className="h-5 w-5" />,
      details: 'Templates define the basic structure of a form that can be reused. They belong to a category and can have multiple versions.'
    },
    {
      title: 'Build Form',
      description: 'Add fields and arrange the form layout',
      icon: <PenTool className="h-5 w-5" />,
      details: 'Use the drag-and-drop builder to add fields, arrange their order, and customize validation rules and appearance.'
    },
    {
      title: 'Activate & Deploy',
      description: 'Make the form available for use',
      icon: <CheckCircle className="h-5 w-5" />,
      details: 'Activate the form category, template, and version to make it available to users. Only active forms can be accessed.'
    },
    {
      title: 'Utilize Forms',
      description: 'Users complete forms across the system',
      icon: <Users className="h-5 w-5" />,
      details: 'Active forms can be accessed and filled out by users based on their permissions. Forms may be accessed via Tasks, Inspections, Reports, or other sections.'
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
              <span>Form Management Lifecycle</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-1 p-0 h-6 w-6">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>This guide explains the step-by-step process for creating and managing forms in the system.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Button variant="link" className="text-xs font-normal" onClick={() => onSelectStep && onSelectStep(-1)}>
              Hide Guide
            </Button>
          </CardTitle>
          <CardDescription>
            Follow these steps to create and manage forms
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
                                <FolderKanban className="h-3.5 w-3.5 mr-1" />
                                Create Category
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Opens form to create a new category</p>
                            </TooltipContent>
                          </Tooltip>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      )}
                      
                      {index === 1 && (
                        <div className="mt-2 flex items-center gap-2 text-primary text-xs">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7">
                                <FileText className="h-3.5 w-3.5 mr-1" />
                                New Template
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Opens form to create a new template</p>
                            </TooltipContent>
                          </Tooltip>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      )}
                      
                      {index === 2 && (
                        <div className="mt-2 flex items-center gap-2 text-primary text-xs">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7">
                                <PenTool className="h-3.5 w-3.5 mr-1" />
                                Form Builder
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Opens the drag-and-drop form builder interface</p>
                            </TooltipContent>
                          </Tooltip>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      )}
                      
                      {index === 3 && (
                        <div className="mt-2 flex items-center gap-2 text-primary text-xs">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center px-3 py-1 rounded-full cursor-pointer bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                                <div className="w-3 h-3 rounded-full mr-2 bg-gray-400"></div>
                                Inactive
                                <ChevronRight className="h-3.5 w-3.5 ml-1" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Click status badge to toggle activation state</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center px-3 py-1 rounded-full cursor-pointer bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
                                Active
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Active forms are available to end users</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                      
                      {index === 4 && (
                        <div className="mt-2 flex flex-col gap-2 text-primary text-xs">
                          <div className="flex items-center">
                            <p>Forms are available in these sections:</p>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 p-0">
                                  <Info className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>Active forms appear in relevant application modules for end users to fill out</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1 p-1 border rounded">
                              <FileCheck className="h-3.5 w-3.5" />
                              <span>Inspections</span>
                            </div>
                            <div className="flex items-center gap-1 p-1 border rounded">
                              <Database className="h-3.5 w-3.5" />
                              <span>Records</span>
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