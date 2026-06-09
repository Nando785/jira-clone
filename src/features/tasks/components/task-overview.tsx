import { PencilIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { snakeCaseToTitleCase } from "@/lib/utils";
import { DottedSeparator } from "@/components/dotted-separator";

import { TaskDate } from "./task-date";
import { OverViewProperty } from "./overview-property";

import { PopulatedTask, Task } from "../types";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { useEditTaskModal } from "../hooks/use-edit-task-modal";

interface TaskOverviewProps {
    task: PopulatedTask;
};

export const TaskOverview = ({
    task
}: TaskOverviewProps) => {
    const { open } = useEditTaskModal();

    return (
        <div className="flex flex-col gap-y-4 col-span-1">
            <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold">Overview</p>
                    <Button 
                        onClick={() => open(task.$id)}
                        size="sm" 
                        variant="secondary"
                    >
                        <PencilIcon className="size-4 mr-2"/>
                        Edit
                    </Button>
                </div>

                <DottedSeparator className="my-4" />

                <div className=" flex flex-col gap-y-4">
                    <OverViewProperty label="Assignee">
                        <MemberAvatar 
                            name={task.assignee.name}
                            className="size-6"
                        />
                    </OverViewProperty>

                    <OverViewProperty label="Due Date">
                        <TaskDate value={task.due_date} className="text-sm font-medium"/>
                    </OverViewProperty>

                    <OverViewProperty label="Status">
                        <Badge variant={task.status}>
                            {snakeCaseToTitleCase(task.status)}
                        </Badge>
                    </OverViewProperty>
                </div>
            </div>
        </div>
    );
};
