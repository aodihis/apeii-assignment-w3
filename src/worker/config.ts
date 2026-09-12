import "dotenv/config";


export const QUEUE_NAME = "study-guide-generation-queue";

export const workerConnection = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
};
