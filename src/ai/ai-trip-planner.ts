'use server';

/**
 * @fileOverview AI trip planner flow to suggest optimal bus routes and schedules.
 *
 * - aiTripPlanner - A function that handles the trip planning process.
 * - AiTripPlannerInput - The input type for the aiTripPlanner function.
 * - AiTripPlannerOutput - The return type for the aiTripPlanner function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRateLimitError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : JSON.stringify(err);
  return (
    msg.includes('429') ||
    msg.toLowerCase().includes('too many requests') ||
    msg.toLowerCase().includes('quota exceeded') ||
    msg.toLowerCase().includes('rate limit')
  );
}

async function withRateLimitRetry<T>(fn: () => Promise<T>): Promise<T> {
  // Free-tier Gemini APIs can be quite strict; keep retries small and quick.
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (!isRateLimitError(e) || attempt === maxAttempts) throw e;
      const backoffMs = Math.round(1500 * Math.pow(2, attempt - 1)); // 1.5s, 3s, 6s
      await sleep(backoffMs);
    }
  }
  // Unreachable, but TS likes a return.
  throw new Error('Rate limit retry failed unexpectedly.');
}

const AiTripPlannerInputSchema = z.object({
  startLocation: z.string().describe('The starting location of the trip.'),
  destination: z.string().describe('The destination of the trip.'),
  notes: z.string().optional().describe('Additional preferences or notes from the user for planning the trip (e.g., "avoid transfers", "prefer scenic route").'),
});

export type AiTripPlannerInput = z.infer<typeof AiTripPlannerInputSchema>;

const AiTripPlannerOutputSchema = z.object({
  summary: z.string().describe('A brief, one or two-sentence summary of the overall trip.'),
  steps: z.array(z.object({
    instruction: z.string().describe('The main instruction for this step (e.g., "Take Bus 502").'),
    schedule: z.string().describe('The departure time or duration for this step.'),
    arrivalTime: z.string().optional().describe('The estimated arrival time at the destination of this step.'),
    locationName: z.string().describe('The name of the location for this step.'),
    description: z.string().describe('A clear, detailed description of what to do or expect at this step.'),
    landmark: z.string().optional().describe('A notable landmark to look for at this location.'),
  })).describe('A detailed list of steps for the trip.'),
  eta: z.string().describe('The total estimated time of arrival for the trip (e.g., "25 minutes").'),
  estimatedCost: z.string().describe('The estimated total cost of the trip (e.g., "₹45.00").'),
});

export type AiTripPlannerOutput = z.infer<typeof AiTripPlannerOutputSchema>;

export async function aiTripPlanner(input: AiTripPlannerInput): Promise<AiTripPlannerOutput> {
  return aiTripPlannerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiTripPlannerPrompt',
  input: { schema: AiTripPlannerInputSchema },
  output: { schema: AiTripPlannerOutputSchema },
  prompt: `You are an expert AI trip planner for a public bus system. Your goal is to provide the most efficient and clear route from a start location to a destination, taking into account user preferences.

  Starting Location: {{{startLocation}}}
  Destination: {{{destination}}}
  User Preferences: {{{notes}}}

  OUTPUT INSTRUCTIONS:
  - YOU MUST RETURN ONLY A VALID JSON OBJECT.
  - DO NOT INCLUDE ANY CONVERSATIONAL TEXT OR MARKDOWN TRIPLE BACKTICKS.
  - USE ONLY ENGLISH CHARACTERS.

  The plan should include:
  1. A short summary of the trip.
  2. A detailed 'steps' array. Each step MUST have:
     - instruction: The main action (e.g. "Take Bus 502").
     - schedule: The departure time or start time. ALWAYS INCLUDE AM/PM (e.g. "10:30 AM").
     - arrivalTime: (For transit) The time it reaches the next stop. ALWAYS INCLUDE AM/PM (e.g. "11:00 AM").
     - locationName: The name of the transit point or stop.
     - description: A clear, helpful description of the step.
     - landmark: (Optional) A recognizable building or sign nearby.
  3. Total estimated travel time (eta).
  4. Total estimated cost (estimatedCost) in local currency (e.g. ₹60).

  Example JSON format:
  {
    "summary": "A smooth 40-minute journey via the North Line.",
    "steps": [
      {
        "instruction": "Take Bus 502",
        "schedule": "10:30 AM",
        "arrivalTime": "10:55 AM",
        "locationName": "Central Hub",
        "description": "Board the bus at Platform 4.",
        "landmark": "Clock Tower"
      }
    ],
    "eta": "40 minutes",
    "estimatedCost": "₹40.00"
  }
  `,
});

const aiTripPlannerFlow = ai.defineFlow(
  {
    name: 'aiTripPlannerFlow',
    inputSchema: AiTripPlannerInputSchema,
    outputSchema: AiTripPlannerOutputSchema,
  },
  async input => {
    // Generate content using the prompt which now has access to the tool
    const { output } = await withRateLimitRetry(() => prompt(input));
    return output!;
  }
);
