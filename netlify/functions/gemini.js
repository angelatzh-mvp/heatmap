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
  const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("Gemini Error:", data.error);
      return { statusCode: 500, body: JSON.stringify({ error: data.error.message }) };
    }

    // 檢查是否有被安全攔截
    if (!data.candidates || data.candidates.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ text: '{"insights":["數據分析受限"],"suggestions":["請檢查資料格式"]}' }) };
    }

    let text = data.candidates[0].content.parts[0].text;
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ text }) // 這裡直接回傳文字，由前端 parse
    };

  } catch (err) {
    console.error("Error calling Gemini API:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}