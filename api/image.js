export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: { message: "Method not allowed" } });
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: { message: "Missing prompt" } });

  const { CLOUDFLARE_ACCOUNT_ID: acc, CLOUDFLARE_API_TOKEN: token } = process.env;
  if (!acc || !token) return res.status(500).json({ error: { message: "Cloudflare keys are not set on the server" } });

  try {
    const r = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${acc}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, steps: 4 }),
      }
    );
    const data = await r.json();
    if (!r.ok || !data.result?.image) {
      return res.status(r.status || 502).json({ error: { message: data.errors?.[0]?.message || "Image generation failed" } });
    }
    res.json({ image: `data:image/jpeg;base64,${data.result.image}`, text: "" });
  } catch (e) {
    res.status(500).json({ error: { message: e.message } });
  }
}