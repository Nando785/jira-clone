import { useQuery } from '@tanstack/react-query';

import { client } from '@/lib/rpc';
import { InferResponseType } from 'hono';

interface UseGetProjectnAnalyticsProps {
    projectId: string
}

export type ProjectAnalyticsResponseType = InferResponseType<typeof client.api.projects[":projectId"]["anayltics"]["$get"], 200>;

export const useGetProjectAnalytics = ({
    projectId,
}: UseGetProjectnAnalyticsProps) => {
    const query = useQuery({
        queryKey: ["project-analytics", projectId],
        queryFn: async () => {
            const response = await client.api.projects[":projectId"]["anayltics"].$get({
                param: { projectId },
            });

            if(!response.ok) {
                throw new Error("Failed to fetch project analytics");
            }

            const { data } = await response.json();

            return data;
        },
    });

    return query;
}