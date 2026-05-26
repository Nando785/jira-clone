import { Hono } from "hono";
import { ID } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { DATABASE_ID, WORKSPACES_ID } from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";

import { createWorkspaceSchema } from "../schemas";

const app = new Hono()
    .post(
        "/",
        zValidator('json', createWorkspaceSchema),
        sessionMiddleware,
        async (c) => {
            // Get databases from middleware
            const databases = c.get("databases");
            const user = c.get("user");

            const { name } = c.req.valid('json');
            
            // Create a new document
            const workspace = await databases.createDocument(
                DATABASE_ID,
                WORKSPACES_ID,
                ID.unique(), // Randomly generate ID using Appwrite's ID generation
                {
                    name,
                    user_id: user.$id,
                },
            );

            return c.json(workspace);
        }
    );

export default app;
