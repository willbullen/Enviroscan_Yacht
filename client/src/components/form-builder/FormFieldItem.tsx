import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FormField } from './FormBuilderDragDrop';
import { Pencil, Trash2, Copy, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FormFieldItemProps {
  field: FormField;
  isSelected: boolean;
  showControls?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export const FormFieldItem: React.FC<FormFieldItemProps> = ({
  field,
  isSelected,
  showControls = true,
  onSelect,
  onDelete,
  onDuplicate,
}) => {
  const renderFieldPreview = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'url':
        return (
          <input
            type={field.type}
            className="w-full p-2 rounded border border-input bg-transparent"
            placeholder={field.placeholder || `Enter ${field.label}`}
            disabled
          />
        );
      case 'textarea':
        return (
          <textarea
            className="w-full p-2 rounded border border-input bg-transparent h-20"
            placeholder={field.placeholder || `Enter ${field.label}`}
            disabled
          />
        );
      case 'number':
        return (
          <input
            type="number"
            className="w-full p-2 rounded border border-input bg-transparent"
            placeholder={field.placeholder || 'Enter a number'}
            min={field.min}
            max={field.max}
            step={field.step}
            disabled
          />
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              disabled
            />
            <span className="text-sm">{field.label}</span>
          </div>
        );
      case 'select':
        return (
          <select
            className="w-full p-2 rounded border border-input bg-transparent"
            disabled
          >
            <option value="">Select an option...</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`radio-${field.id}`}
                  className="h-4 w-4 border-gray-300"
                  disabled
                />
                <span className="text-sm">{option}</span>
              </div>
            ))}
          </div>
        );
      case 'date':
        return (
          <input
            type="date"
            className="w-full p-2 rounded border border-input bg-transparent"
            disabled
          />
        );
      case 'time':
        return (
          <input
            type="time"
            className="w-full p-2 rounded border border-input bg-transparent"
            disabled
          />
        );
      case 'heading':
        return <h3 className="text-lg font-semibold">{field.label}</h3>;
      case 'paragraph':
        return <p className="text-sm text-muted-foreground">{field.label}</p>;
      default:
        return null;
    }
  };

  return (
    <Card 
      className={cn(
        "transition-all relative", 
        isSelected ? "ring-2 ring-primary" : "",
        field.type === 'heading' || field.type === 'paragraph' ? "shadow-none border-dashed" : ""
      )}
      onClick={onSelect}
    >
      {showControls && (
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full bg-background shadow border cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <CardContent className={cn(
        "p-3", 
        field.type === 'heading' || field.type === 'paragraph' ? "hover:bg-muted/50" : ""
      )}>
        {field.type !== 'checkbox' && field.type !== 'heading' && field.type !== 'paragraph' && (
          <div className="mb-2">
            <label className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            {field.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{field.description}</p>
            )}
          </div>
        )}
        
        {renderFieldPreview()}
        
        {showControls && (
          <div className="flex justify-end space-x-1 mt-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.();
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.();
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};