import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CHILD_NAME    = "Léo";
const SUPABASE_URL  = "https://enppydwndwwbmnueuuup.supabase.co";
const SUPABASE_KEY  = "sb_publishable_Gf2rnCwwTS7rfmUQ8K_VmQ_RkC1bJZt";
const PARENT_CODE   = "leo2024";
const ADMIN_CODE    = "TTR250";

// ─── MAPPING TYPE → SOUS_TYPES SUPABASE ──────────────────────────────────────
// Pour chaque type demandé, on liste les sous_types possibles par niveau
const TYPE_MAP = {
  conjugaison:    { CE1:["present_1er_groupe","imparfait_1er_groupe","present_etre","present_avoir"], CE2:["futur_simple_1er_groupe","passe_compose_avoir","present_2eme_groupe","imparfait_2eme_groupe"], CM1:["passe_compose_etre","futur_simple_irreguliers","conditionnel_present","identification_temps"] },
  transposition:  { CE1:["transposition_tu_je","transposition_il_nous"], CE2:["transposition_elle_ils"], CM1:["transposition_singulier_pluriel"] },
  negation:       { CE1:["negation_ne_pas"], CE2:["negation_ne_plus","negation_ne_jamais_rien"], CM1:["negation_ne_jamais_rien"] },
  orthographe:    { CE1:["sons_ou_on","sons_an_en","sons_oi","sons_eau_au","homophones_a_a","homophones_et_est","homophones_ou_ou"], CE2:["sons_ill_gn","homophones_son_sont","homophones_ces_ses","homophones_on_ont","accord_adjectif"], CM1:["homophones_ma_ma","accord_participe_passe"] },
  dictee:         { CE1:["dictee_sons_simples"], CE2:["dictee_homophones"], CM1:["dictee_avancee"] },
  vocabulaire:    { CE1:["familles_de_mots","antonymes"], CE2:["synonymes","sens_contexte","prefixes_suffixes"], CM1:["familles_de_mots_avancees","niveaux_de_langue"] },
  lecture:        { CE1:["comprehension_texte_court","remise_en_ordre"], CE2:["comprehension_inference"], CM1:["comprehension_avancee","resume_texte"] },
  multiplication: { CE1:["multiplication_table_2_5"], CE2:["multiplication_table_3_4","multiplication_table_6_9","multiplication_posee_1chiffre"], CM1:["multiplication_posee_2chiffres","calcul_mental_cm1"] },
  soustraction:   { CE1:["soustraction_retenue"], CE2:["soustraction_grands_nombres"], CM1:["soustraction_cm1"] },
  addition:       { CE1:["addition_retenue"], CE2:["addition_grands_nombres"], CM1:["addition_cm1"] },
  division:       { CE1:["division_exacte"], CE2:["division_euclidienne"], CM1:["division_posee"] },
  fractions:      { CE1:["fractions_representation"], CE2:["fractions_representation","fractions_ecriture"], CM1:["fractions_operations","fractions_decimales"] },
  mesures:        { CE1:["mesures_longueurs","mesures_monnaie"], CE2:["mesures_masses","mesures_durees"], CM1:["mesures_longueurs_cm1","mesures_durees_cm1"] },
  probleme:       { CE1:["probleme_additif"], CE2:["probleme_multiplicatif","probleme_2_etapes","probleme_partage"], CM1:["probleme_cm1_complexe","probleme_fractions_cm1","probleme_grandeurs_cm1"] },
  geometrie:      { CE1:["geometrie_figures","geometrie_quadrillage"], CE2:["geometrie_symetrie","geometrie_perimetre","geometrie_patron_cube"], CM1:["geometrie_cm1","geometrie_aire"] },
  encadrement:    { CE1:["numeration_encadrement"], CE2:["numeration_encadrement","numeration_comparaison"], CM1:["numeration_grands_nombres"] },
  numeration:     { CE1:["numeration_decomposition","numeration_rangement"], CE2:["numeration_comparaison"], CM1:["numeration_grands_nombres"] },
};

// Résout le niveau Supabase selon le profil
function getNiveauSupabase(difficulty) {
  if (difficulty.includes("CM1"))        return "CM1";
  if (difficulty.includes("CE2"))        return "CE2";
  return "CE1";
}

// Choisit un sous_type aléatoire pour un type+niveau
function pickSousType(type, niveau) {
  const map = TYPE_MAP[type];
  if (!map) return null;
  // Essaie le niveau exact, sinon remonte
  const list = map[niveau] || map["CE2"] || map["CE1"] || [];
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SB_HEADERS = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };

async function sbLoad() {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/lucas_data?id=eq.lucas&select=data`, { headers: SB_HEADERS });
    const rows = await r.json();
    if (rows?.length > 0 && rows[0].data) return JSON.parse(rows[0].data);
  } catch {}
  return null;
}

async function sbSave(profile) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/lucas_data`, {
      method: "POST",
      headers: { ...SB_HEADERS, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({ id: "lucas", data: JSON.stringify(profile), updated_at: new Date().toISOString() }),
    });
  } catch {}
}

