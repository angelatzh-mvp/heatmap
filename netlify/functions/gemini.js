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

  // 1. 使用正確的 Gemini 1.5 Flash 端點 (速度快且適合分析資料)
  // 2. 將 API Key 放在 URL 參數中
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          // 強制模型回傳純 JSON 格式
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();
    console.log("API response received:", JSON.stringify(data));

    if (data.error) {
        throw new Error(data.error.message);
    }

    // 擷取 Gemini 1.5 的回傳文字
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

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