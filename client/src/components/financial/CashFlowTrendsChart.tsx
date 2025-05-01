import React from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart } from "@tremor/react";
import { Loader2 } from "lucide-react";

// Type definitions
interface CashFlowChartProps {
  accounts: any[];
  transactions: any[];
  isLoading: boolean;
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  getCashFlowData: (transactions: any[] | null, accountId: string | null, timeRangeMonths: number) => {
    chartData: any[];
    totalBalance: number;
  };
}

const CashFlowTrendsChart: React.FC<CashFlowChartProps> = ({
  accounts,
  transactions,
  isLoading,
  selectedAccountId,
  setSelectedAccountId,
  timeRange,
  setTimeRange,
  getCashFlowData
}) => {
  return (
    <Card className="mt-6 border-primary/20">
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle className="text-lg">Cash Flow Trends</CardTitle>
          <CardDescription>
            Track money in and out of your accounts
          </CardDescription>
        </div>
        
        <div className="flex items-center gap-2">
          <Select 
            value={selectedAccountId || "all"} 
            onValueChange={(value) => setSelectedAccountId(value === "all" ? null : value)}
            aria-label="Select account to view"
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {accounts.map((account: any) => (
                <SelectItem key={account.id} value={account.id.toString()}>
                  {account.accountName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={timeRange} 
            onValueChange={(value) => setTimeRange(value)}
            aria-label="Select time range"
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="12 months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 months</SelectItem>
              <SelectItem value="6months">6 months</SelectItem>
              <SelectItem value="12months">12 months</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[350px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <span>Loading chart data...</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-sm font-medium text-foreground">Account Balance</h4>
                <div className="flex items-baseline mt-1">
                  <span className="text-2xl font-bold">
                    €{getCashFlowData(transactions, selectedAccountId, timeRange === "3months" ? 3 : timeRange === "6months" ? 6 : 12).totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {selectedAccountId ? `for ${accounts.find((a: any) => a.id.toString() === selectedAccountId)?.accountName || 'selected account'}` : 'for all accounts'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                  <span className="text-sm text-muted-foreground">Money In</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-rose-500 mr-2"></div>
                  <span className="text-sm text-muted-foreground">Money Out</span>
                </div>
              </div>
            </div>
            
            <div className="h-[300px] mt-4">
              <LineChart
                className="h-full"
                data={getCashFlowData(transactions, selectedAccountId, timeRange === "3months" ? 3 : timeRange === "6months" ? 6 : 12).chartData}
                index="month"
                categories={["moneyIn", "moneyOut"]}
                colors={["emerald", "rose"]}
                valueFormatter={(number) => `€${number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                showLegend={false}
                yAxisWidth={60}
                showAnimation={true}
                curveType="natural"
                connectNulls={true}
                showGridLines={true}
                showTooltip={true}
                aria-label="Line chart showing cash flow trends"
              />
            </div>
            <p className="text-xs text-center text-muted-foreground mt-4">
              This visualization shows actual cash flow trends over time, including deposits, withdrawals, income, and expenses.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CashFlowTrendsChart;