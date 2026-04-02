export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt, mode } = req.body;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Clé API manquante" });

  const isChat = mode === "chat";
  const model  = isChat ? "llama-3.1-8b-instant" : "llama-3.3-70b-versatile";

  const messages = isChat
    ? [
        { role: "system", content: `Tu es Roki, un raton laveur aventurier rigolo et courageux. Tu parles à Léo, un enfant de 7-8 ans. Règles ABSOLUES : 1) Toujours positif et encourageant. 2) Jamais de violence, de peur ou de contenu inapproprié. 3) Réponses courtes (1-2 phrases max). 4) Style aventure amusante avec émojis. 5) Tu connais le prénom de Léo. 6) Jamais de guillemets autour de tes réponses. 7) Tu es un personnage de jeu, pas une IA.` },
        { role: "user", content: prompt }
      ]
    : [{ role: "user", content: prompt }];

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages,
        temperature: isChat ? 0.8 : 0.4,
        max_tokens: isChat ? 150 : 1200,
        response_format: isChat ? undefined : { type: "json_object" }
      }),
    });
    const data = await response.json();
    if (data.error) { console.error("Groq error:", data.error); return res.status(500).json({ error: data.error.message }); }
    const text = data.choices?.[0]?.message?.content || "";
    console.log("Groq OK model:", model, "mode:", mode, "chars:", text.length);
    res.status(200).json({ text });
  } catch (e) {
    console.error("Erreur:", e.message);
    res.status(500).json({ error: e.message });
  }
}
