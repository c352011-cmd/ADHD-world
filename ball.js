// ================================================================
// ball.js — 모든 페이지에서 공통으로 쓰는 코드
// ================================================================

// ── 구글 시트 설정 ──
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBhXcN2APYQhEVXHw6ER56MC4i8mwqviKQH2F1W2G5FB3wR0Z84QHZ-ZFXokMklzmm7YOJNpdG3tws/pub?gid=666310940&single=true&output=csv";
const USE_GOOGLE_SHEETS = true;

// ── 유형별 이미지 목록 ──
// 실제 파일명으로 교체하세요
const TYPE_IMAGES = {
  A: ["images/a1.png", "images/a2.png", "images/a3.png"],
  H: ["images/h1.png", "images/h2.png", "images/h3.png"],
  D: ["images/d1.png", "images/d2.png", "images/d3.png"],
  DD: ["images/d1.png", "images/d2.png", "images/d3.png"],
  NONE: ["images/none1.png", "images/none2.png", "images/none3.png"],
};

// 로드된 이미지를 저장하는 객체
const LOADED_IMAGES = {};

// ── 색상 팔레트 ──
const LEVEL_COLORS = {
  1: ["#FF6600", "#FF0000", "#FF0066", "#CC00FF", "#0000FF"],
  2: ["#FF4400", "#FF0033", "#FF0088", "#8800FF", "#0044FF"],
  3: ["#FF3300", "#FF0055", "#DD00CC", "#6600FF", "#0022FF"],
  4: ["#FF9900", "#FFCC00", "#AAFF00", "#00FF88", "#00FFCC"],
  5: ["#FFAA00", "#FFE600", "#CCFF00", "#00FF44", "#00FFAA"],
};

// ── 속도 설정 ──
const MIN_SPEED = 1;
const MAX_SPEED = 10.5;

// ================================================================
// 이미지 미리 로드 (깜빡임 방지)
// ================================================================
function preloadImages(callback) {
  const allImages = [
    ...TYPE_IMAGES.A,
    ...TYPE_IMAGES.H,
    ...TYPE_IMAGES.D,
    ...TYPE_IMAGES.DD,
  ];
  let loaded = 0;

  // 이미지가 없을 경우 바로 callback 실행
  if (allImages.length === 0) {
    callback();
    return;
  }

  allImages.forEach((src) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      loaded++;
      LOADED_IMAGES[src] = img; // 로드 성공한 이미지 저장
      if (loaded === allImages.length) callback();
    };
    img.onerror = () => {
      loaded++; // 로드 실패해도 건너뜀
      if (loaded === allImages.length) callback();
    };
  });
}

// 유형에 맞는 이미지 중 랜덤으로 하나 선택
function pickImage(type) {
  const list = TYPE_IMAGES[type] || TYPE_IMAGES["A"];
  return list[Math.floor(Math.random() * list.length)];
}

// 심각도에 맞는 색상 랜덤 선택
function pickColor(sev) {
  const p = LEVEL_COLORS[sev];
  return p[Math.floor(Math.random() * p.length)];
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
      const type = get("type").toUpperCase() || "A"; // A / H / D
      const sev = Math.min(5, Math.max(1, Math.ceil(total / 20)));

      return { name, total, type, sev };
    })
    .filter((p) => p.name.length > 0);
}

// ================================================================
// 위치 계산 — total(0~100)을 Y 픽셀 위치로 변환
// ================================================================
function totalToY(total) {
  const totalHeight = document.body.scrollHeight;
  const padding = 100;
  return padding + (total / 100) * (totalHeight - padding * 2);
}

// ================================================================
// 속도 계산 — Y 위치가 낮을수록 빠름
// ================================================================
function computeSpeedFromY(y) {
  const topY = totalToY(0);
  const botY = totalToY(100);
  const frac = Math.max(0, Math.min(1, (y - topY) / (botY - topY)));
  return MIN_SPEED + frac * frac * (MAX_SPEED - MIN_SPEED);
}

// total 값에 따른 속도 배율 (높을수록 빠름)
function pctMultiplier(pct) {
  return 0.4 + (pct / 100) * 1.4;
}