// Récupère UN exercice du corpus par sous_type exact
async function fetchExerciceFromCorpus(sousType, niveau) {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/corpus?sous_type=eq.${encodeURIComponent(sousType)}&actif=eq.true&select=categorie,sous_type,niveau,contenu&limit=3`,
      { headers: SB_HEADERS }
    );
    const rows = await r.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;
    // Préfère le bon niveau, sinon prend ce qui est disponible
    const match = rows.find(r => r.niveau === niveau) || rows[0];
    return match;
  } catch { return null; }
}

// ─── GAMIFICATION ─────────────────────────────────────────────────────────────
const ITEMS = [
  { pts:0,   emoji:"🍁", label:"Feuille d érable",      desc:"Le début de l aventure !" },
  { pts:5,   emoji:"🎒", label:"Sac à dos",             desc:"Pour transporter ses trésors." },
  { pts:10,  emoji:"🕯️", label:"Torche",                desc:"Pour explorer dans le noir." },
  { pts:20,  emoji:"🧭", label:"Boussole",              desc:"Pour ne jamais se perdre." },
  { pts:35,  emoji:"🗺️", label:"Carte du trésor",       desc:"L aventure commence vraiment !" },
  { pts:55,  emoji:"🎩", label:"Chapeau d explorateur", desc:"Le style de l aventurier." },
  { pts:80,  emoji:"🔪", label:"Couteau suisse",        desc:"L outil ultime du survivant." },
  { pts:110, emoji:"🏕️", label:"Tente",                 desc:"Sa base de camp dans la forêt." },
  { pts:150, emoji:"⭐", label:"Étoile polaire",         desc:"Niveau légendaire atteint !" },
];
const LVL_PTS   = [0,10,25,45,70,100,140,190];
const LVL_NAMES = ["Apprenti","Explorateur","Savant","Expert","Champion","Génie","Légende","Maître"];
const LVL_CLR   = ["#94a3b8","#60a5fa","#34d399","#f59e0b","#f472b6","#a78bfa","#fb923c","#e879f9"];

function levelInfo(pts) {
  let l = 0;
  for (let i = LVL_PTS.length-1; i >= 0; i--) { if (pts >= LVL_PTS[i]) { l=i; break; } }
  const nxt = LVL_PTS[l+1] || LVL_PTS[l];
  const prog = nxt > LVL_PTS[l] ? ((pts-LVL_PTS[l])/(nxt-LVL_PTS[l]))*100 : 100;
  return { level:l, name:LVL_NAMES[l], color:LVL_CLR[l], progress:Math.min(prog,100), toNext:Math.max(0,nxt-pts) };
}

function unlockedItems(pts, bonus=[]) {
  const auto = ITEMS.filter(i => i.pts <= pts);
  const bon  = bonus.map(e => ITEMS.find(i=>i.emoji===e)).filter(Boolean);
  const all  = [...auto];
  bon.forEach(b => { if (!all.find(a=>a.emoji===b.emoji)) all.push(b); });
  return all;
}

// ─── RATON SVG ────────────────────────────────────────────────────────────────
function Raton({ items=[], size=120, anim=true }) {
  const bag  = items.find(i=>i.emoji==="🎒");
  const hat  = items.find(i=>i.emoji==="🎩");
  const torch= items.find(i=>i.emoji==="🕯️");
  return (
    <svg width={size} height={size*1.4} viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg">
      <style>{`.rb{animation:${anim?"rb 2s ease-in-out infinite":"none"};transform-origin:50px 70px}.rt{animation:${anim?"rt 1.5s ease-in-out infinite":"none"};transform-origin:50px 110px}.re{animation:${anim?"re 4s ease-in-out infinite":"none"}}@keyframes rb{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@keyframes rt{0%,100%{transform:rotate(-15deg)}50%{transform:rotate(15deg)}}@keyframes re{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(0.08)}}`}</style>
      {torch&&<ellipse cx="75" cy="85" rx="18" ry="12" fill="#fbbf24" opacity=".12"/>}
      <g className="rt"><ellipse cx="50" cy="118" rx="14" ry="8" fill="#6b7280"/><ellipse cx="50" cy="118" rx="10" ry="5" fill="#f3f4f6"/><ellipse cx="50" cy="115" rx="10" ry="3" fill="#374151" opacity=".35"/><ellipse cx="50" cy="120" rx="10" ry="3" fill="#374151" opacity=".35"/></g>
      <g className="rb">
        <ellipse cx="50" cy="90" rx="22" ry="26" fill="#9ca3af"/><ellipse cx="50" cy="95" rx="14" ry="18" fill="#f3f4f6"/>
        {bag&&<><rect x="62" y="75" width="14" height="20" rx="4" fill="#854d0e"/><rect x="64" y="73" width="10" height="4" rx="2" fill="#92400e"/><rect x="68" y="78" width="3" height="8" rx="1" fill="#78350f"/></>}
        <ellipse cx="33" cy="103" rx="7" ry="5" fill="#6b7280"/><ellipse cx="67" cy="103" rx="7" ry="5" fill="#6b7280"/>
        <ellipse cx="33" cy="104" rx="5" ry="3" fill="#374151"/><ellipse cx="67" cy="104" rx="5" ry="3" fill="#374151"/>
        <ellipse cx="38" cy="113" rx="9" ry="5" fill="#6b7280"/><ellipse cx="62" cy="113" rx="9" ry="5" fill="#6b7280"/>
        <ellipse cx="50" cy="55" rx="20" ry="18" fill="#9ca3af"/>
        <ellipse cx="35" cy="38" rx="7" ry="9" fill="#6b7280"/><ellipse cx="35" cy="39" rx="4" ry="6" fill="#f9a8d4"/>
        <ellipse cx="65" cy="38" rx="7" ry="9" fill="#6b7280"/><ellipse cx="65" cy="39" rx="4" ry="6" fill="#f9a8d4"/>
        {hat&&<><ellipse cx="50" cy="40" rx="22" ry="5" fill="#1e3a5f"/><rect x="38" y="18" width="24" height="23" rx="4" fill="#1e3a5f"/><rect x="40" y="28" width="20" height="3" rx="1" fill="#f59e0b" opacity=".8"/></>}
        <ellipse cx="50" cy="53" rx="16" ry="8" fill="#374151"/>
        <g className="re"><circle cx="43" cy="52" r="5" fill="white"/><circle cx="57" cy="52" r="5" fill="white"/><circle cx="44" cy="52" r="3" fill="#1e293b"/><circle cx="58" cy="52" r="3" fill="#1e293b"/><circle cx="44.8" cy="51" r="1" fill="white"/><circle cx="58.8" cy="51" r="1" fill="white"/></g>
        <ellipse cx="50" cy="59" rx="4" ry="3" fill="#374151"/>
        <path d="M45 63 Q50 68 55 63" stroke="#374151" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <ellipse cx="38" cy="60" rx="5" ry="3" fill="#fca5a5" opacity=".4"/><ellipse cx="62" cy="60" rx="5" ry="3" fill="#fca5a5" opacity=".4"/>
        {torch&&<><rect x="24" y="95" width="4" height="12" rx="2" fill="#92400e"/><ellipse cx="26" cy="94" rx="4" ry="5" fill="#fbbf24"/><ellipse cx="26" cy="93" rx="2" ry="3" fill="#fde68a"/></>}
      </g>
    </svg>
  );
}

// ─── CABANE SVG ───────────────────────────────────────────────────────────────
function Cabane() {
  return (
    <svg width="100%" height="185" viewBox="0 0 320 185" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="185" fill="#020817"/>
      {[...Array(25)].map((_,i)=><circle key={i} cx={Math.sin(i*37)*150+160} cy={Math.cos(i*53)*65+50} r={i%3===0?1.5:1} fill="white" opacity={.3+(i%3)*.2}/>)}
      <circle cx="270" cy="30" r="20" fill="#fef3c7"/><circle cx="280" cy="24" r="16" fill="#020817"/>
      <rect x="42" y="115" width="15" height="70" rx="3" fill="#4a2c0a"/><ellipse cx="49" cy="105" rx="30" ry="40" fill="#14532d"/><ellipse cx="49" cy="92" rx="24" ry="33" fill="#166534"/>
      <rect x="253" y="125" width="13" height="60" rx="3" fill="#4a2c0a"/><ellipse cx="259" cy="113" rx="26" ry="36" fill="#14532d"/><ellipse cx="259" cy="100" rx="20" ry="28" fill="#166534"/>
      <rect x="84" y="112" width="152" height="9" rx="3" fill="#92400e"/><rect x="89" y="108" width="142" height="7" rx="2" fill="#b45309"/>
      <rect x="94" y="56" width="132" height="57" rx="5" fill="#78350f"/><rect x="99" y="61" width="122" height="47" rx="3" fill="#92400e"/>
      <polygon points="84,60 160,22 236,60" fill="#1e3a5f"/><polygon points="89,60 160,27 231,60" fill="#1e40af"/>
      <rect x="129" y="71" width="26" height="22" rx="3" fill="#fef3c7"/><rect x="131" y="73" width="22" height="18" rx="2" fill="#fde68a"/>
      <line x1="142" y1="73" x2="142" y2="91" stroke="#92400e" strokeWidth="1.5"/><line x1="131" y1="82" x2="153" y2="82" stroke="#92400e" strokeWidth="1.5"/>
      <rect x="174" y="77" width="18" height="30" rx="3" fill="#4a2c0a"/><circle cx="188" cy="93" r="2" fill="#fbbf24"/>
      <line x1="109" y1="121" x2="109" y2="160" stroke="#92400e" strokeWidth="2.5"/><line x1="120" y1="121" x2="120" y2="160" stroke="#92400e" strokeWidth="2.5"/>
      {[134,146,158].map(y=><line key={y} x1="109" y1={y} x2="120" y2={y} stroke="#b45309" strokeWidth="1.5"/>)}
      <ellipse cx="160" cy="182" rx="115" ry="9" fill="#14532d" opacity=".5"/>
    </svg>
  );
}

// ─── COMPOSANTS UI ────────────────────────────────────────────────────────────
function Stars({ value, onChange, size=32 }) {
  return (
    <div style={{display:"flex",gap:8,justifyContent:"center"}}>
      {[1,2,3,4,5].map(s=>(
        <span key={s} onClick={()=>onChange?.(s)}
          style={{fontSize:size,cursor:"pointer",filter:s<=value?"none":"grayscale(1) opacity(0.2)",transition:"transform 0.15s",userSelect:"none",display:"inline-block"}}
          onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.3)";}}
          onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";}}>⭐</span>
      ))}
    </div>
  );
}

function MiniChart({ sessions }) {
  if (!sessions?.length) return <div style={{textAlign:"center",color:"#475569",padding:"20px 0",fontSize:13}}>Aucune séance encore</div>;
  const last7 = sessions.slice(-7);
  const maxP  = Math.max(...last7.map(s=>s.points), 5);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:8,height:80}}>
      {last7.map((s,i)=>{
        const h = Math.max(8,(s.points/maxP)*72);
        const d = new Date(s.date);
        return (
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{fontSize:10,color:"#64748b",fontWeight:700}}>{s.points}</div>
            <div style={{width:"100%",height:h,borderRadius:"6px 6px 0 0",background:"linear-gradient(180deg,#818cf8,#3b82f6)",transition:"height .5s"}}/>
            <div style={{fontSize:9,color:"#475569"}}>{d.getDate()}/{d.getMonth()+1}</div>
          </div>
        );
      })}
    </div>
  );
}

// Affiche un exercice selon son type
function ExCard({ ex, dark=true }) {
  const type  = (ex.type||"").toLowerCase();
  const isCalc= ["multiplication","soustraction","addition","division","encadrement","numeration","calcul","fraction"].some(t=>type.includes(t));
  const isConj= type.includes("conjugaison")||type.includes("conjug");
  const tc    = dark ? "#cbd5e1" : "#1e293b";
  const lc    = dark ? "#475569" : "#94a3b8";
  const ac    = dark ? "#a5b4fc" : "#4f46e5";

  if (!ex.lignes?.length) {
    return <div style={{fontSize:dark?14:13,color:tc,lineHeight:2.2,whiteSpace:"pre-line"}}>{ex.content||""}</div>;
  }

  if (isConj) {
    // Sépare les blocs verbe : chaque bloc commence par une ligne en MAJUSCULES ou contenant "—"
    const blocs = [];
    let cur = [];
    ex.lignes.forEach(l => {
      const isTitle = l === l.toUpperCase() && l.trim().length > 0 && !["je","tu","il/elle","nous","vous","ils/elles"].includes(l.trim().toLowerCase());
      if (isTitle && cur.length > 0) { blocs.push(cur); cur = [l]; }
      else cur.push(l);
    });
    if (cur.length) blocs.push(cur);

    return (
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 28px"}}>
        {blocs.map((bloc,bi)=>(
          <div key={bi} style={{marginBottom:bi<blocs.length-1?12:0}}>
            {bloc.map((ligne,li)=>{
              const isT = li===0;
              return isT
                ? <div key={li} style={{fontWeight:700,fontSize:dark?13:12,color:ac,marginBottom:6}}>{ligne}</div>
                : <div key={li} style={{display:"flex",alignItems:"center",gap:8,marginBottom:dark?9:7}}>
                    <span style={{minWidth:70,fontSize:dark?13:12,color:lc}}>{ligne}</span>
                    <span style={{borderBottom:`1px solid ${lc}`,flex:1}}></span>
                  </div>;
            })}
          </div>
        ))}
      </div>
    );
  }

  if (isCalc) {
    const cols = ex.lignes.length >= 9 ? 3 : 2;
    return (
      <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:"8px 20px",marginTop:4}}>
        {ex.lignes.map((l,i)=>{
          // Nettoyer les tirets et numéros que le modèle ajoute parfois
          const clean = l.replace(/^\d+\.\s*/,"").replace(/_{2,}/g,"").trimEnd();
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontWeight:600,fontSize:dark?14:13,color:tc,whiteSpace:"nowrap"}}>{clean}</span>
              <span style={{borderBottom:`1px solid ${lc}`,flex:1,minWidth:25}}></span>
            </div>
          );
        })}
      </div>
    );
  }

  // Texte libre ligne par ligne
  return (
    <div>
      {ex.lignes.map((ligne,i)=>(
        ligne.trim()===""
          ? <div key={i} style={{borderBottom:`1px solid ${lc}`,margin:"3px 0 10px",height:2}}></div>
          : <div key={i} style={{fontSize:dark?14:13,color:tc,lineHeight:2.1,marginBottom:2}}>{ligne}</div>
      ))}
    </div>
  );
}

// ─── PROFIL PAR DÉFAUT ────────────────────────────────────────────────────────
const DEFAULT_PROFILE = {
  name: CHILD_NAME, totalPoints:0, sessions:[], unlockedBonusItems:[], equippedItems:[],
  weeklyConfig:{ duration:25, difficulty:"CE1/CE2",
    programme:[
      {type:"conjugaison",    label:"Conjugaison (2 verbes)"},
      {type:"transposition",  label:"Transposition TU→JE"},
      {type:"negation",       label:"Négation NE...PAS"},
      {type:"soustraction",   label:"Soustractions (10 calculs)"},
      {type:"encadrement",    label:"Encadrement nombres"},
    ]
  },
  focus:{ mots:"", verbes:"", remarque:"", notesamaine:0, priorite:"" },
  memory:{ usedVerbs:[], usedWords:[], weakPoints:[] },
};

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [profile, setProfile]             = useState(null);
  const [view, setView]                   = useState("home");
  const [mainTab, setMainTab]             = useState("programme");
  const [loading, setLoading]             = useState(true);
  const [syncStatus, setSyncStatus]       = useState("");
  const [generating, setGenerating]       = useState(false);
  const [session, setSession]             = useState(null); // exercices générés
  const [sessionScore, setSessionScore]   = useState(null);
  const [contextNote, setContextNote]     = useState("");
  const [toast, setToast]                 = useState(null);
  const [stars, setStars]                 = useState(0);
  const [insight, setInsight]             = useState("");
  const [printMode, setPrintMode]         = useState(false);
  const [showParent, setShowParent]       = useState(false);
  const [parentCode, setParentCode]       = useState("");
  const [parentOk, setParentOk]           = useState(false);
  const [showAdmin, setShowAdmin]         = useState(false);
  const [adminCode, setAdminCode]         = useState("");
  const [adminOk, setAdminOk]             = useState(false);
  const [tempCfg, setTempCfg]             = useState(null);
  const [tempFocus, setTempFocus]         = useState(null);
  const [carteTypes, setCarteTypes]       = useState({});
  const [chatMsgs, setChatMsgs]           = useState([{role:"assistant",text:"Salut aventurier ! Je suis Roki 🌲 Prêt pour de nouvelles découvertes ?"}]);
  const [chatIn, setChatIn]               = useState("");
  const [chatBusy, setChatBusy]           = useState(false);
  const chatEnd = useRef(null);

  const toast$ = (msg,color="#34d399") => { setToast({msg,color}); setTimeout(()=>setToast(null),3200); };

  useEffect(()=>{
    (async()=>{
      let d = await sbLoad();
      if (!d) { try { const l=localStorage.getItem("leo_v4"); if(l) d=JSON.parse(l); } catch {} }
      // S assurer que le programme existe toujours
      if (d && (!d.weeklyConfig?.programme || d.weeklyConfig.programme.length === 0)) {
        d.weeklyConfig = { ...DEFAULT_PROFILE.weeklyConfig, ...d.weeklyConfig, programme: DEFAULT_PROFILE.weeklyConfig.programme };
      }
      setProfile(d||{...DEFAULT_PROFILE});
      setLoading(false);
    })();
  },[]);

  useEffect(()=>{ chatEnd.current?.scrollIntoView({behavior:"smooth"}); },[chatMsgs]);

  const save = useCallback(async(p)=>{
    setProfile(p);
    localStorage.setItem("leo_v4",JSON.stringify(p));
    setSyncStatus("saving");
    try { await sbSave(p); setSyncStatus("saved"); setTimeout(()=>setSyncStatus(""),2000); }
    catch { setSyncStatus("error"); setTimeout(()=>setSyncStatus(""),3000); }
  },[]);

  // ── GÉNÉRATION ──────────────────────────────────────────────────────────────
  async function generate(mode) {
    if (!profile) return;
    const selectedTypes = mode==="programme"
      ? profile.weeklyConfig.programme.map(e=>e.type)
      : Object.entries(carteTypes).filter(([,v])=>v).map(([k])=>k);

    if (selectedTypes.length===0) { toast$("Sélectionne au moins un exercice !","#f59e0b"); return; }

    setGenerating(true);
    setSession(null);
    setSessionScore(null);
    setStars(0);
    setInsight("");

    const niveau = getNiveauSupabase(profile.weeklyConfig.difficulty);
    const { memory, weeklyConfig, focus } = profile;

    // Pour chaque type, on récupère le modèle du corpus puis on génère
    const exercises = [];
    for (const type of selectedTypes) {
      const sousType = pickSousType(type, niveau);
      if (!sousType) continue;

      const modele = await fetchExerciceFromCorpus(sousType, niveau);

      const focusLines = [
        focus?.mots     ? `Mots de la semaine à utiliser : ${focus.mots}` : "",
        focus?.verbes   ? `Verbes imposés : ${focus.verbes}` : "",
        memory.usedVerbs?.length ? `Verbes DÉJÀ utilisés (NE PAS répéter) : ${memory.usedVerbs.slice(-10).join(", ")}` : "",
        memory.usedWords?.length ? `Mots DÉJÀ utilisés (varier) : ${memory.usedWords.slice(-10).join(", ")}` : "",
        contextNote     ? `Contexte du jour : ${contextNote}` : "",
      ].filter(Boolean).join("\n");

      const niveauDesc = {
        "CE1": "fin CE1 : nombres jusqu à 100, tables x2 x5 x10, présent et imparfait 1er groupe",
        "CE2": "CE2 : toutes les tables, accord sujet-verbe, présent imparfait futur passé composé",
        "CM1": "CM1 : grands nombres, fractions, division posée, tous les temps"
      }[niveau] || niveau;

      const isConj = type === "conjugaison";
      const isCalc = ["multiplication","soustraction","addition","division","encadrement","numeration","fractions","mesures"].includes(type);
      
      // Pour la conjugaison : pas d exemple avec réponses, juste la structure vide
      // Pour les calculs : exemple avec réponse montré
      const exampleRule = isConj
        ? "- Le champ \"example\" doit montrer UNIQUEMENT la structure vide (ex: \"Conjugue le verbe CHANTER au présent\") SANS donner les réponses"
        : "- Le champ \"example\" doit montrer UN exemple résolu complet (ex: \"3 × 4 = 12\")";
      
      const conjRule = isConj
        ? `- OBLIGATOIRE : inclure EXACTEMENT 2 verbes différents dans les lignes
- Format des lignes pour 2 verbes côte à côte : ["VERBE1 — temps", "je", "tu", "il/elle", "nous", "vous", "ils/elles", "VERBE2 — temps", "je", "tu", "il/elle", "nous", "vous", "ils/elles"]
- Choisir 2 verbes différents non utilisés récemment
- Ne JAMAIS donner les formes conjuguées dans l example`
        : "";

      const calcRule = isCalc
        ? `- OBLIGATOIRE : minimum 10 items dans "lignes" pour les calculs
- Format : ["3 × 7 =", "8 × 4 =", ...] — JUSTE le calcul sans tirets ni réponse, l app ajoute la ligne pour écrire`
        : "";

      const prompt = modele
        ? `Tu es un instituteur expert français. Génère un exercice de type "${type}" pour ${CHILD_NAME} niveau ${niveauDesc}.

MODÈLE PÉDAGOGIQUE (programme national) :
---
${modele.contenu}
---

INSTRUCTIONS STRICTES :
- Respecte exactement la même structure pédagogique que le modèle
- Génère de NOUVELLES valeurs (nouveaux verbes, nouveaux nombres, nouveaux mots)
- Niveau : ${niveau}
${exampleRule}
${conjRule}
${calcRule}
${focusLines ? `CONTRAINTES :\n${focusLines}` : ""}

JSON uniquement :
{"title":"...","emoji":"...","duration":"${Math.round(weeklyConfig.duration/selectedTypes.length)} min","instructions":"consigne courte","example":"...","lignes":[...],"parentNote":"...","verbsUsed":[],"wordsUsed":[]}`
        : `Tu es un instituteur expert français. Génère un exercice de type "${type}" pour ${CHILD_NAME} niveau ${niveauDesc}.
${exampleRule}
${conjRule}
${calcRule}
${focusLines ? `CONTRAINTES :\n${focusLines}` : ""}
JSON uniquement :
{"title":"...","emoji":"...","duration":"${Math.round(weeklyConfig.duration/selectedTypes.length)} min","instructions":"consigne courte","example":"...","lignes":[...],"parentNote":"...","verbsUsed":[],"wordsUsed":[]}`;

      try {
        const res = await fetch("/api/generate", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({ prompt, mode:"exercice" }),
        });
        const data = await res.json();
        const raw  = (data.text||"").replace(/```json|```/g,"").trim();
        const obj  = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0]||"{}");
        if (obj.title) exercises.push({ type, ...obj });
      } catch(e) { console.error("Erreur exercice",type,e); }
    }

    if (exercises.length===0) {
      toast$("Erreur de génération — réessaie !","#f87171");
    } else {
      const title = `Séance du ${new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}`;
      setSession({ title, exercises });
      setView("exercises");
    }
    setGenerating(false);
  }

  async function validate() {
    if (stars===0) { toast$("Donne une note à la séance !","#f59e0b"); return; }
    const pts   = stars;
    const verbs = session?.exercises?.flatMap(e=>e.verbsUsed||[])||[];
    const words = session?.exercises?.flatMap(e=>e.wordsUsed||[])||[];
    const prev  = profile.totalPoints;
    const next  = prev + pts;
    const np = {
      ...profile,
      totalPoints: next,
      sessions: [...profile.sessions,{date:new Date().toISOString(),title:session?.title||"Séance",points:pts,stars,duration:profile.weeklyConfig.duration,insight:insight||null}],
      memory:{
        usedVerbs:[...(profile.memory.usedVerbs||[]),...verbs].slice(-30),
        usedWords:[...(profile.memory.usedWords||[]),...words].slice(-30),
        weakPoints: insight?[...(profile.memory.weakPoints||[]),insight].slice(-10):(profile.memory.weakPoints||[]),
      },
    };
    const prevU = unlockedItems(prev, profile.unlockedBonusItems||[]);
    const nextU = unlockedItems(next, np.unlockedBonusItems||[]);
    if (nextU.length > prevU.length) {
      const gained = nextU[nextU.length-1];
      setTimeout(()=>toast$(`${gained.emoji} ${gained.label} débloqué ! 🎉`,"#f59e0b"),600);
    }
    await save(np);
    setSessionScore({ pts });
    toast$(`+${pts} point${pts>1?"s":""}! 🎉`,"#a78bfa");
  }

  async function chat(msg) {
    if (!msg.trim()||chatBusy) return;
    setChatMsgs(prev=>[...prev,{role:"user",text:msg}]);
    setChatIn("");
    setChatBusy(true);
    try {
      const equip = unlockedItems(profile.totalPoints, profile.unlockedBonusItems||[]).map(i=>i.label).join(", ");
      const res = await fetch("/api/generate",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          prompt:`Tu es Roki, raton laveur aventurier courageux qui parle à Léo (7-8 ans). Equipements de Léo : ${equip}. Points : ${profile.totalPoints}. Réponds DIRECTEMENT en 1-2 phrases courtes avec émojis, style aventure. PAS de guillemets. PAS de JSON. PAS d introduction. Léo dit : ${msg}`,
          mode:"chat"
        }),
      });
      const d = await res.json();
      // Nettoyer les guillemets éventuels que le modèle ajoute
      let reply = (d.text||"").trim().replace(/^["']|["']$/g,"").replace(/^\{.*\}$/s,"").trim();
      if (!reply) reply = "En avant l aventure ! 🌲🦝";
      setChatMsgs(prev=>[...prev,{role:"assistant",text:reply}]);
    } catch {
      setChatMsgs(prev=>[...prev,{role:"assistant",text:"Oups, perdu dans la forêt ! 🌲"}]);
    }
    setChatBusy(false);
  }

  // ── STYLES ──────────────────────────────────────────────────────────────────
  const S = {
    app:    {minHeight:"100vh",background:"linear-gradient(160deg,#020817 0%,#0f172a 40%,#1a103a 70%,#0c1220 100%)",fontFamily:"Georgia,serif",color:"white",paddingBottom:90},
    header: {background:"rgba(2,8,23,.88)",borderBottom:"1px solid rgba(99,102,241,.2)",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:100,boxShadow:"0 4px 30px rgba(0,0,0,.5)"},
    card:   {background:"rgba(15,23,42,.7)",border:"1px solid rgba(99,102,241,.15)",borderRadius:20,padding:20,marginBottom:16,backdropFilter:"blur(10px)",boxShadow:"0 8px 32px rgba(0,0,0,.3)"},
    btn:    {background:"linear-gradient(135deg,#4f46e5,#7c3aed)",border:"none",borderRadius:16,padding:"15px 24px",color:"white",fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,cursor:"pointer",width:"100%",boxShadow:"0 4px 20px rgba(99,102,241,.4)",transition:"transform .15s,box-shadow .15s"},
    btnSm:  {background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.3)",borderRadius:12,padding:"8px 16px",color:"#a5b4fc",fontFamily:"Georgia,serif",fontSize:13,cursor:"pointer"},
    tog:    (on)=>({background:on?"linear-gradient(135deg,#4f46e5,#7c3aed)":"rgba(15,23,42,.6)",border:`1px solid ${on?"#6366f1":"rgba(99,102,241,.2)"}`,borderRadius:14,padding:"10px 16px",color:on?"white":"#64748b",fontFamily:"Georgia,serif",fontSize:13,fontWeight:on?700:400,cursor:"pointer",transition:"all .2s",boxShadow:on?"0 4px 15px rgba(99,102,241,.3)":"none"}),
    tab:    (on)=>({flex:1,padding:"14px 4px 10px",background:on?"rgba(99,102,241,.15)":"transparent",border:"none",borderBottom:on?"2px solid #818cf8":"2px solid transparent",color:on?"#a5b4fc":"#475569",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all .2s"}),
    nav:    {position:"fixed",bottom:0,left:0,right:0,background:"rgba(2,8,23,.97)",borderTop:"1px solid rgba(99,102,241,.2)",display:"flex",zIndex:200,backdropFilter:"blur(20px)"},
    navBtn: (a)=>({flex:1,padding:"12px 4px",background:"none",border:"none",color:a?"#818cf8":"#334155",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"color .2s"}),
    input:  {background:"rgba(15,23,42,.8)",border:"1px solid rgba(99,102,241,.2)",borderRadius:12,padding:"12px 16px",color:"white",fontFamily:"Georgia,serif",fontSize:14,width:"100%",outline:"none",resize:"vertical"},
    badge:  (c)=>({background:c+"20",border:`1px solid ${c}40`,borderRadius:20,padding:"4px 14px",fontSize:12,color:c,fontWeight:700,display:"inline-block"}),
    wrap:   {padding:"0 16px",maxWidth:600,margin:"0 auto"},
  };

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#020817"}}>
      <div style={{textAlign:"center"}}><Raton items={[]} size={100} anim/><div style={{color:"#a5b4fc",fontFamily:"Georgia,serif",marginTop:16,fontSize:16}}>Chargement…</div></div>
    </div>
  );

  const li    = levelInfo(profile.totalPoints);
  const unlkd = unlockedItems(profile.totalPoints, profile.unlockedBonusItems||[]);
  const equip = (profile.equippedItems||[]).map(e=>ITEMS.find(i=>i.emoji===e)).filter(Boolean);

  // ── IMPRESSION A4 ──────────────────────────────────────────────────────────
  if (printMode && session) return (
    <div style={{fontFamily:"Arial,sans-serif",padding:"10mm 12mm",color:"#1e293b",background:"white"}}>
      <style>{`@page{size:A4;margin:10mm 12mm;}.cg2{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px;}.cg3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px 14px;}.cv{display:grid;grid-template-columns:1fr 1fr;gap:0 28px;}@media print{body{margin:0;}}`}</style>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",borderBottom:"2px solid #4f46e5",paddingBottom:8,marginBottom:14}}>
        <div><div style={{fontSize:17,fontWeight:700,color:"#4f46e5"}}>📚 École de {CHILD_NAME}</div><div style={{fontSize:11,color:"#64748b",marginTop:2}}>{session.title}</div></div>
        <div style={{textAlign:"right",fontSize:11,color:"#64748b"}}><div>{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div><div>{profile.weeklyConfig.duration} min · {profile.weeklyConfig.difficulty}</div></div>
      </div>
      {session.exercises?.map((ex,i)=>{
        const type  = (ex.type||"").toLowerCase();
        const isC   = ["multiplication","soustraction","addition","division","encadrement","numeration","calcul"].some(t=>type.includes(t));
        const isV   = type.includes("conjugaison")||type.includes("conjug");
        return (
          <div key={i} style={{marginBottom:14,pageBreakInside:"avoid"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,background:"#f1f5f9",padding:"5px 10px",borderRadius:6,borderLeft:"3px solid #4f46e5",marginBottom:5}}>
              <span style={{fontSize:15}}>{ex.emoji}</span>
              <div style={{fontWeight:700,fontSize:13}}>Exercice {i+1} — {ex.title}</div>
              <div style={{marginLeft:"auto",fontSize:10,color:"#94a3b8"}}>{ex.duration}</div>
            </div>
            <p style={{fontStyle:"italic",color:"#475569",margin:"0 0 4px",fontSize:11}}>📌 {ex.instructions}</p>
            {ex.example&&<p style={{background:"#eff6ff",padding:"4px 10px",borderRadius:6,fontSize:11,color:"#1d4ed8",margin:"0 0 6px",borderLeft:"2px solid #3b82f6"}}>{ex.example}</p>}
            <ExCard ex={ex} dark={false}/>
            {ex.parentNote&&<p style={{fontSize:10,color:"#7c3aed",marginTop:3,fontStyle:"italic"}}>👨‍👩‍👧 {ex.parentNote}</p>}
          </div>
        );
      })}
      <div style={{textAlign:"center",padding:8,background:"#f0fdf4",borderRadius:8,color:"#166534",fontStyle:"italic",fontSize:12,marginTop:10}}>💪 Bravo {CHILD_NAME}, tu peux le faire !</div>
    </div>
  );

  return (
    <div style={S.app}>
      {/* Étoiles fond */}
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        {[...Array(30)].map((_,i)=><div key={i} style={{position:"absolute",width:i%4===0?2:1,height:i%4===0?2:1,background:"white",borderRadius:"50%",left:`${Math.sin(i*31)*50+50}%`,top:`${Math.cos(i*47)*50+50}%`,opacity:.12+(i%5)*.05,animation:`tw ${2+(i%3)}s ease-in-out infinite`,animationDelay:`${(i%7)*.4}s`}}/>)}
      </div>

      {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:toast.color,color:"white",padding:"12px 28px",borderRadius:24,fontWeight:700,fontSize:14,zIndex:999,boxShadow:"0 8px 32px rgba(0,0,0,.5)",whiteSpace:"nowrap",animation:"sd .3s ease"}}>{toast.msg}</div>}

      {/* HEADER */}
      <div style={S.header}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,cursor:"pointer"}} onClick={()=>setView("cabane")}>
            <Raton items={equip.length?equip:[ITEMS[0]]} size={44} anim/>
          </div>
          <div>
            <div style={{fontSize:16,fontWeight:700}}>École de {CHILD_NAME}</div>
            <div style={{fontSize:11,color:"#475569",display:"flex",alignItems:"center",gap:6}}>
              {profile.weeklyConfig.difficulty}
              {syncStatus==="saving"&&<span style={{color:"#f59e0b"}}>● sync…</span>}
              {syncStatus==="saved" &&<span style={{color:"#34d399"}}>✓</span>}
              {syncStatus==="error" &&<span style={{color:"#f87171"}}>⚠</span>}
            </div>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={S.badge(li.color)}>{li.name}</div>
          <div style={{fontSize:12,color:"#475569",marginTop:3}}>{profile.totalPoints} pts</div>
        </div>
      </div>

      <div style={{...S.wrap,position:"relative",zIndex:1}}>

        {/* ══ EXERCISES ══ */}
        {view==="exercises"&&session&&(
          <>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"20px 0 12px"}}>
              <button style={S.btnSm} onClick={()=>setView("home")}>← Retour</button>
              <div style={{flex:1,fontWeight:700,fontSize:14,color:"#a5b4fc"}}>{session.title}</div>
              <button style={S.btnSm} onClick={()=>{setPrintMode(true);setTimeout(()=>{window.print();setPrintMode(false);},300);}}>🖨️ A4</button>
            </div>
            {session.exercises?.map((ex,i)=>(
              <div key={i} style={{...S.card,borderLeft:"3px solid #6366f1"}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}>
                  <span style={{fontSize:26}}>{ex.emoji}</span>
                  <div><div style={{fontWeight:700,fontSize:15,color:"#e2e8f0"}}>Exercice {i+1} — {ex.title}</div><div style={{fontSize:12,color:"#475569"}}>⏱ {ex.duration}</div></div>
                </div>
                <div style={{background:"rgba(99,102,241,.1)",borderRadius:12,padding:"10px 14px",marginBottom:10,fontSize:13,color:"#a5b4fc",fontStyle:"italic",borderLeft:"2px solid #6366f1"}}>📌 {ex.instructions}</div>
                {ex.example&&<div style={{background:"rgba(52,211,153,.08)",borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#6ee7b7",borderLeft:"2px solid #34d399"}}>{ex.example}</div>}
                <ExCard ex={ex} dark/>
                {ex.parentNote&&<div style={{marginTop:10,fontSize:12,color:"#7c3aed",fontStyle:"italic"}}>👨‍👩‍👧 {ex.parentNote}</div>}
              </div>
            ))}
            {!sessionScore?(
              <div style={{...S.card,background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.25)"}}>
                <div style={{fontStyle:"italic",color:"#a5b4fc",fontSize:14,textAlign:"center",marginBottom:18}}>💪 Bravo {CHILD_NAME}, continue comme ça !</div>
                <div style={{fontWeight:700,marginBottom:6,color:"#e2e8f0"}}>🔍 Observations</div>
                <textarea style={{...S.input,minHeight:70,marginBottom:16}} placeholder="Ex: Léo hésite sur les accords au pluriel…" value={insight} onChange={e=>setInsight(e.target.value)}/>
                <div style={{fontWeight:700,marginBottom:12,textAlign:"center",color:"#e2e8f0"}}>Comment s est passée la séance ?</div>
                <Stars value={stars} onChange={setStars}/>
                <button style={{...S.btn,marginTop:16}} onClick={validate}>✅ Valider la séance</button>
              </div>
            ):(
              <div style={{...S.card,textAlign:"center",background:"rgba(52,211,153,.06)",border:"1px solid rgba(52,211,153,.2)"}}>
                <div style={{fontSize:56,marginBottom:8}}>🎉</div>
                <div style={{fontSize:24,fontWeight:700,color:"#34d399"}}>+{sessionScore.pts} point{sessionScore.pts>1?"s":""}!</div>
                <div style={{color:"#475569",marginTop:4,marginBottom:20}}>Séance enregistrée ✓</div>
                <button style={S.btn} onClick={()=>{setView("home");setSession(null);setContextNote("");}}>🏠 Retour</button>
              </div>
            )}
          </>
        )}

        {/* ══ HOME ══ */}
        {view==="home"&&(
          <>
            <div style={{display:"flex",borderBottom:"1px solid rgba(99,102,241,.15)",marginTop:16,marginBottom:20}}>
              {[{id:"programme",e:"📋",l:"Programmé"},{id:"carte",e:"🎲",l:"À la carte"},{id:"photo",e:"📷",l:"Photo"}].map(t=>(
                <button key={t.id} style={S.tab(mainTab===t.id)} onClick={()=>setMainTab(t.id)}>
                  <span style={{fontSize:22}}>{t.e}</span>
                  <span style={{fontSize:11,fontWeight:mainTab===t.id?700:400}}>{t.l}</span>
                </button>
              ))}
            </div>

            {/* PROGRAMMÉ */}
            {mainTab==="programme"&&(
              <>
                {/* Raton + niveau */}
                <div style={{...S.card,background:`linear-gradient(135deg,rgba(15,23,42,.9),rgba(26,16,58,.9))`,border:`1px solid ${li.color}30`}}>
                  <div style={{display:"flex",gap:16,alignItems:"center"}}>
                    <Raton items={equip.length?equip:[ITEMS[0]]} size={90} anim/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:20,fontWeight:700,color:li.color}}>{li.name}</div>
                      <div style={{fontSize:13,color:"#475569",marginBottom:10}}>{profile.totalPoints} pts · {unlkd.length} équipements</div>
                      <div style={{background:"rgba(0,0,0,.3)",borderRadius:8,height:8,overflow:"hidden",marginBottom:6}}>
                        <div style={{width:`${li.progress}%`,height:"100%",background:`linear-gradient(90deg,${li.color}90,${li.color})`,borderRadius:8,transition:"width 1s"}}/>
                      </div>
                      {li.toNext>0&&<div style={{fontSize:11,color:"#475569"}}>{li.toNext} pts pour le prochain niveau</div>}
                      {(()=>{const nx=ITEMS.find(it=>it.pts>profile.totalPoints&&!unlkd.find(u=>u.emoji===it.emoji));return nx?<div style={{fontSize:11,color:"#f59e0b",marginTop:2}}>Prochain : {nx.emoji} {nx.label} ({nx.pts-profile.totalPoints} pts)</div>:null;})()}
                    </div>
                  </div>
                  {/* Mode parent */}
                  <div style={{marginTop:12,textAlign:"right"}}><span style={{fontSize:11,color:"#1e293b",cursor:"pointer",userSelect:"none"}} onClick={()=>setShowParent(v=>!v)}>··· parent</span></div>
                  {showParent&&(
                    <div style={{marginTop:10,background:"rgba(0,0,0,.3)",borderRadius:14,padding:14,border:"1px solid rgba(99,102,241,.2)"}}>
                      {!parentOk?(
                        <><div style={{fontSize:12,color:"#64748b",marginBottom:8}}>Code parent :</div>
                        <input type="password" style={{...S.input,marginBottom:8}} value={parentCode} onChange={e=>setParentCode(e.target.value)} placeholder="Code"/>
                        <button style={S.btnSm} onClick={()=>{if(parentCode===PARENT_CODE){setParentOk(true);toast$("Mode parent ✅");}else toast$("Code incorrect","#f87171");}}>Valider</button></>
                      ):(
                        <><div style={{fontSize:12,color:"#34d399",marginBottom:10}}>✅ Débloquer un item :</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                          {ITEMS.filter(it=>!unlkd.find(u=>u.emoji===it.emoji)).map(it=>(
                            <button key={it.pts} style={S.btnSm} onClick={async()=>{const np={...profile,unlockedBonusItems:[...(profile.unlockedBonusItems||[]),it.emoji]};await save(np);toast$(`${it.emoji} débloqué ! 🎉`,"#f59e0b");}}>{it.emoji} {it.label}</button>
                          ))}
                        </div></>
                      )}
                    </div>
                  )}
                </div>

                {/* Contexte + génération */}
                <div style={S.card}>
                  <div style={{fontSize:13,color:"#64748b",marginBottom:8}}>📝 Contexte du jour <span style={{fontSize:11}}>(optionnel)</span></div>
                  <textarea style={{...S.input,marginBottom:14,minHeight:60}} placeholder="Léo a eu du mal avec les accords aujourd hui…" value={contextNote} onChange={e=>setContextNote(e.target.value)}/>
                  {/* Aperçu du programme */}
                  <div style={{fontSize:12,color:"#64748b",marginBottom:8}}>📋 Programme de la séance :</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                    {profile.weeklyConfig.programme?.map((ex,i)=>(
                      <span key={i} style={{background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.3)",borderRadius:10,padding:"4px 12px",fontSize:12,color:"#a5b4fc"}}>{ex.label||ex.type}</span>
                    ))}
                  </div>
                  {profile.focus?.mots&&<div style={{background:"rgba(52,211,153,.07)",border:"1px solid rgba(52,211,153,.15)",borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#6ee7b7"}}>🎯 {profile.focus.mots.split(",").slice(0,3).join(", ")}{profile.focus.mots.split(",").length>3?"…":""}</div>}
                  <button style={{...S.btn,opacity:generating?.65:1}} onClick={()=>generate("programme")} disabled={generating}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 30px rgba(99,102,241,.5)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 4px 20px rgba(99,102,241,.4)";}}>
                    {generating?"⏳ Génération en cours…":"✨ Générer la séance programmée"}
                  </button>
                </div>

                <div style={S.card}><div style={{fontWeight:700,marginBottom:14,color:"#e2e8f0"}}>📈 Progression récente</div><MiniChart sessions={profile.sessions}/></div>
              </>
            )}

            {/* À LA CARTE */}
            {mainTab==="carte"&&(
              <>
                <div style={S.card}>
                  <div style={{fontWeight:700,marginBottom:6,color:"#e2e8f0"}}>🎲 Choisis les exercices du jour</div>
                  <div style={{fontSize:12,color:"#475569",marginBottom:16}}>L app sélectionne les exercices dans le programme national selon le niveau de Léo.</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:20}}>
                    {[
                      {k:"conjugaison",l:"Conjugaison",e:"🔤"},{k:"transposition",l:"Transposition",e:"🔄"},
                      {k:"negation",l:"Négation",e:"🚫"},{k:"orthographe",l:"Orthographe",e:"✏️"},
                      {k:"dictee",l:"Dictée",e:"📝"},{k:"vocabulaire",l:"Vocabulaire",e:"📖"},
                      {k:"lecture",l:"Lecture",e:"👁️"},{k:"multiplication",l:"Multiplication",e:"✖️"},
                      {k:"soustraction",l:"Soustraction",e:"➖"},{k:"division",l:"Division",e:"➗"},
                      {k:"fractions",l:"Fractions",e:"½"},{k:"mesures",l:"Mesures",e:"📏"},
                      {k:"probleme",l:"Problème",e:"🧩"},{k:"geometrie",l:"Géométrie",e:"📐"},
                    ].map(it=>(
                      <button key={it.k} style={S.tog(carteTypes[it.k])} onClick={()=>setCarteTypes(p=>({...p,[it.k]:!p[it.k]}))}>
                        {it.e} {it.l}
                      </button>
                    ))}
                  </div>
                  <textarea style={{...S.input,marginBottom:14,minHeight:60}} placeholder="Contexte optionnel…" value={contextNote} onChange={e=>setContextNote(e.target.value)}/>
                  <button style={{...S.btn,opacity:generating?.65:1}} onClick={()=>generate("carte")} disabled={generating}>
                    {generating?"⏳ Génération…":"🎲 Générer à la carte"}
                  </button>
                </div>
                {profile.memory.weakPoints?.length>0&&<div style={S.card}><div style={{fontWeight:700,marginBottom:10,color:"#e2e8f0"}}>🧠 Mémoire</div>{profile.memory.weakPoints.slice(-3).map((w,i)=><div key={i} style={{fontSize:12,color:"#64748b",marginBottom:4}}>· {w}</div>)}</div>}
              </>
            )}

            {/* PHOTO */}
            {mainTab==="photo"&&(
              <div style={{...S.card,textAlign:"center",padding:"48px 24px"}}>
                <div style={{fontSize:64,marginBottom:16}}>📷</div>
                <div style={{fontSize:18,fontWeight:700,marginBottom:10,color:"#e2e8f0"}}>Analyse de photo</div>
                <div style={{fontSize:14,color:"#475569",lineHeight:1.8}}>Prends en photo un exercice du cahier de Léo et l app génèrera une fiche similaire.</div>
                <div style={{marginTop:24,background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.2)",borderRadius:16,padding:"16px 20px",fontSize:13,color:"#818cf8"}}>🚧 En cours de développement</div>
              </div>
            )}
          </>
        )}

        {/* ══ CABANE ══ */}
        {view==="cabane"&&(
          <>
            <div style={{fontWeight:700,fontSize:17,margin:"20px 0 4px",color:"#e2e8f0"}}>🌲 La cabane de Roki</div>
            <div style={{fontSize:12,color:"#475569",marginBottom:16}}>La base secrète de ton compagnon aventurier</div>
            <div style={{borderRadius:20,overflow:"hidden",marginBottom:16,border:"1px solid rgba(99,102,241,.2)"}}>
              <Cabane/>
              <div style={{background:"rgba(15,23,42,.9)",padding:"16px 20px",display:"flex",alignItems:"center",gap:16}}>
                <Raton items={equip.length?equip:[ITEMS[0]]} size={80} anim/>
                <div>
                  <div style={{fontWeight:700,color:"#e2e8f0",marginBottom:4}}>Roki l Aventurier</div>
                  <div style={{fontSize:12,color:"#475569"}}>{unlkd.length} équipements débloqués</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>{equip.map((it,i)=><span key={i} style={{fontSize:18}} title={it.label}>{it.emoji}</span>)}</div>
                </div>
              </div>
            </div>

            <div style={S.card}>
              <div style={{fontWeight:700,marginBottom:12,color:"#e2e8f0"}}>🎒 Équipements de Roki</div>
              {ITEMS.map((it,i)=>{
                const unlk = !!unlkd.find(u=>u.emoji===it.emoji);
                const eq   = !!(profile.equippedItems||[]).includes(it.emoji);
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<ITEMS.length-1?"1px solid rgba(255,255,255,.04)":"none",opacity:unlk?1:.35}}>
                    <span style={{fontSize:28}}>{it.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:unlk?"#e2e8f0":"#334155"}}>{it.label}</div>
                      <div style={{fontSize:11,color:"#475569"}}>{unlk?it.desc:`Débloquer à ${it.pts} pts`}</div>
                    </div>
                    {unlk&&(
                      <button style={S.tog(eq)} onClick={async()=>{
                        const cur=profile.equippedItems||[];
                        const nw=eq?cur.filter(e=>e!==it.emoji):[...cur,it.emoji];
                        await save({...profile,equippedItems:nw});
                        toast$(eq?`${it.emoji} retiré`:`${it.emoji} équipé !`);
                      }}>{eq?"Équipé ✓":"Équiper"}</button>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={S.card}>
              <div style={{fontWeight:700,marginBottom:12,color:"#e2e8f0"}}>💬 Parle avec Roki</div>
              <div style={{minHeight:200,maxHeight:280,overflowY:"auto",marginBottom:12,display:"flex",flexDirection:"column",gap:10}}>
                {chatMsgs.map((m,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                    {m.role==="assistant"&&<span style={{fontSize:20,marginRight:8,flexShrink:0}}>🦝</span>}
                    <div style={{background:m.role==="user"?"linear-gradient(135deg,#4f46e5,#7c3aed)":"rgba(30,41,59,.8)",border:m.role==="assistant"?"1px solid rgba(99,102,241,.2)":"none",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 14px",fontSize:13,color:"#e2e8f0",maxWidth:"75%",lineHeight:1.5}}>{m.text}</div>
                  </div>
                ))}
                {chatBusy&&<div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:20}}>🦝</span><div style={{background:"rgba(30,41,59,.8)",borderRadius:12,padding:"10px 14px",fontSize:13,color:"#475569"}}>Roki réfléchit…</div></div>}
                <div ref={chatEnd}/>
              </div>
              <div style={{display:"flex",gap:10}}>
                <input style={{...S.input,flex:1}} placeholder="Dis quelque chose à Roki…" value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();chat(chatIn);}}}/>
                <button style={{...S.btnSm,padding:"10px 16px"}} onClick={()=>chat(chatIn)} disabled={chatBusy}>➤</button>
              </div>
            </div>
          </>
        )}

        {/* ══ SUIVI ══ */}
        {view==="stats"&&(
          <>
            <div style={{fontWeight:700,fontSize:17,margin:"20px 0 14px",color:"#e2e8f0"}}>📊 Suivi de {CHILD_NAME}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              {[{l:"Séances",v:profile.sessions.length,i:"📚"},{l:"Points",v:profile.totalPoints,i:"⭐"},{l:"Niveau",v:li.name,i:"🏆"},{l:"Moy/séance",v:profile.sessions.length?(profile.totalPoints/profile.sessions.length).toFixed(1):0,i:"📈"}].map(s=>(
                <div key={s.l} style={{...S.card,textAlign:"center",marginBottom:0}}>
                  <div style={{fontSize:28}}>{s.i}</div>
                  <div style={{fontSize:20,fontWeight:700,marginTop:6,color:"#e2e8f0"}}>{s.v}</div>
                  <div style={{fontSize:11,color:"#475569"}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={S.card}><div style={{fontWeight:700,marginBottom:14,color:"#e2e8f0"}}>📈 Évolution</div><MiniChart sessions={profile.sessions}/></div>
            {profile.memory.weakPoints?.length>0&&<div style={S.card}><div style={{fontWeight:700,marginBottom:10,color:"#e2e8f0"}}>🔍 Points à retravailler</div>{profile.memory.weakPoints.slice().reverse().map((w,i)=><div key={i} style={{fontSize:13,color:"#64748b",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>· {w}</div>)}</div>}
            <div style={S.card}>
              <div style={{fontWeight:700,marginBottom:12,color:"#e2e8f0"}}>🗓 Historique</div>
              {!profile.sessions.length&&<div style={{color:"#334155",fontSize:13}}>Aucune séance encore.</div>}
              {profile.sessions.slice().reverse().map((s,i)=>(
                <div key={i} style={{padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontSize:13,fontWeight:600,color:"#cbd5e1"}}>{s.title}</div><div style={{fontSize:11,color:"#334155"}}>{new Date(s.date).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})}{s.duration?` · ${s.duration} min`:""}</div></div>
                    <div style={{textAlign:"right"}}><div style={{color:"#f59e0b",fontSize:12}}>{"⭐".repeat(s.stars)}</div><div style={{fontSize:13,color:"#34d399",fontWeight:700}}>+{s.points} pts</div></div>
                  </div>
                  {s.insight&&<div style={{fontSize:12,color:"#6366f1",marginTop:4,fontStyle:"italic"}}>💬 {s.insight}</div>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══ PARAMÈTRES ══ */}
        {view==="settings"&&(
          <>
            <div style={{fontWeight:700,fontSize:17,margin:"20px 0 14px",color:"#e2e8f0"}}>⚙️ Paramètres</div>

            {/* Focus */}
            <div style={{...S.card,border:"1px solid rgba(52,211,153,.2)"}}>
              <div style={{fontWeight:700,marginBottom:6,color:"#e2e8f0"}}>🎯 Focus du moment</div>
              <div style={{fontSize:12,color:"#475569",marginBottom:14}}>À remplir avant une génération.</div>
              {tempFocus?(
                <>
                  {[{k:"mots",l:"📝 Mots de la semaine",p:"maison, soleil, forêt…"},{k:"verbes",l:"🔤 Verbes en cours",p:"aller au présent…"},{k:"remarque",l:"💬 Remarque maîtresse",p:"Léo hésite sur…"}].map(({k,l,p})=>(
                    <div key={k} style={{marginBottom:12}}>
                      <div style={{fontSize:12,color:"#64748b",marginBottom:4}}>{l}</div>
                      <input style={S.input} placeholder={p} value={tempFocus[k]||""} onChange={e=>setTempFocus({...tempFocus,[k]:e.target.value})}/>
                    </div>
                  ))}
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>🎯 Point prioritaire</div>
                    <select style={S.input} value={tempFocus.priorite||""} onChange={e=>setTempFocus({...tempFocus,priorite:e.target.value})}>
                      <option value="">— Aucun —</option>
                      {["conjugaison","orthographe","grammaire","maths","géométrie","lecture","vocabulaire"].map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:12,color:"#64748b",marginBottom:8}}>⭐ La semaine ?</div>
                    <Stars value={tempFocus.notesamaine||0} onChange={v=>setTempFocus({...tempFocus,notesamaine:v})} size={28}/>
                  </div>
                  <button style={S.btn} onClick={async()=>{await save({...profile,focus:tempFocus});setTempFocus(null);toast$("Focus mis à jour ✅");}}>💾 Enregistrer</button>
                  <button style={{...S.btnSm,width:"100%",marginTop:8,padding:10}} onClick={()=>setTempFocus(null)}>Annuler</button>
                </>
              ):(
                <>
                  {profile.focus?.mots&&<div style={{fontSize:13,color:"#6ee7b7",marginBottom:4}}>📝 {profile.focus.mots}</div>}
                  {profile.focus?.verbes&&<div style={{fontSize:13,color:"#6ee7b7",marginBottom:4}}>🔤 {profile.focus.verbes}</div>}
                  {profile.focus?.remarque&&<div style={{fontSize:13,color:"#64748b",marginBottom:4}}>💬 {profile.focus.remarque}</div>}
                  {!profile.focus?.mots&&!profile.focus?.verbes&&<div style={{fontSize:13,color:"#334155",marginBottom:8}}>Aucun focus défini.</div>}
                  <button style={S.btnSm} onClick={()=>setTempFocus({...DEFAULT_PROFILE.focus,...(profile.focus||{})})}>✏️ Modifier</button>
                </>
              )}
            </div>

            {/* Programme */}
            <div style={S.card}>
              <div style={{fontWeight:700,marginBottom:14,color:"#e2e8f0"}}>📋 Programme de la séance</div>
              {tempCfg?(
                <>
                  <div style={{fontWeight:600,marginBottom:8,color:"#cbd5e1"}}>⏱ Durée</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
                    {[15,20,25,30,35,40,45].map(d=><button key={d} style={S.tog(tempCfg.duration===d)} onClick={()=>setTempCfg({...tempCfg,duration:d})}>{d} min</button>)}
                  </div>
                  <div style={{fontWeight:600,marginBottom:8,color:"#cbd5e1"}}>🎯 Niveau de Léo</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
                    {["CE1 debut","CE1/CE2","CE2","CE2 avance","CM1"].map(d=><button key={d} style={S.tog(tempCfg.difficulty===d)} onClick={()=>setTempCfg({...tempCfg,difficulty:d})}>{d}</button>)}
                  </div>
                  <div style={{fontWeight:600,marginBottom:8,color:"#cbd5e1"}}>📚 Exercices du programme</div>
                  <div style={{fontSize:12,color:"#475569",marginBottom:10}}>Glisse et modifie les types d exercices de ta séance programmée.</div>
                  {(tempCfg.programme||[]).map((ex,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <select style={{...S.input,flex:1,padding:"8px 12px"}} value={ex.type} onChange={e=>{const p=[...tempCfg.programme];p[i]={...p[i],type:e.target.value,label:e.target.value};setTempCfg({...tempCfg,programme:p});}}>
                        {Object.keys(TYPE_MAP).map(t=><option key={t} value={t}>{t}</option>)}
                      </select>
                      <input style={{...S.input,flex:2,padding:"8px 12px"}} placeholder="Label affiché" value={ex.label||ex.type} onChange={e=>{const p=[...tempCfg.programme];p[i]={...p[i],label:e.target.value};setTempCfg({...tempCfg,programme:p});}}/>
                      <button style={{...S.btnSm,padding:"8px 12px",color:"#f87171"}} onClick={()=>{const p=tempCfg.programme.filter((_,j)=>j!==i);setTempCfg({...tempCfg,programme:p});}}>✕</button>
                    </div>
                  ))}
                  <button style={{...S.btnSm,marginBottom:16}} onClick={()=>setTempCfg({...tempCfg,programme:[...(tempCfg.programme||[]),{type:"conjugaison",label:"Conjugaison"}]})}>+ Ajouter un exercice</button>
                  <button style={S.btn} onClick={async()=>{await save({...profile,weeklyConfig:tempCfg});setTempCfg(null);toast$("Programme mis à jour ✅");}}>💾 Enregistrer</button>
                  <button style={{...S.btnSm,width:"100%",marginTop:8,padding:10}} onClick={()=>setTempCfg(null)}>Annuler</button>
                </>
              ):(
                <>
                  <div style={{fontSize:13,color:"#475569",marginBottom:8}}>⏱ {profile.weeklyConfig.duration} min · {profile.weeklyConfig.difficulty}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                    {profile.weeklyConfig.programme?.map((ex,i)=><span key={i} style={{background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.3)",borderRadius:10,padding:"4px 12px",fontSize:12,color:"#a5b4fc"}}>{ex.label||ex.type}</span>)}
                  </div>
                  <button style={S.btnSm} onClick={()=>setTempCfg({...profile.weeklyConfig})}>✏️ Modifier le programme</button>
                </>
              )}
            </div>

            {/* Admin */}
            <div style={S.card}>
              <div style={{textAlign:"center"}}><span style={{fontSize:11,color:"#1e293b",cursor:"pointer",userSelect:"none"}} onClick={()=>setShowAdmin(v=>!v)}>··· administration</span></div>
              {showAdmin&&(
                <div style={{marginTop:12}}>
                  {!adminOk?(
                    <><div style={{fontSize:12,color:"#64748b",marginBottom:8}}>Code admin :</div>
                    <input type="password" style={{...S.input,marginBottom:8}} value={adminCode} onChange={e=>setAdminCode(e.target.value)} placeholder="Code admin"/>
                    <button style={S.btnSm} onClick={()=>{if(adminCode===ADMIN_CODE){setAdminOk(true);toast$("Mode admin ✅");}else toast$("Code incorrect","#f87171");}}>Valider</button></>
                  ):(
                    <><div style={{fontSize:12,color:"#34d399",marginBottom:14}}>✅ Mode administrateur</div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {[
                        {l:"🔄 Remettre les points à zéro",a:async()=>{if(window.confirm("Remettre à zéro ?")){await save({...profile,totalPoints:0});toast$("Points remis à zéro ✅");}}},
                        {l:"🗑️ Effacer l historique",a:async()=>{if(window.confirm("Effacer l historique ?")){await save({...profile,sessions:[]});toast$("Historique effacé ✅");}}},
                        {l:"🧠 Effacer la mémoire",a:async()=>{if(window.confirm("Effacer la mémoire ?")){await save({...profile,memory:{usedVerbs:[],usedWords:[],weakPoints:[]}});toast$("Mémoire effacée ✅");}}},
                        {l:"🦝 Réinitialiser Roki",a:async()=>{if(window.confirm("Effacer les items ?")){await save({...profile,unlockedBonusItems:[],equippedItems:[]});toast$("Roki réinitialisé ✅");}}},
                        {l:"⚠️ Reset complet",a:async()=>{if(window.confirm("RESET COMPLET ?")){await save({...DEFAULT_PROFILE});toast$("Reset complet ✅");}}},
                      ].map((b,i)=><button key={i} style={{...S.btnSm,color:"#f87171",borderColor:"#f8717140",textAlign:"left"}} onClick={b.a}>{b.l}</button>)}
                    </div></>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* NAV */}
      <nav style={S.nav}>
        {[{id:"home",i:"🏠",l:"Accueil"},{id:"cabane",i:"🦝",l:"Roki"},{id:"stats",i:"📊",l:"Suivi"},{id:"settings",i:"⚙️",l:"Paramètres"}].map(n=>(
          <button key={n.id} style={S.navBtn(view===n.id)} onClick={()=>setView(n.id)}>
            <span style={{fontSize:22}}>{n.i}</span>
            <span style={{fontSize:10,fontWeight:view===n.id?700:400}}>{n.l}</span>
          </button>
        ))}
      </nav>

      <style>{`*{box-sizing:border-box;}textarea:focus,input:focus,select:focus{border-color:rgba(99,102,241,.5)!important;box-shadow:0 0 0 3px rgba(99,102,241,.1);}select option{background:#0f172a;color:white;}@keyframes tw{0%,100%{opacity:.12}50%{opacity:.6}}@keyframes sd{from{transform:translateX(-50%) translateY(-20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}@media print{nav{display:none!important;}}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:rgba(99,102,241,.3);border-radius:2px;}`}</style>
    </div>
  );
}
