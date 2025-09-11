import { collection, getDocs, query, where } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";

export type TimeSlot = {
    time: string;
    bookings: number;
};

export async function fetchMostBookedSlots(): Promise<TimeSlot[]> {
    const db = getFirestoreDb();

    // Fetch all completed bookings
    const snapshot = await getDocs(
        query(
            collection(db, "bookings"),
            where("status", "==", "Service_Completed")
        )
    );

    const slotCount: Record<string, number> = {};

    snapshot.forEach((doc) => {
        const data = doc.data();
        const slotDate = data?.timeSlot?.toDate?.() || null;

        if (slotDate) {
            // Format in 06:00 PM style
            const hour = slotDate.getHours() % 12 || 12;
            const amPm = slotDate.getHours() >= 12 ? "PM" : "AM";
            const timeKey = `${hour.toString().padStart(2, "0")}:00 ${amPm}`;

            slotCount[timeKey] = (slotCount[timeKey] ?? 0) + 1;
        }
    });

    // Convert to array and sort by bookings desc
    return Object.entries(slotCount)
        .map(([time, bookings]) => ({ time, bookings }))
        .sort((a, b) => b.bookings - a.bookings);
}
