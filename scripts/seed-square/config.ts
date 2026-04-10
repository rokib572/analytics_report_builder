// ---------------------------------------------------------------------------
// Fake data definitions for seeding the Square sandbox account
// ---------------------------------------------------------------------------

export const CATALOG_ITEMS = [
  {
    name: "Espresso",
    variations: [
      { name: "Single", price: 350 },
      { name: "Double", price: 450 },
    ],
  },
  {
    name: "Latte",
    variations: [
      { name: "Small", price: 475 },
      { name: "Medium", price: 550 },
      { name: "Large", price: 625 },
    ],
  },
  {
    name: "Cappuccino",
    variations: [{ name: "Regular", price: 500 }],
  },
  {
    name: "Americano",
    variations: [
      { name: "Small", price: 375 },
      { name: "Large", price: 475 },
    ],
  },
  {
    name: "Cold Brew",
    variations: [
      { name: "Regular", price: 525 },
      { name: "Large", price: 625 },
    ],
  },
  {
    name: "Mocha",
    variations: [{ name: "Regular", price: 575 }],
  },
  {
    name: "Croissant",
    variations: [
      { name: "Plain", price: 350 },
      { name: "Chocolate", price: 425 },
    ],
  },
  {
    name: "Bagel",
    variations: [
      { name: "Plain", price: 300 },
      { name: "Everything", price: 350 },
    ],
  },
  {
    name: "Muffin",
    variations: [
      { name: "Blueberry", price: 375 },
      { name: "Banana Nut", price: 375 },
    ],
  },
  {
    name: "Sandwich",
    variations: [
      { name: "Turkey Club", price: 895 },
      { name: "Veggie Wrap", price: 795 },
    ],
  },
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
  tenderTypes: ["CASH", "CARD", "CARD", "CARD"] as const,
  cardBrands: ["VISA", "MASTERCARD", "AMEX", "DISCOVER"] as const,
}

export const INVENTORY_CONFIG = {
  initialStock: { min: 25, max: 200 },
  state: "IN_STOCK" as const,
  batchSize: 100,
}
