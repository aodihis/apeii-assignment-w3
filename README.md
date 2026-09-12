# Study Guide Generator API

An asynchronous Hono API that generates study guides with a three-step AI pipeline.
The API accepts a study-guide request, stores it in PostgreSQL, and queues the
generation work in BullMQ. A separate worker calls the anvia.dev-compatible LLM
endpoint and saves the final study guide back to PostgreSQL.

## Features

- Hono HTTP API
- Zod request validation
- BullMQ 6 job queue backed by Redis
- Prisma 8 PostgreSQL contract and generated client
- Three-step study-guide pipeline:
  1. Analyze the learner's request
  2. Create a time-aware study outline
  3. Write and review the final Markdown guide
- Persistent job statuses and results
- Structured pipeline input/output logs
- Configurable log level

## Requirements

- Node.js
- pnpm
- Docker and Docker Compose
- An anvia.dev or OpenAI-compatible API key

## Setup

Install dependencies:

```bash
pnpm install
```

Create a local environment file from the example:

```bash
cp .env.example .env
```

Add your LLM credentials to `.env`:

```env
LLM_API_KEY=your-api-key
LLM_BASE_URL=your-llm-base-url
```

The application requires `LLM_API_KEY` before the LLM client is created.

Available log levels are `debug`, `info`, `warn`, and `error`:

```env
LOG_LEVEL=info
```

The configured level and all more severe levels are displayed. For example,
`warn` displays `warn` and `error` logs.

## Start Infrastructure

Start PostgreSQL and Redis with Docker Compose:

```bash
docker compose up -d
```

The default services use:

| Service | Address | Purpose |
| --- | --- | --- |
| PostgreSQL | `localhost:55432` | Stores jobs and generated guides |
| Redis | `localhost:6380` | BullMQ queue backend |

The database connection configured in `.env.example` is:

```env
DATABASE_URL="postgresql://psql:letmein@localhost:55432/study_guide"
REDIS_HOST=localhost
REDIS_PORT=6380
```

## Initialize the Database

Initialize or update the PostgreSQL database from `prisma/schema.prisma`:

```bash
pnpm prisma:migrate
```

Generate the Prisma contract used by the application:

```bash
pnpm prisma:emit
```

Run the contract generation command after changing the Prisma schema.

## Run the Application

Start the API in one terminal:

```bash
pnpm dev:api
```

Start the BullMQ worker in another terminal:

```bash
pnpm dev:worker
```

The API is available at:

```text
http://localhost:3000
```

The API and worker must both be running for a request to produce a result.

## API Endpoints

The current API base path is `/study-guides`.

### Create a Study-Guide Job

```http
POST /study-guides
Content-Type: application/json
```

Request body:

```json
{
  "subject": "Biology",
  "topic": "Cellular respiration",
  "level": "High school",
  "availableTime": "50 minutes"
}
```

Required fields:

- `subject`: The academic subject
- `topic`: The topic to study
- `level`: The learner's level
- `availableTime`: The time available for the study session

The request is validated with Zod, stored in PostgreSQL, and added to the
BullMQ queue.

Current response:

```http
202 Accepted
```

```json
{
  "message": "Study guide request added"
}
```

### List Study-Guide Jobs

```http
GET /study-guides
```

Example response:

```json
{
  "jobs": [
    {
      "id": "e265b198-5d62-40dc-a463-ee328bc869d0",
      "subject": "Biology",
      "topic": "Cellular respiration",
      "level": "High school",
      "availableTime": "50 minutes",
      "status": "completed"
    }
  ]
}
```

The available statuses are:

- `pending`: The job is waiting to be processed or is being processed
- `completed`: The final study guide was saved
- `failed`: The worker could not generate the study guide

### Get One Job and Its Result

```http
GET /study-guides/:id
```

While the worker is still processing the request:

```json
{
  "jobId": "e265b198-5d62-40dc-a463-ee328bc869d0",
  "status": "pending",
  "result": null
}
```

When generation completes:

```json
{
  "jobId": "e265b198-5d62-40dc-a463-ee328bc869d0",
  "status": "completed",
  "result": {
    "id": "8aa0b9cf-3b83-4ccd-9c3b-4dd0ca7f86d1",
    "jobId": "e265b198-5d62-40dc-a463-ee328bc869d0",
    "guide": "# Cellular Respiration\n\n..."
  }
}
```

If the job fails:

```json
{
  "jobId": "e265b198-5d62-40dc-a463-ee328bc869d0",
  "status": "failed",
  "result": null
}
```

If the job ID does not exist, the API returns:

```http
404 Not Found
```

```json
{
  "message": "Job not found"
}
```

## Complete API Flow

1. Create a job:

```bash
curl -X POST http://localhost:3000/study-guides \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Biology",
    "topic": "Cellular respiration",
    "level": "High school",
    "availableTime": "50 minutes"
  }'
```

2. List all jobs:

```bash
curl http://localhost:3000/study-guides
```

3. Fetch a specific job by ID:

```bash
curl http://localhost:3000/study-guides/<job-id>
```

Poll the individual job endpoint until its status becomes `completed` or
`failed`. The result remains `null` while it is not ready.

## Pipeline

The pipeline is defined in `src/modules/job/pipeline.ts` and is executed by
`generateStudyGuide()` in `src/modules/job/service.ts`.

### Step 1: Analyze Request

The LLM identifies learning objectives and the key concepts needed for the
requested subject and topic.

### Step 2: Create Outline

The LLM creates a practical outline based on the learner's level and available
time.

### Step 3: Write and Review Guide

The LLM writes the final Markdown study guide with explanations, examples,
practice activities, and a review checklist.

Each step receives the previous step's returned context. During development,
the logger records the input and output for every pipeline step.

## Persistence and Failure Handling

- Jobs are stored in PostgreSQL before they are queued.
- The worker stores the final guide in the `JobResult` table.
- A successful job is marked `completed`.
- A failed LLM call is recorded as `failed` and the BullMQ job error is logged.
- Results are stored in PostgreSQL, so they remain available after restarting
  the API process.

## Bruno Requests

The `bruno/` directory contains request examples for:

- Creating a study-guide job
- Listing jobs
- Fetching a job result
- Fetching a missing job

Update `bruno/environments/local.bru` with the job ID returned by your create
request before running the result request.

## Production Build

Build the TypeScript project:

```bash
pnpm build
```

Start the compiled API and worker:

```bash
pnpm start
pnpm start:worker
```
