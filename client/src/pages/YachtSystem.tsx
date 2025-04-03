import React, { useEffect, useState } from "react";
import { useRoute } from "wouter";
import MainLayout from "@/components/layout/MainLayout";
import { Shield, Zap, Lightbulb, Compass } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Temp type for system components
interface SystemComponent {
  id: number;
  name: string;
  status: "operational" | "warning" | "critical" | "maintenance";
  lastCheck: string;
  nextCheck: string;
  description: string;
}

const YachtSystem: React.FC = () => {
  const [, params] = useRoute("/:systemType");
  const systemType = params?.systemType || "mechanical";
  const [systemComponents, setSystemComponents] = useState<SystemComponent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate loading system data
    setLoading(true);
    setTimeout(() => {
      // Generate mock data based on system type
      const mockComponents: SystemComponent[] = generateMockComponents(systemType);
      setSystemComponents(mockComponents);
      setLoading(false);
    }, 500);
  }, [systemType]);

  const generateMockComponents = (type: string): SystemComponent[] => {
    // This is just for UI demonstration
    const baseComponents: Record<string, SystemComponent[]> = {
      mechanical: [
        {
          id: 1,
          name: "Main Engine",
          status: "operational",
          lastCheck: "2023-03-15",
          nextCheck: "2023-09-15",
          description: "Caterpillar C32 ACERT Marine Engine"
        },
        {
          id: 2,
          name: "Generator Set",
          status: "warning",
          lastCheck: "2023-02-20",
          nextCheck: "2023-08-20",
          description: "Northern Lights M80C13.5 Generator Set"
        },
        {
          id: 3,
          name: "Transmission",
          status: "operational",
          lastCheck: "2023-03-10",
          nextCheck: "2023-09-10",
          description: "ZF Marine ZF2000A Transmission"
        },
        {
          id: 4,
          name: "Steering System",
          status: "maintenance",
          lastCheck: "2023-01-05",
          nextCheck: "2023-07-05",
          description: "Hydraulic Power Steering System"
        }
      ],
      electrical: [
        {
          id: 1,
          name: "Main Switchboard",
          status: "operational",
          lastCheck: "2023-03-05",
          nextCheck: "2023-09-05",
          description: "Main electrical distribution panel"
        },
        {
          id: 2,
          name: "Shore Power System",
          status: "operational",
          lastCheck: "2023-02-15",
          nextCheck: "2023-08-15",
          description: "100A Shore Power Connection"
        },
        {
          id: 3,
          name: "Battery Bank",
          status: "warning",
          lastCheck: "2023-02-10",
          nextCheck: "2023-08-10",
          description: "24V Battery Bank System"
        }
      ],
      navigation: [
        {
          id: 1,
          name: "GPS System",
          status: "operational",
          lastCheck: "2023-03-20",
          nextCheck: "2023-09-20",
          description: "Garmin GPSMap 8600 Series"
        },
        {
          id: 2,
          name: "Radar System",
          status: "operational",
          lastCheck: "2023-03-10",
          nextCheck: "2023-09-10",
          description: "Raymarine Quantum 2 Q24D Radar"
        },
        {
          id: 3,
          name: "Autopilot",
          status: "critical",
          lastCheck: "2023-01-15",
          nextCheck: "2023-07-15",
          description: "Garmin GHP Reactor 40 Autopilot"
        }
      ],
      safety: [
        {
          id: 1,
          name: "Fire Detection System",
          status: "operational",
          lastCheck: "2023-03-01",
          nextCheck: "2023-09-01",
          description: "Marine Fire Detection & Alarm System"
        },
        {
          id: 2,
          name: "Life Rafts",
          status: "operational",
          lastCheck: "2023-02-25",
          nextCheck: "2023-08-25",
          description: "Viking 12-Person Life Raft"
        },
        {
          id: 3,
          name: "EPIRB",
          status: "maintenance",
          lastCheck: "2023-01-10",
          nextCheck: "2023-07-10",
          description: "ACR GlobalFix V4 EPIRB"
        }
      ]
    };
    
    return baseComponents[type] || [];
  };

  const getSystemIcon = () => {
    switch (systemType) {
      case "mechanical":
        return <Zap className="h-6 w-6" />;
      case "electrical":
        return <Lightbulb className="h-6 w-6" />;
      case "navigation":
        return <Compass className="h-6 w-6" />;
      case "safety":
        return <Shield className="h-6 w-6" />;
      default:
        return <Zap className="h-6 w-6" />;
    }
  };

  const getSystemTitle = () => {
    return systemType.charAt(0).toUpperCase() + systemType.slice(1) + " Systems";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
        return "bg-red-100 text-red-800";
      case "maintenance":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <MainLayout title={getSystemTitle()}>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center">
                {getSystemIcon()}
                <div className="ml-3">
                  <CardTitle>{getSystemTitle()}</CardTitle>
                  <CardDescription>
                    Manage and monitor {systemType} systems of your yacht
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-pulse">Loading system data...</div>
                    </div>
                  ) : (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {systemComponents.map((component) => (
                        <Card key={component.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg">{component.name}</CardTitle>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(component.status)}`}>
                                {component.status.charAt(0).toUpperCase() + component.status.slice(1)}
                              </span>
                            </div>
                            <CardDescription className="line-clamp-2">
                              {component.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Last inspection:</span>
                                <span>{component.lastCheck}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Next inspection:</span>
                                <span>{component.nextCheck}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="maintenance">
                  <div className="py-10 text-center">
                    <p className="text-muted-foreground">
                      Maintenance schedule for {systemType} systems will be implemented in a future update.
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="documents">
                  <div className="py-10 text-center">
                    <p className="text-muted-foreground">
                      Documentation for {systemType} systems will be implemented in a future update.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default YachtSystem;