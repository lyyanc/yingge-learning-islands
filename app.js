/* 鶯歌工商・九座學習島：雲端島嶼、橋梁、師生、主題場景與校園尋寶。
   科別介紹、島嶼位置與主題都在 data.js，這個檔案只負責畫面與互動。 */
(() => {
'use strict';

const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const app = $('app'), svg = $('map'), stage = $('stage'), side = $('side');
const VIEW_W = 1100, VIEW_H = 900, RX = 139, RY = 84, CLIFF = 27;
const TOTAL = ISLANDS.length;
ISLANDS.forEach((z, i) => { z.n = i + 1; });
const byId = Object.fromEntries(ISLANDS.map(z => [z.id, z]));
const pad = n => String(n).padStart(2, '0');

/* ---------- 小工具 ---------- */
function E(tag, attrs = {}, parent = svg) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  parent.appendChild(el);
  return el;
}
const P = list => list.map(p => p.join(',')).join(' ');
const poly = (points, fill, parent, extra = {}) => E('polygon', {points: P(points), fill, ...extra}, parent);
const rect = (x, y, width, height, fill, parent, extra = {}) => E('rect', {x, y, width, height, fill, ...extra}, parent);
const ellipse = (cx, cy, rx, ry, fill, parent, extra = {}) => E('ellipse', {cx, cy, rx, ry, fill, ...extra}, parent);
const circle = (cx, cy, r, fill, parent, extra = {}) => E('circle', {cx, cy, r, fill, ...extra}, parent);
const line = (x1, y1, x2, y2, stroke, width, parent, extra = {}) => E('line', {x1, y1, x2, y2, stroke, 'stroke-width': width, 'stroke-linecap': 'round', ...extra}, parent);
const path = (d, fill, parent, extra = {}) => E('path', {d, fill, ...extra}, parent);
const group = (parent, attrs = {}) => E('g', attrs, parent);
const at = (parent, x, y, attrs = {}) => E('g', {transform: `translate(${x} ${y})`, ...attrs}, parent);
function txt(x, y, text, cls, parent, extra = {}) {
  const t = E('text', {x, y, 'text-anchor': 'middle', ...extra}, parent);
  if (cls) t.setAttribute('class', cls);
  t.textContent = text;
  return t;
}
function activate(el, fn) {
  el.addEventListener('click', e => { e.stopPropagation(); fn(e); });
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); } });
}
const store = {
  get(key, fallback) { try { const v = localStorage.getItem(`${SCHOOL.storage}:${key}`); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(`${SCHOOL.storage}:${key}`, JSON.stringify(value)); return true; } catch { return false; } }
};
function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------- 天空：雲、星星 ---------- */
const sky = $('cloudscape');
for (let i = 0; i < 8; i++) {
  const c = document.createElement('div');
  c.className = 'cloud ' + (i % 3 === 0 ? 'low' : 'high');
  c.style.setProperty('--top', `${[7, 23, 43, 68, 83, 13, 57, 95][i]}%`);
  c.style.setProperty('--scale', String([.63, 1.2, .9, 1.6, .72, 1.1, 1.35, .65][i]));
  c.style.setProperty('--duration', `${[52, 67, 78, 85, 58, 96, 73, 64][i]}s`);
  c.style.animationDelay = `-${i * 13}s`;
  sky.append(c);
}
for (let i = 0; i < 60; i++) {
  const s = document.createElement('span');
  s.className = 'star';
  s.style.left = `${(i * 37.3) % 100}%`;
  s.style.top = `${(i * 61.7) % 100}%`;
  s.style.setProperty('--glow', String(.35 + (i % 5) * .15));
  s.style.animationDelay = `-${(i % 7) * .5}s`;
  sky.append(s);
}

/* ---------- SVG 圖層（由下往上畫） ---------- */
const defs = E('defs');
const under = E('linearGradient', {id: 'underside', x1: 0, y1: 0, x2: 0, y2: 1}, defs);
E('stop', {offset: '0', 'stop-color': '#c9a07a'}, under);
E('stop', {offset: '1', 'stop-color': '#8a6047'}, under);
const layer = {};
for (const name of ['sky', 'ground', 'bridges', 'features', 'buildings', 'scenes', 'people', 'principal', 'labels', 'chests']) layer[name] = group(svg, {id: `layer-${name}`});

for (let i = 0; i < 80; i++) circle(30 + (i * 163) % 1040, 24 + (i * 97) % 850, i % 6 === 0 ? 2.3 : 1.1, '#fff', layer.sky, {class: 'sky-dot'});

const hex = (cx, cy, rx = RX, ry = RY) => [[cx - rx, cy], [cx - rx * .48, cy - ry], [cx + rx * .48, cy - ry], [cx + rx, cy], [cx + rx * .48, cy + ry], [cx - rx * .48, cy + ry]];

function tree(parent, x, y, s = 1) {
  const g = group(parent, {class: 'tree', transform: `translate(${x} ${y}) scale(${s})`});
  ellipse(3, 12, 14, 7, '#5d947837', g);
  rect(-3, -18, 6, 28, '#966f4b', g, {rx: 2});
  ellipse(-8, -24, 17, 20, '#68a986', g);
  ellipse(9, -30, 16, 19, '#7bb795', g);
  ellipse(0, -40, 18, 19, '#87c4a0', g);
  ellipse(-7, -42, 6, 5, '#b3d9ab77', g);
}

function vase(parent, x, base, w, h, color, extra = {}) {
  path(`M ${x - w * .6} ${base} Q ${x - w} ${base - h * .45} ${x - w * .35} ${base - h * .75} L ${x - w * .3} ${base - h} L ${x + w * .3} ${base - h} L ${x + w * .35} ${base - h * .75} Q ${x + w} ${base - h * .45} ${x + w * .6} ${base} Z`, color, parent, {stroke: '#fff7ea', 'stroke-width': 1.2, ...extra});
  line(x - w * .38, base - h * .55, x - w * .4, base - h * .25, '#ffffff99', 1.4, parent);
}

