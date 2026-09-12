import { generateCompletion } from "@anvia/core";
import { Pipeline } from "@anvia/core/pipeline";
import z from "zod";
import { getModel } from "../../llm/models";

const ANALYZE_REQUEST_INSTRUCTIONS = `
You are an educational needs analyzer.
Analyze the learner's request and identify realistic learning objectives and
the key concepts required to understand the requested topic.
`;

const CREATE_OUTLINE_INSTRUCTIONS = `
You are a study-planning expert.
Create a practical study outline for the learner.
Use the available time and level to decide how many sections are appropriate.
Return sections with a title, concepts, and estimated minutes.
`;

const WRITE_AND_REVIEW_GUIDE_INSTRUCTIONS = `
You are an expert teacher and educational editor.
Write the final study guide in clear Markdown.

Include:
- learning objectives
- explanations for each section
- examples where useful
- practice questions or activities
- a short review checklist

Keep it suitable for the learner's level and available time.
`;

const StudyGuideInputSchema = z.object({
  subject: z.string(),
  topic: z.string(),
  level: z.string(),
  availableTime: z.string(),
});

const AnalysisSchema = z.object({
  learningObjectives: z.array(z.string()),
  keyConcepts: z.array(z.string()),
});

const OutlineSchema = z.object({
  sections: z.array(
    z.object({
      title: z.string(),
      concepts: z.array(z.string()),
      estimatedMinutes: z.number(),
    }),
  ),
});

export const studyGuidePipeline = new Pipeline({
  id: "study-guide-generation",
  inputSchema: StudyGuideInputSchema,
})
  .step({
    id: "analyze-request",
    run: async (context) => {
      const response = await generateCompletion({
        model: getModel(),
        instructions: ANALYZE_REQUEST_INSTRUCTIONS,
        prompt: JSON.stringify(context.input),
        outputSchema: AnalysisSchema,
      });

      return {
        ...context.input,
        analysis: response.output,
      };
    },
  })
  .step({
    id: "create-outline",
    run: async (context) => {
      const { subject, topic, level, availableTime, analysis } = context.input;

      const response = await generateCompletion({
        model: getModel(),
        instructions: CREATE_OUTLINE_INSTRUCTIONS,
        prompt: JSON.stringify({
          subject,
          topic,
          level,
          availableTime,
          analysis,
        }),
        outputSchema: OutlineSchema,
      });

      return {
        ...context.input,
        outline: response.output,
      };
    },
  })
  .step({
    id: "write-and-review-guide",
    run: async (context) => {
      const {
        subject,
        topic,
        level,
        availableTime,
        analysis,
        outline,
      } = context.input;

      const response = await generateCompletion({
        model: getModel(),
        instructions: WRITE_AND_REVIEW_GUIDE_INSTRUCTIONS,
        prompt: JSON.stringify({
          subject,
          topic,
          level,
          availableTime,
          analysis,
          outline,
        }),
      });

      return { guide: response.output };
    },
  });
