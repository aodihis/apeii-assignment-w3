import { Worker } from "bullmq";
import { QUEUE_NAME, workerConnection } from "./config";
import { db } from "../utils/db";
import { generateWorkoutPlan } from "../modules/job/service";

export const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const workoutJobId = job.data.id;
    if (!workoutJobId) {
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
      throw new Error(`Job with ID ${workoutJobId} not found`);
    }

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
  },
  {
    connection: workerConnection,
  },
);
