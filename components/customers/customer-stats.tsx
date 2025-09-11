import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, DollarSign, Star, Calendar } from "lucide-react"
import { mockCustomers } from "@/lib/queries/customers"

export function CustomerStats() {
  const totalCustomers = mockCustomers.length
  const activeCustomers = mockCustomers.filter((c) => c.status === "active").length
  const newThisMonth = mockCustomers.filter((c) => {
    const signupDate = new Date(c.signupDate)
    const thisMonth = new Date()
    return signupDate.getMonth() === thisMonth.getMonth() && signupDate.getFullYear() === thisMonth.getFullYear()
  }).length

  const averageLTV = mockCustomers.reduce((sum, c) => sum + c.lifetimeValue, 0) / totalCustomers
  const averageRating = mockCustomers.reduce((sum, c) => sum + c.averageRating, 0) / totalCustomers

  const topSpenders = mockCustomers.sort((a, b) => b.lifetimeValue - a.lifetimeValue).slice(0, 3)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const stats = [
    {
      title: "Total Customers",
      value: totalCustomers.toString(),
      icon: Users,
      color: "text-primary",
      description: "All registered customers",
    },
    {
      title: "Active Customers",
      value: activeCustomers.toString(),
      icon: UserPlus,
      color: "text-green-600",
      description: "Currently active users",
    },
    {
      title: "New This Month",
      value: newThisMonth.toString(),
      icon: Calendar,
      color: "text-secondary",
      description: "Recent signups",
    },
    {
      title: "Average LTV",
      value: formatCurrency(averageLTV),
      icon: DollarSign,
      color: "text-chart-3",
      description: "Lifetime value per customer",
    },
    {
      title: "Average Rating",
      value: averageRating.toFixed(1),
      icon: Star,
      color: "text-yellow-600",
      description: "Customer satisfaction",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
