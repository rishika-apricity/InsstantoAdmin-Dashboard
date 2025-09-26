"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  where,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Phone } from "lucide-react";
import { DocumentReference, DocumentData, getFirestore } from "firebase/firestore";
import { Calendar, Search, Filter } from "lucide-react";

// ---------- Types ----------
type BookingDoc = {
  id: string;
  customer_id?: DocumentReference<DocumentData> | null;
  provider_id?: DocumentReference<DocumentData> | null;
  status?: string;
  subCategoryCart_id?: string;
  package_id?: string;
  amount_paid?: number;
  payment_type?: string;
  date?: Timestamp;
  timeSlot?: Timestamp;
  booking_time?: string;
  bookingAddress?: string;
  city?: string;
};

type PartyInfo = { name?: string; phone?: string; city?: string };

type CartService = {
  id: string;
  serviceName: string;
  subCategoryCartId?: DocumentReference<DocumentData> | string;
};

// ---------- Constants ----------
const PAGE_SIZE = 20;

// Specific customer IDs to filter by
const PROVIDER_IDS = [
  "mwBcGMWLwDULHIS9hXx7JLuRfCi1",
  "Dmoo33tCx0OU1HMtapISBc9Oeeq2", 
  "VxxapfO7l8YM5f6xmFqpThc17eD3"
];

