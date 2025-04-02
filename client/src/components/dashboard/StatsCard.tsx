import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  info?: string;
  color: "red" | "yellow" | "blue" | "green";
}

const colorMap = {
  red: {
    bg: "bg-red-100",
    text: "text-red-800",
    trend: "text-red-600",
  },
  yellow: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    trend: "text-yellow-600",
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    trend: "text-blue-600",
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-800",
    trend: "text-green-600",
  },
};

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  info,
  color,
}) => {
  const colors = colorMap[color];

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className={cn("font-bold text-2xl", colors.text)}>{value}</p>
        </div>
        <div className={cn(colors.bg, "p-2 rounded-md")}>
          {icon}
        </div>
      </div>
      <div className="mt-2">
        {trend ? (
          <span className={cn("text-xs font-semibold", trend.positive ? colors.trend : "text-red-600")}>
            {trend.value}
          </span>
        ) : (
          <span className="text-xs text-gray-500 font-semibold">{info}</span>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
