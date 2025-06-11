import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { BuildProject } from '@/pages/BuildManagement';

interface BuildIssuesListProps {
  projects: BuildProject[];
  vesselId: number;
}

const BuildIssuesList: React.FC<BuildIssuesListProps> = ({ projects, vesselId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Issues Tracking
        </CardTitle>
        <CardDescription>
          Track and manage project issues, defects, and work items
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Issues tracking functionality will be implemented here. This will include:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
          <li>Create and track issues with location reference</li>
          <li>Photo attachments (up to 20 per issue)</li>
          <li>Assignment and due date tracking</li>
          <li>Comment threads for discussion</li>
          <li>Status workflow management</li>
        </ul>
      </CardContent>
    </Card>
  );
};

export default BuildIssuesList; 