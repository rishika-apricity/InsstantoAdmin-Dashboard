import { getFirestoreDb } from "@/lib/firebase";
import { collection, getDocs, getDoc, doc, DocumentReference, DocumentData, query, where } from "firebase/firestore";

export type TopService = {
  name: string;
  bookings: number;
  category?: string;
};

export type TopCategory = {
  categoryName: string;
  totalBookings: number;
  topService: string;
};

// Define Firestore document types
type SubCategoryDoc = {
  service_name: string;
  service_subCategory?: DocumentReference<DocumentData>;
};

type CategoryDoc = {
  name: string;
};

export async function fetchTopServices(): Promise<TopService[]> {
  try {
    const db = getFirestoreDb();
    const q = query(
      collection(db, "bookings"),
      where("status", "==", "Service_Completed")
    );
    const snapshot = await getDocs(q);

    const allowedProviders = [
      "VxxapfO7l8YM5f6xmFqpThc17eD3",
      "mwBcGMWLwDULHIS9hXx7JLuRfCi1",
      "Dmoo33tCx0OU1HMtapISBc9Oeeq2",
    ];

    const bookingsBySubCat: Record<string, number> = {};
    const subCategoryRefs: Set<string> = new Set();

    for (const doc of snapshot.docs) {
      const booking = doc.data();
      const providerId = booking.provider_id?.id || booking.provider_id;
      if (!allowedProviders.includes(providerId)) continue;

      const subCatRef: DocumentReference<DocumentData> | undefined = booking.subCategoryCart_id;
      if (!subCatRef) continue;

      subCategoryRefs.add(subCatRef.path);
      bookingsBySubCat[subCatRef.path] = (bookingsBySubCat[subCatRef.path] || 0) + 1;
    }

    // Fetch all subcategories in parallel
    const subCatDocs = await Promise.all(
      Array.from(subCategoryRefs).map(async (path) => {
        const subCatSnap = await getDoc(doc(db, path));
        const subCatData = subCatSnap.data() as SubCategoryDoc | undefined;

        let categoryName: string | undefined;
        if (subCatData?.service_subCategory) {
          const categorySnap = await getDoc(subCatData.service_subCategory);
          const categoryData = categorySnap.data() as CategoryDoc | undefined;
          categoryName = categoryData?.name;
        }

        return { path, data: subCatData, category: categoryName };
      })
    );

    const serviceData: Record<string, { count: number; category?: string }> = {};

    for (const { path, data, category } of subCatDocs) {
      if (!data) continue;
      const serviceName = data.service_name;
      if (!serviceName) continue;
      const count = bookingsBySubCat[path] || 0;

      if (serviceData[serviceName]) {
        serviceData[serviceName].count += count;
      } else {
        serviceData[serviceName] = { count, category };
      }
    }

    return Object.entries(serviceData)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data]) => ({
        name,
        bookings: data.count,
        category: data.category,
      }));
  } catch (error) {
    console.error("Error fetching top services:", error);
    return [];
  }
}

export async function fetchTopCategories(fromDate: string, toDate: string): Promise<TopCategory[]> {
  try {
    const services = await fetchTopServices();
    const categoryMap: Record<string, { total: number; services: TopService[] }> = {};

    for (const service of services) {
      const cat = service.category || "Uncategorized";
      if (!categoryMap[cat]) {
        categoryMap[cat] = { total: 0, services: [] };
      }
      categoryMap[cat].total += service.bookings;
      categoryMap[cat].services.push(service);
    }

    return Object.entries(categoryMap)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([categoryName, data]) => ({
        categoryName,
        totalBookings: data.total,
        topService: data.services[0]?.name || "No services",
      }));
  } catch (error) {
    console.error("Error fetching top categories:", error);
    return [];
  }
}
