// netlify/functions/gemini.js
const fetch = require("node-fetch");

exports.handler = async function (event, context) {
  try {
    let params;

    // 如果是 GET，就從 queryStringParameters 取值
    // 如果是 POST，就從 body 取值
    if (event.httpMethod === "GET") {
      params = event.queryStringParameters || {};
    } else if (event.httpMethod === "POST") {
      params = event.body ? JSON.parse(event.body) : {};
    } else {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    // 這裡示範用一個必填參數 siteId
    const siteId = params.siteId;
    if (!siteId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing siteId parameter" }),
      };
    }

    // 你的 Gemini API 呼叫
    const response = await fetch(`https://api.gemini.com/insight?site=${siteId}`, {
      headers: {
        "Authorization": `Bearer ${process.env.GEMINI_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error", detail: error.message }),
    };
  }
};