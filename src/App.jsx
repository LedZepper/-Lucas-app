import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CHILD_NAME = "Léo";
const SUPABASE_URL = "https://enppydwndwwbmnueuuup.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Gf2rnCwwTS7rfmUQ8K_VmQ_RkC1bJZt";
const PARENT_SECRET = "leo2024";

const DEFAULT_PRESET = `EXERCICE 1 — Conjugaison
- Verbe MANGER à l'imparfait (tableau toutes les personnes, exemple fourni)
- Verbe SAUTER au présent (tableau toutes les personnes)
- Verbe JOUER à l'imparfait (tableau toutes les personnes)

EXERCICE 2 — Transposition de phrases
Changer le sujet TU par JE dans 5 phrases. Exemple fourni en tête.

EXERCICE 3 — Négation
Transformer 5 phrases affirmatives en négatives avec NE...PAS. Exemple fourni.

EXERCICE 4 — Mathématiques : Soustractions
2 soustractions posées niveau fin CE1 (nombres jusqu'à 100).

EXERCICE 5 — Mathématiques : Encadrement
Encadrer 4 nombres à la dizaine inférieure et supérieure.
Encadrer 2 nombres à la centaine inférieure et supérieure.`;

const CORPUS_PEDAGOGIQUE = `
=== CORPUS PÉDAGOGIQUE CE1/CE2 — ÉCOLE DE LÉO ===
Sources : Programme officiel cycle 2 (Education Nationale 2024), eduscol.education.fr, lutinbazar.fr, soutien67.fr, classeetgrimaces.fr

RÈGLES GÉNÉRALES :
- Toujours fournir un exemple AVANT les exercices
- Tirets longs _______________ pour les réponses (minimum 15 caractères)
- Interligne généreux pour qu'un enfant puisse écrire
- Instructions courtes et claires niveau CE1
- Jamais plus difficile que demandé, jamais plus facile

=== FRANÇAIS ===

CONJUGAISON — Format tableau obligatoire :
je _______________
tu _______________
il/elle _______________
nous _______________
vous _______________
ils/elles _______________
Exemple avant : "Exemple : CHANTER au présent → je chante"
Verbes 1er groupe : chanter, manger, jouer, sauter, aimer, donner, trouver, regarder, porter, parler, marcher, danser, écouter, dessiner, colorier
Verbes 2ème groupe : finir, grandir, choisir, réussir, rougir, bâtir
Verbes irréguliers : être, avoir, aller, faire, dire, venir, partir, prendre, pouvoir, vouloir
Temps : présent, imparfait, futur simple, passé composé

TRANSPOSITION :
Exemple obligatoire : "TU joues au foot. → JE joue au foot."
5 phrases numérotées, sujet souligné
Transformations : TU→JE, IL→NOUS, ELLE→ILS, JE→VOUS

NÉGATION :
Exemple : "Il joue au foot. → Il ne joue PAS au foot."
5 phrases avec espace de réponse en dessous
Types : ne...pas, ne...plus, ne...jamais, ne...rien

ORTHOGRAPHE/DICTÉE :
3 à 5 phrases courtes, thème cohérent
Intégrer mots de la semaine si fournis
Note parent : "Lire lentement, 2 fois"

=== MATHÉMATIQUES ===

NUMÉRATION : décomposition, encadrement dizaine/centaine, comparaison
CALCUL : additions/soustractions jusqu'à 1000, multiplications, divisions
FRACTIONS : représentation visuelle, écriture, comparaison
GÉOMÉTRIE : figures, symétrie, patron cube, périmètre
MESURES : longueurs, masses, durées, monnaie
PROBLÈMES : 1 ou 2 étapes, avec "Calcul :" et "Réponse :"
`;

