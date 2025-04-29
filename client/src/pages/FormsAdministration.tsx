import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  ArrowUpDown
} from 'lucide-react';

// Define interfaces for our form data models
interface FormCategory {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
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
  
  const [templateFilter, setTemplateFilter] = useState('');
  const [templateStatusFilter, setTemplateStatusFilter] = useState('all');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState(0);
  const [templateSortField, setTemplateSortField] = useState('title');
  const [templateSortDirection, setTemplateSortDirection] = useState('asc');
  
  // Form categories state
  const [editingCategory, setEditingCategory] = useState<FormCategory | null>(null);
  const [newCategory, setNewCategory] = useState(FormCategory_DEFAULT);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<FormCategory | null>(null);
  const [isCategoryDeleteDialogOpen, setIsCategoryDeleteDialogOpen] = useState(false);
  
  // Form templates state
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState(FormTemplate_DEFAULT);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<FormTemplate | null>(null);
  const [isTemplateDeleteDialogOpen, setIsTemplateDeleteDialogOpen] = useState(false);
  
  // Form structure editor state
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [editingVersion, setEditingVersion] = useState<FormTemplateVersion | null>(null);
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
  
  const formVersionsQuery = useQuery({
    queryKey: ['/api/ism/form-template-versions'],
    enabled: !!selectedTemplate,
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
      return <div className="text-center py-8">Loading categories...</div>;
    }
    
    if (formCategoriesQuery.isError) {
      return <div className="text-center py-8 text-destructive">Error loading categories</div>;
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
    
    return (
      <>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Form Categories</h2>
          <Button onClick={() => {
            setEditingCategory(null);
            setNewCategory(FormCategory_DEFAULT);
            setIsCategoryDialogOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" /> New Category
          </Button>
        </div>
        
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filter by name or description..."
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div>
            <select
              value={categoryStatusFilter}
              onChange={(e) => setCategoryStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-input bg-background"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
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
            {sortedCategories.map(category => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.description || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Badge 
                      variant={category.isActive ? "success" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleCategoryStatus(category)}
                    >
                      {category.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-2">(click to toggle)</span>
                  </div>
                </TableCell>
                <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditCategory(category)}
                      className="flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive hover:text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setCategoryToDelete(category);
                        setIsCategoryDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
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
      return <div className="text-center py-8">Loading templates...</div>;
    }
    
    if (formTemplatesQuery.isError) {
      return <div className="text-center py-8 text-destructive">Error loading templates</div>;
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
                placeholder="Filter by title or description..."
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div>
            <select
              value={templateStatusFilter}
              onChange={(e) => setTemplateStatusFilter(e.target.value)}
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
              onChange={(e) => setTemplateCategoryFilter(parseInt(e.target.value))}
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
            {sortedTemplates.map(template => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.title}</TableCell>
                <TableCell>{categoryMap.get(template.categoryId) || `Category #${template.categoryId}`}</TableCell>
                <TableCell>{template.description || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Badge 
                      variant={template.isActive ? "success" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleTemplateStatus(template)}
                    >
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-2">(click to toggle)</span>
                  </div>
                </TableCell>
                <TableCell>{new Date(template.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditTemplate(template)}
                      className="flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCreateVersion(template)}
                      className="flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Version
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive hover:text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setTemplateToDelete(template);
                        setIsTemplateDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
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
    
    return (
      <div className="grid grid-cols-1 gap-6 mt-4">
        {/* Template selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select a Template</CardTitle>
            <CardDescription>
              Choose a template to view or create a form structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-all ${selectedTemplate?.id === template.id ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardHeader className="py-4 px-4 pb-0">
                    <CardTitle className="text-base">{template.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <p className="text-xs text-muted-foreground mb-1">
                      Category: {categoryMap.get(template.categoryId) || `Category #${template.categoryId}`}
                    </p>
                    {template.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                    )}
                  </CardContent>
                  <CardFooter className="py-2 px-4 flex justify-between">
                    <Badge variant={template.isActive ? "success" : "secondary"}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleCreateVersion(template);
                    }}>
                      Create Version
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              
              {templates.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No templates found. Please create a template first.</p>
                  <Button className="mt-4" onClick={() => {
                    setEditingTemplate(null);
                    setNewTemplate(FormTemplate_DEFAULT);
                    setIsTemplateDialogOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" /> Create Template
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Versions list (if template is selected) */}
        {selectedTemplate && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Form Versions for {selectedTemplate.title}</CardTitle>
                  <CardDescription>
                    Manage form structure versions for this template
                  </CardDescription>
                </div>
                <Button onClick={() => handleCreateVersion(selectedTemplate)}>
                  <Plus className="w-4 h-4 mr-2" /> New Version
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formVersionsQuery.isLoading ? (
                <div className="text-center py-4">Loading versions...</div>
              ) : formVersionsQuery.isError ? (
                <div className="text-center py-4 text-destructive">Error loading versions</div>
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
                    {(formVersionsQuery.data as FormTemplateVersion[] || [])
                      .filter(version => version.templateId === selectedTemplate.id)
                      .map(version => (
                        <TableRow key={version.id}>
                          <TableCell className="font-medium">{version.versionNumber}</TableCell>
                          <TableCell>
                            <Badge variant={version.isActive ? "success" : "secondary"}>
                              {version.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(version.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  // View structure
                                  let structureDef = version.structureDefinition;
                                  if (typeof structureDef === 'string') {
                                    try {
                                      structureDef = JSON.parse(structureDef);
                                    } catch (error) {
                                      console.error("Invalid JSON in structure definition", error);
                                    }
                                  }
                                  
                                  // Set the JSON in pretty format for editing
                                  setEditingVersion(version);
                                  setNewVersion({
                                    templateId: version.templateId,
                                    versionNumber: version.versionNumber,
                                    structureDefinition: JSON.stringify(structureDef, null, 2),
                                    isActive: version.isActive || false
                                  });
                                  setIsVersionDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
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
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                    {(!formVersionsQuery.data || (formVersionsQuery.data as FormTemplateVersion[]).filter(v => v.templateId === selectedTemplate.id).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No versions found for this template
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };
  
  return (
    <MainLayout title="Forms Management">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight"></h1>
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
              <input
                type="checkbox"
                id="isActive"
                checked={newCategory.isActive}
                onChange={(e) => setNewCategory({ ...newCategory, isActive: e.target.checked })}
                className="form-checkbox h-4 w-4 text-primary rounded"
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
              <input
                type="checkbox"
                id="isActive"
                checked={newTemplate.isActive}
                onChange={(e) => setNewTemplate({ ...newTemplate, isActive: e.target.checked })}
                className="form-checkbox h-4 w-4 text-primary rounded"
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
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newVersion.isActive}
                  onChange={(e) => setNewVersion({ ...newVersion, isActive: e.target.checked })}
                  className="form-checkbox h-4 w-4 text-primary rounded"
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
    </MainLayout>
  );
};

export default FormsAdministration;