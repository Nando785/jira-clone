import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc"

type ResponseType = InferResponseType<typeof client.api.projects["$post"], 200>;
type RequestType = InferRequestType<typeof client.api.projects["$post"]>;

/**
 * Custom React hook for creating a project.
 * 
 * @returns {}
 */

export const useCreateProject = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        ResponseType, 
        Error, 
        RequestType
    >({
        mutationFn: async ({ form }) => {
            // Send a POST request to create a new workspace
            const response = await client.api.projects["$post"]({ form });

            if (!response.ok) { throw new Error("Failed to create project"); }

            return await response.json();
        },

        onSuccess: () => {
            // Display toast success message
            toast.success("Project created");

            // Invalidate the 'projects' query and trigger a refetch of the data to update UI
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },

        // Display toast error message
        onError: () => {
            toast.error("Failed to create project");
        }
    });

    return mutation;
};