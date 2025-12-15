#!/bin/bash

API_KEY="AIzaSyCVO5alanuxdNMTpG77CJXJrgOC0yEbAdo"
MODEL="gemini-3-pro-image-preview"
PROMPT="Create a cute cartoon banana character with a friendly smile, big eyes, colorful and playful style, suitable for children. The banana should have arms and legs, and look very happy and cheerful."

echo "Generating cartoon banana with Gemini Nano Banana Pro..."
echo "Model: $MODEL"
echo "Prompt: $PROMPT"
echo ""

# Make the API request
RESPONSE=$(curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"contents\": [{
      \"parts\": [{
        \"text\": \"${PROMPT}\"
      }]
    }]
  }" \
  --max-time 120)

# Save response to file for processing
echo "$RESPONSE" > response.json

echo "Response received. Processing..."

# Use Node.js to parse and extract images
node -e "
const fs = require('fs');
const response = JSON.parse(fs.readFileSync('response.json', 'utf8'));

console.log('Full response:', JSON.stringify(response, null, 2));

if (response.error) {
  console.error('\\nAPI Error:', response.error.message);
  process.exit(1);
}

if (response.candidates && response.candidates.length > 0) {
  const parts = response.candidates[0].content.parts;
  let imageCount = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part.text) {
      console.log('\\nText:', part.text);
    }

    if (part.inlineData && part.inlineData.data) {
      const buffer = Buffer.from(part.inlineData.data, 'base64');
      const filename = \`cartoon-banana-\${imageCount}.png\`;
      fs.writeFileSync(filename, buffer);
      console.log(\`\\nImage \${imageCount + 1} saved as \${filename}\`);
      imageCount++;
    }
  }

  if (imageCount > 0) {
    console.log(\`\\nTotal images generated: \${imageCount}\`);
  } else {
    console.log('\\nNo images found in response.');
  }
} else {
  console.log('\\nNo candidates in response.');
}
"
