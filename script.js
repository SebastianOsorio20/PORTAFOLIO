/********************************************************************
 * BLOQUE 1: JUEGO DE LA VIDA DE CONWAY 
 ********************************************************************/
const canvasGOL = document.getElementById('lienzo-gol');
const ctxGOL = canvasGOL.getContext('2d');

const ANCHO_GOL = canvasGOL.width;
const ALTO_GOL = canvasGOL.height;
const TAMANO_CELDA = 10;
const COLUMNAS_GOL = Math.floor(ANCHO_GOL / TAMANO_CELDA);
const FILAS_GOL = Math.floor(ALTO_GOL / TAMANO_CELDA);
const FPS_GOL = 15;

const COLOR_FONDO_GOL = '#05070a';
const COLOR_REJILLA = '#1e293b';
const COLOR_CELULA = '#10b981';

let matrizGOL = Array.from({ length: FILAS_GOL }, () => new Array(COLUMNAS_GOL).fill(0));
let simulacionActivaGOL = false;
let idAnimacionGOL;
let dibujandoGOL = false;

function llenarAleatorioGOL() {
    matrizGOL = Array.from({ length: FILAS_GOL }, () => 
        Array.from({ length: COLUMNAS_GOL }, () => Math.random() < 0.2 ? 1 : 0)
    );
    dibujarTableroGOL();
}

function contarVecinosGOL(f, c) {
    let vecinos = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            let vecinoF = (f + i + FILAS_GOL) % FILAS_GOL;
            let vecinoC = (c + j + COLUMNAS_GOL) % COLUMNAS_GOL;
            vecinos += matrizGOL[vecinoF][vecinoC];
        }
    }
    return vecinos;
}

function actualizarMatrizGOL() {
    let siguienteTurno = matrizGOL.map(fila => [...fila]);
    for (let f = 0; f < FILAS_GOL; f++) {
        for (let c = 0; c < COLUMNAS_GOL; c++) {
            let nVecinos = contarVecinosGOL(f, c);
            if (matrizGOL[f][c] === 1) {
                if (nVecinos < 2 || nVecinos > 3) siguienteTurno[f][c] = 0;
            } else {
                if (nVecinos === 3) siguienteTurno[f][c] = 1;
            }
        }
    }
    matrizGOL = siguienteTurno;
}

function dibujarTableroGOL() {
    ctxGOL.fillStyle = COLOR_FONDO_GOL;
    ctxGOL.fillRect(0, 0, ANCHO_GOL, ALTO_GOL);
    ctxGOL.fillStyle = COLOR_CELULA;

    for (let f = 0; f < FILAS_GOL; f++) {
        for (let c = 0; c < COLUMNAS_GOL; c++) {
            if (matrizGOL[f][c] === 1) {
                ctxGOL.fillRect(c * TAMANO_CELDA + 1, f * TAMANO_CELDA + 1, TAMANO_CELDA - 2, TAMANO_CELDA - 2);
            }
        }
    }

    ctxGOL.strokeStyle = COLOR_REJILLA;
    ctxGOL.lineWidth = 0.5;
    ctxGOL.beginPath();
    for (let x = 0; x <= ANCHO_GOL; x += TAMANO_CELDA) { ctxGOL.moveTo(x, 0); ctxGOL.lineTo(x, ALTO_GOL); }
    for (let y = 0; y <= ALTO_GOL; y += TAMANO_CELDA) { ctxGOL.moveTo(0, y); ctxGOL.lineTo(ANCHO_GOL, y); }
    ctxGOL.stroke();
}

function bucleGOL() {
    if (simulacionActivaGOL) {
        actualizarMatrizGOL();
        dibujarTableroGOL();
        idAnimacionGOL = setTimeout(() => requestAnimationFrame(bucleGOL), 1000 / FPS_GOL);
    }
}

document.getElementById('btnPlayPause').addEventListener('click', (e) => {
    simulacionActivaGOL = !simulacionActivaGOL;
    e.target.textContent = simulacionActivaGOL ? "⏸ Pausar" : "▶ Iniciar";
    e.target.style.backgroundColor = simulacionActivaGOL ? "#f59e0b" : "#334155";
    if (simulacionActivaGOL) bucleGOL(); else clearTimeout(idAnimacionGOL);
});

document.getElementById('btnRandom').addEventListener('click', llenarAleatorioGOL);

