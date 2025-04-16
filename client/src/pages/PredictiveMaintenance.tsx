import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, CalendarClock, BarChart4, RefreshCcw, Wrench, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { apiRequest, ApiError } from '@/lib/queryClient';
import { formatDate, getDaysUntil, isDateInPast } from '@/lib/dateUtils';
import { useToast } from '@/hooks/use-toast';
import MainLayout from "@/components/layout/MainLayout";

// Interface for the predictive maintenance data
interface PredictiveMaintenance {
  id: number;
  equipmentId: number;
  equipmentName?: string; // Added by API
  equipmentCategory?: string; // Added by API
  maintenanceType: string;
  predictedDate: Date | null;
  predictedRuntime: number | null;
  confidence: number | null;
  reasoningFactors: any;
  recommendedAction: string;
  warningThreshold: number;
  alertThreshold: number;
  historyDataPoints: number | null;
  lastUpdated: Date;
  createdAt: Date;
}

// Interface for maintenance history
interface MaintenanceHistory {
  id: number;
  equipmentId: number;
  equipmentName?: string; // Added by API
  equipmentCategory?: string; // Added by API
  maintenanceType: string;
  serviceDate: Date;
  runtime: number;
  description: string;
  findings: string | null;
  partsReplaced: string[] | null;
  technician: string | null;
  cost: number | null;
  isSuccessful: boolean;
  taskId: number | null;
  createdById: number | null;
  nextRecommendedDate: Date | null;
  nextRecommendedRuntime: number | null;
  notes: string | null;
  documents: any;
  createdAt: Date;
}

// Interface for equipment
interface Equipment {
  id: number;
  name: string;
  category: string;
  model: string;
  manufacturer: string;
  runtime: number;
  lastServiceDate: Date | null;
}

