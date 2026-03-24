import { hc } from "hono/client"
import type { AppType } from "@analytics/api"

let _selectedCustomerId: string | null = null
let _selectedAccountId: string | null = null

export const setApiCustomerId = (id: string | null) => {
  _selectedCustomerId = id
}

export const getApiCustomerId = () => _selectedCustomerId

export const setApiAccountId = (id: string | null) => {
  _selectedAccountId = id
}

export const getApiAccountId = () => _selectedAccountId

export const apiClient = hc<AppType>(import.meta.env.VITE_API_URL, {
  init: { credentials: "include" },
  fetch: (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers)
    if (_selectedCustomerId) {
      headers.set("X-Customer-Id", _selectedCustomerId)
    }
    if (_selectedAccountId) {
      headers.set("X-Account-Id", _selectedAccountId)
    }
    return fetch(input, { ...init, headers })
  },
})
