export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: "Invalid request: messages must be an array" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY in Vercel env vars" });

    const SYSTEM_PROMPT = `
You are the website assistant for Silent Equity (AI systems studio).
You help visitors understand services, pricing, timelines, and next steps.

Rules:
- Be clear, direct, and helpful. Keep answers tight (2–8 sentences).
- Ask ONE follow-up question if needed.
- If asked about pricing, summarize the 3 offers on the site:
  SilentStart CRM Engine ($2,500), SilentScale Automation System ($4,500), SilentEmpire AI Infrastructure ($7,500),
  plus content subscriptions ($1,000/mo, $1,500/mo, $1,800/mo) and script system ($20/mo).
- If the user wants to hire, ask for: name + email + what they sell + current tools + timeline.
- Never say "No response". If something fails, apologize and ask them to retry.
`.trim();

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.4,
        max_tokens: 300,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages]
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      return res.status(500).json({ error: data?.error?.message || "OpenAI API error" });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(500).json({ error: "Empty reply from model" });

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}
