import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Minus, GripVertical, PieChart, BarChart3, TrendingUp, DollarSign, Wallet } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

// Import the widget components
import ExpenseByCategoryWidget from './widgets/ExpenseByCategoryWidget';
import RecentTransactionsWidget from './widgets/RecentTransactionsWidget';
import BudgetTrackingWidget from './widgets/BudgetTrackingWidget';
import FinancialSummaryWidget from './widgets/FinancialSummaryWidget';
import CashFlowWidget from './widgets/CashFlowWidget';

// Widget type definitions
export type WidgetType = 
  | 'expense-categories' 
  | 'recent-transactions' 
  | 'budget-tracking' 
  | 'financial-summary'
  | 'cash-flow';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  size: 'small' | 'medium' | 'large';
  position: number;
}

const WIDGET_COMPONENTS = {
  'expense-categories': ExpenseByCategoryWidget,
  'recent-transactions': RecentTransactionsWidget,
  'budget-tracking': BudgetTrackingWidget,
  'financial-summary': FinancialSummaryWidget,
  'cash-flow': CashFlowWidget
};

const AVAILABLE_WIDGETS = [
  { type: 'expense-categories', title: 'Expenses by Category', icon: <PieChart className="h-4 w-4 mr-2" /> },
  { type: 'recent-transactions', title: 'Recent Transactions', icon: <DollarSign className="h-4 w-4 mr-2" /> },
  { type: 'budget-tracking', title: 'Budget Tracking', icon: <BarChart3 className="h-4 w-4 mr-2" /> },
  { type: 'financial-summary', title: 'Financial Summary', icon: <Wallet className="h-4 w-4 mr-2" /> },
  { type: 'cash-flow', title: 'Cash Flow', icon: <TrendingUp className="h-4 w-4 mr-2" /> },
];

// The sortable widget component
const SortableWidget = ({ widget, onRemove, vesselId }: { 
  widget: WidgetConfig; 
  onRemove: (id: string) => void;
  vesselId: number;
}) => {
  const WidgetComponent = WIDGET_COMPONENTS[widget.type];
  
  return (
    <div
      className={`mb-4 ${
        widget.size === 'small' 
          ? 'col-span-1' 
          : widget.size === 'medium' 
            ? 'col-span-2' 
            : 'col-span-3'
      }`}
    >
      <Card className="h-full">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <GripVertical className="h-5 w-5 mr-2 text-muted-foreground cursor-move" />
            {widget.title}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onRemove(widget.id)}
            className="h-8 w-8"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <WidgetComponent vesselId={vesselId} />
        </CardContent>
      </Card>
    </div>
  );
};

interface FinancialDashboardProps {
  vesselId: number;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ vesselId }) => {
  // Local storage key for saving dashboard configuration
  const storageKey = `financial-dashboard-${vesselId}`;
  
  // Load saved widget configuration from localStorage or use default
  const loadSavedWidgets = (): WidgetConfig[] => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Default widgets configuration
    return [
      { id: '1', type: 'financial-summary', title: 'Financial Summary', size: 'medium', position: 0 },
      { id: '2', type: 'expense-categories', title: 'Expenses by Category', size: 'medium', position: 1 },
      { id: '3', type: 'recent-transactions', title: 'Recent Transactions', size: 'large', position: 2 },
    ];
  };
  
  const [widgets, setWidgets] = useState<WidgetConfig[]>(loadSavedWidgets());
  const [selectedWidgetType, setSelectedWidgetType] = useState<WidgetType>('expense-categories');
  const [selectedWidgetSize, setSelectedWidgetSize] = useState<'small' | 'medium' | 'large'>('medium');
  
  // Save widgets to localStorage whenever they change
  const saveWidgets = (updatedWidgets: WidgetConfig[]) => {
    localStorage.setItem(storageKey, JSON.stringify(updatedWidgets));
    setWidgets(updatedWidgets);
  };
  
  // Add a new widget to the dashboard
  const addWidget = () => {
    const selectedWidget = AVAILABLE_WIDGETS.find(w => w.type === selectedWidgetType);
    if (!selectedWidget) return;
    
    const newWidget: WidgetConfig = {
      id: Date.now().toString(), // Generate a unique ID
      type: selectedWidgetType,
      title: selectedWidget.title,
      size: selectedWidgetSize,
      position: widgets.length, // Add to the end
    };
    
    saveWidgets([...widgets, newWidget]);
  };
  
  // Remove a widget from the dashboard
  const removeWidget = (id: string) => {
    const updatedWidgets = widgets.filter(w => w.id !== id).map((w, index) => ({
      ...w,
      position: index,
    }));
    saveWidgets(updatedWidgets);
  };
  
  // Handle drag-and-drop reordering
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = widgets.findIndex(w => w.id === active.id);
      const newIndex = widgets.findIndex(w => w.id === over.id);
      
      const reordered = arrayMove(widgets, oldIndex, newIndex).map((w, index) => ({
        ...w,
        position: index,
      }));
      
      saveWidgets(reordered);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Financial Dashboard</h2>
        
        <div className="flex space-x-2">
          <Select value={selectedWidgetType} onValueChange={(v) => setSelectedWidgetType(v as WidgetType)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select widget" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_WIDGETS.map(widget => (
                <SelectItem key={widget.type} value={widget.type}>
                  <div className="flex items-center">
                    {widget.icon}
                    {widget.title}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedWidgetSize} onValueChange={(v) => setSelectedWidgetSize(v as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Widget size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={addWidget}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Widget
          </Button>
        </div>
      </div>
      
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-3 gap-4">
            {widgets.sort((a, b) => a.position - b.position).map(widget => (
              <SortableWidget 
                key={widget.id} 
                widget={widget} 
                onRemove={removeWidget}
                vesselId={vesselId}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default FinancialDashboard;