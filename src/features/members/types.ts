import { Models } from "node-appwrite"

export enum MemberRole {
    ADMIN = "ADMIN",
    MEMBER = "MEMBER",
};

export type Member = Models.Document & {
    workspace_id: string;
    user_id: string;
    role: MemberRole;
};

export type PopulatedMember = Member & {
  name: string;
  email: string;
};