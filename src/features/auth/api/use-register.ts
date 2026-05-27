import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<typeof client.api.auth.register["$post"]>;
type RequestType = InferRequestType<typeof client.api.auth.register["$post"]>;

/**
 * Mutation hook for registering a new user. The register endpoint automatically
 * creates a session on success, so the onSuccess handler mirrors useLogin —
 * refreshing the router and invalidating the "current" query.
 */


export const useRegister = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    const mutation = useMutation<
        ResponseType, 
        Error, 
        RequestType
    >({
        mutationFn: async ({ json }) => {
            const response = await client.api.auth.register["$post"]({ json });

            if (!response.ok) {
                throw new Error("Failed to register");
            }

            return await response.json();
        },
        onSuccess: () => {
            toast.success("Registered");
            // Refresh the router to update server components, then invalidate
            // the cache so any subscriber to "current" re-fetches the new session
            router.refresh();
            queryClient.invalidateQueries({ queryKey: ["current"] });
        },
        onError: () => {
            toast.error("Failed to register");
        }
    });

    return mutation;
};