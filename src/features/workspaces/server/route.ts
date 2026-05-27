import { Hono } from "hono";
import { ID } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { DATABASE_ID, IMAGES_BUCKET_ID, WORKSPACES_ID } from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";

import { createWorkspaceSchema } from "../schemas";

/**
 * This module defines a Hono route handler for creating a new workspace.
 * It uses the Appwrite API to create a new document in the specified database.
 * 
 * The route handler validates the incoming JSON payload against the `createWorkspaceSchema`.
 * It retrieves the `databases` and `user` objects from the middleware context.
 * 
 * The `createDocument` function is called with the `DATABASE_ID`, `WORKSPACES_ID`, a randomly generated ID using Appwrite's ID generation,
 * and the `name` and `user_id` properties from the validated JSON payload.
 * 
 * The resulting `workspace` object is returned as a JSON response.
 * 
 * @returns {Hono} The Hono route handler for creating a new workspace.
 */

const app = new Hono()
    .post(
        "/",
        zValidator("form", createWorkspaceSchema),
        sessionMiddleware,
        async (c) => {
            /// Retrieve the current user and database id from the middleware context
            const databases = c.get("databases");
            const storage = c.get("storage");
            const user = c.get("user");

            const { name, image} = c.req.valid("form");

            let uploadedImageUrl: string | undefined;
            
            if (image instanceof File) {
                const file = await storage.createFile(
                    IMAGES_BUCKET_ID,
                    ID.unique(),
                    image,
                );

                //const arrayBuffer = await storage.getFilePreview(
                const arrayBuffer = await storage.getFileView(
                    IMAGES_BUCKET_ID, 
                    file.$id
                );

                //uploadedImageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
                uploadedImageUrl = arrayBuffer.toString();
            }

            // Create a new document using the Appwrite API's `createDocument` function
            const workspace = await databases.createDocument(
                DATABASE_ID,
                WORKSPACES_ID,
                ID.unique(), // Generate a unique ID using Appwrite's ID generation
                {
                    name,
                    user_id: user.$id,
                    imageUrl: uploadedImageUrl,
                },
            );

            return c.json(workspace);
        }
    );

export default app;
