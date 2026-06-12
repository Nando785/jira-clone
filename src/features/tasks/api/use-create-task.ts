import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc"

type ResponseType = InferResponseType<typeof client.api.tasks["$post"], 200>;
type RequestType = InferRequestType<typeof client.api.tasks["$post"]>;

/**
 * 
 * 
 * @returns {}
 */

export const useCreateTask = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        ResponseType, 
        Error, 
        RequestType
    >({
        mutationFn: async ({ json }) => {
            // Send a POST request to create a new workspace
            const response = await client.api.tasks["$post"]({ json });

            if (!response.ok) { throw new Error("Failed to create task"); }

            return await response.json();
        },

        onSuccess: () => {
            // Display toast success message
            toast.success("Task created");

            // Invalidate the 'projects' query and trigger a refetch of the data to update UI
            queryClient.invalidateQueries({ queryKey: ["project-analytics"]});
            queryClient.invalidateQueries({ queryKey: ["workspace-analytics"]});
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },

        // Display toast error message
        onError: () => {
            toast.error("Failed to create task");
        }
    });

    return mutation;
};