export function BookingTable() {
  const db = getFirestoreDb();
  
  // All data states
  const [allBookings, setAllBookings] = useState<BookingDoc[]>([]);
  const [customerMap, setCustomerMap] = useState<Record<string, PartyInfo>>({});
  const [providerMap, setProviderMap] = useState<Record<string, PartyInfo>>({});
  const [servicesMap, setServicesMap] = useState<Record<string, CartService[]>>({});
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const from = Timestamp.fromDate(new Date('2025-08-01T00:00:00Z')) // August 1, 2025
  const to = Timestamp.fromDate(new Date('2025-08-30T23:59:59Z')) // August 30, 2025
  
  // Pagination for filtered results
  const [currentPage, setCurrentPage] = useState(1);

  // Create provider document references
  const providerRefs = useMemo(() => {
    return PROVIDER_IDS.map(id => doc(db, "customer", id));
  }, [db]);

  // ----- Fetch All Data Initially -----
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError("");
      
      try {
        // Fetch all bookings for the specified providers
        const allBookingsQuery = query(
          collection(db, "bookings"),
          where("provider_id", "in", providerRefs),
          // where("booking_date", ">=", from),
          // where("booking_date", "<=", to),
          orderBy("booking_date", "desc")
        );

        const snapshot = await getDocs(allBookingsQuery);
        const docs: BookingDoc[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any)
        }));
        
        setAllBookings(docs);
        await hydrateParties(docs);
        await hydrateServices(docs);
        
      } catch (e: any) {
        setError(e.message ?? "Failed to load bookings.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [db, providerRefs]);

  // ----- Real-time updates for new bookings -----
  useEffect(() => {
    if (allBookings.length === 0) return;

    // Set up real-time listener for new bookings
    const realtimeQuery = query(
      collection(db, "bookings"),
      where("provider_id", "in", providerRefs),
      orderBy("booking_date", "desc"),
      limit(5) // Only listen for recent bookings
    );

    const unsub = onSnapshot(realtimeQuery, async (snapshot) => {
      const newDocs: BookingDoc[] = [];
      
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const doc = { id: change.doc.id, ...(change.doc.data() as any) };
          // Check if this booking is not already in our list
          if (!allBookings.some(booking => booking.id === doc.id)) {
            newDocs.push(doc);
          }
        }
      });

      if (newDocs.length > 0) {
        setAllBookings(prev => {
          // Add new bookings and sort by date
          const combined = [...newDocs, ...prev];
          return combined.sort((a, b) => {
            const dateA = a.date?.toDate?.() || new Date(0);
            const dateB = b.date?.toDate?.() || new Date(0);
            return dateB.getTime() - dateA.getTime();
          });
        });
        
        // Hydrate data for new bookings
        await hydrateParties(newDocs);
        await hydrateServices(newDocs);
      }
    });

    return () => unsub();
  }, [db, providerRefs, allBookings.length]);

  // ----- Hydrate Customer and Provider Data -----
  const hydrateParties = async (docs: BookingDoc[]) => {
    const custRefs: (DocumentReference<DocumentData> | undefined)[] = [];
    const provRefs: (DocumentReference<DocumentData> | undefined)[] = [];
    docs.forEach((d) => {
      if (d.customer_id) custRefs.push(d.customer_id);
      if (d.provider_id) provRefs.push(d.provider_id);
    });

    const uniqueByPath = <T extends DocumentReference<DocumentData> | undefined>(arr: T[]) => {
      const m = new Map<string, T>();
      arr.forEach((r) => {
        if (r) m.set(r.path, r);
      });
      return Array.from(m.values()).filter(Boolean) as DocumentReference<DocumentData>[];
    };

    const uniqueCust = uniqueByPath(custRefs);
    const uniqueProv = uniqueByPath(provRefs);

    const [custSnaps, provSnaps] = await Promise.all([
      Promise.all(uniqueCust.map((r) => getDoc(r))),
      Promise.all(uniqueProv.map((r) => getDoc(r))),
    ]);

    setCustomerMap(prev => {
      const newCust = { ...prev };
      custSnaps.forEach((s) => {
        const d = s.data() as any;
        newCust[s.ref.path] = {
          name: d?.customer_name ?? d?.display_name ?? "",
          phone: d?.phone_number ?? (d?.contact_no ? String(d.contact_no) : ""),
        };
      });
      return newCust;
    });

    setProviderMap(prev => {
      const newProv = { ...prev };
      provSnaps.forEach((s) => {
        const d = s.data() as any;
        newProv[s.ref.path] = {
          name: d?.customer_name ?? d?.display_name ?? "",
          phone: d?.phone_number ?? (d?.contact_no ? String(d.contact_no) : ""),
        };
      });
      return newProv;
    });
  };

  // ----- Hydrate Services from Cart Collection -----
  const hydrateServices = async (docs: BookingDoc[]) => {
    const serviceIds = docs
      .map(d => d.subCategoryCart_id)
      .filter(Boolean) as string[];

    if (serviceIds.length === 0) return;

    try {
      const uniqueServiceIds = Array.from(new Set(serviceIds));
      const newServicesData: Record<string, CartService[]> = {};

      await Promise.all(
        uniqueServiceIds.map(async (serviceId) => {
          try {
            // Create reference to the sub_categoryCart document
            const subCategoryCartRef = doc(db, "sub_categoryCart", serviceId);
            
            // Query cart collection where subCategoryCartId matches the reference
            const cartQuery = query(
              collection(db, "cart"),
              where("subCategoryCartId", "==", subCategoryCartRef)
            );
            
            const cartSnapshot = await getDocs(cartQuery);
            const cartServices: CartService[] = cartSnapshot.docs.map(cartDoc => ({
              id: cartDoc.id,
              serviceName: cartDoc.data().service_name,
              subCategoryCartId: cartDoc.data().subCategoryCartId
            }));
            
            newServicesData[serviceId] = cartServices;
          } catch (error) {
            console.warn(`Failed to fetch services for ${serviceId}:`, error);
            newServicesData[serviceId] = [];
          }
        })
      );

      setServicesMap(prev => ({ ...prev, ...newServicesData }));
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  // ----- Helper Functions -----
  const normalize = (v: unknown) => (v ?? "").toString().toLowerCase();
const displayDate = (b: BookingDoc): Date | null => {
  const t = b.date; // Use the `date` field instead of `booking_date`
  return t?.toDate ? t.toDate() : null;
};
const displayTimeSlot = (b: BookingDoc): Date | null => {
  const timeSlot = b.timeSlot; // Use the `timeSlot` field
  return timeSlot ? timeSlot.toDate() : null;
};
  const getServicesForBooking = (booking: BookingDoc): CartService[] => {
    if (!booking.subCategoryCart_id) return [];
    return servicesMap[booking.subCategoryCart_id] || [];
  };

  // ----- Filter and Search Logic -----
  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    
    return allBookings.filter((b) => {
      const services = getServicesForBooking(b);
      const serviceNames = services.map(s => s.serviceName).join(" ");
      
      const text = [
        b.id,
        customerMap[b.customer_id?.path ?? ""]?.name,
        providerMap[b.provider_id?.path ?? ""]?.name,
        customerMap[b.customer_id?.path ?? ""]?.phone,
        providerMap[b.provider_id?.path ?? ""]?.phone,
        b.subCategoryCart_id,
        b.package_id,
        b.status,
        serviceNames,
        b.bookingAddress,
        b.city,
      ]
        .map(normalize)
        .join(" ");

      const matchesSearch = !term || text.includes(term);
      const matchesStatus = statusFilter === "all" || normalize(b.status) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allBookings, searchTerm, statusFilter, customerMap, providerMap, servicesMap]);

  // ----- Pagination for filtered results -----
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return filteredBookings.slice(startIndex, endIndex);
  }, [filteredBookings, currentPage]);

  const totalPages = Math.ceil(filteredBookings.length / PAGE_SIZE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // ----- Reset pagination when search/filter changes -----
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // ----- Pagination handlers -----
  const goNext = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goPrev = () => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // ---------- Render UI ----------
  const fmtDate = (d: Date | null) => (d ? `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} ${d.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true })}` : "—");
  const amountPaid = (b: BookingDoc) => (typeof b.amount_paid === "number" ? b.amount_paid : 0);
  const inferredPaymentStatus = (b: BookingDoc) => (amountPaid(b) > 0 ? "paid" : "pending");

  const statusColors: Record<string, string> = {
    pending: "bg-orange-100 text-orange-800 hover:bg-orange-200",
    confirmed: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    accepted: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    "in-progress": "bg-purple-100 text-purple-800 hover:bg-purple-200",
    completed: "bg-green-100 text-green-800 hover:bg-green-200",
    cancelled: "bg-red-100 text-red-800 hover:bg-red-200",
    rescheduled: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    default: "bg-gray-100 text-gray-800",
  };

  const paymentStatusColors: Record<string, string> = {
    pending: "bg-orange-100 text-orange-800",
    paid: "bg-green-100 text-green-800",
    refunded: "bg-gray-100 text-gray-800",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Booking Management (Filtered)
        </CardTitle>
        <CardDescription>
          Manage and monitor bookings for specific providers ({PROVIDER_IDS.length} providers)
          - {filteredBookings.length} total bookings
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex flex-1 items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings, customers, services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results info */}
        {(searchTerm || statusFilter !== "all") && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredBookings.length} results
            {searchTerm && ` for "${searchTerm}"`}
            {statusFilter !== "all" && ` with status "${statusFilter}"`}
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Time Slot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10}>
                    <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading bookings…
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={10}>
                    <div className="p-4 text-sm text-red-600">{error}</div>
                  </TableCell>
                </TableRow>
              ) : paginatedBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    {filteredBookings.length === 0 ? (
                      searchTerm || statusFilter !== "all" ?
                        "No bookings found matching your criteria." :
                        "No bookings found."
                    ) : (
                      "No more results on this page."
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBookings.map((b) => {
                  const cust = customerMap[b.customer_id?.path ?? ""] ?? {};
                  const prov = providerMap[b.provider_id?.path ?? ""] ?? {};
                  const services = getServicesForBooking(b);
                  const d = displayDate(b);

                  return (
                    <TableRow key={b.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{b.id}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{cust.name || "—"}</div>
                          {cust.phone && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="h-3 w-3 mr-1" />
                              {cust.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {services.length > 0 ? (
                          <div className="space-y-1">
                            {services.map((service, index) => (
                              <div key={service.id} className="text-xs text-muted-foreground">
                                {service.serviceName}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{prov.name || "—"}</TableCell>
                      <TableCell>{fmtDate(displayDate(b))}</TableCell>
                      <TableCell>{fmtDate(displayTimeSlot(b))}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[b.status ?? ""] || statusColors.default}>
                          {(b.status ?? "—").replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>₹{amountPaid(b).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={paymentStatusColors[inferredPaymentStatus(b)]}>
                          {inferredPaymentStatus(b)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{b.bookingAddress || "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages || 1} 
            {filteredBookings.length > 0 && (
              <span className="ml-2">
                ({((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, filteredBookings.length)} of {filteredBookings.length})
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goPrev} disabled={!hasPrevPage || loading}>
              Prev
            </Button>
            <Button variant="outline" size="sm" onClick={goNext} disabled={!hasNextPage || loading}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}