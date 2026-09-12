import { Worker } from "bullmq";
import { QUEUE_NAME, workerConnection } from "./config";
import { db } from "../utils/db";
import { generateStudyGuide } from "../modules/job/service";
import { errorMessage, logger } from "../utils/logger";

export const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const studyGuideJobId = job.data.id;
    logger.debug("Queue job received", {
      queueJobId: job.id,
      jobId: studyGuideJobId,
    });

    if (!studyGuideJobId) {
      logger.error("Queue job is missing a study guide job ID", {
        queueJobId: job.id,
      });
      throw new Error("Job ID is missing");
    }

    const studyGuideJob = await db.orm.public.Job.where((job) =>
      job.id.eq(studyGuideJobId),
    ).first();

    if (
      !studyGuideJob?.subject ||
      !studyGuideJob?.topic ||
      !studyGuideJob?.level ||
      !studyGuideJob?.availableTime
    ) {
      logger.error("Study guide job could not be found or is incomplete", {
        jobId: studyGuideJobId,
      });
      throw new Error(`Job with ID ${studyGuideJobId} not found`);
    }

    try {
      logger.info("Study guide generation started", { jobId: studyGuideJobId });
      const studyGuide = await generateStudyGuide(
        studyGuideJob.subject,
        studyGuideJob.topic,
        studyGuideJob.level,
        studyGuideJob.availableTime,
      );

      await db.orm.public.JobResult.create({
        jobId: studyGuideJob.id,
        guide: studyGuide,
      });
      await db.orm.public.Job.where((job) => job.id.eq(studyGuideJobId)).update({
        status: "completed",
      });
      logger.info("Study guide generation completed", { jobId: studyGuideJobId });
    } catch (error) {
      await db.orm.public.Job.where((job) => job.id.eq(studyGuideJobId)).update({
        status: "failed",
      });
      logger.error("Study guide generation failed", {
        jobId: studyGuideJobId,
        error: errorMessage(error),
      });
      throw error;
    }
  },
  {
    connection: workerConnection,
  },
);

worker.on("failed", (job, error) => {
  logger.error("Queue job failed", {
    queueJobId: job?.id,
    jobId: job?.data?.id,
    error: errorMessage(error),
  });
});

worker.on("error", (error) => {
  logger.error("Worker emitted an error", { error: errorMessage(error) });
});
