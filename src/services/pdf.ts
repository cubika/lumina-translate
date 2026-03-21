import * as pdfjsLib from 'pdfjs-dist'

// Use bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

/** Extract text from a single PDF page */
function extractPageText(content: { items: unknown[] }): string {
  let lastY: number | null = null
  let line = ''
  const lines: string[] = []

  for (const item of content.items) {
    if (!('str' in (item as Record<string, unknown>))) continue
    const textItem = item as { str: string; transform: number[] }
    const y = Math.round(textItem.transform[5])

    if (lastY !== null && Math.abs(y - lastY) > 2) {
      lines.push(line.trim())
      line = ''
    }
    line += textItem.str + ' '
    lastY = y
  }
  if (line.trim()) lines.push(line.trim())

  return lines.filter(Boolean).join('\n')
}

/**
 * Extract all text from a PDF file as a single string.
 */
export async function extractPdfText(file: File): Promise<string> {
  const pages = await extractPdfPages(file)
  return pages.join('\n\n')
}

/**
 * Extract text from a PDF file, returning an array of page texts.
 * Used for chunked translation of large PDFs.
 */
export async function extractPdfPages(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = extractPageText(content)
    if (text) pages.push(text)
  }

  return pages
}
