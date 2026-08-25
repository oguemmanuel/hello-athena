const WOMEN_CATEGORIES = new Set([
  'ATHENA WOMEN', 'BLAZER', 'CORPRATE DRESS', '2PCS WEARS', 'TOPS', 'SKIRTS',
  'COAST DRESSES', 'JUMPSUIT', 'TROUSERS', 'BAGS', 'HEELS', 'PERFUMES', 'UNDERWEAWRS',
]);

const MEN_CATEGORIES = new Set([
  'ATHENA MEN', 'T-SHIRTS', 'MEN 2PCS', 'KAFTAN 2PCS', 'BLAZERS', 'SUITS', 'WINTER JACKET',
  'SHORT SLEEVES', 'LONG SLEEVES', 'SHORTS', 'JOGGERS', 'TROESERS', 'JEANS', 'UNDERWEARS', 'TIE', 'SHOES',
]);

const NEW_STOCK_CODE_CUTOFF = 96001;

/** Returns the discount percent (0-100) that applies to a product, based on its
 * category (men vs women side of the shop) and, for women's items, whether its
 * code marks it as new stock (>= 96001, 30% off) vs old stock (50% off). */
export function getDiscountPercent(category: string, code?: string | null): number {
  const cat = category?.trim();
  if (MEN_CATEGORIES.has(cat)) return 30;
  if (WOMEN_CATEGORIES.has(cat)) {
    const codeNum = code ? parseInt(code.toString().trim(), 10) : NaN;
    if (!isNaN(codeNum) && codeNum >= NEW_STOCK_CODE_CUTOFF) return 30;
    return 50;
  }
  return 0;
}

export function getDiscountedPrice(price: number, discountPercent: number): number {
  return Math.round(price * (1 - discountPercent / 100) * 100) / 100;
}
