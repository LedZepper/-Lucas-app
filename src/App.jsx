import { useState, useEffect, useCallback, useRef } from "react";

const CHILD_NAME   = "Léo";
const SUPABASE_URL = "https://enppydwndwwbmnueuuup.supabase.co";
const SUPABASE_KEY = "sb_publishable_Gf2rnCwwTS7rfmUQ8K_VmQ_RkC1bJZt";
const PARENT_CODE  = "leo2024";
const ADMIN_CODE   = "TTR250";
const SB_H = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };

const CATEGORIES = {
  "Conjugaison": ["present_etre","present_avoir","present_aller","present_faire","present_1er_groupe","present_1er_groupe_2","present_2eme_groupe","present_venir","present_prendre","present_pouvoir_vouloir","present_voir_savoir","imparfait_etre_avoir","imparfait_1er_groupe","imparfait_1er_groupe_2","imparfait_2eme_groupe","imparfait_irreguliers","futur_simple_1er_groupe","futur_simple_etre_avoir","futur_simple_irreguliers","passe_compose_avoir","passe_compose_etre","identification_temps","conditionnel_present","imparfait_vs_passe_compose"],
  "Grammaire": ["transposition","negation_ne_pas","negation_ne_plus","negation_ne_jamais_rien","accord_sujet_verbe","accord_sujet_verbe_eloigne","classes_de_mots","nature_des_mots","fonctions_sujet_verbe_cod","complement_circonstanciel","expansion_gn","phrase_syntaxe","types_de_phrases","ponctuation","propositions_cm1"],
  "Orthographe": ["sons_ou_on","sons_an_en","sons_in_ain","sons_oi","sons_eau_au","sons_ill_gn","homophones_a_a","homophones_et_est","homophones_son_sont","homophones_ou_ou","homophones_ces_ses","homophones_on_ont","homophones_ma_ma","accord_adjectif","accord_participe_passe","mots_invariables"],
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
  "CE1 debut":  ["present_1er_groupe","soustraction_retenue","sons_ou_on","transposition","numeration_encadrement"],
  "CE1/CE2":    ["imparfait_1er_groupe","soustraction_retenue","tables_melange","transposition","negation_ne_pas"],
  "CE2":        ["futur_simple_1er_groupe","soustraction_grands_nombres","tables_melange","negation_ne_plus","fractions_representation"],
  "CE2 avance": ["passe_compose_avoir","soustraction_grands_nombres","multiplication_posee_1chiffre","accord_sujet_verbe","fractions_ecriture"],
  "CM1":        ["passe_compose_etre","division_posee","multiplication_posee_2chiffres","complement_circonstanciel","fractions_operations"],
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
const hideExample      = t => isMath(t) || isConj(t);
// parentNote masqué partout — on ne l'affiche plus nulle part
const hideParentNote   = () => true;

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
    while (blocs.length < 2) blocs.push({title:"— — —"});
    const show = blocs.slice(0, 2);
    const PRONOMS = ["je","tu","il/elle","nous","vous","ils/elles"];
    return (
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 24px"}}>
        {show.map((b,bi) => (
          <div key={bi}>
            <div style={{fontWeight:700, fontSize:dark?13:12, color:ac, marginBottom:10, paddingBottom:4, borderBottom:`1px solid ${ac}33`}}>
              {b.title.replace(/^([A-ZÀÂÉÈÊËÎÏÔÙÛÜÇ]+)/, m => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase())}
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
              <div key={i} style={{marginBottom:dark?14:10}}>
                <div style={{display:"flex", alignItems:"center", gap:6, flexWrap:"wrap"}}>
                  <span style={{fontSize:dark?13:12, color:tc}}>{avant} →</span>
                  {estVide
                    ? <div style={{flex:1, borderBottom:`1.5px solid ${lc}`, height:1, minWidth:80, marginTop:4}}></div>
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
    const isMulti = ex.type?.includes("multiplication") || ex.type?.includes("tables") || ex.title?.toLowerCase().includes("multiplication") || ex.title?.toLowerCase().includes("table");
    const calcItems = lignes
      .map(l => l.replace(/^\d+[\.\)]\s*/, "").replace(/_{2,}/g, "").trimEnd())
      .filter(Boolean)
      .slice(0, 18);
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
        <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"14px 16px"}}>
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
        return <div key={i} style={{fontSize:dark?13:12, color:tc, lineHeight:2.1, marginBottom:2}}>{trim}</div>;
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

    for (let idx = 0; idx < types.length; idx++) {
      const st = types[idx];
      if (idx > 0) await sleep(6000);
      try {
        const corpusData = await sbCorpus(st);
        const modele = corpusData?.contenu || null;
        const exFormat = corpusData?.format || 'libre';

        const isConjType  = st.includes("present")||st.includes("imparfait")||st.includes("futur")||st.includes("passe")||st.includes("conditionnel")||st.includes("identification");
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

        const dur = Math.max(5, Math.round((weeklyConfig.duration||25)/types.length));
        const regles = [];

        if (isConjType && !isTranspo) {
          const temps = st.includes("present")?"présent":st.includes("imparfait")?"imparfait":st.includes("futur")?"futur":"passé composé";
          regles.push(`TYPE : CONJUGAISON.
FORMAT OBLIGATOIRE :
- lignes = ["VERBE1 — ${temps}", "VERBE2 — ${temps}"] (2 verbes uniquement)
- NE PAS inclure les pronoms dans lignes
- example = consigne sans réponses`);
        }

        if (isTranspo) {
          // géré par prompt dédié plus bas — pas de règle générique
        }

        if (isNeg) {
          const negType = st.includes("plus")?"NE...PLUS":st.includes("jamais")?"NE...JAMAIS":"NE...PAS";
          const negPas  = st.includes("plus")?"plus":st.includes("jamais")?"jamais":"pas";
          regles.push(`TYPE : NÉGATION avec ${negType}.
- Chaque ligne = phrase AFFIRMATIVE numérotée se terminant par "→", jamais la réponse après
- Sujets variés (il, elle, nous, tu, ils, prénom...)
- example = "Il joue au foot. → Il ne joue ${negPas} au foot."`);
        }

        if (isTablesType) {
          regles.push(`TYPE : MULTIPLICATION — Tables mélangées de 1 à 10.
- Exactement 18 items dans lignes (3 colonnes × 6)
- Format lignes : ["4 × 6 =","7 × 8 =","3 × 9 =", ...]
- Sans tirets dans lignes
- Mélange varié de toutes les tables de 1 à 10
- example = "" (vide)`);
        } else if (isCalcType) {
          const calcType = st.includes("multiplication")?"MULTIPLICATION (× uniquement)":st.includes("soustraction")?"SOUSTRACTION (− uniquement)":st.includes("addition")?"ADDITION (+ uniquement)":"DIVISION (÷ uniquement)";
          const calcEx   = st.includes("multiplication")?`["4 × 6 =","7 × 8 =","3 × 9 ="]`:st.includes("soustraction")?`["85 − 47 =","63 − 28 =","91 − 54 ="]`:st.includes("addition")?`["43 + 29 =","67 + 35 =","58 + 26 ="]`:`["24 ÷ 4 =","36 ÷ 6 =","45 ÷ 9 ="]`;
          const calcExemple = st.includes("multiplication")?"4 × 6 = 24 (car 6 × 4 = 24)":st.includes("soustraction")?"85 − 47 = 38 (on pose et on soustrait colonne par colonne)":st.includes("addition")?"43 + 29 = 72 (on pose et on additionne colonne par colonne)":"48 ÷ 6 = 8 (car 6 × 8 = 48)";
          regles.push(`TYPE : ${calcType} — UNIQUEMENT ce type, jamais mélanger.
- Exactement 15 items dans lignes (3 colonnes × 5)
- Format : ${calcEx}
- Sans tirets dans lignes
- example = "${calcExemple}" — UNE SEULE ligne claire, format : opération = résultat (explication courte)`);
        }

        if (isEncadr) regles.push(`TYPE : NUMÉRATION. Minimum 6 items dans lignes.`);

        if (isProbl) {
          regles.push(`TYPE : PROBLÈME.
- example = solution complète multi-lignes avec calculs détaillés
- lignes = énoncé de Léo avec blancs ___ uniquement, JAMAIS les réponses
- Chiffres différents de l example`);
        }

        if (isDictee) {
          regles.push(`TYPE : DICTÉE.
- lignes[0] = "MOTS À PRÉPARER : mot1 | mot2 | mot3 | mot4 | mot5"
- lignes[1..n] = phrases du texte`);
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

        if (isFamilles) {
          regles.push(`TYPE : FAMILLES DE MOTS.
RÈGLES ABSOLUES :
1. instructions = "Trouve des mots de la même famille que le mot en majuscules."
2. example = "MER → marin, maritime, amerrir" (mot racine en majuscules → exemples de mots dérivés)
3. lignes = 5 lignes format exact avec des mots simples que les enfants de CE1/CE2 connaissent bien.
   Choisis parmi ces mots racines adaptés à l age : PAIN, LAIT, FLEUR, BOIS, MAISON, MAIN, DENT, NUIT, JOUR, NEIGE, PLUIE, VENT, HERBE, CHAMP, SOLEIL, TERRE, EAU, FEU, CHAT, CHIEN
   Format : ["1. MOT →", "2. MOT →", "3. MOT →", "4. MOT →", "5. MOT →"]
4. Les mots racines dans lignes doivent être DIFFÉRENTS de MER (le mot de l example)
5. JAMAIS écrire les mots dérivés dans lignes — l enfant les trouve lui-même
6. parentNote = "" (vide)`);
        } else if (isVocabType) {
          regles.push(`TYPE : VOCABULAIRE.
RÈGLES ABSOLUES :
1. Les mots utilisés dans "example" NE DOIVENT PAS apparaître dans "lignes"
2. lignes = uniquement questions/mots à compléter, sans réponses
3. parentNote = "" (vide)`);
        }

        const reglesTxt = regles.join("\n\n");

        if (isTranspo) {
          const transpoPrompt = `Tu es instituteur CE1/CE2. Génère un exercice de transposition MÉLANGÉ niveau ${niv}.
L exercice contient 5 phrases, chacune avec un TYPE DIFFÉRENT de transposition :
- Type A : remplacer IL par ELLE (ou ELLE par IL)
- Type B : remplacer TU par JE (ou JE par TU)
- Type C : remplacer IL/ELLE par ILS/ELLES (singulier → pluriel)
- Type D : remplacer NOUS par ILS/ELLES
- Type E : remplacer un prénom singulier par un prénom pluriel (ex: "Léa joue" → "Léa et Tom jouent")
RÈGLES ABSOLUES :
1. Chaque ligne = "N. [phrase originale] → [nouveau sujet] _______________" — les underscores représentent l espace pour écrire la suite
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

        if (isNeg) {
          const negType = st.includes("plus")?"NE...PLUS":st.includes("jamais")?"NE...JAMAIS":"NE...PAS";
          const negPas  = st.includes("plus")?"plus":st.includes("jamais")?"jamais":"pas";
          const negPrompt = `Tu es instituteur CE1/CE2. Génère 5 phrases de négation ${negType} niveau ${niv}.
RÈGLES ABSOLUES :
- lignes = 5 phrases AFFIRMATIVES numérotées, chacune se terminant par " →" UNIQUEMENT
- JAMAIS écrire la forme négative dans lignes — l enfant le fait lui-même
- Sujets variés : il, elle, nous, tu, ils, prénom d enfant
- Phrases courtes et simples, vocabulaire CE1/CE2
- example = UN exemple résolu : phrase affirmative → forme négative complète
JSON uniquement : {"title":"Négation avec ${negType}","emoji":"✏️","duration":"${dur} min","instructions":"Transforme chaque phrase à la forme négative avec ${negType}","example":"Il joue au foot. → Il ne joue ${negPas} au foot.","lignes":["1. Elle mange une pomme. →","2. Nous courons vite. →","3. Tu lis un livre. →","4. Il regarde la télévision. →","5. Elles jouent dans le jardin. →"],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;
          try {
            const raw = await callAPI(negPrompt, "exercice");
            const clean = raw.replace(/```json|```/g,"").trim();
            const obj = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
            if (obj.title) exercises.push({type:st, format:'fleche', ...obj});
          } catch(e) { console.error("Erreur négation",st,e); }
          continue;
        }

        const prompt = modele
          ? `Tu es instituteur CE1/CE2 expert. Exercice pour ${CHILD_NAME}, niveau ${niv}.
MODÈLE PROGRAMME NATIONAL :
---
${modele.slice(0,600)}
---
Même structure, renouvelle uniquement les valeurs.
${reglesTxt}
${focStr?`CONTRAINTES :\n${focStr}`:""}
RÈGLE ANTI-RÉPONSES : dans "lignes", jamais les réponses — uniquement questions et blancs ___.
JSON uniquement :
{"title":"titre précis","emoji":"...","duration":"${dur} min","instructions":"consigne claire CE1","example":"exemple résolu","lignes":[...],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`
          : `Tu es instituteur CE1/CE2 expert. Exercice "${st.replace(/_/g," ")}" pour ${CHILD_NAME}, niveau ${niv}.
${reglesTxt}
${focStr?`CONTRAINTES :\n${focStr}`:""}
JSON uniquement :
{"title":"titre précis","emoji":"...","duration":"${dur} min","instructions":"consigne claire CE1","example":"","lignes":[...],"parentNote":"","verbsUsed":[],"wordsUsed":[]}`;

        const raw   = await callAPI(prompt,"exercice");
        const clean = raw.replace(/```json|```/g,"").trim();
        const obj   = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0]||"{}");
        if(obj.title) exercises.push({type:st, format:exFormat, ...obj});

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
    app:{minHeight:"100vh",background:"linear-gradient(160deg,#020817 0%,#0f172a 40%,#1a103a 70%,#0c1220 100%)",fontFamily:"Georgia,serif",color:"white",paddingBottom:90},
    hdr:{background:"rgba(2,8,23,.9)",borderBottom:"1px solid rgba(99,102,241,.2)",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:100,boxShadow:"0 4px 30px rgba(0,0,0,.5)"},
    card:{background:"rgba(15,23,42,.7)",border:"1px solid rgba(99,102,241,.15)",borderRadius:20,padding:20,marginBottom:16,backdropFilter:"blur(10px)",boxShadow:"0 8px 32px rgba(0,0,0,.3)"},
    btn:{background:"linear-gradient(135deg,#4f46e5,#7c3aed)",border:"none",borderRadius:16,padding:"15px 24px",color:"white",fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,cursor:"pointer",width:"100%",boxShadow:"0 4px 20px rgba(99,102,241,.4)",transition:"transform .15s,box-shadow .15s"},
    btnSm:{background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.3)",borderRadius:12,padding:"8px 16px",color:"#a5b4fc",fontFamily:"Georgia,serif",fontSize:13,cursor:"pointer"},
    tog:(on)=>({background:on?"linear-gradient(135deg,#4f46e5,#7c3aed)":"rgba(15,23,42,.6)",border:`1px solid ${on?"#6366f1":"rgba(99,102,241,.2)"}`,borderRadius:14,padding:"10px 16px",color:on?"white":"#64748b",fontFamily:"Georgia,serif",fontSize:13,fontWeight:on?700:400,cursor:"pointer",transition:"all .2s",boxShadow:on?"0 4px 15px rgba(99,102,241,.3)":"none"}),
    tab:(on)=>({flex:1,padding:"14px 4px 10px",background:on?"rgba(99,102,241,.15)":"transparent",border:"none",borderBottom:on?"2px solid #818cf8":"2px solid transparent",color:on?"#a5b4fc":"#475569",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all .2s"}),
    nav:{position:"fixed",bottom:0,left:0,right:0,background:"rgba(2,8,23,.97)",borderTop:"1px solid rgba(99,102,241,.2)",display:"flex",zIndex:200,backdropFilter:"blur(20px)"},
    navB:(a)=>({flex:1,padding:"12px 4px",background:"none",border:"none",color:a?"#818cf8":"#334155",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"color .2s"}),
    inp:{background:"rgba(15,23,42,.8)",border:"1px solid rgba(99,102,241,.2)",borderRadius:12,padding:"12px 16px",color:"white",fontFamily:"Georgia,serif",fontSize:14,width:"100%",outline:"none",resize:"vertical"},
    badge:(c)=>({background:c+"20",border:`1px solid ${c}40`,borderRadius:20,padding:"4px 14px",fontSize:12,color:c,fontWeight:700,display:"inline-block"}),
    wrap:{padding:"0 16px",maxWidth:600,margin:"0 auto"},
  };

  if(loading)return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#020817"}}><div style={{textAlign:"center"}}><Raton items={[]} size={100} anim/><div style={{color:"#a5b4fc",fontFamily:"Georgia,serif",marginTop:16}}>Chargement…</div></div></div>);

  const li  = lvl(prof.totalPoints);
  const ulk = unlocked(prof.totalPoints,prof.unlockedBonusItems||[]);
  const eqp = (prof.equippedItems||[]).map(e=>ITEMS.find(i=>i.e===e)).filter(Boolean);

  if(gen) return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#020817 0%,#0f172a 40%,#1a103a 70%,#0c1220 100%)"}}>
      <div style={{textAlign:"center",padding:"0 32px"}}>
        <Raton items={eqp} size={120} anim/>
        <div style={{marginTop:24,fontSize:18,fontWeight:700,color:"#a5b4fc",fontFamily:"Georgia,serif"}}>Roki prépare ta séance…</div>
        <div style={{marginTop:8,fontSize:13,color:"#475569",fontFamily:"Georgia,serif"}}>Génération en cours, ça peut prendre 20–30 secondes</div>
        <div style={{marginTop:24,display:"flex",justifyContent:"center",gap:8}}>
          {[0,1,2].map(i=>(<div key={i} style={{width:10,height:10,borderRadius:"50%",background:"#6366f1",animation:"pulse 1.2s ease-in-out infinite",animationDelay:`${i*0.3}s`}}/>))}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  );

  if(print&&session)return(
    <div style={{fontFamily:"Arial,sans-serif",padding:"10mm 12mm",color:"#1e293b",background:"white"}}>
      <style>{`@page{size:A4;margin:10mm 12mm;}@media print{body{margin:0;}}`}</style>
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
                  <div><div style={{fontWeight:700,fontSize:15,color:"#e2e8f0"}}>Exercice {i+1} — {ex.title}</div><div style={{fontSize:12,color:"#475569"}}>⏱ {ex.duration}</div></div>
                </div>
                {!hideInstructions(ex.type)&&<div style={{background:"rgba(99,102,241,.1)",borderRadius:12,padding:"10px 14px",marginBottom:10,fontSize:13,color:"#a5b4fc",fontStyle:"italic",borderLeft:"2px solid #6366f1"}}>📌 {ex.instructions}</div>}
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
                        {CATEGORIES[selCat].map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                      </select>
                    )}
                    <button style={{...S.btnSm,padding:"10px 16px"}} onClick={()=>{
                      if(!selSub){toast$("Choisis un type !","#f59e0b");return;}
                      if(mesure.includes(selSub)){toast$("Déjà ajouté !","#f59e0b");return;}
                      setMesure(p=>[...p,selSub]);
                      toast$(`✅ ${selSub.replace(/_/g," ")} ajouté`);
                    }}>+ Ajouter</button>
                  </div>
                  {mesure.length>0&&(
                    <div style={{marginBottom:14}}>
                      <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>Exercices sélectionnés :</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {mesure.map((s,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.3)",borderRadius:10,padding:"4px 10px"}}>
                            <span style={{fontSize:12,color:"#a5b4fc"}}>{s.replace(/_/g," ")}</span>
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
