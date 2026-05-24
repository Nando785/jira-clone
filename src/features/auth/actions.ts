"use server";

import { cookies } from "next/headers";
import { Account, Client } from "node-appwrite";

import { AUTH_COOKIE } from "./constants";

export const getCurrent = async () => {
    try {
        // Create a new Appwrite client
        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

        const cookie = await cookies();
        const session = cookie.get(AUTH_COOKIE);

        if (!session) return null;
        client.setSession(session.value);

        // Set the session cookie on the client
        const account = new Account(client)
        return await account.get();

    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}

