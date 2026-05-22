/********************************************************************
 * HERO BACKGROUND: BOIDS ANIMADOS
 ********************************************************************/
(function() {
    const canvas = document.getElementById('canvas-hero-boids');
    const ctx = canvas.getContext('2d');
 
    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', () => { resize(); initHeroBoids(); });
 
    const MAX_SPEED = 2.8, MAX_FORCE = 0.06;
    const SEP_R = 28, ALIGN_R = 55, COH_R = 55;
    const N_BOIDS = 80;
    const PALETTE = ['#10b981','#34d399','#6ee7b7','#3b82f6','#60a5fa','#a78bfa','#f472b6'];
    let boids = [], mouse = { x: -999, y: -999 };
 
    function Boid() {
        const a = Math.random() * Math.PI * 2;
        return {
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5,
            color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
            size: 3.5 + Math.random() * 2.5, history: []
        };
    }
 
    function initHeroBoids() { boids = Array.from({ length: N_BOIDS }, Boid); }
    function limit(vx, vy, max) {
        const m = Math.hypot(vx, vy);
        return m > max ? [vx / m * max, vy / m * max] : [vx, vy];
    }
    function steerTo(boid, tx, ty) {
        const m = Math.hypot(tx, ty);
        if (m === 0) return [0, 0];
        const desired = [tx / m * MAX_SPEED, ty / m * MAX_SPEED];
        return limit(desired[0] - boid.vx, desired[1] - boid.vy, MAX_FORCE);
    }
 
    function update() {
        const W = canvas.width, H = canvas.height;
        for (const b of boids) {
            let sx=0,sy=0,sc=0, ax=0,ay=0,ac=0, cx=0,cy=0,cc=0;
            for (const o of boids) {
                if (o === b) continue;
                const dx = b.x - o.x, dy = b.y - o.y;
                const d = Math.hypot(dx, dy);
                if (d < SEP_R && d > 0) { sx += dx/d; sy += dy/d; sc++; }
                if (d < ALIGN_R) { ax += o.vx; ay += o.vy; ac++; }
                if (d < COH_R)  { cx += o.x; cy += o.y; cc++; }
            }
            let fx=0, fy=0;
            if (sc>0) { const [a,bb]=steerTo(b,sx/sc,sy/sc); fx+=a*1.6; fy+=bb*1.6; }
            if (ac>0) { const [a,bb]=steerTo(b,ax/ac,ay/ac); fx+=a*0.9; fy+=bb*0.9; }
            if (cc>0) { const [a,bb]=steerTo(b,cx/cc-b.x,cy/cc-b.y); fx+=a*0.9; fy+=bb*0.9; }
 
            const mdx = b.x - mouse.x, mdy = b.y - mouse.y;
            const md = Math.hypot(mdx, mdy);
            if (md < 120 && md > 0) {
                const [a,bb] = steerTo(b, mdx/md, mdy/md);
                fx += a * 2.5; fy += bb * 2.5;
            }
 
            b.vx += fx; b.vy += fy;
            [b.vx, b.vy] = limit(b.vx, b.vy, MAX_SPEED);
            b.history.push({ x: b.x, y: b.y });
            if (b.history.length > 12) b.history.shift();
            b.x = (b.x + b.vx + W) % W;
            b.y = (b.y + b.vy + H) % H;
        }
    }
 
    function draw() {
        const W = canvas.width, H = canvas.height;
        ctx.fillStyle = 'rgba(15,23,42,0.25)';
        ctx.fillRect(0, 0, W, H);
 
        for (const b of boids) {
            for (let i = 0; i < b.history.length; i++) {
                const t = i / b.history.length;
                ctx.beginPath();
                ctx.arc(b.history[i].x, b.history[i].y, b.size * t * 0.6, 0, Math.PI * 2);
                ctx.fillStyle = b.color + Math.floor(t * 80).toString(16).padStart(2,'0');
                ctx.fill();
            }
            const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size * 3);
            grd.addColorStop(0, b.color + '55');
            grd.addColorStop(1, b.color + '00');
            ctx.beginPath(); ctx.arc(b.x, b.y, b.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = grd; ctx.fill();
 
            const angle = Math.atan2(b.vy, b.vx);
            ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(angle);
            ctx.beginPath(); ctx.moveTo(b.size * 2, 0); ctx.lineTo(-b.size, b.size * 0.8); ctx.lineTo(-b.size, -b.size * 0.8); ctx.closePath();
            ctx.fillStyle = b.color; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1; ctx.restore();
        }
 
        ctx.lineWidth = 0.4;
        for (let i = 0; i < boids.length; i++) {
            for (let j = i+1; j < boids.length; j++) {
                const d = Math.hypot(boids[i].x - boids[j].x, boids[i].y - boids[j].y);
                if (d < 70) {
                    ctx.beginPath(); ctx.moveTo(boids[i].x, boids[i].y); ctx.lineTo(boids[j].x, boids[j].y);
                    ctx.strokeStyle = `rgba(16,185,129,${0.15 * (1 - d/70)})`; ctx.stroke();
                }
            }
        }
    }
 
    function loop() { update(); draw(); requestAnimationFrame(loop); }
 
    document.getElementById('inicio').addEventListener('mousemove', e => {
        const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    document.getElementById('inicio').addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });
 
    initHeroBoids(); loop();
})();
 
