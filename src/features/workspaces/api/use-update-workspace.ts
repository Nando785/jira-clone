import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc"

type ResponseType = InferResponseType<typeof client.api.workspaces[":workspaceId"]["$patch"], 200>; // Ignore failure case, error handled by mutation
type RequestType = InferRequestType<typeof client.api.workspaces[":workspaceId"]["$patch"]>;

/**
 *
 * 
 * @returns {Mutation}
 */

export const useUpdateWorkspace = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        ResponseType, 
        Error, 
        RequestType
    >({
        mutationFn: async ({ form, param }) => {
            // Send a POST request to create a new workspace
            const response = await client.api.workspaces[":workspaceId"]["$patch"]({ form, param });

            if (!response.ok) { throw new Error("Failed to update workspace"); }

            return await response.json();
        },

        onSuccess: ({ data }) => {
            // Display toast success message
            toast.success("Workspace updated");

            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            queryClient.invalidateQueries({ queryKey: ["workspace", data.$id] });
        },

        // Display toast error message
        onError: () => {
            toast.error("Failed to create workspace");
        }
    });

    return mutation;
};