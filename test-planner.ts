import { aiTripPlanner } from './src/ai/ai-trip-planner';
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

async function test() {
  console.log("Starting AI Trip Planner test...");
  try {
    const result = await aiTripPlanner({
      startLocation: "Central Station",
      destination: "Airport Terminal 1",
      notes: "Avoid multiple transfers"
    });
    console.log("SUCCESS!");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("FAILED!");
    console.error(error);
  }
}

test();