/********************************************************************
 * PROYECTO 1: AUTÓMATA CELULAR OPTIMIZADO (Juego de la Vida)
 ********************************************************************/
const canvasGOL = document.getElementById('lienzo-gol');
const ctxGOL = canvasGOL.getContext('2d');
const ANCHO_GOL = canvasGOL.width, ALTO_GOL = canvasGOL.height, TAMANO_CELDA = 10;
const COLUMNAS_GOL = Math.floor(ANCHO_GOL / TAMANO_CELDA), FILAS_GOL = Math.floor(ALTO_GOL / TAMANO_CELDA);
const FPS_GOL = 15;
const COLOR_FONDO_GOL = '#05070a', COLOR_REJILLA = '#1e293b', COLOR_CELULA = '#10b981';
let matrizGOL = Array.from({ length: FILAS_GOL }, () => new Array(COLUMNAS_GOL).fill(0));
let simulacionActivaGOL = false, idAnimacionGOL, dibujandoGOL = false;
 
function llenarAleatorioGOL() {
    matrizGOL = Array.from({ length: FILAS_GOL }, () => Array.from({ length: COLUMNAS_GOL }, () => Math.random() < 0.2 ? 1 : 0));
    dibujarTableroGOL();
}
function contarVecinosGOL(f, c) {
    let vecinos = 0;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        let vecinoF = (f + i + FILAS_GOL) % FILAS_GOL, vecinoC = (c + j + COLUMNAS_GOL) % COLUMNAS_GOL;
        vecinos += matrizGOL[vecinoF][vecinoC];
    }
    return vecinos;
}
function actualizarMatrizGOL() {
    let siguienteTurno = matrizGOL.map(fila => [...fila]);
    for (let f = 0; f < FILAS_GOL; f++) for (let c = 0; c < COLUMNAS_GOL; c++) {
        let nVecinos = contarVecinosGOL(f, c);
        if (matrizGOL[f][c] === 1) { if (nVecinos < 2 || nVecinos > 3) siguienteTurno[f][c] = 0; } 
        else { if (nVecinos === 3) siguienteTurno[f][c] = 1; }
    }
    matrizGOL = siguienteTurno;
}
function dibujarTableroGOL() {
    ctxGOL.fillStyle = COLOR_FONDO_GOL; ctxGOL.fillRect(0, 0, ANCHO_GOL, ALTO_GOL);
    ctxGOL.fillStyle = COLOR_CELULA;
    for (let f = 0; f < FILAS_GOL; f++) for (let c = 0; c < COLUMNAS_GOL; c++) {
        if (matrizGOL[f][c] === 1) ctxGOL.fillRect(c * TAMANO_CELDA + 1, f * TAMANO_CELDA + 1, TAMANO_CELDA - 2, TAMANO_CELDA - 2);
    }
    ctxGOL.strokeStyle = COLOR_REJILLA; ctxGOL.lineWidth = 0.5; ctxGOL.beginPath();
    for (let x = 0; x <= ANCHO_GOL; x += TAMANO_CELDA) { ctxGOL.moveTo(x, 0); ctxGOL.lineTo(x, ALTO_GOL); }
    for (let y = 0; y <= ALTO_GOL; y += TAMANO_CELDA) { ctxGOL.moveTo(0, y); ctxGOL.lineTo(ANCHO_GOL, y); }
    ctxGOL.stroke();
}
function bucleGOL() {
    if (simulacionActivaGOL) { actualizarMatrizGOL(); dibujarTableroGOL(); idAnimacionGOL = setTimeout(() => requestAnimationFrame(bucleGOL), 1000 / FPS_GOL); }
}
 
