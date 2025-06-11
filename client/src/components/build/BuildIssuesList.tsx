import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface BuildIssuesListProps {
  issues: any[];
  projects: any[];
  vesselId: number;
}

export default function BuildIssuesList({ issues, projects, vesselId }: BuildIssuesListProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Build Issues</h3>
          <p className="mt-1 text-sm text-gray-500">
            Project issues and tracking will be displayed here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}