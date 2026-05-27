import { toast } from "sonner";

import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc"

type ResponseType = InferResponseType<typeof client.api.auth.login["$post"]>;
type RequestType = InferRequestType<typeof client.api.auth.login["$post"]>;

/**
 * Mutation hook for logging in a user. On success, refreshes the router
 * and invalidates the "current" query to force a re-fetch of the active session.
 */

export const useLogin = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    const mutation = useMutation<
        ResponseType, 
        Error, 
        RequestType
    >({
        mutationFn: async ({ json }) => {
            const response = await client.api.auth.login["$post"]({ json });

            if (!response.ok) {
                throw new Error("Failed to login");
            }
            
            return await response.json();
        },
        onSuccess: () => {
            toast.success("Login successful");
            // Refresh the router to update server components, then invalidate
            // the cache so any subscriber to "current" re-fetches the new session
            router.refresh();
            queryClient.invalidateQueries({ queryKey: ["current"] });
        },
        onError: () => {
            toast.error("Login failed");
        },
    });

    return mutation;
};