document.getElementById('btnPlayPause').addEventListener('click', (e) => {
    simulacionActivaGOL = !simulacionActivaGOL; e.target.textContent = simulacionActivaGOL ? "⏸ Pausar" : "▶ Iniciar";
    e.target.style.backgroundColor = simulacionActivaGOL ? "#f59e0b" : "#334155";
    if (simulacionActivaGOL) bucleGOL(); else clearTimeout(idAnimacionGOL);
});
document.getElementById('btnRandom').addEventListener('click', llenarAleatorioGOL);
document.getElementById('btnClear').addEventListener('click', () => {
    matrizGOL = Array.from({ length: FILAS_GOL }, () => new Array(COLUMNAS_GOL).fill(0));
    simulacionActivaGOL = false; document.getElementById('btnPlayPause').textContent = "▶ Iniciar"; document.getElementById('btnPlayPause').style.backgroundColor = "#334155";
    clearTimeout(idAnimacionGOL); dibujarTableroGOL();
});
function pintarGOL(e) {
    if (!dibujandoGOL) return;
    const rect = canvasGOL.getBoundingClientRect(), scaleX = canvasGOL.width / rect.width, scaleY = canvasGOL.height / rect.height;
    const c = Math.floor(((e.clientX - rect.left) * scaleX) / TAMANO_CELDA), f = Math.floor(((e.clientY - rect.top) * scaleY) / TAMANO_CELDA);
    if (f >= 0 && f < FILAS_GOL && c >= 0 && c < COLUMNAS_GOL) { matrizGOL[f][c] = 1; dibujarTableroGOL(); }
}
canvasGOL.addEventListener('mousedown', (e) => { dibujandoGOL = true; pintarGOL(e); });
canvasGOL.addEventListener('mousemove', pintarGOL);
window.addEventListener('mouseup', () => { dibujandoGOL = false; });
dibujarTableroGOL();
 
/********************************************************************
 * PROYECTO 2: ZERO-TOUCH UI & COMPUTER VISION
 ********************************************************************/
const videoElement = document.getElementById('webcam'), canvasIA = document.getElementById('canvas-ia'), ctxIA = canvasIA.getContext('2d');
const loadingIA = document.getElementById('loading-ia'), btnCamara = document.getElementById('btnCamara');
let camaraIniciada = false, activeCamera = null, juegoActivo = false, tiempoRestante = 30, puntuacion = 0, intervaloReloj, objetivo = { x: 0, y: 0, radio: 25, activo: false };
 
const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });
 
function generarNuevoObjetivo() {
    const padding = 40;
    objetivo.x = padding + Math.random() * (canvasIA.width - padding * 2);
    objetivo.y = padding + 40 + Math.random() * (canvasIA.height - padding * 2 - 40);
    objetivo.activo = true;
}
 
hands.onResults((results) => {
    loadingIA.style.display = 'none'; ctxIA.clearRect(0, 0, canvasIA.width, canvasIA.height);
    ctxIA.save(); ctxIA.scale(-1, 1); ctxIA.translate(-canvasIA.width, 0); ctxIA.drawImage(results.image, 0, 0, canvasIA.width, canvasIA.height);
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) dibujarEsqueletoMano(results.multiHandLandmarks[0]);
    ctxIA.restore(); dibujarInterfazJuego();
 
    if (juegoActivo && objetivo.activo && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const mano = results.multiHandLandmarks[0], indiceX = (1 - mano[8].x) * canvasIA.width, indiceY = mano[8].y * canvasIA.height;
        if (Math.hypot(indiceX - objetivo.x, indiceY - objetivo.y) < objetivo.radio) { puntuacion += 100; generarNuevoObjetivo(); }
    }
});
 