/* ---------- 各科的代表物件（畫在島的左側） ---------- */
const FEATURES = {
  pottery(a) { // 陶瓷工程科：陶藝層架與大陶甕
    ellipse(0, 20, 32, 6, '#00000018', a);
    rect(-28, -2, 42, 4, '#a7774f', a, {rx: 1});
    rect(-28, 13, 42, 3, '#a7774f', a, {rx: 1});
    line(-26, 2, -26, 19, '#8a5f3d', 3, a); line(12, 2, 12, 19, '#8a5f3d', 3, a);
    vase(a, -19, -2, 7, 14, '#7fb6a4');
    vase(a, -6, -2, 6, 19, '#c0794e');
    vase(a, 6, -2, 7, 12, '#4f78b0');
    vase(a, -12, 13, 6, 9, '#e3c08a');
    vase(a, 2, 13, 5, 10, '#9fc7bd');
    path('M 18 20 Q 11 8 18 -3 L 20 -7 L 30 -7 L 32 -3 Q 39 8 32 20 Z', '#9c5a3a', a, {stroke: '#f0cfae', 'stroke-width': 1.4});
    line(17, 6, 33, 6, '#c98b62', 1.6, a);
  },
  glass(a) { // 美術工藝科：玻璃工藝與木工
    ellipse(0, 20, 32, 6, '#00000018', a);
    rect(-28, 8, 52, 6, '#c99a6b', a, {rx: 2});
    line(-23, 14, -23, 21, '#9b7150', 3, a); line(19, 14, 19, 21, '#9b7150', 3, a);
    vase(a, -15, 8, 7, 18, '#86d3e6', {opacity: .85});
    vase(a, -1, 8, 8, 25, '#b7a2ef', {opacity: .85});
    vase(a, 13, 8, 6, 15, '#f4a9c6', {opacity: .85});
    txt(22, -16, '✦', 'pulse', a, {'font-size': 12, fill: '#e2b456'});
    rect(-34, -6, 12, 6, '#b07c4f', a, {rx: 1, transform: 'rotate(-24 -28 -3)'});
    line(-26, -2, -18, 6, '#7c5a3d', 2.4, a);
  },
  film(a) { // 多媒體設計科：螢幕與攝影機
    ellipse(0, 20, 32, 6, '#00000018', a);
    rect(-30, -26, 38, 26, '#334a63', a, {rx: 3});
    rect(-27, -23, 32, 20, '#8fd3ef', a, {rx: 1});
    poly([[-15, -18], [-15, -8], [-6, -13]], '#fff', a);
    line(-11, 0, -11, 17, '#56677a', 2.4, a); line(-19, 18, -3, 18, '#56677a', 2.4, a);
    rect(10, -12, 16, 11, '#3a4250', a, {rx: 2});
    circle(18, -6.5, 3.6, '#9ad7ef', a);
    poly([[26, -10], [32, -13], [32, -3], [26, -5]], '#3a4250', a);
    circle(13, -10, 1.3, '#ff6b6b', a, {class: 'cam-light'});
    for (const x2 of [12, 18, 24]) line(18, -1, x2, 19, '#6c6c6c', 2, a);
  },
  billboard(a) { // 廣告設計科：廣告看板
    ellipse(0, 20, 32, 6, '#00000018', a);
    line(-16, -2, -16, 19, '#8b6f58', 3, a); line(16, -2, 16, 19, '#8b6f58', 3, a);
    rect(-30, -30, 60, 30, '#fffaf0', a, {rx: 3, stroke: '#e48aa2', 'stroke-width': 2.5});
    circle(-18, -15, 7, '#f6c453', a, {class: 'pulse'});
    poly([[-6, -6], [3, -24], [12, -6]], '#7cc4b2', a);
    rect(14, -23, 11, 14, '#e48aa2', a, {rx: 1});
    txt(0, -34, 'AD', '', a, {'font-size': 9, 'font-weight': 900, fill: '#c25b78'});
  },
  circuit(a) { // 資訊科：電路板與電腦
    ellipse(0, 20, 32, 6, '#00000018', a);
    rect(-30, -4, 42, 22, '#2f8f7e', a, {rx: 4, stroke: '#ffffff66', 'stroke-width': 1.5});
    for (let k = 0; k < 3; k++) line(-26, 1 + k * 6, 8, 1 + k * 6, '#f3dc8e', 1.5, a);
    rect(-16, 2, 10, 10, '#21384a', a, {rx: 1});
    circle(4, 11, 3, '#7ef0c1', a, {class: 'pulse'});
    rect(10, -28, 26, 19, '#2c3a4d', a, {rx: 2});
    rect(12, -26, 22, 15, '#9fe3f2', a);
    line(15, -22, 24, -22, '#2c3a4d', 1.2, a); line(15, -18, 30, -18, '#2c3a4d', 1.2, a); line(15, -14, 22, -14, '#2c3a4d', 1.2, a);
    rect(20, -9, 6, 5, '#55647a', a);
  },
  chart(a) { // 資料處理科：長條圖與成長箭頭
    ellipse(0, 20, 32, 6, '#00000018', a);
    rect(-28, 14, 56, 5, '#d8c7b0', a, {rx: 2});
    [[-22, 14, '#9fd0bb'], [-10, 22, '#79b8a0'], [2, 30, '#e7c46c'], [14, 40, '#d98b6a']].forEach(([x, h, c], k) => rect(x, 14 - h, 9, h, c, a, {rx: 1.5, class: 'bar', style: `animation-delay:${-k * .4}s`}));
    path('M -24 -6 L -8 -14 L 4 -12 L 20 -32', 'none', a, {stroke: '#2f6f60', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
    poly([[22, -34], [13, -31], [20, -24]], '#2f6f60', a);
  },
  torii(a) { // 應用日語科：鳥居與櫻花
    ellipse(0, 20, 32, 6, '#00000018', a);
    line(18, 18, 18, -2, '#8a5d44', 3.4, a);
    for (const [x, y, r] of [[10, -8, 8], [22, -12, 9], [16, -20, 8], [26, -2, 6]]) circle(x, y, r, '#f6bfd0', a);
    for (let k = 0; k < 3; k++) circle(6 + k * 8, -18, 1.8, '#f08fb0', a, {class: 'petal-fall', style: `animation-delay:${-k * 1.2}s`});
    rect(-26, -4, 3.5, 23, '#d4483b', a); rect(-7, -4, 3.5, 23, '#d4483b', a);
    rect(-30, -9, 31, 4, '#d4483b', a, {rx: 1});
    path('M -33 -16 Q -14 -11 4 -16 L 4 -12 Q -14 -8 -33 -12 Z', '#2e2a2a', a);
  },
  shop(a) { // 門市服務科：小店面與購物車
    ellipse(0, 20, 32, 6, '#00000018', a);
    rect(-26, -6, 40, 24, '#fff7ea', a, {rx: 2, stroke: '#e3c9a8', 'stroke-width': 1.5});
    for (let k = 0; k < 5; k++) {
      const c = k % 2 ? '#fff' : '#e86f5a';
      rect(-28 + k * 9, -16, 9, 9, c, a);
      circle(-23.5 + k * 9, -7, 4.5, c, a);
    }
    rect(-22, 5, 32, 8, '#a7c96c', a, {rx: 1});
    rect(-14, -1, 12, 6, '#6aa3c7', a, {rx: 1});
    rect(-18, -27, 22, 9, '#2f6f60', a, {rx: 2});
    txt(-7, -20.5, 'OPEN', '', a, {'font-size': 6, fill: '#fff', 'font-weight': 900});
    const cart = group(a, {class: 'cart'});
    path('M 18 2 L 22 2 L 25 12 L 34 12 L 36 5 L 23 5', 'none', cart, {stroke: '#4c6b74', 'stroke-width': 1.8, 'stroke-linejoin': 'round'});
    rect(25, 3, 9, 4, '#f2c46b', cart, {rx: 1});
    circle(26, 15, 1.8, '#4c6b74', cart); circle(33, 15, 1.8, '#4c6b74', cart);
  },
  baseball(a) { // 體育班：棒球場、拳擊手套
    ellipse(0, 20, 34, 6, '#00000018', a);
    poly([[0, -12], [30, 2], [0, 16], [-30, 2]], '#c98f5f', a, {stroke: '#fff9e5', 'stroke-width': 2});
    poly([[0, -4], [14, 2], [0, 8], [-14, 2]], '#78b07a', a);
    for (const [x, y] of [[0, -12], [30, 2], [0, 16], [-30, 2]]) rect(x - 2.5, y - 2.5, 5, 5, '#fff', a, {transform: `rotate(45 ${x} ${y})`});
    txt(-12, -16, '⚾', 'ball', a, {'font-size': 14});
    txt(20, -12, '🥊', 'pulse', a, {'font-size': 14});
  }
};

/* ---------- 四種主題的場景小物 ---------- */
const SCENES = {
  wheel(a) { // 拉坯機
    ellipse(0, 14, 22, 6, '#00000018', a);
    rect(-16, 2, 32, 12, '#7b8c99', a, {rx: 3});
    ellipse(0, 2, 18, 6, '#a9b8c2', a);
    const pot = group(a, {class: 'spin-pot'});
    path('M -9 1 Q -13 -10 -6 -16 L -5 -21 L 5 -21 L 6 -16 Q 13 -10 9 1 Z', '#c98a5e', pot, {stroke: '#f3d1b0', 'stroke-width': 1.2});
    line(-5, -12, 5, -12, '#a76a44', 1.2, pot); line(-8, -6, 8, -6, '#a76a44', 1.2, pot);
    txt(17, -18, '⟳', 'note', a, {'font-size': 12, fill: '#a0694a'});
  },
  kiln(a) { // 柴窯
    ellipse(0, 15, 24, 6, '#00000018', a);
    path('M -22 14 V 0 Q -22 -18 0 -20 Q 22 -18 22 0 V 14 Z', '#b5643f', a, {stroke: '#f2cfae', 'stroke-width': 1.6});
    path('M -22 2 H 22 M -20 -9 H 20', 'none', a, {stroke: '#93492b', 'stroke-width': 1.3});
    path('M -7 14 V 4 Q 0 -4 7 4 V 14 Z', '#3b2620', a);
    ellipse(0, 10, 5, 3.6, '#ffb347', a, {class: 'flame'});
    rect(10, -34, 7, 18, '#93492b', a, {rx: 1});
    for (let s = 0; s < 3; s++) circle(13.5, -37, 4 + s, '#f5f0ea', a, {class: 'smoke', style: `animation-delay:${-s * .8}s`});
  },
  tea(a) { // 茶席
    ellipse(0, 13, 24, 5, '#00000018', a);
    poly([[-22, 2], [0, -8], [22, 2], [0, 12]], '#9b6b4a', a, {stroke: '#e9cfae', 'stroke-width': 1.2});
    line(-18, 4, -18, 12, '#7b5238', 2.5, a); line(18, 4, 18, 12, '#7b5238', 2.5, a); line(0, 12, 0, 17, '#7b5238', 2.5, a);
    ellipse(-4, -4, 7, 5.5, '#6e8f86', a);
    rect(-6, -12, 4, 3, '#6e8f86', a, {rx: 1});
    line(3, -5, 9, -9, '#6e8f86', 2.4, a);
    for (const [x, y] of [[9, 2], [14, -1], [-13, 3]]) rect(x - 2.5, y - 4, 5, 4, '#f4ecdf', a, {rx: 1});
    path('M -4 -14 q 3 -4 0 -8 q -3 -4 0 -8', 'none', a, {stroke: '#fff', 'stroke-width': 1.6, class: 'steam'});
  },
  robot(a) {
    rect(-17, -18, 34, 32, '#dfeefa', a, {rx: 7, stroke: '#478fa3', 'stroke-width': 3});
    circle(-7, -5, 4, '#48b7c9', a, {class: 'pulse'}); circle(7, -5, 4, '#48b7c9', a, {class: 'pulse'});
    path('M -8 5 Q 0 12 8 5', 'none', a, {stroke: '#607895', 'stroke-width': 2});
    line(0, -18, 0, -27, '#507fa0', 3, a); circle(0, -29, 4, '#e5b96f', a);
    rect(-24, -10, 8, 18, '#7ab0c3', a, {rx: 3}); rect(16, -10, 8, 18, '#7ab0c3', a, {rx: 3});
    rect(-12, 14, 8, 8, '#6b8c9d', a, {rx: 2}); rect(4, 14, 8, 8, '#6b8c9d', a, {rx: 2});
  },
  drone(a) {
    const d = group(a, {class: 'drone'});
    rect(-13, -7, 26, 12, '#4c89a8', d, {rx: 6});
    for (const x of [-22, 22]) {
      line(x < 0 ? -10 : 10, -2, x, -9, '#4d708a', 3, d);
      ellipse(x, -11, 12, 3, '#8dcbd6', d, {class: 'rotor'});
    }
    circle(0, 5, 4, '#f1d58c', d);
    line(-7, 6, -10, 13, '#496c80', 2, d); line(7, 6, 10, 13, '#496c80', 2, d);
  },
  sensors(a) {
    rect(-22, -15, 44, 30, '#297f8e', a, {rx: 5});
    for (let k = 0; k < 3; k++) {
      circle(-12 + k * 12, -4 + k % 2 * 8, 4, '#e1d17b', a, {class: 'pulse'});
      line(-12 + k * 12, k % 2 * 8, -12 + k * 12, 11, '#b7e5c1', 2, a);
    }
    txt(0, -23, '⌁', '', a, {'font-size': 20, fill: '#4f9baf'});
  },
  easel(a) {
    line(0, -20, -21, 28, '#ad8057', 4, a); line(0, -20, 21, 28, '#ad8057', 4, a);
    rect(-20, -20, 40, 38, '#fffaf1', a, {rx: 2, stroke: '#d4a774', 'stroke-width': 3});
    circle(-5, -4, 9, '#ffb9ad', a);
    poly([[-10, 8], [7, -8], [15, 9]], '#8ec3b8', a);
    line(-26, 17, 27, 17, '#a97d56', 3, a);
    line(14, 13, 24, -4, '#7d6ac0', 3, a, {class: 'brush'});
  },
  steam(a) {
    const atom = group(a, {class: 'orbit'});
    for (let k = 0; k < 3; k++) ellipse(0, 0, 21, 8, 'none', atom, {stroke: ['#de8db1', '#8eafcf', '#e6be6f'][k], 'stroke-width': 3, transform: `rotate(${k * 60})`});
    circle(0, 0, 5, '#d9a963', a);
    txt(0, 31, 'STEAM', '', a, {'font-size': 10, 'font-weight': 900, fill: '#66769a'});
  },
  glass(a) {
    rect(-22, 6, 44, 9, '#d7b48d', a, {rx: 2});
    [['#7fd0e6', -13, 16], ['#b9a3f0', 0, 22], ['#f3a8c4', 13, 14]].forEach(([c, x, h]) => vase(a, x, 6, 7, h, c, {opacity: .82}));
    txt(16, -20, '✦', 'note', a, {'font-size': 12, fill: '#d6a640'});
  },
  book(a) {
    poly([[-19, 2], [-2, -3], [-2, 12], [-19, 16]], '#fef4dc', a, {stroke: '#618d9a', 'stroke-width': 2});
    poly([[2, -3], [19, 2], [19, 16], [2, 12]], '#ffefce', a, {stroke: '#618d9a', 'stroke-width': 2});
    line(0, -2, 0, 14, '#b97863', 2, a);
    txt(0, -12, '📖', 'note', a, {'font-size': 15});
  },
  piano(a) {
    rect(-21, -10, 44, 26, '#222f42', a, {rx: 3});
    rect(-17, -7, 36, 17, '#fffbef', a, {rx: 2});
    for (let k = 1; k < 7; k++) line(-17 + k * 5.1, -7, -17 + k * 5.1, 10, '#566173', 1, a);
    for (const k of [1, 2, 4, 5]) rect(-17 + k * 5.1 - 3, -7, 5, 9, '#283847', a);
    txt(16, -16, '♪', 'note', a, {'font-size': 18, fill: '#b86d92'});
  },
  dancer(a) {
    const d = group(a, {class: 'dancer'});
    circle(0, -20, 7, '#efbd9f', d);
    poly([[0, -12], [-13, 3], [0, 8], [14, 3]], '#d48eab', d);
    line(-4, 6, -12, 17, '#4a6470', 3, d); line(4, 6, 14, 14, '#4a6470', 3, d);
    line(-7, -7, -19, -19, '#efbd9f', 3, d); line(7, -7, 20, -13, '#efbd9f', 3, d);
    txt(19, -25, '♫', 'note', a, {'font-size': 15, fill: '#9665ae'});
  }
};

/* ---------- 島嶼地面 ---------- */
function drawGround(z) {
  const {cx, cy} = z;
  const g = group(layer.ground, {class: 'island-group', 'data-island': z.id});
  const top = hex(cx, cy), low = top.map(([x, y]) => [x, y + CLIFF]);
  ellipse(cx + 10, cy + 172, 108, 18, '#4d6b8a18', g);
  // 漂浮島的底部是一層層陶土，呼應鶯歌的土
  path(`M ${low[0]} L ${low[5]} L ${low[4]} L ${low[3]} Q ${cx + 112} ${cy + 86} ${cx + 46} ${cy + 124} Q ${cx + 10} ${cy + 156} ${cx - 20} ${cy + 130} Q ${cx - 92} ${cy + 98} ${low[0]} Z`, 'url(#underside)', g);
  path(`M ${cx - 112} ${cy + 64} Q ${cx} ${cy + 104} ${cx + 112} ${cy + 64}`, 'none', g, {stroke: '#e6bb90', 'stroke-width': 3, opacity: .55, 'stroke-linecap': 'round'});
  path(`M ${cx - 62} ${cy + 106} Q ${cx + 4} ${cy + 124} ${cx + 66} ${cy + 102}`, 'none', g, {stroke: '#e6bb90', 'stroke-width': 2.4, opacity: .45, 'stroke-linecap': 'round'});
  poly([top[0], top[5], low[5], low[0]], '#8fae7f', g, {class: 'cliff-l'});
  poly([top[5], top[4], low[4], low[5]], '#79a074', g, {class: 'cliff-m'});
  poly([top[4], top[3], low[3], low[4]], '#5f8a68', g, {class: 'cliff-r'});
  poly(top, '#c4dcae', g, {class: 'island-top', stroke: '#f6f3df', 'stroke-width': 4});
  poly(hex(cx, cy - 3, RX - 14, RY - 13), z.meadow, g, {class: 'island-meadow'});
  for (const [dx, dy, s] of [[-66, -58, .56], [-102, -40, .46]]) tree(g, cx + dx, cy + dy, s);
  for (let j = 0; j < 4; j++) ellipse(cx - 2 - j * 4, cy + 48 + j * 10, 7, 3.4, '#fff4d0', g, {opacity: .95});
  FEATURES[z.feature](at(layer.features, cx - 92, cy + 4, {class: 'feature'}));
}
[...ISLANDS].sort((a, b) => a.cy - b.cy).forEach(drawGround);

/* ---------- 師生 ---------- */
const CAST = ['student-male', 'student-female', 'teacher-male', 'student-female', 'teacher-female', 'student-male'];
let personCount = 0;
function person(parent, kind, x1, y1, x2, y2) {
  const idx = personCount++, female = kind.endsWith('female'), teacher = kind.startsWith('teacher');
  const [shirt, trim] = teacher ? (female ? ['#b78ea0', '#74607a'] : ['#d3a36b', '#5a7075']) : (female ? ['#f3d7e2', '#bf8caa'] : ['#e9f4ec', '#5a907e']);
  const g = group(parent, {class: 'person'}), b = group(g, {class: 'body-bob'});
  ellipse(0, 1, 8, 2.7, '#2a3d3a44', b);
  for (const s of [-1, 1]) line(s * 3, -8, s * 4, 3, '#405568', 3.2, group(b, {class: s < 0 ? 'step-left' : 'step-right'}));
  if (female && !teacher) poly([[-6, -10], [-10, -2], [10, -2], [6, -10]], trim, b);
  rect(-6, -21, 12, 14, shirt, b, {rx: 3, stroke: trim, 'stroke-width': 1.7});
  for (const s of [-1, 1]) line(s * 7, -17, s * 10, -8, '#e7c3a3', 2.8, b);
  circle(0, -27, 7.4, '#f0c5a4', b, {class: 'head'});
  if (female) {
    path('M -7 -25 Q -12 -40 0 -38 Q 12 -39 8 -25 L 9 -12 Q 4 -8 3 -17 L 4 -28 Q -3 -32 -7 -25 Z', teacher ? '#544c45' : '#433337', b, {class: 'hair'});
    circle(8, -23, 3, teacher ? '#675e55' : '#4e3d42', b);
  } else {
    path('M -7 -27 Q -8 -40 3 -38 Q 10 -37 8 -26 Q 3 -32 -2 -30 Z', teacher ? '#555253' : '#313e43', b, {class: 'hair'});
  }
  if (teacher) rect(5, -18, 5, 8, '#f2e6c2', b, {rx: 1});
  else {
    rect(female ? -9 : 6, -17, 4, 10, '#e5a46b', b, {rx: 2});
    rect(female ? 5 : -9, -19, 3, 10, female ? '#a67aab' : '#dc9c56', b, {rx: 2});
  }
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  E('animateMotion', {dur: `${8 + idx % 7}s`, repeatCount: 'indefinite', begin: `-${(idx * 1.17).toFixed(2)}s`, path: `M ${x1} ${y1} Q ${mx} ${my - 12} ${x2} ${y2} Q ${mx} ${my + 10} ${x1} ${y1}`}, g);
}

/* ---------- 跨島橋（落在島面上，畫在校舍下層） ---------- */
const cross = (a, b) => a.x * b.y - a.y * b.x;
function surfaceHit(z, dx, dy) {
  const corners = hex(z.cx, z.cy).map(([x, y]) => ({x, y})), C = {x: z.cx, y: z.cy}, D = {x: dx, y: dy};
  let best = null;
  for (let i = 0; i < corners.length; i++) {
    const A = corners[i], B = corners[(i + 1) % corners.length];
    const edge = {x: B.x - A.x, y: B.y - A.y}, AC = {x: A.x - C.x, y: A.y - C.y}, den = cross(D, edge);
    if (Math.abs(den) < 1e-7) continue;
    const t = cross(AC, edge) / den, u = cross(AC, D) / den;
    if (t > 0 && u >= -1e-6 && u <= 1 + 1e-6 && (!best || t < best.t)) best = {t, x: C.x + D.x * t, y: C.y + D.y * t};
  }
  return best || {x: C.x + dx * 115, y: C.y + dy * 70};
}
CONNECTIONS.forEach(([ia, ib], k) => {
  const A = ISLANDS[ia], B = ISLANDS[ib], vx = B.cx - A.cx, vy = B.cy - A.cy, len = Math.hypot(vx, vy);
  const ux = vx / len, uy = vy / len, nx = -uy, ny = ux;
  const ea = surfaceHit(A, ux, uy), eb = surfaceHit(B, -ux, -uy), inset = 9;
  const s = {x: ea.x - ux * inset, y: ea.y - uy * inset}, e = {x: eb.x + ux * inset, y: eb.y + uy * inset};
  const dist = Math.hypot(e.x - s.x, e.y - s.y);
  if (dist < 25) return;
  const g = group(layer.bridges, {class: 'bridge', 'aria-hidden': 'true'});
  E('line', {x1: s.x, y1: s.y + 8, x2: e.x, y2: e.y + 8, class: 'deck-shadow'}, g);
  const angle = Math.atan2(uy, ux) * 180 / Math.PI;
  for (const p of [s, e]) ellipse(p.x, p.y, 23, 16, '', g, {class: 'landing', transform: `rotate(${angle} ${p.x} ${p.y})`});
  E('line', {x1: s.x, y1: s.y, x2: e.x, y2: e.y, class: 'deck'}, g);
  for (let d = 3; d < dist - 2; d += 11) {
    const x = s.x + ux * d, y = s.y + uy * d;
    E('line', {x1: x + nx * 13, y1: y + ny * 13, x2: x - nx * 13, y2: y - ny * 13, class: 'plank'}, g);
  }
  for (const sd of [-1, 1]) {
    E('line', {x1: s.x + nx * sd * 17, y1: s.y + ny * sd * 17 - 5, x2: e.x + nx * sd * 17, y2: e.y + ny * sd * 17 - 5, class: 'rail'}, g);
    for (let d = 5; d < dist - 2; d += 26) {
      const x = s.x + ux * d + nx * sd * 17, y = s.y + uy * d + ny * sd * 17;
      E('line', {x1: x, y1: y + 1, x2: x, y2: y - 9, class: 'post'}, g);
      E('circle', {cx: x, cy: y - 9, r: 3, class: 'post-cap'}, g);
    }
  }
  if (dist > 37) person(g, CAST[(k + 2) % CAST.length], s.x + ux * 13, s.y + uy * 13, e.x - ux * 13, e.y - uy * 13);
});

/* ---------- 校舍 ---------- */
function drawBuilding(z) {
  const X = z.cx - 47, Y = z.cy + 12, W = 94, H = 58, D = 31, roof = z.color;
  const g = group(layer.buildings, {class: 'zone architecture', 'data-id': z.id, tabindex: 0, role: 'button', 'aria-label': `認識${z.name}`});
  ellipse(X + W / 2 + 9, Y + 19, 71, 18, '#6b443030', g);
  poly([[X - 11, Y + 4], [X + W + 8, Y + 4], [X + W + D + 11, Y + D * .64 + 10], [X + D - 13, Y + D * .64 + 10]], '#e8dcc3', g, {stroke: '#f8efdb', 'stroke-width': 3});
  poly([[X, Y - H], [X + W, Y - H - 2], [X + W, Y], [X, Y + 2]], '#fbf1e2', g, {class: 'facade'});
  poly([[X + W, Y - H - 2], [X + W + D, Y - H - 2 - D * .63], [X + W + D, Y - D * .63], [X + W, Y]], '#d8c2a9', g, {class: 'facade'});
  poly([[X, Y - H], [X + D, Y - H - D * .63], [X + W + D, Y - H - D * .63 - 2], [X + W, Y - H - 2]], roof, g, {class: 'roof-main'});
  poly([[X - 5, Y - H + 2], [X + W + 5, Y - H], [X + W + 5, Y - H + 7], [X - 5, Y - H + 9]], '#f2dcc1', g);
  poly([[X + W + 5, Y - H], [X + W + D + 3, Y - H - D * .63 - 2], [X + W + D + 3, Y - H - D * .63 + 5], [X + W + 5, Y - H + 7]], '#bda78f', g);
  line(X - 5, Y - H + 2, X + W + 5, Y - H, '#fff7db', 3, g);
  poly([[X + 28, Y - H - 8], [X + 38, Y - H - 14], [X + 62, Y - H - 14], [X + 52, Y - H - 8]], '#f4f4e4', g, {stroke: '#fff9e8', 'stroke-width': 1});
  poly([[X + 35, Y - H - 10], [X + 42, Y - H - 13], [X + 57, Y - H - 13], [X + 49, Y - H - 9]], '#8bc4cd', g);
  if (z.chimney) { // 陶工大樓的窯爐煙囪
    const cx = X + 14;
    poly([[cx, Y - H - 6], [cx + 11, Y - H - 6], [cx + 11, Y - H - 34], [cx, Y - H - 34]], '#a8583a', g, {stroke: '#f2cfae', 'stroke-width': 1.2});
    poly([[cx - 2, Y - H - 34], [cx + 13, Y - H - 34], [cx + 13, Y - H - 38], [cx - 2, Y - H - 38]], '#8c4024', g);
    for (let s = 0; s < 3; s++) circle(cx + 5.5, Y - H - 42, 5 + s, '#f8f3ec', g, {class: 'smoke', style: `animation-delay:${-s * .8}s`});
  }
  for (let floor = 0; floor < 3; floor++) {
    const fy = Y - H + 9 + floor * 17;
    line(X + 2, fy + 13, X + W - 2, fy + 11, '#f0dcc2', 2, g);
    for (let c = 0; c < 4; c++) {
      const xx = X + 8 + c * 22, yy = fy - c * .16;
      rect(xx, yy, 14, 10, '#8dbec4', g, {class: 'window', rx: 1.5});
      rect(xx + 2, yy + 2, 3, 6, '#d5f6ee', g, {class: 'glint', rx: 1, opacity: .75});
      line(xx + 7, yy + 1, xx + 7, yy + 9, '#f8f7e7', 1, g);
    }
    for (let c = 0; c < 2; c++) {
      const xx = X + W + 6 + c * 12, yy = fy - 4 - c * 7.5;
      poly([[xx, yy], [xx + 8, yy - 5], [xx + 8, yy + 4], [xx, yy + 9]], '#7eb0bc', g, {class: 'window', stroke: '#f4f1df', 'stroke-width': 1.1});
    }
  }
  rect(X + W * .41, Y - 17, 20, 19, '#47747e', g, {class: 'door', rx: 1});
  line(X + W * .41 + 10, Y - 17, X + W * .41 + 10, Y + 2, '#ecf6ec', 1.7, g);
  poly([[X + W * .37, Y - 20], [X + W * .7, Y - 20], [X + W * .7 + 7, Y - 14], [X + W * .37 + 7, Y - 14]], roof, g, {stroke: '#fff3e0', 'stroke-width': 1.5});
  rect(X + W * .36, Y + 1, 33, 5, '#d7ccb2', g, {class: 'step', rx: 1});
  rect(X + W * .32, Y + 6, 42, 5, '#c3b59c', g, {class: 'step', rx: 1});
  rect(X + W * .4, Y - H + 1, 29, 8, '#fffef0', g, {class: 'sign', rx: 2});
  txt(X + W * .4 + 14.5, Y - H + 7.2, SCHOOL.sign, 'signtext', g);
  const flag = group(g, {class: 'roof-flag'});
  line(X + W - 10, Y - H - 18, X + W - 10, Y - H - 44, '#7d6a5c', 2, flag);
  circle(X + W - 10, Y - H - 48, 16, '#fffdf0', flag, {stroke: roof, 'stroke-width': 3});
  txt(X + W - 10, Y - H - 42, z.icon, '', flag, {'font-size': 17});
  activate(g, () => selectIsland(z.id));
}
ISLANDS.forEach(drawBuilding);

/* ---------- 主題場景、島上師生 ---------- */
const SCENE_SLOTS = [[-50, 58], [106, -24], [46, 62]];
ISLANDS.forEach((z, i) => {
  for (const theme of THEMES) {
    const g = group(layer.scenes, {class: `scene scene-${theme.id}`});
    SCENE_SLOTS.forEach(([dx, dy], j) => SCENES[theme.scenes[(j + i) % 3]](at(g, z.cx + dx, z.cy + dy)));
  }
});
// 走路的路線避開校舍與左側的科別代表物件
const WALKS = [[-74, -62, -104, -42], [-28, 84, -78, 78], [8, 52, 60, 56], [62, 82, 16, 88]];
ISLANDS.forEach((z, i) => WALKS.forEach(([a, b, c, d], j) => person(layer.people, CAST[(j + i) % CAST.length], z.cx + a, z.cy + b, z.cx + c, z.cy + d)));

/* ---------- Q 版校長（在陶瓷島前散步） ---------- */
function drawPrincipal() {
  const c = byId.ceramic;
  const walk = group(layer.principal, {class: 'principal-mini', tabindex: 0, role: 'button', 'aria-label': `${PRINCIPAL.name}校長，正在校園散步，點擊認識`});
  const q = group(walk, {transform: 'scale(.34)'});
  ellipse(0, 84, 30, 8, '#3a2a1f40', q);
  // 依照片：深藍西裝、淺藍條紋襯衫、深藍領帶、黑框眼鏡
  line(-15, 75, -17, 86, '#1c2740', 9, q); line(15, 75, 17, 86, '#1c2740', 9, q);
  poly([[-21, 43], [-9, 35], [10, 35], [23, 43], [28, 78], [-28, 78]], '#1f2d4a', q, {stroke: '#fdf0de', 'stroke-width': 2});
  poly([[-10, 38], [0, 61], [11, 38], [4, 75]], '#d6e6f6', q);
  poly([[-3, 41], [3, 41], [6, 57], [0, 67], [-6, 57]], '#22406e', q);
  poly([[-21, 43], [-8, 37], [-1, 66], [-14, 57]], '#2b3b5c', q);
  poly([[21, 43], [8, 37], [1, 66], [14, 57]], '#2b3b5c', q);
  path('M -22 50 Q -34 58 -24 70', 'none', q, {stroke: '#1f2d4a', 'stroke-width': 10, 'stroke-linecap': 'round'});
  const arm = group(q, {class: 'wave'});
  path('M 22 48 Q 39 35 32 15', 'none', arm, {stroke: '#1f2d4a', 'stroke-width': 10, 'stroke-linecap': 'round'});
  ellipse(32, 13, 7, 9, '#efc4a7', arm);
  const head = group(q, {class: 'nod'});
  ellipse(-27, 0, 6, 10, '#edbd9e', head); ellipse(27, 0, 6, 10, '#edbd9e', head);
  ellipse(0, 1, 30, 35, '#f2c8ab', head, {stroke: '#fdf2df', 'stroke-width': 2});
  path('M -30 -6 Q -34 -32 -12 -37 Q 6 -44 22 -34 Q 33 -26 30 -6 Q 24 -22 6 -25 Q -12 -22 -24 -16 Q -28 -12 -30 -6', '#2b2f33', head);
  path('M -18 -11 Q -10 -15 -3 -12 M 5 -12 Q 13 -15 20 -11', 'none', head, {stroke: '#3a3833', 'stroke-width': 3.2, 'stroke-linecap': 'round'});
  const eyes = group(head, {class: 'blink'});
  ellipse(-11, 0, 3.1, 3.8, '#29333a', eyes); ellipse(12, 0, 3.1, 3.8, '#29333a', eyes);
  circle(-12, -1, 1, '#fff', eyes); circle(11, -1, 1, '#fff', eyes);
  const glasses = {fill: '#ffffff1f', stroke: '#2a2523', 'stroke-width': 2.4};
  rect(-20, -6, 17, 12, '', head, {rx: 3.5, ...glasses}); rect(4, -6, 17, 12, '', head, {rx: 3.5, ...glasses});
  path('M -3 -1 Q 0.5 -3 4 -1 M -20 -2 L -27 -2 M 21 -2 L 27 -2', 'none', head, {stroke: '#2a2523', 'stroke-width': 2.2});
  path('M 0 6 Q -2 12 3 12', 'none', head, {stroke: '#d39d82', 'stroke-width': 2, 'stroke-linecap': 'round'});
  path('M -9 18 Q 1 26 12 17', 'none', head, {stroke: '#965f59', 'stroke-width': 2.4, 'stroke-linecap': 'round'});
  ellipse(-19, 12, 6, 3, '#eeb7a6', head, {opacity: .5}); ellipse(20, 12, 6, 3, '#eeb7a6', head, {opacity: .5});
  txt(0, 41, `${PRINCIPAL.name}校長`, 'principal-label', walk);
  const x = c.cx, y = c.cy;
  E('animateMotion', {dur: '16s', repeatCount: 'indefinite', path: `M ${x - 46} ${y + 30} Q ${x - 6} ${y + 46} ${x + 34} ${y + 30} Q ${x + 2} ${y + 16} ${x - 46} ${y + 30}`}, walk);
  activate(walk, meetPrincipal);
}
drawPrincipal();

/* ---------- 鶯歌石：左上角的小浮島 ---------- */
function drawLandmark() {
  const g = at(layer.sky, 70, 70, {class: 'landmark', tabindex: 0, role: 'button', 'aria-label': '鶯歌石，點擊認識鶯歌地名的由來'});
  const f = group(g, {class: 'float'});
  path('M -46 8 Q -40 30 -14 46 Q 0 60 12 46 Q 38 30 46 8 Z', 'url(#underside)', f);
  ellipse(0, 8, 46, 17, '#c4dcae', f, {class: 'island-top', stroke: '#f6f3df', 'stroke-width': 3});
  path('M -28 10 Q -33 -12 -16 -25 Q -3 -36 12 -31 Q 21 -28 32 -33 Q 27 -23 20 -18 Q 28 -9 23 3 Q 10 12 -28 10 Z', '#8f8e88', f, {stroke: '#efe9dc', 'stroke-width': 1.6});
  path('M -18 -16 Q -7 -27 6 -26', 'none', f, {stroke: '#bcbab1', 'stroke-width': 3, 'stroke-linecap': 'round'});
  path('M -22 2 Q -6 6 14 0', 'none', f, {stroke: '#76756f', 'stroke-width': 2, 'stroke-linecap': 'round'});
  circle(9, -24, 2, '#3d3a36', f);
  tree(f, 34, 8, .32);
  rect(-30, 28, 60, 22, '#fffefa', f, {rx: 11, stroke: '#ecd8c2', 'stroke-width': 2});
  txt(0, 43, LANDMARK.name, 'landmark-label', f);
  activate(g, meetLandmark);
}
drawLandmark();

/* ---------- 島名標籤（最上層） ---------- */
ISLANDS.forEach(z => {
  const cx = z.cx, top = z.cy + RY, tagY = top + 12;
  const tagW = Math.max(150, 48 + z.name.length * 20, 46 + z.en.length * 6.3);
  const g = group(layer.labels, {class: 'tag-holder', 'data-id': z.id, tabindex: 0, role: 'button', 'aria-label': `選擇${z.name}學習島`});
  line(cx, top - 14, cx, tagY + 2, '#fbf6ea', 4, g);
  ellipse(cx, tagY + 43, tagW * .45, 8, '', g, {class: 'tag-shadow'});
  poly([[cx - 8, tagY + 3], [cx + 8, tagY + 3], [cx, tagY - 6]], '', g, {class: 'tag-pin'});
  rect(cx - tagW / 2, tagY, tagW, 46, '', g, {rx: 20, class: 'tag-pill'});
  circle(cx - tagW / 2 + 19, tagY + 18, 12, z.color, g);
  txt(cx - tagW / 2 + 19, tagY + 22, String(z.n), 'tag-index', g);
  txt(cx + 12, tagY + 23, z.name, 'tag-text', g);
  txt(cx + 12, tagY + 37, z.en, 'tag-en', g);
  activate(g, () => selectIsland(z.id));
});

/* ---------- 介紹面板 ---------- */
let selectedId = 'ceramic';
function openSide({kicker, title, desc, facts = [], tag = '', link = null, zoomable = false, photo = null}) {
  $('sideKicker').textContent = kicker;
  $('sideTitle').textContent = title;
  $('sidePhoto').hidden = !photo;
  if (photo) Object.assign($('sidePhoto'), {src: photo.src, alt: photo.alt});
  $('sideDesc').textContent = desc;
  $('sideFacts').replaceChildren(...facts.map(f => Object.assign(document.createElement('li'), {textContent: f})));
  $('sideFacts').hidden = !facts.length;
  $('sideTag').textContent = tag;
  $('sideTag').hidden = !tag;
  $('sideLink').hidden = !link;
  if (link) $('sideLink').href = link;
  $('sideZoom').hidden = !zoomable;
  side.classList.remove('hidden');
  side.scrollTop = 0;
  setIndex(false);
}
function highlight(id) {
  document.querySelectorAll('[data-id]').forEach(el => el.classList.toggle('selected', el.dataset.id === id));
}
function selectIsland(id) {
  const z = byId[id];
  if (!z) return;
  selectedId = id;
  openSide({kicker: `ZONE ${pad(z.n)} · ${z.en}`, title: `${z.icon}　${z.name}`, desc: z.desc, facts: z.facts, tag: z.tag, link: z.url, zoomable: true});
  highlight(id);
}
function meetPrincipal() {
  openSide({kicker: 'MEET THE PRINCIPAL', title: `${PRINCIPAL.name} 校長`, desc: PRINCIPAL.desc, tag: PRINCIPAL.tag, photo: {src: PRINCIPAL.photo, alt: `${PRINCIPAL.name}校長`}});
  highlight(null);
}
function meetLandmark() {
  openSide({kicker: LANDMARK.en, title: `⛰️　${LANDMARK.name}`, desc: LANDMARK.desc, tag: LANDMARK.tag});
  highlight(null);
}
function closeSide() { side.classList.add('hidden'); highlight(null); }
$('closeSide').onclick = closeSide;
$('sideZoom').onclick = () => closeTo(selectedId);

/* ---------- 探索清單 ---------- */
function setIndex(open) {
  $('index').classList.toggle('hidden', !open);
  $('indexBtn').setAttribute('aria-expanded', String(open));
}
function renderIndex() {
  $('indexItems').replaceChildren(...ISLANDS.map(z => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.id = z.id;
    b.innerHTML = `<span class="dot" style="--dot:${z.color}"></span><span>${pad(z.n)}　${z.icon} ${z.name}</span>${found.includes(z.id) ? '<span class="done">✓ 徽章</span>' : ''}`;
    b.onclick = () => { selectIsland(z.id); closeTo(z.id); };
    return b;
  }));
}
$('indexBtn').onclick = () => setIndex($('index').classList.contains('hidden'));

/* ---------- 視角：拖曳、縮放、旋轉、全景與近看 ---------- */
let zoom = 1, spin = 0, dx = 0, dy = 0;
const ZMIN = .55, ZMAX = 2.8;
function render() {
  svg.style.setProperty('--zoom', zoom.toFixed(3));
  svg.style.setProperty('--spin', `${spin}deg`);
  svg.style.setProperty('--dx', `${dx.toFixed(1)}px`);
  svg.style.setProperty('--dy', `${dy.toFixed(1)}px`);
}
function setMode(mode, caption) {
  $('allView').setAttribute('aria-pressed', String(mode === 'all'));
  $('closeView').setAttribute('aria-pressed', String(mode === 'close'));
  $('viewCaption').textContent = caption;
}
function allIslands() {
  zoom = 1; dx = dy = 0; spin = 0;
  render();
  setMode('all', '全景：九島一覽 · 拖曳移動');
}
function closeTo(id) {
  const z = byId[id] || byId.ceramic;
  selectedId = z.id;
  const base = parseFloat(getComputedStyle(svg).width) || svg.getBoundingClientRect().width / zoom;
  zoom = innerWidth < 850 ? 1.35 : 1.75;
  spin = 0;
  const k = base / VIEW_W * zoom;
  dx = -(z.cx - VIEW_W / 2) * k;
  dy = -(z.cy - VIEW_H / 2) * k;
  render();
  setMode('close', `近看：${z.name} · 拖曳觀察人物`);
}
function zoomBy(f, clientX, clientY) {
  const next = Math.min(ZMAX, Math.max(ZMIN, zoom * f));
  f = next / zoom;
  if (f === 1) return;
  if (clientX === undefined) { dx *= f; dy *= f; }
  else { // 以游標為中心縮放
    const r = stage.getBoundingClientRect();
    const qx = clientX - (r.left + r.width / 2 + dx), qy = clientY - (r.top + r.height * .52 + dy);
    dx += qx * (1 - f); dy += qy * (1 - f);
  }
  zoom = next;
  render();
  setMode('', zoom > 1 ? '已放大 · 拖曳移動畫面' : '已縮小 · 拖曳移動畫面');
}
$('allView').onclick = allIslands;
$('closeView').onclick = () => closeTo(selectedId);
$('rotateLeft').onclick = () => { spin -= 12; render(); setMode('', '已旋轉視角 · 仍可拖曳探索'); };
$('rotateRight').onclick = () => { spin += 12; render(); setMode('', '已旋轉視角 · 仍可拖曳探索'); };
$('plus').onclick = () => zoomBy(1.18);
$('minus').onclick = () => zoomBy(1 / 1.18);
$('reset').onclick = () => { allIslands(); closeSide(); };

const INTERACTIVE = '.zone, .tag-holder, .treasure, .principal-mini, .landmark';
let drag = null, pinch = null;
stage.addEventListener('pointerdown', e => {
  if (e.button !== 0 || e.target.closest(INTERACTIVE)) return;
  drag = {x: e.clientX, y: e.clientY, dx, dy, id: e.pointerId, moved: false};
  stage.classList.add('dragging');
  stage.setPointerCapture(e.pointerId);
});
stage.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id || pinch) return;
  const mx = e.clientX - drag.x, my = e.clientY - drag.y;
  if (Math.abs(mx) + Math.abs(my) > 4) drag.moved = true;
  dx = drag.dx + mx; dy = drag.dy + my;
  render();
});
function endDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const tap = !drag.moved && e.type === 'pointerup';
  drag = null;
  stage.classList.remove('dragging');
  if (tap) { // 沒有拖曳時，點到島嶼地面也能打開介紹
    const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.island-group');
    if (hit) selectIsland(hit.dataset.island);
  }
}
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);
stage.addEventListener('wheel', e => {
  e.preventDefault();
  zoomBy(Math.min(1.25, Math.max(.8, Math.exp(-e.deltaY * .0015))), e.clientX, e.clientY);
}, {passive: false});
stage.addEventListener('touchmove', e => {
  if (e.touches.length !== 2) return;
  const [a, b] = e.touches, d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  if (pinch) zoomBy(d / pinch, (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
  pinch = d;
}, {passive: true});
stage.addEventListener('touchend', e => { if (e.touches.length < 2) pinch = null; });
svg.addEventListener('dblclick', e => {
  const hit = e.target.closest('.zone, .tag-holder');
  if (hit) closeTo(hit.dataset.id);
  else allIslands();
});

/* ---------- 島嶼風格 ---------- */
const styleBar = $('styleBar');
function setTheme(id) {
  const theme = THEMES.find(t => t.id === id) || THEMES[0];
  for (const t of THEMES) app.classList.toggle(`theme-${t.id}`, t.id === theme.id);
  $('themeCaption').textContent = `${theme.icon}　${theme.caption}`;
  styleBar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.theme === theme.id)));
  store.set('theme', theme.id);
}
for (const t of THEMES) {
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.theme = t.id;
  b.textContent = t.label;
  b.onclick = () => setTheme(t.id);
  styleBar.append(b);
}

