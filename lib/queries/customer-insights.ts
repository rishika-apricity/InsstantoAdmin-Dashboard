"use client";

import { collection, getDocs, query, where, DocumentData, Firestore, doc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";

export interface CustomerStats {
    totalCustomers: number;
    newCustomerCount: number;
    repeatCustomerCount: number;
    averageRating: number;
    totalRatings: number;

}

export async function fetchNewVsRepeatCustomers(fromDate: string, toDate: string): Promise<CustomerStats> {
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
    let newCustomerCount = 0;
    let repeatCustomerCount = 0;

    Object.values(bookingCount).forEach((count) => {
        if (count === 1) newCustomerCount++;
        else if (count > 1) repeatCustomerCount++;
    });
    const partnerIds = [
        "mwBcGMWLwDULHIS9hXx7JLuRfCi1",
        "Dmoo33tCx0OU1HMtapISBc9Oeeq2",
        "VxxapfO7l8YM5f6xmFqpThc17eD3",
    ];

    // Query reviews for only these partners
    const reviewsCol = collection(db, "reviews")
    const customerRefs = partnerIds.map(id => doc(db, "customer", id))
    const reviewsQuery = query(
        reviewsCol,
        where("partnerId", "in", customerRefs)
    )
    const reviewSnap = await getDocs(reviewsQuery)

    let totalRating = 0
    let ratingCount = 0

    reviewSnap.forEach(r => {
        const data = r.data() as { partnerRating?: number }
        if (data.partnerRating && data.partnerRating > 0) {
            totalRating += data.partnerRating
            ratingCount++
        }
    })

    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0

    return {
        totalCustomers,
        newCustomerCount,
        repeatCustomerCount,
        averageRating: Number(averageRating.toFixed(2)),
        totalRatings:ratingCount,

    }
}