function dibujarInterfazJuego() {
    ctxIA.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctxIA.fillRect(0, 0, canvasIA.width, 40);
    ctxIA.font = 'bold 16px Arial'; ctxIA.fillStyle = '#10b981'; ctxIA.textAlign = 'left'; ctxIA.fillText(`⭐ PUNTOS: ${puntuacion}`, 15, 26);
    ctxIA.fillStyle = tiempoRestante > 10 ? '#ffffff' : '#ef4444'; ctxIA.textAlign = 'right'; ctxIA.fillText(`⏱️ TIEMPO: ${tiempoRestante}s`, canvasIA.width - 15, 26);
 
    if (juegoActivo && objetivo.activo && tiempoRestante > 0) {
        ctxIA.beginPath(); ctxIA.arc(objetivo.x, objetivo.y, objetivo.radio, 0, 2 * Math.PI);
        const gradient = ctxIA.createRadialGradient(objetivo.x, objetivo.y, 5, objetivo.x, objetivo.y, objetivo.radio);
        gradient.addColorStop(0, '#34d399'); gradient.addColorStop(1, 'rgba(16, 185, 129, 0.2)');
        ctxIA.fillStyle = gradient; ctxIA.fill(); ctxIA.lineWidth = 2; ctxIA.strokeStyle = '#ffffff'; ctxIA.stroke();
    }
    if (!juegoActivo && tiempoRestante === 30 && puntuacion === 0) {
        ctxIA.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctxIA.fillRect(0, 0, canvasIA.width, canvasIA.height);
        ctxIA.fillStyle = '#fff'; ctxIA.textAlign = 'center'; ctxIA.font = 'bold 18px Arial';
        ctxIA.fillText("👆 Usa la punta de tu dedo índice", canvasIA.width/2, canvasIA.height/2 - 10);
        ctxIA.font = '14px Arial'; ctxIA.fillText("para interceptar los objetivos verdes.", canvasIA.width/2, canvasIA.height/2 + 20);
    }
    if (!juegoActivo && tiempoRestante <= 0) {
        ctxIA.fillStyle = 'rgba(15, 23, 42, 0.95)'; ctxIA.fillRect(0, 0, canvasIA.width, canvasIA.height);
        ctxIA.fillStyle = '#10b981'; ctxIA.textAlign = 'center'; ctxIA.font = 'bold 24px Arial'; ctxIA.fillText("¡TIEMPO AGOTADO!", canvasIA.width/2, canvasIA.height/2 - 20);
        ctxIA.fillStyle = '#fff'; ctxIA.font = 'bold 18px Arial'; ctxIA.fillText(`Puntuación final: ${puntuacion}`, canvasIA.width/2, canvasIA.height/2 + 15);
    }
}
 
function dibujarEsqueletoMano(landmarks) {
    ctxIA.fillStyle = '#3b82f6'; ctxIA.strokeStyle = '#ffffff'; ctxIA.lineWidth = 1.5;
    for (let i = 0; i < landmarks.length; i++) {
        const x = landmarks[i].x * canvasIA.width, y = landmarks[i].y * canvasIA.height;
        ctxIA.beginPath();
        if (i === 8) { ctxIA.arc(x, y, 7, 0, 2 * Math.PI); ctxIA.fillStyle = '#ef4444'; ctxIA.fill(); ctxIA.fillStyle = '#3b82f6'; } 
        else { ctxIA.arc(x, y, 3, 0, 2 * Math.PI); ctxIA.fill(); }
    }
}
 