// ─── SUPABASE ────────────────────────────────────────────────────────────────
async function supabaseLoad() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/lucas_data?id=eq.lucas&select=data`, {
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
    });
    const rows = await res.json();
    if (rows?.length > 0 && rows[0].data) return JSON.parse(rows[0].data);
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

// ─── ITEMS RATON ─────────────────────────────────────────────────────────────
const RACCOON_ITEMS = [
  { pts: 0,   emoji: "🍁", label: "Feuille d'érable",     desc: "Le début de l'aventure !" },
  { pts: 5,   emoji: "🎒", label: "Sac à dos",            desc: "Pour transporter ses trésors." },
  { pts: 10,  emoji: "🕯️", label: "Torche",               desc: "Pour explorer dans le noir." },
  { pts: 20,  emoji: "🧭", label: "Boussole",             desc: "Pour ne jamais se perdre." },
  { pts: 35,  emoji: "🗺️", label: "Carte du trésor",      desc: "L'aventure commence vraiment !" },
  { pts: 55,  emoji: "🎩", label: "Chapeau d'explorateur",desc: "Le style de l'aventurier." },
  { pts: 80,  emoji: "🔪", label: "Couteau suisse",       desc: "L'outil ultime du survivant." },
  { pts: 110, emoji: "🏕️", label: "Tente",                desc: "Sa base de camp dans la forêt." },
  { pts: 150, emoji: "⭐", label: "Étoile polaire",        desc: "Niveau légendaire atteint !" },
];

const LEVEL_THRESHOLDS = [0, 10, 25, 45, 70, 100, 140, 190];
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

function getUnlockedItems(points, bonusItems = []) {
  const auto = RACCOON_ITEMS.filter(i => i.pts <= points);
  const bonus = bonusItems.map(e => RACCOON_ITEMS.find(i => i.emoji === e)).filter(Boolean);
  const all = [...auto];
  bonus.forEach(b => { if (!all.find(a => a.emoji === b.emoji)) all.push(b); });
  return all;
}

// ─── RATON SVG ANIMÉ ─────────────────────────────────────────────────────────
function RaccoonSVG({ items = [], size = 120, animate = true }) {
  const hasBackpack = items.find(i => i.emoji === "🎒");
  const hasHat = items.find(i => i.emoji === "🎩");
  const hasTorch = items.find(i => i.emoji === "🕯️");

  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        .body-bounce { animation: ${animate ? "bodyBounce 2s ease-in-out infinite" : "none"}; transform-origin: 50px 70px; }
        .tail-wag { animation: ${animate ? "tailWag 1.5s ease-in-out infinite" : "none"}; transform-origin: 50px 100px; }
        .ear-twitch { animation: ${animate ? "earTwitch 3s ease-in-out infinite" : "none"}; transform-origin: 50px 20px; }
        .eye-blink { animation: ${animate ? "eyeBlink 4s ease-in-out infinite" : "none"}; }
        @keyframes bodyBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes tailWag { 0%,100%{transform:rotate(-15deg)} 50%{transform:rotate(15deg)} }
        @keyframes earTwitch { 0%,90%,100%{transform:rotate(0)} 92%{transform:rotate(-8deg)} 96%{transform:rotate(5deg)} }
        @keyframes eyeBlink { 0%,94%,100%{transform:scaleY(1)} 96%,98%{transform:scaleY(0.1)} }
      `}</style>

      {/* TORCHE lumière ambiante */}
      {hasTorch && (
        <ellipse cx="75" cy="85" rx="18" ry="12" fill="#fbbf24" opacity="0.15"/>
      )}

      {/* QUEUE */}
      <g className="tail-wag">
        <ellipse cx="50" cy="118" rx="14" ry="8" fill="#6b7280"/>
        <ellipse cx="50" cy="118" rx="10" ry="5" fill="#f3f4f6"/>
        {/* Rayures queue */}
        <ellipse cx="50" cy="115" rx="10" ry="3" fill="#374151" opacity="0.4"/>
        <ellipse cx="50" cy="120" rx="10" ry="3" fill="#374151" opacity="0.4"/>
      </g>

      <g className="body-bounce">
        {/* CORPS */}
        <ellipse cx="50" cy="90" rx="22" ry="26" fill="#9ca3af"/>
        <ellipse cx="50" cy="95" rx="14" ry="18" fill="#f3f4f6"/>

        {/* SAC À DOS */}
        {hasBackpack && (
          <g>
            <rect x="62" y="75" width="14" height="20" rx="4" fill="#854d0e"/>
            <rect x="64" y="73" width="10" height="4" rx="2" fill="#92400e"/>
            <rect x="65" y="82" width="8" height="2" rx="1" fill="#78350f"/>
            <rect x="68" y="78" width="3" height="8" rx="1" fill="#78350f"/>
          </g>
        )}

        {/* PATTES AVANT */}
        <ellipse cx="33" cy="103" rx="7" ry="5" fill="#6b7280"/>
        <ellipse cx="67" cy="103" rx="7" ry="5" fill="#6b7280"/>
        <ellipse cx="33" cy="104" rx="5" ry="3" fill="#374151"/>
        <ellipse cx="67" cy="104" rx="5" ry="3" fill="#374151"/>

        {/* PATTES ARRIÈRE */}
        <ellipse cx="38" cy="113" rx="9" ry="5" fill="#6b7280"/>
        <ellipse cx="62" cy="113" rx="9" ry="5" fill="#6b7280"/>

        {/* TÊTE */}
        <ellipse cx="50" cy="55" rx="20" ry="18" fill="#9ca3af"/>

        {/* OREILLES */}
        <g className="ear-twitch">
          <ellipse cx="35" cy="38" rx="7" ry="9" fill="#6b7280"/>
          <ellipse cx="35" cy="39" rx="4" ry="6" fill="#f9a8d4"/>
          <ellipse cx="65" cy="38" rx="7" ry="9" fill="#6b7280"/>
          <ellipse cx="65" cy="39" rx="4" ry="6" fill="#f9a8d4"/>
        </g>

        {/* CHAPEAU */}
        {hasHat && (
          <g>
            <ellipse cx="50" cy="40" rx="22" ry="5" fill="#1e3a5f"/>
            <rect x="38" y="18" width="24" height="23" rx="4" fill="#1e3a5f"/>
            <rect x="40" y="28" width="20" height="3" rx="1" fill="#f59e0b" opacity="0.8"/>
          </g>
        )}

        {/* MASQUE YEUX */}
        <ellipse cx="50" cy="53" rx="16" ry="8" fill="#374151"/>

        {/* YEUX */}
        <g className="eye-blink">
          <circle cx="43" cy="52" r="5" fill="white"/>
          <circle cx="57" cy="52" r="5" fill="white"/>
          <circle cx="44" cy="52" r="3" fill="#1e293b"/>
          <circle cx="58" cy="52" r="3" fill="#1e293b"/>
          <circle cx="44.8" cy="51" r="1" fill="white"/>
          <circle cx="58.8" cy="51" r="1" fill="white"/>
        </g>

        {/* NEZ */}
        <ellipse cx="50" cy="59" rx="4" ry="3" fill="#374151"/>
        <ellipse cx="49" cy="58" rx="1.5" ry="1" fill="#6b7280" opacity="0.5"/>

        {/* BOUCHE souriante */}
        <path d="M45 63 Q50 68 55 63" stroke="#374151" strokeWidth="1.5" fill="none" strokeLinecap="round"/>

        {/* JOUES */}
        <ellipse cx="38" cy="60" rx="5" ry="3" fill="#fca5a5" opacity="0.4"/>
        <ellipse cx="62" cy="60" rx="5" ry="3" fill="#fca5a5" opacity="0.4"/>

        {/* TORCHE main */}
        {hasTorch && (
          <g>
            <rect x="24" y="95" width="4" height="12" rx="2" fill="#92400e"/>
            <ellipse cx="26" cy="94" rx="4" ry="5" fill="#fbbf24"/>
            <ellipse cx="26" cy="93" rx="2" ry="3" fill="#fde68a"/>
          </g>
        )}
      </g>
    </svg>
  );
}

