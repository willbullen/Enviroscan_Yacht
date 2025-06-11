import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen } from 'lucide-react';
import { BuildProject } from '@/pages/BuildManagement';

interface BuildDocumentsListProps {
  projects: BuildProject[];
  vesselId: number;
}

const BuildDocumentsList: React.FC<BuildDocumentsListProps> = ({ projects, vesselId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Document Library
        </CardTitle>
        <CardDescription>
          Organize and manage project documents, specifications, and reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Document library functionality will be implemented here. This will include:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
          <li>Card-based document organization</li>
          <li>Version tracking and metadata display</li>
          <li>Preview capability for common document types</li>
          <li>Categorization and tagging system</li>
          <li>Search functionality across document content</li>
        </ul>
      </CardContent>
    </Card>
  );
};

export default BuildDocumentsList; 