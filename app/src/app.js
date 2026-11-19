// Vice Cover Studio — editor wiring.
// Owns the state, the photo tray, the layout and grade controls,
// drag-to-position on the preview, and the PNG export.
// All drawing lives in cover.js; this file only moves state around.

import { LAYOUTS, GRADES, SIZES, drawCover, renderCover } from './cover.js';

const SAMPLES = [
  { name: 'boulevard', src: 'samples/boulevard.jpg', label: 'Boulevard' },
  { name: 'pier', src: 'samples/pier.jpg', label: 'Pier' },
];

const state = {
  layout: 'hero',
  grade: 'sunset',
  size: '1080x1080',
  title: 'Neon Shore',
  subtitle: 'chase the sunset',
  photos: [], // { name, label, img } — img is an HTMLImageElement
  panels: [], // { photo, x, y, zoom } one per layout rect
  selected: 0, // panel the drag and zoom controls act on
  pickedPhoto: 0, // photo the next panel click places
};

const $ = (sel) => document.querySelector(sel);
const preview = $('#preview');
const pctx = preview.getContext('2d');

function panelCount() {
  return LAYOUTS[state.layout].rects().length;
}

// Keep one placement record per panel; new panels start with the
// first photo, older ones keep their photo when the layout changes.
function syncPanels() {
  const n = panelCount();
  const next = [];
  for (let i = 0; i < n; i++) {
    const old = state.panels[i];
    next.push(old || { photo: state.photos.length ? 0 : -1, x: 0, y: 0, zoom: 1 });
  }
  state.panels = next;
  if (state.selected >= n) state.selected = 0;
}

// Redraw the preview canvas at the current export size.
function draw() {
  const size = SIZES[state.size];
  if (preview.width !== size.w || preview.height !== size.h) {
    preview.width = size.w;
    preview.height = size.h;
  }
  drawCover(pctx, { ...state, photos: state.photos.map((p) => p.img) }, size.w, size.h);
  const zoom = $('#zoom');
  if (zoom) zoom.value = String(Math.round((state.panels[state.selected]?.zoom || 1) * 100));
  const readout = $('#zoomReadout');
  if (readout) readout.textContent = `${Math.round((state.panels[state.selected]?.zoom || 1) * 100)}%`;
  updatePanelList();
}

// The small strip under the preview naming each panel's photo.
function updatePanelList() {
  const list = $('#panelList');
  if (!list) return;
  list.innerHTML = '';
  state.panels.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'panel-chip' + (i === state.selected ? ' active' : '');
    const name = p.photo >= 0 ? state.photos[p.photo]?.label || `Photo ${p.photo + 1}` : 'Empty';
    b.textContent = `Panel ${i + 1} · ${name}`;
    b.addEventListener('click', () => {
      state.selected = i;
      draw();
    });
    list.appendChild(b);
  });
}

// Add one image (an <img> already loaded) to the tray.
function addPhoto(name, label, img) {
  state.photos.push({ name, label, img });
  state.pickedPhoto = state.photos.length - 1;
  renderTray();
  // Empty panels take the newest photo right away.
  state.panels.forEach((p) => {
    if (p.photo < 0) p.photo = state.pickedPhoto;
  });
  draw();
}