// ─── CABANE SVG ───────────────────────────────────────────────────────────────
function TreehouseSVG() {
  return (
    <svg width="100%" height="200" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
      {/* Ciel étoilé */}
      <rect width="320" height="200" fill="#0f172a"/>
      {[...Array(20)].map((_, i) => (
        <circle key={i} cx={Math.sin(i * 37) * 150 + 160} cy={Math.cos(i * 53) * 80 + 60}
          r={i % 3 === 0 ? 1.5 : 1} fill="white" opacity={0.5 + (i % 3) * 0.2}/>
      ))}
      {/* Lune */}
      <circle cx="270" cy="35" r="22" fill="#fef3c7"/>
      <circle cx="280" cy="28" r="17" fill="#0f172a"/>
      {/* Arbre gauche */}
      <rect x="40" y="120" width="18" height="80" rx="4" fill="#4a2c0a"/>
      <ellipse cx="49" cy="110" rx="35" ry="45" fill="#14532d"/>
      <ellipse cx="49" cy="95" rx="28" ry="38" fill="#166534"/>
      {/* Arbre droit */}
      <rect x="250" y="130" width="16" height="70" rx="4" fill="#4a2c0a"/>
      <ellipse cx="258" cy="118" rx="30" ry="40" fill="#14532d"/>
      <ellipse cx="258" cy="104" rx="24" ry="33" fill="#166534"/>
      {/* Plateforme */}
      <rect x="80" y="115" width="160" height="12" rx="4" fill="#92400e"/>
      <rect x="85" y="111" width="150" height="8" rx="3" fill="#b45309"/>
      {/* Cabane */}
      <rect x="90" y="60" width="140" height="60" rx="6" fill="#78350f"/>
      <rect x="95" y="65" width="130" height="50" rx="4" fill="#92400e"/>
      {/* Toit */}
      <polygon points="80,65 160,25 240,65" fill="#1e3a5f"/>
      <polygon points="85,65 160,30 235,65" fill="#1e40af"/>
      {/* Fenêtre lumière */}
      <rect x="125" y="75" width="30" height="25" rx="4" fill="#fef3c7"/>
      <rect x="127" y="77" width="26" height="21" rx="3" fill="#fde68a"/>
      <line x1="140" y1="77" x2="140" y2="98" stroke="#92400e" strokeWidth="2"/>
      <line x1="127" y1="87" x2="153" y2="87" stroke="#92400e" strokeWidth="2"/>
      {/* Porte */}
      <rect x="170" y="80" width="22" height="35" rx="4" fill="#4a2c0a"/>
      <circle cx="188" cy="98" r="2" fill="#fbbf24"/>
      {/* Échelle */}
      <line x1="105" y1="127" x2="105" y2="170" stroke="#92400e" strokeWidth="3"/>
      <line x1="118" y1="127" x2="118" y2="170" stroke="#92400e" strokeWidth="3"/>
      {[135, 148, 161].map(y => (
        <line key={y} x1="105" y1={y} x2="118" y2={y} stroke="#b45309" strokeWidth="2"/>
      ))}
      {/* Sol herbe */}
      <ellipse cx="160" cy="195" rx="130" ry="12" fill="#14532d" opacity="0.6"/>
    </svg>
  );
}

// ─── ÉTOILES ─────────────────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 32 }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} onClick={() => onChange?.(s)}
          style={{ fontSize: size, cursor: "pointer", filter: s <= value ? "none" : "grayscale(1) opacity(0.25)", transition: "transform 0.15s", userSelect: "none", display: "inline-block" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.3)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>⭐</span>
      ))}
    </div>
  );
}

