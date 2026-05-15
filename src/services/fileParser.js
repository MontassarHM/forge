import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Worker servi en local depuis /public
pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;

const extractPDF = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n";
  }
  return text;
};

const extractDOCX = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const extractText = async (file) => await file.text();

export const parseFile = async (file) => {
  const ext = file.name.split(".").pop().toLowerCase();
  try {
    switch (ext) {
      case "pdf":
        return await extractPDF(file);
      case "docx":
        return await extractDOCX(file);
      case "txt":
      case "md":
        return await extractText(file);
      default:
        throw new Error(`Format non supporté: ${ext}`);
    }
  } catch (error) {
    console.error(`Erreur parsing ${file.name}:`, error);
    throw error;
  }
};

export const parseMultipleFiles = async (files) => {
  const contents = await Promise.all(
    files.map(async (file) => {
      const text = await parseFile(file);
      return `=== ${file.name} ===\n${text}\n`;
    }),
  );
  return contents.join("\n\n");
};
