import { useState, useEffect, useCallback, useRef } from "react";

const CHILD_NAME   = "Léo";
const SUPABASE_URL = "https://enppydwndwwbmnueuuup.supabase.co";
const SUPABASE_KEY = "sb_publishable_Gf2rnCwwTS7rfmUQ8K_VmQ_RkC1bJZt";
const PARENT_CODE  = "leo2024";
const ADMIN_CODE   = "TTR250";
const SB_H = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };

const CATEGORIES = {
  "Conjugaison": [
    "present_etre_avoir","present_aller_faire","present_1er_groupe","present_2eme_groupe","present_voir_savoir_cm1",
    "imparfait_etre_avoir","imparfait_1er_groupe","imparfait_2eme_groupe","imparfait_irreguliers","imparfait_vs_passe_compose_cm1",
    "futur_simple_etre_avoir","futur_simple_1er_groupe","futur_simple_2eme_groupe","futur_simple_irreguliers",
    "passe_compose_avoir_1er_groupe","passe_compose_etre",
    "conditionnel_present_cm1","identification_temps_cm1"
  ],
  "Grammaire": ["transposition","negation_ne_pas","negation_ne_plus","negation_ne_jamais_rien","accord_sujet_verbe","accord_sujet_verbe_eloigne","classes_de_mots","nature_des_mots","fonctions_sujet_verbe_cod","identifier_sujet_verbe","complement_circonstanciel","expansion_gn","phrase_syntaxe","types_de_phrases","ponctuation","liaison_phrases","propositions_cm1"],
  "Orthographe": [
    "sons_ou_et_on","sons_an_en","sons_in_ain","sons_oi","sons_eau_au","sons_ill_gn",
    "homophones_a_a","homophones_et_est","homophones_son_sont","homophones_ou_où",
    "homophones_ces_ses","homophones_on_ont","homophones_ma_ma",
    "accord_adjectif","accord_participe_passe","mots_invariables"
  ],
  "Dictée": ["dictee_sons_simples","dictee_homophones","dictee_avancee"],
  "Vocabulaire": ["familles_de_mots","familles_de_mots_avancees","synonymes","antonymes","sens_contexte","prefixes_suffixes","niveaux_de_langue"],
  "Lecture": ["comprehension_texte_court","comprehension_inference","comprehension_avancee","remise_en_ordre","resume_texte"],
  "Multiplication": ["tables_melange","multiplication_posee_1chiffre","multiplication_posee_2chiffres"],
  "Soustraction": ["soustraction_retenue","soustraction_grands_nombres","soustraction_cm1"],
  "Addition": ["addition_retenue","addition_grands_nombres","addition_cm1"],
  "Division": ["division_exacte","division_euclidienne","division_posee"],
  "Fractions": ["fractions_representation","fractions_ecriture","fractions_operations","fractions_decimales"],
  "Mesures": ["mesures_longueurs","mesures_masses","mesures_durees","mesures_monnaie","mesures_longueurs_cm1","mesures_durees_cm1"],
  "Problèmes": ["probleme_additif","probleme_multiplicatif","probleme_2_etapes","probleme_partage","probleme_cm1_complexe","probleme_fractions_cm1","probleme_grandeurs_cm1"],
  "Géométrie": ["geometrie_figures","geometrie_symetrie","geometrie_quadrillage","geometrie_patron_cube","geometrie_cm1","geometrie_perimetre","geometrie_aire"],
  "Numération": ["numeration_decomposition","numeration_encadrement","numeration_comparaison","numeration_rangement","numeration_grands_nombres","calcul_mental_complement","calcul_mental_doubles","calcul_mental_cm1"],
};

const AUTO_TYPES = {
  "CE1 debut":  ["present_etre_avoir","soustraction_retenue","sons_ou_et_on","transposition","familles_de_mots"],
  "CE1/CE2":    ["present_aller_faire","imparfait_etre_avoir","tables_melange","transposition","negation_ne_pas"],
  "CE2":        ["futur_simple_1er_groupe","soustraction_grands_nombres","tables_melange","negation_ne_plus","passe_compose_avoir_1er_groupe"],
  "CE2 avance": ["passe_compose_etre","soustraction_grands_nombres","multiplication_posee_1chiffre","accord_sujet_verbe","comprehension_texte_court"],
  "CM1":        ["passe_compose_ete","division_posee","multiplication_posee_2chiffres","complement_circonstanciel","imparfait_vs_passe_compose_cm1"],
};

