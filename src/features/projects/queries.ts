import { getMember } from "../members/utils";

import { DATABASE_ID, PROJECTS_ID } from "@/config";
import { createSessionClient } from "@/lib/appwrite";
import { Project } from "./types";

interface GetProjectProps {
    projectId: string
}

export const getProject = async ({projectId}: GetProjectProps) => {
    const { databases, Account } = await createSessionClient();
    const user = await Account.get();
    
    const project = await databases.getDocument<Project>(
        DATABASE_ID,
        PROJECTS_ID,
        projectId,
    );

    const member = await getMember({
        databases,
        userId: user.$id,
        workspaceId: project.workspace_id,
    });

    if (!member) { 
        throw new Error("Unauthorized");
    }

    // Serialize to a plain object so it can be passed to Client Components
    return JSON.parse(JSON.stringify(project)) as Project;
    // return workspace;
}