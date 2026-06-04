import { z } from "zod";

import { TaskStatus } from "./types";

export const createTaskSchema = z.object({
    name: z.string().trim().min(1, "Required"),
    status: z.nativeEnum(TaskStatus, { message: "Required" }),
    workspaceId: z.string().trim().min(1, "Required"),
    projectId: z.string().trim().min(1, "Required"),
    dueDate: z.coerce.date(),
    // dueDate: z.date(),
    assigneeId: z.string().trim().min(1, "Required"),
    description: z.string().optional(),
});