"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  CheckCircle,
  XCircle,
  RotateCcw,
  IndianRupee,
  Banknote,
  Building,
  Coins,
} from "lucide-react";

interface PaymentStats {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  refundedPayments: number;
  refundedAmount: number;
  totalAmount: number;
  totalSettlements: number;
  totalSettlementAmount: number;
}

export default function PaymentStatsCards({ stats }: { stats: PaymentStats }) {
  const successRate =
    stats.totalPayments > 0
      ? ((stats.successfulPayments / stats.totalPayments) * 100).toFixed(1)
      : 0;

  const refundRate =
    stats.totalPayments > 0
      ? ((stats.refundedPayments / stats.totalPayments) * 100).toFixed(1)
      : 0;

  const netRevenue = stats.totalAmount - stats.refundedAmount;

  return (
    <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
      {/* Total Payments */}
      <Card className="min-h-[140px] p-4 border-l-4 border-blue-500 bg-blue-50 shadow-sm flex flex-col justify-between rounded-2xl transition-all hover:shadow-md hover:scale-[1.01]">
        <div className="flex justify-between items-start">
          <h2 className="text-base font-medium text-gray-600">Total Payments</h2>
          <Wallet className="h-5 w-5 text-blue-500" />
        </div>
        <p className="text-2xl font-extrabold text-blue-600 tracking-tight">
          {stats.totalPayments}
        </p>
        <p className="text-xs text-gray-500">All time payments</p>
      </Card>

      {/* Successful */}
      <Card className="min-h-[140px] p-4 border-l-4 border-green-500 bg-green-50 shadow-sm flex flex-col justify-between rounded-2xl transition-all hover:shadow-md hover:scale-[1.01]">
        <div className="flex justify-between items-start">
          <h2 className="text-base font-medium text-gray-600">Successful</h2>
          <CheckCircle className="h-5 w-5 text-green-500" />
        </div>
        <p className="text-2xl font-extrabold text-green-600 tracking-tight">
          {stats.successfulPayments}
        </p>
        <div className="flex flex-col">
          <p className="text-xs text-gray-500 mb-1">Successful transactions</p>
          <Badge className="w-fit bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5">
            {successRate}% success rate
          </Badge>
        </div>
      </Card>

      {/* Failed */}
      <Card className="min-h-[140px] p-4 border-l-4 border-red-500 bg-red-50 shadow-sm flex flex-col justify-between rounded-2xl transition-all hover:shadow-md hover:scale-[1.01]">
        <div className="flex justify-between items-start">
          <h2 className="text-base font-medium text-gray-600">Failed</h2>
          <XCircle className="h-5 w-5 text-red-500" />
        </div>
        <p className="text-2xl font-extrabold text-red-600 tracking-tight">
          {stats.failedPayments}
        </p>
        <p className="text-xs text-gray-500">Failed attempts</p>
      </Card>

      {/* Refunded */}
      <Card className="min-h-[140px] p-4 border-l-4 border-orange-500 bg-orange-50 shadow-sm flex flex-col justify-between rounded-2xl transition-all hover:shadow-md hover:scale-[1.01]">
        <div className="flex justify-between items-start">
          <h2 className="text-base font-medium text-gray-600">Refunded</h2>
          <RotateCcw className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-orange-600 tracking-tight">
            {stats.refundedPayments}
          </p>
          <p className="text-lg font-semibold text-orange-700 leading-tight">
            ₹{stats.refundedAmount?.toLocaleString("en-IN") || 0}
          </p>
        </div>
        <div className="flex flex-col">
          <p className="text-xs text-gray-500 mb-1">Total refund amount</p>
          <Badge className="w-fit bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5">
            {refundRate}% refund rate
          </Badge>
        </div>
      </Card>

      {/* Total Amount */}
      <Card className="min-h-[140px] p-4 border-l-4 border-purple-500 bg-purple-50 shadow-sm flex flex-col justify-between rounded-2xl transition-all hover:shadow-md hover:scale-[1.01]">
        <div className="flex justify-between items-start">
          <h2 className="text-base font-medium text-gray-600">Total Amount</h2>
          <IndianRupee className="h-5 w-5 text-purple-500" />
        </div>
        <p className="text-2xl font-extrabold text-purple-600 tracking-tight">
          ₹{stats.totalAmount.toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-gray-500">Total earnings</p>
      </Card>

      {/* Net Revenue */}
      <Card className="min-h-[140px] p-4 border-l-4 border-amber-500 bg-yellow-50 shadow-sm flex flex-col justify-between rounded-2xl transition-all hover:shadow-md hover:scale-[1.01]">
        <div className="flex justify-between items-start">
          <h2 className="text-base font-medium text-gray-600">Net Revenue</h2>
          <Coins className="h-5 w-5 text-amber-500" />
        </div>
        <p className="text-2xl font-extrabold text-amber-600 tracking-tight">
          ₹{netRevenue.toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-gray-500">After refunds</p>
      </Card>

      {/* Total Settlements */}
      <Card className="min-h-[140px] p-4 border-l-4 border-teal-500 bg-teal-50 shadow-sm flex flex-col justify-between rounded-2xl transition-all hover:shadow-md hover:scale-[1.01]">
        <div className="flex justify-between items-start">
          <h2 className="text-base font-medium text-gray-600">Settlements</h2>
          <Building className="h-5 w-5 text-teal-500" />
        </div>
        <p className="text-2xl font-extrabold text-teal-600 tracking-tight">
          {stats.totalSettlements}
        </p>
        <p className="text-xs text-gray-500">Total settlement entries</p>
      </Card>

      {/* Settlement Amount */}
      <Card className="min-h-[140px] p-4 border-l-4 border-indigo-500 bg-indigo-50 shadow-sm flex flex-col justify-between rounded-2xl transition-all hover:shadow-md hover:scale-[1.01]">
        <div className="flex justify-between items-start">
          <h2 className="text-base font-medium text-gray-600">
            Settlement Amount
          </h2>
          <Banknote className="h-5 w-5 text-indigo-500" />
        </div>
        <p className="text-2xl font-extrabold text-indigo-600 tracking-tight">
          ₹{stats.totalSettlementAmount.toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-gray-500">Total settled to account</p>
      </Card>
    </div>
  );
}
