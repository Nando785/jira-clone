import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { loginSchema, registerSchema } from "../schemas";

import { sessionMiddleware } from "@/lib/session-middleware";
import { createAdminClient } from "@/lib/appwrite"
import { ID } from "node-appwrite";

import { deleteCookie, setCookie } from "hono/cookie";
import { AUTH_COOKIE } from "../constants";

/**
 * Defines route handlers for authentication: session retrieval, login, registration, and logout.
 * 
 * Login and register use an admin Appwrite client to create sessions, which are persisted
 * as secure HttpOnly cookies. Logout deletes both the cookie and the Appwrite session.
 * Protected routes use sessionMiddleware to verify the cookie before the handler runs.
 * 
 * @returns {Hono} The Hono route handler for authentication.
 */

const app = new Hono()
    .get(
        "/current", 
        sessionMiddleware, 
        (c) => {
            const user = c.get("user");

            return c.json({ data : user});
        }
    )
    .post(
        "/login", 
        zValidator('json', loginSchema), 
        async (c) => {
            const { email, password } = c.req.valid("json");

            const { account } = await createAdminClient();
            const session = await account.createEmailPasswordSession(email, password);

            // Store session secret in a secure HttpOnly cookie so it's never
            // accessible to client-side JavaScript
            setCookie(c, AUTH_COOKIE, session.secret, {
                path: "/",
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: 60 * 60 * 24 * 30, // 30 days max session
            });

            return c.json({ success : true });
        }
    )
    .post(
        "/register",
        zValidator('json', registerSchema),
        async (c) => {
            const { name, email, password } = c.req.valid("json");

            const { account } = await createAdminClient();
            await account.create(ID.unique(), email, password, name);

            // Store session secret in a secure HttpOnly cookie so it's never
            // accessible to client-side JavaScript
            const session = await account.createEmailPasswordSession(email, password);

            setCookie(c, AUTH_COOKIE, session.secret, {
                path: "/",
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: 60 * 60 * 24 * 30, // 30 days max session
            });

            return c.json({ success : true });
        }
    )
    .post(
        "/logout", 
        sessionMiddleware, 
        async (c) => {
            const account = c.get("account");

            // Delete both the local cookie and the Appwrite session — order matters
            // here since the session is needed to call deleteSession before removing the cookie
            deleteCookie(c, AUTH_COOKIE);
            await account.deleteSession("current");
        
            return c.json({ success : true });
    
        }
    )

export default app;