/* ---------- 尋寶：寶箱、徽章、雷達 ---------- */
const validIds = new Set(ISLANDS.map(z => z.id));
let found = store.get('found', []);
found = Array.isArray(found) ? [...new Set(found.filter(id => validIds.has(id)))] : [];
const chests = new Map();
function markOpened(g, x, y) {
  g.classList.add('found');
  g.querySelectorAll('.chest-hint, .chest-hint-text, .rays').forEach(n => n.remove());
  txt(x + 5, y - 26, '✓', '', g, {'font-size': 25, fill: '#2c926d', 'font-weight': 900});
}
function makeChest(z) {
  const x = z.cx + 98, y = z.cy + 42, opened = found.includes(z.id);
  const g = group(layer.chests, {class: 'treasure', role: 'button', tabindex: 0, 'aria-label': `${z.name}的發光寶箱，點擊收集徽章`});
  ellipse(x, y + 14, 25, 10, '#a78d4c45', g);
  circle(x, y - 9, 29, '', g, {class: 'aura'});
  const rays = group(g, {class: 'rays'});
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4;
    E('line', {x1: x + Math.cos(a) * 35, y1: y - 9 + Math.sin(a) * 35, x2: x + Math.cos(a) * 43, y2: y - 9 + Math.sin(a) * 43}, rays);
  }
  const chest = group(g, {class: 'chest'});
  poly([[x - 22, y - 7], [x + 17, y - 7], [x + 26, y + 1], [x - 14, y + 1]], '', chest, {class: 'lid'});
  poly([[x - 14, y + 1], [x + 26, y + 1], [x + 26, y + 21], [x - 14, y + 21]], '', chest, {class: 'front'});
  poly([[x - 22, y - 7], [x - 14, y + 1], [x - 14, y + 21], [x - 22, y + 12]], '', chest, {class: 'chest-side'});
  poly([[x - 22, y - 7], [x - 13, y - 20], [x + 25, y - 20], [x + 17, y - 7]], '', chest, {class: 'lid'});
  poly([[x + 17, y - 7], [x + 25, y - 20], [x + 34, y - 12], [x + 26, y + 1]], '', chest, {class: 'chest-side'});
  rect(x - 11, y + 2, 34, 4, '', chest, {class: 'metal'});
  rect(x - 11, y + 16, 34, 4, '', chest, {class: 'metal'});
  rect(x + 1, y + 2, 10, 14, '', chest, {class: 'lock', rx: 2});
  circle(x + 6, y + 9, 2, '#92703e', chest);
  rect(x - 29, y + 27, 61, 20, '', g, {class: 'chest-hint', rx: 10});
  txt(x + 2, y + 41, '點我開寶箱', 'chest-hint-text', g);
  if (opened) markOpened(g, x, y);
  activate(g, () => {
    if (found.includes(z.id)) { showMedal(z, true); return; }
    found.push(z.id);
    if (!store.set('found', found)) toast('這個瀏覽器無法儲存紀錄，關閉頁面後進度會消失');
    markOpened(g, x, y);
    g.setAttribute('aria-label', `${z.name}的寶箱，已開啟`);
    updateHunt();
    showMedal(z, false);
  });
  chests.set(z.id, g);
}
ISLANDS.forEach(makeChest);

