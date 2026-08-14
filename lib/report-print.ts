import { printHtmlDocument } from './print';

export type ReportSaleItem = { quantity: number; price: number; product: { name: string; code?: string | null } };
export type ReportSale = { receiptNumber: string; createdAt: string; items: ReportSaleItem[] };
export type MonthlyReport = {
  totalRevenue: number;
  totalTransactions: number;
  totalItemsSold: number;
  sales: ReportSale[];
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function printMonthlyReport(report: MonthlyReport, monthLabel: string, year: number) {
  type Row = { date: string; receiptNumber: string; name: string; code?: string | null; quantity: number; price: number };

  const rows: Row[] = [];
  for (const sale of report.sales) {
    for (const item of sale.items) {
      rows.push({
        date: sale.createdAt,
        receiptNumber: sale.receiptNumber,
        name: item.product.name,
        code: item.product.code,
        quantity: item.quantity,
        price: item.price,
      });
    }
  }
  rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const rowsHtml = rows.map(r => `
    <tr>
      <td>${new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
      <td class="mono">${escapeHtml(r.receiptNumber)}</td>
      <td>${escapeHtml(r.name)}</td>
      <td class="mono">${r.code ? escapeHtml(r.code) : '—'}</td>
      <td class="num">${r.quantity}</td>
      <td class="num">GHS ${r.price.toFixed(2)}</td>
      <td class="num">GHS ${(r.quantity * r.price).toFixed(2)}</td>
    </tr>
  `).join('');

  const generatedAt = new Date().toLocaleString();

  const content = `
    <div class="header">
      <div class="shop-name">HELLO ATHENA</div>
      <div class="sub">Timeless sophistication, modern style for men, women &amp; Kids.</div>
      <div class="sub">Tel: 0502146152 &nbsp;·&nbsp; @helloathenagh</div>
    </div>
    <h1>Items Sold Report — ${escapeHtml(monthLabel)} ${year}</h1>
    <div class="generated">Generated ${generatedAt}</div>

    <div class="stats">
      <div class="stat">
        <div class="stat-label">Total Revenue</div>
        <div class="stat-value">GHS ${report.totalRevenue.toFixed(2)}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Transactions</div>
        <div class="stat-value">${report.totalTransactions}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Items Sold</div>
        <div class="stat-value">${report.totalItemsSold}</div>
      </div>
    </div>

    <h2>All Items Sold</h2>
    <table>
      <thead>
        <tr><th>Date</th><th>Receipt #</th><th>Product</th><th>Code</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Subtotal</th></tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="7" style="text-align:center;padding:24px;color:#888">No sales recorded this month.</td></tr>'}
      </tbody>
    </table>
  `;

  const styles = `
    @page { margin: 16mm; size: A4; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 0; }
    .header { text-align: center; margin-bottom: 18px; }
    .shop-name { font-size: 22px; font-weight: 700; letter-spacing: 1px; }
    .sub { font-size: 11px; color: #444; margin-top: 2px; }
    h1 { font-size: 16px; text-align: center; margin: 18px 0 2px; border-top: 1px solid #ccc; padding-top: 14px; }
    .generated { text-align: center; font-size: 11px; color: #666; margin-bottom: 20px; }
    .stats { display: flex; gap: 14px; margin-bottom: 26px; }
    .stat { flex: 1; border: 1px solid #ccc; border-radius: 6px; padding: 12px 14px; text-align: center; }
    .stat-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .stat-value { font-size: 18px; font-weight: 700; }
    h2 { font-size: 13px; margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
    th, td { border-bottom: 1px solid #ddd; padding: 5px 7px; text-align: left; }
    th { font-size: 10px; text-transform: uppercase; color: #555; border-bottom: 2px solid #999; }
    .num { text-align: right; }
    .mono { font-family: monospace; color: #555; }
    tr { page-break-inside: avoid; }
  `;
  printHtmlDocument(`Items Sold - ${escapeHtml(monthLabel)} ${year}`, styles, content);
}
