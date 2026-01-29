"use server";

import * as z from "zod";
import type { TripPlan } from "@/lib/types";
import { aiTripPlanner, AiTripPlannerOutput } from "@/ai/ai-trip-planner";

const formSchema = z.object({
  start: z.string().min(3, { message: "Please enter a valid starting location." }),
  destination: z.string().min(3, { message: "Please enter a valid destination." }),
  notes: z.string().optional(),
});

type PlanTripResult = {
  success: boolean;
  data?: TripPlan;
  error?: string;
};

function formatGoogleMapsUrl(start: string, destination: string, waypoints: string[]): string {
  const baseUrl = "https://www.google.com/maps/dir/";
  const searchParams = new URLSearchParams();
  searchParams.append("api", "1");
  searchParams.append("origin", start);
  searchParams.append("destination", destination);
  if (waypoints.length > 0) {
    searchParams.append("waypoints", waypoints.join("|"));
  }
  searchParams.append("travelmode", "transit");
  return `${baseUrl}?${searchParams.toString()}`;
}

export async function planTripAction(values: z.infer<typeof formSchema>): Promise<PlanTripResult> {
  const validatedFields = formSchema.safeParse(values);

  if (!validatedFields.success) {
    return { success: false, error: "Invalid input." };
  }

  try {
    const { start, destination, notes } = validatedFields.data;
    const plan: AiTripPlannerOutput = await aiTripPlanner({
      startLocation: start,
      destination: destination,
      notes: notes,
    });

    const waypoints = plan.steps?.slice(1, -1).map(step => step.locationName).filter(Boolean) || [];

    const debugPrompt = `You are an expert AI trip planner for a public bus system. Your goal is to provide the most efficient and clear route from a start location to a destination, taking into account user preferences.

  Starting Location: ${start}
  Destination: ${destination}
  User Preferences: ${notes || ""}`;

    const tripPlan: TripPlan = {
      summary: plan.summary,
      totalTime: plan.eta,
      estimatedCost: plan.estimatedCost,
      mapsUrl: formatGoogleMapsUrl(start, destination, waypoints),
      debugPrompt: debugPrompt,
      steps: plan.steps.map((step) => {
        return {
          instruction: step.instruction,
          departureTime: step.schedule,
          arrivalTime: step.arrivalTime,
          description: step.description,
          landmark: step.landmark,
          busNumber: step.instruction.match(/bus (\w+)/i)?.[1] || undefined,
        }
      })
    };

    return { success: true, data: tripPlan };
  } catch (e: any) {
    console.error(e);
    const msg = typeof e?.message === "string" ? e.message : "";
    const isRateLimit =
      msg.includes("429") ||
      msg.toLowerCase().includes("too many requests") ||
      msg.toLowerCase().includes("quota exceeded") ||
      msg.toLowerCase().includes("rate limit");

    if (isRateLimit) {
      return {
        success: false,
        error:
          "Gemini API rate limit reached (quota exceeded). Please wait ~30–60 seconds and try again, or enable billing/increase quota in Google AI Studio.",
      };
    }

    return { success: false, error: "Failed to generate trip plan. " + msg };
  }
}
