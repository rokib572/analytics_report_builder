export const SEED_LOCATIONS = [
  {
    squareId: "db-seed-loc-downtown",
    name: "Downtown Cafe",
    timezone: "America/New_York",
    address: {
      addressLine1: "101 Main St",
      locality: "New York",
      administrativeDistrictLevel1: "NY",
      postalCode: "10001",
      country: "US",
    },
  },
  {
    squareId: "db-seed-loc-riverside",
    name: "Riverside Cafe",
    timezone: "America/Chicago",
    address: {
      addressLine1: "250 River Rd",
      locality: "Chicago",
      administrativeDistrictLevel1: "IL",
      postalCode: "60601",
      country: "US",
    },
  },
  {
    squareId: "db-seed-loc-sunset",
    name: "Sunset Cafe",
    timezone: "America/Los_Angeles",
    address: {
      addressLine1: "42 Sunset Blvd",
      locality: "Los Angeles",
      administrativeDistrictLevel1: "CA",
      postalCode: "90012",
      country: "US",
    },
  },
] as const

export const SEED_MENU_ITEMS = [
  { name: "Espresso", category: "Coffee", variationName: "Single", price: 350 },
  { name: "Espresso", category: "Coffee", variationName: "Double", price: 450 },
  { name: "Latte", category: "Coffee", variationName: "Small", price: 475 },
  { name: "Latte", category: "Coffee", variationName: "Medium", price: 550 },
  { name: "Latte", category: "Coffee", variationName: "Large", price: 625 },
  { name: "Cappuccino", category: "Coffee", variationName: "Regular", price: 500 },
  { name: "Americano", category: "Coffee", variationName: "Small", price: 375 },
  { name: "Americano", category: "Coffee", variationName: "Large", price: 475 },
  { name: "Cold Brew", category: "Coffee", variationName: "Regular", price: 525 },
  { name: "Green Tea", category: "Tea", variationName: "Hot", price: 350 },
  { name: "Green Tea", category: "Tea", variationName: "Iced", price: 400 },
  { name: "Chai Latte", category: "Tea", variationName: "Regular", price: 525 },
  { name: "Croissant", category: "Bakery", variationName: "Plain", price: 350 },
  { name: "Croissant", category: "Bakery", variationName: "Chocolate", price: 425 },
  { name: "Bagel", category: "Bakery", variationName: "Everything", price: 350 },
  { name: "Muffin", category: "Bakery", variationName: "Blueberry", price: 375 },
  { name: "Sandwich", category: "Food", variationName: "Turkey Club", price: 895 },
  { name: "Sandwich", category: "Food", variationName: "Veggie Wrap", price: 795 },
] as const

export const SEED_SQUARE_CUSTOMERS = [
  { id: "db-seed-customer-001", name: "Alice Johnson" },
  { id: "db-seed-customer-002", name: "Bob Smith" },
  { id: "db-seed-customer-003", name: "Carol Williams" },
  { id: "db-seed-customer-004", name: "David Brown" },
  { id: "db-seed-customer-005", name: "Emily Davis" },
] as const

export const SEED_ORDER_CONFIG = {
  dateRangeFrom: "2026-01-01",
  dateRangeTo: "2026-03-31",
  ordersPerDay: { min: 6, max: 18 },
  lineItemsPerOrder: { min: 1, max: 4 },
  customerProbability: 0.6,
  discountProbability: 0.35,
  tipProbability: 0.5,
  tenderTypes: ["CASH", "CARD", "CARD", "CARD"] as const,
  cardBrands: ["VISA", "MASTERCARD", "AMEX", "DISCOVER"] as const,
  salesTaxPercentage: 8.5,
  fixedDiscountOptions: [100n, 150n, 200n] as const,
} as const
