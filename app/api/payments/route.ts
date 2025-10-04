import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const keyId = process.env.RAZORPAY_KEY_ID!;
    const keySecret = process.env.RAZORPAY_KEY_SECRET!;
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    // Razorpay pagination settings
    const LIMIT = 100;
    let skip = 0;
    let allPayments: any[] = [];

    // ✅ Fetch all payments
    while (true) {
      const params = new URLSearchParams();
      params.set("count", LIMIT.toString());
      params.set("skip", skip.toString());
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(
        `https://api.razorpay.com/v1/payments?${params.toString()}`,
        {
          headers: { Authorization: `Basic ${auth}` },
        }
      );

      if (!res.ok) {
        return NextResponse.json(
          { error: "Failed to fetch payments" },
          { status: 500 }
        );
      }

      const data = await res.json();
      const items = data.items ?? [];

      allPayments.push(...items);
      if (items.length < LIMIT) break;
      skip += LIMIT;
    }

    // ✅ Fetch settlements
    const settlementParams = new URLSearchParams();
    settlementParams.set("count", LIMIT.toString());
    if (from) settlementParams.set("from", from);
    if (to) settlementParams.set("to", to);

    const settlementRes = await fetch(
      `https://api.razorpay.com/v1/settlements?${settlementParams.toString()}`,
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );

    let settlements: any[] = [];
    if (settlementRes.ok) {
      const sData = await settlementRes.json();
      settlements = sData.items ?? [];
    }

    // ✅ Compute payment stats
    let totalPayments = allPayments.length;
    let successfulPayments = 0;
    let failedPayments = 0;
    let refundedPayments = 0;
    let totalAmount = 0;

    for (const p of allPayments) {
      const status = p.status?.toUpperCase() || "N/A";
      const amount = (p.amount ?? 0) / 100;

      if (status === "CAPTURED") successfulPayments++;
      if (status === "FAILED") failedPayments++;
      if (status === "REFUNDED") refundedPayments++;
      totalAmount += amount;
    }

    // ✅ Compute settlement stats
    const totalSettlements = settlements.length;
    const totalSettlementAmount = settlements.reduce(
      (sum, s) => sum + (s.amount ?? 0) / 100,
      0
    );

    const stats = {
      totalPayments,
      successfulPayments,
      failedPayments,
      refundedPayments,
      totalAmount,
      totalSettlements,
      totalSettlementAmount,
    };

    return NextResponse.json({
      payments: allPayments,
      settlements,
      stats,
    });
  } catch (e: any) {
    console.error("Payments API error:", e.message || e);
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
