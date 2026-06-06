import { Models } from "node-appwrite";
import { Project } from "../projects/types";

export enum TaskStatus {
    BACKLOG = "BACKLOG",
    TODO = "TODO",
    IN_PROGRESS = "IN_PROGRESS",
    IN_REVIEW = "IN_REVIEW",
    DONE = "DONE",
};

export type Task = Models.Document & {
    name: string;
    status: TaskStatus;
    workspace_id: string;
    assignee_id: string;
    project_id: string;
    position: number;
    due_date: string;
};

// types.ts
export type PopulatedTask = Task & {
    project: Project;
    assignee: { name: string; email: string };
};