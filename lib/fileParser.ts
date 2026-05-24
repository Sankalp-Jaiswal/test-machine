'use client';

export interface ParsedFileContent {
  content: string;
  fileName: string;
  fileType: string;
}

/**
 * Parse JSON file and extract content
 */
export async function parseJsonFile(file: File): Promise<ParsedFileContent> {
  try {
    const text = await file.text();
    return {
      content: text,
      fileName: file.name,
      fileType: 'json',
    };
  } catch (error) {
    throw new Error(`Failed to parse JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse DOCX file - requires dynamic import
 */
export async function parseDocxFile(file: File): Promise<ParsedFileContent> {
  try {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    return {
      content: result.value,
      fileName: file.name,
      fileType: 'docx',
    };
  } catch (error) {
    throw new Error(`Failed to parse DOCX file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse PDF file - requires dynamic import
 */
export async function parsePdfFile(file: File): Promise<ParsedFileContent> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    const arrayBuffer = await file.arrayBuffer();
    
    // Set up PDF worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      text += pageText + '\n';
    }
    
    return {
      content: text,
      fileName: file.name,
      fileType: 'pdf',
    };
  } catch (error) {
    throw new Error(`Failed to parse PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generic file parser that routes to appropriate parser
 */
export async function parseTestFile(file: File): Promise<any> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

  if (fileExtension === 'json') {
    const parsed = await parseJsonFile(file);
    return JSON.parse(parsed.content);
  } else if (fileExtension === 'docx') {
    const parsed = await parseDocxFile(file);
    return JSON.parse(parsed.content);
  } else if (fileExtension === 'pdf') {
    const parsed = await parsePdfFile(file);
    return JSON.parse(parsed.content);
  } else {
    throw new Error(`Unsupported file type: ${fileExtension}. Supported types: json, docx, pdf`);
  }
}

/**
 * Validate test structure
 */
export function validateTestStructure(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  if (!data.testName || typeof data.testName !== 'string') return false;
  if (!Array.isArray(data.questions)) return false;
  if (data.questions.length === 0) return false;

  // Validate each question
  return data.questions.every((q: any) => {
    return q.id !== undefined &&
      q.text &&
      q.options && Array.isArray(q.options) && q.options.length === 4 &&
      q.correctAnswer &&
      q.section &&
      q.difficulty;
  });
}
