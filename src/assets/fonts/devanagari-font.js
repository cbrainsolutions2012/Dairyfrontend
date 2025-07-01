// Devanagari font support for jsPDF
// This module provides font loading utilities for displaying Marathi text in PDFs

// Text rendering utility for Devanagari script
export const renderDevanagariText = (text, fontSize = 12, fontWeight = 'normal') => {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set font properties with Devanagari font family
      const fontFamily = 'Noto Sans Devanagari, Arial Unicode MS, Mangal, sans-serif';
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

      // Measure text dimensions
      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      const textHeight = fontSize * 1.2; // Add some padding

      // Set canvas size
      canvas.width = Math.ceil(textWidth + 4);
      canvas.height = Math.ceil(textHeight + 4);

      // Re-set font after canvas resize (canvas reset)
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = '#000000';
      ctx.textBaseline = 'middle';

      // Draw text
      ctx.fillText(text, 2, textHeight / 2 + 2);

      // Convert to data URL
      const dataURL = canvas.toDataURL('image/png');

      resolve({
        dataURL,
        width: canvas.width,
        height: canvas.height,
        textWidth,
        textHeight
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Utility to check if text contains Devanagari characters
export const isDevanagariText = (text) => {
  // Devanagari Unicode range: U+0900–U+097F
  const devanagariRegex = /[\u0900-\u097F]/;
  return devanagariRegex.test(text);
};

// Enhanced text rendering for PDF
export const addDevanagariTextToPDF = async (pdf, text, x, y, options = {}) => {
  try {
    const { fontSize = 12, fontWeight = 'normal', align = 'left' } = options;

    if (!isDevanagariText(text)) {
      // If it's not Devanagari text, use regular PDF text
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', fontWeight);

      let finalX = x;
      if (align === 'center') {
        const textWidth = pdf.getTextWidth(text);
        finalX = x - textWidth / 2;
      } else if (align === 'right') {
        const textWidth = pdf.getTextWidth(text);
        finalX = x - textWidth;
      }

      pdf.text(text, finalX, y);
      return { width: pdf.getTextWidth(text), height: fontSize };
    }

    // For Devanagari text, render as image
    const renderedText = await renderDevanagariText(text, fontSize, fontWeight);

    // Calculate position based on alignment
    let finalX = x;
    if (align === 'center') {
      finalX = x - renderedText.textWidth / 2;
    } else if (align === 'right') {
      finalX = x - renderedText.textWidth;
    }

    // Add image to PDF
    pdf.addImage(renderedText.dataURL, 'PNG', finalX, y - renderedText.textHeight / 2, renderedText.textWidth, renderedText.textHeight);

    return {
      width: renderedText.textWidth,
      height: renderedText.textHeight
    };
  } catch (error) {
    console.error('Error adding Devanagari text to PDF:', error);
    // Fallback to regular text
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontWeight);
    pdf.text(text, x, y);
    return { width: pdf.getTextWidth(text), height: fontSize };
  }
};
