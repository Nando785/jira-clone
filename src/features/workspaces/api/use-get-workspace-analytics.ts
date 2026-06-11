import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/rpc';
import { InferResponseType } from 'hono';

interface UseGetWorkspaceAnalyticsProps {
    workspaceId: string
}

export type WorkspaceAnalyticsResponseType = InferResponseType<typeof client.api.workspaces[":workspaceId"]["anayltics"]["$get"], 200>;

export const useGetWorkspaceAnalytics = ({
    workspaceId,
}: UseGetWorkspaceAnalyticsProps) => {
    const query = useQuery({
        queryKey: ["Workspace-analytics", workspaceId],
        queryFn: async () => {
            const response = await client.api.workspaces[":workspaceId"]["anayltics"].$get({
                param: { workspaceId },
            });

            if(!response.ok) {
                throw new Error("Failed to fetch Workspace analytics");
            }

            const { data } = await response.json();

            return data;
        },
    });

    return query;
}