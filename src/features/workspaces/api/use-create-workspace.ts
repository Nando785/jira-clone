import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc"

type ResponseType = InferResponseType<typeof client.api.workspaces["$post"]>;
type RequestType = InferRequestType<typeof client.api.workspaces["$post"]>;

/**
 * Custom React hook for creating a workspace.
 * 
 * This hook returns a mutation object from the `useMutation` hook provided by the `@tanstack/react-query` library.
 * The mutation object can be used to trigger the creation of a new workspace and handle its result.
 * 
 * @returns {Mutation} The mutation object, which encapsulates the functions and properties for creating a workspace.
 */

export const useCreateWorkspace = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        ResponseType, 
        Error, 
        RequestType
    >({
        mutationFn: async ({ form }) => {
            // Send a POST request to create a new workspace
            const response = await client.api.workspaces["$post"]({ form });

            if (!response.ok) { throw new Error("Failed to create workspace"); }

            return await response.json();
        },

        onSuccess: () => {
            // Display toat success message
            toast.success("Workspace created");

            // Invalidate the 'workspaces' query and trigger a refetch of the data to update UI
            // Used to update workspace count in navbar after creating a new workspace
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
        },

        // Display toast error message
        onError: () => {
            toast.error("Failed to create workspace");
        }
    });

    return mutation;
};