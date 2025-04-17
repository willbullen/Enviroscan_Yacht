import { useParams, useLocation } from 'wouter';
import MainLayout from '@/components/layout/MainLayout';
import { VoyageForm } from '@/components/voyage/VoyageForm';

export function VoyageEditPage() {
  const { id } = useParams<{ id: string }>();
  const voyageId = parseInt(id);
  const [location, setLocation] = useLocation();

  if (isNaN(voyageId)) {
    return (
      <MainLayout title="Error">
        <div className="max-w-3xl mx-auto">
          <div className="bg-destructive/10 border border-destructive p-4 rounded-md">
            <h2 className="text-destructive font-medium">Invalid Voyage ID</h2>
            <p className="text-muted-foreground mt-2">
              The voyage ID provided is not valid. Please return to the voyages list and try again.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Edit Voyage">
      <div className="max-w-3xl mx-auto">
        <VoyageForm
          voyageId={voyageId}
          onSuccess={() => setLocation(`/voyages/${voyageId}`)}
        />
      </div>
    </MainLayout>
  );
}