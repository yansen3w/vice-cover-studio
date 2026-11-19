// Vice Cover Studio — cover renderer (pure drawing, no DOM).
// drawCover paints one GTA-style multi-panel poster onto a canvas:
// photo panels in a chosen layout, a sunset or neon colour grade,
// and a bold gradient caption over a dark scrim at the bottom.
// Every length is derived from the canvas size, so the same code
// renders the live preview and the exported PNG at any post size.

export const LAYOUTS = {
  hero: {
    label: 'Hero + Strip',
    hint: 'One big hero panel, three stacked beside it',
    rects: () => [
      { x: 0, y: 0, w: 0.615, h: 1 },
      { x: 0.627, y: 0, w: 0.373, h: 0.325 },
      { x: 0.627, y: 0.3375, w: 0.373, h: 0.325 },
      { x: 0.627, y: 0.675, w: 0.373, h: 0.325 },
    ],
  },
  grid: {
    label: 'Four Grid',
    hint: 'Four equal panels',
    rects: () => [
      { x: 0, y: 0, w: 0.494, h: 0.494 },
      { x: 0.506, y: 0, w: 0.494, h: 0.494 },
      { x: 0, y: 0.506, w: 0.494, h: 0.494 },
      { x: 0.506, y: 0.506, w: 0.494, h: 0.494 },
    ],
  },
  full: {
    label: 'Full Frame',
    hint: 'One photo edge to edge',
    rects: () => [{ x: 0, y: 0, w: 1, h: 1 }],
  },
  triptych: {
    label: 'Triptych',
    hint: 'Three tall panels side by side',
    rects: () => [
      { x: 0, y: 0, w: 0.325, h: 1 },
      { x: 0.3375, y: 0, w: 0.325, h: 1 },
      { x: 0.675, y: 0, w: 0.325, h: 1 },
    ],
  },
  duo: {
    label: 'Duo Split',
    hint: 'Two panels, left and right',
    rects: () => [
      { x: 0, y: 0, w: 0.494, h: 1 },
      { x: 0.506, y: 0, w: 0.494, h: 1 },
    ],
  },
};

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    hint: 'Golden hour over the bay',
    sky: ['#ffb347', '#ff5e7a', '#b537f2'],
    wash: 'rgba(255, 122, 26, 0.20)',
    tint: 'rgba(255, 94, 122, 0.12)',
    title: ['#ffe259', '#ffa751', '#ff2e63'],
    scrim: 'rgba(24, 4, 32, 0.88)',
  },
  neon: {
    label: 'Neon Nights',
    hint: 'Magenta and cyan after dark',
    sky: ['#ff2e88', '#7b2ff7', '#00e5ff'],
    wash: 'rgba(255, 46, 136, 0.22)',
    tint: 'rgba(0, 229, 255, 0.10)',
    title: ['#00e5ff', '#ff2e88', '#ffe259'],
    scrim: 'rgba(10, 2, 28, 0.88)',
  },
  dusk: {
    label: 'Palm Dusk',
    hint: 'Violet dusk, teal shadows',
    sky: ['#8e2de2', '#4a00e0', '#00b4a2'],
    wash: 'rgba(142, 45, 226, 0.20)',
    tint: 'rgba(0, 180, 162, 0.12)',
    title: ['#f5d76e', '#c86bff', '#4a00e0'],
    scrim: 'rgba(16, 6, 34, 0.88)',
  },
  pink: {
    label: 'Hot Pink',
    hint: 'Bubblegum pink wash',
    sky: ['#ff6ec7', '#ff2e63', '#ff9a3d'],
    wash: 'rgba(255, 110, 199, 0.24)',
    tint: 'rgba(255, 46, 99, 0.10)',
    title: ['#ffffff', '#ff6ec7', '#ff2e63'],
    scrim: 'rgba(40, 2, 28, 0.88)',
  },
  noir: {
    label: 'Teal Noir',
    hint: 'Cool night, single warm spark',
    sky: ['#0f2027', '#203a43', '#f5af19'],
    wash: 'rgba(15, 32, 39, 0.30)',
    tint: 'rgba(245, 175, 25, 0.10)',
    title: ['#f5af19', '#f7f7f7', '#2c5364'],
    scrim: 'rgba(4, 12, 16, 0.90)',
  },
};

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait · 1080 × 1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide · 1920 × 1080' },
};

// Draw an image so it covers a rectangle, keeping its aspect ratio.
// pan.x / pan.y shift the photo inside the frame (-1..1) and zoom
// enlarges it; the photo always covers the whole rectangle.
function paintPhoto(ctx, img, rect, pan) {
  const zoom = Math.max(1, pan.zoom || 1);
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * base;
  const dh = img.naturalHeight * base;
  const dx = rect.x + (rect.w - dw) / 2 + (pan.x || 0) * Math.max(0, (dw - rect.w) / 2);
  const dy = rect.y + (rect.h - dh) / 2 + (pan.y || 0) * Math.max(0, (dh - rect.h) / 2);
  ctx.drawImage(img, dx, dy, dw, dh);
}

