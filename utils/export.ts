import html2canvas from 'html2canvas';
import { PPTPage, PPTElement } from '../types';

export async function exportToPNG(canvasElement: HTMLElement): Promise<void> {
  try {
    const canvas = await html2canvas(canvasElement, {
      width: 1920,
      height: 1080,
      scale: 1,
      backgroundColor: '#ffffff',
      logging: false
    });

    const link = document.createElement('a');
    link.download = `ppt-slide-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Export to PNG failed:', error);
    throw error;
  }
}

export function exportToHTML(pptData: PPTPage): void {
  const html = generateHTML(pptData);
  const blob = new Blob([html], { type: 'text/html' });
  const link = document.createElement('a');
  link.download = `ppt-slide-${Date.now()}.html`;
  link.href = URL.createObjectURL(blob);
  link.click();
}

function generateHTML(pptData: PPTPage): string {
  const elementsHTML = pptData.elements
    .map(element => generateElementHTML(element))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PPT Slide</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #2a2a2a;
      padding: 20px;
    }

    .ppt-container {
      position: relative;
      width: 1920px;
      height: 1080px;
      background: ${pptData.backgroundColor || '#FFFFFF'};
      ${pptData.backgroundImage ? `background-image: url(${pptData.backgroundImage});` : ''}
      background-size: cover;
      background-position: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    }

    .element {
      position: absolute;
    }

    .text-element {
      padding: 4px;
      overflow: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .shape-element {
      width: 100%;
      height: 100%;
    }

    .shape-element.circle {
      border-radius: 50%;
    }

    .shape-element.ellipse {
      border-radius: 50%;
    }

    .image-element {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    @media (max-width: 1920px) {
      .ppt-container {
        transform: scale(calc(100vw / 1920));
        transform-origin: top left;
      }
    }
  </style>
</head>
<body>
  <div class="ppt-container">
    ${elementsHTML}
  </div>
</body>
</html>`;
}

function generateElementHTML(element: PPTElement): string {
  const baseStyle = `
    left: ${element.x}px;
    top: ${element.y}px;
    width: ${element.width}px;
    height: ${element.height}px;
    z-index: ${element.zIndex};
    ${element.rotation ? `transform: rotate(${element.rotation}deg);` : ''}
  `.trim();

  switch (element.type) {
    case 'text': {
      const textStyle = `
        font-size: ${element.fontSize}px;
        font-family: ${element.fontFamily};
        font-weight: ${element.fontWeight};
        color: ${element.color};
        text-align: ${element.textAlign};
        line-height: ${element.lineHeight || 1.4};
        ${element.letterSpacing ? `letter-spacing: ${element.letterSpacing}px;` : ''}
      `.trim();

      return `<div class="element text-element" style="${baseStyle}; ${textStyle}">${escapeHTML(element.content)}</div>`;
    }

    case 'shape': {
      const shapeClass = element.shapeType === 'circle' || element.shapeType === 'ellipse'
        ? ` ${element.shapeType}`
        : '';
      const shapeStyle = `
        background-color: ${element.backgroundColor};
        ${element.borderColor ? `border-color: ${element.borderColor};` : ''}
        ${element.borderWidth ? `border-width: ${element.borderWidth}px; border-style: solid;` : ''}
        ${element.borderRadius ? `border-radius: ${element.borderRadius}px;` : ''}
        ${element.opacity !== undefined ? `opacity: ${element.opacity};` : ''}
      `.trim();

      return `<div class="element"><div class="shape-element${shapeClass}" style="${baseStyle}; ${shapeStyle}"></div></div>`;
    }

    case 'image': {
      const imageStyle = element.opacity !== undefined
        ? `opacity: ${element.opacity};`
        : '';

      return `<div class="element" style="${baseStyle}"><img src="${element.src}" class="image-element" style="${imageStyle}" alt="PPT Image"></div>`;
    }

    case 'chart': {
      if (element.fallbackImage) {
        return `<div class="element" style="${baseStyle}"><img src="${element.fallbackImage}" class="image-element" alt="${element.chartType} Chart"></div>`;
      }
      return `<div class="element" style="${baseStyle}; display: flex; align-items: center; justify-content: center; background: #f5f5f5; border: 1px solid #ddd;"><div>${element.chartType.toUpperCase()} Chart</div></div>`;
    }

    default:
      return '';
  }
}

function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function exportToJSON(pptData: PPTPage): void {
  const json = JSON.stringify(pptData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  link.download = `ppt-data-${Date.now()}.json`;
  link.href = URL.createObjectURL(blob);
  link.click();
}
