import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle,
  XCircle,
  ArrowRight,
  AlertCircle,
  Info,
  Check,
  ToggleLeft,
  ToggleRight,
  HelpCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FormActivationStep {
  title: string;
  description: string;
  image: React.ReactNode;
  hint?: string;
}

export const FormActivationGuide: React.FC<{ className?: string }> = ({ className }) => {
  const activationSteps: FormActivationStep[] = [
    {
      title: '1. Locate the inactive form',
      description: 'Find the form category, template or version you want to activate',
      image: (
        <div className="rounded-md border border-gray-200 dark:border-gray-800 p-2 bg-background">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
            <span className="text-sm font-medium">Safety Inspections</span>
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Inactive</span>
          </div>
        </div>
      ),
      hint: 'You can use the status filter to show only inactive items'
    },
    {
      title: '2. Click the status toggle',
      description: 'The current status is shown with a toggle that can be clicked',
      image: (
        <div className="rounded-md border border-gray-200 dark:border-gray-800 p-2 bg-background">
          <div className="flex items-center gap-4">
            <div className="flex items-center px-3 py-1 rounded-full cursor-pointer bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
              <div className="w-3 h-3 rounded-full mr-2 bg-gray-400"></div>
              Inactive
              <ToggleLeft className="ml-2 h-4 w-4" />
            </div>
            <ArrowRight className="h-4 w-4" />
            <div className="flex items-center px-3 py-1 rounded-full cursor-pointer bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
              Active
              <ToggleRight className="ml-2 h-4 w-4" />
            </div>
          </div>
        </div>
      )
    },
    {
      title: '3. Confirm status change',
      description: 'Confirm that you want to activate the form',
      image: (
        <div className="rounded-md border border-gray-200 dark:border-gray-800 p-2 bg-background">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium">Confirm Activation</span>
          </div>
          <p className="text-xs mb-2">Are you sure you want to activate "Safety Inspections"?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="h-7">Cancel</Button>
            <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700">Activate</Button>
          </div>
        </div>
      ),
      hint: 'Some forms may require additional configuration before activation'
    },
    {
      title: '4. Check activation requirements',
      description: 'Ensure all dependencies are active for full functionality',
      image: (
        <div className="rounded-md border border-gray-200 dark:border-gray-800 p-2 bg-background">
          <div className="flex flex-col gap-1">
            <div className="flex items-center text-xs">
              <Check className="h-3.5 w-3.5 text-green-500 mr-1.5" />
              <span>Form category is active</span>
            </div>
            <div className="flex items-center text-xs">
              <Check className="h-3.5 w-3.5 text-green-500 mr-1.5" />
              <span>Form template is active</span>
            </div>
            <div className="flex items-center text-xs">
              <XCircle className="h-3.5 w-3.5 text-red-500 mr-1.5" />
              <span>Form version is inactive</span>
            </div>
          </div>
        </div>
      ),
      hint: 'A form will only be usable when its category, template, and at least one version are all active'
    }
  ];

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <CardTitle className="text-lg">Form Activation Guide</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-1 p-0 h-6 w-6">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>This guide explains how to activate forms and make them available for users in the system</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-5 w-5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Click any step for more details</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <CardDescription>
            How to activate forms and make them available to users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activationSteps.map((step, index) => (
            <div key={index} className="flex flex-col md:flex-row gap-4 pb-4 border-b last:border-0 last:pb-0">
              <div className="md:w-1/2">
                <h3 className="text-sm font-medium">{step.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                {step.hint && (
                  <div className="flex items-center gap-1 mt-2 p-1.5 bg-primary/10 rounded text-xs">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-primary" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p>Important guidance for this step</p>
                      </TooltipContent>
                    </Tooltip>
                    <span>{step.hint}</span>
                  </div>
                )}
              </div>
              <div className="md:w-1/2">
                {step.image}
              </div>
            </div>
          ))}

          <div className="rounded-md border border-primary/30 p-3 mt-4 bg-primary/5">
            <div className="flex items-start gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Check the activation status in tables and lists</p>
                </TooltipContent>
              </Tooltip>
              <div>
                <h3 className="text-sm font-medium">Activation Status Indicators</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  When a form is fully active, it will appear with a green status indicator and be available to users
                  in their appropriate sections. If any component of the form (category, template, or version) is inactive,
                  the form will not be accessible.
                </p>
                
                <div className="flex items-center gap-2 mt-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <ToggleRight className="h-3.5 w-3.5 mr-1 text-green-500" />
                    View Active Forms
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <ToggleLeft className="h-3.5 w-3.5 mr-1 text-gray-500" />
                    View Inactive Forms
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};