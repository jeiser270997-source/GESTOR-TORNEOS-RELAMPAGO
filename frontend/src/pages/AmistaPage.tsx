import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download, Share2, Megaphone } from 'lucide-react';

const SEMI_FONDOS = [
  new URL('../assets/fondos/semi_1.png', import.meta.url).href,
  new URL('../assets/fondos/semi_2.png', import.meta.url).href,
  new URL('../assets/fondos/semi_3.png', import.meta.url).href,
  new URL('../assets/fondos/semi_4.png', import.meta.url).href,
];

const HORAS_12 = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const MINUTOS  = ['00','15','30','45'];

export default function AmistaPage() {
  const [titulo,    setTitulo]    = useState('AMISTOSO');
  const [miEquipo,  setMiEquipo]  = useState('');
  const [rival,     setRival]     = useState('');
  const [fecha,     setFecha]     = useState('');
  const [horaH,     setHoraH]     = useState('7');
  const [horaM,     setHoraM]     = useState('30');
  const [horaAMPM,  setHoraAMPM]  = useState('PM');
  const [categoria, setCategoria] = useState('');
  const [nota,      setNota]      = useState('');
  const [loading,   setLoading]   = useState(false);
  const [copied,    setCopied]    = useState(false);

  const horaLabel  = `${horaH}:${horaM} ${horaAMPM}`;
  const fechaLabel = fecha
    ? format(parseISO(fecha), "EEEE dd 'de' MMMM", { locale: es }).toUpperCase()
    : '';
  const fechaFlayer = fecha
    ? format(parseISO(fecha), "EEEE dd 'de' MMMM", { locale: es }).toUpperCase()
    : '';
  const canGenerate = titulo.trim() && miEquipo.trim() && rival.trim() && fecha;

  // ── Mensaje WhatsApp ────────────────────────────────────────────
  const copyMsg = () => {
    if (!canGenerate) return;
    const lines = [
      `⚾ ${titulo.toUpperCase()} — SOFTBALL ENVIGADO`,
      ``,
      `🆚 ${miEquipo.toUpperCase()} vs ${rival.toUpperCase()}`,
      ``,
      `📅 ${fechaLabel}`,
      `⏰ ${horaLabel}`,
      nota.trim() ? `📌 ${nota.trim()}` : '',
      `📍 Polideportivo Sur — Envigado`,
      categoria.trim() ? `⚽ ${categoria.trim()}` : '',
      ``,
      `💪 ¡A presentarse listos!`,
    ];
    const msg = lines.filter((l, i) => !(l === '' && (i === 0 || lines[i-1] === ''))).join('\n');
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Generar flyer ───────────────────────────────────────────────
  const generateFlyer = async () => {
    if (!canGenerate) return;
    setLoading(true);
    try {
      const bgUrl = SEMI_FONDOS[Math.floor(Math.random() * SEMI_FONDOS.length)];
      const bgImg = await new Promise<HTMLImageElement>((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = bgUrl;
      });

      const W = 1080, H = 1350;
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d')!;

      // Fondo
      const sc = Math.max(W / bgImg.width, H / bgImg.height);
      ctx.drawImage(bgImg,
        (W - bgImg.width  * sc) / 2,
        (H - bgImg.height * sc) / 2,
        bgImg.width * sc, bgImg.height * sc);

      // Overlays
      const gTop = ctx.createLinearGradient(0,0,0,380);
      gTop.addColorStop(0,'rgba(0,0,0,0.72)'); gTop.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = gTop; ctx.fillRect(0,0,W,380);
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(0,380,W,440);
      const gMid = ctx.createLinearGradient(0,820,0,1090);
      gMid.addColorStop(0,'rgba(0,0,0,0)'); gMid.addColorStop(1,'rgba(0,0,0,0.68)');
      ctx.fillStyle = gMid; ctx.fillRect(0,820,W,270);
      ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0,1090,W,H-1090);

      const GOLD = '#F5C518', WHITE = '#FFFFFF';
      ctx.textBaseline = 'top';

      const rr = (x:number,y:number,w:number,h:number,r:number) => {
        ctx.beginPath();
        ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
        ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
        ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
        ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
      };
      const cT = (text:string, y:number, color:string, sw=3) => {
        const tw = ctx.measureText(text).width;
        ctx.strokeStyle='rgba(0,0,0,0.85)'; ctx.lineWidth=sw*2; ctx.lineJoin='round';
        ctx.strokeText(text,(W-tw)/2,y);
        ctx.fillStyle=color; ctx.fillText(text,(W-tw)/2,y);
      };
      const fitC = (text:string, y:number, maxSz:number, minSz:number, color:string, sw=5) => {
        let sz=maxSz;
        ctx.font=`900 ${sz}px "Poppins","Arial Black",Arial`;
        while(sz>minSz && ctx.measureText(text).width>W-80){ sz-=2; ctx.font=`900 ${sz}px "Poppins","Arial Black",Arial`; }
        cT(text,y,color,sw);
      };
      const hline = (y:number, alpha=0.55, margin=60) => {
        const g=ctx.createLinearGradient(margin,y,W-margin,y);
        g.addColorStop(0,'transparent'); g.addColorStop(0.5,`rgba(245,197,24,${alpha})`); g.addColorStop(1,'transparent');
        ctx.strokeStyle=g; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(margin,y); ctx.lineTo(W-margin,y); ctx.stroke();
      };
      const drawBadge = (text:string, y:number, fontSize:number, fg:string): number => {
        ctx.font=`900 ${fontSize}px "Poppins","Arial Black",Arial`;
        const tw=ctx.measureText(text).width;
        const px=64,py=18,bw=tw+px*2,bh=fontSize+py*2,bx=(W-bw)/2;
        rr(bx,y,bw,bh,bh/2);
        ctx.fillStyle='rgba(0,0,0,0.82)'; ctx.fill();
        ctx.strokeStyle='rgba(245,197,24,0.95)'; ctx.lineWidth=2; ctx.stroke();
        ctx.fillStyle=fg; ctx.strokeStyle='rgba(0,0,0,0.75)'; ctx.lineWidth=2;
        ctx.strokeText(text,bx+px,y+py); ctx.fillText(text,bx+px,y+py);
        return bh;
      };

      // Bordes
      ctx.strokeStyle='rgba(245,197,24,0.85)'; ctx.lineWidth=3; rr(14,14,W-28,H-28,20); ctx.stroke();
      ctx.strokeStyle='rgba(245,197,24,0.22)'; ctx.lineWidth=1; rr(22,22,W-44,H-44,14); ctx.stroke();

      // Pelota
      const [bcx,bcy,br]=[W/2,80,44];
      ctx.beginPath(); ctx.arc(bcx,bcy,br,0,Math.PI*2);
      ctx.fillStyle='rgba(228,215,120,0.92)'; ctx.fill();
      ctx.strokeStyle='rgba(160,138,50,0.8)'; ctx.lineWidth=2; ctx.stroke();
      const seams: number[][][] = [
        [[bcx-16,bcy-36],[bcx-21,bcy-22],[bcx-16,bcy-7],[bcx-21,bcy+8],[bcx-16,bcy+23],[bcx-21,bcy+34]],
        [[bcx+16,bcy-36],[bcx+21,bcy-22],[bcx+16,bcy-7],[bcx+21,bcy+8],[bcx+16,bcy+23],[bcx+21,bcy+34]],
      ];
      seams.forEach(pts=>{
        ctx.strokeStyle='rgba(190,30,30,0.85)'; ctx.lineWidth=2.2; ctx.lineJoin='round';
        ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
        pts.slice(1).forEach(p=>ctx.lineTo(p[0],p[1])); ctx.stroke();
      });

      // ══ LAYOUT ═══════════════════════════════════════════════
      const bh = drawBadge(titulo.toUpperCase(), 134, 40, GOLD);
      const bb = 134 + bh; // ~208

      ctx.font='400 22px "Poppins",Arial';
      ctx.fillStyle='rgba(255,255,255,0.75)';
      const sub='SOFTBALL  ·  ENVIGADO';
      ctx.fillText(sub,(W-ctx.measureText(sub).width)/2,bb+14);

      hline(bb+56, 0.65);

      ctx.font=`900 114px "Poppins","Arial Black",Arial`;
      fitC(miEquipo.toUpperCase(), bb+80,  114, 50, WHITE, 5);

      ctx.font=`900 104px "Poppins","Arial Black",Arial`;
      cT('VS', bb+222, GOLD, 5);

      ctx.font=`900 114px "Poppins","Arial Black",Arial`;
      fitC(rival.toUpperCase(), bb+338, 114, 50, WHITE, 5);

      hline(bb+500, 0.45);

      // Overlay oscuro zona hora/fecha/nota
      const gradH = ctx.createLinearGradient(0,bb+510,0,bb+810);
      gradH.addColorStop(0,'rgba(0,0,0,0)'); gradH.addColorStop(0.15,'rgba(0,0,0,0.55)');
      gradH.addColorStop(0.85,'rgba(0,0,0,0.55)'); gradH.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=gradH; ctx.fillRect(40,bb+510,W-80,300);

      // HORA — protagonista
      ctx.font=`900 122px "Poppins","Arial Black",Arial`;
      cT(horaLabel, bb+522, WHITE, 5);

      // FECHA
      ctx.font=`900 36px "Poppins","Arial Black",Arial`;
      cT(fechaFlayer, bb+660, GOLD, 3);

      // NOTA (una línea, opcional)
      if (nota.trim()) {
        ctx.font=`400 26px "Poppins",Arial`;
        ctx.fillStyle='rgba(255,255,255,0.72)'; ctx.strokeStyle='rgba(0,0,0,0.7)'; ctx.lineWidth=2;
        const nt=nota.trim();
        ctx.strokeText(nt,(W-ctx.measureText(nt).width)/2,bb+716);
        ctx.fillText(nt,(W-ctx.measureText(nt).width)/2,bb+716);
      }

      const sepY = bb + (nota.trim() ? 766 : 720);
      hline(sepY, 0.45);

      // ── FRANJA INFERIOR ───────────────────────────────────────
      const footY = sepY + 14;
      const gradFoot = ctx.createLinearGradient(0,footY,0,H);
      gradFoot.addColorStop(0,'rgba(0,0,0,0)'); gradFoot.addColorStop(0.15,'rgba(0,0,0,0.70)');
      gradFoot.addColorStop(1,'rgba(0,0,0,0.88)');
      ctx.fillStyle=gradFoot; ctx.fillRect(0,footY,W,H-footY);

      // Distribuir sede + categoría + tagline en el espacio disponible
      const footSpace = H - 40 - footY;
      const step = footSpace / 3;

      ctx.font=`700 28px "Poppins","Arial Black",Arial`;
      cT('POLIDEPORTIVO SUR ENVIGADO', footY+step*0+step/2-16, WHITE, 2);

      if (categoria.trim()) {
        hline(footY+step-8, 0.3, 160);
        ctx.font=`700 27px "Poppins","Arial Black",Arial`;
        cT(categoria.trim(), footY+step+step/2-16, GOLD, 2);
      }

      ctx.font=`900 46px "Poppins","Arial Black",Arial`;
      cT('\u00a1A GANAR!', footY+step*2+step/2-24, WHITE, 3);

      const link=document.createElement('a');
      link.download=`${titulo}_${miEquipo}_vs_${rival}.png`;
      link.href=cv.toDataURL('image/png');
      link.click();

    } catch(e) {
      console.error(e);
      alert('Error al generar el flayer. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-32 max-w-2xl mx-auto">

      <div>
        <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-yellow-400" />
          FLAYER DE PARTIDO
        </h1>
        <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs mt-2">
          Amistosos · Exhibiciones · Convocatorias · Torneos
        </p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6">

        {/* Título badge */}
        <div className="space-y-2">
          <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Título del partido</label>
          <input type="text" value={titulo} onChange={e=>setTitulo(e.target.value)}
            placeholder="Ej: AMISTOSO, EXHIBICIÓN, CONVOCATORIA..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-600"/>
        </div>

        {/* Equipos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Tu equipo</label>
            <input type="text" value={miEquipo} onChange={e=>setMiEquipo(e.target.value)}
              placeholder="Ej: RELÁMPAGO"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-600"/>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Rival</label>
            <input type="text" value={rival} onChange={e=>setRival(e.target.value)}
              placeholder="Ej: RANGERS"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-600"/>
          </div>
        </div>

        {/* Fecha */}
        <div className="space-y-2">
          <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Fecha</label>
          <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-yellow-500 transition-colors"/>
          {fecha && <p className="text-yellow-500 text-xs font-bold uppercase tracking-wider pl-1">{fechaLabel}</p>}
        </div>

        {/* Hora 12h */}
        <div className="space-y-2">
          <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Hora de play ball</label>
          <div className="flex gap-3 items-center">
            <select value={horaH} onChange={e=>setHoraH(e.target.value)}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-yellow-500 transition-colors">
              {HORAS_12.map(h=><option key={h} value={h}>{h}</option>)}
            </select>
            <span className="text-neutral-500 font-black text-xl">:</span>
            <select value={horaM} onChange={e=>setHoraM(e.target.value)}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-yellow-500 transition-colors">
              {MINUTOS.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
            <select value={horaAMPM} onChange={e=>setHoraAMPM(e.target.value)}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-yellow-500 transition-colors">
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
          <p className="text-yellow-500 text-xs font-bold pl-1">{horaLabel}</p>
        </div>

        {/* Categoría */}
        <div className="space-y-2">
          <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">
            Categoría <span className="text-neutral-600 normal-case font-normal">(opcional)</span>
          </label>
          <input type="text" value={categoria} onChange={e=>setCategoria(e.target.value)}
            placeholder="Ej: Cat. Especial Instruccional"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-600"/>
        </div>

        {/* Nota */}
        <div className="space-y-2">
          <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">
            Nota <span className="text-neutral-600 normal-case font-normal">(opcional — ej: Calentamiento 7:00 PM)</span>
          </label>
          <input type="text" value={nota} onChange={e=>setNota(e.target.value)}
            placeholder="Ej: Calentamiento: 7:00 PM · Llegar con tiempo"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors placeholder-neutral-600"/>
        </div>

        {/* Preview */}
        {canGenerate && (
          <div className="bg-neutral-950 border border-yellow-500/20 rounded-2xl p-5 space-y-1">
            <p className="text-yellow-500 font-black text-xs uppercase tracking-widest mb-3">Vista previa</p>
            <p className="text-yellow-400 font-black text-sm">{titulo.toUpperCase()}</p>
            <p className="text-white font-black">{miEquipo.toUpperCase()} vs {rival.toUpperCase()}</p>
            <p className="text-neutral-400 text-sm">{fechaLabel}  ·  {horaLabel}</p>
            {categoria && <p className="text-yellow-400 text-sm">{categoria}</p>}
            {nota && <p className="text-neutral-500 text-xs italic">{nota}</p>}
            <p className="text-neutral-600 text-xs">📍 Polideportivo Sur — Envigado</p>
          </div>
        )}

        {/* Botones */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <button onClick={copyMsg} disabled={!canGenerate}
            className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-500 text-white py-4 rounded-2xl font-black text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <Share2 className="w-4 h-4"/>
            {copied ? '¡COPIADO!' : 'COPIAR MENSAJE'}
          </button>
          <button onClick={generateFlyer} disabled={!canGenerate||loading}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-neutral-950 py-4 rounded-2xl font-black text-sm shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none">
            <Download className="w-4 h-4"/>
            {loading ? 'GENERANDO...' : 'DESCARGAR PNG'}
          </button>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 font-black text-lg shrink-0">📍</div>
        <div>
          <p className="text-white font-black text-sm">Polideportivo Sur — Envigado</p>
          <p className="text-neutral-500 text-xs mt-0.5">Lugar fijo para todos los partidos</p>
        </div>
      </div>

    </div>
  );
}
