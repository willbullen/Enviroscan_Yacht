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