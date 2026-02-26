import { useState, useEffect, useCallback } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CHILD_NAME = "Lucas";
const SUPABASE_URL = "https://enppydwndwwbmnueuuup.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Gf2rnCwwTS7rfmUQ8K_VmQ_RkC1bJZt";
const GEMINI_MODEL = "gemini-1.5-flash";

// ─── SUPABASE HELPERS ────────────────────────────────────────────────────────
async function supabaseLoad() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/lucas_data?id=eq.lucas&select=data`, {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    const rows = await res.json();
    if (rows && rows.length > 0 && rows[0].data) return JSON.parse(rows[0].data);
    return null;
  } catch { return null; }
}

async function supabaseSave(profile) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/lucas_data`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({ id: "lucas", data: JSON.stringify(profile), updated_at: new Date().toISOString() }),
    });
  } catch {}
}

// ─── DEFAULTS & LEVELS ───────────────────────────────────────────────────────
const DEFAULT_PROFILE = {
  name: CHILD_NAME,
  totalPoints: 0,
  sessions: [],
  weeklyConfig: {
    duration: 35,
    exercises: [
      { type: "conjugaison", label: "Conjugaison", enabled: true, emoji: "🔤" },
      { type: "orthographe", label: "Orthographe", enabled: true, emoji: "✏️" },
      { type: "dictee", label: "Dictée courte", enabled: true, emoji: "📝" },
      { type: "graphologie", label: "Graphologie", enabled: true, emoji: "🖊️" },
    ],
    focusPoints: "Sons complexes (ou/on), accord sujet-verbe, lettres attachées",
    difficulty: "CE1 début",
    presetFormat: "",
  },
  memory: { usedVerbs: [], usedWords: [], weakPoints: [] },
};

const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000];
const LEVEL_NAMES = ["Apprenti", "Explorateur", "Savant", "Expert", "Champion", "Génie"];
const LEVEL_COLORS = ["#94a3b8", "#60a5fa", "#34d399", "#f59e0b", "#f472b6", "#a78bfa"];

function getLevelInfo(points) {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) { level = i; break; }
  }
  const next = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[level];
  const progress = next > LEVEL_THRESHOLDS[level]
    ? ((points - LEVEL_THRESHOLDS[level]) / (next - LEVEL_THRESHOLDS[level])) * 100 : 100;
  return { level, name: LEVEL_NAMES[level], color: LEVEL_COLORS[level], progress: Math.min(progress, 100), pointsToNext: Math.max(0, next - points) };
}

// ─── COMPOSANTS ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} onClick={() => onChange?.(s)}
          style={{ fontSize: 30, cursor: "pointer", filter: s <= value ? "none" : "grayscale(1) opacity(0.3)", transition: "transform 0.15s", userSelect: "none" }}
          onMouseEnter={e => { e.target.style.transform = "scale(1.25)"; }}
          onMouseLeave={e => { e.target.style.transform = "scale(1)"; }}>⭐</span>
      ))}
    </div>
  );
}