// A five-point star path, used for the small corner badge.
function starPath(ctx, cx, cy, outer, inner) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

// Fill a rectangle with a vertical gradient built from colour stops.
function skyWash(ctx, rect, stops, alpha) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

// Paint the caption block: a dark scrim rising from the bottom, the
// title in big condensed letters with a gradient fill and dark edge,
// and the subtitle underneath in a flowing script face.
function paintCaption(ctx, state, grade, W, H) {
  const title = (state.title || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim();
  if (!title && !sub) return;

  const bandH = H * 0.24;
  const scrim = ctx.createLinearGradient(0, H - bandH, 0, H);
  scrim.addColorStop(0, 'rgba(10, 2, 20, 0)');
  scrim.addColorStop(0.55, grade.scrim);
  scrim.addColorStop(1, grade.scrim);
  ctx.fillStyle = scrim;
  ctx.fillRect(0, H - bandH, W, bandH);

  const cx = W / 2;
  let baseline = H - H * 0.055;
  if (sub) baseline -= H * 0.045;

  if (title) {
    // Shrink the title until it fits inside 92% of the width.
    let px = H * 0.115;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    while (px > 20) {
      ctx.font = `${px}px Anton, sans-serif`;
      if (ctx.measureText(title).width <= W * 0.92) break;
      px -= 4;
    }
    const grad = ctx.createLinearGradient(0, baseline - px, 0, baseline + px * 0.12);
    grade.title.forEach((c, i) => grad.addColorStop(i / (grade.title.length - 1), c));
    ctx.lineWidth = Math.max(3, px * 0.07);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(18, 2, 26, 0.9)';
    ctx.strokeText(title, cx, baseline);
    ctx.fillStyle = grad;
    ctx.fillText(title, cx, baseline);
  }

  if (sub) {
    const spx = Math.max(22, H * 0.052);
    ctx.font = `${spx}px "Great Vibes", cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = spx * 0.25;
    ctx.shadowOffsetY = spx * 0.06;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sub, cx, H - H * 0.028);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
}

// Paint one poster. state: { layout, grade, title, subtitle, photos,
// panels } where panels[i] = { photo, x, y, zoom } and photos are
// HTMLImageElements (or null for an empty panel).
export function drawCover(ctx, state, W, H) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  const layout = LAYOUTS[state.layout] || LAYOUTS.hero;
  const rects = layout.rects();

  // Paper-white gutters between the panels.
  ctx.fillStyle = '#f7f1e5';
  ctx.fillRect(0, 0, W, H);

  const gut = Math.max(2, Math.round(W * 0.004));
  rects.forEach((r, i) => {
    const rect = {
      x: r.x * W + gut,
      y: r.y * H + gut,
      w: r.w * W - gut * 2,
      h: r.h * H - gut * 2,
    };
    const place = state.panels[i] || { photo: -1, x: 0, y: 0, zoom: 1 };
    const img = place.photo >= 0 ? state.photos[place.photo] : null;

    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (img && img.complete && img.naturalWidth > 0) {
      paintPhoto(ctx, img, rect, place);
      // Sunset or neon wash over the photo, then a soft tint, then a
      // warm gradient rising from the bottom like low evening sun.
      ctx.globalCompositeOperation = 'overlay';
      skyWash(ctx, rect, grade.sky, 0.38);
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = grade.tint;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.globalCompositeOperation = 'source-over';
      const warm = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
      warm.addColorStop(0, 'rgba(255, 160, 60, 0)');
      warm.addColorStop(1, grade.wash);
      ctx.fillStyle = warm;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    } else {
      // Empty panel: a warm placeholder gradient with a hint.
      skyWash(ctx, rect, grade.sky, 0.85);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = `${Math.round(rect.h * 0.09)}px Anton, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
    ctx.restore();

    // Thin dark edge so panels read as separate frames.
    ctx.strokeStyle = 'rgba(20, 4, 28, 0.55)';
    ctx.lineWidth = Math.max(1, W * 0.0012);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  // Small star badge on the hero panel's top corner.
  const starR = Math.max(10, W * 0.026);
  const sx = W * 0.585;
  const sy = H * 0.045;
  ctx.save();
  ctx.fillStyle = '#ffd23e';
  ctx.strokeStyle = 'rgba(20, 4, 28, 0.9)';
  ctx.lineWidth = Math.max(2, starR * 0.12);
  starPath(ctx, sx, sy, starR, starR * 0.45);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  paintCaption(ctx, state, grade, W, H);
}

// Render the current state to a fresh canvas at exact export size.
export function renderCover(state, W, H) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  drawCover(canvas.getContext('2d'), state, W, H);
  return canvas;
}

// A plain snapshot of the state the export needs, without live images.
export function coverState(state) {
  return {
    layout: state.layout,
    grade: state.grade,
    title: state.title,
    subtitle: state.subtitle,
    size: state.size,
    panels: state.panels.map((p) => ({ ...p })),
    photoNames: state.photos.map((p) => p.name),
  };
}
