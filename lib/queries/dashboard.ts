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

/**
 * ✅ Updated version — now supports filtering by date range
 */
export async function fetchBookingStats(fromDate?: string, toDate?: string): Promise<BookingStats> {
  const db = getFirestoreDb();

  const providerIds = [
    "mwBcGMWLwDULHIS9hXx7JLuRfCi1",
    "Dmoo33tCx0OU1HMtapISBc9Oeeq2",
    "VxxapfO7l8YM5f6xmFqpThc17eD3",
  ];
  const providerRefs = providerIds.map((id) => doc(db, "customer", id));

  const bookingsCol = collection(db, "bookings");
  const customersCol = collection(db, "customer");

  // 📅 Default fallback if no date range is provided
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const startDate = fromDate ? new Date(fromDate + "T00:00:00Z") : startOfThisMonth;
  const endDate = toDate ? new Date(toDate + "T23:59:59Z") : endOfThisMonth;

  const fromTimestamp = Timestamp.fromDate(startDate);
  const toTimestamp = Timestamp.fromDate(endDate);

  // 🔹 1. Bookings within selected range
  const bookingsSnap = await getDocs(
    query(
      bookingsCol,
      where("provider_id", "in", providerRefs),
      where("date", ">=", fromTimestamp),
      where("date", "<=", toTimestamp)
    )
  );
  const totalBookings = bookingsSnap.size;

  // 🔹 Status counts
  const pendingSnap = await getDocs(
    query(
      bookingsCol,
      where("provider_id", "in", providerRefs),
      where("status", "==", "Pending"),
      where("date", ">=", fromTimestamp),
      where("date", "<=", toTimestamp)
    )
  );
  const confirmedSnap = await getDocs(
    query(
      bookingsCol,
      where("provider_id", "in", providerRefs),
      where("status", "==", "Accepted"),
      where("date", ">=", fromTimestamp),
      where("date", "<=", toTimestamp)
    )
  );
  const completedSnap = await getDocs(
    query(
      bookingsCol,
      where("provider_id", "in", providerRefs),
      where("status", "==", "Service_Completed"),
      where("date", ">=", fromTimestamp),
      where("date", "<=", toTimestamp)
    )
  );
  const cancelledSnap = await getDocs(
    query(
      bookingsCol,
      where("provider_id", "in", providerRefs),
      where("status", "==", "Booking_Cancelled"),
      where("date", ">=", fromTimestamp),
      where("date", "<=", toTimestamp)
    )
  );

  const pendingBookings = pendingSnap.size;
  const confirmedBookings = confirmedSnap.size;
  const completedBookings = completedSnap.size;
  const cancelledBookings = cancelledSnap.size;

  // 💰 Revenue (only for completed bookings)
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
  const perOrderValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;

  // 👥 Customers created in selected date range
  const customersSnap = await getDocs(
    query(
      customersCol,
      where("userType.customer", "==", true),
      where("created_time", ">=", fromTimestamp),
      where("created_time", "<=", toTimestamp)
    )
  );
  const totalCustomers = customersSnap.size;

  // 🔹 2. Compare with previous range (for % change)
  const previousStart = new Date(startDate);
  const previousEnd = new Date(endDate);
  const diff = endDate.getTime() - startDate.getTime();
  previousStart.setTime(previousStart.getTime() - diff);
  previousEnd.setTime(previousEnd.getTime() - diff);

  const prevFrom = Timestamp.fromDate(previousStart);
  const prevTo = Timestamp.fromDate(previousEnd);

  async function getStats(from: Timestamp, to: Timestamp) {
    const snap = await getDocs(
      query(
        bookingsCol,
        where("provider_id", "in", providerRefs),
        where("date", ">=", from),
        where("date", "<=", to)
      )
    );
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
      const d = docSnap.data();
      revenue += d.amount_paid || 0;
      wallet += d.walletAmountUsed || 0;
      discount += d.discount_amount || 0;
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
      total: snap.size,
      completed: completedSnap.size,
      revenue,
      net,
      pov,
      customers: custSnap.size,
    };
  }

  const thisRange = await getStats(fromTimestamp, toTimestamp);
  const prevRange = await getStats(prevFrom, prevTo);

  // 📈 Calculate percentage changes
  const totalBookingsChange = calculateChange(thisRange.total, prevRange.total);
  const completedBookingsChange = calculateChange(thisRange.completed, prevRange.completed);
  const totalRevenueChange = calculateChange(thisRange.revenue, prevRange.revenue);
  const netRevenueChange = calculateChange(thisRange.net, prevRange.net);
  const perOrderValueChange = calculateChange(thisRange.pov, prevRange.pov);
  const totalCustomersChange = calculateChange(thisRange.customers, prevRange.customers);

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
    averageRating: 5,
    totalRatingsCount: 0,
    completionRate: Number(completionRate.toFixed(1)),
    totalOfferAmount,
  };
}
