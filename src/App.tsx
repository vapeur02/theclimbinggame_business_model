import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

// 👇 PASTE YOUR SUPABASE URL AND KEY HERE:
const supabaseUrl = "https://pqqwmiwmuvcnixgmxkof.supabase.co";
const supabaseKey = "sb_publishable_YcGeop_U8cCprzsEu4Z21w_lIqNUrgx";
const supabase = createClient(supabaseUrl, supabaseKey);

/* ═══ STRAVA-INSPIRED DESIGN TOKENS ═══ */
const T = {
  bg: "#FFFFFF", bgSub: "#F7F7F7", bgCard: "#FFFFFF",
  border: "#E8E8E8", borderLight: "#F0F0F0",
  text: "#242428", textSec: "#6B6B76", textTer: "#9E9EA7",
  orange: "#FC4C02", orangeLight: "#FFF0E8", orangeMid: "#FF7A3D",
  green: "#00B84D", greenLight: "#E6F9EE",
  blue: "#0077CC", blueLight: "#E8F4FD",
  purple: "#6B4FBB", purpleLight: "#F0ECF9",
  red: "#E0321C", redLight: "#FDE8E6",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
};

/* ═══ ICONS ═══ */
const SVG={layers:"M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",store:"M3 9l1-4h16l1 4M3 9h18M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9M9 21V13h6v8",users:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",database:"M12 2C6.48 2 2 3.79 2 6s4.48 4 10 4 10-1.79 10-4-4.48-4-10-4zM2 6v6c0 2.21 4.48 4 10 4s10-1.79 10-4V6M2 12v6c0 2.21 4.48 4 10 4s10-1.79 10-4v-6",trending:"M23 6l-9.5 9.5-5-5L1 18M17 6h6v6"};
const Ic=({n,s=20,c=T.text,w=1.5})=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"><path d={SVG[n]||SVG.layers}/></svg>);

/* ═══ FORMAT ═══ */
const fmt=n=>{if(Math.abs(n)>=1e6)return`€${(n/1e6).toFixed(1)}M`;if(Math.abs(n)>=1e3)return`€${(n/1e3).toFixed(Math.abs(n)>=1e4?0:1)}K`;return`€${Math.round(n)}`};
const fU=n=>{if(n>=1e6)return`${(n/1e6).toFixed(1)}M`;if(n>=1e3)return`${(n/1e3).toFixed(n>=1e4?0:1)}K`;return`${Math.round(n)}`};

/* ═══ MODELS & CITIES & RANGES ═══ */
const MODELS=[
  {id:"consumer_sub",name:"Consumer Subscription",tag:"Individual climbers pay €5–8/mo for analytics, training plans, and advanced social features",icon:"layers",color:T.orange,colorLight:T.orangeLight,who:"Individual climbers",what:"Analytics, training, social",excl:"Only individual subscription revenue.",desc:"Free logbook aggregates all platforms. Premium unlocks grade pyramids, progression analytics, weakness detection, training plans. The Strava playbook.",
    moat:["0–6mo: None","6–18mo: Switching cost (history)","18–36mo: Network effects","3yr+: Data moat"],
    risks:[{r:"Low conversion — climbers expect free",s:4,m:"Premium = 'coach in pocket', not paywall"},{r:"Platform APIs restricted",s:3,m:"Direct partnerships + manual fallback"},{r:"AI competitor clones features",s:4,m:"Community + data are the moat"},{r:"Churn after novelty",s:3,m:"Social hooks, monthly insights email"}]},
  {id:"b2b_saas",name:"B2B SaaS",tag:"Gyms pay €99–249/mo for member analytics dashboards; brands pay for market intelligence",icon:"database",color:T.purple,colorLight:T.purpleLight,who:"Gyms, federations, brands",what:"Dashboards, insights, intelligence",excl:"Only business software subscription revenue.",desc:"Gyms pay for dashboards: engagement, route heatmaps, setter performance, retention. Brands pay for market intelligence. Consumer app is 100% free.",
    moat:["0–12mo: None — need data first","12–24mo: Cross-gym data density","2–3yr: Workflow lock-in","3yr+: Proprietary data moat"],
    risks:[{r:"Chicken-and-egg: users vs data",s:5,m:"Consumer app must standalone. Wait for 5K+ users"},{r:"Gyms won't pay — tight margins",s:4,m:"Price below TopLogger Pro. Show retention ROI"},{r:"Privacy backlash",s:3,m:"Aggregated/anonymised only"},{r:"TopLogger builds same B2B",s:4,m:"Cross-gym aggregation = your moat"}]},
  {id:"marketplace",name:"Marketplace",tag:"Take 12–20% commission on coaching bookings, guided trips, gear trades, and event tickets",icon:"store",color:T.blue,colorLight:T.blueLight,who:"Buyers & sellers",what:"Coaching, trips, gear, tickets",excl:"Only transaction commission revenue.",desc:"Coaches sell plans, gyms sell passes, guides sell trips, climbers trade gear. You take 10–20% of every transaction.",
    moat:["0–6mo: None — cold start","6–12mo: Liquidity in one vertical","1–2yr: Two-sided effects","3yr+: Multi-sided lock-in"],
    risks:[{r:"Cold start — no supply/demand",s:5,m:"Recruit supply first. Guarantee minimums"},{r:"Disintermediation",s:4,m:"Payment protection, reviews, rebooking"},{r:"Low transaction volume",s:4,m:"Focus high-value transactions"},{r:"Viator/GetYourGuide compete",s:2,m:"Climbing-specific differentiation"}]},
  {id:"sponsorship",name:"Sponsorship & Media",tag:"Climbing brands pay for sponsored challenges, athlete content, and audience access. App is 100% free",icon:"users",color:T.green,colorLight:T.greenLight,who:"Climbing brands, sponsors",what:"Challenges, content, partnerships",excl:"Only brand partnership revenue.",desc:"App 100% free. Revenue from sponsored challenges, branded leaderboards, pro athlete content, native ads.",
    moat:["0–12mo: None — need audience first","12–24mo: Audience density","2–3yr: Pro athlete exclusives","3yr+: Brand = community identity"],
    risks:[{r:"Need 10K+ users first",s:5,m:"Patience + runway. Hybrid with Consumer Sub"},{r:"Tiny brand budgets vs cycling",s:4,m:"Only precise digital channel for climbing"},{r:"Revenue unpredictable",s:4,m:"Annual retainers, diversify"},{r:"Users dislike ads",s:3,m:"Sponsored challenges = content"}]},
];

const CITIES={
  barcelona:{name:"Barcelona",tam:15000,gyms:10,info:"Sharma BCN/Gavà, Bloc District, Climbat, Monobloc, Deu Dits, Freebloc, Kimera. Crags: Montserrat, Siurana, Margalef."},
  lisbon:{name:"Lisbon",tam:8000,gyms:6,info:"Vertigo, 9.8 Gravity, Escala25 (bridge gym), Altissimo. Expat/nomad community. Outdoor: Sintra, Cascais."},
  paris:{name:"Paris",tam:40000,gyms:25,info:"Arkose (5+ locs), Climb Up (5,000m²), Climbing District, Block'Out. Post-2024 Olympics boom. Fontainebleau 1hr."},
  amsterdam:{name:"Amsterdam",tam:12000,gyms:8,info:"Monk, Beest Boulders (3,400m²), Beta Boulders, Het Lab, Climbing Network. TopLogger strong. NCC opening 2026."},
};

const RANGES={
  consumer_sub:{growth:{min:0.02,max:0.30,lo:0.08,hi:0.15,label:"Monthly growth",fmt:"pct"},activation:{min:0.20,max:0.90,lo:0.45,hi:0.65,label:"Activation rate",fmt:"pct"},conversion:{min:0.01,max:0.20,lo:0.03,hi:0.08,label:"Free → Paid",fmt:"pct"},price:{min:1.99,max:14.99,lo:3.99,hi:7.99,label:"Price / mo",fmt:"eur"},churn:{min:0.01,max:0.15,lo:0.04,hi:0.08,label:"Monthly churn",fmt:"pct"},expansion:{min:1,max:10,lo:2,hi:5,label:"Yr2 expansion",fmt:"num"},dev:{min:0,max:15000,lo:2000,hi:5000,label:"Dev cost / mo",fmt:"eur"},marketing:{min:0,max:5000,lo:200,hi:1000,label:"Marketing / mo",fmt:"eur"}},
  b2b_saas:{growth:{min:0.02,max:0.25,lo:0.06,hi:0.12,label:"Monthly growth",fmt:"pct"},activation:{min:0.20,max:0.90,lo:0.40,hi:0.60,label:"Activation rate",fmt:"pct"},gymConv:{min:0.05,max:0.80,lo:0.15,hi:0.40,label:"Gym conversion",fmt:"pct"},gymPrice:{min:49,max:499,lo:99,hi:249,label:"Gym price / mo",fmt:"eur"},brandDeals:{min:0,max:15,lo:1,hi:5,label:"Brand deals yr2",fmt:"num"},brandValue:{min:1000,max:25000,lo:3000,hi:8000,label:"Deal value",fmt:"eur"},dev:{min:0,max:15000,lo:2000,hi:5000,label:"Dev cost / mo",fmt:"eur"},marketing:{min:0,max:5000,lo:100,hi:500,label:"Marketing / mo",fmt:"eur"}},
  marketplace:{growth:{min:0.02,max:0.25,lo:0.05,hi:0.10,label:"Monthly growth",fmt:"pct"},activation:{min:0.20,max:0.80,lo:0.35,hi:0.55,label:"Activation rate",fmt:"pct"},guides:{min:2,max:50,lo:5,hi:15,label:"Guides",fmt:"num"},tripsPerGuide:{min:1,max:15,lo:2,hi:6,label:"Trips/guide/mo",fmt:"num"},tripPrice:{min:30,max:300,lo:60,hi:120,label:"Avg trip price",fmt:"eur"},takeRate:{min:0.05,max:0.30,lo:0.12,hi:0.20,label:"Take rate",fmt:"pct"},coaching:{min:5,max:200,lo:15,hi:50,label:"Coach sessions/mo",fmt:"num"},dev:{min:0,max:15000,lo:2500,hi:6000,label:"Dev cost / mo",fmt:"eur"},marketing:{min:0,max:5000,lo:300,hi:800,label:"Marketing / mo",fmt:"eur"}},
  sponsorship:{growth:{min:0.05,max:0.30,lo:0.10,hi:0.20,label:"Monthly growth",fmt:"pct"},activation:{min:0.30,max:0.90,lo:0.50,hi:0.70,label:"Activation rate",fmt:"pct"},deals1:{min:0,max:10,lo:1,hi:3,label:"Deals yr1",fmt:"num"},val1:{min:500,max:10000,lo:1000,hi:3000,label:"Value yr1",fmt:"eur"},deals2:{min:0,max:20,lo:4,hi:10,label:"Deals yr2",fmt:"num"},val2:{min:1000,max:25000,lo:3000,hi:8000,label:"Value yr2",fmt:"eur"},deals3:{min:0,max:30,lo:8,hi:18,label:"Deals yr3",fmt:"num"},val3:{min:2000,max:50000,lo:5000,hi:15000,label:"Value yr3",fmt:"eur"},content:{min:0,max:5000,lo:300,hi:800,label:"Content / mo",fmt:"eur"},dev:{min:0,max:15000,lo:2000,hi:4000,label:"Dev cost / mo",fmt:"eur"},marketing:{min:0,max:5000,lo:500,hi:1200,label:"Marketing / mo",fmt:"eur"}},
};

const mkDef=(cks,mid)=>{const tam=cks.reduce((s,c)=>s+CITIES[c].tam,0);const gyms=cks.reduce((s,c)=>s+CITIES[c].gyms,0);const R=RANGES[mid];const d={};Object.entries(R).forEach(([k,r])=>{d[k]=Math.round(((r.lo+r.hi)/2)*1000)/1000;});d.tam=tam;if(mid==="b2b_saas")d.gyms=gyms;if(mid==="marketplace"){d.guides=Math.max(3,Math.floor(gyms*0.8));d.coaching=Math.floor(tam/500);d.gearTx=Math.floor(tam/750);d.coachPrice=60;d.gearPrice=45;}return d;};

/* ═══ PROJECTION ═══ */
function project(id,a,numCities=1){
  const out=[];let users=0,paid=0;
  const cityMktMult = 1 + (numCities - 1) * 0.4;  
  const cityDevMult = 1 + (numCities - 1) * 0.2;   
  const cityOps = (numCities - 1) * 200;             
  for(let m=0;m<=36;m++){
    const exp=m>=12?(a.expansion||1):1;const tam=(a.tam||15000)*exp;
    if(m>0){const gr=(a.growth||0.10)*(1-users/tam);users=Math.min(tam,users+Math.max(0,Math.floor(users*gr+(m<=3?30*numCities:0))));}
    const active=Math.floor(users*(a.activation||0.6));
    let baseDev = (a.dev||0) * cityDevMult;
    let baseMkt = (a.marketing||0) * cityMktMult;
    let baseContent = (a.content||0) || 0;
    let cost = baseDev + baseMkt + baseContent + cityOps;
    if(m>=12)cost*=1.4;if(m>=24)cost*=1.25;
    let rev=0;
    if(id==="consumer_sub"){if(m>=6){paid=Math.floor(active*(a.conversion||0.055)*Math.pow(1-(a.churn||0.06),Math.max(0,m-6)));rev=paid*(a.price||5.99);}}
    else if(id==="b2b_saas"){if(m>=12){const g=Math.floor((a.gyms||10)*exp*(a.gymConv||0.275)*Math.min(1,(m-12)/12));rev=g*(a.gymPrice||174);}if(m>=24)rev+=(a.brandDeals||3)*(a.brandValue||5500)/12;}
    else if(id==="marketplace"){if(m>=3){const s=Math.min(1,(m-3)/12)*exp;rev=(a.guides||8)*s*(a.tripsPerGuide||4)*(a.tripPrice||90)*(a.takeRate||0.16)+(a.coaching||30)*s*(a.coachPrice||60)*(a.takeRate||0.16)+(a.gearTx||20)*s*(a.gearPrice||45)*(a.takeRate||0.16);}}
    else if(id==="sponsorship"){if(m>=6&&m<12)rev=(a.deals1||2)*(a.val1||2000)/6;else if(m>=12&&m<24)rev=(a.deals2||7)*(a.val2||5500)/12;else if(m>=24)rev=(a.deals3||13)*(a.val3||10000)/12;}
    out.push({month:m,users:Math.round(users),active,revenue:Math.round(rev),costs:Math.round(cost),profit:Math.round(rev-cost),arr:Math.round(rev*12),paid});
  }return out;
}

function combine(ids,asmpt,numCities=1){
  const all=ids.map(id=>project(id,asmpt[id],numCities));
  const modelDiscount = ids.length === 1 ? 1 : ids.length === 2 ? 0.75 : 0.65;
  return Array.from({length:37},(_,i)=>{
    const rev=all.reduce((s,a)=>s+a[i].revenue,0);
    const rawCosts=all.reduce((s,a)=>s+a[i].costs,0);
    const costs=Math.round(rawCosts*modelDiscount);
    return {month:i,users:Math.max(...all.map(a=>a[i].users)),revenue:Math.round(rev),costs,profit:Math.round(rev-costs),arr:Math.round(rev*12)};
  });
}

/* ═══ CHART ═══ */
function Chart({data,lines,h=180}){
  const ref=useRef(null);
  useEffect(()=>{const c=ref.current;if(!c||!data?.length)return;const ctx=c.getContext("2d");const dpr=window.devicePixelRatio||1;const w=c.clientWidth,ht=c.clientHeight;c.width=w*dpr;c.height=ht*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,ht);
    const p={t:16,r:12,b:26,l:52},cw=w-p.l-p.r,ch=ht-p.t-p.b;
    const vals=lines.flatMap(l=>data.map(d=>d[l.key]));const mx=Math.max(...vals,1),mn=Math.min(...vals,0),rng=mx-mn||1;
    for(let i=0;i<=4;i++){const y=p.t+(i/4)*ch;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(w-p.r,y);ctx.strokeStyle=T.borderLight;ctx.lineWidth=1;ctx.stroke();const v=mx-(i/4)*rng;ctx.fillStyle=T.textTer;ctx.font="10px Inter,system-ui,sans-serif";ctx.textAlign="right";ctx.fillText(v>=1e3?`${(v/1e3).toFixed(0)}K`:Math.round(v),p.l-8,y+4);}
    [0,6,12,18,24,30,36].forEach(mo=>{const idx=data.findIndex(d=>d.month===mo);if(idx>=0){const x=p.l+(idx/(data.length-1))*cw;ctx.fillStyle=T.textTer;ctx.font="10px Inter,system-ui,sans-serif";ctx.textAlign="center";ctx.fillText(`${mo}`,x,ht-6);}});
    if(mn<0){const zy=p.t+ch-((0-mn)/rng)*ch;ctx.beginPath();ctx.moveTo(p.l,zy);ctx.lineTo(w-p.r,zy);ctx.strokeStyle=T.border;ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);}
    lines.forEach(l=>{
      ctx.beginPath();data.forEach((d,i)=>{const x=p.l+(i/(data.length-1))*cw,y=p.t+ch-((d[l.key]-mn)/rng)*ch;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
      const bY=p.t+ch-((Math.max(0,-mn))/rng)*ch;ctx.lineTo(p.l+cw,mn>=0?p.t+ch:bY);ctx.lineTo(p.l,mn>=0?p.t+ch:bY);ctx.closePath();
      const g=ctx.createLinearGradient(0,p.t,0,ht-p.b);g.addColorStop(0,l.color+"20");g.addColorStop(1,l.color+"04");ctx.fillStyle=g;ctx.fill();
      ctx.beginPath();data.forEach((d,i)=>{const x=p.l+(i/(data.length-1))*cw,y=p.t+ch-((d[l.key]-mn)/rng)*ch;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.strokeStyle=l.color;ctx.lineWidth=2.5;ctx.lineJoin="round";ctx.stroke();
      const last=data[data.length-1];const lx=p.l+((data.length-1)/(data.length-1))*cw;const ly=p.t+ch-((last[l.key]-mn)/rng)*ch;
      ctx.beginPath();ctx.arc(lx,ly,4,0,Math.PI*2);ctx.fillStyle=l.color;ctx.fill();ctx.beginPath();ctx.arc(lx,ly,2,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();
    });
  },[data,lines]);
  return <canvas ref={ref} style={{width:"100%",height:h,display:"block"}}/>;
}

/* ═══ SLIDER ═══ */
function Slider({label,value,onChange,min,max,lo,hi,format,color=T.orange,tip}){
  const disp=format==="pct"?`${(value*100).toFixed(1)}%`:format==="eur"?`€${Math.round(value).toLocaleString()}`:Math.round(value).toLocaleString();
  const pL=((lo-min)/(max-min))*100,pH=((hi-min)/(max-min))*100;
  const st=format==="pct"?0.01:format==="eur"?(max>1000?50:1):1;
  return(<div style={{marginBottom:12}}>
    <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:3}}>
      <span style={{color:T.textSec}} title={tip}>{label}</span>
      <span style={{color:T.text,fontWeight:600}}>{disp}</span>
    </div>
    <div style={{position:"relative",height:22}}>
      <div style={{position:"absolute",top:9,left:`${pL}%`,width:`${pH-pL}%`,height:4,background:color+"25",borderRadius:2,pointerEvents:"none",zIndex:0}}/>
      <input type="range" min={min} max={max} step={st} value={value} onChange={e=>onChange(Number(e.target.value))} style={{width:"100%",position:"relative",zIndex:1}}/>
    </div>
    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.textTer,marginTop:-1}}>
      <span>{format==="pct"?`${(lo*100).toFixed(0)}%`:format==="eur"?`€${lo}`:lo}</span>
      <span style={{color:T.textTer,fontSize:9}}>probable range</span>
      <span>{format==="pct"?`${(hi*100).toFixed(0)}%`:format==="eur"?`€${hi}`:hi}</span>
    </div>
  </div>);
}

