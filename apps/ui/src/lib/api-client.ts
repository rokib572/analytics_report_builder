import { hc } from "hono/client"
import type { AppType } from "@analytics/api"
import { apiBaseUrl } from "./api-base-url"

let _assumedCustomerId: string | null = localStorage.getItem("assumedCustomerId")

export const setAssumedCustomerId = (id: string | null) => {
  _assumedCustomerId = id
  if (id) {
    localStorage.setItem("assumedCustomerId", id)
  } else {
    localStorage.removeItem("assumedCustomerId")
  }
}

export const getAssumedCustomerId = () => _assumedCustomerId

export const apiClient = hc<AppType>(apiBaseUrl, {
  init: { credentials: "include" },
  fetch: (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers)
    if (_assumedCustomerId) {
      headers.set("X-Assume-Customer-Id", _assumedCustomerId)
    }
    return fetch(input, { ...init, headers })
  },
})
