import { printHtmlDocument } from './print';

export type ReceiptItem = { name: string; price: number; quantity: number; originalPrice?: number | null; discountPercent?: number | null };
export type ReceiptData = {
  receiptNumber: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  items: ReceiptItem[];
  voided?: boolean;
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function printReceipt(sale: ReceiptData) {
  const paymentLabel = sale.paymentMethod === 'card' ? 'Card' : sale.paymentMethod === 'momo' ? 'Momo' : 'Cash';
  const date = new Date(sale.createdAt).toLocaleString();

  const itemsHtml = sale.items.map(item => `
    <div style="margin-bottom:4px">
      <div style="font-weight:600;font-size:11px">${escapeHtml(item.name)}</div>
      ${item.discountPercent ? `<div style="font-size:9px">Was GHS ${(item.originalPrice ?? item.price).toFixed(2)} (-${item.discountPercent}%)</div>` : ''}
      <div class="row" style="font-size:10px">
        <span>${item.quantity} x GHS ${item.price.toFixed(2)}</span>
        <span>GHS ${(item.quantity * item.price).toFixed(2)}</span>
      </div>
    </div>
  `).join('');

  const content = `
    ${sale.voided ? `<div class="center bold" style="border:2px solid #c00;color:#c00;padding:3px 0;margin-bottom:6px;">*** VOID - NOT VALID ***</div>` : ''}
    <div class="center bold" style="font-size:14px;margin-bottom:2px">HELLO ATHENA</div>
    <div class="center" style="font-size:9px;margin-bottom:2px">Timeless sophistication, modern style</div>
    <div class="center" style="font-size:9px;margin-bottom:2px">for men, women &amp; Kids.</div>
    <div class="center" style="font-size:9px;margin-bottom:2px">Tel: 0502146152</div>
    <div class="center" style="font-size:9px;margin-bottom:6px">@helloathenagh</div>
    <div class="divider"></div>
    <div class="row" style="margin-bottom:2px;font-size:10px"><span>Receipt:</span><span>${escapeHtml(sale.receiptNumber)}</span></div>
    <div class="row" style="margin-bottom:6px;font-size:10px"><span>Date:</span><span>${date}</span></div>
    <div class="divider"></div>
    ${itemsHtml}
    <div class="divider"></div>
    <div class="row bold" style="font-size:12px"><span>TOTAL</span><span>GHS ${sale.total.toFixed(2)}</span></div>
    <div class="row" style="margin-top:2px;font-size:10px"><span>Payment</span><span>${paymentLabel}</span></div>
    <div class="divider" style="margin:6px 0"></div>
    <div class="center bold" style="font-size:10px">*** ALL SALES ARE FINAL - NO REFUNDS ***</div>
    <div class="divider" style="margin:6px 0"></div>
    <div class="center" style="font-size:10px">Thank you for shopping at</div>
    <div class="center bold" style="font-size:11px">Hello Athena!</div>
  `;

  const styles = `@page{margin:0;size:58mm auto}*{box-sizing:border-box}body{font-family:monospace;font-size:11px;width:54mm;margin:0;padding:4px;color:#000;background:#fff}.center{text-align:center}.bold{font-weight:bold}.divider{border-top:1px dashed #000;margin:4px 0}.row{display:flex;justify-content:space-between;margin:2px 0}`;
  printHtmlDocument(`Receipt${sale.voided ? ' (VOID)' : ''}`, styles, content);
}