function updateHunt() {
  $('foundCount').textContent = `${found.length} / ${TOTAL}`;
  $('huntFill').style.width = `${found.length / TOTAL * 100}%`;
  updateRadar();
  renderIndex();
}
function updateRadar() {
  const left = TOTAL - found.length;
  $('radarSummary').textContent = left ? `已完成 ${found.length}/${TOTAL}，還有 ${left} 枚徽章等你尋找。點未完成的島嶼，畫面會移到附近。` : `九枚徽章全部到手！可以下載探索達人證書了。`;
  const list = $('radarList');
  list.replaceChildren();
  ISLANDS.forEach(z => {
    const done = found.includes(z.id), b = document.createElement('button');
    b.type = 'button';
    b.disabled = done;
    b.innerHTML = `<span>${z.icon} ${z.name}</span><span>${done ? '✓ 已蒐集' : '🎁 前往'}</span>`;
    b.onclick = () => {
      $('radarPanel').hidden = true;
      closeTo(z.id);
      const chest = chests.get(z.id);
      chest.classList.remove('ping');
      void chest.getBoundingClientRect();
      chest.classList.add('ping');
      toast(`寶箱在「${z.name}」島的右下方，找找金色光芒 ✨`);
    };
    list.append(b);
  });
  if (!left) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cert-btn';
    b.textContent = '🏆 下載探索達人證書';
    b.onclick = openCertificate;
    list.append(b);
  }
}
const toggleRadar = () => { $('radarPanel').hidden = !$('radarPanel').hidden; };
$('radarBtn').onclick = toggleRadar;
$('radarQuick').onclick = toggleRadar;
$('radarClose').onclick = () => { $('radarPanel').hidden = true; };

