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

  // 修正點 1: 使用 v1beta 端點，這對於 gemini-2.5-flash 較為穩定
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        // 修正點 2: 移除引發錯誤的 responseMimeType，改由後端手動清理文字
        generationConfig: { 
          temperature: 0.7,
          maxOutputTokens: 1000 
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("Gemini API Error Detail:", data.error);
      return { 
        statusCode: response.status || 500, 
        body: JSON.stringify({ error: data.error.message }) 
      };
    }

    // 檢查是否有被安全過濾或其他原因導致無內容
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ text: '{"insights":["分析暫時無法產生"],"suggestions":["請嘗試選擇其他時段或稍後再試"]}' }) 
      };
    }

    let text = data.candidates[0].content.parts[0].text;
    
    // 修正點 3: 手動清理 Markdown 標籤，確保前端拿到的是純淨的 JSON 字串
    text = text.replace(/```json/gi, "").replace(/```/gi, "").trim();

    console.log("Cleaned Response Text:", text);

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*" 
      },
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