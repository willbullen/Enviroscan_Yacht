import React, { useState } from 'react';
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

interface FormSection {
  title: string;
  fields: FormField[];
}

interface FormDefinition {
  title: string;
  sections: FormSection[];
}

interface FormSubmissionProps {
  taskId: number;
  formTemplateVersionId?: number;
  isOpen: boolean;
  onClose: () => void;
}

const FormSubmission: React.FC<FormSubmissionProps> = ({ 
  taskId, 
  formTemplateVersionId, 
  isOpen, 
  onClose 
}) => {
  const { toast } = useToast();
  const [formDefinition, setFormDefinition] = useState<FormDefinition | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load form definition when dialog opens
  React.useEffect(() => {
    if (isOpen && formTemplateVersionId) {
      console.log("Loading form definition for template version ID:", formTemplateVersionId);
      loadFormDefinition();
    }
  }, [isOpen, formTemplateVersionId]);
  
  const loadFormDefinition = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest(`/api/ism/form-template-versions/${formTemplateVersionId}`, {
        method: 'GET'
      });
      
      console.log("Form template version response:", response);
      
      // Check if the response contains the structure definition directly
      if (response && response.structureDefinition) {
        // Create a default form definition if the returned structure doesn't match
        let formStructure = response.structureDefinition;
        
        // If structureDefinition is a string (JSON), parse it
        if (typeof response.structureDefinition === 'string') {
          try {
            formStructure = JSON.parse(response.structureDefinition);
          } catch (e) {
            console.error("Failed to parse structureDefinition JSON:", e);
          }
        }
        
        console.log("Parsed form structure:", formStructure);
        
        // The database structure is different from what our component expects
        // The DB has { fields: [...] } but our component expects { title: "...", sections: [{ title: "...", fields: [...] }] }
        // Let's transform it to match our component's expectations
        let transformedStructure;
        
        if (formStructure.fields && !formStructure.sections) {
          // Convert from the DB format to our component format
          transformedStructure = {
            title: `Form ${response.versionNumber || formTemplateVersionId}`,
            sections: [
              {
                title: response.templateId ? `Template #${response.templateId}` : "Form Section",
                fields: formStructure.fields
              }
            ]
          };
          console.log("Transformed structure for component:", transformedStructure);
        } else if (formStructure.sections) {
          // Already in the correct format
          transformedStructure = formStructure;
        } else {
          // Create a default structure as fallback
          transformedStructure = {
            title: "Form " + formTemplateVersionId,
            sections: [
              {
                title: "Form Fields",
                fields: [
                  {
                    id: "field1",
                    type: "text",
                    label: "Default Field",
                    required: true
                  }
                ]
              }
            ]
          };
          console.log("Using default structure:", transformedStructure);
        }
        
        setFormDefinition(transformedStructure);
        
        // Initialize form data with empty values
        const initialData: Record<string, any> = {};
        const fieldsList = formStructure.fields || 
                         (formStructure.sections ? 
                            formStructure.sections.flatMap((s: any) => s.fields) : 
                            transformedStructure.sections.flatMap((s: any) => s.fields));
                            
        fieldsList.forEach((field: FormField) => {
          if (field.type === 'checkbox') {
            initialData[field.id] = false;
          } else if (field.type === 'number') {
            initialData[field.id] = 0;
          } else if (field.type === 'select') {
            initialData[field.id] = field.options?.[0] || '';
          } else {
            initialData[field.id] = '';
          }
        });
        
        console.log("Initial form data:", initialData);
        setFormData(initialData);
      } else {
        console.error("Form template missing structure definition:", response);
        toast({
          title: "Error",
          description: "Could not load form template - missing structure definition",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error loading form definition:', error);
      toast({
        title: "Error",
        description: `Failed to load form: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };
  
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      let isValid = true;
      let firstInvalidField = '';
      
      if (formDefinition) {
        for (const section of formDefinition.sections) {
          for (const field of section.fields) {
            if (field.required) {
              const value = formData[field.id];
              if (value === '' || value === null || value === undefined || 
                  (field.type === 'checkbox' && !value)) {
                isValid = false;
                if (!firstInvalidField) {
                  firstInvalidField = field.label;
                }
              }
            }
          }
        }
      }
      
      if (!isValid) {
        toast({
          title: "Validation Error",
          description: `Please fill in all required fields. (Missing: ${firstInvalidField})`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Submit the form data
      await apiRequest('/api/ism/form-submissions', {
        method: 'POST',
        data: {
          taskId: taskId,
          submissionData: formData,
          submittedById: 1, // Currently using the captain (ID 1) as the submitter
        },
      });
      
      // Update task status to completed
      await apiRequest(`/api/ism/tasks/${taskId}`, {
        method: 'PATCH',
        data: {
          status: 'completed'
        },
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({queryKey: ['/api/ism/tasks']});
      queryClient.invalidateQueries({queryKey: ['/api/ism/form-submissions']});
      
      toast({
        title: "Success",
        description: "Form submitted successfully",
      });
      
      onClose();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: `Failed to submit form: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <div key={field.id} className="space-y-1.5 mb-4">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
            />
          </div>
        );
      
      case 'date':
        return (
          <div key={field.id} className="space-y-1.5 mb-4">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type="datetime-local"
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
            />
          </div>
        );
      
      case 'textarea':
        return (
          <div key={field.id} className="space-y-1.5 mb-4">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={field.id}
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
            />
          </div>
        );
      
      case 'number':
        return (
          <div key={field.id} className="space-y-1.5 mb-4">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type="number"
              value={formData[field.id] || 0}
              onChange={(e) => handleFieldChange(field.id, parseInt(e.target.value))}
              required={field.required}
            />
          </div>
        );
      
      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center space-x-2 mb-4">
            <Checkbox 
              id={field.id} 
              checked={formData[field.id] || false}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            />
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
          </div>
        );
      
      case 'select':
        return (
          <div key={field.id} className="space-y-1.5 mb-4">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Select
              value={formData[field.id] || ''}
              onValueChange={(value) => handleFieldChange(field.id, value)}
            >
              <SelectTrigger id={field.id}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      default:
        return (
          <div key={field.id} className="text-red-500">
            Unknown field type: {field.type}
          </div>
        );
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formDefinition?.title || 'Complete Form'}</DialogTitle>
          <DialogDescription>
            Fill out the form below to complete this task. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-8 text-center">Loading form...</div>
        ) : (
          <div className="py-4">
            {formDefinition?.sections.map((section, index) => (
              <Card key={index} className="mb-6">
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {section.fields.map(renderField)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormSubmission;