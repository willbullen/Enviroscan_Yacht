import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Box } from 'lucide-react';
import { BuildProject } from '@/pages/BuildManagement';

interface Build3DModelsListProps {
  projects: BuildProject[];
  vesselId: number;
}

const Build3DModelsList: React.FC<Build3DModelsListProps> = ({ projects, vesselId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Box className="h-5 w-5" />
          3D Models & Scans
        </CardTitle>
        <CardDescription>
          View and manage 3D models, Matterport scans, and spatial data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          3D models functionality will be implemented here. This will include:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
          <li>3D model viewer for Matterport or similar 3D scan data</li>
          <li>Issue pin visualization in 3D space</li>
          <li>Navigation and exploration tools</li>
          <li>Measurement capabilities</li>
          <li>Comparison between design and actual build</li>
        </ul>
      </CardContent>
    </Card>
  );
};

export default Build3DModelsList; 