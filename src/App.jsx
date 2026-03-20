import { useState, useEffect, useCallback } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CHILD_NAME = "Léo";
const SUPABASE_URL = "https://enppydwndwwbmnueuuup.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Gf2rnCwwTS7rfmUQ8K_VmQ_RkC1bJZt";

const PARENT_SECRET = "leo2024"; // code secret pour débloquer items manuellement

const DEFAULT_PRESET = `EXERCICE 1 — Conjugaison
- Verbe MANGER à l'imparfait (toutes les personnes, tableau à compléter, exemple fourni)
- Verbe SAUTER au présent (toutes les personnes)
- Verbe JOUER à l'imparfait (toutes les personnes)

EXERCICE 2 — Transposition de phrases
Changer le sujet TU par JE dans 5 phrases. Exemple fourni en tête.

EXERCICE 3 — Négation
Transformer 5 phrases affirmatives en phrases négatives avec NE...PAS. Exemple fourni.

EXERCICE 4 — Mathématiques : Soustractions
2 soustractions posées niveau fin CE1 (nombres jusqu'à 100).

EXERCICE 5 — Mathématiques : Encadrement
Encadrer 4 nombres à la dizaine inférieure et supérieure.
Encadrer 2 nombres à la centaine inférieure et supérieure.`;

const CORPUS_PEDAGOGIQUE = `
=== CORPUS PÉDAGOGIQUE CE1/CE2 — ÉCOLE DE LÉO ===
Sources : Programme officiel cycle 2 (Education Nationale 2024), eduscol.education.fr, lutinbazar.fr, soutien67.fr, classeetgrimaces.fr

RÈGLES GÉNÉRALES DE CONSTRUCTION D'EXERCICE :
- Toujours fournir un exemple AVANT les exercices (comme à l'école)
- Tirets longs _______________ pour les réponses (minimum 15 caractères)
- Interligne généreux pour qu'un enfant puisse écrire
- Instructions courtes et claires niveau CE1
- Jamais plus difficile que demandé, jamais plus facile non plus

=== FRANÇAIS ===

CONJUGAISON :
Format tableau obligatoire :
je _______________
tu _______________
il/elle _______________
nous _______________
vous _______________
ils/elles _______________
Exemple avant le tableau : "Exemple : CHANTER au présent → je chante"

Verbes 1er groupe disponibles (choisir selon mémoire) : chanter, manger, jouer, sauter, aimer, donner, trouver, regarder, porter, parler, marcher, danser, écouter, dessiner, colorier, ranger, pousser, tirer, laver, garder
Verbes 2ème groupe : finir, grandir, choisir, réussir, rougir, bâtir
Verbes irréguliers fréquents : être, avoir, aller, faire, dire, venir, partir, prendre, pouvoir, vouloir, voir, savoir
Temps disponibles : présent, imparfait, futur simple, passé composé

TRANSPOSITION :
Exemple obligatoire : "TU joues au foot. → JE joue au foot."
Format : 5 phrases numérotées, sujet souligné
Transformations possibles : TU→JE, IL→NOUS, ELLE→ILS, JE→VOUS, ILS→IL

NÉGATION :
Exemple obligatoire : "Il joue au foot. → Il ne joue PAS au foot."
Format : 5 phrases numérotées avec espace de réponse en dessous
Types : ne...pas (base), ne...plus, ne...jamais, ne...rien (avancé)

ACCORD SUJET-VERBE :
Compléter les terminaisons manquantes ou identifier le bon sujet
Format : phrases avec ___ à compléter

CLASSES DE MOTS :
Trier dans un tableau : Noms / Verbes / Adjectifs / Déterminants
Liste de 10-12 mots à trier

HOMOPHONES :
a/à, et/est, son/sont, ou/où, ces/ses, on/ont, ma/m'a
Format : choisir le bon homophone dans des phrases

SONS COMPLEXES :
ou / on / an / in / oi / eau / au / ai / ill / gn
Compléter les mots ou trier par son

DICTÉE :
3 à 5 phrases courtes sur un thème cohérent
Intégrer les mots de la semaine si fournis dans le Focus
Note pour le parent : "Lire lentement, 2 fois"

VOCABULAIRE :
Familles de mots, synonymes, antonymes, sens en contexte

=== MATHÉMATIQUES ===

NUMÉRATION :
- Décomposition : 347 = ___ centaines + ___ dizaines + ___ unités
- Encadrement dizaine : ___ < 47 < ___  (Exemple : ___ < 34 < ___ → 30 < 34 < 40)
- Encadrement centaine : ___ < 347 < ___
- Comparaison et rangement
- Nombres pairs/impairs

ADDITION/SOUSTRACTION :
- CE1 : jusqu'à 100, puis jusqu'à 1000
- CE2 : jusqu'à 1000 avec retenue, au-delà si niveau avancé
- Format posé avec tirets pour le résultat
- Exemple fourni avant les calculs

MULTIPLICATION :
- Tables de 2 à 9 selon niveau
- Format : 8 calculs à compléter
- Exemple : "3 × 4 = ___"

DIVISION :
- Division exacte puis avec reste
- Format : "12 ÷ 4 = ___"

FRACTIONS (programme 2024, introduites dès CE1) :
- Colorier une fraction d'une figure
- Écrire la fraction correspondante
- Comparer des fractions simples

GÉOMÉTRIE :
- Figures géométriques et propriétés
- Reproduire sur quadrillage
- Symétrie axiale
- Patron de cube (découper/coller)
- Périmètre et aire introduction

MESURES :
- Longueurs : mm, cm, m, km
- Masses : g et kg
- Durées : heures et minutes, calcul de durée
- Monnaie : compter et rendre la monnaie

PROBLÈMES :
- 1 ou 2 étapes selon niveau
- Toujours une question claire
- Espace pour le calcul ET pour la réponse rédigée
- Format : "Calcul :" puis "Réponse :"
`;

