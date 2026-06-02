import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc"

type ResponseType = InferResponseType<typeof client.api.members[":memberId"]["$patch"], 200>;
type RequestType = InferRequestType<typeof client.api.members[":memberId"]["$patch"]>;

/**
 * 
 * 
 * @returns {Mutation}
 */

export const useUpdateMember = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation<
        ResponseType, 
        Error, 
        RequestType
    >({
        mutationFn: async ({ param, json }) => {
            const response = await client.api.members[":memberId"]["$patch"]({ param, json });

            if (!response.ok) { throw new Error("Failed to update member"); }

            return await response.json();
        },

        onSuccess: () => {
            // Display toat success message
            toast.success("Member updated");

            // Invalidate the 'workspaces' query and trigger a refetch of the data to update UI
            queryClient.invalidateQueries({ queryKey: ["members"] });
        },

        // Display toast error message
        onError: () => {
            toast.error("Failed to update member");
        }
    });

    return mutation;
};