async function sbLoad() {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/lucas_data?id=eq.lucas&select=data`, { headers: SB_H });
    const rows = await r.json();
    if (rows?.length > 0 && rows[0].data) return JSON.parse(rows[0].data);
  } catch {}
  return null;
}
async function sbSave(p) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/lucas_data`, {
      method: "POST",
      headers: { ...SB_H, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({ id: "lucas", data: JSON.stringify(p), updated_at: new Date().toISOString() }),
    });
  } catch {}
}
async function sbCorpus(sousType) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/corpus?sous_type=eq.${encodeURIComponent(sousType)}&actif=eq.true&select=contenu,format&limit=1`, { headers: SB_H });
    const rows = await r.json();
    if (!rows?.[0]) return null;
    return { contenu: rows[0].contenu, format: rows[0].format || 'libre' };
  } catch { return null; }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function callAPI(prompt, mode = "exercice") {
  const r = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, mode }),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d.text || "";
}

const ITEMS = [
  { pts:0,   e:"🍁", l:"Feuille d érable",      d:"Le début de l aventure !" },
  { pts:5,   e:"🎒", l:"Sac à dos",             d:"Pour transporter ses trésors." },
  { pts:10,  e:"🕯️", l:"Torche",                d:"Pour explorer dans le noir." },
  { pts:20,  e:"🧭", l:"Boussole",              d:"Pour ne jamais se perdre." },
  { pts:35,  e:"🗺️", l:"Carte du trésor",       d:"L aventure commence vraiment !" },
  { pts:55,  e:"🎩", l:"Chapeau d explorateur", d:"Le style de l aventurier." },
  { pts:80,  e:"🔪", l:"Couteau suisse",        d:"L outil ultime du survivant." },
  { pts:110, e:"🏕️", l:"Tente",                 d:"Sa base de camp dans la forêt." },
  { pts:150, e:"⭐", l:"Étoile polaire",         d:"Niveau légendaire atteint !" },
];
const LPT = [0,10,25,45,70,100,140,190];
const LNM = ["Apprenti","Explorateur","Savant","Expert","Champion","Génie","Légende","Maître"];
const LCL = ["#94a3b8","#60a5fa","#34d399","#f59e0b","#f472b6","#a78bfa","#fb923c","#e879f9"];

function lvl(pts) {
  let l=0; for(let i=LPT.length-1;i>=0;i--){if(pts>=LPT[i]){l=i;break;}}
  const n=LPT[l+1]||LPT[l], p=n>LPT[l]?((pts-LPT[l])/(n-LPT[l]))*100:100;
  return {level:l,name:LNM[l],color:LCL[l],progress:Math.min(p,100),toNext:Math.max(0,n-pts)};
}
function unlocked(pts, bonus=[]) {
  const a=ITEMS.filter(i=>i.pts<=pts);
  const b=bonus.map(e=>ITEMS.find(i=>i.e===e)).filter(Boolean);
  const all=[...a]; b.forEach(x=>{if(!all.find(a=>a.e===x.e))all.push(x);}); return all;
}

const LABELS = {
  "present_etre_avoir":"Présent — Être & Avoir","present_aller_faire":"Présent — Aller & Faire","present_1er_groupe":"Présent — 1er groupe","present_2eme_groupe":"Présent — 2ème groupe","present_voir_savoir_cm1":"Présent — Voir & Savoir (CM1)",
  "imparfait_etre_avoir":"Imparfait — Être & Avoir","imparfait_1er_groupe":"Imparfait — 1er groupe","imparfait_2eme_groupe":"Imparfait — 2ème groupe","imparfait_irreguliers":"Imparfait — Irréguliers","imparfait_vs_passe_compose_cm1":"Imparfait vs Passé composé (CM1)",
  "futur_simple_etre_avoir":"Futur — Être & Avoir","futur_simple_1er_groupe":"Futur — 1er groupe","futur_simple_2eme_groupe":"Futur — 2ème groupe","futur_simple_irreguliers":"Futur — Irréguliers",
  "passe_compose_avoir_1er_groupe":"Passé composé avec Avoir","passe_compose_etre":"Passé composé avec Être",
  "conditionnel_present_cm1":"Conditionnel présent (CM1)","identification_temps_cm1":"Identification des temps (CM1)",
  "transposition":"Transposition — Change le sujet","negation_ne_pas":"Négation NE...PAS","negation_ne_plus":"Négation NE...PLUS","negation_ne_jamais_rien":"Négation NE...JAMAIS/RIEN",
  "accord_sujet_verbe":"Accord sujet-verbe","accord_sujet_verbe_eloigne":"Accord sujet-verbe éloigné",
  "classes_de_mots":"Classer des mots","nature_des_mots":"Nature des mots","fonctions_sujet_verbe_cod":"Sujet, verbe et COD","identifier_sujet_verbe":"Identifier le sujet et le verbe",
  "complement_circonstanciel":"Complément circonstanciel","expansion_gn":"Expansion du groupe nominal","phrase_syntaxe":"Remettre les mots dans l ordre","types_de_phrases":"Types de phrases","ponctuation":"Ponctuation","liaison_phrases":"Relier des phrases","propositions_cm1":"Propositions (CM1)",
  "familles_de_mots":"Familles de mots","familles_de_mots_avancees":"Familles de mots (avancé)","synonymes":"Synonymes","antonymes":"Antonymes","sens_contexte":"Sens selon le contexte","prefixes_suffixes":"Préfixes et suffixes","niveaux_de_langue":"Niveaux de langue",
  "tables_melange":"Tables de multiplication mélangées","multiplication_posee_1chiffre":"Multiplication posée (1 chiffre)","multiplication_posee_2chiffres":"Multiplication posée (2 chiffres)",
  "soustraction_retenue":"Soustraction avec retenue","soustraction_grands_nombres":"Soustraction grands nombres","soustraction_cm1":"Soustraction CM1",
  "addition_retenue":"Addition avec retenue","addition_grands_nombres":"Addition grands nombres","addition_cm1":"Addition CM1",
  "comprehension_texte_court":"Compréhension texte court","comprehension_inference":"Compréhension — Inférences","comprehension_avancee":"Compréhension avancée (CM1)","remise_en_ordre":"Remettre les phrases dans l ordre","resume_texte":"Résumé de texte",
  "sons_ou_et_on":"Sons OU / ON","sons_an_en":"Sons AN / EN","sons_in_ain":"Sons IN / AIN",
  "sons_oi":"Sons OI / OIN","sons_eau_au":"Sons EAU / AU","sons_ill_gn":"Sons ILL / GN",
  "homophones_a_a":"Homophones A / À","homophones_et_est":"Homophones ET / EST","homophones_son_sont":"Homophones SON / SONT",
  "homophones_ou_où":"Homophones OU / OÙ","homophones_ces_ses":"Homophones CES / SES","homophones_on_ont":"Homophones ON / ONT","homophones_ma_ma":"Homophones MA / M'A",
  "accord_adjectif":"Accord de l adjectif","accord_participe_passe":"Accord du participe passé","mots_invariables":"Mots invariables",
};
const label = s => LABELS[s] || s.replace(/_/g," ");

function Raton({ items=[], size=120, anim=true }) {
  const bag   = items.find(i=>i.e==="🎒");
  const hat   = items.find(i=>i.e==="🎩");
  const torch = items.find(i=>i.e==="🕯️");
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" overflow="visible">
      <style>{`
        .rB{animation:${anim?"rB 2s ease-in-out infinite":"none"};transform-origin:50px 55px}
        .rT{animation:${anim?"rT 2s ease-in-out infinite":"none"};transform-origin:72px 72px}
        .rE{animation:${anim?"rE 4s ease-in-out infinite":"none"};transform-origin:50px 42px}
        @keyframes rB{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
        @keyframes rT{0%,100%{transform:rotate(-18deg)}50%{transform:rotate(18deg)}}
        @keyframes rE{0%,90%,100%{transform:scaleY(1)}94%{transform:scaleY(0.06)}}
      `}</style>
      {torch&&<ellipse cx="80" cy="62" rx="16" ry="12" fill="#fef08a" opacity=".18"/>}
      <g className="rT">
        <ellipse cx="73" cy="72" rx="13" ry="8" fill="#9ca3af" transform="rotate(-30,73,72)"/>
        {[0,1,2,3].map(i=>(<ellipse key={i} cx={73+i*1.5} cy={72+i*1.5} rx={11-i*1.5} ry={6-i*0.8} fill={i%2===0?"#374151":"#d1d5db"} opacity=".55" transform={`rotate(-30,${73+i*1.5},${72+i*1.5})`}/>))}
        <ellipse cx="73" cy="72" rx="7" ry="4.5" fill="#f9fafb" transform="rotate(-30,73,72)"/>
      </g>
      <g className="rB">
        <ellipse cx="50" cy="66" rx="22" ry="24" fill="#b0b8c1"/>
        <ellipse cx="50" cy="69" rx="13" ry="17" fill="#f0f4f8"/>
        {bag&&<><rect x="67" y="54" width="13" height="18" rx="4" fill="#92400e"/><rect x="69" y="52" width="9" height="4" rx="2" fill="#78350f"/><rect x="70" y="61" width="7" height="1.5" rx="1" fill="#78350f"/><line x1="72" y1="56" x2="72" y2="70" stroke="#78350f" strokeWidth="1.2"/></>}
        {torch&&<><rect x="27" y="66" width="4" height="11" rx="2" fill="#92400e"/><ellipse cx="29" cy="65" rx="4.5" ry="5" fill="#fbbf24"/><ellipse cx="29" cy="63.5" rx="2.5" ry="3" fill="#fde68a"/></>}
        <ellipse cx="31" cy="68" rx="7" ry="5" fill="#9ca3af" transform="rotate(20,31,68)"/>
        <ellipse cx="69" cy="68" rx="7" ry="5" fill="#9ca3af" transform="rotate(-20,69,68)"/>
        <ellipse cx="40" cy="87" rx="9" ry="5" fill="#9ca3af"/>
        <ellipse cx="60" cy="87" rx="9" ry="5" fill="#9ca3af"/>
        {[-3,0,3].map(dx=><circle key={dx} cx={40+dx} cy="91" r="2" fill="#6b7280"/>)}
        {[-3,0,3].map(dx=><circle key={dx} cx={60+dx} cy="91" r="2" fill="#6b7280"/>)}
        <circle cx="50" cy="42" r="22" fill="#b0b8c1"/>
        <circle cx="32" cy="24" r="9" fill="#9ca3af"/><circle cx="32" cy="24" r="5.5" fill="#fecdd3"/>
        <circle cx="68" cy="24" r="9" fill="#9ca3af"/><circle cx="68" cy="24" r="5.5" fill="#fecdd3"/>
        {hat&&<><ellipse cx="50" cy="23" rx="24" ry="5.5" fill="#1e3a5f"/><rect x="38" y="2" width="24" height="22" rx="5" fill="#1e3a5f"/><rect x="40" y="13" width="20" height="3" rx="1.5" fill="#f59e0b"/></>}
        <path d="M26 40 Q50 34 74 40 Q74 50 68 52 Q60 55 50 54 Q40 55 32 52 Q26 50 26 40Z" fill="#1f2937"/>
        <ellipse cx="39" cy="40" rx="8" ry="6" fill="#374151"/>
        <ellipse cx="61" cy="40" rx="8" ry="6" fill="#374151"/>
        <g className="rE">
          <circle cx="39" cy="40" r="7" fill="white"/><circle cx="61" cy="40" r="7" fill="white"/>
          <circle cx="40" cy="40" r="4.5" fill="#1c2a3a"/><circle cx="62" cy="40" r="4.5" fill="#1c2a3a"/>
          <circle cx="40" cy="40" r="3" fill="#2563eb"/><circle cx="62" cy="40" r="3" fill="#2563eb"/>
          <circle cx="40" cy="40" r="1.8" fill="#0f172a"/><circle cx="62" cy="40" r="1.8" fill="#0f172a"/>
          <circle cx="41.5" cy="38.5" r="1.2" fill="white"/><circle cx="63.5" cy="38.5" r="1.2" fill="white"/>
        </g>
        <ellipse cx="50" cy="48" rx="4.5" ry="3" fill="#1f2937"/>
        <ellipse cx="48.5" cy="47" rx="1.8" ry="1.2" fill="#374151" opacity=".7"/>
        <line x1="28" y1="49" x2="43" y2="50" stroke="#374151" strokeWidth="0.8" opacity=".6"/>
        <line x1="28" y1="52" x2="43" y2="51.5" stroke="#374151" strokeWidth="0.8" opacity=".6"/>
        <line x1="57" y1="50" x2="72" y2="49" stroke="#374151" strokeWidth="0.8" opacity=".6"/>
        <line x1="57" y1="51.5" x2="72" y2="52" stroke="#374151" strokeWidth="0.8" opacity=".6"/>
        <path d="M44 53 Q50 59 56 53" stroke="#1f2937" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
        <circle cx="34" cy="50" r="5" fill="#fda4af" opacity=".4"/>
        <circle cx="66" cy="50" r="5" fill="#fda4af" opacity=".4"/>
      </g>
    </svg>
  );
}

function Cabane() {
  return (
    <svg width="100%" height="180" viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="180" fill="#020817"/>
      {[...Array(25)].map((_,i)=><circle key={i} cx={Math.sin(i*37)*150+160} cy={Math.cos(i*53)*60+50} r={i%3===0?1.5:1} fill="white" opacity={.3+(i%3)*.2}/>)}
      <circle cx="268" cy="28" r="19" fill="#fef3c7"/><circle cx="278" cy="22" r="15" fill="#020817"/>
      <rect x="42" y="112" width="14" height="68" rx="3" fill="#4a2c0a"/>
      <ellipse cx="49" cy="102" rx="29" ry="38" fill="#14532d"/><ellipse cx="49" cy="90" rx="23" ry="31" fill="#166534"/>
      <rect x="250" y="122" width="12" height="58" rx="3" fill="#4a2c0a"/>
      <ellipse cx="256" cy="110" rx="25" ry="34" fill="#14532d"/><ellipse cx="256" cy="98" rx="19" ry="27" fill="#166534"/>
      <rect x="83" y="110" width="154" height="9" rx="3" fill="#92400e"/><rect x="88" y="106" width="144" height="7" rx="2" fill="#b45309"/>
      <rect x="93" y="54" width="134" height="57" rx="5" fill="#78350f"/><rect x="98" y="59" width="124" height="47" rx="3" fill="#92400e"/>
      <polygon points="83,58 160,20 237,58" fill="#1e3a5f"/><polygon points="88,58 160,25 232,58" fill="#1e40af"/>
      <rect x="128" y="69" width="27" height="23" rx="3" fill="#fef3c7"/><rect x="130" y="71" width="23" height="19" rx="2" fill="#fde68a"/>
      <line x1="141" y1="71" x2="141" y2="90" stroke="#92400e" strokeWidth="1.5"/><line x1="130" y1="80" x2="153" y2="80" stroke="#92400e" strokeWidth="1.5"/>
      <rect x="173" y="75" width="19" height="31" rx="3" fill="#4a2c0a"/><circle cx="188" cy="91" r="2" fill="#fbbf24"/>
      <line x1="108" y1="119" x2="108" y2="158" stroke="#92400e" strokeWidth="2.5"/><line x1="119" y1="119" x2="119" y2="158" stroke="#92400e" strokeWidth="2.5"/>
      {[132,144,156].map(y=><line key={y} x1="108" y1={y} x2="119" y2={y} stroke="#b45309" strokeWidth="1.5"/>)}
      <ellipse cx="160" cy="176" rx="112" ry="8" fill="#14532d" opacity=".5"/>
    </svg>
  );
}

function Stars({ value, onChange, size=32 }) {
  return (
    <div style={{display:"flex",gap:8,justifyContent:"center"}}>
      {[1,2,3,4,5].map(s=>(
        <span key={s} onClick={()=>onChange?.(s)}
          style={{fontSize:size,cursor:"pointer",filter:s<=value?"none":"grayscale(1) opacity(0.2)",transition:"transform .15s",userSelect:"none",display:"inline-block"}}
          onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.3)";}}
          onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";}}>⭐</span>
      ))}
    </div>
  );
}

function Chart({ sessions }) {
  if (!sessions?.length) return <div style={{textAlign:"center",color:"#475569",padding:"20px 0",fontSize:13}}>Aucune séance encore</div>;
  const last7=sessions.slice(-7), maxP=Math.max(...last7.map(s=>s.points),5);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:8,height:80}}>
      {last7.map((s,i)=>{
        const h=Math.max(8,(s.points/maxP)*72), d=new Date(s.date);
        return (<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{fontSize:10,color:"#64748b",fontWeight:700}}>{s.points}</div>
          <div style={{width:"100%",height:h,borderRadius:"6px 6px 0 0",background:"linear-gradient(180deg,#818cf8,#3b82f6)",transition:"height .5s"}}/>
          <div style={{fontSize:9,color:"#475569"}}>{d.getDate()}/{d.getMonth()+1}</div>
        </div>);
      })}
    </div>
  );
}

const MATH_TYPES  = ["multiplication","soustraction","addition","division","tables"];
const CONJ_TYPES  = ["present","imparfait","futur","passe","conditionnel"];
const VOCAB_TYPES = ["familles_de_mots","synonymes","antonymes","sens_contexte","prefixes_suffixes","niveaux_de_langue"];
const isMath  = t => MATH_TYPES.some(x => t?.includes(x));
const isConj  = t => CONJ_TYPES.some(x => t?.includes(x));
const isVocab = t => VOCAB_TYPES.some(x => t?.includes(x));
const hideInstructions = t => isMath(t) || isConj(t);
const hideExample      = t => (isMath(t) || isConj(t) || t?.includes("addition") || t?.includes("soustraction") || t?.includes("comprehension")) && !t?.includes("vs_passe_compose");
const hideParentNote   = () => true;

// Types pour lesquels la phrase bleue est toujours masquée
const TYPES_SANS_INSTRUCTIONS = new Set([
  "homophones_a_a","homophones_et_est","homophones_son_sont","homophones_ou_où",
  "homophones_ces_ses","homophones_on_ont","homophones_ma_ma",
  "accord_adjectif","accord_participe_passe","mots_invariables",
  "sons_ou_et_on","sons_an_en","sons_in_ain","sons_oi","sons_eau_au","sons_ill_gn",
]);
function isInstructionRedondante(title, instructions, type) {
  return !!type && TYPES_SANS_INSTRUCTIONS.has(type);
}

function ExCard({ ex, dark=true }) {
  if (!ex) return null;
  const fmt = ex.format || 'libre';
  const tc = dark?"#cbd5e1":"#1e293b";
  const lc = dark?"#475569":"#94a3b8";
  const ac = dark?"#a5b4fc":"#4f46e5";
  const lignes = ex.lignes || [];

  if (fmt === 'conjugaison') {
    const blocs = [];
    let cur = null;
    const PRONOMS_SET = new Set(["je","tu","il/elle","nous","vous","ils/elles","il","elle","ils","elles"]);
    for (const l of lignes) {
      const trim = l.trim();
      if (!trim) continue;
      const isPronom = PRONOMS_SET.has(trim.toLowerCase());
      const isTitle = !isPronom && (trim.includes("—") || trim.includes("–") || (trim === trim.toUpperCase() && trim.length > 2));
      if (isTitle) { if (cur) blocs.push(cur); cur = {title: trim}; }
    }
    if (cur) blocs.push(cur);
    if (blocs.length === 0 && ex.title) {
      const parts = ex.title.split("—")[0].trim().split("&").map(v => v.trim());
      const tempsMatch = ex.title.match(/[—-]\s*([^—-]+)$/);
      const temps = tempsMatch ? tempsMatch[1].trim() : "";
      parts.forEach(v => { if(v) blocs.push({title: `${v.toUpperCase()} — ${temps}`}); });
    }
    while (blocs.length < 2) blocs.push({title: blocs[0]?.title || "VERBE — ?"});
    const show = blocs.slice(0, 2);
    const PRONOMS = ["je","tu","il/elle","nous","vous","ils/elles"];
    return (
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 24px"}}>
        {show.map((b,bi) => (
          <div key={bi}>
            <div style={{fontWeight:700, fontSize:dark?13:12, color:ac, marginBottom:10, paddingBottom:4}}>
              {b.title.toUpperCase()}
            </div>
            {PRONOMS.map((p,pi) => (
              <div key={pi} style={{display:"flex", alignItems:"center", gap:8, marginBottom:dark?12:9}}>
                <span style={{fontSize:dark?13:12, color:tc, flexShrink:0, minWidth:62}}>{p}</span>
                <div style={{flex:1, borderBottom:`1.5px solid ${lc}`, height:1, marginTop:8, minWidth:60}}></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (fmt === 'fleche') {
    if (!lignes.length) return <div style={{fontSize:14, color:tc}}>{ex.content||""}</div>;
    return (
      <div>
        {lignes.map((l,i) => {
          const trim = l.trim();
          if (!trim) return null;
          const arrowIdx = trim.indexOf("→");
          if (arrowIdx >= 0) {
            const avant = trim.slice(0, arrowIdx).trim();
            const apres = trim.slice(arrowIdx+1).trim();
            const estVide = apres === "" || /^_+$/.test(apres);
            return (
              <div key={i} style={{marginBottom:dark?18:13}}>
                <div style={{display:"flex", alignItems:"flex-start", gap:6, flexWrap:"wrap"}}>
                  <span style={{fontSize:dark?13:12, color:tc, paddingTop:2}}>{avant} →</span>
                  {estVide
                    ? <div style={{flex:1, borderBottom:`1.5px solid ${lc}`, height:1, marginTop:10, minWidth:120}}></div>
                    : <span style={{fontSize:dark?13:12, color:ac}}>{apres}</span>
                  }
                </div>
              </div>
            );
          }
          return <div key={i} style={{fontSize:dark?13:12, color:tc, lineHeight:2, marginBottom:2}}>{trim}</div>;
        })}
      </div>
    );
  }

  if (fmt === 'trous') {
    if (!lignes.length) return <div style={{fontSize:14, color:tc, whiteSpace:"pre-line"}}>{ex.content||""}</div>;
    const isComprehension = ex.type?.includes("comprehension");
    if (isComprehension) {
      const texte = lignes[0] || "";
      const questions = lignes.slice(2).filter(l => l.trim());
      return (
        <div>
          <div style={{fontSize:dark?14:13, color:tc, lineHeight:1.9, marginBottom:20, padding:"12px 14px", background:dark?"rgba(255,255,255,.04)":"#f8fafc", borderRadius:10, borderLeft:`3px solid ${ac}`}}>
            {texte}
          </div>
          <div style={{borderTop:`1px solid ${lc}30`, paddingTop:14}}>
            {questions.map((q,i) => (
              <div key={i} style={{marginBottom:dark?16:12}}>
                <div style={{fontSize:dark?13:12, color:tc, fontWeight:600, marginBottom:6}}>{q}</div>
                <div style={{borderBottom:`1.5px solid ${lc}`, height:1, marginBottom:4}}></div>
                <div style={{borderBottom:`1.5px solid ${lc}`, height:1}}></div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div>
        {lignes.map((l,i) => {
          const trim = l.trim();
          if (!trim) return <div key={i} style={{height:8}}></div>;
          const parts = trim.split(/_{3,}/);
          if (parts.length > 1) {
            return (
              <div key={i} style={{display:"flex", alignItems:"baseline", flexWrap:"wrap", gap:4, marginBottom:dark?10:7, fontSize:dark?13:12, color:tc, lineHeight:1.8}}>
                {parts.map((part, pi) => (
                  <span key={pi} style={{display:"contents"}}>
                    <span>{part}</span>
                    {pi < parts.length-1 && <span style={{display:"inline-block", borderBottom:`1.5px solid ${lc}`, minWidth:60, height:1, marginBottom:3, flexShrink:0}}></span>}
                  </span>
                ))}
              </div>
            );
          }
          return <div key={i} style={{fontSize:dark?13:12, color:tc, lineHeight:2, marginBottom:2}}>{trim}</div>;
        })}
      </div>
    );
  }

  if (fmt === 'calcul') {
    if (!lignes.length) return <div style={{fontSize:14, color:tc, whiteSpace:"pre-line"}}>{ex.content||""}</div>;
    const isMulti = ex.type?.includes("tables_melange") || ex.title?.toLowerCase().includes("tables de 1");
    const calcItems = lignes
      .map(l => l.replace(/^\d+[\.\)]\s*/, "").replace(/_{2,}/g, "").trimEnd())
      .filter(Boolean)
      .slice(0, isMulti ? 20 : 6);
    return (
      <div>
        {isMulti && (
          <div style={{fontWeight:700, fontSize:dark?13:12, color:ac, marginBottom:10}}>
            Multiplication — Tables de 1 à 10 ⏱ Chronométré 3 min
          </div>
        )}
        {ex.example && !isMulti && (
          <div style={{background:dark?"rgba(99,102,241,.08)":"#eff6ff", borderRadius:10, padding:"10px 14px", marginBottom:14, border:`1px solid ${ac}22`}}>
            <div style={{fontSize:10, color:ac, fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:.5}}>Exemple</div>
            <div style={{fontSize:dark?13:12, color:tc, whiteSpace:"pre-line", lineHeight:1.8}}>{ex.example}</div>
          </div>
        )}
        <div style={{display:"grid", gridTemplateColumns:`repeat(${isMulti ? 4 : 3}, 1fr)`, gap:"14px 16px"}}>
          {calcItems.map((item, i) => (
            <div key={i} style={{display:"flex", alignItems:"baseline", gap:6}}>
              <span style={{fontWeight:600, fontSize:dark?13:12, color:tc, whiteSpace:"nowrap"}}>{item}</span>
              <div style={{flex:1, borderBottom:`1.5px solid ${lc}`, minWidth:44, marginBottom:2}}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (fmt === 'probleme') {
    if (!lignes.length) return <div style={{fontSize:14, color:tc, whiteSpace:"pre-line"}}>{ex.content||""}</div>;
    return (
      <div>
        {lignes.map((l,i) => {
          const trim = l.trim();
          if (!trim) return <div key={i} style={{height:6}}></div>;
          const parts = trim.split(/_{3,}/);
          if (parts.length > 1) {
            return (
              <div key={i} style={{display:"flex", alignItems:"baseline", flexWrap:"wrap", gap:4, marginBottom:dark?10:7, fontSize:dark?13:12, color:tc}}>
                {parts.map((part, pi) => (
                  <span key={pi} style={{display:"contents"}}>
                    <span>{part}</span>
                    {pi < parts.length-1 && <span style={{display:"inline-block", borderBottom:`1.5px solid ${lc}`, minWidth:50, height:1, marginBottom:3}}></span>}
                  </span>
                ))}
              </div>
            );
          }
          return <div key={i} style={{fontSize:dark?13:12, color:tc, lineHeight:1.8, marginBottom:6}}>{trim}</div>;
        })}
      </div>
    );
  }

  if (fmt === 'dictee') {
    const motsCle = lignes.find(l => l.includes("MOTS À PRÉPARER") || l.includes("MOTS A PREPARER"));
    const texte = lignes.filter(l => !l.includes("MOTS À PRÉPARER") && !l.includes("MOTS A PREPARER") && l.trim());
    return (
      <div>
        {motsCle && (
          <div style={{background:dark?"rgba(99,102,241,.1)":"#eff6ff", borderRadius:10, padding:"8px 12px", marginBottom:12, fontSize:dark?12:11, color:dark?"#a5b4fc":"#1d4ed8"}}>
            {motsCle}
          </div>
        )}
        <div style={{fontSize:dark?13:12, color:tc, lineHeight:2.2}}>
          {texte.map((l,i) => <div key={i} style={{marginBottom:4}}>{l}</div>)}
        </div>
      </div>
    );
  }

  if (!lignes.length) return <div style={{fontSize:14, color:tc, lineHeight:2, whiteSpace:"pre-line"}}>{ex.content||""}</div>;
  return (
    <div>
      {lignes.map((l,i) => {
        const trim = l.trim();
        if (!trim) return <div key={i} style={{height:6}}></div>;
        const parts = trim.split(/_{3,}/);
        if (parts.length > 1) {
          return (
            <div key={i} style={{display:"flex", alignItems:"baseline", flexWrap:"wrap", gap:4, marginBottom:dark?10:7, fontSize:dark?13:12, color:tc, lineHeight:1.8}}>
              {parts.map((part,pi) => (
                <span key={pi} style={{display:"contents"}}>
                  <span>{part}</span>
                  {pi < parts.length-1 && <span style={{display:"inline-block", borderBottom:`1.5px solid ${lc}`, minWidth:50, height:1, marginBottom:3}}></span>}
                </span>
              ))}
            </div>
          );
        }
        return <div key={i} style={{fontSize:dark?13:12, color:tc, lineHeight:2.1, marginBottom:ex.type?.includes("identifier_sujet")?10:2}}>{trim.replace(/<\/?u>/g,"")}</div>;
      })}
    </div>
  );
}

const DEF = {
  name:CHILD_NAME, totalPoints:0, sessions:[], unlockedBonusItems:[], equippedItems:[],
  weeklyConfig:{ duration:25, difficulty:"CE1/CE2" },
  focus:{ mots:"", verbes:"", remarque:"", notesamaine:0, priorite:"" },
  memory:{ usedVerbs:[], usedWords:[], weakPoints:[] },
};

export default function App() {
  const [prof, setProf]        = useState(null);
  const [view, setView]        = useState("home");
  const [tab, setTab]          = useState("rapide");
  const [loading, setLoading]  = useState(true);
  const [sync, setSync]        = useState("");
  const [gen, setGen]          = useState(false);
  const [session, setSession]  = useState(null);
  const [score, setScore]      = useState(null);
  const [ctx, setCtx]          = useState("");
  const [toast, setToast]      = useState(null);
  const [stars, setStars]      = useState(0);
  const [obs, setObs]          = useState("");
  const [print, setPrint]      = useState(false);
  const [showP, setShowP]      = useState(false);
  const [pCode, setPCode]      = useState("");
  const [pOk, setPOk]          = useState(false);
  const [showA, setShowA]      = useState(false);
  const [aCode, setACode]      = useState("");
  const [aOk, setAOk]          = useState(false);
  const [cfg, setCfg]          = useState(null);
  const [foc, setFoc]          = useState(null);
  const [selCat, setSelCat]    = useState("");
  const [selSub, setSelSub]    = useState("");
  const [mesure, setMesure]    = useState([]);
  const [msgs, setMsgs]        = useState([{r:"a",t:"Salut aventurier ! Je suis Roki 🌲 Prêt pour de nouvelles découvertes ?"}]);
  const [chatIn, setChatIn]    = useState("");
  const [chatBusy, setChatBusy]= useState(false);
  const chatEnd = useRef(null);

  const toast$ = (m,c="#34d399")=>{setToast({m,c});setTimeout(()=>setToast(null),3200);};

  useEffect(()=>{
    (async()=>{
      let d=await sbLoad();
      if(!d){try{const l=localStorage.getItem("leo_v5");if(l)d=JSON.parse(l);}catch{}}
      setProf(d||{...DEF});
      setLoading(false);
    })();
  },[]);

  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  const save=useCallback(async(p)=>{
    setProf(p); localStorage.setItem("leo_v5",JSON.stringify(p)); setSync("saving");
    try{await sbSave(p);setSync("saved");setTimeout(()=>setSync(""),2000);}
    catch{setSync("error");setTimeout(()=>setSync(""),3000);}
  },[]);

  async function generate(types) {
    if(!types||types.length===0){toast$("Sélectionne au moins un exercice !","#f59e0b");return;}
    setGen(true); setSession(null); setScore(null); setStars(0); setObs("");

    const niv = prof.weeklyConfig.difficulty || "CE1/CE2";
    const { memory, weeklyConfig, focus } = prof;

    const focStr = [
      focus?.mots      ? `Mots de la semaine : ${focus.mots}` : "",
      focus?.verbes    ? `Verbes imposés : ${focus.verbes}` : "",
      ctx              ? `Contexte du jour : ${ctx}` : "",
      memory.usedVerbs?.length  ? `Verbes déjà vus — NE PAS répéter : ${memory.usedVerbs.slice(-10).join(", ")}` : "",
      memory.weakPoints?.length ? `Points faibles : ${memory.weakPoints.slice(-3).join(" | ")}` : "",
    ].filter(Boolean).join("\n");

    const exercises = [];
    const usedVerbsSession = new Set((memory.usedVerbs || []).map(v => v.toLowerCase()));
    const usedWordsSession = new Set((memory.usedWords || []).map(w => w.toLowerCase()));

    for (let idx = 0; idx < types.length; idx++) {
      const st = types[idx];
      if (idx > 0) await sleep(6000);
      try {
        const corpusData = await sbCorpus(st);
        const modele = corpusData?.contenu || null;
        const exFormat = corpusData?.format || 'libre';

        const isConjType  = (st.includes("present")||st.includes("imparfait")||st.includes("futur")||st.includes("passe")||st.includes("conditionnel")) && !st.includes("vs_passe_compose") && !st.includes("identification_temps") && !st.includes("accord_participe");
        const isIdentTemps = st === "identification_temps_cm1";
        const isCalcType  = ["multiplication","soustraction","addition","division"].some(t=>st.includes(t));
        const isTablesType = st.includes("tables_melange");
        const isEncadr    = st.includes("encadrement")||st.includes("numeration")||st.includes("calcul_mental");
        const isProbl     = st.includes("probleme");
        const isDictee    = st.includes("dictee");
        const isTranspo   = st === "transposition" || st.includes("transposition_");
        const isNeg       = st.includes("negation");
        const isNature    = st.includes("nature_des_mots") || st.includes("classes_de_mots");
        const isVocabType = VOCAB_TYPES.some(t=>st.includes(t));
        const isFamilles  = st.includes("familles_de_mots");
        const isVsTemps         = st.includes("vs_passe_compose");
        const isMonnaie         = st.includes("monnaie");
        const isAccordSVEloigne = st === "accord_sujet_verbe_eloigne";
        const isAccordSV        = st === "accord_sujet_verbe";
        const isNatureMots      = st === "nature_des_mots";
        const isClassesMots     = st === "classes_de_mots";
        const isFonctionsSVC    = st === "fonctions_sujet_verbe_cod";
        const isIdentSujetVerbe = st === "identifier_sujet_verbe";
        const isPhraseSyntaxe   = st === "phrase_syntaxe";
        const isPonctuation     = st === "ponctuation";
        const isRemiseOrdre     = st === "remise_en_ordre";
        const isLiaison         = st === "liaison_phrases" || st.includes("liaison");

        // ─── Détection des types d orthographe dédiés ────────────────────────
        const isHomophoneAA      = st === "homophones_a_a";
        const isHomophoneEtEst   = st === "homophones_et_est";
        const isHomophoneSonSont = st === "homophones_son_sont";
        const isHomophoneOuOu    = st === "homophones_ou_où";
        const isHomophoneCesSes  = st === "homophones_ces_ses";
        const isHomophoneOnOnt   = st === "homophones_on_ont";
        const isHomophoneMaMa    = st === "homophones_ma_ma";
        const isAccordAdjectif   = st === "accord_adjectif";
        const isAccordPP         = st === "accord_participe_passe";
        const isMotsInvariables  = st === "mots_invariables";

        // ─── SONS SIMPLES orthographe : génération DIRECTE sans Groq ────────
        const SONS_LABELS = {
          "sons_ou_et_on": "OU / ON",
          "son_ou":        "OU / ON",
          "sons_an_en":    "AN / EN",
          "sons_in_ain":   "IN / AIN",
          "sons_oi":       "OI / OIN",
          "sons_eau_au":   "EAU / AU",
          "sons_ill_gn":   "ILL / GN",
        };
        const SONS_EXEMPLES = {
          "sons_ou_et_on": "B__CHE → BOUCHE (OU) | BALL__ → BALLON (ON)",
          "son_ou":        "B__CHE → BOUCHE (OU) | BALL__ → BALLON (ON)",
          "sons_an_en":    "__F__T → ENFANT (EN) | SERP__T → SERPENT (AN)",
          "sons_in_ain":   "LAP__ → LAPIN (IN) | M__ → MAIN (AIN)",
          "sons_oi":       "R__ → ROI (OI) | L__ → LOIN (OIN)",
          "sons_eau_au":   "BAT__ → BATEAU (EAU) | __TOMNE → AUTOMNE (AU)",
          "sons_ill_gn":   "F__E → FILLE (ILL) | MONTA__E → MONTAGNE (GN)",
        };

        if (SONS_LABELS[st]) {
          const sonLabel = SONS_LABELS[st];
          const sonExemple = SONS_EXEMPLES[st];
          const dur = Math.max(5, Math.round((weeklyConfig.duration||25)/types.length));
          const contenuBrut = modele || "";

          const hasGNSep = contenuBrut.includes("---GN---");
          let selection = [];

          if (hasGNSep) {
            const [blocILL, blocGN] = contenuBrut.split("---GN---");
            const parsePaires = (bloc) => bloc.split("\n").map(l => l.trim()).filter(l => l.includes("|"))
              .map(l => { const [mot, tronc] = l.split("|"); return { mot: mot.trim(), tronc: tronc.trim() }; })
              .filter(p => p.mot && p.tronc);
            const pairesILL = parsePaires(blocILL);
            const pairesGN  = parsePaires(blocGN);
            const dispILL = pairesILL.filter(p => !usedWordsSession.has(p.mot.toLowerCase()));
            const dispGN  = pairesGN.filter(p => !usedWordsSession.has(p.mot.toLowerCase()));
            const poolILL = dispILL.length >= 3 ? dispILL : pairesILL;
            const poolGN  = dispGN.length >= 3  ? dispGN  : pairesGN;
            const tirILL = [...poolILL].sort(() => Math.random() - 0.5).slice(0, 3);
            const tirGN  = [...poolGN].sort(() => Math.random() - 0.5).slice(0, 3);
            selection = [...tirILL, ...tirGN].sort(() => Math.random() - 0.5);
          } else {
            const pairesRaw = contenuBrut.split("\n").map(l => l.trim()).filter(l => l.includes("|"));
            const paires = pairesRaw.map(l => { const [mot, tronc] = l.split("|"); return { mot: mot.trim(), tronc: tronc.trim() }; }).filter(p => p.mot && p.tronc);
            const pairesDispos = paires.filter(p => !usedWordsSession.has(p.mot.toLowerCase()));
            const pool = pairesDispos.length >= 6 ? pairesDispos : paires;
            selection = [...pool].sort(() => Math.random() - 0.5).slice(0, 6);
          }

          if (selection.length >= 3) {
            const lignes = selection.map(p => `${p.tronc} → _______________`);
            const wordsUsed = selection.map(p => p.mot.toLowerCase());
            exercises.push({
              type: st,
              format: 'fleche',
              title: `Sons ${sonLabel}`,
              emoji: "✏️",
              duration: `${Math.max(5, Math.round((weeklyConfig.duration||25)/types.length))} min`,
              instructions: `Retrouve le mot complet et écris-le. Les lettres manquantes forment le son ${sonLabel}.`,
              example: sonExemple,
              lignes,
              parentNote: "",
              verbsUsed: [],
              wordsUsed,
            });
            wordsUsed.forEach(w => usedWordsSession.add(w));
          }
          continue;
        }

        const dur = Math.max(5, Math.round((weeklyConfig.duration||25)/types.length));
        const regles = [];

        // ─── BLOC CONJUGAISON DÉDIÉ ───────────────────────────────────────────
        if (isConjType && !isTranspo) {
          const temps = st.includes("present")?"présent":st.includes("imparfait")?"imparfait":st.includes("futur_simple")?"futur simple":st.includes("futur")?"futur":st.includes("passe_compose")?"passé composé":st.includes("conditionnel")?"conditionnel présent":"présent";

          const CONJ_TITLES = {
            "present_etre_avoir": "ÊTRE & AVOIR — Présent",
            "present_aller_faire": "ALLER & FAIRE — Présent",
            "present_1er_groupe": "1er groupe — Présent",
            "present_2eme_groupe": "2ème groupe — Présent",
            "present_voir_savoir_cm1": "VOIR & SAVOIR — Présent (CM1)",
            "imparfait_etre_avoir": "ÊTRE & AVOIR — Imparfait",
            "imparfait_1er_groupe": "1er groupe — Imparfait",
            "imparfait_2eme_groupe": "2ème groupe — Imparfait",
            "imparfait_irreguliers": "Irréguliers — Imparfait",
            "futur_simple_etre_avoir": "ÊTRE & AVOIR — Futur simple",
            "futur_simple_1er_groupe": "1er groupe — Futur simple",
            "futur_simple_2eme_groupe": "2ème groupe — Futur simple",
            "futur_simple_irreguliers": "Irréguliers — Futur simple",
            "passe_compose_avoir_1er_groupe": "Passé composé avec AVOIR",
            "passe_compose_etre": "Passé composé avec ÊTRE",
            "conditionnel_present_cm1": "Conditionnel présent (CM1)",
            "identification_temps_cm1": "Identification des temps (CM1)",
          };
          const titreConj = CONJ_TITLES[st] || `Conjugaison — ${temps}`;

          const isEtreAvoir  = st.includes("etre_avoir");
          const isAllerFaire = st.includes("aller_faire");
          const isVoirSavoir = st.includes("voir_savoir");

          if (isEtreAvoir || isAllerFaire || isVoirSavoir) {
            const [vA, vB] = isEtreAvoir  ? ["ÊTRE","AVOIR"]
                           : isAllerFaire ? ["ALLER","FAIRE"]
                           :               ["VOIR","SAVOIR"];
            const vAmin = vA.toLowerCase();
            const vBmin = vB.toLowerCase();
            const conjPromptFixe = `Tu es instituteur CE1/CE2. Génère un exercice de conjugaison.
TEMPS : ${temps}
RÈGLE ABSOLUE : les deux verbes sont IMPOSÉS. Tu ne peux pas les changer.
Retourne EXACTEMENT ce JSON (remplace seulement le titre et les verbsUsed si nécessaire) :
{"title":"${titreConj}","emoji":"📝","duration":"${dur} min","instructions":"Conjugue les verbes au ${temps}.","example":"","lignes":["${vA} — ${temps}","${vB} — ${temps}"],"parentNote":"","verbsUsed":["${vAmin}","${vBmin}"],"wordsUsed":[]}`;
            try {
              const rawC = await callAPI(conjPromptFixe, "exercice");
              const cleanC = rawC.replace(/```json|```/g,"").trim();
              const objC = JSON.parse(cleanC.match(/\{[\s\S]*\}/)?.[0]||"{}");
              if (objC.title) {
                exercises.push({type:st, format:'conjugaison', ...objC});
                usedVerbsSession.add(vAmin);
                usedVerbsSession.add(vBmin);
              }
            } catch(e) { console.error("Erreur conjugaison fixe",st,e); }
            continue;
          }

          if (st.includes("2eme_groupe")) {
            const VERBES_2EME = ["finir","choisir","grandir","réussir","obéir","rougir","grossir","nourrir","réfléchir","remplir","applaudir","ralentir","vieillir","blanchir","noircir","fleurir","maigrir","mugir","saisir","subir"];
            const disponibles = VERBES_2EME.filter(v => !usedVerbsSession.has(v));
            const pool = disponibles.length >= 2 ? disponibles : VERBES_2EME;
            const idx1 = Math.floor(Math.random() * pool.length);
            let idx2 = Math.floor(Math.random() * (pool.length - 1));
            if (idx2 >= idx1) idx2++;
            const vA = pool[idx1].toUpperCase();
            const vB = pool[idx2].toUpperCase();
            const vAmin = vA.toLowerCase();
            const vBmin = vB.toLowerCase();
            const conjPromptFixe2 = `Tu es instituteur CE1/CE2. Génère un exercice de conjugaison.
TEMPS : ${temps}
RÈGLE ABSOLUE : les deux verbes sont IMPOSÉS. Tu ne peux pas les changer.
Retourne EXACTEMENT ce JSON :
{"title":"${titreConj}","emoji":"📝","duration":"${dur} min","instructions":"Conjugue les verbes au ${temps}.","example":"","lignes":["${vA} — ${temps}","${vB} — ${temps}"],"parentNote":"","verbsUsed":["${vAmin}","${vBmin}"],"wordsUsed":[]}`;
            try {
              const rawC = await callAPI(conjPromptFixe2, "exercice");
              const cleanC = rawC.replace(/```json|```/g,"").trim();
              const objC = JSON.parse(cleanC.match(/\{[\s\S]*\}/)?.[0]||"{}");
              if (objC.title) {
                exercises.push({type:st, format:'conjugaison', ...objC});
                usedVerbsSession.add(vAmin);
                usedVerbsSession.add(vBmin);
              }
            } catch(e) { console.error("Erreur conjugaison 2eme_groupe",st,e); }
            continue;
          }

          if (st === "passe_compose_etre") {
            const VERBES_ETRE = ["aller","venir","partir","arriver","entrer","sortir","naître","mourir","tomber","rester","monter","descendre","passer","retourner","rentrer","revenir","repartir","devenir","parvenir"];
            const disponiblesE = VERBES_ETRE.filter(v => !usedVerbsSession.has(v));
            const poolE = disponiblesE.length >= 2 ? disponiblesE : VERBES_ETRE;
            const ei1 = Math.floor(Math.random() * poolE.length);
            let ei2 = Math.floor(Math.random() * (poolE.length - 1));
            if (ei2 >= ei1) ei2++;
            const vA = poolE[ei1].toUpperCase();
            const vB = poolE[ei2].toUpperCase();
            const vAmin = vA.toLowerCase();
            const vBmin = vB.toLowerCase();
            const conjPromptEtre = `Tu es instituteur CE2/CM1. Génère un exercice de conjugaison.
TEMPS : passé composé avec l auxiliaire ÊTRE
RÈGLE ABSOLUE : les deux verbes sont IMPOSÉS. Tu ne peux pas les changer. Ces verbes se conjuguent OBLIGATOIREMENT avec ÊTRE.
Retourne EXACTEMENT ce JSON :
{"title":"Passé composé avec ÊTRE","emoji":"📝","duration":"${dur} min","instructions":"Conjugue les verbes au passé composé avec l auxiliaire ÊTRE. Attention aux accords !","example":"","lignes":["${vA} — passé composé","${vB} — passé composé"],"parentNote":"","verbsUsed":["${vAmin}","${vBmin}"],"wordsUsed":[]}`;
            try {
              const rawC = await callAPI(conjPromptEtre, "exercice");
              const cleanC = rawC.replace(/```json|```/g,"").trim();
              const objC = JSON.parse(cleanC.match(/\{[\s\S]*\}/)?.[0]||"{}");
              if (objC.title) {
                exercises.push({type:st, format:'conjugaison', ...objC});
                usedVerbsSession.add(vAmin);
                usedVerbsSession.add(vBmin);
              }
            } catch(e) { console.error("Erreur passe_compose_etre",st,e); }
            continue;
          }

          const interdits = usedVerbsSession.size ? `VERBES INTERDITS (déjà utilisés cette séance) : ${[...usedVerbsSession].join(", ")}. Choisis OBLIGATOIREMENT des verbes hors de cette liste.` : "";

          const groupeContrainte = st.includes("1er_groupe") ?
            "UNIQUEMENT des verbes du 1er groupe en -ER. Liste autorisée (choisis 2 verbes DIFFÉRENTS parmi cette liste) : aimer, chanter, danser, jouer, manger, marcher, parler, passer, porter, regarder, rester, sauter, tomber, tourner, travailler, laver, fermer, montrer, écouter, appeler, arriver, chercher, compter, dessiner, donner, entrer, garder, lancer, lever, nager, penser, pleurer, poser, pousser, rentrer, rouler, tirer, toucher, voler" :
            st.includes("irreguliers") ?
            "UNIQUEMENT des verbes irréguliers du 3ème groupe. Liste autorisée (choisis 2 verbes DIFFÉRENTS parmi cette liste SEULEMENT) : dire, dormir, écrire, faire, lire, mettre, partir, pouvoir, prendre, savoir, sortir, tenir, venir, voir, vouloir. JAMAIS finir, choisir, grandir (ce sont des verbes du 2ème groupe)" :
            "des verbes du 1er groupe adaptés CE1/CE2";

          const conjPrompt = `Tu es instituteur CE1/CE2. Génère un exercice de conjugaison.
TEMPS : ${temps}
CONTRAINTE DE GROUPE : ${groupeContrainte}
${interdits}
INSTRUCTION STRICTE : lignes doit contenir EXACTEMENT 2 chaînes au format "VERBE — temps". Rien d autre. Pas de conjugaison, pas de tirets, pas de pronoms.
Exemple correct : ["CHANTER — présent", "MARCHER — présent"]
Exemple INCORRECT à ne jamais faire : ["CHANTER — JE CHANTE, TU CHANTES..."]
JSON à retourner (remplace seulement VERBE_A et VERBE_B par tes 2 verbes à l infinitif en MAJUSCULES) :
{"title":"${titreConj}","emoji":"📝","duration":"${dur} min","instructions":"Conjugue les verbes au ${temps}.","example":"","lignes":["VERBE_A — ${temps}","VERBE_B — ${temps}"],"parentNote":"","verbsUsed":["verbe_a_minuscule","verbe_b_minuscule"],"wordsUsed":[]}`;

          try {
            const rawC = await callAPI(conjPrompt, "exercice");
            const cleanC = rawC.replace(/```json|```/g,"").trim();
            const objC = JSON.parse(cleanC.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (objC.title) {
              exercises.push({type:st, format:'conjugaison', ...objC});
              (objC.verbsUsed||[]).forEach(v => usedVerbsSession.add(v.toLowerCase()));
              if (objC.lignes) objC.lignes.forEach(l => {
                const m = l.match(/^([A-ZÀÂÉÈÊËÎÏÔÙÛÜÇ]{2,})/);
                if (m) usedVerbsSession.add(m[1].toLowerCase());
              });
            }
          } catch(e) { console.error("Erreur conjugaison",st,e); }
          continue;
        }

        // ─── IMPARFAIT VS PASSÉ COMPOSÉ : prompt dédié ───────────────────────
        if (isVsTemps) {
          const vsPrompt = `Tu es instituteur CM1. Génère un exercice de choix entre imparfait et passé composé.
RÈGLES ABSOLUES :
1. title = "Choix entre imparfait et passé composé (CM1)"
2. instructions = "Choisis le bon temps et conjugue le verbe entre parenthèses."
3. example = "Chaque soir, il (regarder) → regardait (imparfait) / Hier, elle (tomber) → est tombée (passé composé)"
4. lignes = exactement 5 phrases numérotées. Chaque phrase contient ___ (verbe à conjuguer) et se termine par " →"
5. Format de chaque ligne : "N. Marqueur de temps, sujet ___ (verbe) complément →"
6. Utilise ces marqueurs de temps variés : chaque matin, chaque soir, chaque été, hier, soudain, avant, tous les jours, ce matin-là, autrefois, à ce moment-là
7. Verbes simples niveau CM1 : jouer, manger, partir, tomber, crier, chercher, finir, arriver, regarder, courir, trouver, appeler
8. JAMAIS écrire la réponse après "→" dans lignes — l enfant conjugue lui-même
9. parentNote = "" (vide)
JSON uniquement :
{"title":"Choix entre imparfait et passé composé (CM1)","emoji":"📝","duration":"${dur} min","instructions":"Choisis le bon temps et conjugue le verbe entre parenthèses.","example":"Chaque soir, il (regarder) → regardait (imparfait) / Hier, elle (tomber) → est tombée (passé composé)","lignes":["1. Tous les jours, il ___ (jouer) au ballon →","2. Hier, elle ___ (tomber) dans l escalier →","3. Chaque matin, nous ___ (manger) des céréales →","4. Soudain, il ___ (crier) très fort →","5. Avant, tu ___ (habiter) à la campagne →"],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(vsPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'trous', ...obj});
          } catch(e) { console.error("Erreur vs_passe_compose",st,e); }
          continue;
        }

        // ─── IDENTIFICATION DES TEMPS : prompt dédié ─────────────────────────
        if (isIdentTemps) {
          const identPrompt = `Tu es instituteur CM1. Génère un exercice d identification des temps verbaux.
RÈGLES ABSOLUES :
1. title = "Identification des temps (CM1)"
2. instructions = "Lis chaque phrase et écris le temps du verbe souligné."
3. example = "Elle chante une chanson. → présent"
4. lignes = exactement 6 phrases numérotées. Chaque phrase se termine par " → _______________"
5. Temps à utiliser : présent, imparfait, futur simple, passé composé — au moins 1 phrase par temps
6. Verbes variés, phrases courtes niveau CM1, vocabulaire du quotidien
7. JAMAIS écrire la réponse après "→" dans lignes
8. parentNote = "" (vide)
JSON uniquement :
{"title":"Identification des temps (CM1)","emoji":"📝","duration":"${dur} min","instructions":"Lis chaque phrase et écris le temps du verbe souligné. Temps possibles : présent - imparfait - futur simple - passé composé","example":"Elle chante une chanson. → présent","lignes":["1. Nous mangions des crêpes. → _______________","2. Il viendra demain. → _______________","3. Tu as fini tes devoirs. → _______________","4. Elles jouent dans le jardin. → _______________","5. Vous partirez en vacances. → _______________","6. Je regardais la télévision. → _______________"],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(identPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'trous', ...obj});
          } catch(e) { console.error("Erreur identification_temps",st,e); }
          continue;
        }

        // ─── TRANSPOSITION : prompt dédié ────────────────────────────────────
        if (isTranspo) {
          const transpoPrompt = `Tu es instituteur CE1/CE2. Génère un exercice de transposition MÉLANGÉ niveau ${niv}.
L exercice contient 5 phrases, chacune avec un TYPE DIFFÉRENT de transposition :
- Type A : remplacer IL par ELLE (ou ELLE par IL)
- Type B : remplacer TU par JE (ou JE par TU)
- Type C : remplacer IL/ELLE par ILS/ELLES (singulier → pluriel)
- Type D : remplacer NOUS par ILS/ELLES
- Type E : remplacer un prénom singulier par un prénom pluriel (ex: "Léa joue" → "Léa et Tom jouent")
RÈGLES ABSOLUES :
1. Chaque ligne = "N. [phrase originale] → [nouveau sujet] _______________"
2. JAMAIS écrire la réponse complète après la flèche — seulement le nouveau sujet + underscores
3. example = UN exemple résolu complet : "IL mange une pomme. → ELLE mange une pomme."
4. Les 5 lignes doivent avoir 5 types différents parmi A B C D E
5. Phrases courtes, verbes simples, vocabulaire CE1
JSON uniquement :
{"title":"Transposition — Change le sujet","emoji":"✏️","duration":"${dur} min","instructions":"Réécris chaque phrase en changeant le sujet indiqué. Accorde bien le verbe !","example":"IL mange une pomme. → ELLE mange une pomme.","lignes":["1. ELLE dessine un chat. → IL _______________","2. TU chantes bien. → JE _______________","3. IL court vite. → ILS _______________","4. NOUS mangeons. → ILS _______________","5. Léa rit. → Léa et Tom _______________"],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(transpoPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'fleche', ...obj});
          } catch(e) { console.error("Erreur transposition",st,e); }
          continue;
        }

        // ─── NÉGATION : prompt dédié ──────────────────────────────────────────
        if (isNeg) {
          const negType = st.includes("plus")?"NE...PLUS":st.includes("jamais")?"NE...JAMAIS":"NE...PAS";
          const negMot  = st.includes("plus")?"ne … plus":st.includes("jamais")?"ne … jamais":"ne … pas";
          const negEx   = st.includes("plus")?"Elle mange des épinards. → Elle ne mange plus d épinards.":st.includes("jamais")?"Elle mange des épinards. → Elle ne mange jamais d épinards.":"Il joue au foot. → Il ne joue pas au foot.";
          const negPrompt = `Tu es instituteur CE1/CE2. Génère un exercice de négation ${negType} niveau ${niv}.
RÈGLES ABSOLUES :
1. title = "Négation avec ${negType}"
2. instructions = "Réécris chaque phrase à la forme négative avec ${negMot}."
3. example = "${negEx}"
4. lignes = 5 phrases AFFIRMATIVES numérotées, chacune se terminant par " → _______________"
   Format EXACT : "N. [Phrase affirmative complète.] → _______________"
5. JAMAIS mettre de blancs ou de (ne) dans la phrase affirmative — la phrase est complète et lisible
6. L enfant réécrit la phrase ENTIÈRE à la forme négative dans le blanc après la flèche
7. Sujets variés : il, elle, nous, tu, ils, prénom
8. Phrases courtes, vocabulaire CE1/CE2
JSON uniquement :
{"title":"Négation avec ${negType}","emoji":"✏️","duration":"${dur} min","instructions":"Réécris chaque phrase à la forme négative avec ${negMot}.","example":"${negEx}","lignes":["1. Il joue au ballon. → _______________","2. Elle mange une pomme. → _______________","3. Nous courons dans le jardin. → _______________","4. Tu lis un livre. → _______________","5. Elles chantent une chanson. → _______________"],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(negPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'fleche', ...obj});
          } catch(e) { console.error("Erreur négation",st,e); }
          continue;
        }

        // ─── ACCORD SUJET-VERBE : prompt dédié ───────────────────────────────
        if (isAccordSV) {
          const accordPrompt = `Tu es instituteur CE1/CE2. Génère un exercice d accord sujet-verbe niveau ${niv}.
RÈGLES ABSOLUES :
1. title = "Accord sujet-verbe"
2. instructions = "Entoure le sujet et complète la terminaison du verbe."
3. example = "Les enfants chant___ → Les enfants chantent (ILS → -ent)"
4. lignes = 5 phrases numérotées. Chaque phrase contient un verbe avec une terminaison MANQUANTE notée ___ et se termine par " → _______________"
5. Format : "N. Le/La/Les [sujet] [verbe tronqué]___ [complément]. → _______________"
6. Verbes du 1er groupe uniquement, sujets variés (je/tu/il/elle/nous/vous/ils/elles)
7. JAMAIS écrire la réponse après "→" dans lignes
JSON uniquement :
{"title":"Accord sujet-verbe","emoji":"✏️","duration":"${dur} min","instructions":"Entoure le sujet et complète la terminaison du verbe.","example":"Les enfants chant___ → Les enfants chantent (ILS → -ent)","lignes":["1. Le chien aboi___ fort. → _______________","2. Les oiseaux vol___ dans le ciel. → _______________","3. Tu chant___ très bien. → _______________","4. Nous march___ dans la forêt. → _______________","5. Elle dans___ sur scène. → _______________"],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(accordPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'fleche', ...obj});
          } catch(e) { console.error("Erreur accord_sujet_verbe",st,e); }
          continue;
        }

        // ─── ACCORD SUJET-VERBE ÉLOIGNÉ : prompt dédié ───────────────────────
        if (isAccordSVEloigne) {
          const accordEloignePrompt = `Tu es instituteur CE2. Génère un exercice d accord sujet-verbe éloigné niveau ${niv}.
RÈGLES ABSOLUES :
1. title = "Accord sujet-verbe éloigné"
2. instructions = "Souligne le sujet et complète la terminaison du verbe. Attention : le sujet est loin du verbe !"
3. example = "Les enfants de la classe chant___ → chantent (sujet = les enfants → ILS)"
4. lignes = 5 phrases numérotées. Le sujet est séparé du verbe par un groupe nominal. Terminaison MANQUANTE notée ___
5. Format : "N. Les [nom] de/du [complément] [verbe tronqué]___ [suite]. → _______________"
6. Verbes simples du 1er groupe, sujets au pluriel ou singulier variés
7. JAMAIS écrire la réponse après "→" dans lignes
JSON uniquement :
{"title":"Accord sujet-verbe éloigné","emoji":"✏️","duration":"${dur} min","instructions":"Souligne le sujet et complète la terminaison du verbe. Attention : le sujet est loin du verbe !","example":"Les enfants de la classe chant___ → chantent (sujet = les enfants → ILS)","lignes":["1. Les chiens du voisin aboi___ fort. → _______________","2. Les élèves de CE2 travaill___ bien. → _______________","3. Le livre de contes est___ très beau. → _______________","4. Les enfants du quartier jou___ dehors. → _______________","5. La boîte de crayons est___ sur la table. → _______________"],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(accordEloignePrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'fleche', ...obj});
          } catch(e) { console.error("Erreur accord_sujet_verbe_eloigne",st,e); }
          continue;
        }

        // ─── NATURE DES MOTS : prompt dédié ──────────────────────────────────
        if (isNatureMots) {
          const naturePrompt = `Tu es instituteur CE1/CE2. Génère un exercice sur la nature des mots niveau ${niv}.
RÈGLES ABSOLUES :
1. title = "Nature des mots"
2. instructions = "Indique la nature du mot EN MAJUSCULES dans chaque phrase. Natures possibles : nom commun, verbe, adjectif qualificatif, adverbe, déterminant, pronom."
3. example = "Le petit CHAT dort. → nom commun"
4. lignes = 6 phrases numérotées. Chaque phrase contient UN seul mot en MAJUSCULES et se termine par " → _______________"
5. Varier les natures : au moins 1 nom, 1 verbe, 1 adjectif, 1 adverbe, 1 déterminant
6. JAMAIS écrire la réponse après "→" dans lignes
JSON uniquement :
{"title":"Nature des mots","emoji":"📚","duration":"${dur} min","instructions":"Indique la nature du mot EN MAJUSCULES dans chaque phrase. Natures possibles : nom commun, verbe, adjectif qualificatif, adverbe, déterminant, pronom.","example":"Le petit CHAT dort. → nom commun","lignes":["1. Le CHIEN court vite. → _______________","2. Elle MANGE une pomme. → _______________","3. Un GRAND arbre pousse. → _______________","4. LES enfants jouent. → _______________","5. Elle est contente. → _______________","6. Il court VITE. → _______________"],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(naturePrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'trous', ...obj});
          } catch(e) { console.error("Erreur nature_des_mots",st,e); }
          continue;
        }

        // ─── CLASSER DES MOTS : prompt dédié ─────────────────────────────────
        if (isClassesMots) {
          const motsInterdits = usedWordsSession.size ? `MOTS INTERDITS (déjà utilisés récemment) : ${[...usedWordsSession].join(", ")}. N utilise AUCUN de ces mots.` : "";
          const classesPrompt = `Tu es instituteur CE1/CE2. Génère un exercice de classement de mots niveau ${niv}.
RÈGLES ABSOLUES :
1. title = "Classer des mots"
2. instructions = "Trie ces mots dans le bon tableau selon leur classe grammaticale."
3. example = "chat → NOM | court → VERBE | petit → ADJECTIF | le → DÉTERMINANT"
4. lignes[0] = exactement 12 mots séparés par " - " : 3 noms, 3 verbes, 3 adjectifs, 3 déterminants MÉLANGÉS
   - Les déterminants DOIVENT être parmi : le, la, les, un, une, des, mon, ma, mes, son, sa, ses, ce, cette, ces
   - Les verbes doivent être à l infinitif ou au présent, simples CE1
   - Les noms et adjectifs doivent être des mots du quotidien CE1
5. lignes[1] = "NOMS : _______________"
6. lignes[2] = "VERBES : _______________"
7. lignes[3] = "ADJECTIFS : _______________"
8. lignes[4] = "DÉTERMINANTS : _______________"
9. wordsUsed = la liste des 12 mots utilisés dans lignes[0]
${motsInterdits}
IMPORTANT : génère des mots ENTIÈREMENT DIFFÉRENTS à chaque fois. Ne jamais utiliser maison, soleil, forêt, joue, chante, grand, beau, vieux comme première liste.
JSON uniquement :
{"title":"Classer des mots","emoji":"📚","duration":"${dur} min","instructions":"Trie ces mots dans le bon tableau selon leur classe grammaticale.","example":"chat → NOM | court → VERBE | petit → ADJECTIF | le → DÉTERMINANT","lignes":["[12 MOTS VARIÉS ICI]","NOMS : _______________","VERBES : _______________","ADJECTIFS : _______________","DÉTERMINANTS : _______________"],"parentNote":"","verbsUsed":[],"wordsUsed":["les 12 mots en minuscules"]}`;
          try {
            const raw = await callAPI(classesPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) {
              exercises.push({type:st, format:'trous', ...obj});
              (obj.wordsUsed||[]).forEach(w => usedWordsSession.add(w.toLowerCase()));
            }
          } catch(e) { console.error("Erreur classes_de_mots",st,e); }
          continue;
        }

        // ─── FONCTIONS SUJET VERBE COD : prompt dédié ────────────────────────
        if (isFonctionsSVC) {
          const fonctionsPrompt = `Tu es instituteur CE2/CM1. Génère un exercice d identification sujet, verbe et COD niveau ${niv}.
RÈGLES ABSOLUES :
1. title = "Identifie le sujet, le verbe et le COD"
2. instructions = "Lis chaque phrase et identifie le sujet, le verbe et le complément d objet direct (COD). Écris tes réponses dans les espaces vides."
3. example = "Le garçon mange un sandwich. Sujet : Le garçon (qui est-ce qui mange ?) Verbe : mange COD : un sandwich"
4. lignes = 3 phrases numérotées. Format EXACT : "N. [phrase]. Sujet : _______________ Verbe : _______________ COD : _______________"
5. Phrases simples, sujet + verbe transitif + COD clair, niveau CE2
6. JAMAIS écrire les réponses dans lignes
JSON uniquement :
{"title":"Identifie le sujet, le verbe et le COD","emoji":"📚","duration":"${dur} min","instructions":"Lis chaque phrase et identifie le sujet, le verbe et le complément d objet direct (COD). Écris tes réponses dans les espaces vides.","example":"Le garçon mange un sandwich. Sujet : Le garçon (qui est-ce qui mange ?) Verbe : mange COD : un sandwich","lignes":["1. La fille dessine un portrait. Sujet : _______________ Verbe : _______________ COD : _______________","2. Les amis jouent à cache-cache. Sujet : _______________ Verbe : _______________ COD : _______________","3. Le professeur écrit sur le tableau. Sujet : _______________ Verbe : _______________ COD : _______________"],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(fonctionsPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'trous', ...obj});
          } catch(e) { console.error("Erreur fonctions_sujet_verbe_cod",st,e); }
          continue;
        }

        // ─── IDENTIFIER SUJET VERBE : prompt dédié ───────────────────────────
        if (isIdentSujetVerbe) {
          const identSVPrompt = `Tu es instituteur CE1/CE2. Génère un exercice d identification du sujet et du verbe niveau ${niv}.
RÈGLES ABSOLUES :
1. title = "Identifie le sujet et le verbe"
2. instructions = "Souligne le sujet et encadre le verbe dans chaque phrase."
3. example = "Les enfants jouent dans le jardin. → sujet : Les enfants | verbe : jouent"
4. lignes = 5 phrases simples numérotées, sans espace de réponse (l enfant souligne directement)
5. Dernière ligne = une consigne d invention : "Invente une phrase avec : [mot1] / [verbe] → _______________"
6. Phrases courtes, vocabulaire CE1, sujets variés
JSON uniquement :
{"title":"Identifie le sujet et le verbe","emoji":"📚","duration":"${dur} min","instructions":"Souligne le sujet et encadre le verbe dans chaque phrase.","example":"Les enfants jouent dans le jardin. → sujet : Les enfants | verbe : jouent","lignes":["1. Le chien court dans le jardin.","2. Ma mère prépare le dîner.","3. Les oiseaux chantent dans les arbres.","4. Mon ami dessine un dragon.","5. La maîtresse explique la leçon.","Invente une phrase avec : le chat / dormir → _______________________________________________"],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(identSVPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'libre', ...obj});
          } catch(e) { console.error("Erreur identifier_sujet_verbe",st,e); }
          continue;
        }

        // ─── PHRASE SYNTAXE (remise en ordre des mots) : prompt dédié ────────
        if (isPhraseSyntaxe) {
          const phraseSyntaxePrompt = `Tu es instituteur CE1/CE2. Génère un exercice de remise en ordre des MOTS pour former une phrase niveau ${niv}.
MÉTHODE OBLIGATOIRE en 2 étapes pour chaque item :
  ÉTAPE 1 — Construis une phrase française correcte et logique de 4 à 6 mots (sujet + verbe + complément simple)
  ÉTAPE 2 — Mélange les mots de cette phrase dans le désordre, séparés par " - "
RÈGLES ABSOLUES :
1. title = "Remets les mots dans l ordre"
2. instructions = "Remets les mots dans le bon ordre pour former une phrase correcte."
3. example = "mange - le - chat - un - poisson → Le chat mange un poisson." (phrase valide : Le chat mange un poisson)
4. lignes = 5 items. Format : "N. [mots en désordre] → _______________"
5. VÉRIFICATIONS OBLIGATOIRES pour chaque item :
   - Pas de doublon de déterminant (pas deux fois LE ou LA)
   - Le verbe s accorde avec le sujet
   - Les mots forment UNE SEULE phrase française naturelle
6. Vocabulaire CE1/CE2, phrases NOUVELLES et VARIÉES — jamais les mêmes que le modèle corpus
JSON uniquement (NE PAS copier les phrases de l exemple — génère 5 phrases NOUVELLES) :
{"title":"Remets les mots dans l ordre","emoji":"✏️","duration":"${dur} min","instructions":"Remets les mots dans le bon ordre pour former une phrase correcte.","example":"mange - le - chat - un - poisson → Le chat mange un poisson.","lignes":["1. [GÉNÈRE ICI] → _______________","2. [GÉNÈRE ICI] → _______________","3. [GÉNÈRE ICI] → _______________","4. [GÉNÈRE ICI] → _______________","5. [GÉNÈRE ICI] → _______________"],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(phraseSyntaxePrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'fleche', ...obj});
          } catch(e) { console.error("Erreur phrase_syntaxe",st,e); }
          continue;
        }

        // ─── PONCTUATION : prompt dédié ───────────────────────────────────────
        if (isPonctuation) {
          const ponctuationPrompt = `Tu es instituteur CE1/CE2. Génère un exercice de ponctuation niveau ${niv}.
RÈGLES ABSOLUES :
1. title = "Ajoute la ponctuation"
2. instructions = "Ajoute le signe de ponctuation manquant. Signes possibles : . ? ! ,"
3. example = "Il fait beau aujourd hui ___ → Il fait beau aujourd hui."
4. lignes = 5 phrases numérotées. UN seul ___ par phrase pour UN seul signe de ponctuation
5. Distribution OBLIGATOIRE : 2 phrases avec point final (.), 1 avec point d interrogation (?), 1 avec point d exclamation (!), 1 avec virgule (,)
6. Pour le point et ! et ? : le ___ est EN FIN de phrase
7. Pour la virgule : la phrase = deux courtes propositions séparées par ___ au milieu. Exemple : "Il pleut ___ je prends mon parapluie."
8. Phrases courtes, vocabulaire CE1/CE2, DIFFÉRENTES du modèle
9. JAMAIS écrire la réponse dans lignes
JSON uniquement :
{"title":"Ajoute la ponctuation","emoji":"✏️","duration":"${dur} min","instructions":"Ajoute le signe de ponctuation manquant. Signes possibles : . ? ! ,","example":"Il fait beau aujourd hui ___ → Il fait beau aujourd hui.","lignes":["1. Où vas-tu ___","2. Comme c est beau ___","3. Elle mange une pomme ___ une poire et une banane.","4. Viens ici ___","5. Il pleut ___ je prends mon parapluie."],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(ponctuationPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'trous', ...obj});
          } catch(e) { console.error("Erreur ponctuation",st,e); }
          continue;
        }

        // ─── REMISE EN ORDRE DES PHRASES : prompt dédié ──────────────────────
        if (isRemiseOrdre) {
          const remiseOrdrePrompt = `Tu es instituteur CE1/CE2. Génère un exercice de remise en ordre de phrases pour reconstituer une histoire niveau ${niv}.
RÈGLES ABSOLUES :
1. title = "Remets les phrases dans l ordre"
2. instructions = "Remets les phrases dans le bon ordre pour raconter l histoire. Écris un numéro devant chaque phrase (de 1 à 5)."
3. example = "" (vide)
4. lignes = 5 phrases dans le MAUVAIS ordre. Chaque phrase commence par "___ " (espace pour écrire le numéro)
5. L histoire doit avoir un début, un milieu et une fin logiques — 5 phrases qui racontent une mini-histoire cohérente
6. Vocabulaire CE1/CE2, phrases courtes
7. JAMAIS numéroter les phrases dans lignes — l enfant met les numéros lui-même
JSON uniquement :
{"title":"Remets les phrases dans l ordre","emoji":"📖","duration":"${dur} min","instructions":"Remets les phrases dans le bon ordre pour raconter l histoire. Écris un numéro devant chaque phrase (de 1 à 5).","example":"","lignes":["___ Il mange son goûter avec plaisir.","___ Léo rentre de l école.","___ Sa maman lui prépare du pain et du chocolat.","___ Il pose son sac et enlève ses chaussures.","___ Il dit bonjour à sa maman."],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(remiseOrdrePrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'libre', ...obj});
          } catch(e) { console.error("Erreur remise_en_ordre",st,e); }
          continue;
        }

        // ─── LIAISON DE PHRASES : prompt dédié ───────────────────────────────
        if (isLiaison) {
          const liaisonPrompt = `Tu es instituteur CE2. Génère un exercice de liaison de phrases niveau ${niv}.
RÈGLES ABSOLUES :
1. title = "Relier des phrases avec un mot de liaison"
2. instructions = "Relie les deux phrases avec le mot de liaison indiqué entre parenthèses."
3. example = "Le soleil brille. Je porte des lunettes de soleil. (donc) → Le soleil brille donc je porte des lunettes de soleil."
4. lignes = 4 items. Format EXACT : "[Phrase 1]. [Phrase 2]. (mot) → _______________"
5. RÈGLE CRITIQUE : le mot de liaison entre parenthèses DOIT être logiquement cohérent avec les deux phrases.
   Définitions STRICTES à respecter :
   - (donc) ou (alors) = la phrase 2 est une CONSÉQUENCE DIRECTE de la phrase 1
   - (mais) = la phrase 2 CONTREDIT ou S OPPOSE à ce qu on attendrait après la phrase 1
   - (parce que) = la phrase 2 EXPLIQUE LA RAISON de la phrase 1
   - (et) = la phrase 2 S AJOUTE simplement à la phrase 1 sans opposition ni conséquence logique
6. Utilise 4 mots de liaison DIFFÉRENTS parmi : donc, alors, mais, parce que
7. Phrases courtes, vocabulaire CE1/CE2, NOUVELLES à chaque génération
JSON uniquement :
{"title":"Relier des phrases avec un mot de liaison","emoji":"✏️","duration":"${dur} min","instructions":"Relie les deux phrases avec le mot de liaison indiqué entre parenthèses.","example":"Le soleil brille. Je porte des lunettes de soleil. (donc) → Le soleil brille donc je porte des lunettes de soleil.","lignes":["[GÉNÈRE ICI] → _______________","[GÉNÈRE ICI] → _______________","[GÉNÈRE ICI] → _______________","[GÉNÈRE ICI] → _______________"],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(liaisonPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'fleche', ...obj});
          } catch(e) { console.error("Erreur liaison_phrases",st,e); }
          continue;
        }

        // ═══════════════════════════════════════════════════════════════════════
        // ─── DICTÉES : prompts dédiés ─────────────────────────────────────────
        // ═══════════════════════════════════════════════════════════════════════

        if (isDictee) {
          const isDicteeSons  = st === "dictee_sons_simples";
          const isDicteeHomo  = st === "dictee_homophones";
          const isDicteeAvanc = st === "dictee_avancee";

          const themesSons  = ["la nature","les animaux","la maison","les saisons","l école"];
          const themesHomo  = ["la journée d école","la famille","le marché","le matin","les vacances"];
          const themesAvanc = ["une aventure","un voyage","le sport","la fête","une découverte"];
          const pick = arr => arr[Math.floor(Math.random()*arr.length)];

          const theme = isDicteeSons ? pick(themesSons) : isDicteeHomo ? pick(themesHomo) : pick(themesAvanc);

          const contrainte = isDicteeSons
            ? "Phrases simples CE1 (5-8 mots). Sons travaillés : ou, on, an, en, in, eau, au. Vocabulaire du quotidien."
            : isDicteeHomo
            ? "Chaque phrase doit contenir AU MOINS UN homophone parmi : a/à, et/est, son/sont, ou/où, ces/ses, on/ont. Niveau CE1/CE2."
            : "Phrases complexes niveau CE2/CM1 (8-12 mots). Inclure : passé composé, accords, vocabulaire varié.";

          const dicteePrompt = `Tu es instituteur CE1/CE2. Génère une dictée niveau ${niv}.
RÈGLES ABSOLUES :
1. title = "Dictée — [thème]" (remplace [thème] par le thème choisi, avec une majuscule)
2. instructions = "Note pour le parent : lire chaque phrase lentement 2 fois."
3. example = "" (vide)
4. lignes = exactement 7 éléments dans cet ordre STRICT :
   - lignes[0] = "Thème : ${theme}"
   - lignes[1] = "---"
   - lignes[2] à lignes[6] = 5 phrases numérotées "N. [phrase]"
5. CONTRAINTE TYPE : ${contrainte}
6. Phrases ENTIÈREMENT NOUVELLES — jamais les mêmes que le modèle.
7. Phrases grammaticalement correctes, naturelles, niveau ${niv}.
8. JAMAIS de lignes vides ou de tirets supplémentaires dans lignes.
JSON uniquement :
{"title":"Dictée — ${theme}","emoji":"🎧","duration":"${dur} min","instructions":"Note pour le parent : lire chaque phrase lentement 2 fois.","example":"","lignes":["Thème : ${theme}","---","1. [PHRASE 1]","2. [PHRASE 2]","3. [PHRASE 3]","4. [PHRASE 4]","5. [PHRASE 5]"],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;

          try {
            const raw = await callAPI(dicteePrompt, "exercice");
            const clean = raw.replace(/\`\`\`json|\`\`\`/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'dictee', ...obj});
          } catch(e) { console.error("Erreur dictee",st,e); }
          continue;
        }

        // ═══════════════════════════════════════════════════════════════════════
        // ─── HOMOPHONES : prompts dédiés ──────────────────────────────────────
        // ═══════════════════════════════════════════════════════════════════════

        // ─── A / À ────────────────────────────────────────────────────────────
        if (isHomophoneAA) {
          const aaPrompt = `Tu es instituteur CE1/CE2. Génère un exercice sur A (verbe avoir) et À (préposition) niveau ${niv}.
RÈGLES ABSOLUES :
1. title = "Homophones A / À"
2. instructions = "Complète chaque phrase avec A ou À."
3. Astuce pédagogique à mettre dans example : "Astuce : remplace par AVAIT — si ça marche, c est A (verbe avoir). Sinon c est À (préposition)."
4. lignes = exactement 8 phrases numérotées. Chaque phrase a UN blanc ___ à compléter par A ou À.
5. Mélange équilibré : environ 4 phrases avec A, 4 avec À.
6. JAMAIS écrire la réponse dans lignes.
7. Phrases variées, courtes, vocabulaire CE1. Sujets variés (il, elle, on, le chat, ma sœur…)
8. JAMAIS deux fois le même contexte (ville/lieu répété, même verbe…)
JSON uniquement :
{"title":"Homophones A / À","emoji":"✏️","duration":"${dur} min","instructions":"Complète chaque phrase avec A ou À.","example":"Astuce : remplace par AVAIT — si ça marche, c est A (verbe avoir). Sinon c est À (préposition).","lignes":["1. Le chat ___ faim. →","2. Elle va ___ l école. →","3. Il ___ trouvé son stylo. →","4. Nous allons ___ la piscine. →","5. Mon frère ___ neuf ans. →","6. Elle pense ___ ses amis. →","7. Le chien ___ soif. →","8. Il marche ___ pied. →"],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(aaPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'trous', ...obj});
          } catch(e) { console.error("Erreur homophones_a_a",st,e); }
          continue;
        }

        // ─── ET / EST ─────────────────────────────────────────────────────────
        if (isHomophoneEtEst) {
          const etEstPrompt = `Tu es instituteur CE1/CE2. Génère un exercice sur ET (conjonction) et EST (verbe être) niveau ${niv}.
RÈGLES ABSOLUES :
1. title = "Homophones ET / EST"
2. instructions = "Complète chaque phrase avec ET ou EST."
3. example = "Astuce : remplace par ÉTAIT — si ça marche, c est EST (verbe être). Sinon c est ET (conjonction)."
4. lignes = exactement 8 phrases numérotées. Chaque phrase a UN ou DEUX blancs ___ à compléter.
5. Mélange : environ 4 phrases avec EST, 4 avec ET (dont 2 phrases avec deux blancs ET...ET).
6. JAMAIS écrire la réponse dans lignes.
7. Phrases courtes, vocabulaire CE1, sujets variés.
JSON uniquement :
{"title":"Homophones ET / EST","emoji":"✏️","duration":"${dur} min","instructions":"Complète chaque phrase avec ET ou EST.","example":"Astuce : remplace par ÉTAIT — si ça marche, c est EST (verbe être). Sinon c est ET (conjonction).","lignes":["1. La classe ___ silencieuse.","2. Le chat ___ le chien jouent ensemble.","3. Le ciel ___ bleu.","4. Elle ___ gentille ___ courageuse.","5. Mon sac ___ lourd.","6. Il mange une pomme ___ une banane.","7. La maison ___ grande.","8. Le soleil ___ chaud aujourd hui."],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(etEstPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'trous', ...obj});
          } catch(e) { console.error("Erreur homophones_et_est",st,e); }
          continue;
        }

        // ─── SON / SONT ───────────────────────────────────────────────────────
        if (isHomophoneSonSont) {
          const sonSontPrompt = `Tu es instituteur CE1/CE2. Génère un exercice sur SON (déterminant possessif) et SONT (verbe être au pluriel) niveau ${niv}.
RÈGLES ABSOLUES :
1. title = "Homophones SON / SONT"
2. instructions = "Complète chaque phrase avec SON ou SONT."
3. example = "Astuce : remplace par ILS SONT — si ça marche, c est SONT (verbe être). Sinon c est SON (possessif)."
4. lignes = exactement 8 phrases numérotées. Chaque phrase a UN blanc ___ à compléter.
5. Mélange équilibré : environ 4 phrases avec SON, 4 avec SONT.
6. Pour SON : ___ précède un nom (son livre, son ami, son chien…)
7. Pour SONT : sujet PLURIEL + SONT + attribut ou participe
8. JAMAIS écrire la réponse dans lignes.
JSON uniquement :
{"title":"Homophones SON / SONT","emoji":"✏️","duration":"${dur} min","instructions":"Complète chaque phrase avec SON ou SONT.","example":"Astuce : remplace par ILS SONT — si ça marche, c est SONT (verbe être). Sinon c est SON (possessif).","lignes":["1. Les fleurs ___ belles.","2. Il garde ___ livre.","3. Les enfants ___ contents.","4. Elle aime ___ chien.","5. Mes amis ___ partis.","6. Il met ___ casque.","7. Les légumes ___ frais.","8. Elle adore ___ chat."],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(sonSontPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'trous', ...obj});
          } catch(e) { console.error("Erreur homophones_son_sont",st,e); }
          continue;
        }

        // ─── OU / OÙ ──────────────────────────────────────────────────────────
        if (isHomophoneOuOu) {
          const ouOuPrompt = `Tu es instituteur CE1/CE2. Génère un exercice sur OU (choix/alternative) et OÙ (lieu/moment) niveau ${niv}.
RÈGLES ABSOLUES :
1. title = "Homophones OU / OÙ"
2. instructions = "Complète chaque phrase avec OU ou OÙ."
3. example = "Astuce : remplace par OU BIEN — si ça marche, c est OU (choix). Sinon c est OÙ (lieu ou moment)."
4. lignes = exactement 8 phrases numérotées. Chaque phrase a UN blanc ___ à compléter.
5. Mélange équilibré : 4 phrases avec OU (choix), 4 phrases avec OÙ (lieu/moment).
6. CONSTRUCTIONS AUTORISÉES :
   - OU (choix) UNIQUEMENT sous ces formes :
     * Question directe : "Tu préfères X ___ Y ?" ou "Il choisit X ___ Y ?"
     * "Tu veux X ___ Y ?" / "Elle prend X ___ Y ?"
   - OÙ (lieu/moment) UNIQUEMENT sous ces formes :
     * Question directe : "___ habites-tu ?" / "___ est ton sac ?"
     * Subordonnée simple : "Je ne sais pas ___ il est." / "C est là ___ je joue."
7. CONSTRUCTIONS INTERDITES :
   - JAMAIS "C est ___ que..." (relative ambiguë)
   - JAMAIS "Il va à X ___ à Y ?" (trop complexe)
   - JAMAIS une phrase qui commence par un sujet + verbe + ___ sans que le choix soit évident
   - JAMAIS deux propositions sans que le sens de OU soit immédiatement clair
8. Chaque phrase OU (choix) DOIT se terminer par "?"
9. JAMAIS écrire la réponse dans lignes.
JSON uniquement :
{"title":"Homophones OU / OÙ","emoji":"✏️","duration":"${dur} min","instructions":"Complète chaque phrase avec OU ou OÙ.","example":"Astuce : remplace par OU BIEN — si ça marche, c est OU (choix). Sinon c est OÙ (lieu ou moment).","lignes":["1. ___ ranges-tu tes affaires ?","2. Tu préfères le chocolat ___ la vanille ?","3. Je ne sais pas ___ il habite.","4. Elle choisit le vélo ___ la trottinette ?","5. ___ est passé mon cartable ?","6. Tu veux du pain ___ des céréales ?","7. C est là ___ je joue avec mes amis.","8. Il préfère le foot ___ le basket ?"],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(ouOuPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'trous', ...obj});
          } catch(e) { console.error("Erreur homophones_ou_où",st,e); }
          continue;
        }

        // ─── CES / SES ────────────────────────────────────────────────────────
        if (isHomophoneCesSes) {
          const cesSesPrompt = `Tu es instituteur CE1/CE2. Génère un exercice sur CES (démonstratif pluriel) et SES (possessif pluriel) niveau ${niv}.
RÈGLES ABSOLUES :
1. title = "Homophones CES / SES"
2. instructions = "Complète chaque phrase avec CES ou SES."
3. example = "Rappel : CES = démonstratif (ces chats → ces chats-là) | SES = possessif (ses chats → les chats de quelqu un)"
4. lignes = exactement 8 phrases numérotées. Chaque phrase a UN seul blanc ___ à compléter.
5. Mélange équilibré : 4 phrases avec CES, 4 phrases avec SES.
6. Format STRICT : "[Numéro]. [Début de phrase] ___ [nom pluriel] [fin de phrase]."
   JAMAIS de flèche après la phrase. JAMAIS de deuxième blanc. L enfant écrit juste CES ou SES dans le blank.
7. Pour CES : sujet neutre ou "ces [noms]" sans possesseur explicite. Exemple : "Ces fleurs sont jolies."
8. Pour SES : un possesseur est clairement mentionné dans la phrase. Exemple : "Il range ses affaires."
9. JAMAIS écrire la réponse dans lignes.
JSON uniquement :
{"title":"Homophones CES / SES","emoji":"✏️","duration":"${dur} min","instructions":"Complète chaque phrase avec CES ou SES.","example":"Rappel : CES = démonstratif (ces chats → ces chats-là) | SES = possessif (ses chats → les chats de quelqu un)","lignes":["1. ___ oiseaux chantent dans les arbres.","2. Elle prend ___ crayons pour dessiner.","3. ___ maisons sont très grandes.","4. Il met ___ gants avant de sortir.","5. Regarde ___ belles étoiles !","6. Ma sœur range ___ jouets.","7. ___ enfants jouent dans le jardin.","8. Mon frère aime ___ amis."],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(cesSesPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'trous', ...obj});
          } catch(e) { console.error("Erreur homophones_ces_ses",st,e); }
          continue;
        }

        // ─── ON / ONT ─────────────────────────────────────────────────────────
        if (isHomophoneOnOnt) {
          const onOntPrompt = `Tu es instituteur CE1/CE2. Génère un exercice sur ON (pronom sujet) et ONT (verbe avoir au pluriel) niveau ${niv}.
RÈGLES ABSOLUES :
1. title = "Homophones ON / ONT"
2. instructions = "Complète chaque phrase avec ON ou ONT."
3. example = "Rappel : ON est un pronom comme NOUS (on mange = nous mangeons) | ONT = verbe avoir accordé avec ILS/ELLES (ils ont)"
4. lignes = exactement 8 phrases numérotées. Chaque phrase a UN blanc ___ à compléter.
5. Mélange équilibré : 4 phrases avec ON (sujet singulier), 4 phrases avec ONT (sujet pluriel explicite comme "les enfants", "ils", "elles", "mes amis"…)
6. Pour ONT : le sujet pluriel DOIT être visible dans la phrase AVANT le blanc.
7. Pour ON : ON est seul sujet de la phrase, remplaçable par NOUS.
8. JAMAIS écrire la réponse dans lignes.
JSON uniquement :
{"title":"Homophones ON / ONT","emoji":"✏️","duration":"${dur} min","instructions":"Complète chaque phrase avec ON ou ONT.","example":"Rappel : ON est un pronom comme NOUS (on mange = nous mangeons) | ONT = verbe avoir accordé avec ILS/ELLES (ils ont)","lignes":["1. Les oiseaux ___ des ailes.","2. ___ joue au football après l école.","3. Les élèves ___ rendu leurs devoirs.","4. ___ mange des crêpes le jeudi.","5. Mes amis ___ un grand jardin.","6. ___ entend la musique de loin.","7. Les chiens ___ faim ce soir.","8. ___ part en vacances demain."],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(onOntPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'trous', ...obj});
          } catch(e) { console.error("Erreur homophones_on_ont",st,e); }
          continue;
        }

        // ─── MA / M'A ─────────────────────────────────────────────────────────
        if (isHomophoneMaMa) {
          const maMaPrompt = `Tu es instituteur CE1/CE2. Génère un exercice sur MA (déterminant possessif féminin) et M'A (pronom ME + verbe AVOIR au passé composé).
RÈGLES ABSOLUES :
1. title = "Homophones MA / M'A"
2. instructions = "Complète chaque phrase avec MA ou M'A. Astuce : remplace par MON — si ça marche, c est MA. Sinon c est M'A."
3. example = "" (vide)
4. lignes = exactement 8 phrases numérotées. CHAQUE phrase a UN SEUL blanc ___.
5. Mélange : 4 phrases avec MA, 4 phrases avec M'A — dans un ordre VARIÉ (pas toutes les MA d abord).
6. CONSTRUCTIONS VALIDES pour MA (déterminant devant un nom féminin) :
   - "___ mère est revenue." / "J aime ___ maison." / "C est ___ faute." / "___ sœur chante bien."
   - MA précède TOUJOURS un nom féminin singulier.
7. CONSTRUCTIONS VALIDES pour M'A (quelqu un m a fait quelque chose — passé composé) :
   - "Il ___ appelé hier." / "Elle ___ dit bonjour." / "Mon ami ___ aidé." / "La maîtresse ___ expliqué la leçon."
   - M'A est TOUJOURS entre un sujet et un participe passé.
8. VÉRIFICATION OBLIGATOIRE avant chaque ligne : teste mentalement la phrase avec MA et avec M'A — une seule doit fonctionner.
9. JAMAIS écrire MA ou M'A dans les lignes — uniquement des blancs ___.
10. Phrases courtes, naturelles, vocabulaire CE1.
JSON uniquement :
{"title":"Homophones MA / M'A","emoji":"✏️","duration":"${dur} min","instructions":"Complète chaque phrase avec MA ou M'A. Astuce : remplace par MON — si ça marche, c est MA. Sinon c est M'A.","example":"","lignes":["1. Il ___ appelé hier soir.","2. ___ sœur est très gentille.","3. Elle ___ donné un beau cadeau.","4. ___ maison est grande.","5. Mon ami ___ aidé à porter mon sac.","6. ___ mère prépare le dîner.","7. La maîtresse ___ expliqué la leçon.","8. ___ chambre est bien rangée."],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(maMaPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'trous', ...obj});
          } catch(e) { console.error("Erreur homophones_ma_ma",st,e); }
          continue;
        }

        // ─── ACCORD DE L'ADJECTIF ─────────────────────────────────────────────
        if (isAccordAdjectif) {
          const accordAdjPrompt = `Tu es instituteur CE1/CE2. Génère un exercice d accord de l adjectif niveau ${niv}.
RÈGLES ABSOLUES :
1. title = "Accord de l adjectif"
2. instructions = "Accorde l adjectif entre parenthèses avec le nom. Écris la forme correcte après la flèche."
3. example = "Une fille (grand) → grande | Des garçons (petit) → petits"
4. lignes = exactement 8 items. Format EXACT : "[groupe nominal avec adjectif entre parenthèses] → _______________"
5. OBLIGATION : les adjectifs DOIVENT nécessiter un vrai accord. Choisis des adjectifs qui changent de forme :
   - Au féminin : grand → grande, petit → petite, beau → belle, heureux → heureuse, doux → douce, vieux → vieille, gros → grosse, blanc → blanche
   - Au pluriel : grand → grands/grandes, petit → petits/petites, heureux → heureux (invariable au pluriel masculin)
   - JAMAIS choisir des adjectifs identiques au masculin et féminin comme "rapide", "calme", "sombre" — ils n entraînent aucun travail d accord
6. Distribuer obligatoirement : 2 items masculin singulier, 2 féminin singulier, 2 masculin pluriel, 2 féminin pluriel.
7. JAMAIS écrire la réponse après "→" dans lignes.
JSON uniquement :
{"title":"Accord de l adjectif","emoji":"✏️","duration":"${dur} min","instructions":"Accorde l adjectif entre parenthèses avec le nom. Écris la forme correcte après la flèche.","example":"Une fille (grand) → grande | Des garçons (petit) → petits","lignes":["1. Un garçon (heureux) → _______________","2. Une fille (heureux) → _______________","3. Des fleurs (beau) → _______________","4. Un vieux (gros) chien → _______________","5. Une maison (blanc) → _______________","6. Des livres (vieux) → _______________","7. Un gâteau (doux) → _______________","8. Des pommes (doux) → _______________"],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(accordAdjPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'fleche', ...obj});
          } catch(e) { console.error("Erreur accord_adjectif",st,e); }
          continue;
        }

        // ─── ACCORD DU PARTICIPE PASSÉ ────────────────────────────────────────
        if (isAccordPP) {
          const accordPPPrompt = `Tu es instituteur CE2/CM1. Génère un exercice d accord du participe passé niveau ${niv}.
RÈGLES ABSOLUES :
1. title = "Accord du participe passé"
2. instructions = "Complète le participe passé en l accordant correctement avec le sujet (auxiliaire ÊTRE) ou le COD (auxiliaire AVOIR)."
3. example = "Elle est parti___ → partie (auxiliaire ÊTRE : accord avec le sujet féminin) | Il a pris la pomme et il l a mang___ → mangée (auxiliaire AVOIR : accord avec le COD féminin placé avant)"
4. lignes = exactement 6 phrases numérotées. Chaque phrase contient un participe passé TRONQUÉ (terminaison manquante) notée ___ à la fin du radical.
5. Format EXACT : "N. [sujet] [auxiliaire] [radical_participe]___ [complément]."
   JAMAIS de flèche → dans les lignes. L enfant complète directement la terminaison sur le tiret.
6. Distribuer : 3 phrases avec auxiliaire ÊTRE (accord avec le sujet), 3 avec auxiliaire AVOIR (accord avec le COD antéposé via pronom ou relatif)
7. Utiliser des verbes simples CE2 : partir, arriver, tomber, manger, prendre, finir, lire, écrire
8. JAMAIS écrire la réponse après "→" dans lignes.
JSON uniquement :
{"title":"Accord du participe passé","emoji":"✏️","duration":"${dur} min","instructions":"Complète le participe passé en l accordant correctement avec le sujet (auxiliaire ÊTRE) ou le COD (auxiliaire AVOIR).","example":"Elle est parti___ → partie (ÊTRE : accord sujet féminin)","lignes":["1. Elle est arriv___ en retard.","2. Les enfants sont parti___ en voyage.","3. Ma sœur est tomb___ dans l escalier.","4. La lettre que j ai écri___ est longue.","5. Les fleurs qu il a cueilli___ sont belles.","6. La tarte que nous avons mang___ était délicieuse."],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(accordPPPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'trous', ...obj});
          } catch(e) { console.error("Erreur accord_participe_passe",st,e); }
          continue;
        }

        // ─── MOTS INVARIABLES ─────────────────────────────────────────────────
        if (isMotsInvariables) {
          const motsInvPrompt = `Tu es instituteur CE1/CE2. Génère un exercice de reconnaissance des mots invariables.
RÈGLES ABSOLUES :
1. title = "Reconnaître les mots invariables"
2. instructions = "Entoure le ou les mots invariables dans chaque phrase."
3. example = "Rappel : toujours, souvent, jamais, très, bien, vite, hier, demain, avec, sans, pour, dans, sur, sous, mais, car sont des mots invariables."
4. lignes = exactement 6 phrases. MÉTHODE OBLIGATOIRE pour chaque phrase :
   ÉTAPE 1 — Choisis 1 ou 2 mots invariables dans cette liste SEULEMENT : toujours, souvent, jamais, très, bien, vite, hier, demain, avec, sans, pour, dans, sur, sous, mais, car, bientôt, encore, dehors, ensemble
   ÉTAPE 2 — Construis une phrase naturelle CE1 qui utilise CE(S) mot(s) invariable(s)
   ÉTAPE 3 — Vérifie que la phrase a du sens et contient bien le(s) mot(s) choisi(s)
5. Phrases longues : minimum 8 mots chacune. Situations du quotidien : école, maison, famille, sport, animaux.
6. JAMAIS de blancs ___ — phrases complètes à lire et annoter.
7. JAMAIS utiliser "récréation" seul ni "journée de récréation" — trop vague.
8. Varier les mots invariables sur les 6 phrases — pas deux fois le même.
JSON uniquement :
{"title":"Reconnaître les mots invariables","emoji":"📚","duration":"${dur} min","instructions":"Entoure le ou les mots invariables dans chaque phrase.","example":"Rappel : toujours, souvent, jamais, très, bien, vite, hier, demain, avec, sans, pour, dans, sur, sous, mais, car sont des mots invariables.","lignes":["1. Le chat dort toujours sur le canapé du salon.","2. Nous jouons souvent au football avec nos amis le mercredi.","3. Elle ne veut jamais manger de carottes sans sauce.","4. Hier, il a plu très fort pendant toute la matinée.","5. Mon frère range ses affaires dans son armoire, mais il oublie ses chaussures.","6. Nous allons bientôt partir en vacances avec toute la famille."],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(motsInvPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'libre', ...obj});
          } catch(e) { console.error("Erreur mots_invariables",st,e); }
          continue;
        }

        // ═══════════════════════════════════════════════════════════════════════
        // ─── PROMPT GÉNÉRIQUE ────────────────────────────────────────────────
        // ═══════════════════════════════════════════════════════════════════════

        if (isTablesType) {
          regles.push(`TYPE : MULTIPLICATION — Tables mélangées de 1 à 10.
- Exactement 20 items dans lignes (4 colonnes × 5)
- Format lignes : ["4 × 6 =","7 × 8 =","3 × 9 =", ...]
- Sans tirets dans lignes
- Mélange varié de toutes les tables de 1 à 10
- example = "" (vide)`);
        } else if (isCalcType) {
          const isDiv  = st.includes("division");
          const isAdd  = st.includes("addition");
          const isSous = st.includes("soustraction");
          const calcType    = isSous?"SOUSTRACTION (− uniquement)":isAdd?"ADDITION (+ uniquement)":isDiv?"DIVISION (÷ uniquement)":"MULTIPLICATION (× uniquement)";
          const calcNbItems = "6 items (3 colonnes × 2)";
          const calcGrands  = (isAdd||isSous)?" — nombres à 5 chiffres obligatoires (ex: 64 382 − 27 519 =)":"";
          const calcEx      = isSous?'["64 382 − 27 519 =","85 074 − 36 248 =","92 615 − 48 307 =","71 830 − 29 564 =","53 947 − 18 623 =","80 401 − 35 788 ="]':isAdd?'["34 456 + 28 237 =","52 583 + 31 249 =","71 712 + 18 189 =","63 634 + 27 278 =","48 521 + 35 463 =","57 308 + 24 195 ="]':isDiv?'["24 ÷ 4 =","36 ÷ 6 =","45 ÷ 9 ="]':'["4 × 6 =","7 × 8 =","3 × 9 ="]';
          const calcExemple = isSous?"64 382 − 27 519 = 36 863 (on pose et on soustrait colonne par colonne)":isAdd?"34 456 + 28 237 = 62 693 (on pose et on additionne colonne par colonne)":isDiv?"48 ÷ 6 = 8 (car 6 × 8 = 48)":"4 × 6 = 24 (car 6 × 4 = 24)";
          regles.push(`TYPE : ${calcType} — UNIQUEMENT ce type, jamais mélanger.
- Exactement ${calcNbItems}${calcGrands}
- Format lignes : ${calcEx}
- Sans tirets dans lignes
- example = "${calcExemple}" — UNE SEULE ligne claire`);
        }

        if (isEncadr) regles.push(`TYPE : NUMÉRATION. Minimum 6 items dans lignes. Utilise des nombres DIFFÉRENTS du modèle.`);

        if (isMonnaie) {
          regles.push(`TYPE : MESURES MONNAIE.
RÈGLES ABSOLUES :
1. example = "" (vide absolument)
2. lignes = 6 items : 3 calculs simples (additions de pieces/billets) + 3 problemes courts avec ___
3. Format calculs : "2€ + 1€ + 50c = ___"
4. Format problemes : phrase courte avec ___ a la fin
5. Tout doit tenir en une ligne courte — pas de phrases longues
6. Utilise des montants realistes CE1/CE2 (max 10€)`);
        }

        const isLecture = st.includes("comprehension");
        if (isLecture) {
          regles.push(`TYPE : COMPRÉHENSION DE TEXTE.
RÈGLES ABSOLUES :
1. lignes = UN SEUL bloc texte suivi de 4 questions numérotées
2. lignes[0] = texte narratif complet EN UNE SEULE CHAÎNE (phrases séparées par des espaces, pas de retours à la ligne) — 6 à 8 phrases simples, niveau CE1/CE2
3. lignes[1] = "" (ligne vide séparatrice)
4. lignes[2] à lignes[5] = les 4 questions : "1. Qui sont les personnages ?", "2. Où se passe l histoire ?", "3. Que se passe-t-il ?", "4. Comment se termine l histoire ?"
5. example = "" (vide)
6. instructions = "Lis attentivement le texte puis réponds aux questions par des phrases complètes."`);
        }

        if (isProbl) {
          regles.push(`TYPE : PROBLÈME.
RÈGLES ABSOLUES :
- L énoncé contient de VRAIS CHIFFRES — jamais de ___ dans l énoncé
- Seules les lignes "Calcul :" et "Réponse :" se terminent par _______________
- example = solution complète avec calculs détaillés ET réponse rédigée (chiffres différents du problème)
- lignes = [énoncé complet avec vrais chiffres, "Calcul : _______________", "Réponse : _______________"]
- Utilise le même format que le corpus (Calcul puis Réponse)`);
        }

        if (isDictee) {
          regles.push(`TYPE : DICTÉE.
- lignes[0] = "MOTS À PRÉPARER : mot1 | mot2 | mot3 | mot4 | mot5" — choisis 5 mots NOUVEAUX du même niveau orthographique que le modèle
- lignes[1..n] = 4 à 6 phrases NOUVELLES utilisant ces mots, niveau CE1/CE2
- JAMAIS copier les phrases du modèle — invente une situation, des personnages, un contexte différents`);
        }

        if (isNature) {
          regles.push(`TYPE : NATURE DES MOTS.
RÈGLES ABSOLUES :
1. instructions = "Identifie la nature du mot EN MAJUSCULES dans chaque phrase. Natures possibles : nom, verbe, adjectif qualificatif, adverbe, pronom, déterminant, préposition."
2. Chaque ligne = une phrase courte avec UN SEUL mot en MAJUSCULES + " →" à la fin
3. example = "Le PETIT chat dort. → petit = adjectif qualificatif"
4. Les mots en majuscules dans lignes doivent être DIFFÉRENTS de PETIT (le mot de l example)
5. Varier les natures sur les phrases : inclure au moins 1 nom, 1 verbe, 1 adjectif, 1 adverbe
6. JAMAIS mettre la réponse après "→" dans lignes
7. parentNote = "" (vide)`);
        }

        const isGrammaire = st.includes("accord") || st.includes("classes") || st.includes("fonctions") || st.includes("types_de_phrases") || st.includes("expansion") || st.includes("ponctuation");
        if (isGrammaire) {
          regles.push(`TYPE : GRAMMAIRE.
- Génère des phrases et exemples ENTIÈREMENT NOUVEAUX — jamais les mêmes que le modèle
- Même structure grammaticale, mots et situations différents
- Niveau CE1/CE2, phrases adaptées à l âge`);
        }

        // ─── FAMILLES DE MOTS : tirage forcé côté code ───────────────────────
        if (isFamilles) {
          const estAvance = st.includes("avancees");

          // MOTS_SIMPLES : ne contient PAS les mots utilisés dans FAMILLES_EXEMPLES
          const MOTS_SIMPLES = [
            "lait","bois","main","dent","jour","neige","pluie","vent",
            "herbe","champ","feu","chien","jardin","fruit","livre","ami",
            "cheval","oiseau","poisson","arbre","pied","dos","nez","bouche",
            "cœur","tête","bras","œil","balle","bord","bras","café",
            "canne","ciel","clé","corps","côte","cours","fête","fil",
            "fond","front","gare","glace","gomme","gorge","grain","grue",
            "île","jeu","joue","lac","lame","lande","langue","larme",
            "lune","manche","marche","mèche","miel","mine","mont","mur",
            "nid","onde","ongle","oreille","page","parc","pas","patte",
            "peau","peigne","pierre","piste","place","plage","plan","plante",
            "plume","pont","port","pot","poudre","prise","prix","race",
            "rage","rang","rate","robe","roc","ronde","roue","route",
            "sable","sac","sapin","sel","selle","sens","signe","soie",
            "son","sort","souche","soupe","source","tache","talon","temps",
            "tente","tige","toit","ton","tour","trace","train","trait",
            "trame","tranche","vague","val","valeur","verre","voie","voix"
          ];
          const MOTS_AVANCES = [
            "lumière","nature","montagne","rivière","forêt","marché",
            "cuisine","musique","science","histoire","dessin","village",
            "lecture","écriture","commerce","liberté","courage","sagesse",
            "beauté","bonheur","chaleur","chance","charme","chasse","chemin",
            "chiffre","chose","classe","cloche","coeur","colère","combat",
            "compte","confiance","connaissance","conseil","corps","couleur",
            "crainte","danger","défense","désir","douceur","douleur","droit",
            "effort","émotion","enfance","espace","esprit","étude","éveille",
            "fardeau","fatigue","faveur","fierté","flamme","foi","force",
            "forme","fraîcheur","franchise","génie","gloire","grandeur","grâce",
            "harmonie","hauteur","honneur","humeur","image","intelligence",
            "jalousie","jeunesse","joie","justice","largeur","lenteur","loi",
            "longueur","loyauté","magie","malheur","mémoire","mérite","mesure",
            "mode","monde","morale","mouvement","noblesse","norme","objet",
            "ombre","opinion","patience","pauvreté","pensée","peur","pitié",
            "plaisir","pouvoir","progrès","promesse","prudence","qualité","raison",
            "réalité","richesse","rigueur","rôle","service","silence","simplicité",
            "souvenir","symbole","talent","tendresse","terreur","vérité","vertu",
            "victoire","vie","vigueur","violence","vision","vitesse","volonté"
          ];

          const FAMILLES_EXEMPLES = [
            "FLEUR → fleuriste, fleurir, floral",
            "MER → marin, maritime, amerrir",
            "TERRE → terrain, enterrer, terrestre",
            "PAIN → boulangerie, boulanger, biscuit",
            "SOLEIL → ensoleillé, parasol, solaire",
            "CHAT → chaton, chatière, chatte",
            "MAISON → maisonnette, maçon, domicile",
            "EAU → aquatique, arroser, mouillé",
            "NUIT → nocturne, minuit, nuitée",
          ];

          const pool = estAvance ? MOTS_AVANCES : MOTS_SIMPLES;
          const disponibles = pool.filter(m => !usedWordsSession.has(m.toLowerCase()));
          const source = disponibles.length >= 5 ? disponibles : pool;
          const shuffled = [...source].sort(() => Math.random() - 0.5);
          const motsCodes = shuffled.slice(0, 5);

          const exempleIdx = Math.floor(Math.random() * FAMILLES_EXEMPLES.length);
          const exempleChoisi = FAMILLES_EXEMPLES[exempleIdx];

          // On track immédiatement ces mots comme utilisés
          motsCodes.forEach(m => usedWordsSession.add(m.toLowerCase()));

          regles.push(`TYPE : FAMILLES DE MOTS.
RÈGLES ABSOLUES :
1. instructions = "Trouve des mots de la même famille que le mot en majuscules."
2. example = "${exempleChoisi}"
3. lignes = EXACTEMENT ces 5 lignes dans cet ordre, SANS LES MODIFIER :
   ["1. ${motsCodes[0].toUpperCase()} →", "2. ${motsCodes[1].toUpperCase()} →", "3. ${motsCodes[2].toUpperCase()} →", "4. ${motsCodes[3].toUpperCase()} →", "5. ${motsCodes[4].toUpperCase()} →"]
   RÈGLE CRITIQUE : recopie EXACTEMENT ces 5 lignes dans lignes[]. Tu ne changes PAS les mots — ils sont imposés par le système.
4. JAMAIS écrire les mots dérivés dans lignes — l enfant les trouve lui-même
5. parentNote = "" (vide)
6. wordsUsed = ["${motsCodes[0].toLowerCase()}","${motsCodes[1].toLowerCase()}","${motsCodes[2].toLowerCase()}","${motsCodes[3].toLowerCase()}","${motsCodes[4].toLowerCase()}"]`);

        } else if (isVocabType) {
          regles.push(`TYPE : VOCABULAIRE.
RÈGLES ABSOLUES :
1. Les mots utilisés dans "example" NE DOIVENT PAS apparaître dans "lignes"
2. lignes = uniquement questions/mots à compléter, sans réponses
3. parentNote = "" (vide)`);
        }

        const reglesTxt = regles.join("\n\n");

        const prompt = modele
          ? `Tu es instituteur CE1/CE2 expert. Exercice pour ${CHILD_NAME}, niveau ${niv}.
MODÈLE DE RÉFÉRENCE (structure et type uniquement — NE PAS copier les valeurs) :
---
${modele.slice(0,600)}
---
RÈGLE FONDAMENTALE : respecte exactement la STRUCTURE du modèle, mais génère des valeurs ENTIÈREMENT NOUVELLES.
- Mots, phrases, chiffres, verbes, exemples : tout doit être différent du modèle
- Objectif : enrichir les connaissances de l enfant à chaque génération
${reglesTxt}
${focStr?`CONTRAINTES :\n${focStr}`:""}
RÈGLE ANTI-RÉPONSES : dans "lignes", jamais les réponses — uniquement questions et blancs ___.
JSON uniquement :
{"title":"titre précis","emoji":"...","duration":"${dur} min","instructions":"consigne claire CE1","example":"exemple résolu","lignes":[...],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`
          : `Tu es instituteur CE1/CE2 expert. Exercice "${st.replace(/_/g," ")}" pour ${CHILD_NAME}, niveau ${niv}.
${reglesTxt}
${focStr?`CONTRAINTES :\n${focStr}`:""}
RÈGLE FONDAMENTALE : génère des valeurs variées et originales à chaque fois — jamais les mêmes mots, chiffres ou phrases.
JSON uniquement :
{"title":"titre précis","emoji":"...","duration":"${dur} min","instructions":"consigne claire CE1","example":"","lignes":[...],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;

        const raw   = await callAPI(prompt,"exercice");
        const clean = raw.replace(/```json|```/g,"").trim();
        const obj   = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
        if(obj.title) {
          const fmt = isMonnaie ? 'trous' : isFamilles ? 'fleche' : exFormat;
          exercises.push({type:st, format: fmt, ...obj});
          (obj.verbsUsed||[]).forEach(v => usedVerbsSession.add(v.toLowerCase()));
          (obj.wordsUsed||[]).forEach(w => usedWordsSession.add(w.toLowerCase()));
          if (isConjType && obj.lignes) {
            obj.lignes.forEach(l => {
              const m = l.match(/^([A-ZÀÂÉÈÊËÎÏÔÙÛÜÇ]{2,})/);
              if (m) usedVerbsSession.add(m[1].toLowerCase());
            });
          }
          if (isFamilles && obj.lignes) {
            obj.lignes.forEach(l => {
              const m = l.match(/^\d+\.\s*([A-ZÀÂÉÈÊËÎÏÔÙÛÜÇ]{2,})/);
              if (m) usedWordsSession.add(m[1].toLowerCase());
            });
          }
        }

      } catch(e) { console.error("Erreur exercice",st,e); }
    }

    if(exercises.length===0){
      toast$("Erreur de génération — réessaie !","#f87171");
    } else {
      setSession({
        title:`Séance du ${new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}`,
        exercises
      });
      setView("exercises");
    }
    setGen(false);
  }

  function genRapide(){ const niv=prof.weeklyConfig.difficulty||"CE1/CE2"; generate(AUTO_TYPES[niv]||AUTO_TYPES["CE1/CE2"]); }
  function genMesure(){ if(mesure.length===0){toast$("Sélectionne au moins un exercice !","#f59e0b");return;} generate(mesure); }

  async function validate(){
    if(stars===0){toast$("Donne une note !","#f59e0b");return;}
    const pts=stars, prev=prof.totalPoints, next=prev+pts;
    const newVerbs=session?.exercises?.flatMap(e=>e.verbsUsed||[])||[];
    const newWords=session?.exercises?.flatMap(e=>e.wordsUsed||[])||[];
    const np={...prof,totalPoints:next,
      sessions:[...prof.sessions,{date:new Date().toISOString(),title:session?.title||"Séance",points:pts,stars,duration:prof.weeklyConfig.duration,insight:obs||null}],
      memory:{usedVerbs:[...(prof.memory.usedVerbs||[]),...newVerbs].slice(-30),usedWords:[...(prof.memory.usedWords||[]),...newWords].slice(-30),weakPoints:obs?[...(prof.memory.weakPoints||[]),obs].slice(-10):(prof.memory.weakPoints||[])},
    };
    const pu=unlocked(prev,prof.unlockedBonusItems||[]),nu=unlocked(next,np.unlockedBonusItems||[]);
    if(nu.length>pu.length){const g=nu[nu.length-1];setTimeout(()=>toast$(`${g.e} ${g.l} débloqué ! 🎉`,"#f59e0b"),600);}
    await save(np); setScore({pts}); toast$(`+${pts} point${pts>1?"s":""}! 🎉`,"#a78bfa");
  }

  async function chat(msg){
    if(!msg.trim()||chatBusy)return;
    setMsgs(p=>[...p,{r:"u",t:msg}]); setChatIn(""); setChatBusy(true);
    try{
      const eq=unlocked(prof.totalPoints,prof.unlockedBonusItems||[]).map(i=>i.l).join(", ");
      const raw=await callAPI(`Léo a ${prof.totalPoints} points. Équipements : ${eq}. Léo dit : ${msg}`,"chat");
      setMsgs(p=>[...p,{r:"a",t:raw.replace(/^["']|["']$/g,"").trim()||"En avant l aventure ! 🌲"}]);
    }catch{setMsgs(p=>[...p,{r:"a",t:"Oups ! Réessaie 🌲"}]);}
    setChatBusy(false);
  }

  const S={
    app:{minHeight:"100vh",background:"linear-gradient(160deg,#020817 0%,#0f172a 40%,#1a103a 70%,#0c1220 100%)",fontFamily:"system-ui,-apple-system,sans-serif",color:"white",paddingBottom:90},
    hdr:{background:"rgba(2,8,23,.9)",borderBottom:"1px solid rgba(99,102,241,.2)",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:100,boxShadow:"0 4px 30px rgba(0,0,0,.5)"},
    card:{background:"rgba(15,23,42,.7)",border:"1px solid rgba(99,102,241,.15)",borderRadius:20,padding:20,marginBottom:16,backdropFilter:"blur(10px)",boxShadow:"0 8px 32px rgba(0,0,0,.3)"},
    btn:{background:"linear-gradient(135deg,#4f46e5,#7c3aed)",border:"none",borderRadius:16,padding:"15px 24px",color:"white",fontFamily:"system-ui,-apple-system,sans-serif",fontSize:15,fontWeight:700,cursor:"pointer",width:"100%",boxShadow:"0 4px 20px rgba(99,102,241,.4)",transition:"transform .15s,box-shadow .15s"},
    btnSm:{background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.3)",borderRadius:12,padding:"8px 16px",color:"#a5b4fc",fontFamily:"system-ui,-apple-system,sans-serif",fontSize:13,cursor:"pointer"},
    tog:(on)=>({background:on?"linear-gradient(135deg,#4f46e5,#7c3aed)":"rgba(15,23,42,.6)",border:`1px solid ${on?"#6366f1":"rgba(99,102,241,.2)"}`,borderRadius:14,padding:"10px 16px",color:on?"white":"#64748b",fontFamily:"system-ui,-apple-system,sans-serif",fontSize:13,fontWeight:on?700:400,cursor:"pointer",transition:"all .2s",boxShadow:on?"0 4px 15px rgba(99,102,241,.3)":"none"}),
    tab:(on)=>({flex:1,padding:"14px 4px 10px",background:on?"rgba(99,102,241,.15)":"transparent",border:"none",borderBottom:on?"2px solid #818cf8":"2px solid transparent",color:on?"#a5b4fc":"#475569",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all .2s"}),
    nav:{position:"fixed",bottom:0,left:0,right:0,background:"rgba(2,8,23,.97)",borderTop:"1px solid rgba(99,102,241,.2)",display:"flex",zIndex:200,backdropFilter:"blur(20px)"},
    navB:(a)=>({flex:1,padding:"12px 4px",background:"none",border:"none",color:a?"#818cf8":"#334155",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"color .2s"}),
    inp:{background:"rgba(15,23,42,.8)",border:"1px solid rgba(99,102,241,.2)",borderRadius:12,padding:"12px 16px",color:"white",fontFamily:"system-ui,-apple-system,sans-serif",fontSize:14,width:"100%",outline:"none",resize:"vertical"},
    badge:(c)=>({background:c+"20",border:`1px solid ${c}40`,borderRadius:20,padding:"4px 14px",fontSize:12,color:c,fontWeight:700,display:"inline-block"}),
    wrap:{padding:"0 16px",maxWidth:600,margin:"0 auto"},
  };

  if(loading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#020817"}}><div style={{textAlign:"center"}}><Raton items={[]} size={100} anim/><div style={{color:"#a5b4fc",fontFamily:"system-ui,-apple-system,sans-serif",marginTop:16}}>Chargement…</div></div></div>);

  const li  = lvl(prof.totalPoints);
  const ulk = unlocked(prof.totalPoints,prof.unlockedBonusItems||[]);
  const eqp = (prof.equippedItems||[]).map(e=>ITEMS.find(i=>i.e===e)).filter(Boolean);

  if(gen) return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#020817 0%,#0f172a 40%,#1a103a 70%,#0c1220 100%)"}}>
      <div style={{textAlign:"center",padding:"0 32px"}}>
        <Raton items={eqp} size={120} anim/>
        <div style={{marginTop:24,fontSize:18,fontWeight:700,color:"#a5b4fc",fontFamily:"system-ui,-apple-system,sans-serif"}}>Roki prépare ta séance…</div>
        <div style={{marginTop:8,fontSize:13,color:"#475569",fontFamily:"system-ui,-apple-system,sans-serif"}}>Génération en cours, ça peut prendre 20–30 secondes</div>
        <div style={{marginTop:24,display:"flex",justifyContent:"center",gap:8}}>
          {[0,1,2].map(i=>(<div key={i} style={{width:10,height:10,borderRadius:"50%",background:"#6366f1",animation:"pulse 1.2s ease-in-out infinite",animationDelay:`${i*0.3}s`}}/>))}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  );

  if(print&&session)return(
    <div style={{fontFamily:"Arial,sans-serif",padding:"10mm 12mm",color:"#1e293b",background:"white"}}>
      <style>{`@page{size:A4;margin:10mm 12mm;}@media print{body{margin:0;background:white!important;}*{background:transparent!important;color:#1e293b!important;box-shadow:none!important;}nav{display:none!important;}}`}</style>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",borderBottom:"2px solid #4f46e5",paddingBottom:8,marginBottom:14}}>
        <div><div style={{fontSize:17,fontWeight:700,color:"#4f46e5"}}>📚 École de {CHILD_NAME}</div><div style={{fontSize:11,color:"#64748b",marginTop:2}}>{session.title}</div></div>
        <div style={{textAlign:"right",fontSize:11,color:"#64748b"}}><div>{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div><div>{prof.weeklyConfig.duration} min · {prof.weeklyConfig.difficulty}</div></div>
      </div>
      {session.exercises?.map((ex,i)=>(
        <div key={i} style={{marginBottom:14,pageBreakInside:"avoid"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"#f1f5f9",padding:"5px 10px",borderRadius:6,borderLeft:"3px solid #4f46e5",marginBottom:5}}>
            <span style={{fontSize:15}}>{ex.emoji}</span>
            <div style={{fontWeight:700,fontSize:13}}>Exercice {i+1} — {ex.title}</div>
            <div style={{marginLeft:"auto",fontSize:10,color:"#94a3b8"}}>{ex.duration}</div>
          </div>
          <p style={{fontStyle:"italic",color:"#475569",margin:"0 0 4px",fontSize:11}}>📌 {ex.instructions}</p>
          {ex.example&&!hideExample(ex.type)&&<p style={{background:"#eff6ff",padding:"4px 10px",borderRadius:6,fontSize:11,color:"#1d4ed8",margin:"0 0 6px",borderLeft:"2px solid #3b82f6"}}>{ex.example}</p>}
          <ExCard ex={ex} dark={false}/>
        </div>
      ))}
      <div style={{textAlign:"center",padding:8,background:"#f0fdf4",borderRadius:8,color:"#166534",fontStyle:"italic",fontSize:12,marginTop:10}}>💪 Bravo {CHILD_NAME} !</div>
    </div>
  );

  return(
    <div style={S.app}>
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        {[...Array(30)].map((_,i)=><div key={i} style={{position:"absolute",width:i%4===0?2:1,height:i%4===0?2:1,background:"white",borderRadius:"50%",left:`${Math.sin(i*31)*50+50}%`,top:`${Math.cos(i*47)*50+50}%`,opacity:.1+(i%5)*.04,animation:`tw ${2+(i%3)}s ease-in-out infinite`,animationDelay:`${(i%7)*.4}s`}}/>)}
      </div>

      {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:toast.c,color:"white",padding:"12px 28px",borderRadius:24,fontWeight:700,fontSize:14,zIndex:999,boxShadow:"0 8px 32px rgba(0,0,0,.5)",whiteSpace:"nowrap",animation:"sd .3s ease"}}>{toast.m}</div>}

      <div style={S.hdr}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{cursor:"pointer"}} onClick={()=>setView("cabane")}><Raton items={eqp} size={48} anim/></div>
          <div>
            <div style={{fontSize:16,fontWeight:700}}>École de {CHILD_NAME}</div>
            <div style={{fontSize:11,color:"#475569",display:"flex",alignItems:"center",gap:6}}>
              {prof.weeklyConfig?.difficulty}
              {sync==="saving"&&<span style={{color:"#f59e0b"}}>● sync…</span>}
              {sync==="saved"&&<span style={{color:"#34d399"}}>✓</span>}
            </div>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={S.badge(li.color)}>{li.name}</div>
          <div style={{fontSize:12,color:"#475569",marginTop:3}}>{prof.totalPoints} pts</div>
        </div>
      </div>

      <div style={{...S.wrap,position:"relative",zIndex:1}}>

        {view==="exercises"&&session&&(
          <>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"20px 0 12px"}}>
              <button style={S.btnSm} onClick={()=>setView("home")}>← Retour</button>
              <div style={{flex:1,fontWeight:700,fontSize:14,color:"#a5b4fc"}}>{session.title}</div>
              <button style={S.btnSm} onClick={()=>{setPrint(true);setTimeout(()=>{window.print();setPrint(false);},300);}}>🖨️ A4</button>
            </div>
            {session.exercises?.map((ex,i)=>(
              <div key={i} style={{...S.card,borderLeft:"3px solid #6366f1"}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}>
                  <span style={{fontSize:26}}>{ex.emoji}</span>
                  <div><div style={{fontWeight:700,fontSize:15,color:"#e2e8f0"}}>Exercice {i+1} — {ex.title}</div></div>
                </div>
                {!hideInstructions(ex.type)&&!isInstructionRedondante(ex.title,ex.instructions,ex.type)&&<div style={{background:"rgba(99,102,241,.1)",borderRadius:12,padding:"10px 14px",marginBottom:10,fontSize:13,color:"#a5b4fc",fontStyle:"italic",borderLeft:"2px solid #6366f1"}}>📌 {ex.instructions}</div>}
                {ex.example&&!hideExample(ex.type)&&<div style={{background:"rgba(52,211,153,.08)",borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#6ee7b7",borderLeft:"2px solid #34d399"}}>{ex.example}</div>}
                <ExCard ex={ex} dark/>
              </div>
            ))}
            {!score?(
              <div style={{...S.card,background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.25)"}}>
                <div style={{fontStyle:"italic",color:"#a5b4fc",fontSize:14,textAlign:"center",marginBottom:18}}>💪 Bravo {CHILD_NAME}, continue comme ça !</div>
                <div style={{fontWeight:700,marginBottom:6,color:"#e2e8f0"}}>🔍 Observations</div>
                <textarea style={{...S.inp,minHeight:70,marginBottom:16}} placeholder="Ex: Léo hésite sur les accords…" value={obs} onChange={e=>setObs(e.target.value)}/>
                <div style={{fontWeight:700,marginBottom:12,textAlign:"center",color:"#e2e8f0"}}>Comment s est passée la séance ?</div>
                <Stars value={stars} onChange={setStars}/>
                <button style={{...S.btn,marginTop:16}} onClick={validate}>✅ Valider la séance</button>
              </div>
            ):(
              <div style={{...S.card,textAlign:"center",background:"rgba(52,211,153,.06)",border:"1px solid rgba(52,211,153,.2)"}}>
                <div style={{fontSize:56,marginBottom:8}}>🎉</div>
                <div style={{fontSize:24,fontWeight:700,color:"#34d399"}}>+{score.pts} point{score.pts>1?"s":""}!</div>
                <div style={{color:"#475569",marginTop:4,marginBottom:20}}>Séance enregistrée ✓</div>
                <button style={S.btn} onClick={()=>{setView("home");setSession(null);setCtx("");}}>🏠 Retour</button>
              </div>
            )}
          </>
        )}

        {view==="home"&&(
          <>
            <div style={{display:"flex",borderBottom:"1px solid rgba(99,102,241,.15)",marginTop:16,marginBottom:20}}>
              {[{id:"rapide",e:"⚡",l:"Séance rapide"},{id:"mesure",e:"🎯",l:"Sur mesure"},{id:"photo",e:"📷",l:"Photo"}].map(t=>(
                <button key={t.id} style={S.tab(tab===t.id)} onClick={()=>setTab(t.id)}>
                  <span style={{fontSize:20}}>{t.e}</span>
                  <span style={{fontSize:11,fontWeight:tab===t.id?700:400}}>{t.l}</span>
                </button>
              ))}
            </div>

            {tab==="rapide"&&(
              <>
                <div style={{...S.card,background:`linear-gradient(135deg,rgba(15,23,42,.9),rgba(26,16,58,.9))`,border:`1px solid ${li.color}30`}}>
                  <div style={{display:"flex",gap:16,alignItems:"center"}}>
                    <Raton items={eqp} size={100} anim/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:20,fontWeight:700,color:li.color}}>{li.name}</div>
                      <div style={{fontSize:13,color:"#475569",marginBottom:10}}>{prof.totalPoints} pts · {ulk.length} équipements</div>
                      <div style={{background:"rgba(0,0,0,.3)",borderRadius:8,height:8,overflow:"hidden",marginBottom:6}}>
                        <div style={{width:`${li.progress}%`,height:"100%",background:`linear-gradient(90deg,${li.color}90,${li.color})`,borderRadius:8,transition:"width 1s"}}/>
                      </div>
                      {li.toNext>0&&<div style={{fontSize:11,color:"#475569"}}>{li.toNext} pts pour le prochain niveau</div>}
                      {(()=>{const nx=ITEMS.find(it=>it.pts>prof.totalPoints&&!ulk.find(u=>u.e===it.e));return nx?<div style={{fontSize:11,color:"#f59e0b",marginTop:2}}>Prochain : {nx.e} {nx.l} ({nx.pts-prof.totalPoints} pts)</div>:null;})()}
                    </div>
                  </div>
                  <div style={{marginTop:12,textAlign:"right"}}><span style={{fontSize:11,color:"#1e293b",cursor:"pointer",userSelect:"none"}} onClick={()=>setShowP(v=>!v)}>··· parent</span></div>
                  {showP&&(
                    <div style={{marginTop:10,background:"rgba(0,0,0,.3)",borderRadius:14,padding:14,border:"1px solid rgba(99,102,241,.2)"}}>
                      {!pOk?(
                        <><div style={{fontSize:12,color:"#64748b",marginBottom:8}}>Code parent :</div>
                        <input type="password" style={{...S.inp,marginBottom:8}} value={pCode} onChange={e=>setPCode(e.target.value)} placeholder="Code"/>
                        <button style={S.btnSm} onClick={()=>{if(pCode===PARENT_CODE){setPOk(true);toast$("Mode parent ✅");}else toast$("Code incorrect","#f87171");}}>Valider</button></>
                      ):(
                        <><div style={{fontSize:12,color:"#34d399",marginBottom:10}}>✅ Débloquer un item bonus :</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                          {ITEMS.filter(it=>!ulk.find(u=>u.e===it.e)).map(it=>(
                            <button key={it.pts} style={S.btnSm} onClick={async()=>{const np={...prof,unlockedBonusItems:[...(prof.unlockedBonusItems||[]),it.e]};await save(np);toast$(`${it.e} débloqué ! 🎉`,"#f59e0b");}}>{it.e} {it.l}</button>
                          ))}
                        </div></>
                      )}
                    </div>
                  )}
                </div>
                <div style={S.card}>
                  <div style={{fontSize:13,color:"#64748b",marginBottom:4}}>💬 Note pour la séance <span style={{fontSize:11}}>(optionnel)</span></div>
                  <textarea style={{...S.inp,marginBottom:14,minHeight:60}} placeholder="Léo a eu du mal avec les accords… la maîtresse a demandé de revoir les tables de 7…" value={ctx} onChange={e=>setCtx(e.target.value)}/>
                  <div style={{fontSize:12,color:"#475569",marginBottom:10}}>⚡ L app génère automatiquement 5 exercices adaptés au niveau <strong style={{color:"#a5b4fc"}}>{prof.weeklyConfig?.difficulty}</strong></div>
                  <button style={{...S.btn,opacity:gen?0.65:1}} onClick={genRapide} disabled={gen}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 30px rgba(99,102,241,.5)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 4px 20px rgba(99,102,241,.4)";}}>
                    ⚡ Générer une séance rapide
                  </button>
                </div>
                <div style={S.card}><div style={{fontWeight:700,marginBottom:14,color:"#e2e8f0"}}>📈 Progression récente</div><Chart sessions={prof.sessions}/></div>
              </>
            )}

            {tab==="mesure"&&(
              <>
                <div style={S.card}>
                  <div style={{fontWeight:700,marginBottom:6,color:"#e2e8f0"}}>🎯 Composition de la séance sur mesure</div>
                  <div style={{fontSize:12,color:"#475569",marginBottom:16}}>Choisis la catégorie puis le type d exercice exact du programme national.</div>
                  <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                    <select style={{...S.inp,flex:1,padding:"10px 12px"}} value={selCat} onChange={e=>{setSelCat(e.target.value);setSelSub("");}}>
                      <option value="">— Catégorie —</option>
                      {Object.keys(CATEGORIES).map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                    {selCat&&(
                      <select style={{...S.inp,flex:2,padding:"10px 12px"}} value={selSub} onChange={e=>setSelSub(e.target.value)}>
                        <option value="">— Type d exercice —</option>
                        {CATEGORIES[selCat].map(s=><option key={s} value={s}>{label(s)}</option>)}
                      </select>
                    )}
                    <button style={{...S.btnSm,padding:"10px 16px"}} onClick={()=>{
                      if(!selSub){toast$("Choisis un type !","#f59e0b");return;}
                      if(mesure.includes(selSub)){toast$("Déjà ajouté !","#f59e0b");return;}
                      setMesure(p=>[...p,selSub]);
                      toast$(`✅ ${label(selSub)} ajouté`);
                    }}>+ Ajouter</button>
                  </div>
                  {mesure.length>0&&(
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>Exercices sélectionnés :</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {mesure.map((s,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.3)",borderRadius:10,padding:"4px 10px"}}>
                            <span style={{fontSize:12,color:"#a5b4fc"}}>{label(s)}</span>
                            <span style={{fontSize:14,color:"#f87171",cursor:"pointer"}} onClick={()=>setMesure(p=>p.filter((_,j)=>j!==i))}>✕</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{fontSize:13,color:"#64748b",marginBottom:8}}>💬 Note pour la séance</div>
                  <textarea style={{...S.inp,marginBottom:14,minHeight:60}} placeholder="Focus sur les tables de 7… revoir les homophones a/à…" value={ctx} onChange={e=>setCtx(e.target.value)}/>
                  <button style={{...S.btn,opacity:gen?0.65:1}} onClick={genMesure} disabled={gen}>🎯 Générer la séance sur mesure</button>
                </div>
                {prof.memory.weakPoints?.length>0&&<div style={S.card}><div style={{fontWeight:700,marginBottom:10,color:"#e2e8f0"}}>🧠 Mémoire</div>{prof.memory.weakPoints.slice(-3).map((w,i)=><div key={i} style={{fontSize:12,color:"#64748b",marginBottom:4}}>· {w}</div>)}</div>}
              </>
            )}

            {tab==="photo"&&(
              <div style={{...S.card,textAlign:"center",padding:"48px 24px"}}>
                <div style={{fontSize:64,marginBottom:16}}>📷</div>
                <div style={{fontSize:18,fontWeight:700,marginBottom:10,color:"#e2e8f0"}}>Analyse de photo</div>
                <div style={{fontSize:14,color:"#475569",lineHeight:1.8}}>Prends en photo un exercice du cahier de Léo et l app génèrera une fiche similaire.</div>
                <div style={{marginTop:24,background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.2)",borderRadius:16,padding:"16px 20px",fontSize:13,color:"#818cf8"}}>🚧 En cours de développement</div>
              </div>
            )}
          </>
        )}

        {view==="cabane"&&(
          <>
            <div style={{fontWeight:700,fontSize:17,margin:"20px 0 4px",color:"#e2e8f0"}}>🌲 La cabane de Roki</div>
            <div style={{fontSize:12,color:"#475569",marginBottom:16}}>La base secrète de ton compagnon aventurier</div>
            <div style={{borderRadius:20,overflow:"hidden",marginBottom:16,border:"1px solid rgba(99,102,241,.2)"}}>
              <Cabane/>
              <div style={{background:"rgba(15,23,42,.9)",padding:"16px 20px",display:"flex",alignItems:"center",gap:16}}>
                <Raton items={eqp} size={90} anim/>
                <div>
                  <div style={{fontWeight:700,color:"#e2e8f0",marginBottom:4}}>Roki l Aventurier</div>
                  <div style={{fontSize:12,color:"#475569"}}>{ulk.length} équipements débloqués</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>{eqp.map((it,i)=><span key={i} style={{fontSize:20}} title={it.l}>{it.e}</span>)}</div>
                </div>
              </div>
            </div>
            <div style={S.card}>
              <div style={{fontWeight:700,marginBottom:12,color:"#e2e8f0"}}>🎒 Équipements de Roki</div>
              {ITEMS.map((it,i)=>{
                const u=!!ulk.find(x=>x.e===it.e), eq=!!(prof.equippedItems||[]).includes(it.e);
                return(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<ITEMS.length-1?"1px solid rgba(255,255,255,.04)":"none",opacity:u?1:.35}}>
                    <span style={{fontSize:28}}>{it.e}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:u?"#e2e8f0":"#334155"}}>{it.l}</div>
                      <div style={{fontSize:11,color:"#475569"}}>{u?it.d:`Débloquer à ${it.pts} pts`}</div>
                    </div>
                    {u&&<button style={S.tog(eq)} onClick={async()=>{
                      const c=prof.equippedItems||[],nw=eq?c.filter(x=>x!==it.e):[...c,it.e];
                      await save({...prof,equippedItems:nw});toast$(eq?`${it.e} retiré`:`${it.e} équipé !`);
                    }}>{eq?"Équipé ✓":"Équiper"}</button>}
                  </div>
                );
              })}
            </div>
            <div style={S.card}>
              <div style={{fontWeight:700,marginBottom:12,color:"#e2e8f0"}}>💬 Parle avec Roki</div>
              <div style={{minHeight:200,maxHeight:280,overflowY:"auto",marginBottom:12,display:"flex",flexDirection:"column",gap:10}}>
                {msgs.map((m,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:m.r==="u"?"flex-end":"flex-start"}}>
                    {m.r==="a"&&<span style={{fontSize:20,marginRight:8,flexShrink:0}}>🦝</span>}
                    <div style={{background:m.r==="u"?"linear-gradient(135deg,#4f46e5,#7c3aed)":"rgba(30,41,59,.8)",border:m.r==="a"?"1px solid rgba(99,102,241,.2)":"none",borderRadius:m.r==="u"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 14px",fontSize:13,color:"#e2e8f0",maxWidth:"75%",lineHeight:1.5}}>{m.t}</div>
                  </div>
                ))}
                {chatBusy&&<div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:20}}>🦝</span><div style={{background:"rgba(30,41,59,.8)",borderRadius:12,padding:"10px 14px",fontSize:13,color:"#475569"}}>Roki réfléchit…</div></div>}
                <div ref={chatEnd}/>
              </div>
              <div style={{display:"flex",gap:10}}>
                <input style={{...S.inp,flex:1}} placeholder="Dis quelque chose à Roki…" value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();chat(chatIn);}}}/>
                <button style={{...S.btnSm,padding:"10px 16px"}} onClick={()=>chat(chatIn)} disabled={chatBusy}>➤</button>
              </div>
            </div>
          </>
        )}

        {view==="stats"&&(
          <>
            <div style={{fontWeight:700,fontSize:17,margin:"20px 0 14px",color:"#e2e8f0"}}>📊 Suivi de {CHILD_NAME}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              {[{l:"Séances",v:prof.sessions.length,i:"📚"},{l:"Points",v:prof.totalPoints,i:"⭐"},{l:"Niveau",v:li.name,i:"🏆"},{l:"Moy/séance",v:prof.sessions.length?(prof.totalPoints/prof.sessions.length).toFixed(1):0,i:"📈"}].map(s=>(
                <div key={s.l} style={{...S.card,textAlign:"center",marginBottom:0}}>
                  <div style={{fontSize:28}}>{s.i}</div><div style={{fontSize:20,fontWeight:700,marginTop:6,color:"#e2e8f0"}}>{s.v}</div><div style={{fontSize:11,color:"#475569"}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={S.card}><div style={{fontWeight:700,marginBottom:14,color:"#e2e8f0"}}>📈 Évolution</div><Chart sessions={prof.sessions}/></div>
            {prof.memory.weakPoints?.length>0&&<div style={S.card}><div style={{fontWeight:700,marginBottom:10,color:"#e2e8f0"}}>🔍 Points à retravailler</div>{prof.memory.weakPoints.slice().reverse().map((w,i)=><div key={i} style={{fontSize:13,color:"#64748b",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>· {w}</div>)}</div>}
            <div style={S.card}>
              <div style={{fontWeight:700,marginBottom:12,color:"#e2e8f0"}}>🗓 Historique</div>
              {!prof.sessions.length&&<div style={{color:"#334155",fontSize:13}}>Aucune séance encore.</div>}
              {prof.sessions.slice().reverse().map((s,i)=>(
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

        {view==="settings"&&(
          <>
            <div style={{fontWeight:700,fontSize:17,margin:"20px 0 14px",color:"#e2e8f0"}}>⚙️ Paramètres</div>
            <div style={{...S.card,border:"1px solid rgba(52,211,153,.2)"}}>
              <div style={{fontWeight:700,marginBottom:6,color:"#e2e8f0"}}>🎯 Focus du moment</div>
              <div style={{fontSize:12,color:"#475569",marginBottom:14}}>Influence toutes les générations.</div>
              {foc?(
                <>
                  {[{k:"mots",l:"📝 Mots de la semaine",p:"maison, soleil, forêt…"},{k:"verbes",l:"🔤 Verbes en cours",p:"aller au présent…"},{k:"remarque",l:"💬 Remarque maîtresse",p:"Léo hésite sur…"}].map(({k,l,p})=>(
                    <div key={k} style={{marginBottom:12}}>
                      <div style={{fontSize:12,color:"#64748b",marginBottom:4}}>{l}</div>
                      <input style={S.inp} placeholder={p} value={foc[k]||""} onChange={e=>setFoc({...foc,[k]:e.target.value})}/>
                    </div>
                  ))}
                  <button style={S.btn} onClick={async()=>{await save({...prof,focus:foc});setFoc(null);toast$("Focus mis à jour ✅");}}>💾 Enregistrer</button>
                  <button style={{...S.btnSm,width:"100%",marginTop:8,padding:10}} onClick={()=>setFoc(null)}>Annuler</button>
                </>
              ):(
                <>
                  {prof.focus?.mots&&<div style={{fontSize:13,color:"#6ee7b7",marginBottom:4}}>📝 {prof.focus.mots}</div>}
                  {prof.focus?.verbes&&<div style={{fontSize:13,color:"#6ee7b7",marginBottom:4}}>🔤 {prof.focus.verbes}</div>}
                  {!prof.focus?.mots&&!prof.focus?.verbes&&<div style={{fontSize:13,color:"#334155",marginBottom:8}}>Aucun focus défini.</div>}
                  <button style={S.btnSm} onClick={()=>setFoc({...DEF.focus,...(prof.focus||{})})}>✏️ Modifier</button>
                </>
              )}
            </div>
            <div style={S.card}>
              <div style={{fontWeight:700,marginBottom:14,color:"#e2e8f0"}}>📋 Niveau et durée</div>
              {cfg?(
                <>
                  <div style={{fontWeight:600,marginBottom:8,color:"#cbd5e1"}}>⏱ Durée de séance</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
                    {[15,20,25,30,35,40,45].map(d=><button key={d} style={S.tog(cfg.duration===d)} onClick={()=>setCfg({...cfg,duration:d})}>{d} min</button>)}
                  </div>
                  <div style={{fontWeight:600,marginBottom:8,color:"#cbd5e1"}}>🎯 Niveau de Léo</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
                    {["CE1 debut","CE1/CE2","CE2","CE2 avance","CM1"].map(d=><button key={d} style={S.tog(cfg.difficulty===d)} onClick={()=>setCfg({...cfg,difficulty:d})}>{d}</button>)}
                  </div>
                  <button style={S.btn} onClick={async()=>{await save({...prof,weeklyConfig:cfg});setCfg(null);toast$("Paramètres mis à jour ✅");}}>💾 Enregistrer</button>
                  <button style={{...S.btnSm,width:"100%",marginTop:8,padding:10}} onClick={()=>setCfg(null)}>Annuler</button>
                </>
              ):(
                <>
                  <div style={{fontSize:13,color:"#475569",marginBottom:8}}>⏱ {prof.weeklyConfig?.duration||25} min · {prof.weeklyConfig?.difficulty||"CE1/CE2"}</div>
                  <button style={S.btnSm} onClick={()=>setCfg({...DEF.weeklyConfig,...(prof.weeklyConfig||{})})}>✏️ Modifier</button>
                </>
              )}
            </div>
            <div style={S.card}>
              <div style={{textAlign:"center"}}><span style={{fontSize:11,color:"#1e293b",cursor:"pointer",userSelect:"none"}} onClick={()=>setShowA(v=>!v)}>··· administration</span></div>
              {showA&&(
                <div style={{marginTop:12}}>
                  {!aOk?(
                    <><div style={{fontSize:12,color:"#64748b",marginBottom:8}}>Code admin :</div>
                    <input type="password" style={{...S.inp,marginBottom:8}} value={aCode} onChange={e=>setACode(e.target.value)}/>
                    <button style={S.btnSm} onClick={()=>{if(aCode===ADMIN_CODE){setAOk(true);toast$("Mode admin ✅");}else toast$("Code incorrect","#f87171");}}>Valider</button></>
                  ):(
                    <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
                      {[
                        {l:"🔄 Remettre les points à zéro",a:async()=>{if(window.confirm("Remettre à zéro ?")){await save({...prof,totalPoints:0});toast$("Points remis à zéro ✅");}}},
                        {l:"🗑️ Effacer l historique",a:async()=>{if(window.confirm("Effacer l historique ?")){await save({...prof,sessions:[]});toast$("Historique effacé ✅");}}},
                        {l:"🧠 Effacer la mémoire",a:async()=>{if(window.confirm("?")){await save({...prof,memory:{usedVerbs:[],usedWords:[],weakPoints:[]}});toast$("Mémoire effacée ✅");}}},
                        {l:"🦝 Réinitialiser Roki",a:async()=>{if(window.confirm("?")){await save({...prof,unlockedBonusItems:[],equippedItems:[]});toast$("Roki réinitialisé ✅");}}},
                        {l:"⚠️ Reset complet",a:async()=>{if(window.confirm("RESET COMPLET ?")){await save({...DEF});toast$("Reset complet ✅");}}},
                      ].map((b,i)=><button key={i} style={{...S.btnSm,color:"#f87171",borderColor:"#f8717140",textAlign:"left"}} onClick={b.a}>{b.l}</button>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <nav style={S.nav}>
        {[{id:"home",i:"🏠",l:"Accueil"},{id:"cabane",i:"🦝",l:"Roki"},{id:"stats",i:"📊",l:"Suivi"},{id:"settings",i:"⚙️",l:"Paramètres"}].map(n=>(
          <button key={n.id} style={S.navB(view===n.id)} onClick={()=>setView(n.id)}>
            <span style={{fontSize:22}}>{n.i}</span>
            <span style={{fontSize:10,fontWeight:view===n.id?700:400}}>{n.l}</span>
          </button>
        ))}
      </nav>

      <style>{`*{box-sizing:border-box;}textarea:focus,input:focus,select:focus{border-color:rgba(99,102,241,.5)!important;box-shadow:0 0 0 3px rgba(99,102,241,.1);}select option{background:#0f172a;color:white;}@keyframes tw{0%,100%{opacity:.1}50%{opacity:.55}}@keyframes sd{from{transform:translateX(-50%) translateY(-20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}@media print{nav{display:none!important;}}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:rgba(99,102,241,.3);border-radius:2px;}`}</style>
    </div>
  );
}
