import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { fetchCustomerStats } from "@/lib/queries/customers";


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
  cac: number;
  cacChange: number;
  netPnL: number;
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
  

  // const thisRange = await getStats(fromTimestamp, toTimestamp);
  // const prevRange = await getStats(prevFrom, prevTo);

  // // 📈 Calculate percentage changes
  // const totalBookingsChange = calculateChange(thisRange.total, prevRange.total);
  // const completedBookingsChange = calculateChange(thisRange.completed, prevRange.completed);
  // const totalRevenueChange = calculateChange(thisRange.revenue, prevRange.revenue);
  // const netRevenueChange = calculateChange(thisRange.net, prevRange.net);
  // const perOrderValueChange = calculateChange(thisRange.pov, prevRange.pov);
  // const totalCustomersChange = calculateChange(thisRange.customers, prevRange.customers);

  // 📅 Date ranges for percentage 
  
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1); 
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const thisMonthFrom = Timestamp.fromDate(startOfThisMonth); 
  const thisMonthTo = Timestamp.fromDate(now); 
  const lastMonthFrom = Timestamp.fromDate(startOfLastMonth); 
  const lastMonthTo = Timestamp.fromDate(endOfLastMonth);
const thisMonth = await getStats(thisMonthFrom, thisMonthTo); 
const lastMonth = await getStats(lastMonthFrom, lastMonthTo);

const totalBookingsChange = calculateChange(thisMonth.total, lastMonth.total); 
const completedBookingsChange = calculateChange( thisMonth.completed, lastMonth.completed ); 
const totalRevenueChange = calculateChange(thisMonth.revenue, lastMonth.revenue); 
const netRevenueChange = calculateChange(thisMonth.net, lastMonth.net); 
const perOrderValueChange = calculateChange(thisMonth.pov, lastMonth.pov); 
const totalCustomersChange = calculateChange(thisMonth.customers, lastMonth.customers);
  const completionRate =
    totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

      // 🧮 CUSTOMER ACQUISITION COST (CAC) CALCULATION

  // 1️⃣ Fetch total expense of last month from Google Sheet
 // 🧮 CUSTOMER ACQUISITION COST (CAC) CALCULATION

// 1️⃣ Fetch total expense of last month from Google Sheet
// 🧮 CUSTOMER ACQUISITION COST (CAC) CALCULATION WITH CHANGE PERCENTAGE

const sheetUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzu4Xj2cluOSQ7-eT9VNvEkZu_3ghcImdSWYTWq2181-0M7OV16a2GN70WcC7DnagsrkZFfDeJioJo/pub?output=csv";

const res = await fetch(sheetUrl);
const text = await res.text();
const rows = text.trim().split("\n").map((r) => r.split(","));

const header = rows[0];
const monthIndex = header.findIndex((col) => col.toLowerCase().includes("month"));
const totalIndex = header.findIndex((col) => col.toLowerCase().includes("total"));

// ✅ 1️⃣ Identify last and second last non-empty months
let lastTotal = 0;
let prevTotal = 0;
let lastMonthName = "";
let prevMonthName = "";
for (let i = rows.length - 1; i > 0; i--) {
  const total = parseFloat(rows[i][totalIndex]);
  const month = rows[i][monthIndex];
  if (!isNaN(total) && total > 0) {
    if (!lastTotal) {
      lastTotal = total;
      lastMonthName = month;
    } else if (!prevTotal) {
      prevTotal = total;
      prevMonthName = month;
      break;
    }
  }
}

// ✅ 2️⃣ Helper to get start/end of a month
function getMonthRange(monthName: string, year: number) {
  const monthIndexNum = new Date(`${monthName} 1, ${year}`).getMonth();
  const start = new Date(year, monthIndexNum, 1);
  const end = new Date(year, monthIndexNum + 1, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    from: `${year}-${pad(monthIndexNum + 1)}-01`,
    to: `${year}-${pad(monthIndexNum + 1)}-${pad(end.getDate())}`,
  };
}

const currentYear = new Date().getFullYear();
const lastRange = getMonthRange(lastMonthName, currentYear);
const prevRange = getMonthRange(prevMonthName, currentYear);

// ✅ 3️⃣ Fetch customersWithOneBooking for both months
const { customersWithOneBooking: lastMonthNewCustomers } = await fetchCustomerStats(
  lastRange.from,
  lastRange.to
);
const { customersWithOneBooking: prevMonthNewCustomers } = await fetchCustomerStats(
  prevRange.from,
  prevRange.to
);

// ✅ 4️⃣ Compute CAC values
const lastCAC =
  lastMonthNewCustomers > 0 ? lastTotal / lastMonthNewCustomers : 0;
const prevCAC =
  prevMonthNewCustomers > 0 ? prevTotal / prevMonthNewCustomers : 0;

// ✅ 5️⃣ Compute percentage change
let cacChange = 0;
if (prevCAC > 0) {
  cacChange = ((lastCAC - prevCAC) / prevCAC) * 100;
}

// ✅ --- NET PNL CALCULATION BASED ON DATE RANGE ---
let netPnL = 0;
let totalExpenseInRange = 0;

// 1️⃣ Extract all month totals from the sheet
const monthlyExpenses = rows.slice(1)
  .map(r => ({
    month: r[monthIndex],
    total: parseFloat(r[totalIndex]) || 0
  }))
  .filter(m => !isNaN(m.total) && m.total > 0);

// 2️⃣ Helper to get number of days in a given month/year
const daysInMonth = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0).getDate();

// 3️⃣ Loop through each month and check overlap with date range
const from = new Date(fromDate || startOfThisMonth);
const to = new Date(toDate || endOfThisMonth);

monthlyExpenses.forEach(({ month, total }) => {
  const monthIndex = new Date(`${month} 1, ${now.getFullYear()}`).getMonth();
  const start = new Date(now.getFullYear(), monthIndex, 1);
  const end = new Date(now.getFullYear(), monthIndex + 1, 0);

  const dailyExpense = total / daysInMonth(now.getFullYear(), monthIndex);

  // If overlap exists between expense month and filter range
  const overlapStart = from > start ? from : start;
  const overlapEnd = to < end ? to : end;

  if (overlapStart <= overlapEnd) {
    const overlapDays =
      (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24) + 1;
    totalExpenseInRange += overlapDays * dailyExpense;
  }
});

// 4️⃣ Calculate Net PnL
netPnL = netRevenue - totalExpenseInRange;


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
  cac: Number(lastCAC.toFixed(2)),
cacChange: Number(cacChange.toFixed(1)),
netPnL: Number(netPnL.toFixed(2)),

  };
}