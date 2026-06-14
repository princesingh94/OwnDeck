const fs = require("fs");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");

const extractTextFromFile = async (filePath, mimeType) => {
  if (mimeType === "application/pdf") {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || "";
  }

  const { data } = await Tesseract.recognize(filePath, "eng", {
    logger: () => null
  });
  return data.text || "";
};

module.exports = { extractTextFromFile };
