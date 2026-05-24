import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface ParsedFileContent {
  content: string;
  fileName: string;
  fileType: string;
}

/**
 * Parse DOCX file and extract text/JSON content
 */
export async function parseDocxFile(file: File): Promise<ParsedFileContent> {
  try {
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
 * Parse PDF file and extract text/JSON content
 */
export async function parsePdfFile(file: File): Promise<ParsedFileContent> {
  try {
    const arrayBuffer = await file.arrayBuffer();
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
 * Extract JSON from parsed file content
 */
export function extractJSONFromContent(content: string): any {
  try {
    // Try to find JSON object in content
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Try to find JSON array in content
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }
    
    // Try to parse entire content as JSON
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`No valid JSON found in file content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse file (DOCX, PDF, or JSON) and extract test data
 */
export async function parseTestFile(file: File): Promise<any> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  let content: string;

  if (fileExtension === 'docx') {
    const parsed = await parseDocxFile(file);
    content = parsed.content;
  } else if (fileExtension === 'pdf') {
    const parsed = await parsePdfFile(file);
    content = parsed.content;
  } else if (fileExtension === 'json') {
    content = await file.text();
  } else {
    throw new Error(`Unsupported file type: ${fileExtension}`);
  }

  return extractJSONFromContent(content);
}

/**
 * Validate test data structure
 */
export function validateTestStructure(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  const required = ['testName', 'duration', 'questions'];
  return required.every(field => field in data) && 
         Array.isArray(data.questions) && 
         data.questions.length > 0;
}
