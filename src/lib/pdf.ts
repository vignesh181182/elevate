// PDF export — html2pdf.js is dynamically imported so it stays out of the main bundle
// (only loaded when a coach actually downloads a report).
export async function downloadElementPdf(el: HTMLElement, filename: string): Promise<void> {
  const { default: html2pdf } = await import('html2pdf.js');
  await html2pdf()
    .set({
      filename,
      margin: 0,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(el)
    .save();
}
