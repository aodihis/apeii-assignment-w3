import { generateCompletion } from "@anvia/core/completion";
import { getModel } from "../../llm/models";

export async function generateWorkoutPlan(
  goal: string,
  equipment: string,
  availableTime: string,
): Promise<string> {
  const result = await generateCompletion({
    model: getModel(),
    prompt: `Create a workout plan for the following user requirements:
- Goal: ${goal}
- Equipment: ${equipment}
- Available time: ${availableTime}

Return a clear, practical workout plan.`,
  });

  return result.output;
}