function showMedal(z, already) {
  const complete = found.length === TOTAL, card = $('medalCard');
  const add = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    card.append(n);
    return n;
  };
  card.replaceChildren();
  add('div', 'award-medal', z.icon);
  add('div', 'medal-kicker', `YINGGE EXPLORER · ${pad(z.n)}`);
  add('h2', '', complete && !already ? '🎉 九島探索完成！' : already ? '已收藏的徽章' : '獲得專屬徽章！').id = 'medalTitle';
  add('strong', 'medal-name', z.badge);
  add('p', '', complete ? '太棒了！九枚專屬徽章全部到手，解鎖「鶯歌工商探索達人」電子證書。' : `${z.name}｜${z.tag}。目前 ${found.length} / ${TOTAL} 枚徽章，快到其他島嶼尋寶！`);
  const actions = add('div', 'reward-actions');
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'secondary';
  close.textContent = '繼續探索';
  close.onclick = () => { $('medalModal').hidden = true; };
  const next = document.createElement('button');
  next.type = 'button';
  next.textContent = complete ? '🏆 領取電子證書' : '📡 尋找下一枚';
  next.onclick = () => {
    $('medalModal').hidden = true;
    if (complete) openCertificate();
    else $('radarPanel').hidden = false;
  };
  actions.append(close, next);
  $('medalModal').hidden = false;
  next.focus();
}
$('medalModal').addEventListener('click', e => { if (e.target === $('medalModal')) $('medalModal').hidden = true; });

