import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc"

type ResponseType = InferResponseType<typeof client.api.projects[":projectId"]["$delete"], 200>;
type RequestType = InferRequestType<typeof client.api.projects[":projectId"]["$delete"]>;

/**
 * Custom React hook for creating a project.
 * 
 * @returns {}
 */

export const useDeleteProject = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        ResponseType, 
        Error, 
        RequestType
    >({
        mutationFn: async ({ param }) => {
            // Send a POST request to create a new workspace
            const response = await client.api.projects[":projectId"]["$delete"]({ param });

            if (!response.ok) { throw new Error("Failed to delete project"); }

            return await response.json();
        },

        onSuccess: ({ data }) => {
            // Display toast success message
            toast.success("Project deleted");

            // Invalidate the 'projects' query and trigger a refetch of the data to update UI
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["project", data.$id] });
        },

        // Display toast error message
        onError: () => {
            toast.error("Failed to delete project");
        }
    });

    return mutation;
};