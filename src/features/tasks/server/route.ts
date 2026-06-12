import { z } from "zod";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { Project } from "@/features/projects/types";
import { getMember } from "@/features/members/utils";

import { createAdminClient } from "@/lib/appwrite";
import { sessionMiddleware } from "@/lib/session-middleware";
import { DATABASE_ID, MEMBERS_ID, PROJECTS_ID, TASKS_ID } from "@/config";

import { createTaskSchema } from "../schemas";
import { Task, TaskStatus } from "../types";


const app = new Hono()
    .delete(
        "/:taskId",
        sessionMiddleware,
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { taskId } = c.req.param();

            const task = await databases.getDocument<Task>(
                DATABASE_ID,
                TASKS_ID,
                taskId
            );

            const member = await getMember({
                databases,
                workspaceId: task.workspace_id,
                userId: user.$id,
            });

            if (!member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            await databases.deleteDocument(
                DATABASE_ID,
                TASKS_ID,
                taskId,
            );

            return c.json({ data: { $id: taskId } });
        }
    )
    .get(
        "/",
        sessionMiddleware,
        zValidator(
            "query",
            z.object({
                workspaceId: z.string(),
                projectId: z.string().nullish(),
                assigneeId: z.string().nullish(),
                status: z.nativeEnum(TaskStatus).nullish(),
                search: z.string().nullish(),
                dueDate: z.string().nullish(),
            }),
        ),
        async (c) => {
            const { users } = await createAdminClient();
            const databases = c.get("databases");
            const user = c.get("user");

            const {
                workspaceId,
                projectId,
                status,
                search,
                assigneeId,
                dueDate,
            } = c.req.valid("query");

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const query = [
                Query.equal("workspace_id", workspaceId),
                Query.orderDesc("$createdAt"),
            ];

            if (projectId) {
                console.log("projectId: ", projectId);
                query.push(Query.equal("project_id", projectId));
            }

            if (status) {
                console.log("status: ", status);
                query.push(Query.equal("status", status));
            }

            if (assigneeId) {
                console.log("assigneeId: ", assigneeId);
                query.push(Query.equal("assignee_id", assigneeId));
            }

            if (dueDate) {
                console.log("dueDate: ", dueDate);
                query.push(Query.equal("due_date", dueDate));
            }

            if (search) {
                console.log("search: ", search);
                query.push(Query.search("name", search));
            }

            const tasks = await databases.listDocuments<Task>(
                DATABASE_ID,
                TASKS_ID,
                query,
            );

            const projectIds = tasks.documents.map((task) => task.project_id);
            const assigneeIds = tasks.documents.map((task) => task.assignee_id);

            const projects = await databases.listDocuments<Project>(
                DATABASE_ID,
                PROJECTS_ID,
                projectIds.length > 0 ? [Query.equal("$id", projectIds)] : []
            );

            const members = await databases.listDocuments(
                DATABASE_ID,
                MEMBERS_ID,
                assigneeIds.length > 0 ? [Query.equal("$id", assigneeIds)] : []
            );

            const assignees = await Promise.all(
                members.documents.map(async (member) => {
                    const user = await users.get(member.user_id);
                    return {
                        ...member,
                        name: user.name || user.email,
                        email: user.email,
                    };
                })
            );

            const populatedTasks = tasks.documents.map((task) => {
                const project = projects.documents.find(
                    (project) => project.$id === task.project_id,
                );

                const assignee = assignees.find(
                    (assignee) => assignee.$id === task.assignee_id,
                );

                return {
                    ...task,
                    project,
                    assignee,
                };
            });

            return c.json({
                    data: {
                        ...tasks,
                        documents: populatedTasks,
                    },
                });
        }
    )
    .post(
        "/",
        sessionMiddleware,
        zValidator("json", createTaskSchema),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const {
                name,
                status,
                workspaceId,
                projectId,
                dueDate,
                assigneeId
            } = c.req.valid("json");

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const highestPositionTask = await databases.listDocuments(
                DATABASE_ID,
                TASKS_ID,
                [
                    Query.equal("status", status),
                    Query.equal("workspace_id", workspaceId),
                    Query.orderAsc("position"),
                    Query.limit(1),
                ],
            );

            const newPosition = 
                highestPositionTask.documents.length > 0
                ? highestPositionTask.documents[0].position + 1000
                : 1000;

            const task = await databases.createDocument(
                DATABASE_ID,
                TASKS_ID,
                ID.unique(),
                {
                    name,
                    status,
                    workspace_id: workspaceId,
                    project_id: projectId,
                    due_date: dueDate,
                    assignee_id: assigneeId,
                    position: newPosition
                },
            );

            return c.json({ data: task});
        }
    )
    .patch(
        "/bulk-update",
        sessionMiddleware,
        zValidator(
            "json",
            z.object({
                tasks: z.array(
                    z.object({
                        $id: z.string(),
                        status: z.nativeEnum(TaskStatus),
                        position: z.number().int().positive().min(1000).max(1_000_000),
                    })
                )
            })
        ),
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");
            const { tasks } = await c.req.valid("json");

            const tasksToUpdate = await databases.listDocuments<Task>(
                DATABASE_ID,
                TASKS_ID,
                [Query.contains("$id", tasks.map((task) => task.$id))],
            );

            const workspaceIds = new Set(tasksToUpdate.documents.map((task) => task.workspace_id));
            if (workspaceIds.size !== 1) {
                return c.json({ error: "All tasks must belong to the same workspace" }, 400);
            }

            const workspaceId = workspaceIds.values().next().value as string;

            if ( !workspaceId ) {
                return c.json({ error: "Workspace ID is required" }, 400);
            }

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const updatedTasks = await Promise.all(
                tasks.map(async (task) => {
                    const { $id, status, position } = task;
                    return databases.updateDocument<Task>(
                        DATABASE_ID,
                        TASKS_ID,
                        $id,
                        { status, position },
                    );
                })
            );

            return c.json({ data: updatedTasks });
        }
    )
    .patch(
        "/:taskId",
        sessionMiddleware,
        zValidator("json", createTaskSchema.partial()),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const {
                name,
                status,
                description,
                projectId,
                dueDate,
                assigneeId
            } = c.req.valid("json");
            const { taskId } = c.req.param();

            const existingTask = await databases.getDocument<Task>(
                DATABASE_ID,
                TASKS_ID,
                taskId,
            )

            const member = await getMember({
                databases,
                workspaceId: existingTask.workspace_id,
                userId: user.$id,
            });

            if (!member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const task = await databases.updateDocument(
                DATABASE_ID,
                TASKS_ID,
                taskId,
                {
                    name,
                    status,
                    project_id: projectId,
                    due_date: dueDate,
                    assignee_id: assigneeId,
                    description,
                },
            );

            return c.json({ data: task});
        }
    )
    .get(
        "/:taskId",
        sessionMiddleware,
        async (c) => {
            const currentUser = c.get("user");
            const databases = c.get("databases");
            const { users } = await createAdminClient();
            const { taskId } = c.req.param();

            const task = await databases.getDocument<Task>(
                DATABASE_ID,
                TASKS_ID,
                taskId,
            );

            const currentMember = await getMember({
                databases,
                workspaceId: task.workspace_id,
                userId: currentUser.$id,
            });

            if (!currentMember) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const project = await databases.getDocument<Project>(
                DATABASE_ID,
                PROJECTS_ID,
                task.project_id,
            );

            const member = await databases.getDocument(
                DATABASE_ID,
                MEMBERS_ID,
                task.assignee_id,
            );

            const user = await users.get(member.user_id);

            const assignee = {
                ...member,
                name: user.name || user.email,
                email: user.email,
            };

            return (
                c.json({
                    data: {
                        ...task,
                        project,
                        assignee,
                    }
                })
            );
        }
    );

export default app;
