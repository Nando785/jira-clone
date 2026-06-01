import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { getWorkspaceInfo } from "@/features/workspaces/queries";
import { JoinWorkspaceForm } from "@/features/workspaces/components/join-workspace-form";

interface WorkspaceIdJoinPageProps {
    params: { 
        workspaceId: string 
    };
};

const WorkspaceIdJoinPage = async ({
    params
}: WorkspaceIdJoinPageProps) => {
    const user = await getCurrent();
    if (!user) { redirect("/sign-in");}

    const paramData = await params;
    const initialValues = await getWorkspaceInfo({
        workspaceId: paramData.workspaceId
    });

    if (!initialValues) {
        redirect("/");
    }

    return (
        <div className="w-full lg:max-w-xl">
            <JoinWorkspaceForm initialValues={initialValues} />
        </div>
    );
}

export default WorkspaceIdJoinPage;