function renderTray() {
  const tray = $('#tray');
  tray.innerHTML = '';
  state.photos.forEach((p, i) => {
    const t = document.createElement('button');
    t.type = 'button';
    t.className = 'thumb' + (i === state.pickedPhoto ? ' picked' : '');
    t.title = p.label;
    const im = document.createElement('img');
    im.src = p.img.src;
    im.alt = p.label;
    t.appendChild(im);
    t.addEventListener('click', () => {
      state.pickedPhoto = i;
      renderTray();
    });
    tray.appendChild(t);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadSamples() {
  for (const s of SAMPLES) {
    try {
      const img = await loadImage(s.src);
      state.photos.push({ name: s.name, label: s.label, img });
    } catch (e) {
      console.warn('sample failed to load:', s.src);
    }
  }
  renderTray();
  syncPanels();
  draw();
}

function readParams() {
  const q = new URLSearchParams(location.search);
  if (q.get('layout') && LAYOUTS[q.get('layout')]) state.layout = q.get('layout');
  if (q.get('grade') && GRADES[q.get('grade')]) state.grade = q.get('grade');
  if (q.get('size') && SIZES[q.get('size')]) state.size = q.get('size');
  if (q.get('caption')) state.title = q.get('caption');
  if (q.get('sub') !== null) state.subtitle = q.get('sub') || '';
  return q;
}

function buildButtons() {
  const lay = $('#layoutBtns');
  Object.entries(LAYOUTS).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice' + (key === state.layout ? ' active' : '');
    b.textContent = def.label;
    b.title = def.hint;
    b.addEventListener('click', () => {
      state.layout = key;
      syncPanels();
      lay.querySelectorAll('.choice').forEach((c) => c.classList.remove('active'));
      b.classList.add('active');
      draw();
    });
    lay.appendChild(b);
  });

  const grd = $('#gradeBtns');
  Object.entries(GRADES).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice' + (key === state.grade ? ' active' : '');
    b.textContent = def.label;
    b.title = def.hint;
    b.addEventListener('click', () => {
      state.grade = key;
      grd.querySelectorAll('.choice').forEach((c) => c.classList.remove('active'));
      b.classList.add('active');
      draw();
    });
    grd.appendChild(b);
  });

  const sz = $('#sizeBtns');
  Object.entries(SIZES).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice' + (key === state.size ? ' active' : '');
    b.textContent = def.label;
    b.addEventListener('click', () => {
      state.size = key;
      sz.querySelectorAll('.choice').forEach((c) => c.classList.remove('active'));
      b.classList.add('active');
      draw();
    });
    sz.appendChild(b);
  });
}

// Which panel sits under a point on the preview canvas (pixels)?
function panelAt(px, py) {
  const size = SIZES[state.size];
  const rects = LAYOUTS[state.layout].rects();
  const rx = (px / preview.clientWidth) * size.w;
  const ry = (py / preview.clientHeight) * size.h;
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (rx >= r.x * size.w && rx <= (r.x + r.w) * size.w && ry >= r.y * size.h && ry <= (r.y + r.h) * size.h) {
      return i;
    }
  }
  return -1;
}

