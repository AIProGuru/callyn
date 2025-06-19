import { useState, useMemo, useEffect } from "react";
import { mockCallData } from "./calls/mockCallData";
import { filterAndSortCalls, calculateStats } from "./calls/callUtils";
import CallsStatsBar from "./calls/CallsStatsBar";
import CallsFilterBar from "./calls/CallsFilterBar";
import CallLogTable from "./calls/CallLogTable";
import ObjectionInsights from "./calls/ObjectionInsights";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CallRecord } from "./calls/types";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const DashboardCallsAndActivity = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("bookedFirst"); // Default to booked first
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCalls() {
      try {
        const userString = localStorage.getItem("user");
        if (!userString) {
          throw new Error("No user found in localStorage.");
        }
        const user = JSON.parse(userString);
        const user_id = user?.email;
        if (!user_id) {
          throw new Error("User ID is missing.");
        }
        const res = await fetch(
          `${SERVER_URL}/api/calls?user_id=${encodeURIComponent(user_id)}`
        );
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log("calls", data);
        setCalls(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchCalls();
  }, []);

  // if (loading) return <p>Loading calls...</p>;
  // if (error) return <p>Error loading calls: {error}</p>;

  // Apply filters and sort
  const filteredCalls = useMemo(
    () =>
      filterAndSortCalls(
        calls,
        searchTerm,
        outcomeFilter,
        timeFilter,
        sortOrder
      ),
    [calls, searchTerm, outcomeFilter, timeFilter, sortOrder]
  );

  // Convert filtered calls to CallRecord format for CallLogTable
  const callRecords: CallRecord[] = useMemo(
    () =>
      filteredCalls.map((call) => {
        const durationInSeconds = Math.floor(
          (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000
        );
  
        const outcome = call.analysis?.successEvaluation?.toString() ?? "unknown";
  
        return {
          id: call.id,
          timestamp: call.startedAt,
          contactName: call.customer?.name ?? "Unknown",
          contactPhone: call.customer?.number ?? "Unknown",
          contactCompany: undefined,
          duration: durationInSeconds,
          outcome: outcome,
          campaign: undefined,
          agent: call.assistantId ?? "Unknown",
          cost: call.cost ?? 0,
          recording: call.recordingUrl,
          transcript: call.transcript,
          notes: call.summary,
          tags: [],
          leadScore: Math.floor(Math.random() * 100),
          followUpDate:
            outcome === "booked"
              ? new Date(Date.now() + 86400000).toISOString()
              : undefined,
          sentiment:
            outcome === "booked" || outcome === "interested"
              ? "positive"
              : outcome === "not-interested"
              ? "negative"
              : "neutral",
        };
      }),
    [filteredCalls]
  );

  // Calculate stats for insights widget
  const stats = useMemo(() => calculateStats(filteredCalls), [filteredCalls]);

  const handleCallClick = (call: CallRecord) => {
    setSelectedCall(call);
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <p>Loading calls...</p>
      ) : error ? (
        <p>Error loading calls: {error}</p>
      ) : (
        <>
          {/* Quick Stats Bar */}
          <CallsStatsBar filteredCalls={filteredCalls} />

          {/* Filter + Search Bar */}
          <CallsFilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            outcomeFilter={outcomeFilter}
            setOutcomeFilter={setOutcomeFilter}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Call Log Table */}
            <div className="lg:col-span-3">
              <CallLogTable calls={callRecords} onCallClick={handleCallClick} />
            </div>

            {/* Objection Intelligence Widget */}
            <div className="lg:col-span-1">
              <ObjectionInsights
                topObjection={stats.topObjection}
                objectionPercentage={stats.objectionPercentage}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardCallsAndActivity;
