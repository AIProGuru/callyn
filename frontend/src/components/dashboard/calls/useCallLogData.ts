import { useMemo } from "react";
import { CallRecord, CallLogStats } from "./types";
import { useRealCallData } from "./useRealCallData";

export const useCallLogData = () => {
  const { data: rawCalls = [], isLoading, error } = useRealCallData();
  console.log("RawCalls", rawCalls);
  const calls: CallRecord[] = useMemo(
    () =>
      rawCalls.map((call) => {
        // Parse duration from string format (e.g., "2:30" to seconds)
        const durationInSeconds = Math.floor(
          (new Date(call.endedAt).getTime() -
            new Date(call.startedAt).getTime()) /
            1000
        );

        const outcome =
          call.analysis?.successEvaluation?.toString() ?? "unknown";

        return {
          id: call.id,
          timestamp: call.startedAt,
          contactName: call.customer?.name ?? "Unknown",
          contactPhone: call.customer?.number ?? "Unknown",
          contactCompany: undefined,
          duration: durationInSeconds,
          outcome: outcome,
          campaign: undefined, // Not available in mock data
          agent: call.assistantId ?? "Unknown",
          cost: call.cost ?? 0,
          recording: call.recordingUrl,
          transcript: call.transcript,
          notes: call.summary,
          tags: [], // Not available in mock data
          leadScore: Math.floor(Math.random() * 100),
          followUpDate:
            call.outcome === "booked"
              ? new Date(Date.now() + 86400000).toISOString()
              : undefined,
          sentiment:
            call.outcome === "booked" || call.outcome === "interested"
              ? "positive"
              : call.outcome === "not-interested"
              ? "negative"
              : "neutral",
        };
      }),
    [rawCalls]
  );

  return calls;
};

export const useCallLogStats = (filteredCalls: CallRecord[]): CallLogStats => {
  return useMemo(() => {
    const total = filteredCalls.length;
    const answered = filteredCalls.filter(
      (c) => c.outcome === "answered"
    ).length;
    const booked = filteredCalls.filter((c) => c.outcome === "booked").length;
    const totalDuration = filteredCalls.reduce((sum, c) => sum + c.duration, 0);
    const totalCost = filteredCalls.reduce((sum, c) => sum + c.cost, 0);
    const avgDuration = total > 0 ? totalDuration / total : 0;
    const bookingRate = total > 0 ? (booked / total) * 100 : 0;

    return {
      total,
      answered,
      booked,
      totalDuration,
      totalCost,
      avgDuration,
      bookingRate,
    };
  }, [filteredCalls]);
};
