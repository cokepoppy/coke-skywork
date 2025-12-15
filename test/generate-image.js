const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API_KEY = 'AIzaSyB1RYJ72NGjqebPF6EVMtwHwLw0sKkMXVI';
const MODEL = 'gemini-2.0-flash-exp-image-generation';

function generateCartoonImage() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    const requestBody = {
      contents: [{
        parts: [{
          text: 'Generate a cute cartoon banana character with a friendly smile, colorful and playful style, high quality digital art'
        }]
      }]
    };

    console.log('Generating cartoon image with Gemini 2.0 Flash (Image Generation)...');

    // Use curl to make the request
    const curlCommand = `curl -X POST "${url}" -H "Content-Type: application/json" -d '${JSON.stringify(requestBody)}' --max-time 120`;

    const responseText = execSync(curlCommand, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
    const data = JSON.parse(responseText);
    console.log('Response received:', JSON.stringify(data, null, 2));

    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];

      if (candidate.content && candidate.content.parts) {
        for (let i = 0; i < candidate.content.parts.length; i++) {
          const part = candidate.content.parts[i];

          if (part.inlineData && part.inlineData.data) {
            // Save the image
            const buffer = Buffer.from(part.inlineData.data, 'base64');
            const mimeType = part.inlineData.mimeType || 'image/png';
            const extension = mimeType.split('/')[1] || 'png';
            const outputPath = path.join(__dirname, `cartoon-banana-${i}.${extension}`);
            fs.writeFileSync(outputPath, buffer);
            console.log(`Image ${i + 1} saved successfully to: ${outputPath}`);
          }
        }
      }
    } else {
      console.log('No images were generated');
    }
  } catch (error) {
    console.error('Error generating image:', error.message);
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }
    console.error(error.stack);
  }
}

generateCartoonImage();
