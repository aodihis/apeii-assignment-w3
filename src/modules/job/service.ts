import { studyGuidePipeline } from "./pipeline";
import { logger } from "../../utils/logger";

export const generateStudyGuide = async (
  subject: string,
  topic: string,
  level: string,
  availableTime: string,
): Promise<string> => {
  logger.debug("Starting study guide pipeline");
  const result = await studyGuidePipeline.run({
    input: {
      subject,
      topic,
      level,
      availableTime,
    }
  });

  logger.debug("Study guide pipeline completed");
  return result.output.guide;
};
