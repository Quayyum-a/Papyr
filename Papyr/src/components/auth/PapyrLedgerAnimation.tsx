'use client';

import { useEffect, useRef, useState } from 'react';

interface PapyrLedgerAnimationProps {
  mode?: 'signin' | 'signup';
  className?: string;
}

interface LedgerRow {
  entry: {
    item: string;
    qty: string;
    amount: string;
  } | null;
  written: boolean;
  seed: number;
  xj: number;
  qj: number;
  aj: number;
  op: number;
  size: number;
}

interface LedgerTarget {
  kind: 'biz' | 'row';
  row?: number;
}

export function PapyrLedgerAnimation({ mode = 'signin', className = '' }: PapyrLedgerAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener?.('change', handler);

    // Check for small screen
    const smallMQ = window.matchMedia('(max-width: 520px)');
    setIsSmallScreen(smallMQ.matches);
    const smallHandler = (e: MediaQueryListEvent) => setIsSmallScreen(e.matches);
    smallMQ.addEventListener?.('change', smallHandler);

    return () => {
      mediaQuery.removeEventListener?.('change', handler);
      smallMQ.removeEventListener?.('change', smallHandler);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration matching the reference design
    const D = { W: 460, H: 560 };
    const ROUND = 18;
    const PAGE = { w: 424, h: 524 };
    const PX = (D.W - PAGE.w) / 2;
    const PY = (D.H - PAGE.h) / 2;
    const CYCLE = 9;
    const INK = "rgba(31,42,56,";
    const PENCIL = "rgba(88,96,104,";

    // State variables
    let t = 0;
    let last = 0;
    let lastCycle = -1;
    let activeTarget = -1;
    let nextTarget = 0;
    let par = { x: 0, y: 0 };
    let parT = { x: 0, y: 0 };
    let scale = 1;
    const widths = new Map<string, number>();
    let rows: LedgerRow[] = [];
    let targets: LedgerTarget[] = [];
    let bizName = "Sunny's Repairs";
    let bizWritten = mode !== 'signup';
    let animationId: number | null = null;
    let noiseCanvas: HTMLCanvasElement | null = null;
    let shadowCanvas: HTMLCanvasElement | null = null;
    let dpr = 1;

    // Initialize rows based on mode
    const buildRows = () => {
      const base = mode === 'signup' ? [] : [
        { item: "Phone repair", qty: "1", amount: "₦25,000" },
        { item: "Screen replacement", qty: "1", amount: "₦18,000" },
        { item: "Accessories", qty: "2", amount: "₦8,500" },
      ];
      const pending = mode === 'signup' ? [
        { item: "Phone repair", qty: "1", amount: "₦25,000" },
        { item: "Accessories", qty: "2", amount: "₦8,500" },
      ] : [
        { item: "Screen protector", qty: "1", amount: "₦2,000" },
        { item: "Power bank", qty: "1", amount: "₦15,000" },
        { item: "Car charger", qty: "1", amount: "₦6,500" },
      ];

      rows = [];
      for (const e of base) rows.push(mkRow(e, true));
      for (const e of pending) rows.push(mkRow(e, false));
      const target = mode === 'signup' ? 6 : 7;
      while (rows.length < target) rows.push(mkRow(null, false));

      bizName = "Sunny's Repairs";
      bizWritten = mode !== 'signup';

      targets = [];
      if (mode === 'signup') targets.push({ kind: 'biz' });
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].entry && !rows[i].written) targets.push({ kind: 'row', row: i });
      }
    };

    const mkRow = (entry: LedgerRow['entry'], written: boolean): LedgerRow => ({
      entry,
      written,
      seed: Math.random() * 3 - 1.5,
      xj: Math.random() * 4 - 2,
      qj: Math.random() * 2 - 1,
      aj: Math.random() * 3 - 1.5,
      op: 0.84 + Math.random() * 0.09,
      size: 18.5 + Math.random() * 1,
    });

    // Pre-render paper grain and shadow
    const prepPaper = () => {
      // Noise/grain
      noiseCanvas = document.createElement('canvas');
      noiseCanvas.width = D.W;
      noiseCanvas.height = D.H;
      const nc = noiseCanvas.getContext('2d')!;
      for (let i = 0; i < 2200; i++) {
        const x = Math.random() * D.W, y = Math.random() * D.H;
        const light = Math.random() < 0.5;
        nc.fillStyle = light ? "rgba(255,255,255,0.04)" : "rgba(90,70,35,0.04)";
        nc.fillRect(x, y, 1, 1);
      }

      // Shadow
      shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = D.W;
      shadowCanvas.height = D.H;
      const sc = shadowCanvas.getContext('2d')!;
      sc.save();
      sc.shadowColor = "rgba(70,50,18,0.32)";
      sc.shadowBlur = 42;
      sc.shadowOffsetY = 16;
      sc.fillStyle = "#fcf8ee";
      rr(sc, PX, PY, PAGE.w, PAGE.h, ROUND);
      sc.fill();
      sc.restore();
    };

    const rr = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      const k = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + k, y);
      ctx.arcTo(x + w, y, x + w, y + h, k);
      ctx.arcTo(x + w, y + h, x, y + h, k);
      ctx.arcTo(x, y + h, x, y, k);
      ctx.arcTo(x, y, x + w, y, k);
      ctx.closePath();
    };

    const resize = () => {
      if (!canvas) return;
      const cw = canvas.clientWidth || D.W;
      const ch = cw * (D.H / D.W);
      canvas.style.height = ch + 'px';
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      scale = cw / D.W;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
    };

    const cycleState = (tc: number, cycle: number) => {
      const v = Math.abs(cycle) % 2;
      const SEG = {
        name: [2.2, 5.3],
        item: [2.2, 3.7 + v * 0.15],
        qty: [3.8, 4.5 + v * 0.1],
        amt: [4.6, 5.6 + v * 0.1],
      };
      const prog = (k: string) => Math.max(0, Math.min(1, (tc - SEG[k as keyof typeof SEG][0]) / (SEG[k as keyof typeof SEG][1] - SEG[k as keyof typeof SEG][0])));
      const ease = (p: number) => p * p * (3 - 2 * p);
      return { prog: (k: string) => ease(prog(k)) };
    };

    const measure = (ctx: CanvasRenderingContext2D, str: string) => {
      const key = ctx.font + '|' + str;
      if (!widths.has(key)) widths.set(key, ctx.measureText(str).width);
      return widths.get(key)!;
    };

    const entry = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, right: boolean) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y - 26, w, 40);
      ctx.clip();
      ctx.textAlign = right ? 'right' : 'left';
      ctx.fillText(text, right ? x + w : x, y);
      ctx.restore();
    };

    const parseAmt = (s: string) => parseInt(String(s).replace(/[^\d]/g, ''), 10) || 0;
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
    const smooth = (a: number, b: number, t: number) => {
      const p = clamp((t - a) / (b - a), 0, 1);
      return p * p * (3 - 2 * p);
    };

    const total = (cycle: number, tc: number, rowTargetIdx: number, active: boolean, target: LedgerTarget | null) => {
      let sum = 0;
      const st = cycleState(tc, cycle);
      const tgtRow = active && target && target.kind === 'row' ? target.row : -1;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row.entry) continue;
        const revealed = row.written || (i === tgtRow && st.prog('amt') >= 1);
        if (revealed) sum += parseAmt(row.entry.amount);
      }
      return sum;
    };

    const draw = (time: number) => {
      if (!canvas || !ctx) return;

      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
      ctx.clearRect(0, 0, D.W, D.H);

      par.x += (parT.x - par.x) * 0.08;
      par.y += (parT.y - par.y) * 0.08;

      const cycle = Math.floor(t / CYCLE);
      if (cycle !== lastCycle) {
        lastCycle = cycle;
        if (nextTarget < targets.length) activeTarget = nextTarget++;
        else activeTarget = -1;
      }
      const tc = t - cycle * CYCLE;

      const active = activeTarget >= 0;
      const target = active ? targets[activeTarget] : null;
      const isBizTarget = target?.kind === 'biz';
      const rowIdx = (target && target.kind === 'row' && target.row !== undefined) ? target.row : -1;
      const tgtDoneAt = isBizTarget ? 5.3 : 5.6;
      const tgtDone = active && target ? (isBizTarget ? bizWritten : rows[rowIdx].written) : false;
      const writing = active && !tgtDone && tc >= 2.2 && tc < tgtDoneAt;
      const settle = active && tgtDone && tc >= tgtDoneAt ? smooth(tgtDoneAt, tgtDoneAt + 0.55, tc) : 1;
      const st = cycleState(tc, cycle);

      ctx.save();
      const swayAmp = writing ? 0.15 : 0.42;
      const rot = (0.42 + swayAmp * Math.sin(t * 0.5)) * Math.PI / 180;
      ctx.translate(D.W / 2 + par.x * 0.6, D.H / 2 + par.y * 0.6);
      ctx.rotate(rot);
      ctx.translate(-D.W / 2, -D.H / 2);

      // Shadow
      if (shadowCanvas) ctx.drawImage(shadowCanvas, 0, 0);

      // Paper layers
      ctx.fillStyle = "#ece4cf";
      rr(ctx, PX - 18, PY - 10, PAGE.w, PAGE.h, ROUND);
      ctx.fill();
      ctx.fillStyle = "#f3ecd9";
      rr(ctx, PX - 9, PY - 5, PAGE.w, PAGE.h, ROUND);
      ctx.fill();
      ctx.fillStyle = "#fcf8ee";
      rr(ctx, PX, PY, PAGE.w, PAGE.h, ROUND);
      ctx.fill();

      // Paper texture
      ctx.save();
      rr(ctx, PX, PY, PAGE.w, PAGE.h, ROUND);
      ctx.clip();
      if (noiseCanvas) ctx.drawImage(noiseCanvas, 0, 0);
      ctx.fillStyle = "rgba(84,66,38,0.04)";
      ctx.beginPath(); ctx.arc(PX + 76, PY + 470, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(PX + 122, PY + 498, 1.0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Logo badge
      ctx.save();
      rr(ctx, PX + 26, PY + 22, 30, 30, 8);
      ctx.fillStyle = "rgba(15,23,42,0.62)";
      ctx.fill();
      rr(ctx, PX + 32.5, PY + 28.5, 17, 17, 4.8);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = "700 30px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("P", PX + 41, PY + 41);
      ctx.restore();

      // Title
      const title = mode === 'signup' ? 'New Book' : 'Sales Ledger';
      ctx.font = "600 50px Caveat, cursive";
      ctx.textAlign = "left";
      ctx.fillStyle = INK + "0.9)";
      ctx.fillText(title, PX + 70, PY + 45);

      // Date
      ctx.font = "500 32px Caveat, cursive";
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(120,108,84,0.72)";
      ctx.fillText("14 Aug '26", PX + PAGE.w - 26, PY + 45);

      // Divider
      ctx.beginPath();
      ctx.moveTo(PX + 26, PY + 63);
      ctx.quadraticCurveTo(PX + PAGE.w / 2, PY + 65.5, PX + PAGE.w - 26, PY + 63);
      ctx.strokeStyle = "rgba(90,70,30,0.16)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Business name
      const bizBase = PY + 87;
      const bizX = PX + 28;
      const bizShown = bizWritten || (active && target && target.kind === 'biz' && tc >= 2.2);
      if (bizShown) {
        ctx.font = "600 96px Caveat, cursive";
        const settleBiz = active && target && target.kind === 'biz' && tgtDone && tc >= tgtDoneAt ? settle : 1;
        const wBiz = measure(ctx, bizName);
        ctx.globalAlpha = 0.88 * (0.85 + 0.15 * settleBiz);
        if (active && target && target.kind === 'biz' && !tgtDone) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(bizX, bizBase - 26, st.prog('name') * wBiz, 40);
          ctx.clip();
          ctx.textAlign = "left";
          ctx.fillStyle = (mode === 'signup' ? PENCIL : INK) + "0.88)";
          ctx.fillText(bizName, bizX, bizBase + (1 - settleBiz) * 1.2);
          ctx.restore();
        } else {
          ctx.textAlign = "left";
          ctx.fillStyle = INK + "0.88)";
          ctx.fillText(bizName, bizX, bizBase + (1 - settleBiz) * 1.2);
        }
        ctx.globalAlpha = 1;
      }
      if (bizShown) {
        const r2A = bizWritten ? 0.09 : smooth(2.2, 2.7, tc) * 0.09;
        ctx.beginPath();
        ctx.moveTo(PX + 26, PY + 100);
        ctx.quadraticCurveTo(PX + PAGE.w / 2, PY + 101.5, PX + PAGE.w - 26, PY + 100);
        ctx.strokeStyle = "rgba(90,70,30,0.09)";
        ctx.globalAlpha = r2A / 0.09;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Column headers
      ctx.font = "600 36px Inter, sans-serif";
      ctx.fillStyle = "rgba(120,108,84,0.6)";
      ctx.textAlign = "left";
      ctx.letterSpacing = "1.6px";
      ctx.fillText("ITEM", PX + 30, PY + 118);
      ctx.fillText("QTY", PX + PAGE.w - 150, PY + 118);
      ctx.textAlign = "right";
      ctx.fillText("AMOUNT", PX + PAGE.w - 30, PY + 118);
      ctx.letterSpacing = "0px";

      // Column divider
      ctx.beginPath();
      ctx.moveTo(PX + PAGE.w - 164, PY + 108);
      ctx.lineTo(PX + PAGE.w - 164, PY + PAGE.h - 50);
      ctx.strokeStyle = "rgba(90,70,30,0.045)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const contentTop = PY + 134;
      const rowH = 40;
      const itemX = PX + 30;
      const qtyX = PX + PAGE.w - 150;
      const amtX = PX + PAGE.w - 30;
      const rowTargetIdx = rowIdx;
      const isRowWriting = rowTargetIdx >= 0 && !rows[rowTargetIdx].written;

      // Draw rows
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const yTop = contentTop + i * rowH;
        const base = yTop + 27 + row.seed * 1.1;
        const isTgt = i === rowTargetIdx;

        let env = 1;
        if (isTgt && !row.written) env = Math.max(0, Math.min(1, (tc - 1.4) / 0.8));
        if (env <= 0) continue;

        // Row divider
        ctx.beginPath();
        ctx.moveTo(PX + 26, yTop + 31);
        ctx.lineTo(PX + PAGE.w - 26, yTop + 31);
        ctx.strokeStyle = "rgba(90,70,30,0.09)";
        ctx.globalAlpha = env;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;

        const rowSettle = isTgt && tgtDone ? settle : 1;

        if (row.written && row.entry) {
          ctx.font = "600 " + row.size.toFixed(1) + "px Caveat, cursive";
          ctx.globalAlpha = row.op * (0.88 + 0.12 * rowSettle);
          ctx.fillStyle = INK + "0.88)";
          ctx.textAlign = "left";
          ctx.fillText(row.entry.item, itemX + row.xj, base + (1 - rowSettle) * 1.2);
          ctx.fillText(row.entry.qty, qtyX + row.qj, base + (1 - rowSettle) * 1.2);
          ctx.textAlign = "right";
          ctx.fillText(row.entry.amount, amtX + row.aj, base + (1 - rowSettle) * 1.2);
          ctx.globalAlpha = 1;
        } else if (isTgt && !row.written && row.entry) {
          const wItem = measure(ctx, row.entry.item);
          const wQty = measure(ctx, row.entry.qty);
          const wAmt = measure(ctx, row.entry.amount);
          ctx.font = "600 " + row.size.toFixed(1) + "px Caveat, cursive";
          ctx.fillStyle = (mode === 'signup' ? PENCIL : INK) + "0.88)";
          if (st.prog('item') > 0) entry(ctx, row.entry.item, itemX + row.xj, base, st.prog('item') * wItem, false);
          if (st.prog('qty') > 0) entry(ctx, row.entry.qty, qtyX + row.qj, base, st.prog('qty') * wQty, false);
          if (st.prog('amt') > 0) entry(ctx, row.entry.amount, amtX + row.aj - wAmt, base, st.prog('amt') * wAmt, true);
        }
      }

      // Mark as written when animation completes
      if (isRowWriting && tc >= tgtDoneAt) rows[rowTargetIdx].written = true;
      if (active && target && target.kind === 'biz' && !bizWritten && tc >= tgtDoneAt) bizWritten = true;

      // Saved highlight
      if (active && target && tgtDone && tc >= 6.2 && tc < 6.85) {
        const ackW = 120, ackX0 = PX + 26, ackMaxX = PX + PAGE.w - 26 - ackW;
        const aX = ackX0 + (ackMaxX - ackX0) * smooth(6.2, 6.7, tc);
        const aA = smooth(6.2, 6.32, tc) * (1 - smooth(6.68, 6.85, tc));
        const aY = target.kind === 'biz' ? PY + 76 : contentTop + (target.row ?? 0) * rowH;
        ctx.fillStyle = "rgba(228,196,120,0.07)";
        ctx.globalAlpha = aA;
        ctx.fillRect(aX, aY + 2, ackW, rowH - 4);
        ctx.globalAlpha = 1;
      }

      // Pen animation
      if (active && target && !tgtDone && tc >= 1.8) {
        const rowBase = target.kind === 'biz'
          ? bizBase
          : contentTop + (target.row ?? 0) * rowH + 27 + rows[target.row ?? 0].seed * 1.1;
        const isBiz = target.kind === 'biz';
        const eName = st.prog('name');
        const eI = st.prog('item'), eQ = st.prog('qty'), eA = st.prog('amt');
        let penX;
        if (isBiz) {
          const wName = measure(ctx, bizName);
          penX = tc < 2.2 ? bizX : (eName < 1 ? bizX + eName * wName : bizX + wName);
        } else {
          const rowIdx = target.row !== undefined ? target.row : -1;
          const row = rows[rowIdx];
          const wItem = measure(ctx, row.entry.item);
          const wQty = measure(ctx, row.entry.qty);
          const wAmt = measure(ctx, row.entry.amount);
          if (tc < 2.2) penX = itemX + row.xj;
          else if (eI < 1) penX = itemX + row.xj + eI * wItem;
          else if (eQ < 1) penX = lerp(itemX + row.xj + wItem, qtyX + row.qj, clamp((tc - 3.7) / 0.1, 0, 1)) + eQ * wQty;
          else if (eA < 1) penX = lerp(qtyX + row.qj + wQty, amtX + row.aj - wAmt, clamp((tc - 4.5) / 0.1, 0, 1)) + eA * wAmt;
          else penX = amtX + row.aj;
        }
        const app = smooth(1.8, 2.3, tc);
        const lift = smooth(tgtDoneAt + 0.12, tgtDoneAt + 0.65, tc);
        const penA = app * (1 - lift);
        if (penA > 0) {
          const jitter = !tgtDone ? Math.sin(tc * 34) * 0.8 + Math.sin(tc * 13.7) * 0.6 : 0;
          const penY = rowBase - 7 + (1 - app) * -20 + lift * -20 + jitter;
          const pcol = mode === 'signup' ? "rgba(88,96,104," : "rgba(31,42,56,";
          ctx.strokeStyle = pcol + (0.13 * penA) + ")";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(penX - 10, penY + 1.5);
          ctx.lineTo(penX, penY);
          ctx.stroke();
          ctx.fillStyle = pcol + (0.85 * penA) + ")";
          ctx.beginPath();
          ctx.arc(penX, penY, 2.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Total
      const totalAmt = total(cycle, tc, rowTargetIdx, active, target);
      const totalY = contentTop + rows.length * rowH;
      ctx.strokeStyle = "rgba(90,70,30,0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PX + 26, totalY + 6);
      ctx.lineTo(PX + PAGE.w - 26, totalY + 6);
      ctx.stroke();
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(PX + 26, totalY + 10);
      ctx.lineTo(PX + PAGE.w - 26, totalY + 10);
      ctx.stroke();
      ctx.font = "600 20px Caveat, cursive";
      ctx.fillStyle = INK + "0.88)";
      ctx.textAlign = "left";
      ctx.fillText("Total", PX + 30, totalY + 30);
      ctx.textAlign = "right";
      ctx.fillText("��" + totalAmt.toLocaleString("en-NG"), amtX, totalY + 30);

      // Saved label
      const label = active && !tgtDone ? "Saving…" : "Saved";
      const savedRamp = smooth(6.8, 7.35, tc);
      const baseA = active && !tgtDone ? 0.42 : 0.55;
      ctx.globalAlpha = baseA + 0.18 * savedRamp;
      ctx.textAlign = "right";
      ctx.font = "500 10.5px Inter, sans-serif";
      ctx.fillStyle = "rgba(120,108,84,0.85)";
      const wSt = measure(ctx, label);
      if (label === "Saved") {
        ctx.strokeStyle = "rgba(120,108,84,0.8)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(PX + PAGE.w - 30 - wSt - 16, PY + PAGE.h - 24);
        ctx.lineTo(PX + PAGE.w - 30 - wSt - 11, PY + PAGE.h - 19);
        ctx.lineTo(PX + PAGE.w - 30 - wSt - 2, PY + PAGE.h - 29);
        ctx.stroke();
      }
      ctx.fillText(label, PX + PAGE.w - 30, PY + PAGE.h - 20);
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    // Animation loop
    const tick = (now: number) => {
      if (last === 0) last = now;
      const dt = Math.min(0.08, (now - last) / 1000);
      last = now;
      t += dt;
      draw(t);
      animationId = requestAnimationFrame(tick);
    };

    // Mouse parallax
    const handleMouseMove = (e: MouseEvent) => {
      if (reducedMotion) return;
      const rect = canvas.getBoundingClientRect();
      parT.x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
      parT.y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
    };

    const handleMouseLeave = () => {
      parT.x = 0;
      parT.y = 0;
    };

    // Initialize
    buildRows();
    prepPaper();
    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    if (reducedMotion || isSmallScreen) {
      // Static frame for reduced motion or small screens
      const staticTargets = mode === 'signup' ? 2 : 1;
      for (let k = 0; k < staticTargets && k < targets.length; k++) {
        if (targets[k].kind === 'biz') bizWritten = true;
        else rows[targets[k].row!].written = true;
      }
      draw(8.5);
    } else {
      animationId = requestAnimationFrame(tick);
    }

    // Load Caveat font
    if (document.fonts && document.fonts.load) {
      document.fonts.load('600 19px Caveat').catch(() => {});
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mode, reducedMotion, isSmallScreen]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full max-w-[460px] h-auto ${className}`}
      role="img"
      aria-label={`A digital Papyr ledger page with handwritten business entries being written - ${mode === 'signin' ? 'existing ledger' : 'new ledger'}`}
      style={{ width: '100%', maxWidth: '460px', height: 'auto', aspectRatio: '460/560' }}
    />
  );
}