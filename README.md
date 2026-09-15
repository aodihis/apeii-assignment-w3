# Devscale AI Product Engineering: TypeScript III

Assignment for Week 3 by Iqbal.

This assignment builds a Hono API that generates study guides asynchronously
using BullMQ, PostgreSQL, Prisma, and an anvia.dev-compatible LLM API.

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

The local PostgreSQL and Redis settings are:

```env
DATABASE_URL="postgresql://psql:letmein@localhost:55432/study_guide"
REDIS_HOST=localhost
REDIS_PORT=6380
```

Start PostgreSQL and Redis:

```bash
docker compose up -d
```

Initialize the database:

```bash
pnpm prisma:migrate
```

## Run the Application

Start the API:

```bash
pnpm dev:api
```

Start the worker in a separate terminal:

```bash
pnpm dev:worker
```

The API runs at:

```text
http://localhost:3000
```

## API Endpoints

### Create a Job

```http
POST /jobs
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

The request is validated and added to the BullMQ queue.

Response:

```http
202 Accepted
```

```json
{
  "jobId": "e265b198-5d62-40dc-a463-ee328bc869d0",
  "status": "pending"
}
```

### List Jobs

```http
GET /jobs
```

Example response:

```json
[
  {
    "id": "e265b198-5d62-40dc-a463-ee328bc869d0",
    "subject": "Biology",
    "topic": "Cellular respiration",
    "level": "High school",
    "availableTime": "50 minutes",
    "status": "completed",
    "result": {
      "id": "8aa0b9cf-3b83-4ccd-9c3b-4dd0ca7f86d1",
      "jobId": "e265b198-5d62-40dc-a463-ee328bc869d0",
      "guide": "# Cellular Respiration\\n\\n..."
    }
  }
]
```

### Get a Job

```http
GET /jobs/:id
```

While the job is being processed:

```json
{
  "id": "e265b198-5d62-40dc-a463-ee328bc869d0",
  "status": "pending",
  "result": null
}
```

When the job is completed:

```json
{
  "id": "e265b198-5d62-40dc-a463-ee328bc869d0",
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
  "id": "e265b198-5d62-40dc-a463-ee328bc869d0",
  "status": "failed",
  "result": null
}
```

If the job does not exist:

```http
404 Not Found
```

```json
{
  "message": "Job not found"
}
```

## Example Flow

Create a job:

```bash
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Biology",
    "topic": "Cellular respiration",
    "level": "High school",
    "availableTime": "50 minutes"
  }'
```

List all jobs:

```bash
curl http://localhost:3000/jobs
```

Fetch one job by ID:

```bash
curl http://localhost:3000/jobs/<job-id>
```

The result endpoint can be called again until the job status is `completed` or
`failed`.
