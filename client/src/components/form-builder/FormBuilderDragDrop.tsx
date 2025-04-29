import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableFormField } from './SortableFormField';
import { FormFieldItem, FormField, FieldType } from './FormFieldItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Pencil,
  Trash2,
  Plus,
  MoveVertical,
  Copy, 
  LayoutGrid,
  FileText,
  CheckSquare,
  ListOrdered,
  Calendar,
  List,
  Type
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface FormBuilderDragDropProps {
  initialFields?: FormField[];
  onChange: (fields: FormField[]) => void;
  onSave?: () => void;
}

export const FormBuilderDragDrop: React.FC<FormBuilderDragDropProps> = ({
  initialFields = [],
  onChange,
  onSave,
}) => {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('fields');
  const [editingField, setEditingField] = useState<FormField | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Find the active field
  const activeField = fields.find(field => field.id === activeId);

  // Handle drag start event
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Handle drag end event
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        onChange(newItems);
        return newItems;
      });
    }
    
    setActiveId(null);
  }, [onChange]);

  // Add a new field
  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      required: false,
      placeholder: '',
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined,
      description: '',
    };
    
    const newFields = [...fields, newField];
    setFields(newFields);
    onChange(newFields);
    setEditingField(newField);
  };

  // Delete a field
  const deleteField = (id: string) => {
    const newFields = fields.filter(field => field.id !== id);
    setFields(newFields);
    onChange(newFields);
    if (editingField?.id === id) {
      setEditingField(null);
    }
  };

  // Duplicate a field
  const duplicateField = (field: FormField) => {
    const newField = {
      ...field,
      id: `field-${Date.now()}`,
      label: `${field.label} (Copy)`,
    };
    const newFields = [...fields, newField];
    setFields(newFields);
    onChange(newFields);
  };

  // Update a field
  const updateField = (id: string, updates: Partial<FormField>) => {
    const newFields = fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    );
    setFields(newFields);
    onChange(newFields);
    
    if (editingField?.id === id) {
      setEditingField({ ...editingField, ...updates });
    }
  };

  // Field type components for the toolbar
  const fieldTypes: { type: FieldType; icon: React.ReactNode; label: string }[] = [
    { type: 'text', icon: <Type className="h-5 w-5" />, label: 'Text' },
    { type: 'textarea', icon: <FileText className="h-5 w-5" />, label: 'Textarea' },
    { type: 'number', icon: <ListOrdered className="h-5 w-5" />, label: 'Number' },
    { type: 'checkbox', icon: <CheckSquare className="h-5 w-5" />, label: 'Checkbox' },
    { type: 'select', icon: <List className="h-5 w-5" />, label: 'Dropdown' },
    { type: 'radio', icon: <LayoutGrid className="h-5 w-5" />, label: 'Radio' },
    { type: 'date', icon: <Calendar className="h-5 w-5" />, label: 'Date' },
    { type: 'heading', icon: <Type className="h-5 w-5" />, label: 'Heading' },
    { type: 'paragraph', icon: <FileText className="h-5 w-5" />, label: 'Paragraph' },
  ];

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* Toolbar and field properties panel */}
      <div className="w-full md:w-64 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="fields" className="flex-1">Fields</TabsTrigger>
            <TabsTrigger value="properties" className="flex-1">Properties</TabsTrigger>
          </TabsList>

          {activeTab === 'fields' && (
            <Card className="mt-4 border-dashed">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Form Components</CardTitle>
                <CardDescription className="text-xs">Drag and drop or click to add</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 py-0">
                <div className="grid grid-cols-2 gap-2">
                  {fieldTypes.map(({ type, icon, label }) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      className="h-auto py-2 px-2 flex flex-col items-center justify-center gap-1 hover:bg-primary/5 text-xs border-dashed"
                      onClick={() => addField(type)}
                    >
                      {icon}
                      {label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'properties' && editingField && (
            <Card className="mt-4">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Field Properties</CardTitle>
                <CardDescription className="text-xs">
                  Edit {editingField.type} field
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 py-0">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Label</label>
                  <input
                    type="text"
                    value={editingField.label}
                    onChange={(e) => updateField(editingField.id, { label: e.target.value })}
                    className="w-full p-2 text-sm border rounded-md"
                  />
                </div>

                {(editingField.type !== 'heading' && editingField.type !== 'paragraph') && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="required"
                      checked={editingField.required || false}
                      onChange={(e) => updateField(editingField.id, { required: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="required" className="text-xs font-medium">Required field</label>
                  </div>
                )}

                {(editingField.type === 'text' || editingField.type === 'textarea' || editingField.type === 'number' || editingField.type === 'email') && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Placeholder</label>
                    <input
                      type="text"
                      value={editingField.placeholder || ''}
                      onChange={(e) => updateField(editingField.id, { placeholder: e.target.value })}
                      className="w-full p-2 text-sm border rounded-md"
                    />
                  </div>
                )}

                {(editingField.type === 'select' || editingField.type === 'radio') && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Options (one per line)</label>
                    <textarea
                      value={(editingField.options || []).join('\n')}
                      onChange={(e) => updateField(editingField.id, { options: e.target.value.split('\n').filter(opt => opt.trim() !== '') })}
                      className="w-full p-2 text-sm border rounded-md min-h-[100px]"
                    />
                  </div>
                )}

                {(editingField.type === 'number') && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Min</label>
                        <input
                          type="number"
                          value={editingField.min || ''}
                          onChange={(e) => updateField(editingField.id, { min: e.target.value === '' ? undefined : Number(e.target.value) })}
                          className="w-full p-2 text-sm border rounded-md"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Max</label>
                        <input
                          type="number"
                          value={editingField.max || ''}
                          onChange={(e) => updateField(editingField.id, { max: e.target.value === '' ? undefined : Number(e.target.value) })}
                          className="w-full p-2 text-sm border rounded-md"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Step</label>
                        <input
                          type="number"
                          value={editingField.step || ''}
                          onChange={(e) => updateField(editingField.id, { step: e.target.value === '' ? undefined : Number(e.target.value) })}
                          className="w-full p-2 text-sm border rounded-md"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-medium">Help Text</label>
                  <textarea
                    value={editingField.description || ''}
                    onChange={(e) => updateField(editingField.id, { description: e.target.value })}
                    className="w-full p-2 text-sm border rounded-md"
                    placeholder="Provide additional information about this field"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between py-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => deleteField(editingField.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => duplicateField(editingField)}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicate
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === 'properties' && !editingField && (
            <Card className="mt-4">
              <CardContent className="py-6 text-center text-muted-foreground">
                <p className="text-sm">Select a field to edit its properties</p>
              </CardContent>
            </Card>
          )}
        </Tabs>

        {fields.length > 0 && (
          <Card>
            <CardContent className="py-3">
              <Button 
                onClick={onSave} 
                className="w-full"
              >
                Save Form
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Form builder canvas */}
      <div className="flex-1">
        <Card className={cn(
          "min-h-[500px] transition-all duration-200",
          fields.length === 0 ? "border-dashed" : ""
        )}>
          <CardHeader className="pb-0">
            <CardTitle className="text-lg">Form Preview</CardTitle>
            <CardDescription>Build your form by adding and arranging fields</CardDescription>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="py-4 space-y-2">
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <p>Start by adding fields from the sidebar</p>
                    <p className="text-sm mt-1">Click on a field type or drag and drop to build your form</p>
                  </div>
                ) : (
                  <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    {fields.map(field => (
                      <SortableFormField
                        key={field.id}
                        field={field}
                        isSelected={editingField?.id === field.id}
                        onSelect={() => {
                          setEditingField(field);
                          setActiveTab('properties');
                        }}
                        onDelete={() => deleteField(field.id)}
                        onDuplicate={() => duplicateField(field)}
                      />
                    ))}
                  </SortableContext>
                )}

                <DragOverlay>
                  {activeId && activeField ? (
                    <div className="opacity-80 w-full">
                      <FormFieldItem 
                        field={activeField} 
                        isSelected={false}
                        showControls={false}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </div>
            </DndContext>
          </CardContent>
          {fields.length > 0 && (
            <CardFooter className="pt-0 border-t text-xs text-muted-foreground">
              <div className="flex items-center">
                <MoveVertical className="h-3 w-3 mr-1" />
                <span>Drag fields to reorder</span>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};