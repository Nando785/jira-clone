import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc"

type ResponseType = InferResponseType<typeof client.api.members[":memberId"]["$delete"], 200>;
type RequestType = InferRequestType<typeof client.api.members[":memberId"]["$delete"]>;

/**
 * 
 * 
 * @returns {Mutation}
 */

export const useDeleteMember = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        ResponseType, 
        Error, 
        RequestType
    >({
        mutationFn: async ({ param }) => {
            const response = await client.api.members[":memberId"]["$delete"]({ param });

            if (!response.ok) { throw new Error("Failed to delete member"); }

            return await response.json();
        },

        onSuccess: () => {
            // Display toat success message
            toast.success("Member deleted");

            // Invalidate the 'workspaces' query and trigger a refetch of the data to update UI
            queryClient.invalidateQueries({ queryKey: ["members"] });
        },

        // Display toast error message
        onError: () => {
            toast.error("Failed to delete member");
        }
    });

    return mutation;
};