document.getElementById('btnClear').addEventListener('click', () => {
    matrizGOL = Array.from({ length: FILAS_GOL }, () => new Array(COLUMNAS_GOL).fill(0));
    simulacionActivaGOL = false;
    document.getElementById('btnPlayPause').textContent = "▶ Iniciar";
    document.getElementById('btnPlayPause').style.backgroundColor = "#334155";
    clearTimeout(idAnimacionGOL);
    dibujarTableroGOL();
});

function pintarGOL(e) {
    if (!dibujandoGOL) return;
    const rect = canvasGOL.getBoundingClientRect();
    const scaleX = canvasGOL.width / rect.width;
    const scaleY = canvasGOL.height / rect.height;
    const c = Math.floor(((e.clientX - rect.left) * scaleX) / TAMANO_CELDA);
    const f = Math.floor(((e.clientY - rect.top) * scaleY) / TAMANO_CELDA);
    if (f >= 0 && f < FILAS_GOL && c >= 0 && c < COLUMNAS_GOL) {
        matrizGOL[f][c] = 1;
        dibujarTableroGOL();
    }
}

canvasGOL.addEventListener('mousedown', (e) => { dibujandoGOL = true; pintarGOL(e); });
canvasGOL.addEventListener('mousemove', pintarGOL);
window.addEventListener('mouseup', () => { dibujandoGOL = false; });
dibujarTableroGOL();


/********************************************************************
 * BLOQUE 2: JUEGO ZERO-TOUCH TARGET TRACKER (VISIÓN COMPUTACIONAL)
 ********************************************************************/
const videoElement = document.getElementById('webcam');
const canvasIA = document.getElementById('canvas-ia');
const ctxIA = canvasIA.getContext('2d');
const loadingIA = document.getElementById('loading-ia');
const btnCamara = document.getElementById('btnCamara');

let camaraIniciada = false;
let activeCamera = null;
let juegoActivo = false;
let tiempoRestante = 30;
let puntuacion = 0;
let intervaloReloj;
let objetivo = { x: 0, y: 0, radio: 25, activo: false };

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });

function generarNuevoObjetivo() {
    const padding = 40;
    objetivo.x = padding + Math.random() * (canvasIA.width - padding * 2);
    objetivo.y = padding + 40 + Math.random() * (canvasIA.height - padding * 2 - 40);
    objetivo.activo = true;
}

hands.onResults((results) => {
    loadingIA.style.display = 'none';
    ctxIA.clearRect(0, 0, canvasIA.width, canvasIA.height);
    
    ctxIA.save();
    ctxIA.scale(-1, 1);
    ctxIA.translate(-canvasIA.width, 0);
    ctxIA.drawImage(results.image, 0, 0, canvasIA.width, canvasIA.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        dibujarEsqueletoMano(results.multiHandLandmarks[0]);
    }
    ctxIA.restore();

    dibujarInterfazJuego();

    if (juegoActivo && objetivo.activo && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const mano = results.multiHandLandmarks[0];
        const indiceX = (1 - mano[8].x) * canvasIA.width;
        const indiceY = mano[8].y * canvasIA.height;
        const distancia = Math.hypot(indiceX - objetivo.x, indiceY - objetivo.y);

        if (distancia < objetivo.radio) {
            puntuacion += 100;
            generarNuevoObjetivo();
        }
    }
});

