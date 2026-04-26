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
  {
    squareId: "db-seed-loc-harborview",
    name: "Harborview Cafe",
    timezone: "America/New_York",
    address: {
      addressLine1: "88 Harbor Way",
      locality: "Boston",
      administrativeDistrictLevel1: "MA",
      postalCode: "02110",
      country: "US",
    },
  },
  {
    squareId: "db-seed-loc-midtown",
    name: "Midtown Cafe",
    timezone: "America/Chicago",
    address: {
      addressLine1: "320 Market Ave",
      locality: "Houston",
      administrativeDistrictLevel1: "TX",
      postalCode: "77002",
      country: "US",
    },
  },
  {
    squareId: "db-seed-loc-lakeside",
    name: "Lakeside Cafe",
    timezone: "America/Denver",
    address: {
      addressLine1: "17 Lakeside Dr",
      locality: "Denver",
      administrativeDistrictLevel1: "CO",
      postalCode: "80202",
      country: "US",
    },
  },
  {
    squareId: "db-seed-loc-uptown",
    name: "Uptown Cafe",
    timezone: "America/Los_Angeles",
    address: {
      addressLine1: "905 Hill St",
      locality: "Seattle",
      administrativeDistrictLevel1: "WA",
      postalCode: "98101",
      country: "US",
    },
  },
  {
    squareId: "db-seed-loc-airport",
    name: "Airport Cafe",
    timezone: "America/Phoenix",
    address: {
      addressLine1: "1 Terminal Loop",
      locality: "Phoenix",
      administrativeDistrictLevel1: "AZ",
      postalCode: "85034",
      country: "US",
    },
  },
  {
    squareId: "db-seed-loc-old-town",
    name: "Old Town Cafe",
    timezone: "America/New_York",
    address: {
      addressLine1: "404 Cobblestone Rd",
      locality: "Philadelphia",
      administrativeDistrictLevel1: "PA",
      postalCode: "19103",
      country: "US",
    },
  },
  {
    squareId: "db-seed-loc-bayside",
    name: "Bayside Cafe",
    timezone: "America/Los_Angeles",
    address: {
      addressLine1: "77 Bay St",
      locality: "San Francisco",
      administrativeDistrictLevel1: "CA",
      postalCode: "94111",
      country: "US",
    },
  },
] as const

export const SEED_CHANNELS = [
  {
    sourceName: "Square Point of Sale",
    displayName: "In-Store",
    lineItemChannel: "store",
    weight: 60,
  },
  { sourceName: "Square Online", displayName: "Online", lineItemChannel: "online", weight: 25 },
  { sourceName: "Square Kiosk", displayName: "Kiosk", lineItemChannel: "kiosk", weight: 10 },
  { sourceName: "Phone Order", displayName: "Phone", lineItemChannel: "phone", weight: 5 },
] as const

export const SEED_CATALOG_CATEGORIES = [
  { squareId: "db-seed-cat-coffee", name: "Coffee" },
  { squareId: "db-seed-cat-tea", name: "Tea" },
  { squareId: "db-seed-cat-bakery", name: "Bakery" },
  { squareId: "db-seed-cat-food", name: "Food" },
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
  {
    id: "db-seed-customer-001",
    givenName: "Alice",
    familyName: "Johnson",
    email: "alice@example.com",
    phone: "+12125550101",
  },
  {
    id: "db-seed-customer-002",
    givenName: "Bob",
    familyName: "Smith",
    email: "bob@example.com",
    phone: "+12125550102",
  },
  {
    id: "db-seed-customer-003",
    givenName: "Carol",
    familyName: "Williams",
    email: "carol@example.com",
    phone: "+12125550103",
  },
  {
    id: "db-seed-customer-004",
    givenName: "David",
    familyName: "Brown",
    email: "david@example.com",
    phone: "+12125550104",
  },
  {
    id: "db-seed-customer-005",
    givenName: "Emily",
    familyName: "Davis",
    email: "emily@example.com",
    phone: "+12125550105",
  },
] as const

export const SEED_ORDER_CONFIG = {
  dateRangeFrom: "2024-04-26",
  dateRangeTo: "2026-04-25",
  ordersPerDayPerLocation: { min: 3, max: 10 },
  lineItemsPerOrder: { min: 1, max: 4 },
  customerProbability: 0.6,
  discountProbability: 0.35,
  tipProbability: 0.5,
  tenderTypes: ["CASH", "CARD", "CARD", "CARD"] as const,
  cardBrands: ["VISA", "MASTERCARD", "AMEX", "DISCOVER"] as const,
  salesTaxPercentage: 8.5,
  fixedDiscountOptions: [100n, 150n, 200n] as const,
} as const

export const SEED_REFUND_CONFIG = {
  refundProbability: 0.03,
  refundReasons: [
    "Customer dissatisfied",
    "Wrong order",
    "Item quality issue",
    "Price adjustment",
  ] as const,
} as const

export const SEED_INVENTORY_CONFIG = {
  initialStockPerVariation: 200,
  wasteAdjustmentsPerWeek: { min: 2, max: 6 },
  wasteQuantityRange: { min: 1, max: 4 },
  transferAdjustmentsPerWeek: { min: 0, max: 2 },
  transferQuantityRange: { min: 5, max: 15 },
  receiptAdjustmentsPerWeek: { min: 1, max: 3 },
  receiptQuantityRange: { min: 50, max: 150 },
} as const

export const SEED_TEAM_MEMBER_ROLES = [
  {
    role: "barista-1",
    namePrefix: "Barista 1",
    jobTitle: "Barista",
    jobId: "db-seed-job-barista",
    hourlyWageCents: 1800n,
  },
  {
    role: "barista-2",
    namePrefix: "Barista 2",
    jobTitle: "Barista",
    jobId: "db-seed-job-barista",
    hourlyWageCents: 1800n,
  },
  {
    role: "cashier-1",
    namePrefix: "Cashier",
    jobTitle: "Cashier",
    jobId: "db-seed-job-cashier",
    hourlyWageCents: 1600n,
  },
  {
    role: "manager-1",
    namePrefix: "Manager",
    jobTitle: "Manager",
    jobId: "db-seed-job-manager",
    hourlyWageCents: 2800n,
  },
] as const

export const SEED_LABOR_CONFIG = {
  shiftPatterns: [
    { startHour: 6, endHour: 14 },
    { startHour: 10, endHour: 18 },
    { startHour: 14, endHour: 22 },
  ] as const,
  staffPerShiftPerLocation: { min: 1, max: 2 },
  workedShiftCompletionProbability: 0.95,
  declaredCashTipsRange: { min: 0, max: 1500 },
  paidBreakMinutes: 15,
  unpaidBreakMinutes: 30,
} as const
