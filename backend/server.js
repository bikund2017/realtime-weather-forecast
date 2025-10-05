import express from "express";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.API_KEY;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));

app.get("/api/weather", async (req, res) => {
  try {
    const { q, lat, lon } = req.query;
    let query = q ? `q=${q}` : `lat=${lat}&lon=${lon}`;

    const url = `https://api.openweathermap.org/data/2.5/weather?${query}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);
    const text = await response.text();
    if (!response.ok) {
      console.error("Upstream weather error", {
        status: response.status,
        statusText: response.statusText,
        body: text,
      });
      return res.status(response.status).json({
        error: "Upstream weather error",
        status: response.status,
        message: response.statusText,
        details: safeParseJson(text),
      });
    }
    const data = safeParseJson(text);
    res.json(data);
  } catch (error) {
    console.error("Weather handler failed", error);
    res.status(500).json({ error: "Failed to fetch weather" });
  }
});

app.get("/api/forecast", async (req, res) => {
  try {
    const { q, lat, lon } = req.query;
    let query = q ? `q=${q}` : `lat=${lat}&lon=${lon}`;

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
    res.json(data);
  } catch (error) {
    console.error("Forecast handler failed", error);
    res.status(500).json({ error: "Failed to fetch forecast" });
  }
});

app.get("/api", (req, res) => {
  res.json({ ok: true });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (_) {
    return { raw: text };
  }
}

app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
