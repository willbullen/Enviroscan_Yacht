import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ArrowUpDown,
  FileText,
  Plus,
  Search
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface FormTemplate {
  id: number;
  title: string;
  description: string | null;
  categoryId: number;
  originalFilename: string | null;
  createdById: number | null;  // Allow null to match FormsAdministration.tsx
  createdAt: string;
  updatedAt: string | null;
  isActive: boolean;
}

export interface FormCategory {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
  isActive: boolean;
}

interface FormTemplateDataTableProps {
  templates: FormTemplate[];
  categories: FormCategory[];
  onSelectTemplate: (template: FormTemplate) => void;
}

export function FormTemplateDataTable({
  templates,
  categories,
  onSelectTemplate
}: FormTemplateDataTableProps) {
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [sortField, setSortField] = useState<keyof FormTemplate>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Create a map of category IDs to names for display
  const categoryMap = new Map<number, string>();
  categories.forEach(cat => categoryMap.set(cat.id, cat.name));

  // Filter templates based on search query, category, and status
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchQuery === '' || 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === null || template.categoryId === categoryFilter;
    
    const matchesStatus = statusFilter === null || template.isActive === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sort templates
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (sortField === 'title') {
      return sortDirection === 'asc' 
        ? a.title.localeCompare(b.title) 
        : b.title.localeCompare(a.title);
    } else if (sortField === 'createdAt') {
      return sortDirection === 'asc' 
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() 
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortField === 'updatedAt') {
      // Handle null updatedAt fields
      if (!a.updatedAt) return sortDirection === 'asc' ? -1 : 1;
      if (!b.updatedAt) return sortDirection === 'asc' ? 1 : -1;
      
      return sortDirection === 'asc' 
        ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime() 
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    } else if (sortField === 'isActive') {
      return sortDirection === 'asc' 
        ? (a.isActive === b.isActive ? 0 : a.isActive ? 1 : -1) 
        : (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1);
    }
    
    return 0;
  });

  // Calculate pagination
  const lastIndex = currentPage * itemsPerPage;
  const firstIndex = lastIndex - itemsPerPage;
  const currentTemplates = sortedTemplates.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(sortedTemplates.length / itemsPerPage);

  // Handle sort toggle
  const handleSort = (field: keyof FormTemplate) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a Template</CardTitle>
        <CardDescription>
          Choose a template to view or create a form structure
        </CardDescription>
        
        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select
            value={categoryFilter?.toString() || ''}
            onValueChange={(value) => setCategoryFilter(value ? parseInt(value) : null)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={statusFilter === null ? '' : statusFilter ? 'active' : 'inactive'}
            onValueChange={(value) => {
              if (value === '') setStatusFilter(null);
              else if (value === 'active') setStatusFilter(true);
              else setStatusFilter(false);
            }}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Data table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">
                  <Button 
                    variant="ghost" 
                    className="p-0 hover:bg-transparent font-medium flex items-center gap-1"
                    onClick={() => handleSort('title')}
                  >
                    Title 
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="p-0 hover:bg-transparent font-medium flex items-center gap-1"
                    onClick={() => handleSort('createdAt')}
                  >
                    Created 
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="p-0 hover:bg-transparent font-medium flex items-center gap-1"
                    onClick={() => handleSort('isActive')}
                  >
                    Status 
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                      <p className="text-muted-foreground">No templates found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentTemplates.map((template) => (
                  <TableRow 
                    key={template.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <TableCell className="font-medium">
                      {template.title}
                      {template.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{template.description}</p>
                      )}
                    </TableCell>
                    <TableCell>{categoryMap.get(template.categoryId) || `Category #${template.categoryId}`}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{formatDate(template.createdAt)}</span>
                        {template.updatedAt && (
                          <span className="text-xs text-muted-foreground">
                            Updated: {formatDate(template.updatedAt)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.isActive ? "success" : "secondary"}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {firstIndex + 1}-{Math.min(lastIndex, sortedTemplates.length)} of {sortedTemplates.length} templates
            </div>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(1)} 
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(currentPage - 1)} 
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={i}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => goToPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              
              <Button 
                variant="outline" 
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(currentPage + 1)} 
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(totalPages)} 
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="10 per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}