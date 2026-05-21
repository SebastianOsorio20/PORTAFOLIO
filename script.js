/**
 * PORTAFOLIO PROFESIONAL - SCRIPT PRINCIPAL
 * Este archivo gestiona la lógica de tres componentes interactivos:
 * 1. Autómata Celular (Juego de la Vida de Conway)
 * 2. Interfaz de Visión Computacional (MediaPipe Target Tracker)
 * 3. Dashboard Industrial (Data Science & Chart.js)
 */

/********************************************************************
 * BLOQUE 1: JUEGO DE LA VIDA DE CONWAY 
 * Gestión de autómata celular con lógica toroidal y optimización.
 ********************************************************************/
(function initGameOfLife() {
    const canvasGOL = document.getElementById('lienzo-gol');
    if (!canvasGOL) return; // Validación de seguridad

    const ctxGOL = canvasGOL.getContext('2d');
    const ANCHO = canvasGOL.width;
    const ALTO = canvasGOL.height;
    const TAMANO_CELDA = 10;
    const COLUMNAS = Math.floor(ANCHO / TAMANO_CELDA);
    const FILAS = Math.floor(ALTO / TAMANO_CELDA);
    const FPS = 15;

    let matriz = Array.from({ length: FILAS }, () => new Array(COLUMNAS).fill(0));
    let simulacionActiva = false;
    let idAnimacion = null;
    let esDibujando = false;

    // Inicialización de matriz con aleatoriedad
    function llenarAleatorio() {
        matriz = matriz.map(fila => fila.map(() => Math.random() < 0.2 ? 1 : 0));
        dibujarTablero();
    }

    // Lógica para contar vecinos en topología toroidal (borde infinito)
    function contarVecinos(f, c) {
        let cuenta = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                let vecinoF = (f + i + FILAS) % FILAS;
                let vecinoC = (c + j + COLUMNAS) % COLUMNAS;
                cuenta += matriz[vecinoF][vecinoC];
            }
        }
        return cuenta;
    }

    // Cálculo de siguiente estado (Optimización lineal)
    function actualizarMatriz() {
        let siguiente = matriz.map(fila => [...fila]);
        for (let f = 0; f < FILAS; f++) {
            for (let c = 0; c < COLUMNAS; c++) {
                let vecinos = contarVecinos(f, c);
                if (matriz[f][c] === 1) {
                    siguiente[f][c] = (vecinos < 2 || vecinos > 3) ? 0 : 1;
                } else {
                    siguiente[f][c] = (vecinos === 3) ? 1 : 0;
                }
            }
        }
        matriz = siguiente;
    }

    function dibujarTablero() {
        ctxGOL.fillStyle = '#05070a';
        ctxGOL.fillRect(0, 0, ANCHO, ALTO);
        ctxGOL.fillStyle = '#10b981';
        for (let f = 0; f < FILAS; f++) {
            for (let c = 0; c < COLUMNAS; c++) {
                if (matriz[f][c] === 1) ctxGOL.fillRect(c * TAMANO_CELDA + 1, f * TAMANO_CELDA + 1, TAMANO_CELDA - 2, TAMANO_CELDA - 2);
            }
        }
    }

    function loop() {
        if (simulacionActiva) {
            actualizarMatriz();
            dibujarTablero();
            idAnimacion = setTimeout(() => requestAnimationFrame(loop), 1000 / FPS);
        }
    }

    // Eventos del DOM para Conway
    document.getElementById('btnPlayPause').addEventListener('click', (e) => {
        simulacionActiva = !simulacionActiva;
        e.target.textContent = simulacionActiva ? "⏸ Pausar" : "▶ Iniciar";
        if (simulacionActiva) loop(); else clearTimeout(idAnimacion);
    });
    document.getElementById('btnRandom').addEventListener('click', llenarAleatorio);
    document.getElementById('btnClear').addEventListener('click', () => {
        matriz = Array.from({ length: FILAS }, () => new Array(COLUMNAS).fill(0));
        simulacionActiva = false;
        dibujarTablero();
    });

    canvasGOL.addEventListener('mousedown', (e) => { esDibujando = true; });
    window.addEventListener('mouseup', () => { esDibujando = false; });
    canvasGOL.addEventListener('mousemove', (e) => {
        if (!esDibujando) return;
        const rect = canvasGOL.getBoundingClientRect();
        const c = Math.floor((e.clientX - rect.left) / TAMANO_CELDA);
        const f = Math.floor((e.clientY - rect.top) / TAMANO_CELDA);
        if (matriz[f]) matriz[f][c] = 1;
        dibujarTablero();
    });

    dibujarTablero();
})();


