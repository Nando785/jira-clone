"use server";

import { cookies } from "next/headers";
import { Databases, Client, Query, Account } from "node-appwrite";

import { AUTH_COOKIE } from "@/features/auth/constants";
import { getMember } from "@/features/members/utils";

import { DATABASE_ID, MEMBERS_ID, WORKSPACES_ID } from "@/config";

import { Workspace } from "@/features/workspaces/types";

/**
 * This module 
 * 
 * @returns {}
 */

// Get the current workspace
export const getWorkspaces = async () => {
    try {
        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);
        
        const cookie = await cookies();
        const session = cookie.get(AUTH_COOKIE);

        if (!session) return { documents: [], total: 0 };
        client.setSession(session.value);

        const databases = new Databases(client)
        const account = new Account(client);
         const user = await account.get();

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

    } catch (error) {
        console.error("Error getting current user:", error);
        return { documents: [], total: 0 };
    }
}

interface GetWorkspaceProps {
    workspaceId: string
}

export const getWorkspace = async ({workspaceId}: GetWorkspaceProps) => {
    try {
        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);
        
        const cookie = await cookies();
        const session = cookie.get(AUTH_COOKIE);

        if (!session) return null;
        client.setSession(session.value);

        const databases = new Databases(client)
        const account = new Account(client);
        const user = await account.get();

        const member = await getMember({
            databases,
            userId: user.$id,
            workspaceId
        });

        if (!member) { return null };

        const workspace = await databases.getDocument<Workspace>(
            DATABASE_ID,
            WORKSPACES_ID,
            workspaceId,
        );

        // Serialize to a plain object so it can be passed to Client Components
        return JSON.parse(JSON.stringify(workspace)) as Workspace;
        // return workspace;

    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}