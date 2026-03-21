export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt, mode } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error("GROQ_API_KEY manquante");
    return res.status(500).json({ error: "Clé API manquante" });
  }

  // Modèle selon le mode : chat léger avec 8b, exercices avec 70b
  const model = mode === "chat" ? "llama-3.1-8b-instant" : "llama-3.3-70b-versatile";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: mode === "chat" ? 0.9 : 0.4,
        max_tokens: mode === "chat" ? 200 : 4096,
        response_format: mode === "chat" ? undefined : { type: "json_object" }
      }),
    });

    const data = await response.json();
    console.log("Groq status:", response.status, "model:", model);
    if (data.error) {
      console.error("Groq error:", data.error);
      return res.status(500).json({ error: data.error.message });
    }
    const text = data.choices?.[0]?.message?.content || "";
    res.status(200).json({ text });
  } catch (e) {
    console.error("Erreur Groq:", e.message);
    res.status(500).json({ error: "Erreur Groq", detail: e.message });
  }
}