function MiniChart({ sessions }) {
  if (!sessions || sessions.length === 0)
    return <div style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0", fontSize: 13 }}>Aucune séance encore</div>;
  const last7 = sessions.slice(-7);
  const maxPts = Math.max(...last7.map(s => s.points), 10);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
      {last7.map((s, i) => {
        const h = Math.max(8, (s.points / maxPts) * 72);
        const d = new Date(s.date);
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>{s.points}</div>
            <div style={{ width: "100%", height: h, borderRadius: "6px 6px 0 0", background: "linear-gradient(180deg, #34d399, #60a5fa)", transition: "height 0.5s" }} />
            <div style={{ fontSize: 9, color: "#94a3b8" }}>{d.getDate()}/{d.getMonth() + 1}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── APP PRINCIPALE ───────────────────────────────────────────────────────────
export default function App() {
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState("home");
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState(""); // "", "saving", "saved", "error"
  const [generating, setGenerating] = useState(false);
  const [generatedExercises, setGeneratedExercises] = useState(null);
  const [sessionScore, setSessionScore] = useState(null);
  const [contextNote, setContextNote] = useState("");
  const [tempConfig, setTempConfig] = useState(null);
  const [toast, setToast] = useState(null);
  const [starRating, setStarRating] = useState(0);
  const [insightText, setInsightText] = useState("");
  const [printMode, setPrintMode] = useState(false);
  // Clé Gemini stockée en localStorage
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("lucas_gemini_key") || "");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const showToast = (msg, color = "#34d399") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Chargement initial depuis Supabase, fallback localStorage
  useEffect(() => {
    async function load() {
      let data = await supabaseLoad();
      if (!data) {
        // fallback local si Supabase vide ou inaccessible
        try {
          const local = localStorage.getItem("lucas_profile_v4");
          if (local) data = JSON.parse(local);
        } catch {}
      }
      setProfile(data || { ...DEFAULT_PROFILE });
      setLoading(false);
    }
    load();
  }, []);

  // ── Sauvegarde : localStorage immédiat + Supabase async
  const saveProfile = useCallback(async (p) => {
    setProfile(p);
    localStorage.setItem("lucas_profile_v4", JSON.stringify(p));
    setSyncStatus("saving");
    try {
      await supabaseSave(p);
      setSyncStatus("saved");
      setTimeout(() => setSyncStatus(""), 2000);
    } catch {
      setSyncStatus("error");
      setTimeout(() => setSyncStatus(""), 3000);
    }
  }, []);

  // ── Sauvegarde clé Gemini en localStorage
  const saveGeminiKey = (key) => {
    setGeminiKey(key);
    localStorage.setItem("lucas_gemini_key", key);
  };

  // ── Génération via Gemini
  async function generateExercises() {
    if (!profile) return;
    if (!geminiKey.trim()) {
      setShowKeyInput(true);
      showToast("Entre ta clé API Gemini !", "#f59e0b");
      return;
    }
    setGenerating(true);
    setGeneratedExercises(null);
    setSessionScore(null);
    setStarRating(0);
    setInsightText("");

    const { memory, weeklyConfig } = profile;
    const memCtx = [
      memory.usedVerbs.length ? `Verbes DÉJÀ utilisés (ne pas répéter) : ${memory.usedVerbs.slice(-12).join(", ")}` : "",
      memory.usedWords.length ? `Mots de dictée déjà vus (varier) : ${memory.usedWords.slice(-12).join(", ")}` : "",
      memory.weakPoints.length ? `Points faibles identifiés par les parents : ${memory.weakPoints.slice(-5).join(" | ")}` : "",
    ].filter(Boolean).join("\n");

    const formatBlock = weeklyConfig.presetFormat
      ? `\n⚠️ FORMAT IMPOSÉ — respecte EXACTEMENT cette structure, c'est la priorité absolue :\n${weeklyConfig.presetFormat}`
      : `Exercices à inclure : ${weeklyConfig.exercises.filter(e => e.enabled).map(e => e.label).join(", ")}`;

    const prompt = `Tu es un instituteur expert CE1. Génère une séance complète pour ${CHILD_NAME}.

PROFIL :
- Niveau gamification : ${LEVEL_NAMES[getLevelInfo(profile.totalPoints).level]}
- Difficulté cible : ${weeklyConfig.difficulty}
- Points de focus : ${weeklyConfig.focusPoints}
- Durée : ${weeklyConfig.duration} minutes
${memCtx ? `\nMÉMOIRE :\n${memCtx}` : ""}
${formatBlock}
${contextNote ? `\nCONTEXTE DU JOUR : ${contextNote}` : ""}

RÈGLES :
- Ne réutilise JAMAIS les verbes ou mots listés en mémoire
- Contenu 100% prêt à imprimer avec tirets ___ pour les réponses
- Instructions niveau CE1 très claires
- Pour la conjugaison, liste les verbes dans "verbsUsed"
- Pour la dictée, liste les mots clés dans "wordsUsed"

Réponds UNIQUEMENT en JSON valide (pas de markdown, pas de backticks) :
{
  "sessionTitle": "...",
  "exercises": [
    {
      "type": "...", "title": "...", "duration": "X min", "emoji": "...",
      "instructions": "...",
      "content": "contenu complet avec ___ pour écrire",
      "parentNote": "...",
      "verbsUsed": [],
      "wordsUsed": []
    }
  ],
  "encouragement": "message d'encouragement pour ${CHILD_NAME}"
}`;

    try {
      const res = await fetch(
`/api/generate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    }
  );
  const data = await res.json();

  const raw = data?.text || "";
  const clean = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);
      setGeneratedExercises(parsed);
      setView("exercises");
    } catch (err) {
      console.error(err);
      showToast("Erreur Gemini — vérifie ta clé API", "#f87171");
    }
    setGenerating(false);
  }

  async function validateSession() {
    if (starRating === 0) { showToast("Donne une note à la séance !", "#f59e0b"); return; }
    const points = starRating * 20;
    const newVerbs = generatedExercises?.exercises?.flatMap(e => e.verbsUsed || []) || [];
    const newWords = generatedExercises?.exercises?.flatMap(e => e.wordsUsed || []) || [];

    const newProfile = {
      ...profile,
      totalPoints: profile.totalPoints + points,
      sessions: [...profile.sessions, {
        date: new Date().toISOString(),
        title: generatedExercises?.sessionTitle || "Séance",
        points, stars: starRating,
        insight: insightText || null,
      }],
      memory: {
        usedVerbs: [...(profile.memory.usedVerbs || []), ...newVerbs].slice(-30),
        usedWords: [...(profile.memory.usedWords || []), ...newWords].slice(-30),
        weakPoints: insightText
          ? [...(profile.memory.weakPoints || []), insightText].slice(-10)
          : (profile.memory.weakPoints || []),
      },
    };
    await saveProfile(newProfile);
    setSessionScore({ points });
    showToast(`+${points} points ! 🎉`, "#a78bfa");
  }

  const openConfig = () => {
    setTempConfig(JSON.parse(JSON.stringify(profile.weeklyConfig)));
    setView("config");
  };

  // ── Styles
  const S = {
    app: { minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)", fontFamily: "Georgia, serif", color: "white", paddingBottom: 80 },
    header: { background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 100 },
    card: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 20, marginBottom: 16 },
    btn: { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 14, padding: "14px 24px", color: "white", fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%" },
    btnSm: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "8px 14px", color: "white", fontFamily: "Georgia, serif", fontSize: 13, cursor: "pointer" },
    btnToggle: (on) => ({ background: on ? "#6366f1" : "rgba(255,255,255,0.08)", border: `1px solid ${on ? "#6366f1" : "rgba(255,255,255,0.2)"}`, borderRadius: 10, padding: "8px 14px", color: "white", fontFamily: "Georgia, serif", fontSize: 13, cursor: "pointer" }),
    nav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(15,23,42,0.97)", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", zIndex: 200 },
    navBtn: (a) => ({ flex: 1, padding: "12px 4px", background: "none", border: "none", color: a ? "#a78bfa" : "#64748b", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }),
    input: { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 16px", color: "white", fontFamily: "Georgia, serif", fontSize: 14, width: "100%", outline: "none", resize: "vertical" },
    badge: (c) => ({ background: c + "22", border: `1px solid ${c}44`, borderRadius: 20, padding: "4px 12px", fontSize: 12, color: c, fontWeight: 700, display: "inline-block" }),
    wrap: { padding: "0 16px", maxWidth: 600, margin: "0 auto" },
  };

  // ── Loading
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
      <div style={{ textAlign: "center", color: "white", fontFamily: "Georgia, serif" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
        <div>Chargement depuis Supabase…</div>
      </div>
    </div>
  );

  const li = getLevelInfo(profile.totalPoints);

  // ── Mode impression
  if (printMode && generatedExercises) return (
    <div style={{ fontFamily: "Georgia, serif", padding: "20mm", color: "#1e293b", background: "white" }}>
      <div style={{ textAlign: "center", borderBottom: "3px solid #6366f1", paddingBottom: 14, marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, color: "#6366f1" }}>📚 Séance de {CHILD_NAME}</h1>
        <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {profile.weeklyConfig.duration} min · {profile.weeklyConfig.difficulty}
        </p>
      </div>
      {generatedExercises.exercises?.map((ex, i) => (
        <div key={i} style={{ marginBottom: 30, pageBreakInside: "avoid" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", background: "#f8fafc", padding: "10px 14px", borderRadius: 10, borderLeft: "4px solid #6366f1", marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>{ex.emoji}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Exercice {i + 1} — {ex.title}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{ex.duration}</div>
            </div>
          </div>
          <p style={{ fontStyle: "italic", color: "#475569", margin: "0 0 10px", fontSize: 13 }}>📌 {ex.instructions}</p>
          <div style={{ whiteSpace: "pre-line", fontSize: 14, lineHeight: 2.5, border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, minHeight: 80 }}>{ex.content}</div>
          {ex.parentNote && <p style={{ fontSize: 12, color: "#7c3aed", marginTop: 6, fontStyle: "italic" }}>👨‍👩‍👧 {ex.parentNote}</p>}
        </div>
      ))}
      <div style={{ textAlign: "center", padding: 14, background: "#f0f9ff", borderRadius: 10, color: "#0369a1", fontStyle: "italic" }}>
        💪 {generatedExercises.encouragement}
      </div>
    </div>
  );

  // ── Render principal
  return (
    <div style={S.app}>
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.color, color: "white", padding: "10px 24px", borderRadius: 20, fontWeight: 700, fontSize: 14, zIndex: 999, boxShadow: "0 8px 32px rgba(0,0,0,0.3)", whiteSpace: "nowrap" }}>
          {toast.msg}
        </div>
      )}

      <div style={S.header}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>📚 École de {CHILD_NAME}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
            CE1 · Suivi personnalisé
            {syncStatus === "saving" && <span style={{ color: "#f59e0b" }}>● sync…</span>}
            {syncStatus === "saved" && <span style={{ color: "#34d399" }}>● synchronisé</span>}
            {syncStatus === "error" && <span style={{ color: "#f87171" }}>● erreur sync</span>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={S.badge(li.color)}>{li.name}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{profile.totalPoints} pts ⭐</div>
        </div>
      </div>

      <div style={S.wrap}>

        {/* ── VUE HOME ── */}
        {view === "home" && (
          <>
            {/* Niveau */}
            <div style={{ ...S.card, marginTop: 20, background: `linear-gradient(135deg, ${li.color}22, rgba(255,255,255,0.03))`, border: `1px solid ${li.color}44` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 21, fontWeight: 700 }}>🏆 {li.name}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{profile.totalPoints} points au total</div>
                </div>
                <div style={{ fontSize: 40 }}>{["🌱","🚀","🔬","⚡","👑","🌟"][li.level]}</div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, height: 10, overflow: "hidden" }}>
                <div style={{ width: `${li.progress}%`, height: "100%", background: `linear-gradient(90deg, ${li.color}, white)`, borderRadius: 8, transition: "width 1s" }} />
              </div>
              {li.pointsToNext > 0 && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>{li.pointsToNext} pts pour le prochain niveau</div>}
            </div>

            {/* Génération */}
            <div style={S.card}>
              <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 8 }}>📝 Contexte du jour <span style={{ fontSize: 12 }}>(optionnel)</span></div>
              <textarea style={{ ...S.input, marginBottom: 14, minHeight: 65 }}
                placeholder="La maîtresse a travaillé sur les sons 'oi'… Lucas hésite sur les accords…"
                value={contextNote} onChange={e => setContextNote(e.target.value)} />

              {/* Clé Gemini */}
              {(!geminiKey.trim() || showKeyInput) ? (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "10px 14px", marginBottom: 8, fontSize: 12, color: "#fcd34d" }}>
                    🔑 Clé API Gemini — saisie une seule fois, mémorisée sur cet appareil
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="password" style={{ ...S.input, fontFamily: "monospace", resize: "none" }}
                      placeholder="AIza..."
                      value={geminiKey}
                      onChange={e => saveGeminiKey(e.target.value)} />
                    {geminiKey.trim() && (
                      <button style={{ ...S.btnSm, whiteSpace: "nowrap" }} onClick={() => setShowKeyInput(false)}>OK</button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                  <button style={{ ...S.btnSm, fontSize: 11 }} onClick={() => setShowKeyInput(true)}>🔑 Clé API</button>
                </div>
              )}

              {profile.weeklyConfig.presetFormat && (
                <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#c7d2fe" }}>
                  <span style={{ fontWeight: 700 }}>📋 Format prédéfini actif</span><br />
                  <span style={{ color: "#94a3b8" }}>{profile.weeklyConfig.presetFormat.slice(0, 90)}{profile.weeklyConfig.presetFormat.length > 90 ? "…" : ""}</span>
                </div>
              )}
              <button style={{ ...S.btn, opacity: generating ? 0.65 : 1 }} onClick={generateExercises} disabled={generating}>
                {generating ? "⏳ Gemini génère la séance…" : "✨ Générer la séance du jour"}
              </button>
            </div>

            {/* Programme actuel */}
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 700 }}>⚙️ Programme actuel</div>
                <button style={S.btnSm} onClick={openConfig}>Modifier</button>
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>⏱ {profile.weeklyConfig.duration} min · {profile.weeklyConfig.difficulty}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {profile.weeklyConfig.exercises.filter(e => e.enabled).map(e => (
                  <span key={e.type} style={S.badge("#60a5fa")}>{e.emoji} {e.label}</span>
                ))}
              </div>
              {profile.weeklyConfig.focusPoints && <div style={{ marginTop: 8, fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>🎯 {profile.weeklyConfig.focusPoints}</div>}
            </div>

            {/* Mémoire */}
            {(profile.memory.weakPoints.length > 0 || profile.memory.usedVerbs.length > 0) && (
              <div style={{ ...S.card, border: "1px solid rgba(167,139,250,0.3)" }}>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>🧠 Mémoire active</div>
                {profile.memory.weakPoints.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: "#f472b6", fontWeight: 600, marginBottom: 4 }}>Points à retravailler :</div>
                    {profile.memory.weakPoints.slice(-3).map((w, i) => <div key={i} style={{ fontSize: 12, color: "#94a3b8" }}>· {w}</div>)}
                  </div>
                )}
                {profile.memory.usedVerbs.length > 0 && (
                  <div style={{ fontSize: 12, color: "#64748b" }}>Verbes vus : {profile.memory.usedVerbs.slice(-8).join(", ")}</div>
                )}
              </div>
            )}

            {/* Graphique */}
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>📈 Progression récente</div>
              <MiniChart sessions={profile.sessions} />
            </div>
          </>
        )}

        {/* ── VUE EXERCICES ── */}
        {view === "exercises" && generatedExercises && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 0 12px" }}>
              <button style={S.btnSm} onClick={() => setView("home")}>← Retour</button>
              <div style={{ flex: 1, fontWeight: 700, fontSize: 15 }}>{generatedExercises.sessionTitle}</div>
              <button style={S.btnSm} onClick={() => { setPrintMode(true); setTimeout(() => { window.print(); setPrintMode(false); }, 300); }}>🖨️ A4</button>
            </div>
            {generatedExercises.exercises?.map((ex, i) => (
              <div key={i} style={{ ...S.card, borderLeft: "3px solid #6366f1" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                  <span style={{ fontSize: 24 }}>{ex.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Exercice {i + 1} — {ex.title}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>⏱ {ex.duration}</div>
                  </div>
                </div>
                <div style={{ background: "rgba(99,102,241,0.1)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#c7d2fe", fontStyle: "italic" }}>
                  📌 {ex.instructions}
                </div>
                <div style={{ fontSize: 14, lineHeight: 2.2, color: "#e2e8f0", whiteSpace: "pre-line", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 12 }}>
                  {ex.content}
                </div>
                {ex.parentNote && <div style={{ marginTop: 10, fontSize: 12, color: "#a78bfa", fontStyle: "italic" }}>👨‍👩‍👧 {ex.parentNote}</div>}
              </div>
            ))}
            {!sessionScore ? (
              <div style={{ ...S.card, background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.3)" }}>
                <div style={{ fontStyle: "italic", color: "#c4b5fd", fontSize: 14, textAlign: "center", marginBottom: 18 }}>
                  💪 {generatedExercises.encouragement}
                </div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>🔍 Observations de fin de séance</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
                  Qu'est-ce qui était difficile ? Quels mots ou règles ont posé problème ?
                  <br /><span style={{ color: "#a78bfa" }}>Ces notes sont mémorisées et partagées entre les deux parents via Supabase.</span>
                </div>
                <textarea style={{ ...S.input, minHeight: 80, marginBottom: 16 }}
                  placeholder="Ex: Lucas confond 'ou' et 'où', l'accord avec 'nous' est acquis…"
                  value={insightText} onChange={e => setInsightText(e.target.value)} />
                <div style={{ fontWeight: 700, marginBottom: 10, textAlign: "center" }}>Comment s'est passée la séance ?</div>
                <StarRating value={starRating} onChange={setStarRating} />
                <button style={{ ...S.btn, marginTop: 16 }} onClick={validateSession}>✅ Valider et synchroniser</button>
              </div>
            ) : (
              <div style={{ ...S.card, textAlign: "center", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)" }}>
                <div style={{ fontSize: 42, marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#34d399" }}>+{sessionScore.points} points !</div>
                <div style={{ color: "#94a3b8", marginTop: 4, marginBottom: 16 }}>Séance enregistrée · Supabase synchronisé</div>
                <button style={S.btn} onClick={() => { setView("home"); setGeneratedExercises(null); setContextNote(""); }}>🏠 Retour à l'accueil</button>
              </div>
            )}
          </>
        )}

        {/* ── VUE CONFIG ── */}
        {view === "config" && tempConfig && (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, margin: "20px 0 14px" }}>⚙️ Programme de la semaine</div>
            <div style={S.card}>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>⏱ Durée totale</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[20, 30, 35, 45, 60].map(d => (
                  <button key={d} style={S.btnToggle(tempConfig.duration === d)} onClick={() => setTempConfig({ ...tempConfig, duration: d })}>{d} min</button>
                ))}
              </div>
            </div>
            <div style={S.card}>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>📚 Exercices inclus</div>
              {tempConfig.exercises.map((ex, i) => (
                <div key={ex.type} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < tempConfig.exercises.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <span style={{ fontSize: 14 }}>{ex.emoji} {ex.label}</span>
                  <div style={{ width: 44, height: 24, borderRadius: 12, background: ex.enabled ? "#6366f1" : "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative", transition: "background 0.2s" }}
                    onClick={() => { const exs = [...tempConfig.exercises]; exs[i] = { ...ex, enabled: !ex.enabled }; setTempConfig({ ...tempConfig, exercises: exs }); }}>
                    <div style={{ position: "absolute", top: 3, left: ex.enabled ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ ...S.card, border: "1px solid rgba(99,102,241,0.4)" }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>📋 Format prédéfini</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
                Décris exactement la structure voulue. Quand rempli, il <strong style={{ color: "#a78bfa" }}>prend le dessus</strong> sur la sélection d'exercices.
              </div>
              <textarea style={{ ...S.input, minHeight: 120 }}
                placeholder={"2 verbes du 1er groupe au présent avec tirets,\npuis 3 phrases à transposer (singulier → pluriel),\npuis dictée 2 lignes mots en 'oi'/'ou',\npuis 4 mots en lettres attachées"}
                value={tempConfig.presetFormat || ""}
                onChange={e => setTempConfig({ ...tempConfig, presetFormat: e.target.value })} />
            </div>
            <div style={S.card}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>🎯 Niveau de difficulté</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                {["CE1 début", "CE1 milieu", "CE1 avancé"].map(d => (
                  <button key={d} style={S.btnToggle(tempConfig.difficulty === d)} onClick={() => setTempConfig({ ...tempConfig, difficulty: d })}>{d}</button>
                ))}
              </div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Points de focus</div>
              <textarea style={{ ...S.input, minHeight: 70 }}
                placeholder="sons complexes, accord sujet-verbe, lettres b/d…"
                value={tempConfig.focusPoints}
                onChange={e => setTempConfig({ ...tempConfig, focusPoints: e.target.value })} />
            </div>
            <button style={S.btn} onClick={async () => {
              const p = { ...profile, weeklyConfig: { ...tempConfig } };
              await saveProfile(p);
              setView("home");
              showToast("Programme mis à jour ✅");
            }}>💾 Enregistrer le programme</button>
            <button style={{ ...S.btnSm, width: "100%", marginTop: 10, padding: 12 }} onClick={() => setView("home")}>Annuler</button>
            <div style={{ height: 16 }} />
          </>
        )}

        {/* ── VUE STATS ── */}
        {view === "stats" && (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, margin: "20px 0 14px" }}>📊 Suivi de {CHILD_NAME}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Séances", value: profile.sessions.length, icon: "📚" },
                { label: "Points totaux", value: profile.totalPoints, icon: "⭐" },
                { label: "Niveau", value: li.name, icon: "🏆" },
                { label: "Moy/séance", value: profile.sessions.length ? Math.round(profile.totalPoints / profile.sessions.length) : 0, icon: "📈" },
              ].map(s => (
                <div key={s.label} style={{ ...S.card, textAlign: "center", marginBottom: 0 }}>
                  <div style={{ fontSize: 26 }}>{s.icon}</div>
                  <div style={{ fontSize: 19, fontWeight: 700, marginTop: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>📈 Évolution des séances</div>
              <MiniChart sessions={profile.sessions} />
            </div>
            {profile.memory.weakPoints.length > 0 && (
              <div style={{ ...S.card, border: "1px solid rgba(244,114,182,0.3)" }}>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>🔍 Points à retravailler</div>
                {profile.memory.weakPoints.slice().reverse().map((w, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#c4b5fd", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>· {w}</div>
                ))}
              </div>
            )}
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>🗓 Historique complet</div>
              {profile.sessions.length === 0 && <div style={{ color: "#64748b", fontSize: 13 }}>Aucune séance encore.</div>}
              {profile.sessions.slice().reverse().map((s, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{new Date(s.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#f59e0b", fontSize: 12 }}>{"⭐".repeat(s.stars)}</div>
                      <div style={{ fontSize: 13, color: "#34d399", fontWeight: 700 }}>+{s.points} pts</div>
                    </div>
                  </div>
                  {s.insight && <div style={{ fontSize: 12, color: "#a78bfa", marginTop: 4, fontStyle: "italic" }}>💬 {s.insight}</div>}
                </div>
              ))}
            </div>
          </>
        )}

      </div>

      <nav style={S.nav}>
        {[
          { id: "home", icon: "🏠", label: "Accueil" },
          { id: "stats", icon: "📊", label: "Suivi" },
          { id: "config", icon: "⚙️", label: "Programme" },
        ].map(n => (
          <button key={n.id} style={S.navBtn(view === n.id)} onClick={() => { if (n.id === "config") openConfig(); else setView(n.id); }}>
            <span style={{ fontSize: 22 }}>{n.icon}</span>
            <span style={{ fontSize: 10, fontWeight: view === n.id ? 700 : 400 }}>{n.label}</span>
          </button>
        ))}
      </nav>
      <style>{`
        * { box-sizing: border-box; }
        textarea:focus { border-color: rgba(99,102,241,0.6) !important; }
        @media print { nav { display: none !important; } }
      `}</style>
    </div>
  );
}
