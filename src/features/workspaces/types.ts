import { Models } from "node-appwrite";

export type Workspace = Models.Document & {
    name: string;
    imageUrl: string;
    invite_code: string;
    user_id: string;
};
