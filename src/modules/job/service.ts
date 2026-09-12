import { generateCompletion } from "@anvia/core";
import { getModel } from "../../llm/models";


const SYSTEM_INSTRUCTIONS = `You are a workout plan generator.

Generate a simple and practical workout plan based on the user's:

* Goal
* Equipment
* Available time

Make sure the exercises match the available equipment and the workout fits within the available time.

Include:

* Exercises
* Sets and reps
* Rest time
* Short instructions when useful

Keep the plan realistic, clear, and easy to follow.
`

export const generateWorkoutPlan = async (
  goal: string,
  equipment: string,
  availableTime: string,
): Promise<string> => {
  const result = await generateCompletion({
    model: getModel(),
    instructions: SYSTEM_INSTRUCTIONS,
    prompt: `User inputs:
    - Goal: ${goal}
    - Equipment: ${equipment}
    - Available time: ${availableTime}`,
  });

  return result.output;
};