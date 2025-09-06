import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables from your .env file
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log("--- Starting Gemini API Test ---");
console.log("Loaded API Key:", apiKey ? `${apiKey.substring(0, 4)}...` : "API Key is UNDEFINED or MISSING in .env file!");

if (!apiKey) {
  console.error("Error: Make sure GEMINI_API_KEY is set in your .env file.");
  process.exit(1); // Exit the script
}

const genAI = new GoogleGenerativeAI(apiKey);

async function runTest() {
  try {
    // **THIS IS THE FIX:** Changed the model name to the latest version.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "What are the top 3 benefits of learning to code?";
    console.log("\nSending prompt:", `"${prompt}"`);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("\n✅ SUCCESS! AI Response Received:");
    console.log("---------------------------------");
    console.log(text);
    console.log("---------------------------------");
    console.log("\nConclusion: Your API key and Google Cloud project are configured correctly!");

  } catch (error) {
    console.error("\n❌ FAILURE! The API call failed.");
    console.error("---------------------------------");
    console.error("This means the problem is with your API Key or Google Cloud project setup (Billing, API not enabled, etc.).");
    console.error("Here is the specific error from Google:");
    console.error(error);
    console.error("---------------------------------");
  }
}

runTest();