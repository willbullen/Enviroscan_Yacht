import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FormBuilderDragDrop } from "@/components/form-builder/FormBuilderDragDrop";
import { FormField } from "@/components/form-builder/FormFieldItem";
import { FormLifecycleGuide } from "@/components/form-builder/FormLifecycleGuide";
import { FormProcessVisualization } from "@/components/form-builder/FormProcessVisualization";
import { FormActivationGuide } from "@/components/form-builder/FormActivationGuide";
import { FormTemplateDataTable } from "@/components/form-builder/FormTemplateDataTable";
import { Pagination } from "@/components/ui/pagination";

import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Clipboard, 
  ClipboardCheck, 
  FileText, 
  Users, 
  AlertTriangle, 
  Calendar, 
  Search, 
  Plus, 
  Filter, 
  Book,
  Upload,
  File,
  X,
  ListChecks,
  Settings,
  Edit,
  Trash2,
  Download,
  Eye,
  ArrowUpDown,
  HelpCircle,
  Info,
  FileCheck,
  CheckCircle,
  ListFilter,
  Loader2,
  RefreshCw,
  XCircle
} from 'lucide-react';

// Import the shared types from the FormTemplateDataTable
import { FormTemplate as DataTableFormTemplate, FormCategory as DataTableFormCategory } from "@/components/form-builder/FormTemplateDataTable";

// Define our local interfaces
interface FormCategory extends Omit<DataTableFormCategory, 'id'> {
  id: number;
  createdBy: number;
}

interface FormTemplate {
  id: number;
  title: string;
  description: string | null;
  categoryId: number;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface FormTemplateVersion {
  id: number;
  templateId: number;
  versionNumber: string;
  structureDefinition: any; // JSON structure for the form
  createdById: number | null;
  isActive: boolean | null;
  createdAt: string;
}

const FormCategory_DEFAULT = {
  name: '',
  description: '',
  isActive: true,
  createdBy: 1 // Default to captain user ID
};

const FormTemplate_DEFAULT = {
  title: '',
  description: '',
  categoryId: 0,
  isActive: true,
  createdById: 1 // Default to captain user ID
};

const FormsAdministration: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("categories");
  
  // Filter and sort state
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState('all');
  const [categorySortField, setCategorySortField] = useState('name');
  const [categorySortDirection, setCategorySortDirection] = useState('asc');
  const [categoryCurrentPage, setCategoryCurrentPage] = useState(1);
  const [categoryItemsPerPage, setCategoryItemsPerPage] = useState(10);
  
  const [templateFilter, setTemplateFilter] = useState('');
  const [templateStatusFilter, setTemplateStatusFilter] = useState('all');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState(0);
  const [templateSortField, setTemplateSortField] = useState('title');
  const [templateSortDirection, setTemplateSortDirection] = useState('asc');
  const [templateCurrentPage, setTemplateCurrentPage] = useState(1);
  const [templateItemsPerPage, setTemplateItemsPerPage] = useState(10);
  
  // Form Builder state for versions pagination
  const [versionCurrentPage, setVersionCurrentPage] = useState(1);
  const [versionItemsPerPage, setVersionItemsPerPage] = useState(5);
  
  // Form guide state
  const [showLifecycleGuide, setShowLifecycleGuide] = useState(false);
  const [currentLifecycleStep, setCurrentLifecycleStep] = useState(0);
  const [showProcessGuide, setShowProcessGuide] = useState(false);
  const [showActivationGuide, setShowActivationGuide] = useState(false);
  
