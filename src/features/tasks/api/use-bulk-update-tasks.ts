import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc"

type ResponseType = InferResponseType<typeof client.api.tasks["bulk-update"]["$patch"], 200>;
type RequestType = InferRequestType<typeof client.api.tasks["bulk-update"]["$patch"]>;

/**
 * 
 * 
 * @returns {}
 */

export const useBulkUpdateTasks = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        ResponseType, 
        Error, 
        RequestType
    >({
        mutationFn: async ({ json }) => {
            // Send a POST request to create a new workspace
            const response = await client.api.tasks["bulk-update"]["$patch"]({ json });

            if (!response.ok) { throw new Error("Failed to update tasks"); }

            return await response.json();
        },

        onSuccess: () => {
            // Display toast success message
            toast.success("Tasks updated");

            // Invalidate the 'projects' query and trigger a refetch of the data to update UI
            queryClient.invalidateQueries({ queryKey: ["project-analytics"]});
            queryClient.invalidateQueries({ queryKey: ["workspace-analytics"]});
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },

        // Display toast error message
        onError: () => {
            toast.error("Failed to update tasks");
        }
    });

    return mutation;
};