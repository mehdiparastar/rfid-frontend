import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { isAuthError } from './api'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (err) => {
      if (isAuthError(err) && window.location.pathname !== "/signin") {
        window.location.assign('/signin')
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (err) => {
      if (isAuthError(err) && window.location.pathname !== "/signin") {
        window.location.assign('/signin')
      }
    },
  }),
  defaultOptions: {
    queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
    mutations: { retry: 0 },
  },
})