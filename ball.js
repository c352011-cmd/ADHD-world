// ================================================================
// ball.js — 모든 페이지에서 공통으로 쓰는 코드
// ================================================================

// ── 구글 시트 설정 ──
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBhXcN2APYQhEVXHw6ER56MC4i8mwqviKQH2F1W2G5FB3wR0Z84QHZ-ZFXokMklzmm7YOJNpdG3tws/pub?gid=666310940&single=true&output=csv";
const USE_GOOGLE_SHEETS = true;

// ── 유형별 이미지 목록 ──
const TYPE_IMAGES = {
  H: [
    "a1.png",
    "a2.png",
    "a3.png",
    "a4.png",
    "a5.png",
    "a6.png",
    "a7.png",
    "a8.png",
    "a9.png",
  ],
  A: [
    "h1.png",
    "h2.png",
    "h3.png",
    "h4.png",
    "h5.png",
    "h6.png",
    "h7.png",
    "h8.png",
    "h9.png",
  ],
  D: [
    "d1.png",
    "d2.png",
    "d3.png",
    "d4.png",
    "d5.png",
    "d6.png",
    "d7.png",
    "d8.png",
    "d9.png",
  ],
  DD: [
    "d1.png",
    "d2.png",
    "d3.png",
    "d4.png",
    "d5.png",
    "d6.png",
    "d7.png",
    "d8.png",
    "d9.png",
    "h1.png",
    "h2.png",
    "h3.png",
    "h4.png",
    "h5.png",
    "h6.png",
    "h7.png",
    "h8.png",
    "h9.png",
    "a1.png",
    "a2.png",
    "a3.png",
    "a4.png",
    "a5.png",
    "a6.png",
    "a7.png",
    "a8.png",
    "a9.png",
  ],
  NONE: [
    "n1.png",
    "n2.png",
    "n3.png",
    "n4.png",
    "n5.png",
    "n6.png",
    "n7.png",
    "n8.png",
  ],
};

const LOADED_IMAGES = {};

// ── 색상 팔레트 ──
// 추가:
const A_COLORS = [
  "#FF0000",
  "#FF2200",
  "#FF4400",
  "#FF6600",
  "#FF8800",
  "#FFAA00",
  "#FFCC00",
  "#DDFF00",
  "#AAFF00",
  "#88FF00",
  "#55FF00",
  "#33FF00",
];
const H_COLORS = [
  "#0000FF",
  "#0022FF",
  "#0055FF",
  "#0088FF",
  "#00AAFF",
  "#00CCFF",
  "#00FFFF",
  "#00FFDD",
  "#00FFAA",
  "#00FF88",
  "#00FF55",
  "#00FF22",
  "#22FF00",
  "#55FF00",
  "#AAFF00",
  "#DDFF00",
];
const DH_COLORS = [
  "#0000FF",
  "#0022FF",
  "#0055FF",
  "#0088FF",
  "#00AAFF",
  "#00CCFF",
  "#00FFFF",
  "#00FFDD",
  "#00FFAA",
  "#00FF88",
  "#00FF55",
  "#00FF22",
  "#22FF00",
  "#55FF00",
  "#AAFF00",
  "#DDFF00",
  "#FF0000",
  "#FF2200",
  "#FF4400",
  "#FF6600",
  "#FF8800",
  "#FFAA00",
  "#FFCC00",
  "#DDFF00",
  "#AAFF00",
  "#88FF00",
  "#55FF00",
  "#33FF00",
]; // D용 합본

const DD_COLORS = [
  "#0000FF",
  "#0022FF",
  "#0055FF",
  "#0088FF",
  "#00AAFF",
  "#00CCFF",
  "#00FFFF",
  "#00FFDD",
  "#00FFAA",
  "#00FF88",
  "#00FF55",
  "#00FF22",
  "#22FF00",
  "#55FF00",
  "#AAFF00",
  "#DDFF00",
  "#FF0000",
  "#FF2200",
  "#FF4400",
  "#FF6600",
  "#FF8800",
  "#FFAA00",
  "#FFCC00",
  "#DDFF00",
  "#AAFF00",
  "#88FF00",
  "#55FF00",
  "#33FF00",
];

