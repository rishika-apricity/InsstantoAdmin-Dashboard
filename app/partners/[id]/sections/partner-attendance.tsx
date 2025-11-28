"use client";

import React, { useEffect, useState } from "react";

interface AttendanceRecord {
  Id: number;
  name: string;
  mobileNo: string;
  assignedWards: string;
  wardName: string;
  zoneName: string;
  attendanceDate: string;
  InTime: string;
  OutTime: string | null;
}

interface Props {
  partnerName?: string;
  startDate?: string; // e.g. "2025-11-03"
  endDate?: string;   // e.g. "2025-11-06"
}

const PartnerAttendance: React.FC<Props> = ({
  partnerName = "Vishal Bodre",
  startDate,
  endDate,
}) => {
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // default: last 7 days if no range passed
  const today = new Date();
  const defaultEnd = today.toISOString().split("T")[0];
  const defaultStart = new Date(today.setDate(today.getDate() - 7))
    .toISOString()
    .split("T")[0];

  const start = startDate || defaultStart;
  const end = endDate || defaultEnd;

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://103.39.132.76:5000/api/insstanto-attendance?start=${start}&end=${end}`,
          { cache: "no-store" }
        );

        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

        const json = await res.json();

        // Filter by partner name
        const records = json.data.filter(
          (r: AttendanceRecord) =>
            r.name.toLowerCase() === partnerName.toLowerCase()
        );

        if (records.length > 0) setAttendanceList(records);
        else setError("No attendance records found for this date range.");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [partnerName, start, end]);

  if (loading)
    return <p className="p-6 text-gray-500 text-center">Loading attendance...</p>;

  if (error)
    return (
      <div className="p-6 text-red-600 bg-red-50 border border-red-200 rounded-md">
        ⚠️ {error}
      </div>
    );

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Attendance for {partnerName}
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Showing data from <strong>{start}</strong> to <strong>{end}</strong>
      </p>

      {attendanceList.map((att, index) => (
        <div
          key={index}
          className="p-4 mb-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Date</p>
              <p className="font-medium">
                {new Date(att.attendanceDate).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Check-In</p>
              <p className="font-medium">
                {new Date(att.InTime).toLocaleTimeString()}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Check-Out</p>
              <p className="font-medium">
                {att.OutTime
                  ? new Date(att.OutTime).toLocaleTimeString()
                  : "Not yet checked out"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
};

export default PartnerAttendance;