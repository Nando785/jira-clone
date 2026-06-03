import { z } from "zod";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";

import { createProjectSchema, updateProjectSchema } from "../schemas";
import { DATABASE_ID, IMAGES_BUCKET_ID, PROJECTS_ID, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";
import WorkspaceIdPage from "@/app/(dashboard)/workspaces/[workspaceId]/page";
import { Project } from "../types";

const app = new Hono()
    .post(
        "/",
        sessionMiddleware,
        zValidator("form", createProjectSchema),
        async (c) => {
            /// Retrieve the current user and database id from the middleware context
            const databases = c.get("databases");
            const storage = c.get("storage");
            const user = c.get("user");

            const { name, image, workspaceId} = c.req.valid("form");

            const member = await getMember({
                databases,
                userId: user.$id,
                workspaceId,
            });

            if (!member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            let uploadedImageUrl: string | undefined;
            
            if (image instanceof File) {
                const file = await storage.createFile(
                    IMAGES_BUCKET_ID,
                    ID.unique(),
                    image,
                );

                // Construct the file URL manually since the getFilePreview endpoint is behind a paywall
                uploadedImageUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${IMAGES_BUCKET_ID}/files/${file.$id}/view?project=${APPWRITE_PROJECT_ID}&mode=admin`;
            }

            // Create a new document using the Appwrite API's `createDocument` function
            const project = await databases.createDocument(
                DATABASE_ID,
                PROJECTS_ID,
                ID.unique(), // Generate a unique ID using Appwrite's ID generation
                {
                    name,
                    imageUrl: uploadedImageUrl,
                    workspace_id: workspaceId,
                },
            );

            return c.json({ data: project });
        }
    )
    .get(
        "/",
        sessionMiddleware,
        zValidator("query", z.object({ workspaceId: z.string() })),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");

            const { workspaceId } = c.req.valid("query");

            if(!workspaceId) {
                return c.json({ error: "Missing workspaceId" }, 400);
            }

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if(!member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const projects = await databases.listDocuments(
                DATABASE_ID,
                PROJECTS_ID,
                [
                    Query.equal("workspace_id", workspaceId),
                    Query.orderDesc("$createdAt"),
                ]
            );

            return c.json({ data: projects });
        }
    ).patch(
            "/:projectId",
            sessionMiddleware,
            zValidator("form", updateProjectSchema),
            async (c) => {
                const databases = c.get("databases");
                const storage = c.get("storage");
                const user = c.get("user");
    
                const { projectId } = c.req.param();
                const { name, image} = c.req.valid("form");

                const existingProject = await databases.getDocument<Project>(
                    DATABASE_ID,
                    PROJECTS_ID,
                    projectId
                );
    
                const member = await getMember({
                    databases,
                    userId: user.$id,
                    workspaceId: existingProject.workspace_id,
                });
    
                if (!member) {
                    return c.json({ error: "Unauthorized" }, 401);
                }
    
                let uploadedImageUrl: string | undefined;
                
                if (image instanceof File) {
                    const file = await storage.createFile(
                        IMAGES_BUCKET_ID,
                        ID.unique(),
                        image,
                    );
    
                    // Construct the file URL manually since the getFilePreview endpoint is behind a paywall
                    uploadedImageUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${IMAGES_BUCKET_ID}/files/${file.$id}/view?project=${APPWRITE_PROJECT_ID}&mode=admin`;
                }else {
                    uploadedImageUrl = image;
                }
    
                const project = await databases.updateDocument(
                    DATABASE_ID,
                    PROJECTS_ID,
                    projectId,
                    {
                        name,
                        imageUrl: uploadedImageUrl,
                    },
                );
    
                return c.json({ data: project });
            }
        ).delete(
                "/:projectId",
                sessionMiddleware,
                async (c) => {
                    const databases = c.get("databases");
                    const user = c.get("user");
        
                    const { projectId } = c.req.param();

                    const existingProject = await databases.getDocument<Project>(
                        DATABASE_ID,
                        PROJECTS_ID,
                        projectId
                    );
        
                    const member = await getMember({
                        databases,
                        workspaceId: existingProject.workspace_id,
                        userId: user.$id,
                    });
        
                    if (!member) {
                        return c.json({ error: "Unauthorized" }, 401);
                    }
        
                    // TODO: Delete rasks
        
                    await databases.deleteDocument(
                        DATABASE_ID,
                        PROJECTS_ID,
                        projectId
                    );
        
                    return c.json({ data: {$id: existingProject.$id} });
                }
            );

export default app;