/********************************************************************
 * BLOQUE 2: TARGET TRACKER (VISIÓN ARTIFICIAL)
 * Implementación con MediaPipe Hands para interacción Zero-Touch.
 ********************************************************************/
(function initVisionTracker() {
    const videoElement = document.getElementById('webcam');
    const canvasIA = document.getElementById('canvas-ia');
    const ctxIA = canvasIA.getContext('2d');
    const btnCamara = document.getElementById('btnCamara');
    
    let camaraIniciada = false;
    let cameraInstance = null;
    let juegoActivo = false;
    let score = 0;
    let objetivo = { x: 100, y: 100, activo: false };

    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({ maxNumHands: 1, minDetectionConfidence: 0.7 });

    hands.onResults((results) => {
        ctxIA.clearRect(0, 0, canvasIA.width, canvasIA.height);
        
        // Efecto espejo: Invertimos el lienzo
        ctxIA.save();
        ctxIA.scale(-1, 1);
        ctxIA.translate(-canvasIA.width, 0);
        ctxIA.drawImage(results.image, 0, 0, canvasIA.width, canvasIA.height);
        
        // Dibujo de Landmarks (puntos de la mano)
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const hand = results.multiHandLandmarks[0];
            const indexFinger = hand[8];
            const x = indexFinger.x * canvasIA.width;
            const y = indexFinger.y * canvasIA.height;

            // Dibujar punto de dedo
            ctxIA.fillStyle = '#ef4444';
            ctxIA.beginPath();
            ctxIA.arc(x, y, 10, 0, Math.PI * 2);
            ctxIA.fill();

            // Lógica de detección de colisión
            if (juegoActivo && Math.hypot(x - objetivo.x, y - objetivo.y) < 40) {
                score += 100;
                generarNuevoObjetivo();
            }
        }
        ctxIA.restore();

        // Dibujar interfaz sobre el lienzo (no espejado)
        if (juegoActivo) {
            ctxIA.fillStyle = '#10b981';
            ctxIA.beginPath();
            ctxIA.arc(objetivo.x, objetivo.y, 30, 0, Math.PI * 2);
            ctxIA.fill();
            ctxIA.fillStyle = 'white';
            ctxIA.fillText(`Score: ${score}`, 20, 30);
        }
    });

    function generarNuevoObjetivo() {
        objetivo.x = Math.random() * (canvasIA.width - 60) + 30;
        objetivo.y = Math.random() * (canvasIA.height - 60) + 30;
    }

    btnCamara.addEventListener('click', async () => {
        if (!camaraIniciada) {
            juegoActivo = true;
            generarNuevoObjetivo();
            cameraInstance = new Camera(videoElement, {
                onFrame: async () => { await hands.send({ image: videoElement }); },
                width: 480, height: 360
            });
            await cameraInstance.start();
            camaraIniciada = true;
            btnCamara.textContent = "Detener IA";
        } else {
            juegoActivo = false;
            await cameraInstance.stop();
            camaraIniciada = false;
            btnCamara.textContent = "Activar IA";
        }
    });
})();


/********************************************************************
 * BLOQUE 3: DASHBOARD ANALÍTICO INDUSTRIAL (DATA SCIENCE)
 ********************************************************************/
(function initIndustrialDashboard() {
    const canvasData = document.getElementById('canvas-data');
    if (!canvasData) return;

    const chart = new Chart(canvasData.getContext('2d'), {
        type: 'line',
        data: {
            labels: Array(10).fill(''),
            datasets: [{
                label: 'Eficiencia (%)',
                data: Array(10).fill(85),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    setInterval(() => {
        const data = chart.data.datasets[0].data;
        data.shift();
        data.push(Math.floor(Math.random() * (95 - 70) + 70));
        chart.update();
        document.getElementById('kpi-eficiencia').innerText = data[9] + '%';
        document.getElementById('kpi-prod').innerText = (1200 + Math.floor(Math.random() * 200)).toLocaleString();
    }, 2000);
})();