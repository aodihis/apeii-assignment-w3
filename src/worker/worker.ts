import { Worker } from "bullmq";
import { QUEUE_NAME, workerConnection } from "./config";
import { db } from "../utils/db";
import { generateWorkoutPlan } from "../modules/job/service";
import { errorMessage, logger } from "../utils/logger";

export const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const workoutJobId = job.data.id;
    logger.debug("Queue job received", {
      queueJobId: job.id,
      jobId: workoutJobId,
    });

    if (!workoutJobId) {
      logger.error("Queue job is missing a workout job ID", {
        queueJobId: job.id,
      });
      throw new Error("Job ID is missing");
    }

    const workoutJob = await db.orm.public.Job.where((job) =>
      job.id.eq(workoutJobId),
    ).first();

    if (
      !workoutJob?.goal ||
      !workoutJob?.equipment ||
      !workoutJob?.availableTime
    ) {
      logger.error("Workout job could not be found or is incomplete", {
        jobId: workoutJobId,
      });
      throw new Error(`Job with ID ${workoutJobId} not found`);
    }

    try {
      logger.info("Workout plan generation started", { jobId: workoutJobId });
      const workoutPlan = await generateWorkoutPlan(
        workoutJob.goal,
        workoutJob.equipment,
        workoutJob.availableTime,
      );

      await db.orm.public.JobResult.create({
        jobId: workoutJob.id,
        plan: workoutPlan,
      });
      await db.orm.public.Job.where((job) => job.id.eq(workoutJobId)).update({
        status: "completed",
      });
      logger.info("Workout plan generation completed", { jobId: workoutJobId });
    } catch (error) {
      await db.orm.public.Job.where((job) => job.id.eq(workoutJobId)).update({
        status: "failed",
      });
      logger.error("Workout plan generation failed", {
        jobId: workoutJobId,
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
