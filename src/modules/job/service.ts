import { generateCompletion } from "@anvia/core";
import { getModel } from "../../llm/models";
import { logger } from "../../utils/logger";


const SYSTEM_INSTRUCTIONS = `You are a study guide generator.

Generate a simple and practical study guide based on the user's:

* Subject
* Topic
* Level
* Available time

Make sure the guide is appropriate for the learner's level and fits within the available time.

Include:

* Learning objectives
* A clear sequence of concepts to study
* Explanations and examples when useful
* Practice questions or activities
* A short review checklist

Keep the guide realistic, clear, and easy to follow.
`;

export const generateStudyGuide = async (
  subject: string,
  topic: string,
  level: string,
  availableTime: string,
): Promise<string> => {
  logger.debug("Requesting study guide completion");
  const result = await generateCompletion({
    model: getModel(),
    instructions: SYSTEM_INSTRUCTIONS,
    prompt: `Learner inputs:
    - Subject: ${subject}
    - Topic: ${topic}
    - Level: ${level}
    - Available time: ${availableTime}`,
  });

  logger.debug("Study guide completion received");
  return result.output;
};
