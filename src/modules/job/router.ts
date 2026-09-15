import { Hono } from "hono";
import { db } from "../../utils/db";
import { zValidator } from "@hono/zod-validator";
import { CreateStudyGuideSchema } from "./schema";
import { queue } from "../../worker/queue";
import { logger } from "../../utils/logger";


export const jobRouter = new Hono()
    .get('/', async (c) => {
        const jobs = await db.orm.public.Job.all();
        const jobsWithResults = await Promise.all(jobs.map(async (job) => ({
            ...job,
            result: job.status === "completed"
                ? await db.orm.public.JobResult.where((result) =>
                    result.jobId.eq(job.id)).first()
                : null,
        })));

        return c.json(jobsWithResults)
    })
    .get('/:id', async (c) => {
        const { id } = c.req.param();
        const job = await db.orm.public.Job.where((job) =>
            job.id.eq(id)).first();

        if (!job) {
            logger.warn("Job lookup returned no result", { jobId: id });
            return c.json({ message: "Job not found" }, 404);
        }
        
        const result = job.status === "completed"
            ? await db.orm.public.JobResult.where((jr) =>
                jr.jobId.eq(id)).first()
            : null;

        return c.json({
            ...job,
            result: result ?? null,
        })
    })
    .post('/', zValidator("json", CreateStudyGuideSchema), async (c) => {
        const body = c.req.valid('json');

        logger.debug("Creating study guide job", {
            subject: body.subject,
            topic: body.topic,
            level: body.level,
            availableTime: body.availableTime,
        });

        const newJob = await db.orm.public.Job.create({
            subject: body.subject,
            topic: body.topic,
            level: body.level,
            availableTime: body.availableTime
        });

        await queue.add("generate-study-guide", {id: newJob.id});
        logger.info("Study guide job queued", { jobId: newJob.id });
        return c.json({ jobId: newJob.id, status: newJob.status }, 202)
    })
