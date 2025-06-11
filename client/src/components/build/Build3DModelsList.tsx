import { Card, CardContent } from "@/components/ui/card";
import { Box } from "lucide-react";

interface Build3DModelsListProps {
  models: any[];
  projects: any[];
  vesselId: number;
}

export default function Build3DModelsList({ models, projects, vesselId }: Build3DModelsListProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <Box className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">3D Models</h3>
          <p className="mt-1 text-sm text-gray-500">
            3D models and CAD files for build projects will be displayed here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}