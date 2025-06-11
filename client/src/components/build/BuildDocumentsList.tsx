import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface BuildDocumentsListProps {
  documents: any[];
  projects: any[];
  vesselId: number;
}

export default function BuildDocumentsList({ documents, projects, vesselId }: BuildDocumentsListProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Build Documents</h3>
          <p className="mt-1 text-sm text-gray-500">
            Project documentation and files will be displayed here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}