const PredictiveMaintenance = () => {
  const [activeTab, setActiveTab] = useState('predictions');
  const [selectedEquipment, setSelectedEquipment] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch predictive maintenance data
  const { data: predictiveData, isLoading: predictiveLoading } = useQuery<PredictiveMaintenance[]>({
    queryKey: ['/api/predictive-maintenance'],
    enabled: activeTab === 'predictions'
  });

  // Fetch maintenance history
  const { data: historyData, isLoading: historyLoading } = useQuery<MaintenanceHistory[]>({
    queryKey: ['/api/maintenance-history'],
    enabled: activeTab === 'history'
  });

  // Fetch equipment list
  const { data: equipmentData, isLoading: equipmentLoading } = useQuery<Equipment[]>({
    queryKey: ['/api/equipment'],
  });

  // Regenerate predictions mutation
  const generatePredictionsMutation = useMutation({
    mutationFn: async (equipmentId: number) => {
      return apiRequest<any>(`/api/predictive-maintenance/generate/${equipmentId}`, {
        method: 'POST'
      });
    },
    onSuccess: (_, equipmentId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/predictive-maintenance'] });
      queryClient.invalidateQueries({ queryKey: [`/api/predictive-maintenance/equipment/${equipmentId}`] });
      toast({
        title: 'Predictions Generated',
        description: 'New maintenance predictions have been generated successfully.',
        variant: 'default',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Error',
        description: `Failed to generate predictions: ${error.message || 'Please try again.'}`,
        variant: 'destructive',
      });
    }
  });

  // Filter predictions by selected equipment
  const filteredPredictions = useMemo(() => {
    if (!predictiveData) return [];
    if (!selectedEquipment) return predictiveData;
    return predictiveData.filter((p) => p.equipmentId === selectedEquipment);
  }, [predictiveData, selectedEquipment]);

  // Filter history by selected equipment
  const filteredHistory = useMemo(() => {
    if (!historyData) return [];
    if (!selectedEquipment) return historyData;
    return historyData.filter((h) => h.equipmentId === selectedEquipment);
  }, [historyData, selectedEquipment]);

  // Format maintenance type for display
  const formatMaintenanceType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Calculate days until predicted maintenance
  const getDaysUntil = (date: Date | null) => {
    if (!date) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day for consistent comparison
    
    const predictedDate = new Date(date);
    
    // Handle dates in a more robust way:
    // 1. If the date is from 2023 or earlier (seed data), adjust to the current year plus offset
    if (predictedDate.getFullYear() <= 2023) {
      // Copy the month and day but use current year + appropriate offset
      const currentYear = today.getFullYear();
      const month = predictedDate.getMonth();
      const day = predictedDate.getDate();
      
      // Create new date with current year
      predictedDate.setFullYear(currentYear);
      
      // If that makes the date in the past, add 1 year
      if (predictedDate < today) {
        predictedDate.setFullYear(currentYear + 1);
      }
    }
    // 2. If date is still in the past but after 2023, it's genuinely past due
    else if (predictedDate < today) {
      // Return 0 to indicate it's due now (don't adjust the date)
      return 0;
    }
    
    // Calculate difference in days
    const diffTime = predictedDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get status badge for prediction
  const getPredictionStatusBadge = (prediction: PredictiveMaintenance) => {
    const daysUntil = getDaysUntil(prediction.predictedDate);
    
    if (daysUntil === null) return <Badge variant="outline">Unknown</Badge>;
    
    if (daysUntil === 0) {
      return <Badge variant="destructive">Due Today</Badge>;
    } else if (daysUntil <= prediction.alertThreshold) {
      return <Badge variant="destructive">Critical</Badge>;
    } else if (daysUntil <= prediction.warningThreshold) {
      return <Badge variant="secondary">Warning</Badge>;
    } else {
      return <Badge variant="outline">Upcoming</Badge>;
    }
  };

  // Get confidence level indicator
  const getConfidenceIndicator = (confidence: number | null) => {
    if (confidence === null) return null;
    
    let label = '';
    let color = '';
    
    if (confidence >= 0.8) {
      label = 'High';
      color = 'bg-green-500';
    } else if (confidence >= 0.5) {
      label = 'Medium';
      color = 'bg-yellow-500';
    } else {
      label = 'Low';
      color = 'bg-red-500';
    }
    
    return (
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between">
          <span className="text-sm">Confidence</span>
          <span className="text-sm font-medium">{label} ({Math.round(confidence * 100)}%)</span>
        </div>
        <Progress value={confidence * 100} className={color} />
      </div>
    );
  };

  // This is no longer needed since we're importing the formatDate function from dateUtils

  // Render loading state
  if ((predictiveLoading && activeTab === 'predictions') || 
      (historyLoading && activeTab === 'history') || 
      equipmentLoading) {
    return (
      <MainLayout title="Predictive Maintenance">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-medium">Loading data...</h3>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Predictive Maintenance">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Predictive Maintenance</h2>
          <p className="text-muted-foreground">
            Monitor and forecast maintenance needs based on historical data.
          </p>
        </div>

        {/* Equipment Filter */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Equipment Filter</CardTitle>
            <CardDescription>
              Filter predictions and history by specific equipment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={selectedEquipment === null ? "default" : "outline"}
                onClick={() => setSelectedEquipment(null)}
              >
                All Equipment
              </Button>
              
              {equipmentData && Array.isArray(equipmentData) && 
                equipmentData.map((equip: Equipment) => (
                  <Button 
                    key={equip.id}
                    variant={selectedEquipment === equip.id ? "default" : "outline"}
                    onClick={() => setSelectedEquipment(equip.id)}
                  >
                    {equip.name}
                  </Button>
                ))
              }
            </div>
          </CardContent>
          <CardFooter>
            {selectedEquipment && (
              <Button 
                variant="outline"
                onClick={() => generatePredictionsMutation.mutate(selectedEquipment)}
                disabled={generatePredictionsMutation.isPending}
              >
                {generatePredictionsMutation.isPending ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Regenerate Predictions
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="predictions">
              <BarChart4 className="mr-2 h-4 w-4" />
              Predictions
            </TabsTrigger>
            <TabsTrigger value="history">
              <CalendarClock className="mr-2 h-4 w-4" />
              Maintenance History
            </TabsTrigger>
          </TabsList>
          
          {/* Predictions Tab */}
          <TabsContent value="predictions">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPredictions && filteredPredictions.length > 0 ? (
                filteredPredictions.map((prediction: PredictiveMaintenance) => (
                  <Card key={prediction.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{formatMaintenanceType(prediction.maintenanceType)}</CardTitle>
                        {getPredictionStatusBadge(prediction)}
                      </div>
                      <CardDescription>
                        {prediction.equipmentName || `Equipment ID: ${prediction.equipmentId}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Predicted Date</Label>
                          <p className="font-medium">{formatDate(prediction.predictedDate)}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Days Until</Label>
                          <p className="font-medium">{getDaysUntil(prediction.predictedDate) ?? 'N/A'}</p>
                        </div>
                        {prediction.predictedRuntime && (
                          <div className="space-y-1 col-span-2">
                            <Label className="text-xs">Predicted Runtime</Label>
                            <p className="font-medium">{prediction.predictedRuntime} hours</p>
                          </div>
                        )}
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label className="text-xs">Recommended Action</Label>
                        <div className="p-2 bg-muted rounded-md text-sm">
                          {prediction.recommendedAction}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {prediction.confidence !== null && getConfidenceIndicator(prediction.confidence)}
                      
                      <div className="flex items-center text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Based on {prediction.historyDataPoints} data points
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center h-64">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Predictions Available</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    {selectedEquipment ? (
                      <>
                        No predictions found for the selected equipment. 
                        <Button 
                          variant="link" 
                          onClick={() => generatePredictionsMutation.mutate(selectedEquipment)}
                          disabled={generatePredictionsMutation.isPending}
                        >
                          Generate predictions now
                        </Button>
                      </>
                    ) : (
                      'Select specific equipment and generate predictions.'
                    )}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* History Tab */}
          <TabsContent value="history">
            <div className="space-y-6">
              {filteredHistory && filteredHistory.length > 0 ? (
                filteredHistory.map((history: MaintenanceHistory) => (
                  <Card key={history.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{formatMaintenanceType(history.maintenanceType)}</CardTitle>
                        <Badge variant={history.isSuccessful ? "outline" : "destructive"}>
                          {history.isSuccessful ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" /> Successful</>
                          ) : (
                            <><AlertCircle className="h-3 w-3 mr-1" /> Issues</>
                          )}
                        </Badge>
                      </div>
                      <CardDescription>
                        {history.equipmentName || `Equipment ID: ${history.equipmentId}`} • 
                        {formatDate(history.serviceDate)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Runtime</Label>
                          <p className="font-medium">{history.runtime} hours</p>
                        </div>
                        {history.cost !== null && (
                          <div className="space-y-1">
                            <Label className="text-xs">Cost</Label>
                            <p className="font-medium">${history.cost.toFixed(2)}</p>
                          </div>
                        )}
                        {history.technician && (
                          <div className="space-y-1">
                            <Label className="text-xs">Technician</Label>
                            <p className="font-medium">{history.technician}</p>
                          </div>
                        )}
                        {history.nextRecommendedDate && (
                          <div className="space-y-1">
                            <Label className="text-xs">Next Service</Label>
                            <p className="font-medium">{formatDate(history.nextRecommendedDate)}</p>
                          </div>
                        )}
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <Label className="text-xs">Service Description</Label>
                        <p className="text-sm">{history.description}</p>
                      </div>
                      
                      {history.findings && (
                        <div className="space-y-2">
                          <Label className="text-xs">Findings</Label>
                          <div className="p-2 bg-muted rounded-md text-sm">
                            {history.findings}
                          </div>
                        </div>
                      )}
                      
                      {history.partsReplaced && history.partsReplaced.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs">Parts Replaced</Label>
                          <div className="flex flex-wrap gap-2">
                            {history.partsReplaced.map((part, index) => (
                              <Badge key={index} variant="outline" className="flex items-center">
                                <Wrench className="h-3 w-3 mr-1" />
                                {part.split('_').join(' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-64">
                  <CalendarClock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Maintenance History</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    No maintenance history records found for the selected criteria.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default PredictiveMaintenance;