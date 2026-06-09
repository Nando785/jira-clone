import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc"

type ResponseType = InferResponseType<typeof client.api.projects[":projectId"]["$patch"], 200>;
type RequestType = InferRequestType<typeof client.api.projects[":projectId"]["$patch"]>;

/**
 * Custom React hook for creating a project.
 * 
 * @returns {}
 */

export const useUpdateProject = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        ResponseType, 
        Error, 
        RequestType
    >({
        mutationFn: async ({ form, param }) => {
            // Send a POST request to create a new workspace
            const response = await client.api.projects[":projectId"]["$patch"]({ form, param });

            if (!response.ok) { throw new Error("Failed to update project"); }

            return await response.json();
        },

        onSuccess: ({ data }) => {
            // Display toast success message
            toast.success("Project updated");

            // Invalidate the 'projects' query and trigger a refetch of the data to update UI
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["project", data.$id] });
        },

        // Display toast error message
        onError: () => {
            toast.error("Failed to update project");
        }
    });

    return mutation;
};