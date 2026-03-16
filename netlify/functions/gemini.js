import fetch from "node-fetch";

export async function handler(event, context) {
  console.log("==== Gemini Function Start ====");

  const GEMINI_KEY = process.env.GEMINI_KEY;
  if (!GEMINI_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "GEMINI_KEY is missing." })
    };
  }

  let prompt = "";
  try {
    const body = JSON.parse(event.body);
    prompt = body.prompt;
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body." }) };
  }

  // 修正點 1: 改用 v1 版本並確保模型名稱格式正確 (gemini-1.5-flash)
  const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        // 修正點 2: 先移除 responseMimeType，部分舊版環境會因為此參數噴錯
        // 我們改在 Prompt 裡加強要求
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800
        }
      })
    });

    const data = await response.json();
    
    if (data.error) {
        console.error("Gemini API Error Detail:", data.error);
        throw new Error(data.error.message);
    }

    // 擷取內容
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // 修正點 3: 額外處理可能出現的 Markdown 程式碼區塊 (```json ... ```)
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    };

  } catch (err) {
    console.error("Error calling Gemini API:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}