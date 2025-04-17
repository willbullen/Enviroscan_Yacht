import { useVesselQuery } from "@/hooks/useVesselQuery";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
}

const InventoryStatus: React.FC = () => {
  const { data: inventoryItems, isLoading } = useVesselQuery<InventoryItem[]>("/api/inventory");

  const filteredItems = inventoryItems
    ? inventoryItems
        .sort((a: InventoryItem, b: InventoryItem) => {
          // Calculate percentage of stock relative to min quantity
          const aPercentage = (a.quantity / a.minQuantity) * 100;
          const bPercentage = (b.quantity / b.minQuantity) * 100;
          return aPercentage - bPercentage;
        })
        .slice(0, 4)
    : [];

  const getStockStatus = (quantity: number, minQuantity: number) => {
    const percentageLeft = (quantity / minQuantity) * 100;
    if (percentageLeft <= 30) {
      return { text: "Low Stock", color: "text-red-600" };
    } else if (percentageLeft <= 60) {
      return { text: "Medium Stock", color: "text-yellow-600" };
    } else {
      return { text: "Good Stock", color: "text-green-600" };
    }
  };

  const getProgressColor = (quantity: number, minQuantity: number) => {
    const percentageLeft = (quantity / minQuantity) * 100;
    if (percentageLeft <= 30) {
      return "bg-red-600";
    } else if (percentageLeft <= 60) {
      return "bg-yellow-500";
    } else {
      return "bg-green-500";
    }
  };

  const getProgressWidth = (quantity: number, minQuantity: number) => {
    // Calculate percentage but cap at 100%
    const percentageLeft = Math.min((quantity / minQuantity) * 100, 100);
    return percentageLeft;
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-semibold text-lg">Inventory Status</h2>
        <button className="text-xs text-navy-dark hover:underline">
          View All Items
        </button>
      </div>

      <div className="p-4">
        {isLoading ? (
          // Loading skeletons
          Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="mb-4">
                <div className="flex justify-between mb-1 items-center">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="flex justify-between mt-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))
        ) : filteredItems.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            No inventory items found
          </div>
        ) : (
          filteredItems.map((item: InventoryItem) => {
            const status = getStockStatus(item.quantity, item.minQuantity);
            const progressColor = getProgressColor(item.quantity, item.minQuantity);
            const progressWidth = getProgressWidth(item.quantity, item.minQuantity);

            return (
              <div key={item.id} className="mb-4">
                <div className="flex justify-between mb-1 items-center">
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className={`text-xs font-medium ${status.color}`}>
                    {status.text}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${progressColor} h-2 rounded-full`}
                    style={{ width: `${progressWidth}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    {item.quantity} {item.unit} remaining
                  </span>
                  <span className="text-xs text-gray-500">
                    Reorder point: {item.minQuantity} {item.unit}
                  </span>
                </div>
              </div>
            );
          })
        )}

        <div className="mt-4">
          <Button className="w-full bg-navy text-white hover:bg-navy-dark">
            Generate Purchase Order
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InventoryStatus;
