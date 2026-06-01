import { Query, type Databases } from "node-appwrite";

import { DATABASE_ID, MEMBERS_ID } from "@/config";

interface GetMemberProps {
    databases: Databases;
    workspaceId: string;
    userId: string;
}

export const getMember = async ({ 
    databases, 
    workspaceId, 
    userId }: GetMemberProps) => {
    const members =  await databases.listDocuments(
        DATABASE_ID,
        MEMBERS_ID,
        [
            Query.equal("workspace_id", workspaceId),
            Query.equal("user_id", userId),
        ],
    );

    return members.documents[0];
};