// ---------------------------------------------------------------------------
// Fake data definitions for seeding the Square sandbox account
// ---------------------------------------------------------------------------

export const CATEGORIES = ["Coffee", "Tea", "Bakery", "Food"] as const

export type CategoryName = (typeof CATEGORIES)[number]

export const CATALOG_ITEMS: ReadonlyArray<{
  name: string
  category: CategoryName
  variations: ReadonlyArray<{ name: string; price: number }>
  modifierListKeys?: ReadonlyArray<string>
}> = [
  {
    name: "Espresso",
    category: "Coffee",
    variations: [
      { name: "Single", price: 350 },
      { name: "Double", price: 450 },
    ],
    modifierListKeys: ["milk"],
  },
  {
    name: "Latte",
    category: "Coffee",
    variations: [
      { name: "Small", price: 475 },
      { name: "Medium", price: 550 },
      { name: "Large", price: 625 },
    ],
    modifierListKeys: ["milk", "syrup"],
  },
  {
    name: "Cappuccino",
    category: "Coffee",
    variations: [{ name: "Regular", price: 500 }],
    modifierListKeys: ["milk"],
  },
  {
    name: "Americano",
    category: "Coffee",
    variations: [
      { name: "Small", price: 375 },
      { name: "Large", price: 475 },
    ],
  },
  {
    name: "Cold Brew",
    category: "Coffee",
    variations: [
      { name: "Regular", price: 525 },
      { name: "Large", price: 625 },
    ],
  },
  {
    name: "Mocha",
    category: "Coffee",
    variations: [{ name: "Regular", price: 575 }],
    modifierListKeys: ["milk"],
  },
  {
    name: "Green Tea",
    category: "Tea",
    variations: [
      { name: "Hot", price: 350 },
      { name: "Iced", price: 400 },
    ],
  },
  {
    name: "Chai Latte",
    category: "Tea",
    variations: [{ name: "Regular", price: 525 }],
    modifierListKeys: ["milk"],
  },
  {
    name: "Croissant",
    category: "Bakery",
    variations: [
      { name: "Plain", price: 350 },
      { name: "Chocolate", price: 425 },
    ],
  },
  {
    name: "Bagel",
    category: "Bakery",
    variations: [
      { name: "Plain", price: 300 },
      { name: "Everything", price: 350 },
    ],
  },
  {
    name: "Muffin",
    category: "Bakery",
    variations: [
      { name: "Blueberry", price: 375 },
      { name: "Banana Nut", price: 375 },
    ],
  },
  {
    name: "Sandwich",
    category: "Food",
    variations: [
      { name: "Turkey Club", price: 895 },
      { name: "Veggie Wrap", price: 795 },
    ],
  },
]

export const MODIFIER_LISTS: ReadonlyArray<{
  key: string
  name: string
  selectionType: "SINGLE" | "MULTIPLE"
  modifiers: ReadonlyArray<{ name: string; price: number }>
}> = [
  {
    key: "milk",
    name: "Milk Type",
    selectionType: "SINGLE",
    modifiers: [
      { name: "Whole", price: 0 },
      { name: "Skim", price: 0 },
      { name: "Oat", price: 75 },
      { name: "Almond", price: 75 },
    ],
  },
  {
    key: "syrup",
    name: "Syrup",
    selectionType: "MULTIPLE",
    modifiers: [
      { name: "Vanilla", price: 50 },
      { name: "Caramel", price: 50 },
      { name: "Hazelnut", price: 50 },
    ],
  },
]

export const DISCOUNTS: ReadonlyArray<
  | { key: string; name: string; type: "FIXED_PERCENTAGE"; percentage: string }
  | { key: string; name: string; type: "FIXED_AMOUNT"; amount: number }
> = [
  { key: "happy-hour", name: "Happy Hour 10% Off", type: "FIXED_PERCENTAGE", percentage: "10.0" },
  { key: "loyalty-15", name: "Loyalty 15% Off", type: "FIXED_PERCENTAGE", percentage: "15.0" },
  { key: "dollar-off", name: "$1 Off", type: "FIXED_AMOUNT", amount: 100 },
]

export const TAXES: ReadonlyArray<{ key: string; name: string; percentage: string }> = [
  { key: "sales-tax", name: "Sales Tax", percentage: "8.5" },
]

export const CUSTOMERS = [
  { givenName: "Alice", familyName: "Johnson", email: "alice.j@example.com" },
  { givenName: "Bob", familyName: "Smith", email: "bob.smith@example.com" },
  { givenName: "Carol", familyName: "Williams", email: "carol.w@example.com" },
  { givenName: "David", familyName: "Brown", email: "david.b@example.com" },
  { givenName: "Emily", familyName: "Davis", email: "emily.d@example.com" },
  { givenName: "Frank", familyName: "Garcia", email: "frank.g@example.com" },
  { givenName: "Grace", familyName: "Martinez", email: "grace.m@example.com" },
  { givenName: "Henry", familyName: "Taylor", email: "henry.t@example.com" },
  { givenName: "Irene", familyName: "Anderson", email: "irene.a@example.com" },
  { givenName: "James", familyName: "Thomas", email: "james.t@example.com" },
]

export const ORDER_CONFIG = {
  dateRangeFrom: "2026-01-01",
  dateRangeTo: "2026-03-31",
  ordersPerDay: { min: 5, max: 20 },
  lineItemsPerOrder: { min: 1, max: 4 },
  customerProbability: 0.6,
  discountProbability: 0.35,
  taxProbability: 0.9,
  modifierProbability: 0.5,
  tenderTypes: ["CASH", "CARD", "CARD", "CARD"] as const,
  cardBrands: ["VISA", "MASTERCARD", "AMEX", "DISCOVER"] as const,
}

export const INVENTORY_CONFIG = {
  initialStock: { min: 25, max: 200 },
  state: "IN_STOCK" as const,
  batchSize: 100,
}

export const SEED_OUTPUT_FILE = "seed-output.json"

export type SeedOutput = {
  createdAt: string
  dateRangeFrom: string
  dateRangeTo: string
  squareOrderIds: string[]
}
