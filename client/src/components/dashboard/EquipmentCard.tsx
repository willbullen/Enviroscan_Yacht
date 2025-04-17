import { cn } from "@/lib/utils";
import { useVesselQuery } from "@/hooks/useVesselQuery";
import { 
  Activity, 
  Zap, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock 
} from "lucide-react";

interface Equipment {
  id: number;
  name: string;
  category: string;
  model: string;
  runtime: number;
  lastServiceDate: string;
  nextServiceDate: string;
  status: string;
}

interface EquipmentCardProps {
  equipment: Equipment;
}

const categoryIcons = {
  mechanical: <Activity className="h-6 w-6 text-navy-dark" />,
  electrical: <Zap className="h-6 w-6 text-navy-dark" />,
  navigation: <Activity className="h-6 w-6 text-navy-dark" />,
  safety: <Shield className="h-6 w-6 text-navy-dark" />,
};

const EquipmentCard: React.FC<EquipmentCardProps> = ({ equipment }) => {
  const isServiceDue = new Date(equipment.nextServiceDate) <= new Date();
  
  const serviceStatus = isServiceDue 
    ? { icon: <AlertTriangle className="h-3 w-3 mr-1" />, text: "Attention Needed", className: "bg-red-100 text-red-800" }
    : new Date(equipment.nextServiceDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ? { icon: <Clock className="h-3 w-3 mr-1" />, text: "Service Soon", className: "bg-yellow-100 text-yellow-800" }
    : { icon: <CheckCircle className="h-3 w-3 mr-1" />, text: "Good Condition", className: "bg-green-100 text-green-800" };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center mb-3">
        <div className="bg-navy-light p-2 rounded-md mr-3">
          {categoryIcons[equipment.category as keyof typeof categoryIcons] || 
           <Activity className="h-6 w-6 text-navy-dark" />}
        </div>
        <div>
          <h3 className="font-medium">{equipment.name}</h3>
          <p className="text-xs text-gray-500">{equipment.model}</p>
        </div>
      </div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-500">Runtime:</span>
        <span className="font-mono">{equipment.runtime.toLocaleString()} hrs</span>
      </div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-500">Last Serviced:</span>
        <span>{formatDate(equipment.lastServiceDate)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Next Service:</span>
        <span className={isServiceDue ? "text-red-600 font-medium" : "font-medium"}>
          {isServiceDue ? "Today" : formatDate(equipment.nextServiceDate)}
        </span>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", serviceStatus.className)}>
          {serviceStatus.icon}
          {serviceStatus.text}
        </span>
        <button className="text-xs text-navy hover:underline">View Details</button>
      </div>
    </div>
  );
};

const EquipmentOverview: React.FC = () => {
  const { data: equipment, isLoading } = useVesselQuery<Equipment[]>("/api/equipment");

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-semibold text-lg">Equipment Overview</h2>
        <button className="text-xs text-navy-dark hover:underline">View All</button>
      </div>
      
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 h-48 animate-pulse">
              <div className="flex items-center mb-3">
                <div className="bg-gray-200 p-2 rounded-md h-10 w-10 mr-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))
        ) : equipment && equipment.length > 0 ? (
          equipment.slice(0, 3).map((item: Equipment) => (
            <EquipmentCard key={item.id} equipment={item} />
          ))
        ) : (
          <div className="col-span-3 py-8 text-center text-gray-500">
            No equipment data available
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentOverview;
