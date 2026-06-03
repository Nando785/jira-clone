import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc"
import { useRouter } from "next/navigation";

type ResponseType = InferResponseType<typeof client.api.workspaces[":workspaceId"]["reset-invite-code"]["$post"], 200>;
type RequestType = InferRequestType<typeof client.api.workspaces[":workspaceId"]["reset-invite-code"]["$post"]>;

/**
 * 
 * 
 * @returns {Mutation}
 */

export const useResetInviteCode = () => {
    const router = useRouter();
    const queryClient = useQueryClient();

    const mutation = useMutation<
        ResponseType, 
        Error, 
        RequestType
    >({
        mutationFn: async ({ param }) => {
            const response = await client.api.workspaces[":workspaceId"]["reset-invite-code"]["$post"]({ param });

            if (!response.ok) { throw new Error("Failed to reset invite code"); }

            return await response.json();
        },

        onSuccess: ({ data }) => {
            // Display toat success message
            toast.success("Invite code reset");
            router.refresh();

            // Invalidate the 'workspaces' query and trigger a refetch of the data to update UI
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            queryClient.invalidateQueries({ queryKey: ["workspace", data.$id] });
        },

        // Display toast error message
        onError: () => {
            toast.error("Failed to reset invite code");
        }
    });

    return mutation;
};