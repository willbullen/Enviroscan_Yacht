import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { BuildProject } from '@/pages/BuildManagement';

interface BuildDrawingsListProps {
  projects: BuildProject[];
  vesselId: number;
}

const BuildDrawingsList: React.FC<BuildDrawingsListProps> = ({ projects, vesselId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Drawings Management
        </CardTitle>
        <CardDescription>
          Manage technical drawings, blueprints, and revisions across all projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Drawings management functionality will be implemented here. This will include:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
          <li>Upload and organize technical drawings</li>
          <li>Revision control and approval workflow</li>
          <li>Drawing comments and annotations</li>
          <li>Drawing categorization by build group</li>
          <li>Version history and comparison</li>
        </ul>
      </CardContent>
    </Card>
  );
};

export default BuildDrawingsList; 