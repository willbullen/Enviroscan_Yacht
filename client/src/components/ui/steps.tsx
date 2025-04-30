import React, { createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';

// Context for steps
interface StepsContextValue {
  currentStep: number;
  orientation: 'horizontal' | 'vertical';
}

const StepsContext = createContext<StepsContextValue>({
  currentStep: 0,
  orientation: 'horizontal'
});

// Step component
interface StepProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface StepHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface StepIconProps {
  children?: React.ReactNode;
  className?: string;
  completed?: boolean;
}

interface StepTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface StepDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface StepsProps {
  currentStep: number;
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

// Main Steps component
export function Steps({ 
  currentStep, 
  children, 
  className, 
  orientation = 'horizontal' 
}: StepsProps) {
  return (
    <StepsContext.Provider value={{ currentStep, orientation }}>
      <div className={cn(
        'flex',
        orientation === 'vertical' ? 'flex-col' : 'items-center',
        className
      )}>
        {children}
      </div>
    </StepsContext.Provider>
  );
}

// Step component with its subcomponents
const Step = ({ children, className, onClick }: StepProps) => {
  const { currentStep, orientation } = useContext(StepsContext);
  const stepIndex = React.Children.toArray(
    //@ts-ignore
    React.useContext(StepsContext).children
  ).findIndex((child) => child === children);

  const isActive = stepIndex === currentStep;
  const isCompleted = stepIndex < currentStep;

  return (
    <div
      className={cn(
        'relative flex',
        orientation === 'vertical' ? 'flex-col' : 'flex-col items-center',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const StepHeader = ({ children, className }: StepHeaderProps) => {
  const { orientation } = useContext(StepsContext);
  
  return (
    <div className={cn(
      'flex items-center gap-2',
      orientation === 'vertical' ? 'flex-row' : 'flex-col',
      className
    )}>
      {children}
    </div>
  );
};

const StepIcon = ({ children, className, completed }: StepIconProps) => {
  const { currentStep } = useContext(StepsContext);
  
  return (
    <div className={cn(
      'flex items-center justify-center w-7 h-7 rounded-full border',
      completed ? 'bg-primary text-primary-foreground' : 'border-primary',
      className
    )}>
      {completed ? <CheckIcon className="h-4 w-4" /> : children}
    </div>
  );
};

const StepTitle = ({ children, className }: StepTitleProps) => {
  return (
    <div className={cn('font-medium text-sm', className)}>
      {children}
    </div>
  );
};

const StepDescription = ({ children, className }: StepDescriptionProps) => {
  return (
    <div className={cn('text-xs text-muted-foreground', className)}>
      {children}
    </div>
  );
};

// Compose the Step component with its subcomponents
Step.Header = StepHeader;
Step.Icon = StepIcon;
Step.Title = StepTitle;
Step.Description = StepDescription;

export { Step };