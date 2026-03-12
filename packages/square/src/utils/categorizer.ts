// Item name ending with "STORE" (case-insensitive) = in-store sale
// Anything else = Uber Eats sale
export function detectChannel(itemName: string): "STORE" | "UBER" {
  return itemName.trimEnd().toUpperCase().endsWith("STORE") ? "STORE" : "UBER"
}