btnCamara.addEventListener('click', async () => {
    if (!camaraIniciada) {
        btnCamara.textContent = "⚡ Detener Demo"; btnCamara.style.backgroundColor = "#ef4444"; loadingIA.style.display = 'flex';
        juegoActivo = true; tiempoRestante = 30; puntuacion = 0; generarNuevoObjetivo();
        intervaloReloj = setInterval(() => {
            if (juegoActivo && tiempoRestante > 0) tiempoRestante--;
            if (tiempoRestante <= 0) { juegoActivo = false; objetivo.activo = false; clearInterval(intervaloReloj); }
        }, 1000);
        activeCamera = new Camera(videoElement, { onFrame: async () => { await hands.send({ image: videoElement }); }, width: 480, height: 360 });
        activeCamera.start().then(() => { camaraIniciada = true; });
    } else {
        btnCamara.textContent = "⚡ Activar Visión Artificial"; btnCamara.style.backgroundColor = "var(--color-acento)"; loadingIA.style.display = 'none';
        clearInterval(intervaloReloj); juegoActivo = false; objetivo.activo = false;
        if (activeCamera) await activeCamera.stop(); ctxIA.clearRect(0, 0, canvasIA.width, canvasIA.height); camaraIniciada = false;
    }
});
 
/********************************************************************
 * PROYECTO 3: A* PATHFINDING INTERACTIVO
 ********************************************************************/
(function() {
    const canvas = document.getElementById('canvas-astar'), ctx = canvas.getContext('2d');
    const COLS = 28, ROWS = 24, CW = Math.floor(canvas.width / COLS), CH = Math.floor(canvas.height / ROWS);
    let grid = [], openSet = [], closedSet = [], path = [], start = {x:1, y:1}, end = {x:COLS-2, y:ROWS-2}, running = false, drawing = false, animId;
 
    function Node(x, y) { return { x, y, wall: false, g: Infinity, f: Infinity, h: 0, parent: null }; }
    function initGrid() { grid = Array.from({length: ROWS}, (_, y) => Array.from({length: COLS}, (_, x) => Node(x, y))); openSet = []; closedSet = []; path = []; }
    function heuristic(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
    function getNeighbors(node) {
        const dirs = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
        return dirs.map(d => { const nx = node.x + d.x, ny = node.y + d.y; return (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) ? grid[ny][nx] : null; }).filter(n => n && !n.wall);
    }
 
    function draw() {
        ctx.fillStyle = '#05070a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
            const n = grid[y][x]; let color = '#0f172a';
            if (n.wall) color = '#334155'; else if (closedSet.includes(n)) color = 'rgba(59,130,246,0.35)'; else if (openSet.includes(n)) color = 'rgba(16,185,129,0.25)';
            ctx.fillStyle = color; ctx.fillRect(x*CW+1, y*CH+1, CW-1, CH-1);
        }
        path.forEach(n => { ctx.fillStyle = '#10b981'; ctx.fillRect(n.x*CW+2, n.y*CH+2, CW-3, CH-3); });
        ctx.fillStyle = '#22c55e'; ctx.fillRect(start.x*CW+1, start.y*CH+1, CW-1, CH-1);
        ctx.fillStyle = '#ef4444'; ctx.fillRect(end.x*CW+1, end.y*CH+1, CW-1, CH-1);
        ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 0.3;
        for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x*CW,0); ctx.lineTo(x*CW,canvas.height); ctx.stroke(); }
        for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0,y*CH); ctx.lineTo(canvas.width,y*CH); ctx.stroke(); }
    }
 
    function reconstructPath(node) { path = []; let cur = node; while (cur.parent) { path.push(cur); cur = cur.parent; } }
    function astarStep() {
        if (openSet.length === 0) { running = false; return; }
        openSet.sort((a, b) => a.f - b.f); const current = openSet.shift();
        if (current.x === end.x && current.y === end.y) { reconstructPath(current); running = false; draw(); return; }
        closedSet.push(current);
        for (const neighbor of getNeighbors(current)) {
            if (closedSet.includes(neighbor)) continue;
            const tentG = current.g + 1;
            if (tentG < neighbor.g) {
                neighbor.parent = current; neighbor.g = tentG; neighbor.h = heuristic(neighbor, grid[end.y][end.x]);
                neighbor.f = neighbor.g + neighbor.h; if (!openSet.includes(neighbor)) openSet.push(neighbor);
            }
        }
        draw(); if (running) animId = requestAnimationFrame(astarStep);
    }
 
    function startSearch() {
        cancelAnimationFrame(animId); openSet = []; closedSet = []; path = [];
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { grid[y][x].g = Infinity; grid[y][x].f = Infinity; grid[y][x].parent = null; }
        const s = grid[start.y][start.x]; s.g = 0; s.h = heuristic(s, grid[end.y][end.x]); s.f = s.h; openSet.push(s); running = true; astarStep();
    }
 
    function getCellFromEvent(e) {
        const rect = canvas.getBoundingClientRect(), sx = canvas.width / rect.width, sy = canvas.height / rect.height;
        return { x: Math.floor(((e.clientX - rect.left) * sx) / CW), y: Math.floor(((e.clientY - rect.top) * sy) / CH) };
    }
 
    canvas.addEventListener('mousedown', e => { drawing = true; const c = getCellFromEvent(e); if (c.x>=0&&c.x<COLS&&c.y>=0&&c.y<ROWS) { grid[c.y][c.x].wall = !grid[c.y][c.x].wall; draw(); } });
    canvas.addEventListener('mousemove', e => { if (!drawing) return; const c = getCellFromEvent(e); if (c.x>=0&&c.x<COLS&&c.y>=0&&c.y<ROWS&&!(c.x===start.x&&c.y===start.y)&&!(c.x===end.x&&c.y===end.y)) { grid[c.y][c.x].wall = true; draw(); } });
    window.addEventListener('mouseup', () => { drawing = false; });
 
    document.getElementById('btn-astar-run').addEventListener('click', startSearch);
    document.getElementById('btn-astar-clear').addEventListener('click', () => { cancelAnimationFrame(animId); running = false; initGrid(); draw(); });
    document.getElementById('btn-astar-random').addEventListener('click', () => {
        initGrid();
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { if ((x===start.x&&y===start.y)||(x===end.x&&y===end.y)) continue; grid[y][x].wall = Math.random() < 0.28; }
        draw();
    });
 
    initGrid(); draw();
})();
 
