const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");

const API_KEY = "AIzaSyBu1dY2GoimsGVNjPVUD28p6QbC5RABps0";

async function main() {
  const ai = new GoogleGenAI({
    apiKey: API_KEY
  });

  const prompt = "Create a cute cartoon banana character with a friendly smile, big eyes, colorful and playful style, suitable for children. The banana should have arms and legs, and look very happy and cheerful.";

  console.log('Generating cartoon banana image with Gemini Nano Banana Pro...');
  console.log('Prompt:', prompt);
  console.log('');

  try {
    // Note: Using gemini-2.5-flash-image (Nano Banana) as it's currently available
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
    });

    console.log('Response received!');
    console.log('');

    let imageCount = 0;

    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        console.log('Text response:', part.text);
        console.log('');
      } else if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        const filename = `cartoon-banana-${imageCount}.png`;
        fs.writeFileSync(filename, buffer);
        console.log(`Image saved as ${filename}`);
        imageCount++;
      }
    }

    if (imageCount === 0) {
      console.log('No images were generated in the response.');
    } else {
      console.log(`\nTotal images generated: ${imageCount}`);
    }
  } catch (error) {
    console.error('Error generating image:', error.message);
    if (error.response) {
      console.error('Error details:', JSON.stringify(error.response, null, 2));
    }
    console.error('\nFull error:', error);
  }
}

main();