const MIN_SPEED = 1;
const MAX_SPEED = 10.5;

// ================================================================
// 이미지 미리 로드
// ================================================================
function preloadImages(callback) {
  const allImages = [
    ...TYPE_IMAGES.A,
    ...TYPE_IMAGES.H,
    ...TYPE_IMAGES.D,
    ...TYPE_IMAGES.DD,
  ];
  let loaded = 0;
  if (allImages.length === 0) {
    callback();
    return;
  }
  allImages.forEach((src) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      loaded++;
      LOADED_IMAGES[src] = img;
      if (loaded === allImages.length) callback();
    };
    img.onerror = () => {
      loaded++;
      if (loaded === allImages.length) callback();
    };
  });
}

function pickImage(type, name = "") {
  const list = TYPE_IMAGES[type] || TYPE_IMAGES["A"];
  if (!name) return list[Math.floor(Math.random() * list.length)];
  // name 기반 해시 — 항상 같은 이미지 선택
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % list.length;
  }
  return list[hash];
}

function pickTypeColor(type, suspicious_group = 0) {
  if (type === "A")
    return A_COLORS[Math.floor(Math.random() * A_COLORS.length)];
  if (type === "H")
    return H_COLORS[Math.floor(Math.random() * H_COLORS.length)];
  if (type === "D")
    return DH_COLORS[Math.floor(Math.random() * DH_COLORS.length)];
  if (type === "DD") {
    const base = DH_COLORS[Math.floor(Math.random() * DH_COLORS.length)];
    const maxVal = suspicious_group > 5 ? 100 : 5;
    const ratio = Math.min(1, suspicious_group / maxVal);
    const intensity = 0.3 + ratio * 0.5;
    const r = parseInt(base.slice(1, 3), 16);
    const g = parseInt(base.slice(3, 5), 16);
    const b = parseInt(base.slice(5, 7), 16);
    const wr = Math.round(r * intensity + 255 * (1 - intensity));
    const wg = Math.round(g * intensity + 255 * (1 - intensity));
    const wb = Math.round(b * intensity + 255 * (1 - intensity));
    return `rgb(${wr},${wg},${wb})`;
  }
  return "#dadada";
}