/* ---------- 電子證書（只在瀏覽器裡產生，不上傳） ---------- */
const CERT_FILE = '鶯歌工商探索達人_電子證書';
function openCertificate() {
  if (found.length !== TOTAL) { toast('集滿九枚徽章就能領取證書！'); return; }
  $('radarPanel').hidden = true;
  $('certPanel').hidden = false;
  $('certName').focus();
}
const escapeXml = s => String(s).replace(/[&<>"']/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'}[ch]));
function certificateSvg(name) {
  const who = escapeXml(name || '校園探索者');
  const today = escapeXml(new Date().toLocaleDateString('zh-TW', {year: 'numeric', month: 'long', day: 'numeric'}));
  const names = ISLANDS.map(z => z.name);
  const row1 = names.slice(0, 5).join('、'), row2 = names.slice(5, -1).join('、') + '及' + names[names.length - 1];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850">
<defs><linearGradient id="paper" x2="1" y2="1"><stop stop-color="#fffdf4"/><stop offset="1" stop-color="#f6eadb"/></linearGradient><linearGradient id="gold" x2="1" y2="1"><stop stop-color="#f3d68d"/><stop offset="1" stop-color="#b88945"/></linearGradient></defs>
<rect width="1200" height="850" fill="url(#paper)"/>
<rect x="37" y="37" width="1126" height="776" rx="28" fill="none" stroke="url(#gold)" stroke-width="11"/>
<rect x="56" y="56" width="1088" height="738" rx="18" fill="none" stroke="#c98a62" stroke-width="3"/>
<g font-family="Noto Sans TC, Microsoft JhengHei, PingFang TC, sans-serif" text-anchor="middle">
<text x="600" y="160" fill="#8c4024" font-size="35" font-weight="900">${escapeXml(SCHOOL.name)}</text>
<text x="600" y="203" fill="#a08a72" font-size="19" letter-spacing="5">NINE LEARNING ISLANDS · EXPLORER</text>
<text x="600" y="292" fill="#bd9450" font-size="84">✦ 🏺 ✦</text>
<text x="600" y="377" fill="#4a2e22" font-size="53" font-weight="900">鶯歌工商探索達人</text>
<text x="600" y="455" fill="#b65a36" font-size="42" font-weight="800">${who}</text>
<text x="600" y="522" fill="#6e5a4e" font-size="26">已完成九座學習島的探索任務，集滿</text>
<text x="600" y="563" fill="#6e5a4e" font-size="23">${escapeXml(row1)}、</text>
<text x="600" y="600" fill="#6e5a4e" font-size="23">${escapeXml(row2)}徽章</text>
<text x="600" y="665" fill="#b38848" font-size="24" letter-spacing="4">${escapeXml(SCHOOL.motto)}</text>
<text x="600" y="722" fill="#7b6457" font-size="20">完成日期：${today}</text>
<text x="600" y="768" fill="#a99a8e" font-size="15">網站互動遊戲紀念證書｜非正式學校證明文件</text>
</g></svg>`;
}
function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function downloadCertificate() {
  if (found.length !== TOTAL) return;
  const svgText = certificateSvg($('certName').value.trim());
  const asSvg = () => { saveBlob(new Blob([svgText], {type: 'image/svg+xml;charset=utf-8'}), `${CERT_FILE}.svg`); toast('已下載 SVG 電子證書'); };
  const img = new Image();
  img.onload = () => { // 轉成 PNG，手機與通訊軟體都能直接開
    try {
      const c = document.createElement('canvas');
      c.width = 1200; c.height = 850;
      c.getContext('2d').drawImage(img, 0, 0);
      c.toBlob(blob => { if (blob) { saveBlob(blob, `${CERT_FILE}.png`); toast('電子證書已開始下載！'); } else asSvg(); }, 'image/png');
    } catch { asSvg(); }
  };
  img.onerror = asSvg;
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText);
}
$('downloadCert').onclick = downloadCertificate;
$('closeCert').onclick = () => { $('certPanel').hidden = true; };
$('certPanel').addEventListener('click', e => { if (e.target === $('certPanel')) $('certPanel').hidden = true; });

/* ---------- 上方按鈕、開場、鍵盤 ---------- */
$('nightBtn').onclick = () => {
  const on = app.classList.toggle('night');
  $('nightBtn').setAttribute('aria-pressed', String(on));
  $('nightIcon').textContent = on ? '☾' : '☀';
  $('nightLabel').textContent = on ? '白天模式' : '日夜切換';
};
function setPhoto(on) {
  app.classList.toggle('photo', on);
  if (on) toast('拍照模式：可用裝置截圖儲存畫面，按 Esc 或右上角離開');
}
$('photoBtn').onclick = () => setPhoto(true);
$('photoExit').onclick = () => setPhoto(false);
$('helpBtn').onclick = () => toast('拖曳平移｜滾輪或雙指縮放｜點島嶼看介紹｜點寶箱蒐集徽章｜雙擊校舍近看');
$('enter').onclick = () => {
  const intro = $('intro');
  intro.classList.add('hide');
  setTimeout(() => intro.remove(), 600);
  toast('點一座島，開始你的鶯歌學習旅程 ✦');
};
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!$('certPanel').hidden) $('certPanel').hidden = true;
    else if (!$('medalModal').hidden) $('medalModal').hidden = true;
    else if (!$('radarPanel').hidden) $('radarPanel').hidden = true;
    else if (app.classList.contains('photo')) setPhoto(false);
    else { closeSide(); setIndex(false); }
    return;
  }
  if (e.target.closest('input, textarea') || $('intro')?.isConnected && !$('intro').classList.contains('hide')) return;
  const step = 60, moves = {ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step]};
  if (moves[e.key]) { e.preventDefault(); dx += moves[e.key][0]; dy += moves[e.key][1]; render(); }
  else if (e.key === '+' || e.key === '=') zoomBy(1.18);
  else if (e.key === '-') zoomBy(1 / 1.18);
});

if (matchMedia('(prefers-reduced-motion: reduce)').matches) svg.pauseAnimations();
setTheme(store.get('theme', 'ceramic'));
updateHunt();
allIslands();
})();
