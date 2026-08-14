export function printHtmlDocument(title: string, styles: string, bodyHtml: string) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const cleanup = () => {
    if (iframe.parentNode) document.body.removeChild(iframe);
  };

  const doc = iframe.contentDocument;
  if (!doc) { cleanup(); return; }

  doc.open();
  doc.write(`<html><head><title>${title}</title><style>${styles}</style></head><body>${bodyHtml}</body></html>`);
  doc.close();

  const win = iframe.contentWindow;
  if (!win) { cleanup(); return; }

  win.onafterprint = cleanup;
  setTimeout(() => {
    win.focus();
    win.print();
    // Fallback in case afterprint never fires (e.g. print dialog cancelled without notice)
    setTimeout(cleanup, 15000);
  }, 200);
}
