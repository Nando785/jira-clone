"use server";

import { Query } from "node-appwrite";

import { getMember } from "@/features/members/utils";

import { createSessionClient } from "@/lib/appwrite";
import { DATABASE_ID, MEMBERS_ID, WORKSPACES_ID } from "@/config";

import { Workspace } from "@/features/workspaces/types";

/**
 * This module 
 * 
 * @returns {}
 */

// Get the current workspace
export const getWorkspaces = async () => {
    const { databases, Account } = await createSessionClient();
    const user = await Account.get();

    const members = await databases.listDocuments(
        DATABASE_ID,
        MEMBERS_ID,
        [Query.equal("user_id", user.$id)]
    );

    const workspaceIds = members.documents.map((member) => member.workspace_id);

    if (members.total === 0){
        return { documents: [], total: 0 };
    }

    const workspaces = await databases.listDocuments(
        DATABASE_ID,
        WORKSPACES_ID,
        [
            Query.orderDesc("$createdAt"),
            Query.contains("$id", workspaceIds)
        ],
    );

    return workspaces;
}
