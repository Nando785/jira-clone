import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc"

type ResponseType = InferResponseType<typeof client.api.workspaces[":workspaceId"]["join"]["$post"], 200>;
type RequestType = InferRequestType<typeof client.api.workspaces[":workspaceId"]["join"]["$post"]>;

/**
 * 
 * 
 * @returns {Mutation}
 */

export const useJoinWorkspace = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        ResponseType, 
        Error, 
        RequestType
    >({
        mutationFn: async ({ param, json }) => {
            const response = await client.api.workspaces[":workspaceId"]["join"]["$post"]({ param, json });

            if (!response.ok) { throw new Error("Failed to join workspace"); }

            return await response.json();
        },

        onSuccess: ({ data }) => {
            // Display toat success message
            toast.success("Successfully joined workspace");

            // Invalidate the 'workspaces' query and trigger a refetch of the data to update UI
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            queryClient.invalidateQueries({ queryKey: ["workspace", data.$id] });
        },

        // Display toast error message
        onError: () => {
            toast.error("Failed to join workspace");
        }
    });

    return mutation;
};