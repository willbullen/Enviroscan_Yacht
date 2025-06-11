import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BuildProject {
  id: number;
  vesselId: number;
  name: string;
  description: string | null;
  projectType: string;
  status: string;
  priority: string;
  startDate: Date | null;
  endDate: Date | null;
  estimatedBudget: number | null;
  actualCost: number | null;
  progressPercentage: number;
  projectManagerId: number | null;
  contractorId: number | null;
  location: string | null;
  specifications: unknown;
  milestones: unknown;
  createdAt: Date;
  updatedAt: Date;
  createdById: number | null;
}

interface EditProjectDialogProps {
  project: BuildProject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vesselId: number;
}

export default function EditProjectDialog({ project, open, onOpenChange, vesselId }: EditProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Project: {project.name}</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p className="text-gray-600">Project editing functionality will be implemented here.</p>
          <Button onClick={() => onOpenChange(false)} className="mt-4">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}