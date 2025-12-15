const fs = require('fs');
const path = require('path');

// Create a simple cartoon banana SVG image
function generateCartoonBananaSVG() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="400" height="600" fill="#87CEEB"/>

  <!-- Banana body -->
  <path d="M 150 150 Q 130 200 140 280 Q 145 350 160 420 Q 170 450 200 460 Q 230 450 240 420 Q 255 350 260 280 Q 270 200 250 150 Q 220 120 200 120 Q 180 120 150 150 Z"
        fill="#FFD700" stroke="#FFA500" stroke-width="3"/>

  <!-- Banana highlight -->
  <ellipse cx="185" cy="200" rx="25" ry="80" fill="#FFEC8B" opacity="0.6"/>

  <!-- Left eye -->
  <ellipse cx="180" cy="240" rx="20" ry="25" fill="white"/>
  <circle cx="185" cy="245" r="12" fill="#333"/>
  <circle cx="188" cy="242" r="5" fill="white"/>

  <!-- Right eye -->
  <ellipse cx="220" cy="240" rx="20" ry="25" fill="white"/>
  <circle cx="215" cy="245" r="12" fill="#333"/>
  <circle cx="218" cy="242" r="5" fill="white"/>

  <!-- Smile -->
  <path d="M 170 280 Q 200 300 230 280"
        fill="none" stroke="#333" stroke-width="4" stroke-linecap="round"/>

  <!-- Rosy cheeks -->
  <circle cx="155" cy="270" r="15" fill="#FFB6C1" opacity="0.5"/>
  <circle cx="245" cy="270" r="15" fill="#FFB6C1" opacity="0.5"/>

  <!-- Brown spots -->
  <ellipse cx="165" cy="350" rx="12" ry="8" fill="#8B4513" opacity="0.4"/>
  <ellipse cx="230" cy="380" rx="10" ry="7" fill="#8B4513" opacity="0.4"/>
  <ellipse cx="190" cy="410" rx="8" ry="6" fill="#8B4513" opacity="0.4"/>

  <!-- Banana stem (top) -->
  <path d="M 200 120 Q 195 100 190 90 Q 188 85 192 82"
        fill="none" stroke="#8B4513" stroke-width="6" stroke-linecap="round"/>

  <!-- Arms -->
  <path d="M 140 300 Q 100 310 80 330"
        fill="none" stroke="#FFD700" stroke-width="15" stroke-linecap="round"/>
  <circle cx="80" cy="330" r="12" fill="#FFD700"/>

  <path d="M 260 300 Q 300 310 320 330"
        fill="none" stroke="#FFD700" stroke-width="15" stroke-linecap="round"/>
  <circle cx="320" cy="330" r="12" fill="#FFD700"/>

  <!-- Text -->
  <text x="200" y="550" font-family="Arial, sans-serif" font-size="32" font-weight="bold"
        text-anchor="middle" fill="#333">Happy Banana!</text>
</svg>`;

  const outputPath = path.join(__dirname, 'cartoon-banana.svg');
  fs.writeFileSync(outputPath, svg);
  console.log(`Cartoon banana SVG created successfully!`);
  console.log(`Saved to: ${outputPath}`);
  console.log(`\nNote: The Gemini API quota has been exceeded.`);
  console.log(`This is a locally generated SVG cartoon banana instead.`);
  console.log(`You can open the SVG file in any web browser to view it.`);
}

generateCartoonBananaSVG();