// ─── MINI CHART ──────────────────────────────────────────────────────────────
function MiniChart({ sessions }) {
  if (!sessions?.length)
    return <div style={{ textAlign: "center", color: "#475569", padding: "20px 0", fontSize: 13 }}>Aucune séance encore</div>;
  const last7 = sessions.slice(-7);
  const maxPts = Math.max(...last7.map(s => s.points), 5);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
      {last7.map((s, i) => {
        const h = Math.max(8, (s.points / maxPts) * 72);
        const d = new Date(s.date);
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>{s.points}</div>
            <div style={{ width: "100%", height: h, borderRadius: "6px 6px 0 0", background: "linear-gradient(180deg, #818cf8, #3b82f6)", transition: "height 0.5s" }} />
            <div style={{ fontSize: 9, color: "#475569" }}>{d.getDate()}/{d.getMonth() + 1}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── DÉFAUT PROFIL ────────────────────────────────────────────────────────────
const DEFAULT_PROFILE = {
  name: CHILD_NAME,
  totalPoints: 0,
  sessions: [],
  unlockedBonusItems: [],
  equippedItems: [],
  weeklyConfig: {
    duration: 25,
    difficulty: "CE1/CE2",
    focusPoints: "Sons complexes (ou/on), accord sujet-verbe, lettres attachées",
    presetFormat: DEFAULT_PRESET,
  },
  focus: { mots: "", verbes: "", remarque: "", notesamaine: 0, priorite: "" },
  memory: { usedVerbs: [], usedWords: [], weakPoints: [] },
};

// ─── APP ─────────────────────────────────────────────────────────────────────
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
  const [tempConfig, setTempConfig] = useState(null);
  const [tempFocus, setTempFocus] = useState(null);
  const [carteItems, setCarteItems] = useState({
    conjugaison: false, transposition: false, negation: false,
    orthographe: false, dictee: false, multiplication: false,
    soustraction: false, division: false, probleme: false, geometrie: false,
  });
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", text: "Salut aventurier ! Je suis Roki, ton guide dans cette forêt mystérieuse 🌲 Tu as travaillé dur aujourd'hui ?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const showToast = (msg, color = "#34d399") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    async function load() {
      let data = await supabaseLoad();
      if (!data) {
        try { const l = localStorage.getItem("leo_profile_v1"); if (l) data = JSON.parse(l); } catch {}
      }
      setProfile(data || { ...DEFAULT_PROFILE });
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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

  async function fetchCorpus(niveau, categories = []) {
    try {
      // Construire le filtre niveau : on récupère le niveau exact + les niveaux inférieurs
      const niveauxMap = { "CE1 début": ["CE1"], "CE1/CE2": ["CE1", "CE2"], "CE2": ["CE1", "CE2"], "CE2 avancé": ["CE1", "CE2", "CM1"], "CM1": ["CE1", "CE2", "CM1"] };
      const niveaux = niveauxMap[niveau] || ["CE1", "CE2"];
      const niveauFilter = niveaux.map(n => `niveau=eq.${n}`).join("&");

      // Filtre catégorie si spécifié
      const catFilter = categories.length > 0
        ? `&categorie=in.(${categories.join(",")})`
        : "";

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/corpus?actif=eq.true&${niveauFilter}${catFilter}&select=categorie,sous_type,niveau,contenu&limit=20`,
        { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) return "";

      // Formater les exemples pour le prompt
      const grouped = {};
      rows.forEach(r => {
        const key = r.categorie;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r.contenu);
      });

      let corpus = "=== EXEMPLES D EXERCICES VALIDÉS (base Supabase) ===\n";
      Object.entries(grouped).forEach(([cat, exemples]) => {
        corpus += `\n--- ${cat.toUpperCase()} ---\n`;
        // Prendre max 2 exemples par catégorie pour ne pas surcharger le prompt
        exemples.slice(0, 2).forEach((ex, i) => {
          corpus += `Exemple ${i + 1} :\n${ex}\n\n`;
        });
      });
      return corpus;
    } catch {
      return ""; // Si Supabase indisponible, on continue sans corpus
    }
  }

  async function buildPrompt(mode, corpusText = "") {
    const { memory, weeklyConfig, focus } = profile;
    const focusBlock = [
      focus?.mots ? `Mots de la semaine : ${focus.mots}` : "",
      focus?.verbes ? `Verbes en cours : ${focus.verbes}` : "",
      focus?.remarque ? `Remarque maîtresse : ${focus.remarque}` : "",
      focus?.priorite ? `Point prioritaire : ${focus.priorite}` : "",
    ].filter(Boolean).join("\n");
    const memCtx = [
      memory.usedVerbs.length ? `Verbes DÉJÀ utilisés (ne PAS répéter) : ${memory.usedVerbs.slice(-12).join(", ")}` : "",
      memory.usedWords.length ? `Mots dictée déjà vus : ${memory.usedWords.slice(-12).join(", ")}` : "",
      memory.weakPoints.length ? `Points faibles : ${memory.weakPoints.slice(-5).join(" | ")}` : "",
    ].filter(Boolean).join("\n");
    const formatBlock = mode === "programme"
      ? `⚠️ FORMAT IMPOSÉ STRICTEMENT :\n${weeklyConfig.presetFormat}`
      : `Exercices demandés (UNIQUEMENT ceux-ci) : ${Object.entries(carteItems).filter(([, v]) => v).map(([k]) => k).join(", ")}`;

    return `${CORPUS_PEDAGOGIQUE}
${corpusText ? corpusText : ""}
=== INSTRUCTION ===
Tu es un instituteur expert. Génère une fiche pour ${CHILD_NAME}, classe ${weeklyConfig.difficulty}.
Niveau : ${weeklyConfig.difficulty} · Durée : ${weeklyConfig.duration} min
${focusBlock ? `FOCUS :\n${focusBlock}` : ""}
${memCtx ? `MÉMOIRE :\n${memCtx}` : ""}
${contextNote ? `CONTEXTE : ${contextNote}` : ""}
${formatBlock}
RÈGLES ABSOLUES :
1. Exemple AVANT chaque exercice — inspire-toi des exemples validés ci-dessus
2. Tirets longs _______________ pour réponses (min 15 caractères)
3. Respecter STRICTEMENT les exercices demandés, ni plus ni moins
4. Ne JAMAIS réutiliser les verbes/mots en mémoire
5. Ne jamais mélanger contexte parent et contenu exercice
6. Adapter la difficulté au niveau ${weeklyConfig.difficulty} sans jamais la plafonner
Réponds UNIQUEMENT en JSON valide :
{"sessionTitle":"...","exercises":[{"type":"...","title":"...","duration":"X min","emoji":"...","instructions":"...","example":"Exemple : ...","content":"contenu avec _______________","parentNote":"...","verbsUsed":[],"wordsUsed":[]}],"encouragement":"..."}`;
  }

  async function generateExercises(mode) {
    if (!profile) return;
    if (mode === "carte" && !Object.values(carteItems).some(Boolean)) {
      showToast("Sélectionne au moins un exercice !", "#f59e0b"); return;
    }
    setGenerating(true);
    setGeneratedExercises(null);
    setSessionScore(null);
    setStarRating(0);
    setInsightText("");
    try {
      // Récupérer les exemples du corpus Supabase selon le niveau et les catégories demandées
      const categories = mode === "carte"
        ? Object.entries(carteItems).filter(([, v]) => v).map(([k]) => k)
        : [];
      const corpusText = await fetchCorpus(profile.weeklyConfig.difficulty, categories);
      const prompt = await buildPrompt(mode, corpusText);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const raw = data?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Pas de JSON");
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
    const points = starRating; // 1 à 5 points = nombre d'étoiles
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
        weakPoints: insightText ? [...(profile.memory.weakPoints || []), insightText].slice(-10) : (profile.memory.weakPoints || []),
      },
    };
    // Vérifier nouveaux items débloqués
    const before = getUnlockedItems(profile.totalPoints, profile.unlockedBonusItems || []);
    const after = getUnlockedItems(newProfile.totalPoints, newProfile.unlockedBonusItems || []);
    if (after.length > before.length) {
      const newItem = after[after.length - 1];
      setTimeout(() => showToast(`🎉 ${newItem.emoji} ${newItem.label} débloqué !`, "#f59e0b"), 500);
    }
    await saveProfile(newProfile);
    setSessionScore({ points });
    showToast(`+${points} point${points > 1 ? "s" : ""} ! 🎉`, "#a78bfa");
  }

  async function sendChat(msg) {
    if (!msg.trim()) return;
    const newMessages = [...chatMessages, { role: "user", text: msg }];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    const unlockedItems = getUnlockedItems(profile.totalPoints, profile.unlockedBonusItems || []);
    const itemsList = unlockedItems.map(i => i.label).join(", ");
    const systemPrompt = `Tu es Roki, un raton laveur aventurier courageux qui vit dans une cabane dans les arbres. Tu parles à Léo, un enfant de 7-8 ans. Tu es son guide et ami dans ses aventures d'apprentissage. Tu connais ses équipements : ${itemsList}. Tu encourages avec courage et humour. Réponds en 2-3 phrases maximum, de façon vive et aventurière. Utilise des émojis de temps en temps.`;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `${systemPrompt}\n\nLéo dit : "${msg}"\n\nRoki répond :` }),
      });
      const data = await res.json();
      const reply = data?.text?.trim() || "Je suis en train d'explorer la forêt... répète !";
      setChatMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", text: "Oups, je suis perdu dans la forêt ! Réessaie 🌲" }]);
    }
    setChatLoading(false);
  }

  // ── STYLES ──
  const S = {
    app: {
      minHeight: "100vh",
      background: "linear-gradient(160deg, #020817 0%, #0f172a 40%, #1a103a 70%, #0c1220 100%)",
      fontFamily: "'Georgia', serif",
      color: "white",
      paddingBottom: 90,
    },
    header: {
      background: "rgba(2,8,23,0.85)",
      borderBottom: "1px solid rgba(99,102,241,0.2)",
      padding: "14px 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      backdropFilter: "blur(20px)",
      position: "sticky", top: 0, zIndex: 100,
      boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
    },
    card: {
      background: "rgba(15,23,42,0.7)",
      border: "1px solid rgba(99,102,241,0.15)",
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      backdropFilter: "blur(10px)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    },
    btn: {
      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
      border: "none", borderRadius: 16,
      padding: "15px 24px", color: "white",
      fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700,
      cursor: "pointer", width: "100%",
      boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
      transition: "transform 0.15s, box-shadow 0.15s",
    },
    btnSm: {
      background: "rgba(99,102,241,0.15)",
      border: "1px solid rgba(99,102,241,0.3)",
      borderRadius: 12, padding: "8px 16px", color: "#a5b4fc",
      fontFamily: "Georgia, serif", fontSize: 13, cursor: "pointer",
      transition: "all 0.2s",
    },
    btnToggle: (on) => ({
      background: on ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "rgba(15,23,42,0.6)",
      border: `1px solid ${on ? "#6366f1" : "rgba(99,102,241,0.2)"}`,
      borderRadius: 14, padding: "10px 16px", color: on ? "white" : "#64748b",
      fontFamily: "Georgia, serif", fontSize: 13, fontWeight: on ? 700 : 400,
      cursor: "pointer", transition: "all 0.2s",
      boxShadow: on ? "0 4px 15px rgba(99,102,241,0.3)" : "none",
    }),
    mainTab: (on) => ({
      flex: 1, padding: "14px 4px 10px",
      background: on ? "rgba(99,102,241,0.15)" : "transparent",
      border: "none",
      borderBottom: on ? "2px solid #818cf8" : "2px solid transparent",
      color: on ? "#a5b4fc" : "#475569",
      cursor: "pointer",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      transition: "all 0.2s",
    }),
    bottomNav: {
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(2,8,23,0.95)",
      borderTop: "1px solid rgba(99,102,241,0.2)",
      display: "flex", zIndex: 200,
      backdropFilter: "blur(20px)",
    },
    navBtn: (a) => ({
      flex: 1, padding: "12px 4px",
      background: "none", border: "none",
      color: a ? "#818cf8" : "#334155",
      cursor: "pointer",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
      transition: "color 0.2s",
    }),
    input: {
      background: "rgba(15,23,42,0.8)",
      border: "1px solid rgba(99,102,241,0.2)",
      borderRadius: 12, padding: "12px 16px", color: "white",
      fontFamily: "Georgia, serif", fontSize: 14, width: "100%",
      outline: "none", resize: "vertical",
    },
    badge: (c) => ({
      background: c + "20", border: `1px solid ${c}40`,
      borderRadius: 20, padding: "4px 14px",
      fontSize: 12, color: c, fontWeight: 700, display: "inline-block",
    }),
    wrap: { padding: "0 16px", maxWidth: 600, margin: "0 auto" },
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020817" }}>
      <div style={{ textAlign: "center" }}>
        <RaccoonSVG items={[]} size={100} animate={true} />
        <div style={{ color: "#a5b4fc", fontFamily: "Georgia, serif", marginTop: 16, fontSize: 16 }}>
          Chargement de l'école de {CHILD_NAME}…
        </div>
      </div>
    </div>
  );

  const li = getLevelInfo(profile.totalPoints);
  const unlockedItems = getUnlockedItems(profile.totalPoints, profile.unlockedBonusItems || []);
  const equippedItems = (profile.equippedItems || []).map(e => RACCOON_ITEMS.find(i => i.emoji === e)).filter(Boolean);

  // ── IMPRESSION ──
  if (printMode && generatedExercises) return (
    <div style={{ fontFamily: "Georgia, serif", padding: "15mm", color: "#1e293b", background: "white" }}>
      <div style={{ textAlign: "center", borderBottom: "3px solid #4f46e5", paddingBottom: 14, marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 20, color: "#4f46e5" }}>📚 École de {CHILD_NAME}</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {profile.weeklyConfig.duration} min · {profile.weeklyConfig.difficulty}
        </p>
        <p style={{ margin: "4px 0 0", color: "#4f46e5", fontSize: 14, fontWeight: 700 }}>{generatedExercises.sessionTitle}</p>
      </div>
      {generatedExercises.exercises?.map((ex, i) => (
        <div key={i} style={{ marginBottom: 28, pageBreakInside: "avoid" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", background: "#f8fafc", padding: "8px 14px", borderRadius: 10, borderLeft: "4px solid #4f46e5", marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>{ex.emoji}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Exercice {i + 1} — {ex.title}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{ex.duration}</div>
            </div>
          </div>
          <p style={{ fontStyle: "italic", color: "#475569", margin: "0 0 6px", fontSize: 12 }}>📌 {ex.instructions}</p>
          {ex.example && <p style={{ background: "#eff6ff", padding: "6px 12px", borderRadius: 8, fontSize: 12, color: "#1d4ed8", margin: "0 0 10px", borderLeft: "3px solid #3b82f6" }}>{ex.example}</p>}
          <div style={{ whiteSpace: "pre-line", fontSize: 14, lineHeight: 3.2, border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, minHeight: 80 }}>{ex.content}</div>
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
      {/* Étoiles de fond animées */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        {[...Array(30)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: i % 4 === 0 ? 2 : 1,
            height: i % 4 === 0 ? 2 : 1,
            background: "white",
            borderRadius: "50%",
            left: `${(Math.sin(i * 31) * 50 + 50)}%`,
            top: `${(Math.cos(i * 47) * 50 + 50)}%`,
            opacity: 0.3 + (i % 5) * 0.1,
            animation: `twinkle ${2 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${(i % 7) * 0.4}s`,
          }} />
        ))}
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: toast.color, color: "white", padding: "12px 28px",
          borderRadius: 24, fontWeight: 700, fontSize: 14, zIndex: 999,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)", whiteSpace: "nowrap",
          animation: "slideDown 0.3s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div style={{ ...S.header, position: "sticky", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, cursor: "pointer" }} onClick={() => setView("cabane")}>
            <RaccoonSVG items={equippedItems.length > 0 ? equippedItems : [RACCOON_ITEMS[0]]} size={44} animate={true} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.02em" }}>École de {CHILD_NAME}</div>
            <div style={{ fontSize: 11, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
              {profile.weeklyConfig.difficulty}
              {syncStatus === "saving" && <span style={{ color: "#f59e0b" }}>● sync…</span>}
              {syncStatus === "saved" && <span style={{ color: "#34d399" }}>✓ sync</span>}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={S.badge(li.color)}>{li.name}</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>{profile.totalPoints} pts</div>
        </div>
      </div>

      <div style={{ ...S.wrap, position: "relative", zIndex: 1 }}>

        {/* ── VUE EXERCISES ── */}
        {view === "exercises" && generatedExercises && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 0 12px" }}>
              <button style={S.btnSm} onClick={() => setView("home")}>← Retour</button>
              <div style={{ flex: 1, fontWeight: 700, fontSize: 14, color: "#a5b4fc" }}>{generatedExercises.sessionTitle}</div>
              <button style={S.btnSm} onClick={() => { setPrintMode(true); setTimeout(() => { window.print(); setPrintMode(false); }, 300); }}>🖨️ A4</button>
            </div>
            {generatedExercises.exercises?.map((ex, i) => (
              <div key={i} style={{ ...S.card, borderLeft: "3px solid #6366f1" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                  <span style={{ fontSize: 26 }}>{ex.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#e2e8f0" }}>Exercice {i + 1} — {ex.title}</div>
                    <div style={{ fontSize: 12, color: "#475569" }}>⏱ {ex.duration}</div>
                  </div>
                </div>
                <div style={{ background: "rgba(99,102,241,0.1)", borderRadius: 12, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "#a5b4fc", fontStyle: "italic", borderLeft: "2px solid #6366f1" }}>
                  📌 {ex.instructions}
                </div>
                {ex.example && (
                  <div style={{ background: "rgba(52,211,153,0.08)", borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#6ee7b7", borderLeft: "2px solid #34d399" }}>
                    {ex.example}
                  </div>
                )}
                <div style={{ fontSize: 14, lineHeight: 3, color: "#cbd5e1", whiteSpace: "pre-line", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12 }}>
                  {ex.content}
                </div>
                {ex.parentNote && <div style={{ marginTop: 10, fontSize: 12, color: "#7c3aed", fontStyle: "italic" }}>👨‍👩‍👧 {ex.parentNote}</div>}
              </div>
            ))}
            {!sessionScore ? (
              <div style={{ ...S.card, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)" }}>
                <div style={{ fontStyle: "italic", color: "#a5b4fc", fontSize: 14, textAlign: "center", marginBottom: 18 }}>
                  💪 {generatedExercises.encouragement}
                </div>
                <div style={{ fontWeight: 700, marginBottom: 6, color: "#e2e8f0" }}>🔍 Observations de fin de séance</div>
                <textarea style={{ ...S.input, minHeight: 70, marginBottom: 16 }}
                  placeholder="Ex: Léo hésite sur les accords au pluriel..."
                  value={insightText} onChange={e => setInsightText(e.target.value)} />
                <div style={{ fontWeight: 700, marginBottom: 12, textAlign: "center", color: "#e2e8f0" }}>Comment s'est passée la séance ?</div>
                <StarRating value={starRating} onChange={setStarRating} />
                <button style={{ ...S.btn, marginTop: 16 }} onClick={validateSession}>✅ Valider la séance</button>
              </div>
            ) : (
              <div style={{ ...S.card, textAlign: "center", background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}>
                <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#34d399" }}>+{sessionScore.points} point{sessionScore.points > 1 ? "s" : ""} !</div>
                <div style={{ color: "#475569", marginTop: 4, marginBottom: 20 }}>Séance enregistrée ✓</div>
                <button style={S.btn} onClick={() => { setView("home"); setGeneratedExercises(null); setContextNote(""); }}>🏠 Retour à l'accueil</button>
              </div>
            )}
          </>
        )}

        {/* ── VUE HOME ── */}
        {view === "home" && (
          <>
            {/* ONGLETS */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(99,102,241,0.15)", marginTop: 16, marginBottom: 20 }}>
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

            {/* ONGLET PROGRAMMÉ */}
            {mainTab === "programme" && (
              <>
                {/* Carte niveau + raton */}
                <div style={{ ...S.card, background: `linear-gradient(135deg, rgba(15,23,42,0.9), rgba(26,16,58,0.9))`, border: `1px solid ${li.color}30`, marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ flexShrink: 0 }}>
                      <RaccoonSVG items={equippedItems.length > 0 ? equippedItems : [RACCOON_ITEMS[0]]} size={90} animate={true} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: li.color }}>{li.name}</div>
                      <div style={{ fontSize: 13, color: "#475569", marginBottom: 10 }}>{profile.totalPoints} points · {unlockedItems.length} équipements</div>
                      <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, height: 8, overflow: "hidden", marginBottom: 6 }}>
                        <div style={{ width: `${li.progress}%`, height: "100%", background: `linear-gradient(90deg, ${li.color}90, ${li.color})`, borderRadius: 8, transition: "width 1s" }} />
                      </div>
                      {li.pointsToNext > 0 && (
                        <div style={{ fontSize: 11, color: "#475569" }}>{li.pointsToNext} pts pour le prochain niveau</div>
                      )}
                      {(() => {
                        const next = RACCOON_ITEMS.find(item => item.pts > profile.totalPoints && !unlockedItems.find(u => u.emoji === item.emoji));
                        return next ? <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 2 }}>Prochain : {next.emoji} {next.label} ({next.pts - profile.totalPoints} pts)</div> : null;
                      })()}
                    </div>
                  </div>
                  <div style={{ marginTop: 12, textAlign: "right" }}>
                    <span style={{ fontSize: 11, color: "#1e293b", cursor: "pointer", userSelect: "none" }} onClick={() => setShowParentUnlock(v => !v)}>
                      ··· parent
                    </span>
                  </div>
                  {showParentUnlock && (
                    <div style={{ marginTop: 10, background: "rgba(0,0,0,0.3)", borderRadius: 14, padding: 14, border: "1px solid rgba(99,102,241,0.2)" }}>
                      {!parentUnlocked ? (
                        <>
                          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Code parent :</div>
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
                          <div style={{ fontSize: 12, color: "#34d399", marginBottom: 10 }}>✅ Débloquer un item bonus :</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {RACCOON_ITEMS.filter(item => !unlockedItems.find(u => u.emoji === item.emoji)).map(item => (
                              <button key={item.pts} style={S.btnSm} onClick={async () => {
                                const newProfile = { ...profile, unlockedBonusItems: [...(profile.unlockedBonusItems || []), item.emoji] };
                                await saveProfile(newProfile);
                                showToast(`${item.emoji} ${item.label} débloqué ! 🎉`, "#f59e0b");
                              }}>
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
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>📝 Contexte du jour <span style={{ fontSize: 11 }}>(optionnel)</span></div>
                  <textarea style={{ ...S.input, marginBottom: 14, minHeight: 60 }}
                    placeholder="Léo a eu du mal avec les accords aujourd'hui..."
                    value={contextNote} onChange={e => setContextNote(e.target.value)} />
                  {profile.focus?.mots && (
                    <div style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#6ee7b7" }}>
                      🎯 Focus actif · {profile.focus.mots.split(",").slice(0, 3).join(", ")}{profile.focus.mots.split(",").length > 3 ? "…" : ""}
                    </div>
                  )}
                  <button style={{ ...S.btn, opacity: generating ? 0.65 : 1 }}
                    onClick={() => generateExercises("programme")} disabled={generating}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(99,102,241,0.5)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.4)"; }}>
                    {generating ? "⏳ Génération en cours…" : "✨ Générer la séance programmée"}
                  </button>
                </div>

                <div style={S.card}>
                  <div style={{ fontWeight: 700, marginBottom: 14, color: "#e2e8f0" }}>📈 Progression récente</div>
                  <MiniChart sessions={profile.sessions} />
                </div>
              </>
            )}

            {/* ONGLET À LA CARTE */}
            {mainTab === "carte" && (
              <>
                <div style={S.card}>
                  <div style={{ fontWeight: 700, marginBottom: 6, color: "#e2e8f0" }}>🎲 Choisis les exercices du jour</div>
                  <div style={{ fontSize: 12, color: "#475569", marginBottom: 16 }}>Sélectionne un ou plusieurs types d'exercices.</div>
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
                      <button key={item.key} style={S.btnToggle(carteItems[item.key])}
                        onClick={() => setCarteItems(prev => ({ ...prev, [item.key]: !prev[item.key] }))}>
                        {item.emoji} {item.label}
                      </button>
                    ))}
                  </div>
                  <textarea style={{ ...S.input, marginBottom: 14, minHeight: 60 }}
                    placeholder="Contexte du jour (optionnel)..."
                    value={contextNote} onChange={e => setContextNote(e.target.value)} />
                  <button style={{ ...S.btn, opacity: generating ? 0.65 : 1 }}
                    onClick={() => generateExercises("carte")} disabled={generating}>
                    {generating ? "⏳ Génération en cours…" : "🎲 Générer la séance à la carte"}
                  </button>
                </div>
                {profile.memory.weakPoints.length > 0 && (
                  <div style={S.card}>
                    <div style={{ fontWeight: 700, marginBottom: 10, color: "#e2e8f0" }}>🧠 Mémoire</div>
                    {profile.memory.weakPoints.slice(-3).map((w, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>· {w}</div>
                    ))}
                    {profile.memory.usedVerbs.length > 0 && (
                      <div style={{ fontSize: 12, color: "#334155", marginTop: 6 }}>Verbes vus : {profile.memory.usedVerbs.slice(-6).join(", ")}</div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ONGLET PHOTO */}
            {mainTab === "photo" && (
              <div style={{ ...S.card, textAlign: "center", padding: "48px 24px" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📷</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: "#e2e8f0" }}>Analyse de photo</div>
                <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.8 }}>
                  Prends en photo un exercice du cahier de Léo.<br/>L'app génèrera une fiche similaire avec de nouveaux contenus.
                </div>
                <div style={{ marginTop: 24, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 16, padding: "16px 20px", fontSize: 13, color: "#818cf8" }}>
                  🚧 En cours de développement — bientôt disponible
                </div>
              </div>
            )}
          </>
        )}

        {/* ── VUE CABANE ── */}
        {view === "cabane" && (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, margin: "20px 0 4px", color: "#e2e8f0" }}>🌲 La cabane de Roki</div>
            <div style={{ fontSize: 12, color: "#475569", marginBottom: 16 }}>La base secrète de ton compagnon aventurier</div>

            {/* Décor cabane */}
            <div style={{ borderRadius: 20, overflow: "hidden", marginBottom: 16, border: "1px solid rgba(99,102,241,0.2)" }}>
              <TreehouseSVG />
              <div style={{ background: "rgba(15,23,42,0.9)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                <RaccoonSVG items={equippedItems.length > 0 ? equippedItems : [RACCOON_ITEMS[0]]} size={80} animate={true} />
                <div>
                  <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Roki l'Aventurier</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>{unlockedItems.length} équipements débloqués</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                    {unlockedItems.map((item, i) => (
                      <span key={i} style={{ fontSize: 18 }} title={item.label}>{item.emoji}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Équipements */}
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: "#e2e8f0" }}>🎒 Équipements de Roki</div>
              {RACCOON_ITEMS.map((item, i) => {
                const unlocked = !!unlockedItems.find(u => u.emoji === item.emoji);
                const equipped = !!(profile.equippedItems || []).includes(item.emoji);
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 0",
                    borderBottom: i < RACCOON_ITEMS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    opacity: unlocked ? 1 : 0.35,
                  }}>
                    <span style={{ fontSize: 28 }}>{item.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: unlocked ? "#e2e8f0" : "#334155" }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: "#475569" }}>{unlocked ? item.desc : `Débloquer à ${item.pts} pts`}</div>
                    </div>
                    {unlocked && (
                      <button style={S.btnToggle(equipped)} onClick={async () => {
                        const current = profile.equippedItems || [];
                        const newEquipped = equipped ? current.filter(e => e !== item.emoji) : [...current, item.emoji];
                        await saveProfile({ ...profile, equippedItems: newEquipped });
                      }}>
                        {equipped ? "Équipé ✓" : "Équiper"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Chat avec Roki */}
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: "#e2e8f0" }}>💬 Parle avec Roki</div>
              <div style={{ minHeight: 200, maxHeight: 300, overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}>
                    {msg.role === "assistant" && <span style={{ fontSize: 20, marginRight: 8, flexShrink: 0 }}>🦝</span>}
                    <div style={{
                      background: msg.role === "user" ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "rgba(30,41,59,0.8)",
                      border: msg.role === "assistant" ? "1px solid rgba(99,102,241,0.2)" : "none",
                      borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      padding: "10px 14px", fontSize: 13, color: "#e2e8f0",
                      maxWidth: "75%", lineHeight: 1.5,
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>🦝</span>
                    <div style={{ background: "rgba(30,41,59,0.8)", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#475569" }}>
                      Roki réfléchit…
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  style={{ ...S.input, flex: 1 }}
                  placeholder="Dis quelque chose à Roki…"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(chatInput); } }}
                />
                <button style={{ ...S.btnSm, padding: "10px 16px" }} onClick={() => sendChat(chatInput)} disabled={chatLoading}>
                  ➤
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── VUE SUIVI ── */}
        {view === "stats" && (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, margin: "20px 0 14px", color: "#e2e8f0" }}>📊 Suivi de {CHILD_NAME}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Séances", value: profile.sessions.length, icon: "📚" },
                { label: "Points", value: profile.totalPoints, icon: "⭐" },
                { label: "Niveau", value: li.name, icon: "🏆" },
                { label: "Moy/séance", value: profile.sessions.length ? (profile.totalPoints / profile.sessions.length).toFixed(1) : 0, icon: "📈" },
              ].map(s => (
                <div key={s.label} style={{ ...S.card, textAlign: "center", marginBottom: 0 }}>
                  <div style={{ fontSize: 28 }}>{s.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6, color: "#e2e8f0" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 14, color: "#e2e8f0" }}>📈 Évolution</div>
              <MiniChart sessions={profile.sessions} />
            </div>
            {profile.memory.weakPoints.length > 0 && (
              <div style={S.card}>
                <div style={{ fontWeight: 700, marginBottom: 10, color: "#e2e8f0" }}>🔍 Points à retravailler</div>
                {profile.memory.weakPoints.slice().reverse().map((w, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#64748b", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>· {w}</div>
                ))}
              </div>
            )}
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: "#e2e8f0" }}>🗓 Historique</div>
              {profile.sessions.length === 0 && <div style={{ color: "#334155", fontSize: 13 }}>Aucune séance encore.</div>}
              {profile.sessions.slice().reverse().map((s, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{s.title}</div>
                      <div style={{ fontSize: 11, color: "#334155" }}>
                        {new Date(s.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                        {s.duration ? ` · ${s.duration} min` : ""}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#f59e0b", fontSize: 12 }}>{"⭐".repeat(s.stars)}</div>
                      <div style={{ fontSize: 13, color: "#34d399", fontWeight: 700 }}>+{s.points} pts</div>
                    </div>
                  </div>
                  {s.insight && <div style={{ fontSize: 12, color: "#6366f1", marginTop: 4, fontStyle: "italic" }}>💬 {s.insight}</div>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── VUE PARAMÈTRES ── */}
        {view === "settings" && (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, margin: "20px 0 14px", color: "#e2e8f0" }}>⚙️ Paramètres</div>

            {/* FOCUS */}
            <div style={{ ...S.card, border: "1px solid rgba(52,211,153,0.2)" }}>
              <div style={{ fontWeight: 700, marginBottom: 6, color: "#e2e8f0" }}>🎯 Focus du moment</div>
              <div style={{ fontSize: 12, color: "#475569", marginBottom: 14 }}>À remplir avant une génération — influence tous les exercices.</div>
              {tempFocus ? (
                <>
                  {[
                    { key: "mots", label: "📝 Mots de la semaine", placeholder: "maison, soleil, forêt..." },
                    { key: "verbes", label: "🔤 Verbes en cours", placeholder: "aller au présent, finir à l'imparfait..." },
                    { key: "remarque", label: "💬 Remarque de la maîtresse", placeholder: "Léo hésite sur les sons 'ou'..." },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{label}</div>
                      <input style={{ ...S.input }} placeholder={placeholder}
                        value={tempFocus[key] || ""}
                        onChange={e => setTempFocus({ ...tempFocus, [key]: e.target.value })} />
                    </div>
                  ))}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>🎯 Point prioritaire</div>
                    <select style={{ ...S.input }}
                      value={tempFocus.priorite || ""}
                      onChange={e => setTempFocus({ ...tempFocus, priorite: e.target.value })}>
                      <option value="">— Aucun en particulier —</option>
                      <option value="conjugaison">Conjugaison</option>
                      <option value="orthographe">Orthographe</option>
                      <option value="grammaire">Grammaire</option>
                      <option value="maths">Mathématiques</option>
                      <option value="géométrie">Géométrie</option>
                      <option value="lecture">Lecture</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>⭐ Comment s'est passée la semaine ?</div>
                    <StarRating value={tempFocus.notesamaine || 0} onChange={v => setTempFocus({ ...tempFocus, notesamaine: v })} size={28} />
                  </div>
                  <button style={S.btn} onClick={async () => {
                    await saveProfile({ ...profile, focus: tempFocus });
                    setTempFocus(null);
                    showToast("Focus mis à jour ✅");
                  }}>💾 Enregistrer le focus</button>
                  <button style={{ ...S.btnSm, width: "100%", marginTop: 8, padding: 10 }} onClick={() => setTempFocus(null)}>Annuler</button>
                </>
              ) : (
                <>
                  {profile.focus?.mots && <div style={{ fontSize: 13, color: "#6ee7b7", marginBottom: 4 }}>📝 {profile.focus.mots}</div>}
                  {profile.focus?.verbes && <div style={{ fontSize: 13, color: "#6ee7b7", marginBottom: 4 }}>🔤 {profile.focus.verbes}</div>}
                  {profile.focus?.remarque && <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>💬 {profile.focus.remarque}</div>}
                  {!profile.focus?.mots && !profile.focus?.verbes && (
                    <div style={{ fontSize: 13, color: "#334155", marginBottom: 8 }}>Aucun focus défini pour l'instant.</div>
                  )}
                  <button style={S.btnSm} onClick={() => setTempFocus({ ...DEFAULT_PROFILE.focus, ...(profile.focus || {}) })}>
                    ✏️ Modifier le focus
                  </button>
                </>
              )}
            </div>

            {/* CONFIG */}
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 14, color: "#e2e8f0" }}>📋 Programme et durée</div>
              {tempConfig ? (
                <>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: "#cbd5e1" }}>⏱ Durée de séance</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {[15, 20, 25, 30, 35, 40, 45].map(d => (
                      <button key={d} style={S.btnToggle(tempConfig.duration === d)} onClick={() => setTempConfig({ ...tempConfig, duration: d })}>{d} min</button>
                    ))}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: "#cbd5e1" }}>🎯 Niveau de Léo</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {["CE1 début", "CE1/CE2", "CE2", "CE2 avancé"].map(d => (
                      <button key={d} style={S.btnToggle(tempConfig.difficulty === d)} onClick={() => setTempConfig({ ...tempConfig, difficulty: d })}>{d}</button>
                    ))}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: "#cbd5e1" }}>📋 Format programmé</div>
                  <textarea style={{ ...S.input, minHeight: 200, marginBottom: 16 }}
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
                  <div style={{ fontSize: 13, color: "#475569", marginBottom: 8 }}>⏱ {profile.weeklyConfig.duration} min · {profile.weeklyConfig.difficulty}</div>
                  <button style={S.btnSm} onClick={() => setTempConfig({ ...profile.weeklyConfig })}>✏️ Modifier</button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* NAVIGATION */}
      <nav style={S.bottomNav}>
        {[
          { id: "home",     icon: "🏠", label: "Accueil" },
          { id: "cabane",   icon: "🦝", label: "Roki" },
          { id: "stats",    icon: "📊", label: "Suivi" },
          { id: "settings", icon: "⚙️", label: "Paramètres" },
        ].map(n => (
          <button key={n.id} style={S.navBtn(view === n.id)} onClick={() => setView(n.id)}>
            <span style={{ fontSize: 22 }}>{n.icon}</span>
            <span style={{ fontSize: 10, fontWeight: view === n.id ? 700 : 400 }}>{n.label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        * { box-sizing: border-box; }
        textarea:focus, input:focus, select:focus { border-color: rgba(99,102,241,0.5) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        select option { background: #0f172a; color: white; }
        @keyframes twinkle { 0%,100%{opacity:0.3} 50%{opacity:0.9} }
        @keyframes slideDown { from{transform:translateX(-50%) translateY(-20px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
        @media print { nav { display: none !important; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 2px; }
      `}</style>
    </div>
  );
}
