import { useWalletsStore } from '@/stores/walletsStore'
import { useTokensStore } from '@/stores/tokensStore'
import { useWatchlistStore } from '@/stores/watchlistStore'
import { useTokenWatchlistStore } from '@/stores/tokenWatchlistStore'
import { useSavedFiltersStore } from '@/stores/savedFiltersStore'
import { useAlertsStore } from '@/stores/alertsStore'
import { useTelegramStore } from '@/stores/telegramStore'

export function resetDashboardStores() {
  useWalletsStore.getState().reset()
  useTokensStore.getState().reset()
  useWatchlistStore.getState().reset()
  useTokenWatchlistStore.getState().reset()
  useSavedFiltersStore.getState().reset()
  useAlertsStore.getState().reset()
  useTelegramStore.getState().reset()
}

/**
 * After signing in without leaving the page (the auth modal), loads the account's own data in
 * place of the empty guest copies, so an action waiting on the sign-in (adding a token, say)
 * checks against the real watchlist.
 */
export async function reloadAccountStores() {
  void useSavedFiltersStore.getState().load()
  void useAlertsStore.getState().load()
  void useTelegramStore.getState().load()
  await Promise.allSettled([
    useWatchlistStore.getState().fetchWatchlist(true),
    useTokenWatchlistStore.getState().fetchTokens(true),
  ])
}
