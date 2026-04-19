const normalizeApiBaseUrl = (value: string | undefined) => {
  const trimmed = value?.trim()

  if (!trimmed || trimmed === "/") {
    return ""
  }

  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed
}

export const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL)