/********************************************************************
 * PROYECTO 4: MOTOR DE PARTÍCULAS CON FÍSICA
 ********************************************************************/
(function() {
    const canvas = document.getElementById('canvas-particles'), ctx = canvas.getContext('2d'), gravSlider = document.getElementById('particles-gravity');
    const W = canvas.width, H = canvas.height; let particles = [], running = true, animId;
    const COLORS = ['#10b981','#3b82f6','#f59e0b','#ec4899','#8b5cf6','#34d399','#60a5fa'];
 
    function Particle(x, y, vx, vy) { return { x, y, vx, vy, r: 3 + Math.random() * 4, color: COLORS[Math.floor(Math.random() * COLORS.length)], life: 1.0, decay: 0.002 + Math.random() * 0.003, history: [] }; }
    function spawnExplosion(x, y, n = 30) { for (let i = 0; i < n; i++) { const angle = Math.random() * Math.PI * 2, speed = 2 + Math.random() * 6; particles.push(Particle(x, y, Math.cos(angle)*speed, Math.sin(angle)*speed)); } }
    function init() { particles = []; for (let i = 0; i < 40; i++) { spawnExplosion(Math.random()*W, Math.random()*H, 1); particles[particles.length-1].vx = (Math.random()-0.5)*4; particles[particles.length-1].vy = (Math.random()-0.5)*4; } }
 
    function update() {
        const gravity = parseFloat(gravSlider.value) * 0.05; particles = particles.filter(p => p.life > 0);
        for (const p of particles) {
            p.vy += gravity; p.history.push({x: p.x, y: p.y}); if (p.history.length > 12) p.history.shift(); p.x += p.vx; p.y += p.vy;
            if (p.x - p.r < 0) { p.x = p.r; p.vx = Math.abs(p.vx) * 0.8; }
            if (p.x + p.r > W) { p.x = W - p.r; p.vx = -Math.abs(p.vx) * 0.8; }
            if (p.y + p.r > H) { p.y = H - p.r; p.vy = -Math.abs(p.vy) * 0.75; p.vx *= 0.98; }
            if (p.y - p.r < 0) { p.y = p.r; p.vy = Math.abs(p.vy) * 0.8; }
            p.life -= p.decay;
        }
        while (particles.length < 40) { particles.push(Particle(Math.random()*W, 10, (Math.random()-0.5)*4, Math.random()*2)); }
    }
 
    function draw() {
        ctx.fillStyle = 'rgba(5,7,10,0.4)'; ctx.fillRect(0, 0, W, H);
        for (const p of particles) {
            for (let i = 0; i < p.history.length; i++) {
                const a = (i / p.history.length) * p.life * 0.5;
                ctx.beginPath(); ctx.arc(p.history[i].x, p.history[i].y, p.r * (i/p.history.length), 0, Math.PI*2);
                ctx.fillStyle = p.color + Math.floor(a*255).toString(16).padStart(2,'0'); ctx.fill();
            }
            const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r*2.5);
            grd.addColorStop(0, p.color + 'cc'); grd.addColorStop(1, p.color + '00');
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r*2.5, 0, Math.PI*2); ctx.fillStyle = grd; ctx.fill();
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fillStyle = p.color; ctx.fill();
        }
    }
 
    function loop() { if (!running) return; update(); draw(); animId = requestAnimationFrame(loop); }
 
    canvas.addEventListener('click', e => { const r = canvas.getBoundingClientRect(); spawnExplosion((e.clientX - r.left) * (W/r.width), (e.clientY - r.top) * (H/r.height), 25); });
    document.getElementById('btn-particles-pause').addEventListener('click', function() { running = !running; this.textContent = running ? '⏸ Pausar' : '▶ Reanudar'; if (running) loop(); });
    document.getElementById('btn-particles-reset').addEventListener('click', () => { init(); });
    init(); loop();
})();
 
