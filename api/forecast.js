import { config } from "dotenv";

config();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { q, lat, lon } = req.query;
    const API_KEY = process.env.API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "API key not configured" });
    }

    if (!q && (!lat || !lon)) {
      return res
        .status(400)
        .json({
          error: "Either city name (q) or coordinates (lat, lon) required",
        });
    }

    let query = q ? `q=${encodeURIComponent(q)}` : `lat=${lat}&lon=${lon}`;
    const url = `https://api.openweathermap.org/data/2.5/forecast?${query}&appid=${API_KEY}&units=metric`;

    const response = await fetch(url);
    const text = await response.text();

    if (!response.ok) {
      console.error("Upstream forecast error", {
        status: response.status,
        statusText: response.statusText,
        body: text,
      });
      return res.status(response.status).json({
        error: "Upstream forecast error",
        status: response.status,
        message: response.statusText,
        details: safeParseJson(text),
      });
    }

    const data = safeParseJson(text);
    res.status(200).json(data);
  } catch (error) {
    console.error("Forecast handler failed", error);
    res.status(500).json({ error: "Failed to fetch forecast data" });
  }
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (_) {
    return { raw: text };
  }
}