  // Form categories state
  const [editingCategory, setEditingCategory] = useState<FormCategory | null>(null);
  const [newCategory, setNewCategory] = useState(FormCategory_DEFAULT);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<FormCategory | null>(null);
  const [isCategoryDeleteDialogOpen, setIsCategoryDeleteDialogOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete' | ''>('');
  
  // Form templates state
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState(FormTemplate_DEFAULT);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<FormTemplate | null>(null);
  const [isTemplateDeleteDialogOpen, setIsTemplateDeleteDialogOpen] = useState(false);
  
  // Form structure editor state
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [editingVersion, setEditingVersion] = useState<FormTemplateVersion | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [newVersion, setNewVersion] = useState<{
    templateId: number;
    versionNumber: string;
    structureDefinition: string;
    isActive: boolean;
  }>({
    templateId: 0,
    versionNumber: "1.0",
    structureDefinition: JSON.stringify({
      fields: [
        {
          id: "field1",
          type: "text",
          label: "Default Field",
          required: true
        }
      ]
    }, null, 2),
    isActive: true
  });
  
  // Mock versions data for development (until the API is fully implemented)
  const [mockVersions, setMockVersions] = useState<FormTemplateVersion[]>([
    {
      id: 1,
      templateId: 1,
      versionNumber: "1.0",
      structureDefinition: {
        fields: [
          {
            id: "field1",
            type: "text",
            label: "Incident Description",
            required: true,
            placeholder: "Enter a detailed description of the incident"
          },
          {
            id: "field2",
            type: "select",
            label: "Severity Level",
            required: true,
            options: ["Low", "Medium", "High", "Critical"]
          },
          {
            id: "field3",
            type: "date",
            label: "Date of Incident",
            required: true
          }
        ]
      },
      createdById: 1,
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ]);
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [formStructureValid, setFormStructureValid] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Data queries
  const formCategoriesQuery = useQuery({
    queryKey: ['/api/ism/form-categories'],
  });
  
  const formTemplatesQuery = useQuery({
    queryKey: ['/api/ism/form-templates'],
  });
  
  // Using TanStack Query v5 format
  const formVersionsQuery = useQuery({
    queryKey: ['/api/ism/form-template-versions'],
    enabled: !!selectedTemplate,
    retry: false,
    gcTime: 0,
    staleTime: 0
  });
  
  // Bulk action mutation for categories
  const bulkActionCategoryMutation = useMutation({
    mutationFn: async ({action, categoryIds}: {action: 'activate' | 'deactivate' | 'delete', categoryIds: number[]}) => {
      if (action === 'delete') {
        // Handle bulk delete
        const promises = categoryIds.map(id => 
          apiRequest(`/api/ism/form-categories/${id}`, { method: 'DELETE' })
        );
        return Promise.all(promises);
      } else {
        // Handle bulk activate/deactivate
        const isActive = action === 'activate';
        const promises = categoryIds.map(id => 
          apiRequest(`/api/ism/form-categories/${id}`, {
            method: 'PATCH',
            data: { isActive }
          })
        );
        return Promise.all(promises);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/ism/form-categories']});
      setSelectedCategories([]);
      setBulkActionOpen(false);
      setBulkAction('');
      toast({
        title: "Success",
        description: "Bulk action completed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to complete bulk action: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (category: typeof FormCategory_DEFAULT) => {
      return await apiRequest('/api/ism/form-categories', {
        method: 'POST',
        data: category,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/ism/form-categories']});
      setIsCategoryDialogOpen(false);
      setNewCategory(FormCategory_DEFAULT);
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create category: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  const updateCategoryMutation = useMutation({
    mutationFn: async (category: FormCategory) => {
      return await apiRequest(`/api/ism/form-categories/${category.id}`, {
        method: 'PATCH',
        data: {
          name: category.name,
          description: category.description,
          isActive: category.isActive
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/ism/form-categories']});
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update category: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      return await apiRequest(`/api/ism/form-categories/${categoryId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/ism/form-categories']});
      setIsCategoryDeleteDialogOpen(false);
      setCategoryToDelete(null);
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete category: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  // Template mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (template: typeof FormTemplate_DEFAULT) => {
      return await apiRequest('/api/ism/form-templates', {
        method: 'POST',
        data: template,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/ism/form-templates']});
      setIsTemplateDialogOpen(false);
      setNewTemplate(FormTemplate_DEFAULT);
      toast({
        title: "Success",
        description: "Template created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create template: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  const updateTemplateMutation = useMutation({
    mutationFn: async (template: FormTemplate) => {
      return await apiRequest(`/api/ism/form-templates/${template.id}`, {
        method: 'PATCH',
        data: {
          title: template.title,
          description: template.description,
          categoryId: template.categoryId,
          isActive: template.isActive
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/ism/form-templates']});
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update template: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      return await apiRequest(`/api/ism/form-templates/${templateId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/ism/form-templates']});
      setIsTemplateDeleteDialogOpen(false);
      setTemplateToDelete(null);
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete template: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  // Version mutations
  const createVersionMutation = useMutation({
    mutationFn: async (version: typeof newVersion) => {
      // Make sure the structure definition is valid JSON
      let structureDefinition = version.structureDefinition;
      if (typeof structureDefinition === 'string') {
        structureDefinition = JSON.parse(structureDefinition);
      }
      
      return await apiRequest('/api/ism/form-template-versions', {
        method: 'POST',
        data: {
          ...version,
          structureDefinition
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/ism/form-template-versions']});
      setIsVersionDialogOpen(false);
      setNewVersion({
        templateId: 0,
        versionNumber: "1.0",
        structureDefinition: JSON.stringify({
          fields: [
            {
              id: "field1",
              type: "text",
              label: "Default Field",
              required: true
            }
          ]
        }, null, 2),
        isActive: true
      });
      setUploadedFile(null);
      toast({
        title: "Success",
        description: "Form template version created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create form version: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  // Update version mutation
  const updateVersionMutation = useMutation({
    mutationFn: async (version: { 
      id: number;
      templateId: number;
      versionNumber: string;
      structureDefinition: any;
      isActive: boolean | null; 
    }) => {
      // Make sure the structure definition is valid JSON
      let structureDefinition = version.structureDefinition;
      if (typeof structureDefinition === 'string') {
        try {
          structureDefinition = JSON.parse(structureDefinition);
        } catch (error) {
          console.error("Invalid JSON in structure definition", error);
          structureDefinition = { fields: [] };
        }
      }
      
      return await apiRequest(`/api/ism/form-template-versions/${version.id}`, {
        method: 'PATCH',
        data: {
          templateId: version.templateId,
          versionNumber: version.versionNumber,
          structureDefinition,
          isActive: version.isActive
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/ism/form-template-versions']});
      setIsVersionDialogOpen(false);
      setEditingVersion(null);
      setSelectedVersionId(null);
      toast({
        title: "Success",
        description: "Form template updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update form template: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  // Form template file upload handling
  const handleFormFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      
      // If it's a JSON file, we can try to parse it
      if (file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const jsonText = event.target?.result as string;
            // Validate the JSON structure
            const parsed = JSON.parse(jsonText);
            
            // Check if it contains the required fields array
            if (parsed.fields && Array.isArray(parsed.fields)) {
              setNewVersion({
                ...newVersion,
                structureDefinition: jsonText
              });
              setFormStructureValid(true);
            } else {
              setFormStructureValid(false);
              toast({
                title: "Invalid Form Structure",
                description: "The JSON file does not contain the required 'fields' array",
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error('Error parsing JSON:', error);
            setFormStructureValid(false);
            toast({
              title: "Invalid JSON",
              description: "The file does not contain valid JSON",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      } else if (file.type === 'application/pdf' || 
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For PDF or Word files, we'd need server-side parsing
        toast({
          title: "File Upload",
          description: "PDF and Word parsing will be implemented soon. Please use JSON format for now.",
          variant: "default",
        });
      }
    }
  };
  
  // Handle category form submission
  const handleCategorySubmit = () => {
    if (!newCategory.name) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (editingCategory) {
      updateCategoryMutation.mutate({
        ...editingCategory,
        name: newCategory.name,
        description: newCategory.description,
        isActive: newCategory.isActive
      });
    } else {
      createCategoryMutation.mutate(newCategory);
    }
  };
  
  // Handle template form submission
  const handleTemplateSubmit = () => {
    if (!newTemplate.title || !newTemplate.categoryId) {
      toast({
        title: "Validation Error",
        description: "Template title and category are required",
        variant: "destructive",
      });
      return;
    }
    
    if (editingTemplate) {
      updateTemplateMutation.mutate({
        ...editingTemplate,
        title: newTemplate.title,
        description: newTemplate.description,
        categoryId: newTemplate.categoryId,
        isActive: newTemplate.isActive
      });
    } else {
      createTemplateMutation.mutate(newTemplate);
    }
  };
  
  // Handle version creation
  const handleVersionSubmit = () => {
    if (!newVersion.templateId) {
      toast({
        title: "Validation Error",
        description: "Please select a template",
        variant: "destructive",
      });
      return;
    }
    
    if (!formStructureValid) {
      toast({
        title: "Validation Error",
        description: "The form structure is not valid JSON",
        variant: "destructive",
      });
      return;
    }
    
    createVersionMutation.mutate(newVersion);
  };
  
  // Open category edit dialog
  const handleEditCategory = (category: FormCategory) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive,
      createdBy: category.createdBy
    });
    setIsCategoryDialogOpen(true);
  };
  
  // Open template edit dialog
  const handleEditTemplate = (template: FormTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({
      title: template.title,
      description: template.description || '',
      categoryId: template.categoryId,
      isActive: template.isActive,
      createdById: template.createdById || 1
    });
    setIsTemplateDialogOpen(true);
  };
  
  // Open version creation dialog
  const handleCreateVersion = (template: FormTemplate) => {
    setSelectedTemplate(template);
    setNewVersion({
      ...newVersion,
      templateId: template.id
    });
    setIsVersionDialogOpen(true);
  };
  
  // Render form categories table
  const renderCategoriesTable = () => {
    if (formCategoriesQuery.isLoading) {
      return <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading categories...</p>
      </div>;
    }
    
    if (formCategoriesQuery.isError) {
      return <div className="bg-destructive/10 p-4 rounded-md border border-destructive/50 mb-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-destructive">API Error</h4>
            <p className="text-sm text-muted-foreground">
              There was an error loading form categories data. Please try again in a moment.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                queryClient.invalidateQueries({queryKey: ['/api/ism/form-categories']});
              }}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        </div>
      </div>;
    }
    
    const categories = formCategoriesQuery.data as FormCategory[] || [];
    
    if (categories.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Book className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No form categories found</p>
          <Button className="mt-4" onClick={() => {
            setEditingCategory(null);
            setNewCategory(FormCategory_DEFAULT);
            setIsCategoryDialogOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" /> Create First Category
          </Button>
        </div>
      );
    }
    
    // Filter categories based on search term and status
    const filteredCategories = categories.filter(category => {
      const matchesSearch = category.name.toLowerCase().includes(categoryFilter.toLowerCase()) || 
                           (category.description && category.description.toLowerCase().includes(categoryFilter.toLowerCase()));
      const matchesStatus = categoryStatusFilter === 'all' || 
                           (categoryStatusFilter === 'active' && category.isActive) || 
                           (categoryStatusFilter === 'inactive' && !category.isActive);
      
      return matchesSearch && matchesStatus;
    });
    
    // Sort categories
    const sortedCategories = [...filteredCategories].sort((a, b) => {
      if (categorySortField === 'name') {
        return categorySortDirection === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else if (categorySortField === 'description') {
        const descA = a.description || '';
        const descB = b.description || '';
        return categorySortDirection === 'asc' 
          ? descA.localeCompare(descB) 
          : descB.localeCompare(descA);
      } else if (categorySortField === 'status') {
        return categorySortDirection === 'asc' 
          ? (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1) 
          : (a.isActive === b.isActive ? 0 : a.isActive ? 1 : -1);
      } else if (categorySortField === 'created') {
        return categorySortDirection === 'asc' 
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() 
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
    
    // Handle toggling sort
    const toggleSort = (field: string) => {
      if (categorySortField === field) {
        setCategorySortDirection(categorySortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setCategorySortField(field);
        setCategorySortDirection('asc');
      }
    };
    
    // Directly toggle category status
    const toggleCategoryStatus = async (category: FormCategory) => {
      const updatedCategory = {
        ...category,
        isActive: !category.isActive
      };
      
      updateCategoryMutation.mutate(updatedCategory);
    };
    
    // Pagination
    const startIndex = (categoryCurrentPage - 1) * categoryItemsPerPage;
    const endIndex = startIndex + categoryItemsPerPage;
    const paginatedCategories = sortedCategories.slice(startIndex, endIndex);
    const totalCategories = sortedCategories.length;
    
    // Handle page change
    const handlePageChange = (page: number) => {
      setCategoryCurrentPage(page);
    };
    
    // Handle items per page change
    const handleItemsPerPageChange = (itemsPerPage: number) => {
      setCategoryItemsPerPage(itemsPerPage);
      setCategoryCurrentPage(1); // Reset to first page when changing items per page
    };
    
    return (
      <>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Form Categories</h2>
          <div className="flex space-x-2">
            {selectedCategories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <ListChecks className="w-4 h-4 mr-2" /> 
                    Bulk Actions ({selectedCategories.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Bulk Operations</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      setBulkAction('activate');
                      setBulkActionOpen(true);
                    }}
                    className="flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Activate Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      setBulkAction('deactivate');
                      setBulkActionOpen(true);
                    }}
                    className="flex items-center"
                  >
                    <XCircle className="w-4 h-4 mr-2 text-gray-500" />
                    Deactivate Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      setBulkAction('delete');
                      setBulkActionOpen(true);
                    }}
                    className="flex items-center text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button onClick={() => {
              setEditingCategory(null);
              setNewCategory(FormCategory_DEFAULT);
              setIsCategoryDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" /> New Category
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search Categories by name or description..."
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCategoryCurrentPage(1); // Reset to first page when filtering
                }}
                className="pl-8"
                aria-label="Search categories"
              />
            </div>
          </div>
          <div>
            <select
              value={categoryStatusFilter}
              onChange={(e) => {
                setCategoryStatusFilter(e.target.value);
                setCategoryCurrentPage(1); // Reset to first page when filtering
              }}
              className="px-3 py-2 rounded-md border border-input bg-background"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1.5"
                  disabled={selectedCategories.length === 0}
                >
                  <ListFilter className="h-4 w-4" />
                  Bulk Actions {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[160px]">
                <DropdownMenuLabel>Category Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    setBulkAction('activate');
                    handleBulkAction();
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  <span>Activate Selected</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setBulkAction('deactivate');
                    handleBulkAction();
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  <span>Deactivate Selected</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    setBulkAction('delete');
                    handleBulkAction();
                  }}
                  className="text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Selected</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
          
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={paginatedCategories.length > 0 && selectedCategories.length === paginatedCategories.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedCategories(paginatedCategories.map(c => c.id));
                    } else {
                      setSelectedCategories([]);
                    }
                  }}
                  aria-label="Select all categories on this page"
                />
              </TableHead>
              <TableHead onClick={() => toggleSort('name')} className="cursor-pointer hover:text-primary">
                <div className="flex items-center">
                  Name
                  {categorySortField === 'name' && (
                    <span className="ml-1">
                      {categorySortDirection === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4 transform rotate-180" />}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead onClick={() => toggleSort('description')} className="cursor-pointer hover:text-primary">
                <div className="flex items-center">
                  Description
                  {categorySortField === 'description' && (
                    <span className="ml-1">
                      {categorySortDirection === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4 transform rotate-180" />}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead onClick={() => toggleSort('status')} className="cursor-pointer hover:text-primary">
                <div className="flex items-center">
                  Status
                  {categorySortField === 'status' && (
                    <span className="ml-1">
                      {categorySortDirection === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4 transform rotate-180" />}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead onClick={() => toggleSort('created')} className="cursor-pointer hover:text-primary">
                <div className="flex items-center">
                  Created
                  {categorySortField === 'created' && (
                    <span className="ml-1">
                      {categorySortDirection === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4 transform rotate-180" />}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCategories.map(category => (
              <TableRow key={category.id}>
                <TableCell className="w-12">
                  <Checkbox
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={(checked) => handleSelectCategory(category.id, !!checked)}
                    aria-label={`Select category ${category.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.description || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div 
                      className={`flex items-center px-3 py-1 rounded-full cursor-pointer transition-colors ${
                        category.isActive 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => toggleCategoryStatus(category)}
                      role="button"
                      aria-label={`Toggle status. Currently ${category.isActive ? 'Active' : 'Inactive'}`}
                    >
                      <div className={`w-3 h-3 rounded-full mr-2 ${category.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      {category.isActive ? 'Active' : 'Inactive'}
                      <svg 
                        className="w-4 h-4 ml-2" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m-8 4H4m0 0l4 4m-4-4l4-4"></path>
                      </svg>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleEditCategory(category)}
                      className="h-8 w-8"
                      title="Edit category"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setCategoryToDelete(category);
                        setIsCategoryDeleteDialogOpen(true);
                      }}
                      title="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Pagination controls */}
        <Pagination
          totalItems={totalCategories}
          itemsPerPage={categoryItemsPerPage}
          currentPage={categoryCurrentPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          className="mt-4"
        />
        
        {filteredCategories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No categories match your filters</p>
          </div>
        )}
      </>
    );
  };
  
  // Render form templates table
  const renderTemplatesTable = () => {
    if (formTemplatesQuery.isLoading) {
      return <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading templates...</p>
      </div>;
    }
    
    if (formTemplatesQuery.isError) {
      return <div className="bg-destructive/10 p-4 rounded-md border border-destructive/50 mb-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-destructive">API Error</h4>
            <p className="text-sm text-muted-foreground">
              There was an error loading form templates data. Please try again in a moment.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                queryClient.invalidateQueries({queryKey: ['/api/ism/form-templates']});
              }}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        </div>
      </div>;
    }
    
    const templates = formTemplatesQuery.data as FormTemplate[] || [];
    const categories = formCategoriesQuery.data as FormCategory[] || [];
    
    // Create a map of category IDs to names for display
    const categoryMap = new Map<number, string>();
    categories.forEach(cat => categoryMap.set(cat.id, cat.name));
    
    if (templates.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No form templates found</p>
          <Button className="mt-4" onClick={() => {
            setEditingTemplate(null);
            setNewTemplate(FormTemplate_DEFAULT);
            setIsTemplateDialogOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" /> Create First Template
          </Button>
        </div>
      );
    }
    
    // Filter templates based on search term, status, and category
    const filteredTemplates = templates.filter(template => {
      const matchesSearch = template.title.toLowerCase().includes(templateFilter.toLowerCase()) || 
                           (template.description && template.description.toLowerCase().includes(templateFilter.toLowerCase()));
      const matchesStatus = templateStatusFilter === 'all' || 
                           (templateStatusFilter === 'active' && template.isActive) || 
                           (templateStatusFilter === 'inactive' && !template.isActive);
      const matchesCategory = templateCategoryFilter === 0 || template.categoryId === templateCategoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
    
    // Sort templates
    const sortedTemplates = [...filteredTemplates].sort((a, b) => {
      if (templateSortField === 'title') {
        return templateSortDirection === 'asc' 
          ? a.title.localeCompare(b.title) 
          : b.title.localeCompare(a.title);
      } else if (templateSortField === 'category') {
        const catA = categoryMap.get(a.categoryId) || '';
        const catB = categoryMap.get(b.categoryId) || '';
        return templateSortDirection === 'asc' 
          ? catA.localeCompare(catB) 
          : catB.localeCompare(catA);
      } else if (templateSortField === 'description') {
        const descA = a.description || '';
        const descB = b.description || '';
        return templateSortDirection === 'asc' 
          ? descA.localeCompare(descB) 
          : descB.localeCompare(descA);
      } else if (templateSortField === 'status') {
        return templateSortDirection === 'asc' 
          ? (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1) 
          : (a.isActive === b.isActive ? 0 : a.isActive ? 1 : -1);
      } else if (templateSortField === 'created') {
        return templateSortDirection === 'asc' 
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() 
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
    
    // Handle toggling sort
    const toggleSort = (field: string) => {
      if (templateSortField === field) {
        setTemplateSortDirection(templateSortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setTemplateSortField(field);
        setTemplateSortDirection('asc');
      }
    };
    
    // Directly toggle template status
    const toggleTemplateStatus = async (template: FormTemplate) => {
      const updatedTemplate = {
        ...template,
        isActive: !template.isActive
      };
      
      updateTemplateMutation.mutate(updatedTemplate);
    };
    
    // Pagination
    const startIndex = (templateCurrentPage - 1) * templateItemsPerPage;
    const endIndex = startIndex + templateItemsPerPage;
    const paginatedTemplates = sortedTemplates.slice(startIndex, endIndex);
    const totalTemplates = sortedTemplates.length;
    
    // Handle page change
    const handlePageChange = (page: number) => {
      setTemplateCurrentPage(page);
    };
    
    // Handle items per page change
    const handleItemsPerPageChange = (itemsPerPage: number) => {
      setTemplateItemsPerPage(itemsPerPage);
      setTemplateCurrentPage(1); // Reset to first page when changing items per page
    };
    
    return (
      <>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Form Templates</h2>
          <Button onClick={() => {
            setEditingTemplate(null);
            setNewTemplate(FormTemplate_DEFAULT);
            setIsTemplateDialogOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" /> New Template
          </Button>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search Templates by title or description..."
                value={templateFilter}
                onChange={(e) => {
                  setTemplateFilter(e.target.value);
                  setTemplateCurrentPage(1); // Reset to first page when filtering
                }}
                className="pl-8"
                aria-label="Search templates"
              />
            </div>
          </div>
          <div>
            <select
              value={templateStatusFilter}
              onChange={(e) => {
                setTemplateStatusFilter(e.target.value);
                setTemplateCurrentPage(1); // Reset to first page when filtering
              }}
              className="px-3 py-2 rounded-md border border-input bg-background"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <select
              value={templateCategoryFilter}
              onChange={(e) => {
                setTemplateCategoryFilter(parseInt(e.target.value));
                setTemplateCurrentPage(1); // Reset to first page when filtering
              }}
              className="px-3 py-2 rounded-md border border-input bg-background"
            >
              <option value={0}>All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => toggleSort('title')} className="cursor-pointer hover:text-primary">
                <div className="flex items-center">
                  Title
                  {templateSortField === 'title' && (
                    <span className="ml-1">
                      {templateSortDirection === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4 transform rotate-180" />}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead onClick={() => toggleSort('category')} className="cursor-pointer hover:text-primary">
                <div className="flex items-center">
                  Category
                  {templateSortField === 'category' && (
                    <span className="ml-1">
                      {templateSortDirection === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4 transform rotate-180" />}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead onClick={() => toggleSort('description')} className="cursor-pointer hover:text-primary">
                <div className="flex items-center">
                  Description
                  {templateSortField === 'description' && (
                    <span className="ml-1">
                      {templateSortDirection === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4 transform rotate-180" />}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead onClick={() => toggleSort('status')} className="cursor-pointer hover:text-primary">
                <div className="flex items-center">
                  Status
                  {templateSortField === 'status' && (
                    <span className="ml-1">
                      {templateSortDirection === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4 transform rotate-180" />}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead onClick={() => toggleSort('created')} className="cursor-pointer hover:text-primary">
                <div className="flex items-center">
                  Created
                  {templateSortField === 'created' && (
                    <span className="ml-1">
                      {templateSortDirection === 'asc' ? <ArrowUpDown className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4 transform rotate-180" />}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTemplates.map(template => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.title}</TableCell>
                <TableCell>{categoryMap.get(template.categoryId) || `Category #${template.categoryId}`}</TableCell>
                <TableCell>{template.description || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div 
                      className={`flex items-center px-3 py-1 rounded-full cursor-pointer transition-colors ${
                        template.isActive 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => toggleTemplateStatus(template)}
                      role="button"
                      aria-label={`Toggle status. Currently ${template.isActive ? 'Active' : 'Inactive'}`}
                    >
                      <div className={`w-3 h-3 rounded-full mr-2 ${template.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      {template.isActive ? 'Active' : 'Inactive'}
                      <svg 
                        className="w-4 h-4 ml-2" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m-8 4H4m0 0l4 4m-4-4l4-4"></path>
                      </svg>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{new Date(template.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleEditTemplate(template)}
                      className="h-8 w-8"
                      title="Edit template"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleCreateVersion(template)}
                      className="h-8 w-8"
                      title="Create new version"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setTemplateToDelete(template);
                        setIsTemplateDeleteDialogOpen(true);
                      }}
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Pagination controls */}
        {sortedTemplates.length > 0 && (
          <Pagination
            totalItems={totalTemplates}
            itemsPerPage={templateItemsPerPage}
            currentPage={templateCurrentPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            className="mt-4"
          />
        )}
        
        {filteredTemplates.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No templates match your filters</p>
          </div>
        )}
      </>
    );
  };

  // Render templates browser and form builder
  const renderFormBuilder = () => {
    const templates = formTemplatesQuery.data as FormTemplate[] || [];
    const categories = formCategoriesQuery.data as FormCategory[] || [];
    
    // Create a map of category IDs to names for display
    const categoryMap = new Map<number, string>();
    categories.forEach(cat => categoryMap.set(cat.id, cat.name));
    
    // For selected version form fields - handle initial field data
    const [formFields, setFormFields] = useState<FormField[]>([]);
    const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
    const [previewMode, setPreviewMode] = useState(false);
    
    // Handle form fields change from the drag-and-drop builder
    const handleFormFieldsChange = (newFields: FormField[]) => {
      setFormFields(newFields);
      
      // Update the structureDefinition in newVersion state
      const updatedStructure = JSON.stringify({ fields: newFields }, null, 2);
      if (editingVersion) {
        setNewVersion({
          ...newVersion,
          structureDefinition: updatedStructure
        });
      }
    };
    
    // Handle saving form structure
    const handleSaveFormStructure = () => {
      if (!selectedTemplate) return;
      
      // Prepare JSON structure for saving
      const structureData = {
        fields: formFields
      };
      
      // If editing an existing version, update it
      if (editingVersion) {
        setNewVersion({
          ...newVersion,
          structureDefinition: JSON.stringify(structureData, null, 2)
        });
        updateVersionMutation.mutate({
          id: editingVersion.id,
          templateId: editingVersion.templateId,
          versionNumber: newVersion.versionNumber,
          structureDefinition: structureData,
          isActive: newVersion.isActive
        });
      } else {
        // Create a new version
        setNewVersion({
          templateId: selectedTemplate.id,
          versionNumber: "1.0",
          structureDefinition: JSON.stringify(structureData, null, 2),
          isActive: true
        });
        
        // Open the version dialog to allow user to set version number
        setIsVersionDialogOpen(true);
      }
    };
    
    // Handle opening the form builder for a specific version
    const handleEditFormStructure = (version: FormTemplateVersion) => {
      let structureDef = version.structureDefinition;
      if (typeof structureDef === 'string') {
        try {
          structureDef = JSON.parse(structureDef);
        } catch (error) {
          console.error("Invalid JSON in structure definition", error);
          structureDef = { fields: [] };
        }
      }
      
      // Set editing version
      setEditingVersion(version);
      setSelectedVersionId(version.id);
      
      // Set form fields for the builder
      setFormFields(structureDef.fields || []);
      
      // Set newVersion data for potential updates
      setNewVersion({
        templateId: version.templateId,
        versionNumber: version.versionNumber,
        structureDefinition: JSON.stringify(structureDef, null, 2),
        isActive: version.isActive || false
      });
      
      // Switch to builder mode
      setPreviewMode(false);
    };
    
    return (
      <div className="grid grid-cols-1 gap-6 mt-4">
        {/* Template selection with data table */}
        <FormTemplateDataTable 
          templates={templates.map(template => ({
            id: template.id,
            title: template.title,
            description: template.description,
            categoryId: template.categoryId,
            originalFilename: null, // Required by the DataTable interface
            createdById: template.createdById,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt || null, // Convert string to string | null
            isActive: template.isActive
          }))} 
          categories={categories.map(category => ({
            id: category.id,
            name: category.name,
            description: category.description,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt || null, 
            isActive: category.isActive
          }))}
          onSelectTemplate={(template) => {
            // Find the original template in our data and select it
            const originalTemplate = templates.find(t => t.id === template.id);
            if (originalTemplate) {
              setSelectedTemplate(originalTemplate);
            }
          }}
        />
        
        {templates.length === 0 && (
          <Card className="mt-4">
            <CardContent className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-gray-500">No templates found. Please create a template first.</p>
              <Button className="mt-4" onClick={() => {
                setEditingTemplate(null);
                setNewTemplate(FormTemplate_DEFAULT);
                setIsTemplateDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" /> Create Template
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Versions list and Form Builder (if template is selected) */}
        {selectedTemplate && (
          <>
            {selectedVersionId ? (
              // Show form builder for the selected version
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>
                        {previewMode ? "Form Preview" : "Form Builder"} - {selectedTemplate.title} (v{editingVersion?.versionNumber})
                      </CardTitle>
                      <CardDescription>
                        {previewMode 
                          ? "Preview how the form will appear to users" 
                          : "Use drag-and-drop to build your form layout"}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setPreviewMode(!previewMode)}
                      >
                        {previewMode ? <Settings className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {previewMode ? "Edit" : "Preview"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedVersionId(null);
                          setEditingVersion(null);
                          setFormFields([]);
                        }}
                      >
                        Back to Versions
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {previewMode ? (
                    <div className="border rounded-lg p-5 bg-background">
                      {/* Form Preview Mode */}
                      <div className="space-y-5">
                        {formFields.map((field, index) => (
                          <div key={field.id} className="space-y-2">
                            {field.type !== 'checkbox' && field.type !== 'heading' && field.type !== 'paragraph' && (
                              <label className="text-sm font-medium flex items-start">
                                {field.label}
                                {field.required && <span className="text-destructive ml-1">*</span>}
                              </label>
                            )}
                            
                            {field.description && field.type !== 'heading' && field.type !== 'paragraph' && (
                              <p className="text-xs text-muted-foreground">{field.description}</p>
                            )}
                            
                            {field.type === 'text' && (
                              <input 
                                type="text" 
                                className="w-full p-2 border rounded" 
                                placeholder={field.placeholder}
                              />
                            )}
                            
                            {field.type === 'textarea' && (
                              <textarea 
                                className="w-full p-2 border rounded min-h-[100px]" 
                                placeholder={field.placeholder}
                              />
                            )}
                            
                            {field.type === 'number' && (
                              <input 
                                type="number" 
                                className="w-full p-2 border rounded"
                                min={field.min}
                                max={field.max}
                                step={field.step}
                                placeholder={field.placeholder}
                              />
                            )}
                            
                            {field.type === 'checkbox' && (
                              <div className="flex items-center space-x-2">
                                <input 
                                  type="checkbox" 
                                  id={`field-${index}`}
                                  className="h-4 w-4 rounded border-gray-300" 
                                />
                                <label htmlFor={`field-${index}`} className="text-sm">
                                  {field.label}
                                  {field.required && <span className="text-destructive ml-1">*</span>}
                                </label>
                              </div>
                            )}
                            
                            {field.type === 'select' && (
                              <select className="w-full p-2 border rounded">
                                <option value="">Select an option...</option>
                                {field.options?.map((option, i) => (
                                  <option key={i} value={option}>{option}</option>
                                ))}
                              </select>
                            )}
                            
                            {field.type === 'radio' && (
                              <div className="space-y-2">
                                {field.options?.map((option, i) => (
                                  <div key={i} className="flex items-center space-x-2">
                                    <input 
                                      type="radio" 
                                      id={`field-${index}-option-${i}`}
                                      name={`field-${index}`}
                                      className="h-4 w-4 border-gray-300" 
                                    />
                                    <label htmlFor={`field-${index}-option-${i}`} className="text-sm">{option}</label>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {field.type === 'date' && (
                              <input 
                                type="date" 
                                className="w-full p-2 border rounded" 
                              />
                            )}
                            
                            {field.type === 'heading' && (
                              <h3 className="text-lg font-semibold">{field.label}</h3>
                            )}
                            
                            {field.type === 'paragraph' && (
                              <p className="text-sm text-muted-foreground">{field.label}</p>
                            )}
                          </div>
                        ))}
                        
                        {formFields.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>No form fields have been added yet</p>
                          </div>
                        )}
                        
                        {formFields.length > 0 && (
                          <div className="pt-4 flex justify-end">
                            <Button>Submit Form</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Form Builder Drag-and-Drop Interface
                    <FormBuilderDragDrop
                      initialFields={formFields}
                      onChange={handleFormFieldsChange}
                      onSave={handleSaveFormStructure}
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              // Show versions list when no specific version is selected for editing
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Form Versions for {selectedTemplate.title}</CardTitle>
                      <CardDescription>
                        Manage form structure versions for this template
                      </CardDescription>
                    </div>
                    <Button onClick={() => {
                      // Start with a new empty form builder
                      setFormFields([]);
                      setSelectedVersionId(0); // Use 0 to indicate new version
                      setEditingVersion(null);
                      setNewVersion({
                        templateId: selectedTemplate.id,
                        versionNumber: "1.0",
                        structureDefinition: JSON.stringify({ fields: [] }, null, 2),
                        isActive: true
                      });
                    }}>
                      <Plus className="w-4 h-4 mr-2" /> New Version
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {formVersionsQuery.isLoading ? (
                    <div className="text-center py-4">Loading versions...</div>
                  ) : formVersionsQuery.isError ? (
                    <div className="bg-destructive/10 p-4 rounded-md border border-destructive/50 mb-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-destructive">API Error</h4>
                          <p className="text-sm text-muted-foreground">
                            There was an error loading form versions data. Using local fallback data instead.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Version</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Get all versions for this template */}
                        {formVersionsQuery.isLoading ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">
                              <div className="flex justify-center">
                                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : formVersionsQuery.isError ? (
                          // Use fallback data 
                          mockVersions
                            .filter(version => version.templateId === selectedTemplate.id)
                            .slice((versionCurrentPage - 1) * versionItemsPerPage, versionCurrentPage * versionItemsPerPage)
                            .map(version => (
                              <TableRow key={version.id}>
                                <TableCell className="font-medium">{version.versionNumber}</TableCell>
                                <TableCell>
                                  <Button
                                    variant={version.isActive ? "success" : "outline"}
                                    size="sm"
                                    className={`flex items-center gap-1 ${version.isActive ? "bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 border-0" : "border-gray-200 hover:bg-gray-100"}`}
                                    onClick={() => updateVersionMutation.mutate({
                                      ...version,
                                      isActive: !version.isActive
                                    })}
                                  >
                                    <div className={`w-2 h-2 rounded-full ${version.isActive ? "bg-green-500" : "bg-gray-400"}`}></div>
                                    {version.isActive ? 'Active' : 'Inactive'}
                                  </Button>
                                </TableCell>
                                <TableCell>{new Date(version.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="icon" 
                                      onClick={() => handleEditFormStructure(version)}
                                      className="h-8 w-8"
                                      title="Edit form structure"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="icon"
                                      className="h-8 w-8"
                                      title="Export form structure"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                        ) : (
                          // Use API data
                          (formVersionsQuery.data as FormTemplateVersion[] || [])
                            .filter(version => version.templateId === selectedTemplate.id)
                            .slice((versionCurrentPage - 1) * versionItemsPerPage, versionCurrentPage * versionItemsPerPage)
                            .map(version => (
                              <TableRow key={version.id}>
                                <TableCell className="font-medium">{version.versionNumber}</TableCell>
                                <TableCell>
                                  <Button
                                    variant={version.isActive ? "success" : "outline"}
                                    size="sm"
                                    className={`flex items-center gap-1 ${version.isActive ? "bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 border-0" : "border-gray-200 hover:bg-gray-100"}`}
                                    onClick={() => updateVersionMutation.mutate({
                                      ...version,
                                      isActive: !version.isActive
                                    })}
                                  >
                                    <div className={`w-2 h-2 rounded-full ${version.isActive ? "bg-green-500" : "bg-gray-400"}`}></div>
                                    {version.isActive ? 'Active' : 'Inactive'}
                                  </Button>
                                </TableCell>
                                <TableCell>{new Date(version.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleEditFormStructure(version)}
                                      className="flex items-center gap-1.5"
                                    >
                                      <Edit className="w-4 h-4" />
                                      <span>Edit Form</span>
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="icon"
                                      onClick={() => {
                                        // Download structure as JSON
                                        let structureDef = version.structureDefinition;
                                        if (typeof structureDef === 'string') {
                                          try {
                                            structureDef = JSON.parse(structureDef);
                                          } catch (error) {
                                            console.error("Invalid JSON in structure definition", error);
                                          }
                                        }
                                        
                                        const jsonString = JSON.stringify(structureDef, null, 2);
                                        const blob = new Blob([jsonString], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `form-template-${selectedTemplate.id}-v${version.versionNumber}.json`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                      }}
                                      className="h-8 w-8"
                                      title="Export form structure as JSON"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                        
                        {/* Show empty message if no versions */}
                        {!formVersionsQuery.isLoading && 
                          !formVersionsQuery.isError && 
                          (formVersionsQuery.data as FormTemplateVersion[] || []).filter(v => v.templateId === selectedTemplate.id).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                No versions found for this template
                              </TableCell>
                            </TableRow>
                          )
                        }
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    );
  };
  
  // Handler for lifecycle step changes
  const handleLifecycleStepChange = (step: number) => {
    setCurrentLifecycleStep(step);
  };
  
  // Function to handle selecting a category for bulk actions
  const handleSelectCategory = (categoryId: number, isChecked: boolean) => {
    if (isChecked) {
      setSelectedCategories(prev => [...prev, categoryId]);
    } else {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId));
    }
  };
  
  // Function to handle bulk action
  const handleBulkAction = () => {
    if (selectedCategories.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one item to perform a bulk action",
        variant: "destructive",
      });
      return;
    }
    
    setBulkActionOpen(true);
  };
  
  // Function to execute bulk action
  const executeBulkAction = () => {
    if (bulkAction && selectedCategories.length > 0) {
      bulkActionCategoryMutation.mutate({
        action: bulkAction,
        categoryIds: selectedCategories
      });
    }
  };
  
  // The bulk action dialog is already implemented at the end of the component
      
  return (
    <MainLayout title="Forms Management">
      <div className="mb-6 flex flex-col justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Forms Administration</h1>
        <p className="text-muted-foreground">
          Manage form categories, templates, and create form structures
        </p>
      </div>
      
      {/* Help & Guides Section */}
      <div className="mb-6 bg-muted/50 p-4 rounded-lg border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Form Management Guides
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1.5 border-primary/30 bg-primary/5 hover:bg-primary/10"
              onClick={() => setShowLifecycleGuide(true)}
              title="Learn about the form lifecycle process"
            >
              <ListChecks className="h-4 w-4 text-primary" />
              <span>Lifecycle Guide</span>
              <HelpCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1.5 border-primary/30 bg-primary/5 hover:bg-primary/10"
              onClick={() => setShowProcessGuide(true)}
              title="View the form management process overview"
            >
              <Info className="h-4 w-4 text-primary" />
              <span>Process Overview</span>
              <HelpCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1.5 border-primary/30 bg-primary/5 hover:bg-primary/10"
              onClick={() => setShowActivationGuide(true)}
              title="Learn how to activate and use form categories"
            >
              <CheckCircle className="h-4 w-4 text-primary" />
              <span>Activation Guide</span>
              <HelpCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground text-sm mt-2">
          Use these guides to understand the form management process from creation to deployment.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList className="bg-muted/60 p-1 dark:bg-gray-800">
            <TabsTrigger 
              value="categories" 
              className="data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm flex gap-2 items-center"
            >
              <Book className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger 
              value="templates" 
              className="data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm flex gap-2 items-center"
            >
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger 
              value="builder" 
              className="data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm flex gap-2 items-center"
            >
              <Settings className="h-4 w-4" />
              Form Builder
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="categories" className="mt-0">
          {renderCategoriesTable()}
        </TabsContent>
        
        <TabsContent value="templates" className="mt-0">
          {renderTemplatesTable()}
        </TabsContent>
        
        <TabsContent value="builder" className="mt-0">
          {renderFormBuilder()}
        </TabsContent>
      </Tabs>
      
      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update the form category details' : 'Create a new form category for organizing templates'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Enter category name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Enter category description"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={newCategory.isActive}
                onCheckedChange={(checked) => setNewCategory({ ...newCategory, isActive: !!checked })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCategorySubmit}>
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Template'}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? 'Update the form template details' : 'Create a new form template for your forms and checklists'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Template Title</Label>
              <Input
                id="title"
                value={newTemplate.title}
                onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                placeholder="Enter template title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={newTemplate.categoryId}
                onChange={(e) => setNewTemplate({ ...newTemplate, categoryId: parseInt(e.target.value) })}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value={0}>Select a category</option>
                {(formCategoriesQuery.data as FormCategory[] || []).map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Enter template description"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={newTemplate.isActive}
                onCheckedChange={(checked) => setNewTemplate({ ...newTemplate, isActive: !!checked })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTemplateSubmit}>
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Version Dialog */}
      <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVersion ? 'Edit Form Version' : 'New Form Version'}</DialogTitle>
            <DialogDescription>
              {editingVersion ? 'Edit the form structure' : 'Create a new version of this form template'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="versionNumber">Version Number</Label>
                <Input
                  id="versionNumber"
                  value={newVersion.versionNumber}
                  onChange={(e) => setNewVersion({ ...newVersion, versionNumber: e.target.value })}
                  placeholder="1.0"
                />
              </div>
              
              <div className="flex items-center space-x-2 self-end">
                <Checkbox
                  id="isActive"
                  checked={newVersion.isActive}
                  onCheckedChange={(checked) => setNewVersion({ ...newVersion, isActive: !!checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Form Structure (JSON)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept=".json,.pdf,.docx"
                    onChange={handleFormFileChange}
                  />
                  <p className="text-xs text-gray-500">
                    Upload a JSON file with the form structure, or a PDF/Word document to extract a form structure.
                  </p>
                  
                  {uploadedFile && (
                    <div className="p-2 border rounded flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{uploadedFile.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUploadedFile(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    Example JSON structure:
                  </p>
                  <pre className="text-xs p-2 bg-gray-100 rounded overflow-auto max-h-24">
{`{
  "fields": [
    {
      "id": "field1",
      "type": "text",
      "label": "Field Label",
      "required": true
    }
  ]
}`}
                  </pre>
                  <p className="text-xs text-gray-500">
                    Supported field types: text, textarea, number, checkbox, select, date
                  </p>
                </div>
              </div>
              
              <Textarea
                className="min-h-[300px] font-mono text-sm"
                value={newVersion.structureDefinition}
                onChange={(e) => {
                  setNewVersion({ ...newVersion, structureDefinition: e.target.value });
                  try {
                    JSON.parse(e.target.value);
                    setFormStructureValid(true);
                  } catch (error) {
                    setFormStructureValid(false);
                  }
                }}
              />
              
              {!formStructureValid && (
                <p className="text-xs text-destructive">
                  Invalid JSON structure. Please check the format.
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVersionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleVersionSubmit} disabled={!formStructureValid}>
              {editingVersion ? 'Update Form Version' : 'Create Form Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Category Delete Confirmation */}
      <AlertDialog open={isCategoryDeleteDialogOpen} onOpenChange={setIsCategoryDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "{categoryToDelete?.name}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center gap-2"
              onClick={() => categoryToDelete && deleteCategoryMutation.mutate(categoryToDelete.id)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Template Delete Confirmation */}
      <AlertDialog open={isTemplateDeleteDialogOpen} onOpenChange={setIsTemplateDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the template "{templateToDelete?.title}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center gap-2"
              onClick={() => templateToDelete && deleteTemplateMutation.mutate(templateToDelete.id)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Form Lifecycle Guide */}
      <Sheet open={showLifecycleGuide} onOpenChange={setShowLifecycleGuide}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Form Lifecycle Guide</SheetTitle>
            <SheetDescription>
              Follow this guide to understand the form creation process
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <FormLifecycleGuide 
              currentStep={currentLifecycleStep} 
              onSelectStep={handleLifecycleStepChange} 
            />
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Form Process Visualization */}
      <Sheet open={showProcessGuide} onOpenChange={setShowProcessGuide}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Form Process Overview</SheetTitle>
            <SheetDescription>
              See how forms are used throughout the system
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <FormProcessVisualization />
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Form Activation Guide */}
      <Sheet open={showActivationGuide} onOpenChange={setShowActivationGuide}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Form Activation Guide</SheetTitle>
            <SheetDescription>
              Learn how to activate forms for use
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <FormActivationGuide />
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Bulk Action Dialog */}
      <AlertDialog open={bulkActionOpen} onOpenChange={setBulkActionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === 'activate' && `This will activate ${selectedCategories.length} selected categories.`}
              {bulkAction === 'deactivate' && `This will deactivate ${selectedCategories.length} selected categories.`}
              {bulkAction === 'delete' && `This will permanently delete ${selectedCategories.length} selected categories. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setBulkAction('')}
              className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={`flex items-center gap-2 ${
                bulkAction === 'delete' 
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
              onClick={executeBulkAction}
            >
              {bulkAction === 'activate' && <CheckCircle className="h-4 w-4" />}
              {bulkAction === 'deactivate' && <XCircle className="h-4 w-4" />}
              {bulkAction === 'delete' && <Trash2 className="h-4 w-4" />}
              Confirm {bulkAction === 'activate' ? 'Activation' : bulkAction === 'deactivate' ? 'Deactivation' : 'Deletion'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default FormsAdministration;