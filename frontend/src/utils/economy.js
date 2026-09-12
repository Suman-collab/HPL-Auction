/**
 * Shared HPL Auction Economy & Rules Utility
 */

export function getBasePriceForYear(year) {
  const normalized = String(year || '').toLowerCase().trim();
  if (normalized.includes('1') || normalized.includes('first')) {
    return 1;
  }
  if (normalized.includes('2') || normalized.includes('second')) {
    return 1;
  }
  if (normalized.includes('3') || normalized.includes('third')) {
    return 2;
  }
  if (normalized.includes('4') || normalized.includes('fourth')) {
    return 2;
  }
  return 1;
}

/**
 * Bid increment tiers based on current price:
 * 1 - 10: +0.5
 * 10 - 20: +1.0
 * 20 - 50: +2.0
 * 50 - 100: +5.0
 */
export function getNextIncrement(currentPrice) {
  const price = Number(currentPrice) || 0;
  if (price < 10) {
    return 0.5;
  } else if (price < 20) {
    return 1.0;
  } else if (price < 50) {
    return 2.0;
  } else {
    return 5.0;
  }
}

/**
 * Pre-calculates the next valid bid amount
 */
export function getNextBidAmount(currentPrice) {
  const price = Number(currentPrice) || 0;
  const increment = getNextIncrement(price);
  return Math.round((price + increment) * 10) / 10;
}
