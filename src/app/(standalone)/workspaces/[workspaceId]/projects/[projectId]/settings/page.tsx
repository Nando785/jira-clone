import { getCurrent } from "@/features/auth/queries";
import { EditProjectForm } from "@/features/projects/components/edit-project-form";
import { redirect } from "next/navigation";
import { ProjectIdSettingsClient } from "./client";

const projectIdSettingsPage = async () => {
    const user = await getCurrent();
    if (!user){ redirect("/sign-in"); }

    return ( <ProjectIdSettingsClient /> );
};

export default projectIdSettingsPage;