// ================================================================
// 구글 시트에서 데이터 불러오기
// ================================================================
async function loadFromGoogleSheets() {
  const res = await fetch(SHEET_CSV_URL);
  const text = await res.text();
  const rows = text.trim().split("\n");
  const headers = rows[0]
    .split(",")
    .map((h) => h.trim().replace(/"/g, "").toLowerCase());

  return rows
    .slice(1)
    .map((row) => {
      const cols = row.split(",");
      const get = (key) =>
        (cols[headers.indexOf(key)] || "").trim().replace(/"/g, "");
      const name = get("name");
      const total = parseFloat(get("total")) || 0;
      const type = get("type").toUpperCase() || "A";
      const sev = Math.min(5, Math.max(1, Math.ceil(total / 20)));
      const suspicious_group = parseFloat(get("suspicious_group")) || 0;
      return { name, total, type, sev, suspicious_group };
    })
    .filter((p) => p.name.length > 0);
}

// ================================================================
// 위치 계산
// ================================================================
function totalToY(total) {
  const totalHeight = document.body.scrollHeight;
  const padding = 180; // ← r(120~160)보다 크게 — 위쪽 잘림 방지
  return padding + (total / 100) * (totalHeight - padding * 2);
}

function computeSpeedFromY(y) {
  const topY = totalToY(0);
  const botY = totalToY(100);
  const frac = Math.max(0, Math.min(1, (y - topY) / (botY - topY)));
  return MIN_SPEED + frac * frac * (MAX_SPEED - MIN_SPEED);
}

function pctMultiplier(pct) {
  return 0.4 + (pct / 100) * 1.4;
}

// ================================================================
// 공 만들기
// ================================================================
function makeBall(person, fromTop, delay) {
  const { sev, name, total, type, suspicious_group = 0 } = person;
  const color = pickTypeColor(type, suspicious_group);
  const imageSrc = pickImage(type, name);
  const r = 120 + Math.random() * 40;
  const targetY = totalToY(total);
  const initVx = (Math.random() < 0.5 ? 1 : -1) * (3.5 + Math.random() * 4);

  // patrol용 초기 vy — 처음부터 값을 부여해서 settled 후 바로 자연스럽게 이동
  const initVy = (Math.random() < 0.5 ? 1 : -1) * (0.4 + (total / 100) * 0.6);

  // total에 따라 중력 다르게 — 높을수록 빠르게 낙하
  const gravity = 0.08 + (total / 100) * 0.1;

  return {
    name,
    total,
    type,
    imageSrc,
    x: r + Math.random() * Math.max(1, W - r * 2),
    y: fromTop ? -r * 2 : targetY,
    vx: initVx,
    vy: 0,
    patrolVy: initVy, // ← patrol 전용 vy (settling 물리의 vy와 분리)
    r,
    color,
    sev,
    targetY,
    spd: computeSpeedFromY(targetY) * pctMultiplier(total),
    settling: fromTop,
    settled: !fromTop,
    bounceCount: 0,
    restitution: 0.88,
    wallRestitution: 0.94,
    gravity,
    tick: 0,
    dropDelay: delay || 0,
    dropTimer: 0,
    active: !fromTop,
    panelOpen: false,
    personalPhase: Math.random() * Math.PI * 2,
    sortTick: 0,
    sortDropping: false,
  };
}

// ================================================================
// 공 그리기
// ================================================================
function drawBall(b) {
  if (!b.active) return;
  ctx.save();
  ctx.translate(b.x, b.y);

  let sx = 1,
    sy = 1;
  if (b.settling) {
    const speed = Math.abs(b.vy);
    if (b.vy > 1.5) {
      sy = 1 + Math.min(speed * 0.012, 0.22);
      sx = 1 / sy;
    }
    if (b.y >= b.targetY - b.r * 0.4 && b.vy > 0) {
      sy = Math.max(0.75, 1 - speed * 0.018);
      sx = 1 + (1 - sy) * 0.7;
    }
  }
  ctx.scale(sx, sy);

  if (b.panelOpen) {
    ctx.beginPath();
    ctx.arc(0, 0, b.r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  if (b.glowing) {
    const pulse = Math.sin(Date.now() / 300) * 0.5 + 0.5;
    ctx.save();
    const grd1 = ctx.createRadialGradient(0, 0, b.r, 0, 0, b.r * 3.5);
    grd1.addColorStop(0, `rgba(255,255,255,${0.15 + pulse * 0.1})`);
    grd1.addColorStop(1, `rgba(255,255,255,0)`);
    ctx.beginPath();
    ctx.arc(0, 0, b.r * 3.5, 0, Math.PI * 2);
    ctx.fillStyle = grd1;
    ctx.fill();

    const grd2 = ctx.createRadialGradient(0, 0, b.r, 0, 0, b.r * 2.2);
    grd2.addColorStop(0, `rgba(255,255,255,${0.35 + pulse * 0.2})`);
    grd2.addColorStop(1, `rgba(255,255,255,0)`);
    ctx.beginPath();
    ctx.arc(0, 0, b.r * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = grd2;
    ctx.fill();

    const grd3 = ctx.createRadialGradient(0, 0, b.r * 0.9, 0, 0, b.r * 1.4);
    grd3.addColorStop(0, `rgba(255,255,255,${0.6 + pulse * 0.4})`);
    grd3.addColorStop(1, `rgba(255,255,255,0)`);
    ctx.beginPath();
    ctx.arc(0, 0, b.r * 1.4, 0, Math.PI * 2);
    ctx.fillStyle = grd3;
    ctx.fill();
    ctx.restore();
  }

  const img = LOADED_IMAGES[b.imageSrc];
  if (img) {
    const offscreen = document.createElement("canvas");
    const size = b.r * 2;
    offscreen.width = size;
    offscreen.height = size;
    const offCtx = offscreen.getContext("2d");

    // 1. 원본 이미지
    offCtx.drawImage(img, 0, 0, size, size);

    // 2. multiply로 색상 곱하기 — 어두운 곳은 진해지고 밝은 곳에 색이 입혀짐
    offCtx.globalCompositeOperation = "multiply";
    offCtx.fillStyle = b.color;
    offCtx.fillRect(0, 0, size, size);

    // 3. 투명 배경 복구 — multiply가 투명 영역을 채우므로 원본 알파로 마스킹
    offCtx.globalCompositeOperation = "destination-in";
    offCtx.drawImage(img, 0, 0, size, size);

    offCtx.globalCompositeOperation = "source-over";

    ctx.drawImage(offscreen, -b.r, -b.r);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();
  }
  ctx.restore();
}

// ================================================================
// 공 물리 업데이트
// ================================================================
function updateBall(b) {
  if (!b.active) {
    b.dropTimer++;
    if (b.dropTimer >= b.dropDelay) b.active = true;
    return;
  }
  b.tick += 1;

  // ── 정렬 모드 1: 격자로 이동 ──
  if (b.sorting && !b.sortStarted && !b.sortDropping) {
    b.x += (b.sortTargetX - b.x) * 0.08;
    b.y += (b.sortTargetY - b.y) * 0.08;
    return;
  }

  // ── 정렬 모드 2: 꼼지락 ──
  if (b.sorting && b.sortStarted && !b.sortDropping) {
    b.sortTick = (b.sortTick || 0) + 1;
    const personalGrow = 0.001 + (b.total / 100) * 0.003;
    const growProgress = Math.min(b.sortTick * personalGrow, 1);
    const eased = growProgress ** 4;
    const maxAmp = 10 + (b.total / 100) * 50;
    const xFreq = 0.18 + (b.total / 100) * 0.14;
    const xAmp = eased * maxAmp + 2;

    b.x =
      b.sortTargetX +
      Math.sin(b.sortTick * xFreq + b.personalPhase) * xAmp +
      Math.sin(b.sortTick * xFreq * 2.1 + 0.8) * xAmp * 0.15;

    const yFreq = xFreq * 0.45;
    const yProgress = Math.max(0, growProgress - 0.5) / 0.5;
    const yEased = yProgress ** 3;
    const yAmp = yEased * maxAmp * 0.3 * ((b.total / 100) * 0.7 + 0.3);

    b.y =
      b.sortTargetY +
      Math.sin(b.sortTick * yFreq + b.personalPhase * 0.6) * yAmp +
      Math.sin(b.sortTick * yFreq * 1.4 + 1.5) * yAmp * 0.2;

    if (b.x - b.r < 0) b.x = b.r;
    if (b.x + b.r > W) b.x = W - b.r;
    return;
  }

  // ── 정렬 모드 3: 이탈 ──
  if (b.sortDropping) {
    const goingUp = b.targetY < b.y;
    if (goingUp) {
      b.vy -= b.gravity;
      if (b.vy < -12) b.vy = -12;
      b.y += b.vy;
      b.x += b.vx;
      if (b.x - b.r < 0) {
        b.x = b.r;
        b.vx = Math.abs(b.vx) * b.wallRestitution;
      }
      if (b.x + b.r > W) {
        b.x = W - b.r;
        b.vx = -Math.abs(b.vx) * b.wallRestitution;
      }
      if (b.y <= b.targetY) {
        const overshoot = b.targetY - b.y;
        b.y = b.targetY + overshoot;
        b.vy = Math.abs(b.vy) * b.restitution;
        b.restitution = Math.max(0.38, b.restitution - 0.038);
        if (Math.abs(b.vy) < 0.4 && overshoot < 2) {
          b.vy = 0;
          b.sortDropping = false;
          b.sorting = false;
          b.sortStarted = false;
          b.sortTick = 0;
          b.settling = false;
          b.settled = true;
          b.y = b.targetY;
        }
      }
    } else {
      b.vy += b.gravity;
      b.y += b.vy;
      b.x += b.vx;
      if (b.x - b.r < 0) {
        b.x = b.r;
        b.vx = Math.abs(b.vx) * b.wallRestitution;
      }
      if (b.x + b.r > W) {
        b.x = W - b.r;
        b.vx = -Math.abs(b.vx) * b.wallRestitution;
      }
      if (b.y >= b.targetY) {
        const overshoot = b.y - b.targetY;
        b.y = b.targetY - overshoot;
        b.vy = -Math.abs(b.vy) * b.restitution;
        b.restitution = Math.max(0.38, b.restitution - 0.038);
        if (Math.abs(b.vy) < 0.4 && overshoot < 0.5) {
          b.vy = 0;
          b.sortDropping = false;
          b.sorting = false;
          b.sortStarted = false;
          b.sortTick = 0;
          b.settling = false;
          b.settled = true;
          b.y = b.targetY;
        }
      }
    }
    return;
  }

  // ── 낙하 & 정착 (settling) ──
  if (b.settling) {
    b.vy += b.gravity;
    b.y += b.vy;
    b.x += b.vx;

    if (b.x - b.r < 0) {
      b.x = b.r;
      b.vx = Math.abs(b.vx) * b.wallRestitution;
    }
    if (b.x + b.r > W) {
      b.x = W - b.r;
      b.vx = -Math.abs(b.vx) * b.wallRestitution;
    }

    if (b.y >= b.targetY) {
      const over = b.y - b.targetY;
      b.y = b.targetY - over; // 순간이동 없이 항상 반사
      b.vy = -Math.abs(b.vy) * b.restitution;
      b.restitution = Math.max(
        0.2,
        b.restitution - 0.06 + (b.total / 100) * 0.04,
      );

      // vy가 작아지면 lerp로 부드럽게 targetY에 수렴 후 정착
      if (Math.abs(b.vy) < 1.5) {
        b.y += (b.targetY - b.y) * 0.15; // lerp — 끊김 없이 수렴
        if (Math.abs(b.vy) < 0.4) {
          b.y = b.targetY;
          b.vy = 0;
          b.settling = false;
          b.settled = true;
          b.tick = 0;
          b.patrolVy =
            (Math.random() < 0.5 ? 1 : -1) * (0.2 + (b.total / 100) * 0.4); // total 0→0.4, 100→1.0 고정 속도
        }
      }
    }

    // ── patrol 모드 (settled) ──
    // ── patrol 모드 (settled) ──
  } else {
    // X 이동 — total에 따라 속도 차이 크게
    const liveSpd = 0.5 + (b.total / 100) * 12.0; // ← 그대로 유지
    b.x += b.vx;
    if (b.x - b.r < 0) {
      b.x = b.r;
      b.vx = Math.abs(b.vx) * (0.9 + Math.random() * 0.2);
    }
    if (b.x + b.r > W) {
      b.x = W - b.r;
      b.vx = -Math.abs(b.vx) * (0.9 + Math.random() * 0.2);
    }
    const curSpd = Math.abs(b.vx);
    b.vx += (b.vx > 0 ? 1 : -1) * (liveSpd - curSpd) * 0.04;

    // Y 이동 — X와 완전히 독립, 고정된 느린 속도만 사용
    const yRange = 40;
    const yTop = b.targetY - yRange;
    const yBound = b.targetY + yRange;
    const fixedVy = 0.2 + (b.total / 100) * 0.3; // ← Y는 항상 느리게 고정

    // patrolVy 크기를 fixedVy로 강제 유지
    b.patrolVy = (b.patrolVy > 0 ? 1 : -1) * fixedVy;

    b.y += b.patrolVy;

    if (b.y <= yTop) {
      b.y = yTop;
      b.patrolVy = fixedVy;
    }
    if (b.y >= yBound) {
      b.y = yBound;
      b.patrolVy = -fixedVy;
    }
  }

  // patrolVy는 처음 설정값 그대로 유지 (변화 없음)
}

// ================================================================
// 캔버스 크기 조정
// ================================================================
function resize() {
  W = wrap.clientWidth;
  H = document.body.scrollHeight;
  canvas.width = W;
  canvas.height = H;
}

// ================================================================
// 애니메이션 루프
// ================================================================
function loop() {
  ctx.clearRect(0, 0, W, H);
  for (const b of balls) drawBall(b);
  for (const b of balls) updateBall(b);
  raf = requestAnimationFrame(loop);
}
