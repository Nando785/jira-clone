import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc"

type ResponseType = InferResponseType<typeof client.api.tasks[":taskId"]["$patch"], 200>;
type RequestType = InferRequestType<typeof client.api.tasks[":taskId"]["$patch"]>;

/**
 * 
 * 
 * @returns {}
 */

export const useUpdateTask = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        ResponseType, 
        Error, 
        RequestType
    >({
        mutationFn: async ({ json, param }) => {
            // Send a POST request to create a new workspace
            const response = await client.api.tasks[":taskId"]["$patch"]({ json, param });

            if (!response.ok) { throw new Error("Failed to update task"); }

            return await response.json();
        },

        onSuccess: ({ data }) => {
            // Display toast success message
            toast.success("Task updated");

            // Invalidate the 'projects' query and trigger a refetch of the data to update UI
            queryClient.invalidateQueries({ queryKey: ["project-analytics"]});
            queryClient.invalidateQueries({ queryKey: ["workspace-analytics"]});
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            queryClient.invalidateQueries({ queryKey: ["task", data.$id] });
        },

        // Display toast error message
        onError: () => {
            toast.error("Failed to update task");
        }
    });

    return mutation;
};