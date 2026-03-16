import fetch from "node-fetch";

export async function handler(event, context) {
  console.log("==== Gemini Function Start ====");

  const GEMINI_KEY = process.env.GEMINI_KEY;
  console.log("GEMINI_KEY exists?", !!GEMINI_KEY);

  if (!GEMINI_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "GEMINI_KEY is missing in environment variables." })
    };
  }

  let prompt = "";
  try {
    const body = JSON.parse(event.body);
    prompt = body.prompt;
  } catch (e) {
    console.error("Failed to parse body:", e);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body." })
    };
  }

  console.log("Received prompt:", prompt);

  if (!prompt) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing prompt parameter." })
    };
  }

  try {
    // Gemini API endpoint (假設是 Google Bard / Gemini v1 endpoint)
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GEMINI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: {
          text: prompt
        },
        temperature: 0.7,
        maxOutputTokens: 500
      })
    });

    const data = await response.json();
    console.log("API response received:", data);

    // Gemini 回傳通常在 data.candidates[0].output
    const text = data?.candidates?.[0]?.output || "No output from Gemini API";

    return {
      statusCode: 200,
      body: JSON.stringify({ text })
    };

  } catch (err) {
    console.error("Error calling Gemini API:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to call Gemini API." })
    };
  }
}