// ─── SUPABASE ────────────────────────────────────────────────────────────────
async function supabaseLoad() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/lucas_data?id=eq.lucas&select=data`, {
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
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

// ─── NIVEAUX & RATON LAVEUR ──────────────────────────────────────────────────
const RACCOON_ITEMS = [
  { pts: 0,    emoji: "🍁", label: "Feuille d'érable" },
  { pts: 50,   emoji: "🎒", label: "Sac à dos" },
  { pts: 150,  emoji: "🕯️", label: "Torche" },
  { pts: 300,  emoji: "🧭", label: "Boussole" },
  { pts: 500,  emoji: "🗺️", label: "Carte du trésor" },
  { pts: 750,  emoji: "🎩", label: "Chapeau d'explorateur" },
  { pts: 1000, emoji: "🔪", label: "Couteau suisse" },
  { pts: 1300, emoji: "🏕️", label: "Tente" },
  { pts: 1600, emoji: "⭐", label: "Étoile polaire" },
];

const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1800];
const LEVEL_NAMES = ["Apprenti", "Explorateur", "Savant", "Expert", "Champion", "Génie", "Légende", "Maître"];
const LEVEL_COLORS = ["#94a3b8", "#60a5fa", "#34d399", "#f59e0b", "#f472b6", "#a78bfa", "#fb923c", "#e879f9"];

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

function getUnlockedItems(points) {
  return RACCOON_ITEMS.filter(item => item.pts <= points);
}

const DEFAULT_PROFILE = {
  name: CHILD_NAME,
  totalPoints: 0,
  sessions: [],
  unlockedBonusItems: [],
  weeklyConfig: {
    duration: 25,
    difficulty: "CE1/CE2",
    focusPoints: "Sons complexes (ou/on), accord sujet-verbe, lettres attachées",
    presetFormat: DEFAULT_PRESET,
  },
  focus: {
    mots: "",
    verbes: "",
    remarque: "",
    notesemaine: 0,
    priorite: "",
  },
  memory: { usedVerbs: [], usedWords: [], weakPoints: [] },
};

// ─── COMPOSANTS ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} onClick={() => onChange?.(s)}
          style={{ fontSize: 32, cursor: "pointer", filter: s <= value ? "none" : "grayscale(1) opacity(0.3)", transition: "transform 0.15s", userSelect: "none" }}
          onMouseEnter={e => { e.target.style.transform = "scale(1.3)"; }}
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
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>{s.points}</div>
            <div style={{ width: "100%", height: h, borderRadius: "6px 6px 0 0", background: "linear-gradient(180deg, #34d399, #60a5fa)", transition: "height 0.5s" }} />
            <div style={{ fontSize: 9, color: "#94a3b8" }}>{d.getDate()}/{d.getMonth() + 1}</div>
          </div>
        );
      })}
    </div>
  );
}

function RaccoonAvatar({ points, unlockedBonus = [] }) {
  const items = getUnlockedItems(points);
  const allItems = [...items.map(i => i.emoji)];
  unlockedBonus.forEach(e => { if (!allItems.includes(e)) allItems.push(e); });

  return (
    <div style={{ textAlign: "center", padding: "10px 0" }}>
      <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 6 }}>🦝</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", maxWidth: 160, margin: "0 auto" }}>
        {allItems.map((emoji, i) => (
          <span key={i} style={{ fontSize: 20, background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "3px 5px" }} title={RACCOON_ITEMS.find(r => r.emoji === emoji)?.label || "Bonus parent"}>
            {emoji}
          </span>
        ))}
      </div>
      {points < 50 && (
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>🍁 En attente du premier équipement…</div>
      )}
    </div>
  );
}

function FocusPanel({ focus, onChange }) {
  const S = {
    input: { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px", color: "white", fontFamily: "Georgia, serif", fontSize: 13, width: "100%", outline: "none", resize: "vertical" },
    label: { fontSize: 12, color: "#94a3b8", marginBottom: 4, display: "block" },
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <span style={S.label}>📝 Mots de la semaine (séparés par des virgules)</span>
        <input style={{ ...S.input, resize: "none" }} placeholder="maison, soleil, forêt, grenouille..."
          value={focus.mots} onChange={e => onChange({ ...focus, mots: e.target.value })} />
      </div>
      <div>
        <span style={S.label}>🔤 Verbes en cours en classe</span>
        <input style={{ ...S.input, resize: "none" }} placeholder="aller au présent, finir à l'imparfait..."
          value={focus.verbes} onChange={e => onChange({ ...focus, verbes: e.target.value })} />
      </div>
      <div>
        <span style={S.label}>🎯 Point prioritaire à travailler</span>
        <select style={{ ...S.input, resize: "none" }}
          value={focus.priorite} onChange={e => onChange({ ...focus, priorite: e.target.value })}>
          <option value="">— Aucun en particulier —</option>
          <option value="conjugaison">Conjugaison</option>
          <option value="orthographe">Orthographe</option>
          <option value="grammaire">Grammaire</option>
          <option value="maths">Mathématiques</option>
          <option value="lecture">Lecture / Compréhension</option>
          <option value="géométrie">Géométrie</option>
        </select>
      </div>
      <div>
        <span style={S.label}>💬 Remarque de la maîtresse</span>
        <textarea style={{ ...S.input, minHeight: 60 }} placeholder="La maîtresse a dit que Léo hésite sur les accords..."
          value={focus.remarque} onChange={e => onChange({ ...focus, remarque: e.target.value })} />
      </div>
      <div>
        <span style={S.label}>⭐ Comment s'est passée la semaine ?</span>
        <StarRating value={focus.notesamaine || 0} onChange={v => onChange({ ...focus, notesamaine: v })} />
      </div>
    </div>
  );
}

// ─── APP PRINCIPALE ───────────────────────────────────────────────────────────
export default function App() {
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState("home");
  const [mainTab, setMainTab] = useState("programme");
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedExercises, setGeneratedExercises] = useState(null);
  const [sessionScore, setSessionScore] = useState(null);
  const [contextNote, setContextNote] = useState("");
  const [toast, setToast] = useState(null);
  const [starRating, setStarRating] = useState(0);
  const [insightText, setInsightText] = useState("");
  const [printMode, setPrintMode] = useState(false);
  const [showParentUnlock, setShowParentUnlock] = useState(false);
  const [parentCode, setParentCode] = useState("");
  const [parentUnlocked, setParentUnlocked] = useState(false);
  const [selectedFreeItems, setSelectedFreeItems] = useState([]);
  const [tempConfig, setTempConfig] = useState(null);
  const [tempFocus, setTempFocus] = useState(null);
  const [carteItems, setCarteItems] = useState({
    conjugaison: false, transposition: false, negation: false,
    orthographe: false, dictee: false, multiplication: false,
    soustraction: false, division: false, probleme: false, geometrie: false,
  });

  const showToast = (msg, color = "#34d399") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    async function load() {
      let data = await supabaseLoad();
      if (!data) {
        try {
          const local = localStorage.getItem("leo_profile_v1");
          if (local) data = JSON.parse(local);
        } catch {}
      }
      setProfile(data || { ...DEFAULT_PROFILE });
      setLoading(false);
    }
    load();
  }, []);

  const saveProfile = useCallback(async (p) => {
    setProfile(p);
    localStorage.setItem("leo_profile_v1", JSON.stringify(p));
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

  function buildPrompt(mode) {
    const { memory, weeklyConfig, focus } = profile;

    const focusBlock = [
      focus?.mots ? `Mots de la semaine à intégrer dans les exercices : ${focus.mots}` : "",
      focus?.verbes ? `Verbes en cours en classe : ${focus.verbes}` : "",
      focus?.remarque ? `Remarque de la maîtresse : ${focus.remarque}` : "",
      focus?.priorite ? `Point prioritaire : ${focus.priorite}` : "",
      focus?.notesamaine ? `Note de la semaine de Léo : ${focus.notesamaine}/5 — adapter le ton en conséquence` : "",
    ].filter(Boolean).join("\n");

    const memCtx = [
      memory.usedVerbs.length ? `Verbes DÉJÀ utilisés (ne PAS répéter) : ${memory.usedVerbs.slice(-12).join(", ")}` : "",
      memory.usedWords.length ? `Mots de dictée déjà vus (varier) : ${memory.usedWords.slice(-12).join(", ")}` : "",
      memory.weakPoints.length ? `Points faibles identifiés : ${memory.weakPoints.slice(-5).join(" | ")}` : "",
    ].filter(Boolean).join("\n");

    const formatBlock = mode === "programme"
      ? `⚠️ FORMAT IMPOSÉ — respecte EXACTEMENT cette structure exercice par exercice :\n${weeklyConfig.presetFormat}`
      : `Exercices demandés (UNIQUEMENT ceux-ci, pas d'autres) : ${Object.entries(carteItems).filter(([, v]) => v).map(([k]) => k).join(", ")}`;

    const contextBlock = contextNote ? `CONTEXTE DU JOUR : ${contextNote}` : "";

    return `${CORPUS_PEDAGOGIQUE}

=== INSTRUCTION DE GÉNÉRATION ===
Tu es un instituteur expert. Génère une fiche d'exercices complète pour ${CHILD_NAME}, élève en classe CE1/CE2.

PROFIL :
- Niveau : ${weeklyConfig.difficulty}
- Durée cible : ${weeklyConfig.duration} minutes
- Focus pédagogique : ${weeklyConfig.focusPoints}

${focusBlock ? `FOCUS DU MOMENT :\n${focusBlock}` : ""}
${memCtx ? `MÉMOIRE :\n${memCtx}` : ""}
${contextBlock}

${formatBlock}

RÈGLES ABSOLUES :
1. Fournir UN EXEMPLE avant chaque exercice (comme à l'école)
2. Tirets longs _______________ pour les réponses (min 15 caractères)
3. Interligne généreux — un enfant doit pouvoir écrire
4. Ne jamais mélanger contexte parent et contenu exercice
5. Respecter STRICTEMENT les exercices demandés, ni plus ni moins
6. Adapter la difficulté au niveau indiqué sans jamais la plafonner
7. Ne JAMAIS réutiliser les verbes ou mots listés en mémoire

Réponds UNIQUEMENT en JSON valide (pas de markdown, pas de backticks) :
{
  "sessionTitle": "...",
  "exercises": [
    {
      "type": "...",
      "title": "...",
      "duration": "X min",
      "emoji": "...",
      "instructions": "consigne claire niveau CE1",
      "example": "Exemple : [exemple complet comme à l'école]",
      "content": "contenu complet avec _______________ pour écrire, interligne généreux",
      "parentNote": "note discrète pour le parent si besoin",
      "verbsUsed": [],
      "wordsUsed": []
    }
  ],
  "encouragement": "message d'encouragement chaleureux pour ${CHILD_NAME}"
}`;
  }

  async function generateExercises(mode) {
    if (!profile) return;
    setGenerating(true);
    setGeneratedExercises(null);
    setSessionScore(null);
    setStarRating(0);
    setInsightText("");

    if (mode === "carte") {
      const selected = Object.entries(carteItems).filter(([, v]) => v);
      if (selected.length === 0) {
        showToast("Sélectionne au moins un exercice !", "#f59e0b");
        setGenerating(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: buildPrompt(mode) }),
      });
      const data = await res.json();
      const raw = data?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Pas de JSON trouvé");
      const parsed = JSON.parse(jsonMatch[0]);
      setGeneratedExercises(parsed);
      setView("exercises");
    } catch (err) {
      console.error(err);
      showToast("Erreur de génération — réessaie !", "#f87171");
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
        duration: profile.weeklyConfig.duration,
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

  async function unlockBonusItem(emoji) {
    const newProfile = {
      ...profile,
      unlockedBonusItems: [...(profile.unlockedBonusItems || []), emoji],
    };
    await saveProfile(newProfile);
    showToast(`${emoji} débloqué ! Bravo Léo ! 🎉`, "#f59e0b");
  }

  const S = {
    app: { minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1a1035 50%, #0f172a 100%)", fontFamily: "Georgia, serif", color: "white", paddingBottom: 90 },
    header: { background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 100 },
    card: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 20, marginBottom: 16 },
    btn: { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 14, padding: "14px 24px", color: "white", fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%" },
    btnSm: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "8px 14px", color: "white", fontFamily: "Georgia, serif", fontSize: 13, cursor: "pointer" },
    btnToggle: (on) => ({ background: on ? "#6366f1" : "rgba(255,255,255,0.08)", border: `1px solid ${on ? "#818cf8" : "rgba(255,255,255,0.2)"}`, borderRadius: 12, padding: "10px 16px", color: "white", fontFamily: "Georgia, serif", fontSize: 13, fontWeight: on ? 700 : 400, cursor: "pointer", transition: "all 0.2s" }),
    mainTab: (on) => ({ flex: 1, padding: "14px 4px 10px", background: on ? "rgba(99,102,241,0.2)" : "none", border: "none", borderBottom: on ? "3px solid #818cf8" : "3px solid transparent", color: on ? "#a5b4fc" : "#64748b", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.2s" }),
    bottomNav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(15,23,42,0.97)", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", zIndex: 200 },
    navBtn: (a) => ({ flex: 1, padding: "12px 4px", background: "none", border: "none", color: a ? "#a78bfa" : "#475569", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }),
    input: { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 16px", color: "white", fontFamily: "Georgia, serif", fontSize: 14, width: "100%", outline: "none", resize: "vertical" },
    badge: (c) => ({ background: c + "22", border: `1px solid ${c}44`, borderRadius: 20, padding: "4px 12px", fontSize: 12, color: c, fontWeight: 700, display: "inline-block" }),
    wrap: { padding: "0 16px", maxWidth: 600, margin: "0 auto" },
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
      <div style={{ textAlign: "center", color: "white", fontFamily: "Georgia, serif" }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🦝</div>
        <div style={{ fontSize: 16 }}>Chargement de l'école de {CHILD_NAME}…</div>
      </div>
    </div>
  );

  const li = getLevelInfo(profile.totalPoints);

  // ── MODE IMPRESSION ──
  if (printMode && generatedExercises) return (
    <div style={{ fontFamily: "Georgia, serif", padding: "15mm", color: "#1e293b", background: "white" }}>
      <div style={{ textAlign: "center", borderBottom: "3px solid #6366f1", paddingBottom: 14, marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 20, color: "#6366f1" }}>📚 École de {CHILD_NAME}</h1>
        <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 12 }}>
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {profile.weeklyConfig.duration} min · {profile.weeklyConfig.difficulty}
        </p>
        <p style={{ margin: "4px 0 0", color: "#6366f1", fontSize: 14, fontWeight: 700 }}>{generatedExercises.sessionTitle}</p>
      </div>
      {generatedExercises.exercises?.map((ex, i) => (
        <div key={i} style={{ marginBottom: 28, pageBreakInside: "avoid" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", background: "#f8fafc", padding: "8px 14px", borderRadius: 10, borderLeft: "4px solid #6366f1", marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>{ex.emoji}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Exercice {i + 1} — {ex.title}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{ex.duration}</div>
            </div>
          </div>
          <p style={{ fontStyle: "italic", color: "#475569", margin: "0 0 6px", fontSize: 12 }}>📌 {ex.instructions}</p>
          {ex.example && <p style={{ background: "#f0f9ff", padding: "6px 12px", borderRadius: 8, fontSize: 12, color: "#0369a1", margin: "0 0 10px" }}>{ex.example}</p>}
          <div style={{ whiteSpace: "pre-line", fontSize: 14, lineHeight: 3, border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, minHeight: 80 }}>{ex.content}</div>
          {ex.parentNote && <p style={{ fontSize: 11, color: "#7c3aed", marginTop: 4, fontStyle: "italic" }}>👨‍👩‍👧 {ex.parentNote}</p>}
        </div>
      ))}
      <div style={{ textAlign: "center", padding: 12, background: "#f0fdf4", borderRadius: 10, color: "#166534", fontStyle: "italic", fontSize: 13 }}>
        💪 {generatedExercises.encouragement}
      </div>
    </div>
  );

  return (
    <div style={S.app}>
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.color, color: "white", padding: "10px 24px", borderRadius: 20, fontWeight: 700, fontSize: 14, zIndex: 999, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>🦝</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>École de {CHILD_NAME}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
              {profile.weeklyConfig.difficulty}
              {syncStatus === "saving" && <span style={{ color: "#f59e0b" }}>● sync…</span>}
              {syncStatus === "saved" && <span style={{ color: "#34d399" }}>● sync ✓</span>}
              {syncStatus === "error" && <span style={{ color: "#f87171" }}>● erreur sync</span>}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={S.badge(li.color)}>{li.name}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{profile.totalPoints} pts</div>
        </div>
      </div>

      <div style={S.wrap}>

        {/* ── VUE EXERCISES ── */}
        {view === "exercises" && generatedExercises && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 0 12px" }}>
              <button style={S.btnSm} onClick={() => setView("home")}>← Retour</button>
              <div style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{generatedExercises.sessionTitle}</div>
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
                <div style={{ background: "rgba(99,102,241,0.12)", borderRadius: 10, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "#c7d2fe", fontStyle: "italic" }}>
                  📌 {ex.instructions}
                </div>
                {ex.example && (
                  <div style={{ background: "rgba(52,211,153,0.1)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#6ee7b7", borderLeft: "3px solid #34d399" }}>
                    {ex.example}
                  </div>
                )}
                <div style={{ fontSize: 14, lineHeight: 2.8, color: "#e2e8f0", whiteSpace: "pre-line", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 12 }}>
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
                  Qu'est-ce qui était difficile ?
                  <br /><span style={{ color: "#a78bfa" }}>Partagé entre les deux parents via Supabase.</span>
                </div>
                <textarea style={{ ...S.input, minHeight: 70, marginBottom: 16 }}
                  placeholder="Ex: Léo hésite sur les accords au pluriel..."
                  value={insightText} onChange={e => setInsightText(e.target.value)} />
                <div style={{ fontWeight: 700, marginBottom: 10, textAlign: "center" }}>Comment s'est passée la séance ?</div>
                <StarRating value={starRating} onChange={setStarRating} />
                <button style={{ ...S.btn, marginTop: 16 }} onClick={validateSession}>✅ Valider et enregistrer</button>
              </div>
            ) : (
              <div style={{ ...S.card, textAlign: "center", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)" }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#34d399" }}>+{sessionScore.points} points !</div>
                <div style={{ color: "#94a3b8", marginTop: 4, marginBottom: 16 }}>Séance enregistrée · Supabase synchronisé</div>
                <button style={S.btn} onClick={() => { setView("home"); setGeneratedExercises(null); setContextNote(""); }}>🏠 Retour à l'accueil</button>
              </div>
            )}
          </>
        )}

        {/* ── VUE HOME ── */}
        {view === "home" && (
          <>
            {/* ONGLETS PRINCIPAUX */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.1)", marginTop: 16, marginBottom: 20 }}>
              {[
                { id: "programme", emoji: "📋", label: "Programmé" },
                { id: "carte", emoji: "🎲", label: "À la carte" },
                { id: "photo", emoji: "📷", label: "Photo" },
              ].map(t => (
                <button key={t.id} style={S.mainTab(mainTab === t.id)} onClick={() => setMainTab(t.id)}>
                  <span style={{ fontSize: 22 }}>{t.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: mainTab === t.id ? 700 : 400 }}>{t.label}</span>
                </button>
              ))}
            </div>

            {/* ── ONGLET PROGRAMMÉ ── */}
            {mainTab === "programme" && (
              <>
                <div style={S.card}>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>📝 Contexte du jour <span style={{ fontSize: 11 }}>(optionnel)</span></div>
                  <textarea style={{ ...S.input, marginBottom: 14, minHeight: 60 }}
                    placeholder="Léo a eu du mal avec les accords aujourd'hui..."
                    value={contextNote} onChange={e => setContextNote(e.target.value)} />
                  {profile.weeklyConfig.presetFormat && (
                    <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#a5b4fc" }}>
                      <span style={{ fontWeight: 700 }}>📋 Format programmé actif</span><br />
                      <span style={{ color: "#64748b", fontSize: 11 }}>{profile.weeklyConfig.presetFormat.slice(0, 100)}…</span>
                    </div>
                  )}
                  {profile.focus?.mots && (
                    <div style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#6ee7b7" }}>
                      🎯 Focus actif · Mots : {profile.focus.mots.split(",").slice(0, 4).join(", ")}{profile.focus.mots.split(",").length > 4 ? "…" : ""}
                    </div>
                  )}
                  <button style={{ ...S.btn, opacity: generating ? 0.65 : 1 }} onClick={() => generateExercises("programme")} disabled={generating}>
                    {generating ? "⏳ Génération en cours…" : "✨ Générer la séance programmée"}
                  </button>
                </div>

                {/* RATON LAVEUR */}
                <div style={{ ...S.card, background: `linear-gradient(135deg, ${li.color}18, rgba(255,255,255,0.03))`, border: `1px solid ${li.color}33` }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <RaccoonAvatar points={profile.totalPoints} unlockedBonus={profile.unlockedBonusItems || []} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>🏆 {li.name}</div>
                      <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>{profile.totalPoints} points</div>
                      <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 8, height: 8, overflow: "hidden" }}>
                        <div style={{ width: `${li.progress}%`, height: "100%", background: `linear-gradient(90deg, ${li.color}, white)`, borderRadius: 8, transition: "width 1s" }} />
                      </div>
                      {li.pointsToNext > 0 && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{li.pointsToNext} pts pour le prochain niveau</div>}
                      {/* Prochain item */}
                      {(() => {
                        const next = RACCOON_ITEMS.find(item => item.pts > profile.totalPoints);
                        return next ? (
                          <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>
                            Prochain équipement : {next.emoji} {next.label} ({next.pts - profile.totalPoints} pts)
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  {/* Bouton parent caché */}
                  <div style={{ marginTop: 12, textAlign: "center" }}>
                    <span style={{ fontSize: 11, color: "#334155", cursor: "pointer", userSelect: "none" }}
                      onClick={() => setShowParentUnlock(v => !v)}>
                      ··· mode parent
                    </span>
                  </div>
                  {showParentUnlock && (
                    <div style={{ marginTop: 10, background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 14 }}>
                      {!parentUnlocked ? (
                        <>
                          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>Code parent :</div>
                          <input type="password" style={{ ...S.input, marginBottom: 8 }}
                            placeholder="Code secret"
                            value={parentCode} onChange={e => setParentCode(e.target.value)} />
                          <button style={S.btnSm} onClick={() => {
                            if (parentCode === PARENT_SECRET) { setParentUnlocked(true); showToast("Mode parent activé ✅"); }
                            else showToast("Code incorrect", "#f87171");
                          }}>Valider</button>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 12, color: "#34d399", marginBottom: 10 }}>✅ Mode parent activé — Débloquer un item bonus :</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {RACCOON_ITEMS.filter(item => item.pts > profile.totalPoints).map(item => (
                              <button key={item.pts} style={S.btnSm} onClick={() => unlockBonusItem(item.emoji)}>
                                {item.emoji} {item.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div style={S.card}>
                  <div style={{ fontWeight: 700, marginBottom: 14 }}>📈 Progression récente</div>
                  <MiniChart sessions={profile.sessions} />
                </div>
              </>
            )}

            {/* ── ONGLET À LA CARTE ── */}
            {mainTab === "carte" && (
              <>
                <div style={S.card}>
                  <div style={{ fontWeight: 700, marginBottom: 14 }}>🎲 Choisis les exercices du jour</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
                    {[
                      { key: "conjugaison", label: "Conjugaison", emoji: "🔤" },
                      { key: "transposition", label: "Transposition", emoji: "🔄" },
                      { key: "negation", label: "Négation", emoji: "🚫" },
                      { key: "orthographe", label: "Orthographe", emoji: "✏️" },
                      { key: "dictee", label: "Dictée", emoji: "📝" },
                      { key: "multiplication", label: "Multiplication", emoji: "✖️" },
                      { key: "soustraction", label: "Soustraction", emoji: "➖" },
                      { key: "division", label: "Division", emoji: "➗" },
                      { key: "probleme", label: "Problème", emoji: "🧩" },
                      { key: "geometrie", label: "Géométrie", emoji: "📐" },
                    ].map(item => (
                      <button key={item.key}
                        style={S.btnToggle(carteItems[item.key])}
                        onClick={() => setCarteItems(prev => ({ ...prev, [item.key]: !prev[item.key] }))}>
                        {item.emoji} {item.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>📝 Contexte du jour <span style={{ fontSize: 11 }}>(optionnel)</span></div>
                  <textarea style={{ ...S.input, marginBottom: 14, minHeight: 60 }}
                    placeholder="Léo a travaillé sur les sons 'oi' cette semaine..."
                    value={contextNote} onChange={e => setContextNote(e.target.value)} />
                  <button style={{ ...S.btn, opacity: generating ? 0.65 : 1 }} onClick={() => generateExercises("carte")} disabled={generating}>
                    {generating ? "⏳ Génération en cours…" : "🎲 Générer la séance à la carte"}
                  </button>
                </div>
                {(profile.memory.weakPoints.length > 0 || profile.memory.usedVerbs.length > 0) && (
                  <div style={{ ...S.card, border: "1px solid rgba(167,139,250,0.3)" }}>
                    <div style={{ fontWeight: 700, marginBottom: 10 }}>🧠 Mémoire active</div>
                    {profile.memory.weakPoints.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, marginBottom: 4 }}>Points à retravailler :</div>
                        {profile.memory.weakPoints.slice(-3).map((w, i) => <div key={i} style={{ fontSize: 12, color: "#94a3b8" }}>· {w}</div>)}
                      </div>
                    )}
                    {profile.memory.usedVerbs.length > 0 && (
                      <div style={{ fontSize: 12, color: "#64748b" }}>Verbes vus : {profile.memory.usedVerbs.slice(-8).join(", ")}</div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── ONGLET PHOTO ── */}
            {mainTab === "photo" && (
              <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📷</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Analyse de photo</div>
                <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>
                  Prends en photo un exercice du cahier de Léo et l'application génèrera une fiche similaire avec de nouveaux contenus.
                </div>
                <div style={{ marginTop: 20, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 14, padding: "14px 20px", fontSize: 13, color: "#a5b4fc" }}>
                  🚧 Fonctionnalité en cours de développement — disponible prochainement
                </div>
              </div>
            )}
          </>
        )}

        {/* ── VUE SUIVI ── */}
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
              <div style={{ ...S.card, border: "1px solid rgba(167,139,250,0.3)" }}>
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
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        {new Date(s.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                        {s.duration ? ` · ${s.duration} min` : ""}
                      </div>
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

        {/* ── VUE PARAMÈTRES ── */}
        {view === "settings" && (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, margin: "20px 0 14px" }}>⚙️ Paramètres</div>

            {/* FOCUS DU MOMENT */}
            <div style={{ ...S.card, border: "1px solid rgba(52,211,153,0.3)" }}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>🎯 Focus du moment</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>
                À remplir avant une génération — influence tous les exercices de la séance.
              </div>
              {tempFocus ? (
                <>
                  <FocusPanel focus={tempFocus} onChange={setTempFocus} />
                  <button style={{ ...S.btn, marginTop: 16 }} onClick={async () => {
                    await saveProfile({ ...profile, focus: tempFocus });
                    setTempFocus(null);
                    showToast("Focus mis à jour ✅");
                  }}>💾 Enregistrer le focus</button>
                  <button style={{ ...S.btnSm, width: "100%", marginTop: 8, padding: 10 }} onClick={() => setTempFocus(null)}>Annuler</button>
                </>
              ) : (
                <>
                  {profile.focus?.mots && <div style={{ fontSize: 13, color: "#6ee7b7", marginBottom: 6 }}>📝 Mots : {profile.focus.mots}</div>}
                  {profile.focus?.verbes && <div style={{ fontSize: 13, color: "#6ee7b7", marginBottom: 6 }}>🔤 Verbes : {profile.focus.verbes}</div>}
                  {profile.focus?.remarque && <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>💬 {profile.focus.remarque}</div>}
                  <button style={{ ...S.btnSm, marginTop: 8 }} onClick={() => setTempFocus({ ...DEFAULT_PROFILE.focus, ...(profile.focus || {}) })}>
                    ✏️ Modifier le focus
                  </button>
                </>
              )}
            </div>

            {/* PROGRAMME */}
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>📋 Programme et durée</div>
              {tempConfig ? (
                <>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>⏱ Durée de séance</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {[15, 20, 25, 30, 35, 40, 45].map(d => (
                      <button key={d} style={S.btnToggle(tempConfig.duration === d)} onClick={() => setTempConfig({ ...tempConfig, duration: d })}>{d} min</button>
                    ))}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>🎯 Niveau de Léo</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {["CE1 début", "CE1/CE2", "CE2", "CE2 avancé"].map(d => (
                      <button key={d} style={S.btnToggle(tempConfig.difficulty === d)} onClick={() => setTempConfig({ ...tempConfig, difficulty: d })}>{d}</button>
                    ))}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>🔤 Points de focus permanents</div>
                  <textarea style={{ ...S.input, minHeight: 60, marginBottom: 16 }}
                    value={tempConfig.focusPoints}
                    onChange={e => setTempConfig({ ...tempConfig, focusPoints: e.target.value })} />
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>📋 Format programmé</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>Structure exacte que le modèle doit suivre.</div>
                  <textarea style={{ ...S.input, minHeight: 180, marginBottom: 16 }}
                    value={tempConfig.presetFormat || ""}
                    onChange={e => setTempConfig({ ...tempConfig, presetFormat: e.target.value })} />
                  <button style={S.btn} onClick={async () => {
                    await saveProfile({ ...profile, weeklyConfig: tempConfig });
                    setTempConfig(null);
                    showToast("Paramètres mis à jour ✅");
                  }}>💾 Enregistrer</button>
                  <button style={{ ...S.btnSm, width: "100%", marginTop: 8, padding: 10 }} onClick={() => setTempConfig(null)}>Annuler</button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>⏱ {profile.weeklyConfig.duration} min · {profile.weeklyConfig.difficulty}</div>
                  <button style={S.btnSm} onClick={() => setTempConfig({ ...profile.weeklyConfig })}>✏️ Modifier</button>
                </>
              )}
            </div>
          </>
        )}

      </div>

      {/* NAVIGATION BAS */}
      <nav style={S.bottomNav}>
        <button style={S.navBtn(view === "home")} onClick={() => setView("home")}>
          <span style={{ fontSize: 22 }}>🏠</span>
          <span style={{ fontSize: 10, fontWeight: view === "home" ? 700 : 400 }}>Accueil</span>
        </button>
        <button style={S.navBtn(view === "stats")} onClick={() => setView("stats")}>
          <span style={{ fontSize: 22 }}>📊</span>
          <span style={{ fontSize: 10, fontWeight: view === "stats" ? 700 : 400 }}>Suivi</span>
        </button>
        <button style={S.navBtn(view === "settings")} onClick={() => setView("settings")}>
          <span style={{ fontSize: 22 }}>⚙️</span>
          <span style={{ fontSize: 10, fontWeight: view === "settings" ? 700 : 400 }}>Paramètres</span>
        </button>
      </nav>

      <style>{`
        * { box-sizing: border-box; }
        textarea:focus, input:focus, select:focus { border-color: rgba(99,102,241,0.6) !important; }
        select option { background: #1e1b4b; color: white; }
        @media print { nav { display: none !important; } }
      `}</style>
    </div>
  );
}