function dibujarInterfazJuego() {
    ctxIA.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctxIA.fillRect(0, 0, canvasIA.width, 40);
    
    ctxIA.font = 'bold 16px Arial';
    ctxIA.fillStyle = '#10b981';
    ctxIA.textAlign = 'left';
    ctxIA.fillText(`⭐ PUNTOS: ${puntuacion}`, 15, 26);

    ctxIA.fillStyle = tiempoRestante > 10 ? '#ffffff' : '#ef4444';
    ctxIA.textAlign = 'right';
    ctxIA.fillText(`⏱️ TIEMPO: ${tiempoRestante}s`, canvasIA.width - 15, 26);

    if (juegoActivo && objetivo.activo && tiempoRestante > 0) {
        ctxIA.beginPath();
        ctxIA.arc(objetivo.x, objetivo.y, objetivo.radio, 0, 2 * Math.PI);
        const gradient = ctxIA.createRadialGradient(objetivo.x, objetivo.y, 5, objetivo.x, objetivo.y, objetivo.radio);
        gradient.addColorStop(0, '#34d399');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.2)');
        ctxIA.fillStyle = gradient;
        ctxIA.fill();
        ctxIA.lineWidth = 2;
        ctxIA.strokeStyle = '#ffffff';
        ctxIA.stroke();
    }

    if (!juegoActivo && tiempoRestante === 30 && puntuacion === 0) {
        ctxIA.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctxIA.fillRect(0, 0, canvasIA.width, canvasIA.height);
        ctxIA.fillStyle = '#fff';
        ctxIA.textAlign = 'center';
        ctxIA.font = 'bold 18px Arial';
        ctxIA.fillText("👆 Usa la punta de tu dedo índice", canvasIA.width/2, canvasIA.height/2 - 10);
        ctxIA.font = '14px Arial';
        ctxIA.fillText("para interceptar los objetivos verdes.", canvasIA.width/2, canvasIA.height/2 + 20);
    }

    if (!juegoActivo && tiempoRestante <= 0) {
        ctxIA.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctxIA.fillRect(0, 0, canvasIA.width, canvasIA.height);
        ctxIA.fillStyle = '#10b981';
        ctxIA.textAlign = 'center';
        ctxIA.font = 'bold 24px Arial';
        ctxIA.fillText("¡TIEMPO AGOTADO!", canvasIA.width/2, canvasIA.height/2 - 20);
        ctxIA.fillStyle = '#fff';
        ctxIA.font = 'bold 18px Arial';
        ctxIA.fillText(`Puntuación final: ${puntuacion}`, canvasIA.width/2, canvasIA.height/2 + 15);
    }
}

function dibujarEsqueletoMano(landmarks) {
    ctxIA.fillStyle = '#3b82f6';
    ctxIA.strokeStyle = '#ffffff';
    ctxIA.lineWidth = 1.5;

    for (let i = 0; i < landmarks.length; i++) {
        const x = landmarks[i].x * canvasIA.width;
        const y = landmarks[i].y * canvasIA.height;
        ctxIA.beginPath();
        if (i === 8) {
            ctxIA.arc(x, y, 7, 0, 2 * Math.PI);
            ctxIA.fillStyle = '#ef4444';
            ctxIA.fill();
            ctxIA.fillStyle = '#3b82f6';
        } else {
            ctxIA.arc(x, y, 3, 0, 2 * Math.PI);
            ctxIA.fill();
        }
    }
}

btnCamara.addEventListener('click', async () => {
    if (!camaraIniciada) {
        btnCamara.textContent = "⚡ Detener Demo";
        btnCamara.style.backgroundColor = "#ef4444";
        loadingIA.style.display = 'flex';
        juegoActivo = true;
        tiempoRestante = 30;
        puntuacion = 0;
        generarNuevoObjetivo();
        
        intervaloReloj = setInterval(() => {
            if (juegoActivo && tiempoRestante > 0) tiempoRestante--;
            if (tiempoRestante <= 0) {
                juegoActivo = false;
                objetivo.activo = false;
                clearInterval(intervaloReloj);
            }
        }, 1000);

        activeCamera = new Camera(videoElement, {
            onFrame: async () => { await hands.send({ image: videoElement }); },
            width: 480, height: 360
        });
        activeCamera.start().then(() => { camaraIniciada = true; });
    } else {
        btnCamara.textContent = "⚡ Activar Visión Artificial";
        btnCamara.style.backgroundColor = "var(--color-acento)";
        loadingIA.style.display = 'none';
        clearInterval(intervaloReloj);
        juegoActivo = false;
        objetivo.activo = false;
        if (activeCamera) await activeCamera.stop();
        ctxIA.clearRect(0, 0, canvasIA.width, canvasIA.height);
        camaraIniciada = false;
    }
});
/********************************************************************
 * DASHBOARD DINÁMICO (PROYECTO 3)
 ********************************************************************/
const ctxData = document.getElementById('canvas-data').getContext('2d');
const chartData = new Chart(ctxData, {
    type: 'line',
    data: {
        labels: Array(10).fill(''),
        datasets: [{
            label: 'Eficiencia (%)',
            data: Array(10).fill(80),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4
        }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
});

function actualizarDashboard() {
    // Generar data aleatoria (entre 75 y 98%)
    const nuevaData = Array.from({length: 10}, () => Math.floor(Math.random() * (98 - 75) + 75));
    chartData.data.datasets[0].data = nuevaData;
    chartData.update();

    // Actualizar KPIs
    document.getElementById('kpi-prod').textContent = Math.floor(Math.random() * 500) + 1200;
    document.getElementById('kpi-eficiencia').textContent = nuevaData[9] + '%';
}

// Refrescar cada 2 segundos
setInterval(actualizarDashboard, 2000);