/* ═══ MAIN ═══ */
export default function App(){
  const [selM,setSelM]=useState(["consumer_sub"]);
  const [selC,setSelC]=useState(["barcelona"]);
  const [asmpt,setAsmpt]=useState(()=>{const a={};MODELS.forEach(m=>{a[m.id]=mkDef(["barcelona"],m.id);});return a;});
  const [chartV,setChartV]=useState("revenue");
  const [tab,setTab]=useState("chart");
  
  // REAL-TIME STATE FOR COMMENTS
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // FETCH COMMENTS FROM SUPABASE
  useEffect(() => {
    fetchComments();
    
    // Set up real-time listener to instantly show partner's new comments
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, payload => {
        setComments(current => [...current, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) setComments(data);
  };

  const toggleM=id=>{setSelM(p=>{const n=p.includes(id)?p.filter(x=>x!==id):[...p,id].slice(0,3);return n.length?n:[id];});};
  const toggleC=ck=>{
    const n=selC.includes(ck)?selC.filter(x=>x!==ck):[...selC,ck];if(!n.length)return;setSelC(n);
    setAsmpt(prev=>{const a={...prev};MODELS.forEach(m=>{a[m.id]={...a[m.id],tam:n.reduce((s,c)=>s+CITIES[c].tam,0),gyms:n.reduce((s,c)=>s+CITIES[c].gyms,0)};});return a;});
  };
  const upd=useCallback((mid,k,v)=>setAsmpt(p=>({...p,[mid]:{...p[mid],[k]:v}})),[]);
  
// POST COMMENT TO SUPABASE
const handleAddComment = async () => {
  if(!newComment.trim() || !supabaseUrl.includes('supabase.co')) return;
  setIsPosting(true);
  
  const currentScenarioLabel = `${selM.map(m=>MODELS.find(x=>x.id===m).name).join(" + ")} in ${selC.map(c=>CITIES[c].name).join(", ")}`;
  
  const { error } = await supabase
    .from('comments')
    .insert([{ 
      author: "Founder", 
      role: "Admin", 
      text: newComment, 
      scenario: currentScenarioLabel 
    }]);
    
  setIsPosting(false);
  
  // 👇 THIS IS THE NEW ERROR POPUP LOGIC
  if (!error) {
    setNewComment("");
  } else {
    alert("Supabase Error: " + error.message);
    console.log("Full Supabase Error:", error);
  }
};

  const prim=MODELS.find(m=>m.id===selM[0]);
  const numCities = selC.length;
  const indiv=useMemo(()=>{const r={};MODELS.forEach(m=>{r[m.id]=project(m.id,asmpt[m.id],numCities);});return r;},[asmpt,numCities]);
  const comb=useMemo(()=>combine(selM,asmpt,numCities),[selM,asmpt,numCities]);
  const last=comb[comb.length-1]||{};
  const be=comb.findIndex(p=>p.profit>0);

  const card={background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:10,padding:18,boxShadow:T.shadow};
  const lbl={fontSize:11,fontWeight:600,color:T.textTer,textTransform:"uppercase",letterSpacing:"0.3px",marginBottom:8};

  return(<div style={{minHeight:"100vh",background:T.bgSub,color:T.text,fontFamily:"Inter,system-ui,-apple-system,sans-serif"}}>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
    <style>{`input[type=range]{-webkit-appearance:none;height:4px;border-radius:3px;background:${T.border};outline:none;cursor:pointer} input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:${T.orange};cursor:pointer;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.2)} *{box-sizing:border-box} ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}`}</style>

    {/* ═══ HEADER ═══ */}
    <div style={{background:T.bg,borderBottom:`1px solid ${T.border}`,padding:"16px 28px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:32,height:32,borderRadius:8,background:T.orange,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="trending" s={18} c="#fff" w={2.5}/></div>
          <div>
            <h1 style={{fontSize:18,fontWeight:800,margin:0,color:T.text,letterSpacing:"-0.3px"}}>The Climbing Game</h1>
            <p style={{fontSize:12,color:T.textTer,margin:0}}>Business Model Explorer</p>
          </div>
        </div>
        
        {/* SHORTCUT TO COMMENTS */}
        <button onClick={()=>setTab("comments")} style={{display:"flex", alignItems:"center", gap:6, padding:"8px 16px", background:comments.length>0?T.orangeLight:T.bgSub, border:`1px solid ${comments.length>0?T.orange:T.border}`, borderRadius:20, color:comments.length>0?T.orange:T.textSec, fontSize:13, fontWeight:600, cursor:"pointer", transition:"all 0.2s"}}>
          <Ic n="message" s={16} c={comments.length>0?T.orange:T.textSec} />
          {comments.length} Live {comments.length === 1 ? "Thread" : "Threads"}
        </button>
      </div>

      {/* Model toggles */}
      <div style={{marginBottom:10}}>
        <div style={{...lbl,fontSize:10,marginBottom:5}}>Revenue models — select up to 3</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {MODELS.map(m=>{const on=selM.includes(m.id);return(
            <button key={m.id} onClick={()=>toggleM(m.id)} style={{padding:"10px 12px",borderRadius:10,border:`2px solid ${on?m.color:T.border}`,background:on?m.colorLight:T.bg,color:on?m.color:T.textSec,cursor:"pointer",textAlign:"left",transition:"all 0.15s",display:"flex",flexDirection:"column",gap:4}}>
              <div style={{display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:on?700:500}}>
                <Ic n={m.icon} s={14} c={on?m.color:T.textTer}/>{m.name}
              </div>
              <div style={{fontSize:11,lineHeight:1.35,color:on?m.color+"CC":T.textTer,fontWeight:400}}>{m.tag}</div>
            </button>);})}
        </div>
      </div>

      {/* City toggles */}
      <div>
        <div style={{...lbl,fontSize:10,marginBottom:5}}>Launch cities — select 1+</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {Object.entries(CITIES).map(([ck,cv])=>{const on=selC.includes(ck);return(
            <button key={ck} onClick={()=>toggleC(ck)} style={{padding:"6px 14px",borderRadius:20,border:`2px solid ${on?T.orange:T.border}`,background:on?T.orangeLight:T.bg,color:on?T.orange:T.textSec,cursor:"pointer",fontSize:12,fontWeight:on?600:400,transition:"all 0.15s"}}>
              {cv.name} <span style={{fontSize:10,opacity:0.6,marginLeft:2}}>({fU(cv.tam)})</span>
            </button>);})}
        </div>
      </div>
    </div>

    {/* ═══ STATUS BAR ═══ */}
    <div style={{background:T.bg,borderBottom:`1px solid ${T.borderLight}`,padding:"8px 28px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",fontSize:12}}>
      {selM.map(id=>{const m=MODELS.find(x=>x.id===id);return<span key={id} style={{color:m.color,padding:"2px 10px",background:m.colorLight,borderRadius:12,fontWeight:600,fontSize:11}}>{m.name}</span>;})}
      <span style={{color:T.textTer}}>×</span>
      {selC.map(ck=><span key={ck} style={{color:T.textSec,padding:"2px 10px",background:T.bgSub,borderRadius:12,fontSize:11,border:`1px solid ${T.border}`}}>{CITIES[ck].name}</span>)}
      <span style={{marginLeft:"auto",color:T.textTer,fontSize:11}}>TAM: {fU(selC.reduce((s,ck)=>s+CITIES[ck].tam,0))} · {selC.reduce((s,ck)=>s+CITIES[ck].gyms,0)} gyms · {selC.length > 1 ? `${selC.length} cities` : "1 city"}{selM.length > 1 ? ` · ${selM.length} models` : ""}</span>
    </div>

    <div style={{padding:"20px 28px 36px"}}>
      {/* ═══ KPIs ═══ */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:16}}>
        {[{l:"36-month ARR",v:fmt(last.arr||0),c:T.orange},{l:"Monthly Revenue",v:fmt(last.revenue||0)},{l:"Monthly Costs",v:fmt(comb[0]?.costs||0),sub:`→ ${fmt(last.costs||0)} at mo 36`},{l:"Break-even",v:be>=0?`Month ${comb[be].month}`:"Not yet",neg:be<0},{l:"36mo P&L",v:fmt(last.profit||0),neg:(last.profit||0)<0}].map((k,i)=>(
          <div key={i} style={{...card,textAlign:"center",padding:"14px 12px"}}>
            <div style={{fontSize:11,color:T.textTer,marginBottom:4,fontWeight:500}}>{k.l}</div>
            <div style={{fontSize:20,fontWeight:800,color:k.neg?T.red:k.c||T.text}}>{k.v}</div>
            {k.sub&&<div style={{fontSize:10,color:T.textTer,marginTop:2}}>{k.sub}</div>}
          </div>))}
      </div>

      {/* ═══ TABS ═══ */}
      <div style={{display:"flex",gap:0,marginBottom:16,borderBottom:`2px solid ${T.borderLight}`}}>
        {[{k:"chart",l:"Projections"},{k:"gtm",l:"Go-to-Market"},{k:"risks",l:"Risks & Moat"},{k:"comments",l:"Live Discussions"}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} style={{padding:"10px 20px",border:"none",borderBottom:tab===t.k?`2px solid ${T.orange}`:"2px solid transparent",marginBottom:-2,background:"transparent",color:tab===t.k?T.orange:T.textSec,cursor:"pointer",fontSize:13,fontWeight:tab===t.k?700:500}}>{t.l}</button>))}
      </div>

      {/* ═══ CHARTS TAB ═══ */}
      {tab==="chart"&&<div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:16}}>
        <div style={{...card,maxHeight:620,overflowY:"auto",padding:16}}>
          <div style={lbl}>Assumptions</div>
          {selM.map(mid=>{const m=MODELS.find(x=>x.id===mid);const R=RANGES[mid];const a=asmpt[mid];return(
            <div key={mid} style={{marginBottom:20,paddingBottom:16,borderBottom:`1px solid ${T.borderLight}`}}>
              <div style={{fontSize:12,color:m.color,fontWeight:700,marginBottom:10,display:"flex",alignItems:"center",gap:5}}>
                <Ic n={m.icon} s={13} c={m.color}/>{m.name}
              </div>
              {Object.entries(R).map(([k,r])=>(
                <Slider key={k} label={r.label} value={a[k]!==undefined?a[k]:(r.lo+r.hi)/2} onChange={v=>upd(mid,k,v)} min={r.min} max={r.max} lo={r.lo} hi={r.hi} format={r.fmt} color={m.color} tip={r.tip}/>
              ))}
            </div>);})}
          <button onClick={()=>{const a={};selM.forEach(mid=>{a[mid]=mkDef(selC,mid);});setAsmpt(p=>({...p,...a}));}} style={{padding:"8px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bg,color:T.textSec,cursor:"pointer",fontSize:12,width:"100%",fontWeight:500}}>Reset all defaults</button>
        </div>

        <div>
          <div style={card}>
            <div style={{display:"flex",gap:6,marginBottom:14}}>
              {[{k:"revenue",l:"MRR"},{k:"users",l:"Users"},{k:"profit",l:"Profit / Loss"},{k:"costs",l:"Costs"}].map(t=>(
                <button key={t.k} onClick={()=>setChartV(t.k)} style={{padding:"5px 14px",borderRadius:8,border:`1px solid ${chartV===t.k?prim.color+"40":T.border}`,background:chartV===t.k?prim.colorLight:T.bg,color:chartV===t.k?prim.color:T.textSec,cursor:"pointer",fontSize:12,fontWeight:chartV===t.k?600:400}}>{t.l}</button>))}
              {selM.length>1&&<span style={{fontSize:11,color:T.textTer,alignSelf:"center",marginLeft:8,fontWeight:600}}>COMBINED</span>}
            </div>
            <Chart data={comb} lines={[{key:chartV,color:chartV==="profit"&&last.profit<0?T.red:prim.color}]} h={220}/>
            <div style={{fontSize:10,color:T.textTer,textAlign:"center",marginTop:4}}>Months →</div>
          </div>

          {selM.length>1&&<div style={{...card,marginTop:12}}>
            <div style={lbl}>Revenue by model</div>
            <div style={{display:"grid",gridTemplateColumns:`repeat(${selM.length},1fr)`,gap:12}}>
              {selM.map(mid=>{const m=MODELS.find(x=>x.id===mid);const pr=indiv[mid];const l=pr[pr.length-1];return(
                <div key={mid}>
                  <div style={{fontSize:12,color:m.color,fontWeight:700,marginBottom:6,display:"flex",alignItems:"center",gap:4}}><Ic n={m.icon} s={12} c={m.color}/>{m.name}</div>
                  <Chart data={pr} lines={[{key:"revenue",color:m.color}]} h={110}/>
                  <div style={{fontSize:14,fontWeight:800,color:T.text,textAlign:"center",marginTop:4}}>{fmt(l.arr)} <span style={{fontSize:10,fontWeight:400,color:T.textSec}}>ARR</span></div>
                </div>);})}
            </div>
          </div>}

          {selC.length>1&&<div style={{...card,marginTop:12}}>
            <div style={lbl}>Market composition</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {selC.map(ck=>{const c=CITIES[ck];const pct=((c.tam/selC.reduce((s,k)=>s+CITIES[k].tam,0))*100).toFixed(0);return(
                <div key={ck} style={{flex:1,minWidth:140,padding:"12px 16px",background:T.bgSub,borderRadius:8}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.text}}>{c.name}</div>
                  <div style={{fontSize:12,color:T.textSec}}>{fU(c.tam)} climbers · {c.gyms} gyms · {pct}%</div>
                </div>);})}
            </div>
          </div>}
        </div>
      </div>}

      {/* ═══ GTM TAB ═══ */}
      {tab==="gtm"&&<div style={{display:"grid",gridTemplateColumns:selC.length>2?"1fr 1fr":"repeat(auto-fit,minmax(320px,1fr))",gap:14}}>
        {selC.map(ck=>{const c=CITIES[ck];return(
          <div key={ck} style={card}>
            <div style={{fontSize:16,fontWeight:800,color:T.text,marginBottom:4}}>{c.name}</div>
            <p style={{fontSize:13,color:T.textSec,lineHeight:1.6,margin:"0 0 16px"}}>{c.info}</p>
            {selM.map(mid=>{const m=MODELS.find(x=>x.id===mid);return(<div key={mid} style={{marginBottom:16,paddingBottom:14,borderBottom:`1px solid ${T.borderLight}`}}>
              <div style={{fontSize:12,color:m.color,fontWeight:700,marginBottom:4,display:"flex",alignItems:"center",gap:4}}><Ic n={m.icon} s={12} c={m.color}/>{m.name}</div>
              <div style={{fontSize:12,color:T.textSec,lineHeight:1.5}}>Local TAM: {fU(c.tam)} · {c.gyms} gyms · {m.excl}</div>
              <div style={{fontSize:12,color:T.text,lineHeight:1.55,marginTop:6}}>{m.desc}</div>
            </div>);})}
          </div>);})}
      </div>}

      {/* ═══ RISKS TAB ═══ */}
      {tab==="risks"&&<div>
        {selM.map(mid=>{const m=MODELS.find(x=>x.id===mid);return(
          <div key={mid} style={{...card,marginBottom:14}}>
            <div style={{...lbl,color:m.color,display:"flex",alignItems:"center",gap:5}}><Ic n={m.icon} s={13} c={m.color}/>{m.name}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:10}}>
              {m.risks.map((r,i)=>(
                <div key={i} style={{padding:"14px 16px",background:T.bgSub,borderRadius:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{fontSize:13,fontWeight:600,color:T.text,flex:1}}>{r.r}</span>
                    <div style={{display:"flex",gap:3,flexShrink:0,marginLeft:8}}>{[1,2,3,4,5].map(j=>(<div key={j} style={{width:8,height:8,borderRadius:"50%",background:j<=r.s?T.red:T.border}}/>))}</div>
                  </div>
                  <div style={{fontSize:12,color:T.textSec,lineHeight:1.5}}>{r.m}</div>
                </div>))}
            </div>
          </div>);})}

        {/* Moat */}
        <div style={card}>
          <div style={lbl}>Moat evolution</div>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${selM.length},1fr)`,gap:16}}>
            {selM.map(mid=>{const m=MODELS.find(x=>x.id===mid);return(
              <div key={mid}>
                <div style={{fontSize:12,color:m.color,fontWeight:700,marginBottom:8}}>{m.name}</div>
                {m.moat.map((mp,i)=>{const [phase,...rest]=mp.split(": ");return(
                  <div key={i} style={{display:"flex",gap:10,marginBottom:8}}>
                    <span style={{fontSize:11,color:m.color,fontWeight:600,minWidth:65,flexShrink:0}}>{phase}</span>
                    <span style={{fontSize:13,color:T.textSec,lineHeight:1.45}}>{rest.join(": ")}</span>
                  </div>);})}
              </div>);})}
          </div>
        </div>

        {selM.length>1&&<div style={{...card,marginTop:14,background:T.orangeLight,border:`1px solid ${T.orange}20`}}>
          <div style={{...lbl,color:T.orange}}>Combination note</div>
          <p style={{fontSize:13,color:T.text,lineHeight:1.6,margin:0}}>
            Combining {selM.length} models shares development costs ({selM.length === 2 ? "25%" : "35%"} savings on total costs — one codebase, shared infrastructure). Each additional city adds ~40% to marketing and ~20% to dev for local integrations, plus €200/mo operations overhead. Prioritise one model as primary and layer others as secondary.
          </p>
        </div>}
      </div>}

      {/* ═══ LIVE COMMENTS TAB ═══ */}
      {tab==="comments"&&<div style={{maxWidth:700, margin:"0 auto"}}>
        <div style={{...card, marginBottom:16}}>
          <h2 style={{fontSize:16, fontWeight:700, color:T.text, margin:"0 0 4px"}}>Live Strategy Discussions</h2>
          <p style={{fontSize:13, color:T.textSec, margin:"0 0 16px"}}>
            Comments here are saved securely to your Supabase database. They will sync instantly to your partner's screen.
          </p>
          
          <div style={{display:"flex", flexDirection:"column", gap:12, marginBottom:20}}>
            {comments.length === 0 && <div style={{padding:20, textAlign:"center", color:T.textTer, fontSize:13, border:`1px dashed ${T.border}`, borderRadius:8}}>No comments yet in the cloud database.</div>}
            
            {comments.map(c=>(
              <div key={c.id} style={{padding:14, background:c.author==="Gemini"?T.blueLight:T.bgSub, borderRadius:8, border:`1px solid ${c.author==="Gemini"?T.blue+"30":T.borderLight}`}}>
                <div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}>
                  <div style={{display:"flex", alignItems:"center", gap:6}}>
                    <span style={{fontSize:13, fontWeight:700, color:c.author==="Gemini"?T.blue:T.text}}>{c.author}</span>
                    <span style={{fontSize:10, padding:"2px 6px", background:T.bg, borderRadius:10, color:T.textSec, border:`1px solid ${T.border}`}}>{c.role}</span>
                  </div>
                  <span style={{fontSize:11, color:T.textTer}}>
                    {new Date(c.created_at).toLocaleDateString()} {new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                
                {/* SCENARIO BADGE */}
                <div style={{fontSize:10, color:T.orange, marginBottom:6, fontWeight:600, letterSpacing:"0.5px", textTransform:"uppercase"}}>
                  SCENARIO: {c.scenario}
                </div>
                
                <div style={{fontSize:13, color:T.text, lineHeight:1.5}}>{c.text}</div>
              </div>
            ))}
          </div>

          <div style={{display:"flex", gap:10}}>
            <textarea value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder={`Add your thoughts on the current scenario (${selM.map(m=>MODELS.find(x=>x.id===m).name).join(" + ")})`} style={{flex:1, padding:12, borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:"inherit", resize:"vertical", minHeight:40}} />
            <button disabled={isPosting || !supabaseUrl.includes('supabase.co')} onClick={handleAddComment} style={{padding:"0 20px", background:isPosting?T.textTer:T.text, color:T.bg, border:"none", borderRadius:8, fontWeight:600, cursor:isPosting?"wait":"pointer"}}>
              {isPosting ? "..." : "Post to Cloud"}
            </button>
          </div>
          {!supabaseUrl.includes('supabase.co') && <div style={{fontSize:11, color:T.red, marginTop:8, textAlign:"right"}}>Error: You must paste your Supabase URL & Key into line 4 of App.jsx!</div>}
        </div>
      </div>}
      
    </div>
  </div>);
}