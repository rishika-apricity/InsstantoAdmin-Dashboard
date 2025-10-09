import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils"; // Ensure you have this helper for className merging

interface KpiCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
  color: string;
  description: string;
}

export function KpiCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
  description,
}: KpiCardProps) {
  // Map your text color props to border and background colors
  const colorMapping: Record<string, { border: string; bg: string; text: string }> = {
    "text-primary": { border: "border-blue-500", bg: "bg-blue-50", text: "text-blue-600" },
    "text-secondary": { border: "border-green-500", bg: "bg-green-50", text: "text-green-600" },
    "text-chart-3": { border: "border-purple-500", bg: "bg-purple-50", text: "text-purple-600" },
    "text-chart-4": { border: "border-orange-500", bg: "bg-orange-50", text: "text-orange-600" },
    "text-chart-2": { border: "border-indigo-500", bg: "bg-indigo-50", text: "text-indigo-600" },
    default: { border: "border-teal-500", bg: "bg-teal-50", text: "text-teal-600" },
  };

  const colorStyles = colorMapping[color] || colorMapping.default;

  return (
    <Card
      className={cn(
        "transition-transform hover:scale-[1.02] hover:shadow-md border-l-4 shadow-sm",
        colorStyles.border,
        colorStyles.bg
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={cn("h-4 w-4 opacity-90", color)} />
        </div>
      </CardHeader>

      <CardContent>
        {/* Value with same color as icon */}
        <div className={cn("text-2xl font-bold", colorStyles.text)}>
          {value}
        </div>

        <div className="flex items-center space-x-1 text-xs">
          <span className={trend === "up" ? "text-green-600" : "text-red-600"}>
            {change}
          </span>
          <span className="text-muted-foreground">from last month</span>
        </div>

        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
