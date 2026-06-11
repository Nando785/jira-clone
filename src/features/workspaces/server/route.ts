import { z } from "zod";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { TaskStatus } from "@/features/tasks/types";
import { MemberRole } from "@/features/members/types";

import {
    DATABASE_ID, 
    IMAGES_BUCKET_ID, 
    WORKSPACES_ID, 
    APPWRITE_ENDPOINT, 
    APPWRITE_PROJECT_ID,
    MEMBERS_ID,
    TASKS_ID
} from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";
import { generateInviteCode } from "@/lib/utils";

import { createWorkspaceSchema, updateWorkspaceSchema } from "../schemas";
import { getMember } from "@/features/members/utils";
import { Workspace } from "../types";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

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
    .get(
        "/", 
        sessionMiddleware, 
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");

            const members = await databases.listDocuments(
                DATABASE_ID,
                MEMBERS_ID,
                [Query.equal("user_id", user.$id)]
            );

            const workspaceIds = members.documents.map((member) => member.workspace_id);

            if (members.total === 0){
                return c.json({ data: { documents: [], total: 0 } });
            }

            const workspaces = await databases.listDocuments(
                DATABASE_ID,
                WORKSPACES_ID,
                [
                    Query.orderDesc("$createdAt"),
                    Query.contains("$id", workspaceIds)
                ],
            );

            return c.json({ data: workspaces });
        }
    )
    .get(
        "/:workspaceId",
        sessionMiddleware,
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { workspaceId } = c.req.param();

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const workspace = await databases.getDocument<Workspace>(
                DATABASE_ID,
                WORKSPACES_ID,
                workspaceId,
            );

            return c.json({ data: workspace });
        }
    )
    .get(
        "/:workspaceId/info",
        sessionMiddleware,
        async (c) => {
            const databases = c.get("databases");
            const { workspaceId } = c.req.param();

            const workspace = await databases.getDocument<Workspace>(
                DATABASE_ID,
                WORKSPACES_ID,
                workspaceId,
            );

            return c.json({ data: { 
                $id: workspace.$id, 
                name: workspace.name, 
                imageUrl: workspace.imageUrl
                } 
            });
        }
    )
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
                //     IMAGES_BUCKET_ID, 
                //     file.$id
                // );

                //uploadedImageUrl = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`;

                // Construct the file URL manually since the getFilePreview endpoint is behind a paywall
                uploadedImageUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${IMAGES_BUCKET_ID}/files/${file.$id}/view?project=${APPWRITE_PROJECT_ID}&mode=admin`;
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
                    invite_code: generateInviteCode(6),
                },
            );

            // Automatically create a new admin member
            await databases.createDocument(
                DATABASE_ID,
                MEMBERS_ID,
                ID.unique(),
                {
                    workspace_id: workspace.$id,
                    user_id: user.$id,
                    role: MemberRole.ADMIN,
                },
            );

            return c.json({ data: workspace });
        }
    )
    .patch(
        "/:workspaceId",
        sessionMiddleware,
        zValidator("form", updateWorkspaceSchema),
        async (c) => {
            const databases = c.get("databases");
            const storage = c.get("storage");
            const user = c.get("user");

            const { workspaceId } = c.req.param();
            const { name, image} = c.req.valid("form");

            const member = await getMember({
                databases,
                userId: user.$id,
                workspaceId,
            });

            if (!member || member.role !== MemberRole.ADMIN) {
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

            const workspace = await databases.updateDocument(
                DATABASE_ID,
                WORKSPACES_ID,
                workspaceId,
                {
                    name,
                    imageUrl: uploadedImageUrl,
                },
            );

            return c.json({ data: workspace });
        }
    )
    .delete(
        "/:workspaceId",
        sessionMiddleware,
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");

            const { workspaceId } = c.req.param();

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member || member.role !== MemberRole.ADMIN) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            // TODO: Delete members, projects, and tasks associated with this workspace

            await databases.deleteDocument(
                DATABASE_ID,
                WORKSPACES_ID,
                workspaceId
            );

            return c.json({ data: {$id: workspaceId} });
        }
    )
    .post(
        "/:workspaceId/reset-invite-code",
        sessionMiddleware,
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");

            const { workspaceId } = c.req.param();

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member || member.role !== MemberRole.ADMIN) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const workspace = await databases.updateDocument(
                DATABASE_ID,
                WORKSPACES_ID,
                workspaceId,
                {
                    invite_code: generateInviteCode(6),
                }
            );

            return c.json({ data: workspace });
        }
    )
    .post(
        "/:workspaceId/join",
        sessionMiddleware,
        zValidator("json", z.object({ invite_code: z.string() })),
        async (c) => {
            const { workspaceId } = c.req.param();
            const { invite_code } = c.req.valid("json");

            const databases = c.get("databases");
            const user = c.get("user");

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (member) {
                return c.json({ error: "Already a member of this workspace" }, 400);
            }

            const workspace = await databases.getDocument<Workspace>(
                DATABASE_ID,
                WORKSPACES_ID,
                workspaceId
            );

            if (workspace.invite_code !== invite_code){
                return c.json({ error: "Invalid invite code" }, 400);
            }

            await databases.createDocument(
                DATABASE_ID,
                MEMBERS_ID,
                ID.unique(),
                {
                    workspace_id: workspaceId,
                    user_id: user.$id,
                    role: MemberRole.MEMBER,
                },
            );

            return c.json({ data: workspace });
        }
    )
    .get(
            "/:workspaceId/anayltics",
            sessionMiddleware,
            async (c) => {
                const databases = c.get("databases");
                const user = c.get("user");
                const { workspaceId } = c.req.param();
    
                const member = await getMember({
                    databases,
                    workspaceId,
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
                        Query.equal("workspace_id", workspaceId),
                        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
                        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString())
                    ]
                );
    
                const lastMonthTasks = await databases.listDocuments(
                    DATABASE_ID,
                    TASKS_ID,
                    [
                        Query.equal("workspace_id", workspaceId),
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
                        Query.equal("workspace_id", workspaceId),
                        Query.equal("assignee_id", member.$id),
                        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
                        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString())
                    ]
                );
    
                const lastMonthAssignedTasks = await databases.listDocuments(
                    DATABASE_ID,
                    TASKS_ID,
                    [
                        Query.equal("workspace_id", workspaceId),
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
                        Query.equal("workspace_id", workspaceId),
                        Query.notEqual("status", TaskStatus.DONE),
                        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
                        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString())
                    ]
                );
    
                const lastMonthIncompleteTasks = await databases.listDocuments(
                    DATABASE_ID,
                    TASKS_ID,
                    [
                        Query.equal("workspace_id", workspaceId),
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
                        Query.equal("workspace_id", workspaceId),
                        Query.equal("status", TaskStatus.DONE),
                        Query.greaterThanEqual("$createdAt", thisMonthStart.toISOString()),
                        Query.lessThanEqual("$createdAt", thisMonthEnd.toISOString())
                    ]
                );
    
                const lastMonthCompletedTasks = await databases.listDocuments(
                    DATABASE_ID,
                    TASKS_ID,
                    [
                        Query.equal("workspace_id", workspaceId),
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
                        Query.equal("workspace_id", workspaceId),
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
                        Query.equal("workspace_id", workspaceId),
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
