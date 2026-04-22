/**
 * Formats a numeric amount with a currency code.
 * @param {number|string} amount - The numeric value to format.
 * @param {string} currency - The ISO 4217 currency code (default: 'UGX').
 * @returns {string} Formatted currency string.
 */
export const formatCurrency = (amount, currency = 'UGX') => {
  if (amount === undefined || amount === null) return '—'
  const val = Number(amount)
  return `${currency} ${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

/**
 * Formats a numeric amount into a short human-readable string (K, M, B).
 * @param {number|string} amount - The numeric value to format.
 * @param {string} currency - The ISO 4217 currency code (default: 'UGX').
 * @returns {string} Short formatted currency string.
 */
export const formatCurrencyShort = (amount, currency = 'UGX') => {
  if (amount === undefined || amount === null) return '—'
  const val = Number(amount)
  
  if (val >= 1000000) {
    return `${currency} ${(val / 1000000).toFixed(1)}M`
  }
  if (val >= 1000) {
    return `${currency} ${(val / 1000).toFixed(1)}K`
  }
  
  return `${currency} ${val.toLocaleString()}`
}
