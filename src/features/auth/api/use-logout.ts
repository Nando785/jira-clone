import { toast } from "sonner";

import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferResponseType } from "hono";

import { client } from "@/lib/rpc"

type ResponseType = InferResponseType<typeof client.api.auth.logout["$post"]>;

/**
 * Mutation hook for logging out the current user. On success, refreshes the router
 * and invalidates the "current" query to clear the active session from the cache.
 */

export const useLogout = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    const mutation = useMutation<
        ResponseType, 
        Error
    >({
        mutationFn: async () => {
            const response = await client.api.auth.logout["$post"]();

            if (!response.ok) {
                throw new Error("Failed to logout");
            }

            return await response.json();
        },
        onSuccess: () => {
            toast.success("Logout successful");
            router.refresh();
            
            queryClient.invalidateQueries();
        },
        onError: () => {
            toast.error("Failed to logout");
        }
    });

    return mutation;
};