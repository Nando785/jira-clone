import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";

import { WorkspaceIdSettingsPage } from "./client";

const WorkspaceIdJoinPage = async () => {
    const user = await getCurrent();
    if (!user) { redirect("/sign-in");}

    return ( <WorkspaceIdSettingsPage /> );
}

export default WorkspaceIdJoinPage;
