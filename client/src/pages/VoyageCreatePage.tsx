import { useEffect } from 'react';
import { useLocation } from 'wouter';
import MainLayout from '@/components/layout/MainLayout';
import { VoyageForm } from '@/components/voyage/VoyageForm';
import { useVessel } from '@/contexts/VesselContext';

export function VoyageCreatePage() {
  const [location, setLocation] = useLocation();
  const { currentVessel } = useVessel();

  // Redirect if no vessel is selected
  useEffect(() => {
    if (!currentVessel) {
      // Redirect to vessels page or show some notification
      // that a vessel must be selected first
      setLocation('/');
    }
  }, [currentVessel, setLocation]);

  if (!currentVessel) {
    return null; // Don't render anything while redirecting
  }

  return (
    <MainLayout title="Create Voyage">
      <div className="max-w-3xl mx-auto">
        <VoyageForm
          defaultValues={{
            vesselId: currentVessel.id,
            name: '',
            status: 'planned',
            startDate: null,
            endDate: null,
            notes: '',
          }}
          onSuccess={() => setLocation('/voyages')}
        />
      </div>
    </MainLayout>
  );
}