// ================================================================
// 공 만들기
// ================================================================
function makeBall(person, fromTop, delay) {
  const { sev, name, total, type } = person;
  const color = pickColor(sev);
  const imageSrc = pickImage(type);
  const r = 48 + Math.random() * 20;
  const targetY = totalToY(total);
  const initVx = (Math.random() < 0.5 ? 1 : -1) * (3.5 + Math.random() * 4);
  const waves = Array.from({ length: 3 }, () => ({
    amp: 30 + Math.random() * 50,
    freq: 0.003 + Math.random() * 0.014,
    phase: Math.random() * Math.PI * 2,
  }));

  return {
    name,
    total,
    type,
    imageSrc,
    x: r + Math.random() * (W - r * 2),
    y: fromTop ? -r * 2 : targetY,
    vx: initVx,
    vy: 0,
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
    gravity: 0.12,
    waves,
    tick: Math.random() * 1000,
    dropDelay: delay || 0,
    dropTimer: 0,
    active: !fromTop,
    panelOpen: false,

    personalPhase: Math.random() * Math.PI * 2, // ← 추가
    sortTick: 0, // ← 추가
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

  // 낙하 중 squash & stretch
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

  // 선택된 공 테두리 (panelOpen일 때)
  if (b.panelOpen) {
    ctx.beginPath();
    ctx.arc(0, 0, b.r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  // 새로 생성된 공 빛 테두리 (맥동)
  if (b.glowing) {
    const now = Date.now();
    const pulse = Math.sin(now / 300) * 0.5 + 0.5; // 천천히 맥동

    ctx.save();

    // ── 레이어 1: 가장 넓은 바깥 글로우 ──
    const grd1 = ctx.createRadialGradient(0, 0, b.r, 0, 0, b.r * 3.5);
    grd1.addColorStop(0, `rgba(255, 255, 255, ${0.15 + pulse * 0.1})`);
    grd1.addColorStop(1, `rgba(255, 255, 255, 0)`);
    ctx.beginPath();
    ctx.arc(0, 0, b.r * 3.5, 0, Math.PI * 2);
    ctx.fillStyle = grd1;
    ctx.fill();

    // ── 레이어 2: 중간 글로우 ──
    const grd2 = ctx.createRadialGradient(0, 0, b.r, 0, 0, b.r * 2.2);
    grd2.addColorStop(0, `rgba(255, 255, 255, ${0.35 + pulse * 0.2})`);
    grd2.addColorStop(1, `rgba(255, 255, 255, 0)`);
    ctx.beginPath();
    ctx.arc(0, 0, b.r * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = grd2;
    ctx.fill();

    // ── 레이어 3: 테두리 바로 바깥 강한 빛 ──
    const grd3 = ctx.createRadialGradient(0, 0, b.r * 0.9, 0, 0, b.r * 1.4);
    grd3.addColorStop(0, `rgba(255, 255, 255, ${0.6 + pulse * 0.4})`);
    grd3.addColorStop(1, `rgba(255, 255, 255, 0)`);
    ctx.beginPath();
    ctx.arc(0, 0, b.r * 1.4, 0, Math.PI * 2);
    ctx.fillStyle = grd3;
    ctx.fill();

    ctx.restore();
  }

  // 이미지가 로드됐으면 이미지로, 아직이면 색상 원으로
  const img = LOADED_IMAGES[b.imageSrc];
  if (img) {
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, -b.r, -b.r, b.r * 2, b.r * 2);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();
  }

  ctx.restore();
}

// ================================================================
// 공 물리 업데이트 (매 프레임 호출)
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

  // ── 정렬 모드 2: 각자 성격대로 꼼지락 ──
  if (b.sorting && b.sortStarted && !b.sortDropping) {
    b.sortTick = (b.sortTick || 0) + 1;

    // 진폭: 4제곱 → 아주 오래 작게 유지되다 후반에만 커짐
    const personalGrow = 0.001 + (b.total / 100) * 0.003; // ← 매우 느리게
    const growProgress = Math.min(b.sortTick * personalGrow, 1);
    const eased = growProgress * growProgress * growProgress * growProgress; // ← 4제곱

    const maxAmp = 10 + (b.total / 100) * 50;
    const amp = eased * maxAmp;

    // 떨림: 주파수 높여서 자잘하게
    const xFreq = 0.18 + (b.total / 100) * 0.14; // ← 높은 주파수 = 빠른 잔떨림
    const xAmp = amp + 2; // 최소 2px는 항상 떨림 (초반에도 미세하게 보이게)

    b.x =
      b.sortTargetX +
      Math.sin(b.sortTick * xFreq + b.personalPhase) * xAmp +
      Math.sin(b.sortTick * xFreq * 2.1 + 0.8) * xAmp * 0.15;

    // Y: 진폭 50% 넘어서야 합류, 주파수는 X보다 느림
    const yFreq = xFreq * 0.45;
    const yProgress = Math.max(0, growProgress - 0.5) / 0.5; // 50% 이후 시작
    const yEased = yProgress * yProgress * yProgress;
    const yAmp = yEased * maxAmp * 0.3 * ((b.total / 100) * 0.7 + 0.3);

    b.y =
      b.sortTargetY +
      Math.sin(b.sortTick * yFreq + b.personalPhase * 0.6) * yAmp +
      Math.sin(b.sortTick * yFreq * 1.4 + 1.5) * yAmp * 0.2;

    if (b.x - b.r < 0) b.x = b.r;
    if (b.x + b.r > W) b.x = W - b.r;

    return;
  }

  // ── 정렬 모드 3: 이탈 — 벽 튕기며 아래로 낙하 ──
  // ── 정렬 3: 벽 튕기며 이동 (위/아래 모두) ──
  if (b.sortDropping) {
    // 현재 위치에서 targetY까지의 방향 판단
    const goingUp = b.targetY < b.y; // targetY가 위에 있으면 위로 이동

    if (goingUp) {
      // ── 위로 올라가는 경우 ──
      // 중력 반대로 — 위쪽으로 가속
      b.vy -= b.gravity;

      // 너무 빠르게 올라가지 않도록 최대 속도 제한
      if (b.vy < -12) b.vy = -12;

      b.y += b.vy;
      b.x += b.vx;

      // 좌우 벽 튕기기
      if (b.x - b.r < 0) {
        b.x = b.r;
        b.vx = Math.abs(b.vx) * b.wallRestitution;
      }
      if (b.x + b.r > W) {
        b.x = W - b.r;
        b.vx = -Math.abs(b.vx) * b.wallRestitution;
      }

      // targetY 도달 (위에서 체크 — y가 targetY보다 작아지면)
      if (b.y <= b.targetY) {
        const overshoot = b.targetY - b.y;
        b.y = b.targetY + overshoot;
        b.vy = Math.abs(b.vy) * b.restitution;
        b.bounceCount++;
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
      // ── 아래로 내려가는 경우 (기존 코드 그대로) ──
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
        b.bounceCount++;
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

  // ── 기존 물리 ──
  // ── 기존 물리 ──
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
      const overshoot = b.y - b.targetY;
      b.y = overshoot < b.r ? b.targetY - overshoot : b.targetY;
      b.vy = -Math.abs(b.vy) * b.restitution;
      b.bounceCount++;

      const decay = 0.02 + (b.total / 100) * 0.04;
      b.restitution = Math.max(0.35, b.restitution - decay);

      const settleThreshold = 0.15 + (b.total / 100) * 0.35;
      if (Math.abs(b.vy) < settleThreshold) {
        b.vy = 0;
        b.settling = false;
        b.settled = true;
        b.tick = 0; // ← 추가! patrol yOff가 0에서 시작
      }
    }
  } else {
    const liveSpd = computeSpeedFromY(b.y) * pctMultiplier(b.total);
    b.spd = liveSpd;
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

    // yOff 계산
    let yOff = 0;
    for (const w of b.waves)
      yOff += Math.sin(b.tick * w.freq + w.phase) * w.amp;

    // 순간이동 방지 — 목표 y와 현재 y 차이를 서서히 좁힘 (lerp)
    const targetY_now = b.targetY + yOff;
    b.y += (targetY_now - b.y) * 0.08; // ← 직접 대입 대신 lerp
  }
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
// 애니메이션 루프 (매 프레임 실행)
// ================================================================
function loop() {
  ctx.clearRect(0, 0, W, H);
  for (const b of balls) drawBall(b);
  for (const b of balls) updateBall(b);
  raf = requestAnimationFrame(loop);
}