function wirePointer() {
  let drag = null;
  preview.addEventListener('pointerdown', (e) => {
    const box = preview.getBoundingClientRect();
    const i = panelAt(e.clientX - box.left, e.clientY - box.top);
    if (i < 0) return;
    state.selected = i;
    preview.setPointerCapture(e.pointerId);
    drag = { panel: i, x: e.clientX, y: e.clientY };
    draw();
  });
  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const box = preview.getBoundingClientRect();
    const p = state.panels[drag.panel];
    const size = SIZES[state.size];
    const rect = LAYOUTS[state.layout].rects()[drag.panel];
    const scaleX = (rect.w * size.w) / box.width;
    const scaleY = (rect.h * size.h) / box.height;
    // Pan in fractions of the photo's overflow, clamped to the frame.
    const overflowX = Math.max(0.001, (p.zoom - 1) * 0.5 + 0.5);
    const overflowY = Math.max(0.001, (p.zoom - 1) * 0.5 + 0.5);
    p.x = clamp(p.x + ((e.clientX - drag.x) * scaleX) / (rect.w * size.w * overflowX) * 2, -1, 1);
    p.y = clamp(p.y + ((e.clientY - drag.y) * scaleY) / (rect.h * size.h * overflowY) * 2, -1, 1);
    drag.x = e.clientX;
    drag.y = e.clientY;
    draw();
  });
  const end = () => {
    drag = null;
  };
  preview.addEventListener('pointerup', end);
  preview.addEventListener('pointercancel', end);
  // Clicking a panel with a tray photo picked places that photo there.
  preview.addEventListener('click', (e) => {
    if (drag) return;
    const box = preview.getBoundingClientRect();
    const i = panelAt(e.clientX - box.left, e.clientY - box.top);
    if (i >= 0 && state.photos.length) {
      state.panels[i].photo = state.pickedPhoto;
      state.selected = i;
      draw();
    }
  });
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function wireControls() {
  $('#photoInput').addEventListener('change', async (e) => {
    for (const file of e.target.files) {
      if (!file.type.startsWith('image/')) continue;
      const url = URL.createObjectURL(file);
      try {
        const img = await loadImage(url);
        addPhoto(file.name.replace(/\.[^.]+$/, ''), file.name, img);
      } catch (err) {
        console.warn('could not read photo:', file.name);
      }
    }
    e.target.value = '';
  });

  $('#fillAll').addEventListener('click', () => {
    if (!state.photos.length) return;
    state.panels.forEach((p) => {
      p.photo = state.pickedPhoto;
      p.x = 0;
      p.y = 0;
    });
    draw();
  });

  $('#shuffle').addEventListener('click', () => {
    const layouts = Object.keys(LAYOUTS);
    const grades = Object.keys(GRADES);
    state.layout = layouts[Math.floor(Math.random() * layouts.length)];
    state.grade = grades[Math.floor(Math.random() * grades.length)];
    syncPanels();
    document.querySelectorAll('#layoutBtns .choice').forEach((c, i) => {
      c.classList.toggle('active', layouts[i] === state.layout);
    });
    document.querySelectorAll('#gradeBtns .choice').forEach((c, i) => {
      c.classList.toggle('active', grades[i] === state.grade);
    });
    draw();
  });

  $('#zoom').addEventListener('input', (e) => {
    const p = state.panels[state.selected];
    if (!p) return;
    p.zoom = Number(e.target.value) / 100;
    draw();
  });

  $('#titleInput').addEventListener('input', (e) => {
    state.title = e.target.value;
    draw();
  });
  $('#subInput').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    draw();
  });

  $('#exportBtn').addEventListener('click', () => {
    const size = SIZES[state.size];
    const canvas = renderCover(
      { ...state, photos: state.photos.map((p) => p.img) },
      size.w,
      size.h,
    );
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-cover-${state.size}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      const note = $('#exportNote');
      if (note) note.textContent = `Saved vice-cover-${state.size}.png — ${size.w} × ${size.h}.`;
    }, 'image/png');
  });
}

// Cover mode (?shot=cover) hides the editor and shows only the poster,
// the app's own drawing of the exported cover, edge to edge.
function applyShotMode(q) {
  if (q.get('shot') !== 'cover') return;
  document.body.classList.add('present');
  const size = SIZES[state.size];
  // Fit the whole poster inside the viewport, keeping its aspect.
  const fit = Math.min(window.innerWidth / size.w, window.innerHeight / size.h);
  preview.style.width = `${Math.round(size.w * fit)}px`;
  preview.style.height = `${Math.round(size.h * fit)}px`;
  preview.style.maxWidth = 'none';
  preview.style.maxHeight = 'none';
}

async function init() {
  const q = readParams();
  buildButtons();
  wirePointer();
  wireControls();
  $('#titleInput').value = state.title;
  $('#subInput').value = state.subtitle;
  applyShotMode(q);

  // Wait for the bundled fonts so the first paint already has them.
  try {
    await Promise.all([
      document.fonts.load('80px Anton'),
      document.fonts.load('60px "Great Vibes"'),
      document.fonts.ready,
    ]);
  } catch (e) {
    console.warn('font load raced, drawing anyway');
  }
  await loadSamples();
  const want = q.get('photo');
  if (want) {
    const idx = state.photos.findIndex((p) => p.name === want);
    if (idx >= 0) {
      state.pickedPhoto = idx;
      state.panels.forEach((p) => {
        p.photo = idx;
      });
      renderTray();
      draw();
    }
  }
  draw();
}

init();
