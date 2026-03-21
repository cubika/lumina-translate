import * as pdfjsLib from 'pdfjs-dist'

// Use bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

/**
 * Extract all text from a PDF file, page by page.
 * Returns concatenated text with page breaks as double newlines.
 */
export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    // Group text items into lines based on y-coordinate
    let lastY: number | null = null
    let line = ''
    const lines: string[] = []

    for (const item of content.items) {
      if (!('str' in item)) continue
      const y = Math.round(item.transform[5])

      if (lastY !== null && Math.abs(y - lastY) > 2) {
        // New line
        lines.push(line.trim())
        line = ''
      }
      line += item.str + ' '
      lastY = y
    }
    if (line.trim()) lines.push(line.trim())

    pages.push(lines.filter(Boolean).join('\n'))
  }

  return pages.join('\n\n')
}