/********************************************************************
 * FONDO "SOBRE MÍ": ONDAS / PULSOS
 ********************************************************************/
(function() {
    const canvas = document.getElementById('canvas-pulsos');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
 
    function resize() {
        const parent = canvas.parentElement;
        canvas.width  = parent ? parent.offsetWidth : window.innerWidth;
        canvas.height = parent ? parent.offsetHeight : 800;
    }
    resize();
    window.addEventListener('resize', resize);
 
    const ORIGINS = [ { rx: 0.5, ry: 0.5 }, { rx: 0.15, ry: 0.3 }, { rx: 0.85, ry: 0.7 }, { rx: 0.3,  ry: 0.85 }, { rx: 0.75, ry: 0.15 } ];
    const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'];
    let waves = [], tick = 0;
 
    function spawnWave(ox, oy, color) { waves.push({ x: ox, y: oy, r: 0, maxR: 0, alpha: 0.7, color, speed: 0.8 + Math.random() * 0.6 }); }
    function initWaves() { ORIGINS.forEach((o, i) => { setTimeout(() => { const W = canvas.width, H = canvas.height; spawnWave(o.rx * W, o.ry * H, COLORS[i % COLORS.length]); }, i * 700); }); }
 
    function loop() {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        tick++;
        ORIGINS.forEach((o, i) => {
            const interval = 90 + i * 18;
            if ((tick + i * 17) % interval === 0) {
                const maxR = Math.max(W, H) * (0.35 + Math.random() * 0.25);
                waves.push({ x: o.rx * W, y: o.ry * H, r: 0, maxR, alpha: 0.65, color: COLORS[i % COLORS.length], speed: 0.9 + Math.random() * 0.7 });
            }
        });
        waves = waves.filter(w => w.alpha > 0.01);
        for (const w of waves) {
            ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
            ctx.strokeStyle = w.color + Math.floor(w.alpha * 255).toString(16).padStart(2, '00'); ctx.lineWidth = 1.5; ctx.stroke();
            const innerAlpha = w.alpha * 0.08, grd = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.r);
            grd.addColorStop(0, w.color + Math.floor(innerAlpha * 255).toString(16).padStart(2, '0')); grd.addColorStop(1, w.color + '00');
            ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
            w.r += w.speed; const progress = w.r / (w.maxR || 300); w.alpha = 0.65 * (1 - progress * progress);
        }
        requestAnimationFrame(loop);
    }
    initWaves(); loop();
})();
 
