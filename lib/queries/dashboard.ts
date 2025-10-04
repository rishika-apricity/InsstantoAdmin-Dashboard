import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";

export type BookingStats = {
  totalBookings: number;
  totalBookingsChange: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  completedBookingsChange: number;
  cancelledBookings: number;
  totalRevenue: number;
  totalRevenueChange: number;
  netRevenue: number;
  netRevenueChange: number;
  perOrderValue: number;
  perOrderValueChange: number;
  totalCustomers: number;
  totalCustomersChange: number;
  averageRating: number;
  totalRatingsCount: number;
  completionRate: number;
  totalOfferAmount: number;
};

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export async function fetchBookingStats(): Promise<BookingStats> {
  const db = getFirestoreDb();

  const providerIds = [
    "mwBcGMWLwDULHIS9hXx7JLuRfCi1",
    "Dmoo33tCx0OU1HMtapISBc9Oeeq2",
    "VxxapfO7l8YM5f6xmFqpThc17eD3",
  ];
  const providerRefs = providerIds.map((id) => doc(db, "customer", id));

  const bookingsCol = collection(db, "bookings");
  const customersCol = collection(db, "customer");

  // 📅 Date ranges for percentage change
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const thisMonthFrom = Timestamp.fromDate(startOfThisMonth);
  const thisMonthTo = Timestamp.fromDate(now);
  const lastMonthFrom = Timestamp.fromDate(startOfLastMonth);
  const lastMonthTo = Timestamp.fromDate(endOfLastMonth);

  // 🔹 1. All-time counts
  const totalBookingsSnap = await getDocs(
    query(bookingsCol, where("provider_id", "in", providerRefs))
  );
  const totalBookings = totalBookingsSnap.size;

  const pendingSnap = await getDocs(
    query(bookingsCol, where("provider_id", "in", providerRefs), where("status", "==", "Pending"))
  );
  const pendingBookings = pendingSnap.size;

  const confirmedSnap = await getDocs(
    query(bookingsCol, where("provider_id", "in", providerRefs), where("status", "==", "Accepted"))
  );
  const confirmedBookings = confirmedSnap.size;

  const completedSnap = await getDocs(
    query(bookingsCol, where("provider_id", "in", providerRefs), where("status", "==", "Service_Completed"))
  );
  const completedBookings = completedSnap.size;

  const cancelledSnap = await getDocs(
    query(bookingsCol, where("provider_id", "in", providerRefs), where("status", "==", "Booking_Cancelled"))
  );
  const cancelledBookings = cancelledSnap.size;

  // 💰 Revenue (all time)
  let totalRevenue = 0;
  let totalWalletUsed = 0;
  let totalDiscount = 0;
  let totalOfferAmount = 0;

  completedSnap.forEach((docSnap) => {
    const data = docSnap.data();
    totalRevenue += data.amount_paid || 0;
    totalWalletUsed += data.walletAmountUsed || 0;
    totalDiscount += data.discount_amount || 0;
    totalOfferAmount += (data.discount_amount || 0) + (data.walletAmountUsed || 0);
  });

  const netRevenue = totalRevenue - totalWalletUsed - totalDiscount;
  const perOrderValue =
    completedBookings > 0 ? totalRevenue / completedBookings : 0;

  const customersSnap = await getDocs(
    query(customersCol, where("userType.customer", "==", true))
  );
  const totalCustomers = customersSnap.size;

  // 🔹 2. Date-based stats (for % change only)
  async function getStats(from: Timestamp, to: Timestamp) {
    const snap = await getDocs(
      query(
        bookingsCol,
        where("provider_id", "in", providerRefs),
        where("date", ">=", from),
        where("date", "<=", to)
      )
    );
    const total = snap.size;

    const completedSnap = await getDocs(
      query(
        bookingsCol,
        where("provider_id", "in", providerRefs),
        where("status", "==", "Service_Completed"),
        where("date", ">=", from),
        where("date", "<=", to)
      )
    );

    let revenue = 0;
    let wallet = 0;
    let discount = 0;
    completedSnap.forEach((docSnap) => {
      const data = docSnap.data();
      revenue += data.amount_paid || 0;
      wallet += data.walletAmountUsed || 0;
      discount += data.discount_amount || 0;
    });

    const net = revenue - wallet - discount;
    const pov = completedSnap.size > 0 ? revenue / completedSnap.size : 0;

    const custSnap = await getDocs(
      query(
        customersCol,
        where("userType.customer", "==", true),
        where("created_time", ">=", from),
        where("created_time", "<=", to)
      )
    );

    return {
      total,
      completed: completedSnap.size,
      revenue,
      net,
      pov,
      customers: custSnap.size,
    };
  }

  const thisMonth = await getStats(thisMonthFrom, thisMonthTo);
  const lastMonth = await getStats(lastMonthFrom, lastMonthTo);

  // 🔹 Percentage changes (this month vs last month)
  const totalBookingsChange = calculateChange(thisMonth.total, lastMonth.total);
  const completedBookingsChange = calculateChange(
    thisMonth.completed,
    lastMonth.completed
  );
  const totalRevenueChange = calculateChange(thisMonth.revenue, lastMonth.revenue);
  const netRevenueChange = calculateChange(thisMonth.net, lastMonth.net);
  const perOrderValueChange = calculateChange(thisMonth.pov, lastMonth.pov);
  const totalCustomersChange = calculateChange(thisMonth.customers, lastMonth.customers);

  const completionRate =
    totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

  return {
    totalBookings,
    totalBookingsChange: Number(totalBookingsChange.toFixed(1)),
    pendingBookings,
    confirmedBookings,
    completedBookings,
    completedBookingsChange: Number(completedBookingsChange.toFixed(1)),
    cancelledBookings,
    totalRevenue,
    totalRevenueChange: Number(totalRevenueChange.toFixed(1)),
    netRevenue,
    netRevenueChange: Number(netRevenueChange.toFixed(1)),
    perOrderValue: Number(perOrderValue.toFixed(2)),
    perOrderValueChange: Number(perOrderValueChange.toFixed(1)),
    totalCustomers,
    totalCustomersChange: Number(totalCustomersChange.toFixed(1)),
    averageRating: 5, // placeholder until reviews query is added
    totalRatingsCount: 0, // same here
    completionRate: Number(completionRate.toFixed(1)),
    totalOfferAmount,
  };
}
