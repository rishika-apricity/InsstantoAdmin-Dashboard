import { collection, getDocs, query, where, Timestamp, doc, getDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";

export type BookingInfo = {
  customer: string;
  service: string;
  amount: number;
};

export type DailyOverview = {
  date: string;
  dailyAverageExpense: number;
  totalBookings: number;
  totalBookingAmount: number;
  bookings: BookingInfo[];
  services: { name: string; count: number; amount: number }[];
};

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzu4Xj2cluOSQ7-eT9VNvEkZu_3ghcImdSWYTWq2181-0M7OV16a2GN70WcC7DnagsrkZFfDeJioJo/pub?output=csv";

async function fetchAverageExpenseFromSheet(): Promise<number> {
  try {
    const res = await fetch(SHEET_URL);
    const text = await res.text();

    const rows = text.trim().split("\n").map((r) => r.split(","));
    const header = rows[0];
    const monthIndex = header.findIndex((c) => c.toLowerCase().includes("month"));
    const totalIndex = header.findIndex((c) => c.toLowerCase().includes("total"));

    const dataRows = rows.slice(1).filter((r) => r[monthIndex] && r[totalIndex]);
    if (dataRows.length === 0) return 0;

    const lastRow = dataRows[dataRows.length - 1];
    const totalExpense = parseFloat(lastRow[totalIndex]) || 0;

    const currentMonth = new Date().getMonth();
    const daysInMonth = new Date(new Date().getFullYear(), currentMonth + 1, 0).getDate();

    return totalExpense / daysInMonth;
  } catch (err) {
    console.error("Error fetching expense sheet:", err);
    return 0;
  }
}

export async function fetchDailyOverviewSummary(): Promise<DailyOverview> {
  const db = getFirestoreDb();
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  // Step 1️⃣ — Daily average expense from Google Sheet
  const dailyAverageExpense = await fetchAverageExpenseFromSheet();

  // Step 2️⃣ — Today's bookings
  let totalBookings = 0;
  let totalBookingAmount = 0;
  const servicesMap: Record<string, { count: number; amount: number }> = {};
  const bookings: BookingInfo[] = [];

  try {
    const bookingsSnap = await getDocs(
      query(
        collection(db, "bookings"),
        where("date", ">=", Timestamp.fromDate(startOfDay)),
        where("date", "<=", Timestamp.fromDate(endOfDay))
      )
    );

    const customerRefs: Record<string, string> = {}; // cache to avoid duplicate fetches

    for (const docSnap of bookingsSnap.docs) {
      const d = docSnap.data();
      totalBookings++;
      totalBookingAmount += d.amount_paid || 0;

      // --- Fetch customer name ---
      let customerName = "Unknown Customer";
      const customerRef = d.customer_id;
      if (customerRef?.path) {
        if (customerRefs[customerRef.path]) {
          customerName = customerRefs[customerRef.path];
        } else {
          try {
          const custDoc = await getDoc(customerRef);
if (custDoc.exists()) {
  const custData = custDoc.data() as Record<string, any>; // ✅ Explicit type cast
  customerName =
    custData.display_name ||
    custData.customer_name ||
    custData.name ||
    "Unknown Customer";
  customerRefs[customerRef.path] = customerName;
}

          } catch (err) {
            console.warn("Error fetching customer:", err);
          }
        }
      }

      const serviceName =
        d.service_name ||
        d.serviceOpt ||
        d.subCategoryName ||
        d.sub_category_name ||
        d.cartClone_name ||
        "Unknown Service";

      // --- Build per-service aggregation ---
      if (!servicesMap[serviceName]) {
        servicesMap[serviceName] = { count: 0, amount: 0 };
      }
      servicesMap[serviceName].count++;
      servicesMap[serviceName].amount += d.amount_paid || 0;

      // --- Push booking info ---
      bookings.push({
        customer: customerName,
        service: serviceName,
        amount: d.amount_paid || 0,
      });
    }
  } catch (e) {
    console.error("Error fetching today's bookings:", e);
  }

  const services = Object.keys(servicesMap).map((key) => ({
    name: key,
    count: servicesMap[key].count,
    amount: servicesMap[key].amount,
  }));

  return {
    date: today.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    dailyAverageExpense,
    totalBookings,
    totalBookingAmount,
    bookings,
    services,
  };
}