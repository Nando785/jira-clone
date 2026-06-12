import { z } from "zod";
import { Hono } from "hono";
import { Query } from "node-appwrite"
import { zValidator } from "@hono/zod-validator";

import { createAdminClient } from "@/lib/appwrite";
import { DATABASE_ID, MEMBERS_ID } from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";

import { getMember } from "../utils";
import { Member, MemberRole } from "../types";

const app = new Hono()
    .get(
        "/",
        sessionMiddleware,
        zValidator("query", z.object({ workspaceId: z.string() })),
        async (c) => {
            const { users } = await createAdminClient();
            const databases = c.get("databases");
            const user = c.get("user");
            const { workspaceId } = c.req.valid("query");

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id,
            });

            if (!member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const members = await databases.listDocuments<Member>(
                DATABASE_ID,
                MEMBERS_ID,
                [Query.equal("workspace_id", workspaceId)]
            );

            const populatedMembers = await Promise.all(
                members.documents.map(async (member) => {
                    const user = await users.get(member.user_id);
                    // const user = await users.get(member.userId);

                    return{
                        ...member,
                        name: user.name || user.email,
                        email: user.email,
                    }
                })
            );

            return c.json({
                data: {
                    ...members,
                    documents: populatedMembers,
                },
            });
        }
    )
    .delete(
        "/:memberId",
        sessionMiddleware,
        async (c) => {
            const { memberId } = c.req.param();
            const user = c.get("user");
            const databases = c.get("databases");
            
            const memberToDelete = await databases.getDocument(
                DATABASE_ID,
                MEMBERS_ID,
                memberId
            );

            const allMembersInWorkspace = await databases.listDocuments(
                DATABASE_ID,
                MEMBERS_ID,
                [Query.equal("workspace_id", memberToDelete.workspace_id)]
            );

            const member = await getMember({
                databases,
                workspaceId: memberToDelete.workspace_id,
                userId: user.$id,
            });

            if(!member) {
                return c.json({error: "Unauthorized"}, 401);
            }

            if (member.$id !== memberToDelete.$id && member.role !== MemberRole.ADMIN) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            if(allMembersInWorkspace.total === 1) {
                return c.json({ error: "Cannot delete the last member of the workspace" }, 400);
            }

            await databases.deleteDocument(
                DATABASE_ID,
                MEMBERS_ID,
                memberId,
            );

            return c.json( {data: { $id: memberToDelete.$id } });
        }
    )
    .patch(
        "/:memberId",
        sessionMiddleware,
        zValidator("json", z.object({ role: z.nativeEnum(MemberRole) })),
        async (c) => {
            const { memberId } = c.req.param();
            const user = c.get("user");
            const { role } = c.req.valid("json");
            const databases = c.get("databases");
            
            const memberToUpdate = await databases.getDocument(
                DATABASE_ID,
                MEMBERS_ID,
                memberId
            );

            const allMembersInWorkspace = await databases.listDocuments(
                DATABASE_ID,
                MEMBERS_ID,
                [Query.equal("workspace_id", memberToUpdate.workspace_id)]
            );

            const member = await getMember({
                databases,
                workspaceId: memberToUpdate.workspace_id,
                userId: user.$id,
            });

            if(!member) {
                return c.json({error: "Unauthorized"}, 401);
            }

            if (member.role !== MemberRole.ADMIN) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            if(allMembersInWorkspace.total === 1) {
                return c.json({ error: "Cannot downgrade the only of a workspace" }, 400);
            }

            await databases.updateDocument(
                DATABASE_ID,
                MEMBERS_ID,
                memberId,
                {
                    role,
                }
            );

            return c.json( {data: { $id: memberToUpdate.$id } });
        }
    );

export default app;