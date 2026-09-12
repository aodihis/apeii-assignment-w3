import { Hono } from "hono";
import { db } from "../../utils/db";
import { zValidator } from "@hono/zod-validator";
import { CreatePlanSchema } from "./schema";


export const planRouter = new Hono()
    .get('/', async (c) => {
        return c.json({
            data: []
        })
    })
    .get('/:id', async (c) => {
        const id = c.req.param();

        return c.json({
            id: "",
            plan: {}
        })
    })
    .post('/', zValidator("json", CreatePlanSchema), async (c) => {


        return c.json({message: "Plan request added"}, 202)
    })