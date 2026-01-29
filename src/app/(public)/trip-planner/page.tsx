import { TripPlanner } from "@/components/TripPlanner";

export default function TripPlannerPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">AI Trip Planner</h1>
        <p className="text-muted-foreground">
          Let our AI find the smartest, fastest route for your journey.
        </p>
      </div>
      <TripPlanner />
    </div>
  );
}
