"use client";

import { collection, getDocs, query, where, Timestamp, DocumentData } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";

export interface CustomerStats {
  totalCustomers: number;
  customersWithOneBooking: number;
  customersWithMultipleBookings: number;
  newCustomersToday: number;
}

export async function fetchCustomerStats(): Promise<CustomerStats> {
  const db = getFirestoreDb();

  // 1. Fetch all customers
  const customerSnapshot = await getDocs(
    query(collection(db, "customer"), where("userType.customer", "==", true))
  );
  const totalCustomers = customerSnapshot.size;

  // 2. Fetch bookings where status = "service_completed"
  const bookingSnapshot = await getDocs(
    query(collection(db, "bookings"), where("status", "==", "Service_Completed"))
  );

  const bookingCount: Record<string, number> = {};

  bookingSnapshot.forEach((docSnap) => {
    const data = docSnap.data() as DocumentData;
    const customerRef = data.customer_id;
    if (customerRef && customerRef.id) {
      bookingCount[customerRef.id] = (bookingCount[customerRef.id] || 0) + 1;
    }
  });

  // 3. Calculate based only on completed bookings
  let customersWithOneBooking = 0;
  let customersWithMultipleBookings = 0;

  Object.values(bookingCount).forEach((count) => {
    if (count === 1) customersWithOneBooking++;
    else if (count > 1) customersWithMultipleBookings++;
  });

  // 4. Find new customers created today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todaySnapshot = await getDocs(
    query(
      collection(db, "customer"),
      where("created_time", ">=", Timestamp.fromDate(todayStart)),
      where("created_time", "<=", Timestamp.fromDate(todayEnd))
    )
  );

  const newCustomersToday = todaySnapshot.size;

  return {
    totalCustomers,
    customersWithOneBooking,
    customersWithMultipleBookings,
    newCustomersToday,
  };
}
