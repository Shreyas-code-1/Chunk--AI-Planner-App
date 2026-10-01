import { useQuery } from '@tanstack/react-query';

import { revenueCatConfig } from './config';
import { fetchChunkOffering, type ChunkOffering, type OfferingError } from './offerings';

export const chunkOfferingQueryOptions = {
  queryKey: ['billing', 'offering', revenueCatConfig.offeringIdentifier] as const,
  queryFn: fetchChunkOffering,
  retry: false,
  // Keep the SDK package objects intact instead of structurally copying cached data.
  structuralSharing: false,
};

/** Fetches only when consumed; screens receive data, loading/error state, and refetch. */
export function useOffering() {
  return useQuery<ChunkOffering, OfferingError>(chunkOfferingQueryOptions);
}
