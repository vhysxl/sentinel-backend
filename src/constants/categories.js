export const INCOME_CATEGORIES = [
  'Sales',
  'B2B Sales'
];

export const EXPENSE_CATEGORIES = [
  'Payroll & Benefits',
  'Office Supplies',
  'Rent & Lease',
  'Utilities',
  'Marketing & Advertising',
  'Travel & Entertainment',
  'IT & Software',
  'Maintenance & Repair',
  'Taxes & Licenses',
  'Professional Fees',
  'Other Expense'
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

// Categories with no single identifiable company counterparty, on either side
// of the ledger: `Sales` is aggregate/retail revenue (no one buyer to name),
// `Payroll & Benefits` is paid to employees, not a vendor. Everything else —
// including `B2B Sales` — involves one specific company (the buyer or the
// supplier) and should reference a vendors row for it.
export const NO_VENDOR_CATEGORIES = ['Sales', 'Payroll & Benefits'];

// Single source of truth for the rule above, so validation (create) and the
// service layer (update, where the category may come from the existing row)
// can't drift apart on what "vendor required" means.
export const vendorRequiredForCategory = (category) => !NO_VENDOR_CATEGORIES.includes(category);
