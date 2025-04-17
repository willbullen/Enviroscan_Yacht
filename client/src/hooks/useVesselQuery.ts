import { useQuery, QueryKey, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { useVessel } from "@/contexts/VesselContext";

/**
 * Custom hook for fetching vessel-specific data
 * @param endpoint The API endpoint to fetch data from
 * @param options Additional query options
 * @returns A query result with vessel-specific data
 */
export function useVesselQuery<TData = unknown>(
  endpoint: string,
  options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData> {
  const { currentVessel } = useVessel();
  
  return useQuery<TData>({
    queryKey: [endpoint, currentVessel.id],
    queryFn: async ({ queryKey }) => {
      const [url, vesselId] = queryKey;
      const response = await fetch(`${url}?vesselId=${vesselId}`);
      
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      
      return response.json() as Promise<TData>;
    },
    ...options
  });
}