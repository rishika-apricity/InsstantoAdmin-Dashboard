import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: any
  color: string
  description: string
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
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        {/* Value with same color as icon */}
        <div className={`text-2xl font-bold ${color}`}>
          {value}
        </div>
        <div className="flex items-center space-x-1 text-xs">
          <span
            className={
              trend === "up" ? "text-green-600" : "text-red-600"
            }
          >
            {change}
          </span>
          <span className="text-muted-foreground">
            from last month
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
