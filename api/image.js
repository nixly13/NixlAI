// api/image.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { prompt, model = "gemini-2.5-flash-image" } = req.body || {};
  if (!prompt) return res.status(400).json({ error: { message: "Missing prompt" } });

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
             "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: { message: data.error?.message || "Image API error" } });

    const parts = data.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData || p.inline_data);
    const inline = imgPart?.inlineData || imgPart?.inline_data;
    const text = parts.find(p => p.text)?.text || "";

    if (!inline) return res.status(502).json({ error: { message: text || "No image returned (prompt may have been blocked)" } });

    res.json({ image: `data:${inline.mimeType || inline.mime_type || "image/png"};base64,${inline.data}`, text });
  } catch (e) {
    res.status(500).json({ error: { message: e.message } });
  }
}
