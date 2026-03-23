export const isAccountAdmin = (role: string): boolean => role === "owner" || role === "admin"

export const isSystemAdmin = (role: string): boolean => role === "system_admin"