/********************************************************************
 * FONDO "TRAYECTORIA": RED NEURONAL ESPACIAL
 ********************************************************************/
(function() {
    const canvas = document.getElementById('canvas-nodos');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
 
    function resize() {
        const parent = canvas.parentElement;
        canvas.width  = (parent && parent.offsetWidth > 0) ? parent.offsetWidth : window.innerWidth;
        canvas.height = (parent && parent.offsetHeight > 0) ? parent.offsetHeight : 1200;
        initNodes();
    }
    
    window.addEventListener('resize', resize);
 
    const N_NODOS = 100;
    const DISTANCIA_CONEXION = 160; 
    const COLORES_NODO = ['#10b981', '#34d399', '#3b82f6']; 
 
    let nodos = [];
 
    function CrearNodo() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: 1.8 + Math.random() * 2.5,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
            color: COLORES_NODO[Math.floor(Math.random() * COLORES_NODO.length)],
        };
    }
 
    function initNodes() {
        nodos = Array.from({ length: N_NODOS }, CrearNodo);
    }
 
    function loop() {
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
 
        for (const n of nodos) {
            n.x += n.vx; n.y += n.vy;
            if (n.x < 0 || n.x > W) n.vx *= -1;
            if (n.y < 0 || n.y > H) n.vy *= -1;
        }
 
        ctx.lineWidth = 1.0;
        for (let i = 0; i < nodos.length; i++) {
            for (let j = i + 1; j < nodos.length; j++) {
                const dist = Math.hypot(nodos[i].x - nodos[j].x, nodos[i].y - nodos[j].y);
                if (dist < DISTANCIA_CONEXION) {
                    const opacidad = (1 - dist / DISTANCIA_CONEXION) * 0.6;
                    ctx.beginPath(); ctx.moveTo(nodos[i].x, nodos[i].y); ctx.lineTo(nodos[j].x, nodos[j].y);
                    const grad = ctx.createLinearGradient(nodos[i].x, nodos[i].y, nodos[j].x, nodos[j].y);
                    grad.addColorStop(0, nodos[i].color + Math.floor(opacidad * 255).toString(16).padStart(2, '0'));
                    grad.addColorStop(1, nodos[j].color + Math.floor(opacidad * 255).toString(16).padStart(2, '0'));
                    ctx.strokeStyle = grad; ctx.stroke();
                }
            }
        }
 
        for (const n of nodos) {
            const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6);
            glow.addColorStop(0, n.color + 'dd');
            glow.addColorStop(1, n.color + '00');
            ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 6, 0, Math.PI * 2); ctx.fillStyle = glow; ctx.fill();
            ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fillStyle = n.color; ctx.fill();
        }
        requestAnimationFrame(loop);
    }
 
    setTimeout(resize, 100);
    loop();
})();
 
/********************************************************************
 * TRANSICIONES SUAVES: SCROLL FADE-IN + AJUSTE DE TAMAÑO DE FONDOS
 ********************************************************************/
(function() {
    function initFadeObserver() {
        const targets = [...document.querySelectorAll('[data-fade]'), ...document.querySelectorAll('.tarjeta-skill'), ...document.querySelectorAll('.timeline-item'), ...document.querySelectorAll('.tarjeta-proyecto')];
        targets.forEach((el, i) => { el.classList.add('seccion-fade'); el.style.transitionDelay = `${(i % 4) * 0.1}s`; });
        const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }); }, { threshold: 0.12 });
        targets.forEach(el => observer.observe(el));
    }
 
    function fixCanvasSize(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const parent = canvas.parentElement;
        function sync() {
            const w = parent.offsetWidth, h = parent.offsetHeight;
            if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; }
        }
        sync(); const ro = new ResizeObserver(sync); ro.observe(parent);
    }
 
    fixCanvasSize('canvas-pulsos');
    fixCanvasSize('canvas-nodos'); 
 
    document.querySelectorAll('a[href^="#"]').forEach(link => { link.addEventListener('click', e => { const target = document.querySelector(link.getAttribute('href')); if (!target) return; e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); });
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initFadeObserver); } else { initFadeObserver(); }
})();