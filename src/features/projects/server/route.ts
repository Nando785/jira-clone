import { z } from "zod";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

import { getMember } from "@/features/members/utils";

import { createProjectSchema, updateProjectSchema } from "../schemas";
import { DATABASE_ID, IMAGES_BUCKET_ID, PROJECTS_ID, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, TASKS_ID } from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";
import WorkspaceIdPage from "@/app/(dashboard)/workspaces/[workspaceId]/page";
import { Project } from "../types";
import { TaskStatus } from "@/features/tasks/types";

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

            const projects = await databases.listDocuments<Project>(
                DATABASE_ID,
                PROJECTS_ID,
                [
                    Query.equal("workspace_id", workspaceId),
                    Query.orderDesc("$createdAt"),
                ]
            );

            return c.json({ data: projects });
        }
    )
    .patch(
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
    )
    .delete(
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
    )
    .get(
        "/:projectId",
        sessionMiddleware,
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");

            const { projectId } = c.req.param();

            const project = await databases.getDocument<Project>(
                DATABASE_ID,
                PROJECTS_ID,
                projectId,
            );

            const member = await getMember({
                databases,
                workspaceId: project.workspace_id,
                userId: user.$id,
            });

            if(!member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            return c.json({ data: project});
        }
    )
    .get(
        "/:projectId/anayltics",
        sessionMiddleware,
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");
            const { projectId } = c.req.param();

            const project = await databases.getDocument<Project>(
                DATABASE_ID,
                PROJECTS_ID,
                projectId,
            );

            const member = await getMember({
                databases,
                workspaceId: project.workspace_id,
                userId: user.$id,
            });

            if (!member) {
                return c.json({ error: "Unauthorized"}, 401);
            }

            const now = new Date();
            const thisMonthStart = startOfMonth(now);
            const thisMonthEnd = endOfMonth(now);
            const lastMonthStart = startOfMonth(subMonths(now, 1));
            const lastMonthEnd = endOfMonth(subMonths(now, 1));

            const thisMonthTasks = await databases.listDocuments(
                DATABASE_ID,
                TASKS_ID,
                [
                    Query.equal("project_id", projectId),
                    Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
                    Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString())
                ]
            );

            const lastMonthTasks = await databases.listDocuments(
                DATABASE_ID,
                TASKS_ID,
                [
                    Query.equal("project_id", projectId),
                    Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
                    Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString())
                ]
            );

            const taskCount = thisMonthTasks.total;
            const taskDifference = taskCount - lastMonthTasks.total;

            const thisMonthAssignedTasks = await databases.listDocuments(
                DATABASE_ID,
                TASKS_ID,
                [
                    Query.equal("project_id", projectId),
                    Query.equal("assignee_id", member.$id),
                    Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
                    Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString())
                ]
            );

            const lastMonthAssignedTasks = await databases.listDocuments(
                DATABASE_ID,
                TASKS_ID,
                [
                    Query.equal("project_id", projectId),
                    Query.equal("assignee_id", member.$id),
                    Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
                    Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString())
                ]
            );

            const assignedTaskCount = thisMonthAssignedTasks.total;
            const assignedTaskDifference = assignedTaskCount - lastMonthAssignedTasks.total;

            const thisMonthIncompleteTasks = await databases.listDocuments(
                DATABASE_ID,
                TASKS_ID,
                [
                    Query.equal("project_id", projectId),
                    Query.notEqual("status", TaskStatus.DONE),
                    Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
                    Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString())
                ]
            );

            const lastMonthIncompleteTasks = await databases.listDocuments(
                DATABASE_ID,
                TASKS_ID,
                [
                    Query.equal("project_id", projectId),
                    Query.notEqual("status", TaskStatus.DONE),
                    Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
                    Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString())
                ]
            );

            const incompleteTaskCount = thisMonthIncompleteTasks.total;
            const incompleteTaskDifference = incompleteTaskCount - lastMonthIncompleteTasks.total;

            const thisMonthCompletedTasks = await databases.listDocuments(
                DATABASE_ID,
                TASKS_ID,
                [
                    Query.equal("project_id", projectId),
                    Query.equal("status", TaskStatus.DONE),
                    Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
                    Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString())
                ]
            );

            const lastMonthCompletedTasks = await databases.listDocuments(
                DATABASE_ID,
                TASKS_ID,
                [
                    Query.equal("project_id", projectId),
                    Query.equal("status", TaskStatus.DONE),
                    Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
                    Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString())
                ]
            );

            const completedTaskCount = thisMonthCompletedTasks.total;
            const completedTaskDifference = completedTaskCount - lastMonthCompletedTasks.total;

            const thisMonthOverdueTasks = await databases.listDocuments(
                DATABASE_ID,
                TASKS_ID,
                [
                    Query.equal("project_id", projectId),
                    Query.notEqual("status", TaskStatus.DONE),
                    Query.lessThan("due_date", now.toISOString()),
                    Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
                    Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString())
                ]
            );

            const lastMonthOverdueTasks = await databases.listDocuments(
                DATABASE_ID,
                TASKS_ID,
                [
                    Query.equal("project_id", projectId),
                    Query.notEqual("status", TaskStatus.DONE),
                    Query.lessThan("due_date", now.toISOString()),
                    Query.greaterThanEqual("$createdAt", lastMonthStart.toISOString()),
                    Query.lessThanEqual("$createdAt", lastMonthEnd.toISOString())
                ]
            );

            const overdueTaskCount = thisMonthOverdueTasks.total;
            const overdueTaskDifference = overdueTaskCount - lastMonthOverdueTasks.total;

            return c.json({
                data: {
                    taskCount,
                    taskDifference,
                    assignedTaskCount,
                    assignedTaskDifference,
                    incompleteTaskCount,
                    incompleteTaskDifference,
                    completedTaskCount,
                    completedTaskDifference,
                    overdueTaskCount,
                    overdueTaskDifference
                }
            });
        }
    );

export default app;