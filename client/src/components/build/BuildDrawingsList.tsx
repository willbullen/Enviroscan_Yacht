import { Card, CardContent } from "@/components/ui/card";
import { Image } from "lucide-react";

interface BuildDrawingsListProps {
  drawings: any[];
  projects: any[];
  vesselId: number;
}

export default function BuildDrawingsList({ drawings, projects, vesselId }: BuildDrawingsListProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <Image className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Build Drawings</h3>
          <p className="mt-1 text-sm text-gray-500">
            Technical drawings and blueprints will be displayed here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}