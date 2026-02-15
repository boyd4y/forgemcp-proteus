import { GoogleGenAI } from "@google/genai";
import { createGeminiClient } from "./config";

async function runHealthCheck() {
  console.log("🩺 Starting Health Check...\n");

  // 1. Initialize Client
  const apiKey = process.env.GEMINI_API_KEY;
  const { client, authType, authSource } = createGeminiClient(apiKey);

  console.log(`🔑 Auth Mode: ${authType}`);
  console.log(`SOURCE: ${authSource}\n`);

  // 2. Test LLM Connectivity
  try {
    process.stdout.write("Testing LLM (gemini-2.0-flash)... ");
    const response = await client.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: "Ping" }] }],
    });
    
    const text = typeof response.text === 'function' ? (response as any).text() : response.text;

    if (text) {
      console.log("✅ OK");
    } else {
      console.log("❌ FAILED (Empty Response)");
    }
  } catch (error: any) {
    console.log("❌ FAILED");
    console.error(`   Error: ${error.message}`);
  }

  // 3. Test Image Model Availability
  try {
    process.stdout.write("Testing Image Model Access (List Models)... ");
    
    const listResp = await client.models.list();
    const models = (listResp as any).models || [];
    
    if (models.length > 0) {
       console.log(`✅ OK (Found ${models.length} models)`);
    } else {
       console.log("⚠️  NOTICE (No models listed)");
       console.log("   (This is common with Vertex AI ADC if no custom models are deployed. Standard models are still accessible.)");
    }

  } catch (error: any) {
    console.log("❌ FAILED (List Models)");
    console.error(`   Error: ${error.message}`);
  }

  console.log("\nDone.");
}

runHealthCheck();
