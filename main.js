"use strict";

// ============================================
// DELTACLICKER 2.4 — NUEVAS OLEADAS Y HEXAGONIAL
// ============================================

const CLAVE_GUARDADO = "deltaclicker";
let reinicioEnCurso = false;
let intervaloGuardado = null;
const TIEMPO_SUENO = 10000;
const INTERVALO_DISPARO = 700;
const MAX_ENEMIGOS = 5;
const INTERVALO_OLEADA_MS = 60000;
const DESCANSO_ENTRE_OLEADAS_MS = 180000;
const INTERVALO_GRUPO_OLEADA_MS = 10000;
const GRUPOS_POR_OLEADA = 3; // Tres bloques por oleada para limitar su duración.
const MAX_ESPECIALES = 4;
const INTERVALO_ROBO = 5000;
const INTERVALO_APARICION_MIN = 5000;
const INTERVALO_APARICION_MAX = 10000;
const MAX_ENEMIGOS_AMBIENTE = 3; // Fuera de oleada: pocos a la vez, de uno en uno.
const DANIO_CLIC = 1;
const COSTE_ESPECIAL = 15;
const COSTE_AYUDANTE_APOYO = 1500;
const COSTE_ALMA_VERDE = 100;
const COSTE_ALMA_DORADA = 2500;
const COSTE_ESCOPETA = 1000;
const COSTE_DESTELLO = 1000000000;
const CURACION_ALMA_VERDE = 2;
const COSTE_GROW_UP_APOYO = 2500;
const DURACION_DASH = 250;
const DISTANCIA_DASH = 90;
const INTERVALO_ESTELA_DASH = 90;
const VIDA_INICIAL = 100;
const VIDA_MAXIMA = 150;
const VIDA_POR_MEJORA = 10;
const COSTES_VIDA = [50, 100, 200, 350, 500];
const COSTES_DEFENSA = [100, 200, 400, 800, 1600, 3000, 5000, 8000, 12000, 20000];
// Mejora permanente del cuadro de batalla (reintegrada porque no estaba presente en el ZIP recibido).
const TAMANO_CAJA_BASE = 240;
const AUMENTO_TAMANO_CAJA = 24;
const COSTES_TAMANO_CAJA = [100, 250, 500, 1000, 2000];
const INTERVALO_DISPARO_ENEMIGO = 1800;
const INTERVALO_DISPARO_JEFE = 1100;
const VELOCIDAD_JUGADOR = 4.2;

let clicks = 0;
let tpBarra = 0;
let tpTotal = 0;
let nivel = 1;
let esencia = 0;
let tpGanadoRun = 0;
let renacimientos = 0;

let almaVerdeDesbloqueada = false;
let almaDoradaDesbloqueada = false;
let escopetaDesbloqueada = false;
let ayudanteApoyoComprado = false;
let growUpApoyoComprado = false;
let ultimaCuracionApoyo = 0;
let almaActiva = "roja";
let ultimaCuracionVerde = 0;
let bloqueoJefesHasta = 0;
let nivelVida = 0;
let nivelDefensa = 0;
let nivelTamanoCaja = 0;
let vidaJugador = VIDA_INICIAL;
let jugadorMuerto = false;
let modoExtremo = false;
let dashInicio = 0;
let dashHasta = 0;
let dashSiguienteEstela = 0;
let dashOrigen = null;
let dashDestino = null;
let ultimaDireccionMovimiento = { x: 0, y: -1 };

let bossCount = 0;
let jefesDerrotadosRun = 0;
let juegoFinalizado = false;
let hexagonialDerrotado = false;
let tpDesdeJefe = 0;
let proximaOleadaAt = 0;
let oleadaCompletadaAlMenosUnaVez = false;
let inicioOleadaAt = 0;
let siguienteGrupoOleadaAt = 0;
let gruposOleadaRestantes = 0;
let siguienteSpawnPendienteAt = 0;
let siguienteEnemigoAmbienteAt = 0;
let nivelCuadroMorado = 0;
let modoSepia = false;
let ultimoDisparoEnemigo = 0;
let alertaJefeEnCurso = false;
let intervaloAlertaJefe = null;

let teclasPulsadas = new Set();
let posicionJugador = { x: null, y: null };
let posicionRaton = { x: null, y: null };

let proyectilesJugador = [];
const historialDisparosJugador = [];
let proyectilesEnemigos = [];
let jefe = null;
let combateJefeGuardado = null;
let ataqueBordeSanador = null;
let zonasLaserActivas = [];

let siguienteIdJefe = 1;
let siguienteIdProyectil = 1;

const mejoras = {
    1: { coste: 1, multiplicador: 2, comprada: false },
    2: { coste: 2, multiplicador: 3, comprada: false },
    3: { coste: 3, multiplicador: 4, comprada: false },
    4: { coste: 5, multiplicador: 6, comprada: false },
    5: { coste: 8, multiplicador: 9, comprada: false },
    6: { coste: 13, multiplicador: 13, comprada: false },
    7: { coste: 21, multiplicador: 20, comprada: false },
    8: { coste: 34, multiplicador: 30, comprada: false },
    9: { coste: 55, multiplicador: 45, comprada: false },
    10: { coste: 89, multiplicador: 65, comprada: false },
    11: { coste: 144, multiplicador: 90, comprada: false },
    12: { coste: 233, multiplicador: 125, comprada: false },
    13: { coste: 377, multiplicador: 175, comprada: false },
    14: { coste: 610, multiplicador: 250, comprada: false },
    15: { coste: 987, multiplicador: 350, comprada: false },
    16: { coste: 1597, multiplicador: 500, comprada: false },
    17: { coste: 2584, multiplicador: 700, comprada: false },
    18: { coste: 4181, multiplicador: 1000, comprada: false },
    19: { coste: 6765, multiplicador: 1400, comprada: false },
    20: { coste: 10946, multiplicador: 2000, comprada: false }
};

const durabilidades = {
    1: { coste: 10, comprada: false },
    2: { coste: 50, comprada: false },
    3: { coste: 100, comprada: false }
};

function crearAyudante(coste) {
    return {
        coste,
        comprada: false,
        despierta: true,
        inicioDespierta: 0,
        inicioSueno: 0,
        tiempoRestante: 0,
        ultimoDisparo: 0
    };
}

const ayudantes = {
    1: crearAyudante(10),
    2: crearAyudante(75),
    3: crearAyudante(500),
    4: crearAyudante(3500),
    5: crearAyudante(25000),
    6: crearAyudante(180000),
    7: crearAyudante(1250000),
    // Desde el ayudante 8, los precios suben de forma gradual (+100.000 clicks).
    8: crearAyudante(1350000),
    9: crearAyudante(1450000),
    10: crearAyudante(1550000),
    11: crearAyudante(1650000),
    12: crearAyudante(1750000),
    13: crearAyudante(1850000),
    14: crearAyudante(1950000)
};

const PRECIOS_ESENCIA = [5, 10, 20, 35, 55];

const mejorasEsencia = {
    click: { nivel: 0, precios: [...PRECIOS_ESENCIA] },
    velocidad: { nivel: 0, precios: [...PRECIOS_ESENCIA] },
    ayudantes: { nivel: 0, precios: [10, 20, 35, 55, 85] },
    especial: { nivel: 0, precios: [10, 20, 35, 55, 85] },
    sobrecarga: { nivel: 0, precios: [125] },
    cosecha: { nivel: 0, precios: [50, 100, 175, 275, 400] },
    nucleo: { nivel: 0, precios: [75, 150, 250, 400, 600] },
    sinergia: { nivel: 0, precios: [100, 200, 350, 550, 800] },
    segunda: { nivel: 0, precios: [250] },
    danio: { nivel: 0, precios: [100, 200, 350, 550, 800, 1200, 1800, 2600, 4000, 6000] }
};

let sobrecargaInicio = 0;
let segundaOportunidadUsadaOleada = false;

const mejoraTPAyudantes = {
    nivel: 0,
    precios: [5, 10, 20, 35, 55]
};

const PRECIOS_ESPECIAL = [15, 30, 60, 105, 165];

const ayudanteEspecial = {
    cantidad: 0,
    intervaloBase: INTERVALO_DISPARO / 2,
    nivelVelocidad: 0,
    nivelTP: 0,
    ultimoDisparo: []
};

// Dificultad de combate: solo sube al derrotar jefes y se reinicia
// al morir o renacer. El crecimiento es progresivo y no depende del tiempo.
function multiplicadorDificultad() {
    return 1 + jefesDerrotadosRun * 0.18 +
        jefesDerrotadosRun * jefesDerrotadosRun * 0.006;
}

function vidaEscalada(vidaBase) {
    return Math.max(1, Math.ceil(vidaBase * multiplicadorDificultad()));
}

function intervaloDisparoEnemigoActual() {
    return Math.max(250, INTERVALO_DISPARO_ENEMIGO /
        (1 + jefesDerrotadosRun * 0.09));
}

function intervaloDisparoJefeActual() {
    return Math.max(250, INTERVALO_DISPARO_JEFE /
        (1 + jefesDerrotadosRun * 0.10));
}

const TIPOS_ENEMIGOS = {
    errante: {
        nombre: "ALMA ERRANTE",
        clase: "alma-errante",
        vida: 16,
        recompensa: 5,
        roboInicial: 1,
        roboTP: 1
    },
    corrupta: {
        nombre: "ALMA CORRUPTA",
        clase: "alma-corrupta",
        vida: 32,
        recompensa: 15,
        roboInicial: 2,
        roboTP: 3
    },
    abismal: {
        nombre: "ALMA ABISMAL",
        clase: "alma-abismal",
        vida: 60,
        recompensa: 35,
        roboInicial: 5,
        roboTP: 5
    },
    sanadora: {
        nombre: "ALMA SANADORA",
        clase: "alma-sanadora",
        vida: 42,
        recompensa: 45,
        roboInicial: 0,
        roboTP: 0
    }
};

const COLORES_ENEMIGOS = [
    "#00FFD5", // cian neón
    "#B000FF", // violeta eléctrico
    "#FFD500", // amarillo eléctrico
    "#FF1493", // rosa neón
    "#39FF14", // verde neón
    "#00A8FF", // azul eléctrico
    "#FF5A00", // naranja intenso
    "#F4F7FF"  // blanco frío
];

let enemigos = [];
let siguienteIdEnemigo = 1;
let temporizadorAviso = null;
let numeroOleada = 0;
// Contador acumulado y permanente: no se reinicia al morir ni al cerrar el navegador.
let oleadasCompletadasTotal = 0;
let enemigosPendientesOleada = 0;
let oleadaActiva = false;
let avisoOleadas = null;
let textoAvisoOleadas = null;
let botonIniciarOleada = null;

// Elementos de la página
const contador =
    document.getElementById("clicks") ||
    document.getElementById("contador");

const boton = document.getElementById("boton-click");
const alma = document.querySelector(".alma");
// Separar el alma del botón para poder moverla independientemente.
if (boton && alma) {
    const zonaJuego = boton.closest(".juego") || document.body;

    zonaJuego.appendChild(alma);

    Object.assign(alma.style, {
        position: "absolute",
        zIndex: "10",
        margin: "0",
        // none: los clics atraviesan al botón / escenario
        pointerEvents: "none"
    });
}
const botonReset = document.getElementById("boton-reset");

function crearModoDesarrollador() {
    if (document.getElementById("boton-modo-desarrollador")) return;
    const botonDev = crearElemento("button", "", "T");
    botonDev.id = "boton-modo-desarrollador";
    botonDev.type = "button";
    botonDev.title = "Modo desarrollador";
    botonDev.setAttribute("aria-label", "Abrir modo desarrollador");

    const panel = crearElemento("form", "");
    panel.id = "panel-modo-desarrollador";
    panel.hidden = true;
    panel.setAttribute("autocomplete", "off");
    const entrada = crearElemento("input", "");
    entrada.id = "entrada-codigo-desarrollador";
    entrada.type = "text";
    entrada.autocomplete = "off";
    entrada.spellcheck = false;
    entrada.setAttribute("aria-label", "Código de desarrollador o recompensa");
    const ejecutar = crearElemento("button", "", "EJECUTAR");
    ejecutar.type = "submit";
    panel.append(entrada, ejecutar);

    botonDev.addEventListener("click", () => {
        panel.hidden = !panel.hidden;
        if (!panel.hidden) entrada.focus();
    });
    panel.addEventListener("submit", event => {
        event.preventDefault();
        const codigo = entrada.value;
        ejecutarCodigoDesarrollador(codigo);
        entrada.value = "";
        entrada.focus();
    });
    document.body.append(botonDev, panel);
}

function desbloquearTodasLasMejorasDebug() {
    for (const mejora of Object.values(mejoras)) mejora.comprada = true;
    for (const mejora of Object.values(durabilidades)) mejora.comprada = true;
    for (const ayudante of Object.values(ayudantes)) {
        ayudante.comprada = true;
        ayudante.despierta = true;
        ayudante.inicioDespierta = Date.now();
        ayudante.inicioSueno = 0;
        ayudante.tiempoRestante = 0;
    }
    for (const mejora of Object.values(mejorasEsencia)) mejora.nivel = mejora.precios.length;
    mejoraTPAyudantes.nivel = mejoraTPAyudantes.precios.length;
    ayudanteEspecial.cantidad = MAX_ESPECIALES;
    ayudanteEspecial.nivelVelocidad = PRECIOS_ESPECIAL.length;
    ayudanteEspecial.nivelTP = PRECIOS_ESPECIAL.length;
    ayudanteEspecial.ultimoDisparo = Array(MAX_ESPECIALES + 1).fill(Date.now());
    ayudanteApoyoComprado = true;
    almaVerdeDesbloqueada = true;
    almaDoradaDesbloqueada = true;
    escopetaDesbloqueada = true;
    nivelVida = COSTES_VIDA.length;
    nivelDefensa = COSTES_DEFENSA.length;
    nivelTamanoCaja = COSTES_TAMANO_CAJA.length;
    // Aplicar también el tamaño real del cuadro: desbloquear el nivel no basta.
    aplicarTamanoCuadroBatalla();
    nivelCuadroMorado = 1;
    vidaJugador = maxVida();
    ultimaCuracionApoyo = Date.now();
    sobrecargaInicio = Date.now();

    for (const id of Object.keys(ayudantes)) {
        if (!document.getElementById(`mini-alma-${id}`)) crearSpriteAyudante(Number(id));
    }
    for (let id = 1; id <= MAX_ESPECIALES; id++) crearSpriteEspecial(id);
    crearSpriteAyudanteApoyo();
    colocarTodosLosAyudantes();
    programarSiguienteEnemigo();
    actualizarInterfaz();
    guardarProgreso();
}

function invocarHexagonialDebug() {
    if (jugadorMuerto || juegoFinalizado) {
        mostrarAvisoRobo("NO SE PUEDE INVOCAR A HEXAGONIAL AHORA.");
        return false;
    }
    if (jefe) {
        mostrarAvisoRobo("YA HAY UN JEFE EN COMBATE.");
        return false;
    }

    // Limpia oleada/enemigos para poder forzar el combate de prueba.
    if (oleadaActiva || enemigos.length > 0) {
        oleadaActiva = false;
        enemigosPendientesOleada = 0;
        limpiarCombate();
    }

    // Asegura Alma Dorada para poder pelear en el combate de jefes.
    if (!almaDoradaDesbloqueada) {
        almaDoradaDesbloqueada = true;
        programarSiguienteEnemigo();
    }

    cancelarAlertaJefe();
    crearJefe(true);
    return jefe?.tipo === "hexagonial";
}

function ejecutarCodigoDesarrollador(codigo) {
    const clave = String(codigo || "").trim().toUpperCase().replace(/\s+/g, " ");
    const codigos = {
        "1M CLICKS": () => { clicks += 1_000_000; },
        "1M TP": () => { tpTotal += 1_000_000; },
        "1M ESENCIA": () => { esencia += 1_000_000; },
        "TODAS LAS MEJORAS": desbloquearTodasLasMejorasDebug,
        "INVOCAR HEXAGONIAL": invocarHexagonialDebug,
        "HEXAGONIAL": invocarHexagonialDebug,
        "SPAWN HEXAGONIAL": invocarHexagonialDebug
    };
    const accion = codigos[clave];
    if (!accion) {
        mostrarAvisoRobo("CÓDIGO NO VÁLIDO O TODAVÍA NO IMPLEMENTADO.");
        return;
    }
    const resultado = accion();
    const esInvocarHex =
        clave === "INVOCAR HEXAGONIAL" ||
        clave === "HEXAGONIAL" ||
        clave === "SPAWN HEXAGONIAL";
    if (esInvocarHex && resultado === false) return;
    actualizarInterfaz();
    guardarProgreso();
    const mensajes = {
        "1M CLICKS": "+1.000.000 CLICKS AÑADIDOS.",
        "1M TP": "+1.000.000 TP AÑADIDOS.",
        "1M ESENCIA": "+1.000.000 ESENCIAS AÑADIDAS.",
        "TODAS LAS MEJORAS": "¡TODAS LAS MEJORAS Y DESBLOQUEOS ACTIVADOS!",
        "INVOCAR HEXAGONIAL": "¡HEXAGONIAL HA SIDO INVOCADO!",
        "HEXAGONIAL": "¡HEXAGONIAL HA SIDO INVOCADO!",
        "SPAWN HEXAGONIAL": "¡HEXAGONIAL HA SIDO INVOCADO!"
    };
    mostrarAvisoRobo(mensajes[clave]);
}

const textoTP = document.getElementById("texto-tp");
const rellenoTP = document.getElementById("relleno-tp");

const textoTPTotal =
    document.getElementById("tp-total") ||
    document.getElementById("contador-tp");

const textoNivel = document.getElementById("nivel");
const botonMejoras = document.getElementById("boton-mejoras");
const listaMejoras = document.getElementById("lista-mejoras");
const botonAyudantes = document.getElementById("boton-ayudantes");
const listaAyudantes = document.getElementById("lista-ayudantes");
const zonaAyudantes = document.getElementById("zona-ayudantes");
const zonaEnemigos = document.getElementById("zona-enemigos");

function numeroSeguro(valor, minimo = 0) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? Math.max(minimo, numero) : minimo;
}

function formatear(numero) {
    return Math.floor(numero).toLocaleString("es-ES");
}

function crearElemento(etiqueta, clase, texto) {
    const elemento = document.createElement(etiqueta);

    if (clase) elemento.className = clase;
    if (texto !== undefined) elemento.textContent = texto;

    return elemento;
}

function requisitoCumplido(coleccion, id) {
    return id === 1 || coleccion[id - 1]?.comprada === true;
}

// La cadena de ayudantes exige tener comprados TODOS los anteriores,
// no solo el inmediatamente anterior. Así no se pueden saltar niveles.
function requisitoAyudanteCumplido(id) {
    const numero = Number(id);
    if (!Number.isInteger(numero) || numero < 1 || !ayudantes[numero]) {
        return false;
    }

    for (let anterior = 1; anterior < numero; anterior++) {
        if (ayudantes[anterior]?.comprada !== true) return false;
    }

    return true;
}

function obtenerSiguienteAyudanteNormal() {
    const ids = Object.keys(ayudantes).map(Number).sort((a, b) => a - b);
    return ids.find(id => !ayudantes[id].comprada && requisitoAyudanteCumplido(id)) ?? null;
}

function obtenerCantidadEspecial() {
    return Math.min(
        MAX_ESPECIALES,
        Math.max(0, numeroSeguro(ayudanteEspecial.cantidad))
    );
}

function maxVida() {
    const nivelVidaActivo = nivelVida;
    return Math.min(
        VIDA_MAXIMA,
        VIDA_INICIAL + nivelVidaActivo * VIDA_POR_MEJORA
    );
}

function obtenerDefensa() {
    // 10 niveles, máximo 62.5% de reducción.
    // Así un disparo normal de 8 de daño queda en exactamente 3 al máximo.
    return Math.min(0.625, nivelDefensa * 0.0625);
}

function obtenerDanioAlmaDorada() {
    // Crecimiento más suave: cada 2 niveles de mejora ≈ +1 de daño.
    // Nivel 0 → 1 | nivel 10 → 6 (antes llegaba a 11 y one-shooteaba todo).
    return 1 + Math.floor(mejorasEsencia.danio.nivel * 0.5);
}

// Registra los disparos reales del jugador para adaptar la vida de Hexagonial
// al daño y a la frecuencia de fuego que está utilizando.
function registrarDisparoJugador(danio) {
    const ahora = Date.now();
    historialDisparosJugador.push({ ahora, danio: Math.max(1, numeroSeguro(danio, 1)) });
    while (historialDisparosJugador.length > 120) historialDisparosJugador.shift();
    while (historialDisparosJugador.length && ahora - historialDisparosJugador[0].ahora > 15000) {
        historialDisparosJugador.shift();
    }
}

function calcularVidaDinamicaHexagonial() {
    const ahora = Date.now();
    const recientes = historialDisparosJugador.filter(d => ahora - d.ahora <= 10000);
    const danioMedio = recientes.length
        ? recientes.reduce((total, d) => total + d.danio, 0) / recientes.length
        : obtenerDanioAlmaDorada();
    // Si aún no hay suficientes muestras, usa una frecuencia inicial prudente.
    const frecuencia = recientes.length >= 2
        ? Math.max(0.5, Math.min(20, (recientes.length - 1) / ((recientes[recientes.length - 1].ahora - recientes[0].ahora) / 1000 || 1)))
        : 2.5;
    // 40 segundos como punto medio del objetivo solicitado (35–45 s).
    return Math.max(1, Math.ceil(danioMedio * frecuencia * 40));
}

function obtenerMultiplicador() {
    let multiplicador = 1;

    for (const mejora of Object.values(mejoras)) {
        if (mejora.comprada) {
            multiplicador = Math.max(
                multiplicador,
                mejora.multiplicador
            );
        }
    }

    return multiplicador * (1 + 0.5 * mejorasEsencia.click.nivel);
}

function obtenerVelocidadNormal() {
    return INTERVALO_DISPARO /
        (1 + 0.5 * mejorasEsencia.velocidad.nivel);
}

function obtenerIntervaloEspecial() {
    return ayudanteEspecial.intervaloBase /
        (1 + 0.5 * ayudanteEspecial.nivelVelocidad);
}

function obtenerTPEspecial() {
    return 1.5 * (1 + 0.5 * ayudanteEspecial.nivelTP);
}

function estaSobrecargaActiva() {
    if (mejorasEsencia.sobrecarga.nivel <= 0 || !sobrecargaInicio) return false;
    return (Math.max(0, Date.now() - sobrecargaInicio) % 15000) < 5000;
}

function multiplicadorSobrecarga() {
    return estaSobrecargaActiva() ? 1.5 : 1;
}

function multiplicadorNucleoTP() {
    return 1 + 0.10 * mejorasEsencia.nucleo.nivel;
}

function obtenerEstadoSobrecarga() {
    if (mejorasEsencia.sobrecarga.nivel <= 0 || !sobrecargaInicio) return "SIN DESBLOQUEAR";
    const transcurrido = Math.max(0, Date.now() - sobrecargaInicio) % 15000;
    if (transcurrido < 5000) return `ACTIVA · ${Math.ceil((5000 - transcurrido) / 1000)}s`;
    return `RECARGA · ${Math.ceil((15000 - transcurrido) / 1000)}s`;
}

function obtenerTPPorDisparoNormal() {
    return 1 + 0.5 * mejoraTPAyudantes.nivel;
}

function obtenerTiempoDespierto() {
    if (durabilidades[3].comprada) return Infinity;
    if (durabilidades[2].comprada) return 20000;
    if (durabilidades[1].comprada) return 15000;

    return TIEMPO_SUENO;
}

function mostrarAvisoRobo(mensaje) {
    let aviso = document.getElementById("aviso-robo");

    if (!aviso) {
        aviso = crearElemento("div", "aviso-robo");
        aviso.id = "aviso-robo";
        aviso.setAttribute("role", "status");
        document.body.appendChild(aviso);
    }

    aviso.textContent = mensaje;
    aviso.hidden = false;

    if (temporizadorAviso !== null) {
        clearTimeout(temporizadorAviso);
    }

    temporizadorAviso = setTimeout(() => {
        aviso.hidden = true;
        temporizadorAviso = null;
    }, 1800);
}

function cerrarOtrosMenus(menuActivo) {
    const menus = [
        { panel: document.getElementById("lista-mejoras"), boton: document.getElementById("boton-mejoras"), nombre: "MEJORAS" },
        { panel: document.getElementById("lista-ayudantes"), boton: document.getElementById("boton-ayudantes"), nombre: "AYUDANTES" },
        { panel: document.getElementById("panel-progresion"), boton: document.getElementById("boton-progresion"), nombre: "RENACER" },
        { panel: document.getElementById("panel-almas"), boton: document.getElementById("boton-almas"), nombre: "ALMAS" }
    ];

    for (const menu of menus) {
        if (!menu.panel || menu.panel === menuActivo) continue;
        menu.panel.hidden = true;
        if (menu.boton) {
            menu.boton.setAttribute("aria-expanded", "false");
            menu.boton.textContent = menu.nombre + " ▼";
        }
    }
}

function configurarMenu(botonMenu, lista, nombre) {
    if (!botonMenu || !lista) return;

    lista.hidden = true;
    botonMenu.setAttribute("aria-expanded", "false");

    botonMenu.addEventListener("click", () => {
        const abrir = lista.hidden;
        if (abrir) cerrarOtrosMenus(lista);
        lista.hidden = !abrir;
        botonMenu.setAttribute("aria-expanded", String(abrir));
        botonMenu.textContent = nombre + (abrir ? " ▲" : " ▼");
    });
}

function colocarBotonesJuntos() {
    const menuAyudantes = document.getElementById("menu-ayudantes");
    const botonProgresion = document.getElementById("boton-progresion");
    const botonAlmas = document.getElementById("boton-almas");

    if (!menuAyudantes || !botonAyudantes || !botonProgresion || !botonAlmas) return;

    let grupo = document.getElementById("grupo-botones-navegacion");

    if (!grupo) {
        grupo = crearElemento("div", "");
        grupo.id = "grupo-botones-navegacion";

        Object.assign(grupo.style, {
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "8px",
            maxWidth: "100%",
            boxSizing: "border-box"
        });

        // El grupo debe vivir en BODY, no dentro de #menu-ayudantes.
        // Así el panel de ayudantes conserva su botón como referencia de posición.
        document.body.appendChild(grupo);
    } else if (grupo.parentElement !== document.body) {
        document.body.appendChild(grupo);
    }

    // Se mueve el contenedor completo: botón y panel permanecen juntos.
    // Esto evita que #lista-ayudantes quede anclada a un contenedor vacío
    // y termine superpuesta con el botón.
    grupo.append(menuAyudantes, botonProgresion, botonAlmas);
}

// Panel de progresión, esencias y combate
function crearPanelesNuevos() {
    let panel = document.getElementById("panel-progresion");

    if (!panel) {
        panel = crearElemento("section", "panel-progresion");
        panel.id = "panel-progresion";

        panel.appendChild(
            crearElemento("h2", "", "RENACER Y ESENCIAS")
        );

        const e = crearElemento("p", "", "Esencias: 0");
        e.id = "contador-esencia";
        panel.appendChild(e);

        const info = crearElemento("p", "", "");
        info.id = "info-renacer";
        panel.appendChild(info);

        const renacerBtn = crearElemento("button", "", "RENACER");
        renacerBtn.id = "boton-renacer";
        renacerBtn.type = "button";
        panel.appendChild(renacerBtn);

        panel.appendChild(
            crearElemento("h3", "", "MEJORAS PERMANENTES")
        );

        const lista = crearElemento("div", "lista-esencia");
        lista.id = "lista-esencia";
        panel.appendChild(lista);

        const encabezadoEspeciales = crearElemento("h3", "", "AYUDANTES ESPECIALES");
        panel.appendChild(encabezadoEspeciales);

        const especiales = crearElemento("div", "lista-especial");
        especiales.id = "lista-especial";
        panel.appendChild(especiales);

        document.body.appendChild(panel);
    }

    panel.hidden = true;

    let botonPanel = document.getElementById("boton-progresion");

    if (!botonPanel) {
        botonPanel = crearElemento("button", "", "RENACER ▼");
        botonPanel.id = "boton-progresion";
        botonPanel.type = "button";
        botonPanel.setAttribute("aria-expanded", "false");
        botonPanel.setAttribute("aria-controls", "panel-progresion");

        botonPanel.addEventListener("click", () => {
            const abrir = panel.hidden;
            if (abrir) cerrarOtrosMenus(panel);
            panel.hidden = !abrir;
            botonPanel.setAttribute("aria-expanded", String(abrir));
            botonPanel.textContent = abrir ? "RENACER ▲" : "RENACER ▼";
        });

        document.body.appendChild(botonPanel);
    }

    const listaEsencia = document.getElementById("lista-esencia");

    if (listaEsencia && !listaEsencia.dataset.creada) {
        listaEsencia.dataset.creada = "true";

        listaEsencia.append(
            crearBotonMejoraEsencia(
                "click",
                "Poder de clic",
                "+50% por nivel"
            ),
            crearBotonMejoraEsencia(
                "velocidad",
                "Velocidad normal",
                "+50% por nivel"
            ),
            crearBotonMejoraEsencia(
                "ayudantes",
                "Recompensa de ayudantes",
                "+25% clics generados por ayudantes normales por nivel"
            ),
            crearBotonMejoraEsencia(
                "especial",
                "TP de ayudantes especiales",
                "+25% TP generado por ayudantes especiales por nivel"
            ),
            crearBotonMejoraEsencia("sobrecarga", "Sobrecarga", "×1,5 ganancias · 5s activa / 10s recarga · alma roja"),
            crearBotonMejoraEsencia("cosecha", "Cosecha de esencias", "Los enemigos sueltan esencias · +25% por nivel"),
            crearBotonMejoraEsencia("nucleo", "Núcleo de TP", "+10% TP por nivel"),
            crearBotonMejoraEsencia("sinergia", "Sinergia", "+15% recompensa de ayudantes normales por nivel"),
            crearBotonMejoraEsencia("segunda", "Segunda oportunidad", "Recupera 35% de vida una vez por oleada"),
            crearBotonMejoraEsencia("danio", "Potencia del Alma Dorada", "+1 daño cada 2 niveles")
        );
    }

    const listaEspecial = document.getElementById("lista-especial");

    if (listaEspecial && !listaEspecial.dataset.creada) {
        listaEspecial.dataset.creada = "true";

        const apoyo = crearElemento(
            "button",
            "",
            `Ayudante de apoyo · ${formatear(COSTE_AYUDANTE_APOYO)} TP`
        );
        apoyo.id = "comprar-ayudante-apoyo";
        apoyo.type = "button";
        apoyo.addEventListener("click", comprarAyudanteApoyo);
        listaEspecial.appendChild(apoyo);

        const growUp = crearElemento("button", "", `GROW UP del ayudante curativo · ${formatear(COSTE_GROW_UP_APOYO)} TP`);
        growUp.id = "mejora-grow-up-apoyo";
        growUp.type = "button";
        growUp.addEventListener("click", comprarGrowUpApoyo);
        listaEspecial.appendChild(growUp);

        const comprar = crearElemento(
            "button",
            "",
            "Comprar ayudante especial · 15 Esencias"
        );

        comprar.id = "comprar-especial";
        comprar.type = "button";
        comprar.addEventListener("click", comprarAyudanteEspecial);
        listaEspecial.appendChild(comprar);

        const velocidad = crearElemento(
            "button",
            "",
            "Velocidad especial · 15 Esencias"
        );

        velocidad.id = "mejora-especial-velocidad";
        velocidad.type = "button";
        velocidad.addEventListener(
            "click",
            () => comprarMejoraEspecial("velocidad")
        );

        listaEspecial.appendChild(velocidad);

        const tp = crearElemento(
            "button",
            "",
            "TP especial · 15 Esencias"
        );

        tp.id = "mejora-especial-tp";
        tp.type = "button";
        tp.addEventListener("click", () => comprarMejoraEspecial("tp"));
        listaEspecial.appendChild(tp);
    }

    // Menú independiente para comprar almas y sus mejoras.
    let panelAlmas = document.getElementById("panel-almas");
    if (!panelAlmas) {
        panelAlmas = crearElemento("section", "panel-almas");
        panelAlmas.id = "panel-almas";
        panelAlmas.hidden = true;

        panelAlmas.appendChild(crearElemento("h2", "", "MENÚ DE ALMAS"));
        panelAlmas.appendChild(crearElemento("p", "", "Compra almas y mejora tus capacidades de combate."));
        panelAlmas.appendChild(crearElemento("h3", "", "COMPRAR ALMAS"));
        const compras = crearElemento("div", "lista-mejoras-alma");
        compras.id = "compras-almas";
        panelAlmas.appendChild(compras);

        const verde = crearElemento("button", "", `Desbloquear Alma Verde · ${formatear(COSTE_ALMA_VERDE)} TP`);
        verde.id = "comprar-alma-verde";
        verde.type = "button";
        verde.addEventListener("click", comprarAlmaVerde);
        compras.appendChild(verde);

        const dorada = crearElemento("button", "", `Desbloquear Alma Dorada · ${formatear(COSTE_ALMA_DORADA)} Esencias`);
        dorada.id = "comprar-alma-dorada";
        dorada.type = "button";
        dorada.addEventListener("click", comprarAlmaDorada);
        compras.appendChild(dorada);

        const escopeta = crearElemento("button", "", `Disparo de escopeta (5 balas) · ${formatear(COSTE_ESCOPETA)} TP`);
        escopeta.id = "comprar-escopeta";
        escopeta.type = "button";
        escopeta.addEventListener("click", comprarEscopeta);
        compras.appendChild(escopeta);

        panelAlmas.appendChild(crearElemento("h3", "", "MEJORAS DE ALMA Y COMBATE"));
        const combate = crearElemento("div", "lista-mejoras-alma");
        combate.id = "mejoras-alma";
        panelAlmas.appendChild(combate);

        const vida = crearElemento("button", "", "Mejorar vida");
        vida.id = "mejora-vida";
        vida.type = "button";
        vida.addEventListener("click", comprarMejoraVida);
        combate.appendChild(vida);

        const defensa = crearElemento("button", "", "Mejorar defensa");
        defensa.id = "mejora-defensa";
        defensa.type = "button";
        defensa.addEventListener("click", comprarMejoraDefensa);
        combate.appendChild(defensa);

        const tamanoCaja = crearElemento("button", "", "Ampliar cuadro de batalla");
        tamanoCaja.id = "mejora-tamano-caja";
        tamanoCaja.type = "button";
        tamanoCaja.addEventListener("click", comprarMejoraTamanoCaja);
        combate.appendChild(tamanoCaja);


        const morado = crearElemento("button", "", "Desbloquear cuadro morado · 500 Esencias");
        morado.id = "mejora-cuadro-morado";
        morado.type = "button";
        morado.addEventListener("click", comprarCuadroMorado);
        combate.appendChild(morado);

        const sepia = crearElemento("button", "", "ACTIVAR MODO SEPIA");
        sepia.id = "boton-modo-sepia";
        sepia.type = "button";
        sepia.addEventListener("click", alternarModoSepia);
        if (botonReset && botonReset.parentNode) {
            botonReset.insertAdjacentElement("afterend", sepia);
        } else {
            document.body.appendChild(sepia);
        }

        const destello = crearElemento("button", "mejora-final", `EL DESTELLO · ${formatear(COSTE_DESTELLO)} clicks`);
        destello.id = "comprar-el-destello";
        destello.type = "button";
        destello.addEventListener("click", comprarElDestello);
        combate.appendChild(destello);

        document.body.appendChild(panelAlmas);
    }

    let botonAlmas = document.getElementById("boton-almas");
    if (!botonAlmas) {
        botonAlmas = crearElemento("button", "", "ALMAS ▼");
        botonAlmas.id = "boton-almas";
        botonAlmas.type = "button";
        botonAlmas.setAttribute("aria-expanded", "false");
        botonAlmas.setAttribute("aria-controls", "panel-almas");
        botonAlmas.addEventListener("click", () => {
            const abrir = panelAlmas.hidden;
            if (abrir) cerrarOtrosMenus(panelAlmas);
            panelAlmas.hidden = !abrir;
            botonAlmas.setAttribute("aria-expanded", String(abrir));
            botonAlmas.textContent = abrir ? "ALMAS ▲" : "ALMAS ▼";
        });
        document.body.appendChild(botonAlmas);
    }

    const renacerBtn = document.getElementById("boton-renacer");

    if (renacerBtn && !renacerBtn.dataset.eventoCreado) {
        renacerBtn.dataset.eventoCreado = "true";
        renacerBtn.addEventListener("click", renacer);
    }

    colocarBotonesJuntos();
}

function crearBotonMejoraEsencia(tipo, nombre, efecto) {
    const b = crearElemento(
        "button",
        "comprar-mejora-esencia",
        `${nombre}: ${efecto}`
    );

    b.type = "button";
    b.id = `mejora-esencia-${tipo}`;
    b.dataset.mejorEsencia = tipo;
    b.title = efecto;
    b.addEventListener("click", () => comprarMejoraEsencia(tipo));

    return b;
}

// Guardado y carga
function cargarProgreso() {
    try {
        const texto = localStorage.getItem(CLAVE_GUARDADO);
        if (!texto) return;

        const d = JSON.parse(texto);

        clicks = numeroSeguro(d.clicks);
        tpBarra = Math.min(99.999, numeroSeguro(d.tpBarra));
        tpTotal = numeroSeguro(d.tpTotal);
        nivel = Math.max(1, numeroSeguro(d.nivel, 1));
        tpGanadoRun = numeroSeguro(d.tpGanadoRun);
        esencia = numeroSeguro(d.esencia);
        renacimientos = numeroSeguro(d.renacimientos);
        juegoFinalizado = d.juegoFinalizado === true;
        hexagonialDerrotado = d.hexagonialDerrotado === true;
        bossCount = Math.max(0, Math.floor(numeroSeguro(d.bossCount)));
        jefesDerrotadosRun = Math.max(0, Math.floor(numeroSeguro(d.jefesDerrotadosRun)));
        combateJefeGuardado = d.combateJefe && typeof d.combateJefe === "object"
            ? d.combateJefe
            : null;
        tpDesdeJefe = numeroSeguro(d.tpDesdeJefe);
        numeroOleada = Math.max(0, Math.floor(numeroSeguro(d.numeroOleada)));
        oleadasCompletadasTotal = Math.max(0, Math.floor(numeroSeguro(d.oleadasCompletadasTotal, numeroOleada)));
        proximaOleadaAt = Math.max(0, numeroSeguro(d.proximaOleadaAt));
        oleadaCompletadaAlMenosUnaVez = d.oleadaCompletadaAlMenosUnaVez === true;

        almaVerdeDesbloqueada = d.almaVerdeDesbloqueada === true;
        almaDoradaDesbloqueada = d.almaDoradaDesbloqueada === true;
        escopetaDesbloqueada = d.escopetaDesbloqueada === true;
        ayudanteApoyoComprado = d.ayudanteApoyoComprado === true;
        growUpApoyoComprado = ayudanteApoyoComprado && d.growUpApoyoComprado === true;
        ultimaCuracionApoyo = ayudanteApoyoComprado ? Date.now() : 0;
        modoExtremo = false; // modo extremo eliminado
        nivelCuadroMorado = d.nivelCuadroMorado === 1 ? 1 : 0;
        modoSepia = d.modoSepia === true;

        nivelVida = Math.min(5, numeroSeguro(d.nivelVida));
        nivelDefensa = Math.min(COSTES_DEFENSA.length, numeroSeguro(d.nivelDefensa));
        nivelTamanoCaja = Math.min(
            COSTES_TAMANO_CAJA.length,
            Math.floor(numeroSeguro(d.nivelTamanoCaja))
        );
        vidaJugador = Math.min(
            maxVida(),
            numeroSeguro(d.vidaJugador, maxVida())
        );

        for (const id of Object.keys(mejoras)) {
            mejoras[id].comprada = d.mejoras?.[id] === true;
        }

        for (const id of Object.keys(durabilidades)) {
            durabilidades[id].comprada =
                d.durabilidades?.[id] === true;
        }

        for (const id of Object.keys(ayudantes)) {
            const a = d.ayudantes?.[id];

            if (a) {
                ayudantes[id].comprada = a.comprada === true;
                ayudantes[id].despierta = a.despierta !== false;
            }
        }

        // Repara guardados antiguos que pudieran tener ayudantes saltados.
        // Los niveles comprados fuera de orden se devuelven a clicks para no
        // perder lo gastado: a partir del primer hueco, los siguientes vuelven a bloquearse.
        let cadenaInterrumpida = false;
        let huboReembolsoAyudantes = false;
        for (const id of Object.keys(ayudantes).map(Number).sort((a, b) => a - b)) {
            const a = ayudantes[id];
            if (!cadenaInterrumpida) {
                if (!a.comprada) cadenaInterrumpida = true;
                continue;
            }

            if (a.comprada) {
                a.comprada = false;
                a.despierta = true;
                a.inicioDespierta = 0;
                a.inicioSueno = 0;
                a.tiempoRestante = 0;
                clicks += a.coste;
                huboReembolsoAyudantes = true;
            }
        }

        if (huboReembolsoAyudantes) {
            console.warn('Se restauró la cadena de ayudantes y se reembolsaron compras fuera de orden.');
        }

        for (const tipo of Object.keys(mejorasEsencia)) {
            if (d.mejorasEsencia?.[tipo]) {
                mejorasEsencia[tipo].nivel = Math.min(
                    mejorasEsencia[tipo].precios.length,
                    numeroSeguro(d.mejorasEsencia[tipo].nivel)
                );
            }
        }

        mejoraTPAyudantes.nivel = Math.min(
            mejoraTPAyudantes.precios.length,
            numeroSeguro(d.mejoraTPAyudantes?.nivel)
        );
        sobrecargaInicio = Math.max(0, numeroSeguro(d.sobrecargaInicio));
        segundaOportunidadUsadaOleada = d.segundaOportunidadUsadaOleada === true;

        if (d.ayudanteEspecial) {
            const a = d.ayudanteEspecial;

            ayudanteEspecial.cantidad = Math.min(
                MAX_ESPECIALES,
                a.cantidad !== undefined
                    ? numeroSeguro(a.cantidad)
                    : a.comprado === true ? 1 : 0
            );

            ayudanteEspecial.intervaloBase = Math.max(
                100,
                numeroSeguro(a.intervaloBase, INTERVALO_DISPARO / 2)
            );

            ayudanteEspecial.nivelVelocidad = Math.min(
                PRECIOS_ESPECIAL.length,
                numeroSeguro(a.nivelVelocidad)
            );

            ayudanteEspecial.nivelTP = Math.min(
                PRECIOS_ESPECIAL.length,
                numeroSeguro(a.nivelTP)
            );

            if (Array.isArray(a.ultimoDisparo)) {
                ayudanteEspecial.ultimoDisparo =
                    a.ultimoDisparo.map(() => Date.now());
            }
        }

    } catch (e) {
        console.error("Error al cargar la partida:", e);
    }
}

function guardarProgreso() {
    // Evita que el autoguardado vuelva a crear el progreso justo al reiniciar.
    if (reinicioEnCurso) return;
    try {
        const d = {
            clicks,
            tpBarra,
            tpTotal,
            nivel,
            esencia,
            tpGanadoRun,
            renacimientos,
            juegoFinalizado,
            hexagonialDerrotado,
            bossCount,
            jefesDerrotadosRun,
            combateJefe: jefe && !jefe.derrotado ? {
                tipo: jefe.tipo,
                vidaActual: jefe.vidaActual,
                vidaMaxima: jefe.vidaMaxima
            } : null,
            tpDesdeJefe,
            numeroOleada,
            oleadasCompletadasTotal,
            proximaOleadaAt,
            oleadaCompletadaAlMenosUnaVez,
            sobrecargaInicio,
            segundaOportunidadUsadaOleada,
            almaVerdeDesbloqueada,
            almaDoradaDesbloqueada,
            escopetaDesbloqueada,
            ayudanteApoyoComprado,
            growUpApoyoComprado,
            modoExtremo: false,
            nivelCuadroMorado,
            modoSepia,
            nivelVida,
            nivelDefensa,
            nivelTamanoCaja,
            vidaJugador,
            mejoras: {},
            durabilidades: {},
            ayudantes: {},
            mejorasEsencia: {},
            mejoraTPAyudantes: {
                nivel: mejoraTPAyudantes.nivel
            },
            ayudanteEspecial: {
                cantidad: obtenerCantidadEspecial(),
                intervaloBase: ayudanteEspecial.intervaloBase,
                nivelVelocidad: ayudanteEspecial.nivelVelocidad,
                nivelTP: ayudanteEspecial.nivelTP,
                ultimoDisparo: ayudanteEspecial.ultimoDisparo
            }
        };

        for (const id of Object.keys(mejoras)) {
            d.mejoras[id] = mejoras[id].comprada;
        }

        for (const id of Object.keys(durabilidades)) {
            d.durabilidades[id] = durabilidades[id].comprada;
        }

        for (const id of Object.keys(ayudantes)) {
            d.ayudantes[id] = {
                comprada: ayudantes[id].comprada,
                despierta: ayudantes[id].despierta
            };
        }

        for (const tipo of Object.keys(mejorasEsencia)) {
            d.mejorasEsencia[tipo] = {
                nivel: mejorasEsencia[tipo].nivel
            };
        }

        localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(d));
    } catch (e) {
        console.error("Error al guardar la partida:", e);
    }
}

// PT y progresión
function registrarTPParaEventos(cantidad) {
    if (!Number.isFinite(cantidad) || cantidad <= 0 || !almaDoradaDesbloqueada) return;
    // El TP ganado durante oleadas, combates contra jefes o con enemigos pendientes
    // no se acumula para invocar otro jefe.
    if (!oleadaCompletadaAlMenosUnaVez || oleadaActiva || enemigos.length > 0 || jefe) return;
    if (proximaOleadaAt && Date.now() >= proximaOleadaAt) return;
    if (Date.now() >= bloqueoJefesHasta) tpDesdeJefe += cantidad;
    comprobarAparicionJefe();
}

function procesarBarraTP() {
    if (tpBarra >= 100) {
        const ganados = Math.floor(tpBarra / 100);

        tpTotal += ganados;
        tpGanadoRun += ganados;
        nivel += ganados;
        tpBarra %= 100;
        registrarTPParaEventos(ganados);
    }

    comprobarAparicionJefe();
}

function darRecompensa(cantidadBase = 1) {
    if (jugadorMuerto || juegoFinalizado) return;

    const cantidad = cantidadBase * obtenerMultiplicador() * 1 * multiplicadorSobrecarga();

    clicks += cantidad;
    tpBarra += cantidad * multiplicadorNucleoTP();

    procesarBarraTP();
    actualizarInterfaz();
    guardarProgreso();
}

function darTP(cantidad, contarParaJefe = true) {
    if (!Number.isFinite(cantidad) || cantidad <= 0 || jugadorMuerto || juegoFinalizado) {
        return;
    }

    cantidad = cantidad * 1 * multiplicadorNucleoTP() * multiplicadorSobrecarga();
    tpTotal += cantidad;
    tpGanadoRun += cantidad;
    if (contarParaJefe) registrarTPParaEventos(cantidad);
    else comprobarAparicionJefe();
    actualizarInterfaz();
    guardarProgreso();
}

function darTPEspecial(cantidad) {
    if (!Number.isFinite(cantidad) || cantidad <= 0 || jugadorMuerto) {
        return;
    }

    tpBarra += cantidad * multiplicadorNucleoTP() * multiplicadorSobrecarga();

    procesarBarraTP();
    actualizarInterfaz();
    guardarProgreso();
}

function animarCorazon() {
    if (!alma) return;

    alma.classList.remove("latir");
    void alma.offsetWidth;
    alma.classList.add("latir");
}

// Muestra una tarjeta roja «MÁXIMO» en el mismo hueco de una mejora agotada.
// Funciona tanto con tarjetas .mejora/.ayudante como con botones independientes.
function actualizarIndicadorMaximo(boton, esMaximo, mostrarBoton = true) {
    if (!boton) return;

    const tarjeta = boton.closest(".mejora, .ayudante");

    if (tarjeta) {
        let indicador = Array.from(tarjeta.children).find(
            hijo => hijo.classList.contains("indicador-maximo")
        );

        if (!indicador) {
            indicador = crearElemento("div", "indicador-maximo", "MÁXIMO");
            indicador.setAttribute("role", "status");
            tarjeta.appendChild(indicador);
        }

        for (const hijo of Array.from(tarjeta.children)) {
            if (hijo !== indicador) hijo.hidden = esMaximo;
        }

        indicador.hidden = !esMaximo;
        tarjeta.classList.toggle("estado-maximo", esMaximo);
        if (esMaximo) tarjeta.hidden = false;
        return;
    }

    const clave = boton.id || boton.dataset.mejorEsencia ||
        boton.dataset.mejorAyudante || "mejora";
    const idIndicador = `indicador-maximo-${clave}`;
    let indicador = document.getElementById(idIndicador);

    if (!indicador) {
        indicador = crearElemento("div", "indicador-maximo", "MÁXIMO");
        indicador.id = idIndicador;
        indicador.setAttribute("role", "status");
        boton.insertAdjacentElement("afterend", indicador);
    }

    boton.hidden = esMaximo || !mostrarBoton;
    indicador.hidden = !esMaximo;
}

// Las compras únicas se sustituyen por una tarjeta persistente «COMPRADO».
// El estado se deriva de la bandera guardada de cada desbloqueo, así que
// también aparece correctamente al cargar una partida ya completada.
function actualizarIndicadorComprado(boton, estaComprado) {
    if (!boton) return;

    const clave = boton.id || "compra-unica";
    const idIndicador = `indicador-comprado-${clave}`;
    let indicador = document.getElementById(idIndicador);

    if (!indicador) {
        indicador = crearElemento(
            "div",
            "indicador-maximo indicador-comprado",
            "COMPRADO"
        );
        indicador.id = idIndicador;
        indicador.setAttribute("role", "status");
        boton.insertAdjacentElement("afterend", indicador);
    }

    boton.hidden = estaComprado;
    if (estaComprado) boton.disabled = true;
    indicador.hidden = !estaComprado;
}

// Al comprar un nivel, se sustituye el botón por uno nuevo para el siguiente nivel.
function renovarBotonMejora(id, accion) {
    const actual = document.getElementById(id);
    if (!actual) return;
    const siguiente = actual.cloneNode(false);
    siguiente.className = actual.className;
    siguiente.id = id;
    siguiente.type = "button";
    siguiente.addEventListener("click", accion);
    siguiente.classList.add("mejora-encadenada-aparece");
    actual.replaceWith(siguiente);
}

// Mejoras
function comprarMejoraClick(id) {
    const m = mejoras[id];

    if (
        !m ||
        m.comprada ||
        !requisitoCumplido(mejoras, id) ||
        tpTotal < m.coste
    ) {
        return;
    }

    tpTotal -= m.coste;
    m.comprada = true;

    const boton = document.querySelector(`.comprar-mejora[data-mejora="${id}"]`);
    if (boton) {
        const siguiente = boton.cloneNode(false);
        siguiente.addEventListener("click", () => comprarMejoraClick(Number(siguiente.dataset.mejora)));
        boton.replaceWith(siguiente);
    }

    actualizarInterfaz();
    guardarProgreso();
}

function comprarMejoraEsencia(tipo) {
    const m = mejorasEsencia[tipo];

    if (!m || m.nivel >= m.precios.length) return;

    const coste = m.precios[m.nivel];
    if (esencia < coste) return;

    esencia -= coste;
    m.nivel++;
    if (tipo === "sobrecarga" && !sobrecargaInicio) sobrecargaInicio = Date.now();
    renovarBotonMejora(`mejora-esencia-${tipo}`, () => comprarMejoraEsencia(tipo));

    actualizarInterfaz();
    guardarProgreso();
}

function comprarAyudanteEspecial() {
    const cantidad = obtenerCantidadEspecial();

    if (cantidad >= MAX_ESPECIALES) {
        return mostrarAvisoRobo("¡Ya tienes los 4 ayudantes especiales!");
    }

    if (esencia < COSTE_ESPECIAL) return;

    esencia -= COSTE_ESPECIAL;

    const id = cantidad + 1;
    ayudanteEspecial.cantidad = id;
    ayudanteEspecial.ultimoDisparo[id] = Date.now();

    crearSpriteEspecial(id);
    colocarTodosLosAyudantes();
    actualizarInterfaz();
    guardarProgreso();
}

function comprarMejoraEspecial(tipo) {
    if (obtenerCantidadEspecial() < 1) return;

    const prop = tipo === "velocidad"
        ? "nivelVelocidad"
        : "nivelTP";

    const nivelActual = ayudanteEspecial[prop];

    if (nivelActual >= PRECIOS_ESPECIAL.length) return;

    const coste = PRECIOS_ESPECIAL[nivelActual];
    if (esencia < coste) return;

    esencia -= coste;
    ayudanteEspecial[prop]++;
    const idBoton = tipo === "velocidad" ? "mejora-especial-velocidad" : "mejora-especial-tp";
    renovarBotonMejora(idBoton, () => comprarMejoraEspecial(tipo));

    actualizarInterfaz();
    guardarProgreso();
}

function comprarMejoraTPAyudantes() {
    const n = mejoraTPAyudantes.nivel;

    if (n >= mejoraTPAyudantes.precios.length) return;

    const coste = mejoraTPAyudantes.precios[n];
    if (tpTotal < coste) return;

    tpTotal -= coste;
    mejoraTPAyudantes.nivel++;
    renovarBotonMejora("mejora-tp-ayudantes", comprarMejoraTPAyudantes);

    actualizarInterfaz();
    guardarProgreso();
}

function comprarAyudanteApoyo() {
    if (ayudanteApoyoComprado) return;

    if (tpTotal < COSTE_AYUDANTE_APOYO) {
        return mostrarAvisoRobo(
            `Necesitas ${formatear(COSTE_AYUDANTE_APOYO)} TP para comprar el Ayudante de apoyo.`
        );
    }

    tpTotal -= COSTE_AYUDANTE_APOYO;
    ayudanteApoyoComprado = true;
    ultimaCuracionApoyo = Date.now();
    crearSpriteAyudanteApoyo();
    colocarTodosLosAyudantes();
    mostrarAvisoRobo("¡AYUDANTE DE APOYO COMPRADO! Tu corazón verde te curará automáticamente.");
    actualizarInterfaz();
    guardarProgreso();
}

function comprarGrowUpApoyo() {
    if (!ayudanteApoyoComprado || growUpApoyoComprado) return;
    if (tpTotal < COSTE_GROW_UP_APOYO) {
        return mostrarAvisoRobo(`Necesitas ${formatear(COSTE_GROW_UP_APOYO)} TP para mejorar el Ayudante de apoyo.`);
    }
    tpTotal -= COSTE_GROW_UP_APOYO;
    growUpApoyoComprado = true;
    crearSpriteAyudanteApoyo();
    colocarSpriteAyudanteApoyo();
    mostrarAvisoRobo("¡GROW UP! El ayudante curativo ha crecido y ahora cura 4 HP/s.");
    actualizarInterfaz();
    guardarProgreso();
}

function comprarAlmaVerde() {
    if (almaVerdeDesbloqueada) return;

    if (tpTotal < COSTE_ALMA_VERDE) {
        return mostrarAvisoRobo(`Necesitas ${formatear(COSTE_ALMA_VERDE)} TP para desbloquear el Alma Verde.`);
    }

    tpTotal -= COSTE_ALMA_VERDE;
    almaVerdeDesbloqueada = true;
    mostrarAvisoRobo("¡ALMA VERDE DESBLOQUEADA PARA SIEMPRE! Pulsa E para activarla.");
    actualizarInterfaz();
    guardarProgreso();
}

function comprarAlmaDorada() {
    if (almaDoradaDesbloqueada) return;

    if (esencia < COSTE_ALMA_DORADA) {
        return mostrarAvisoRobo("Necesitas 10.000 de Esencias.");
    }

    esencia -= COSTE_ALMA_DORADA;
    almaDoradaDesbloqueada = true;

    mostrarAvisoRobo("¡ALMA DORADA DESBLOQUEADA PARA SIEMPRE!");
    programarSiguienteEnemigo();

    actualizarInterfaz();
    guardarProgreso();
}

function comprarEscopeta() {
    if (escopetaDesbloqueada) return;

    if (!almaDoradaDesbloqueada) {
        return mostrarAvisoRobo("Primero debes desbloquear el Alma Dorada.");
    }

    if (tpTotal < COSTE_ESCOPETA) {
        return mostrarAvisoRobo(`Necesitas ${formatear(COSTE_ESCOPETA)} TP para el disparo de escopeta.`);
    }

    tpTotal -= COSTE_ESCOPETA;
    escopetaDesbloqueada = true;
    mostrarAvisoRobo("¡DISPARO DE ESCOPETA DESBLOQUEADO! El Alma Dorada dispara 5 balas.");
    actualizarInterfaz();
    guardarProgreso();
}

function comprarElDestello() {
    if (juegoFinalizado) return;

    if (!hexagonialDerrotado) {
        return mostrarAvisoRobo("EL DESTELLO ESTÁ BLOQUEADO: primero debes derrotar a HEXAGONIAL.");
    }

    if (clicks < COSTE_DESTELLO) {
        return mostrarAvisoRobo(
            `Necesitas ${formatear(COSTE_DESTELLO)} clicks para comprar El Destello.`
        );
    }

    if (!confirm(
        `¿Comprar EL DESTELLO por ${formatear(COSTE_DESTELLO)} clicks?\n\n` +
        "Esta mejora termina el juego. Esta acción no se puede deshacer."
    )) return;

    clicks -= COSTE_DESTELLO;
    juegoFinalizado = true;
    guardarProgreso();
    actualizarInterfaz();
    mostrarFinalElDestello(true);
}

function mostrarFinalElDestello(animar = true) {
    juegoFinalizado = true;
    if (document.getElementById("final-destello-overlay")) return;

    let estilos = document.getElementById("estilos-final-destello");
    if (!estilos) {
        estilos = document.createElement("style");
        estilos.id = "estilos-final-destello";
        estilos.textContent = `
            @keyframes destello-haz-expandir {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.015); }
                12% { opacity: 1; }
                100% { opacity: 1; transform: translate(-50%, -50%) scale(2.2); }
            }
            @keyframes destello-blanco {
                0%, 45% { opacity: 0; }
                65%, 100% { opacity: 1; }
            }
            @keyframes texto-final-aparecer {
                0%, 68% { opacity: 0; transform: translateY(12px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            #final-destello-overlay {
                position: fixed; inset: 0; z-index: 999999;
                overflow: hidden; display: flex; align-items: center;
                justify-content: center; background: transparent; color: #111;
                pointer-events: all; isolation: isolate;
            }
            #final-destello-haz {
                position: absolute; left: var(--destello-x, 50%);
                top: var(--destello-y, 50%); width: 100vw; height: 100vh;
                border-radius: 50%;
                background: radial-gradient(ellipse at center, #fff 0%, #fff 20%, rgba(255,255,255,.98) 35%, rgba(255,255,255,.8) 52%, rgba(255,255,255,0) 72%);
                filter: brightness(1.2); opacity: 1;
                transform: translate(-50%, -50%) scale(2.2);
            }
            #final-destello-blanco { position: absolute; inset: 0; background: #fff; opacity: 1; }
            #final-destello-texto {
                position: relative; z-index: 2; max-width: 90vw; padding: 24px;
                text-align: center; font: bold clamp(16px, 3vw, 30px)/1.6 'Press Start 2P', monospace;
                color: #111; text-shadow: 0 2px 0 #fff;
            }
        `;
        document.head.appendChild(estilos);
    }

    const overlay = document.createElement("div");
    overlay.id = "final-destello-overlay";
    const haz = document.createElement("div");
    haz.id = "final-destello-haz";
    const blanco = document.createElement("div");
    blanco.id = "final-destello-blanco";
    const texto = document.createElement("div");
    texto.id = "final-destello-texto";
    texto.textContent = "Haz sellado la fuente oscura";
    const resetFinal = crearElemento("button", "reset-final-destello", "RESET");
    resetFinal.type = "button";
    resetFinal.addEventListener("click", () => botonReset?.click());
    overlay.append(haz, blanco, texto, resetFinal);
    document.body.appendChild(overlay);

    if (animar) {
        const rect = alma?.getBoundingClientRect();
        if (rect) {
            overlay.style.setProperty("--destello-x", `${rect.left + rect.width / 2}px`);
            overlay.style.setProperty("--destello-y", `${rect.top + rect.height / 2}px`);
        }
        haz.style.animation = "destello-haz-expandir 2.1s ease-out forwards";
        blanco.style.opacity = "0";
        blanco.style.animation = "destello-blanco 2.1s ease-out forwards";
        texto.style.opacity = "0";
        texto.style.animation = "texto-final-aparecer 2.1s ease-out forwards";
    } else {
        overlay.style.background = "#fff";
        blanco.style.opacity = "1";
        texto.style.opacity = "1";
        haz.style.opacity = "0";
    }
}

function comprarMejoraVida() {
    if (nivelVida >= COSTES_VIDA.length) return;

    const coste = COSTES_VIDA[nivelVida];
    if (esencia < coste) return;

    esencia -= coste;
    nivelVida++;
    vidaJugador = Math.min(maxVida(), vidaJugador + VIDA_POR_MEJORA);
    renovarBotonMejora("mejora-vida", comprarMejoraVida);

    actualizarInterfaz();
    guardarProgreso();
}

function comprarMejoraDefensa() {
    if (nivelDefensa >= COSTES_DEFENSA.length) return;

    const coste = COSTES_DEFENSA[nivelDefensa];
    if (esencia < coste) return;

    esencia -= coste;
    nivelDefensa++;
    renovarBotonMejora("mejora-defensa", comprarMejoraDefensa);

    actualizarInterfaz();
    guardarProgreso();
}

function aplicarTamanoCuadroBatalla() {
    if (!boton) return;
    const tamano = TAMANO_CAJA_BASE + nivelTamanoCaja * AUMENTO_TAMANO_CAJA;
    boton.style.setProperty("--tamano-cuadro-batalla", `${tamano}px`);
    mantenerJugadorEnZona();
    colocarVidaDebajoCaja();
    colocarTodosLosAyudantes();
}

function comprarMejoraTamanoCaja() {
    if (nivelTamanoCaja >= COSTES_TAMANO_CAJA.length) return;

    const coste = COSTES_TAMANO_CAJA[nivelTamanoCaja];
    if (esencia < coste) {
        mostrarAvisoRobo(`Necesitas ${formatear(coste)} Esencias para ampliar el cuadro.`);
        return;
    }

    esencia -= coste;
    nivelTamanoCaja++;
    aplicarTamanoCuadroBatalla();
    renovarBotonMejora("mejora-tamano-caja", comprarMejoraTamanoCaja);
    actualizarInterfaz();
    guardarProgreso();
    mostrarAvisoRobo(`¡Cuadro de batalla ampliado a ${TAMANO_CAJA_BASE + nivelTamanoCaja * AUMENTO_TAMANO_CAJA}px!`);
}

// Renacimiento voluntario

function comprarCuadroMorado() {
    if (nivelCuadroMorado > 0 || esencia < 500) return;
    esencia -= 500;
    nivelCuadroMorado = 1;
    boton?.classList.add("cuadro-morado");
    actualizarInterfaz();
    guardarProgreso();
    mostrarAvisoRobo("¡CUADRO MORADO DESBLOQUEADO! Los ayudantes duplican sus recompensas.");
}

function alternarModoSepia() {
    modoSepia = !modoSepia;
    document.body.classList.toggle("modo-sepia", modoSepia);
    actualizarInterfaz();
    guardarProgreso();
}


function renacer() {
    if (juegoFinalizado) return;
    if (tpGanadoRun < 100) {
        return mostrarAvisoRobo(
            "Necesitas acumular 100 TP antes de renacer."
        );
    }

    const ganancia = Math.floor(tpGanadoRun / 10) * 1;

    if (!confirm(
        `¿Renacer ahora?\n\nRecibirás ${ganancia} Esencias.\n` +
        "Se reiniciarán clicks, TP y mejoras normales.\n" +
        "Conservarás ayudantes, esencias y mejoras permanentes."
    )) {
        return;
    }

    esencia += ganancia;
    renacimientos++;
    clicks = 0;
    tpBarra = 0;
    tpTotal = 0;
    nivel = 1;
    tpGanadoRun = 0;
    tpDesdeJefe = 0;
    limpiarCombate();
    bossCount = 0;
    jefesDerrotadosRun = 0;
    ultimoDisparoEnemigo = 0;

    for (const m of Object.values(mejoras)) {
        m.comprada = false;
    }

    for (const a of Object.values(ayudantes)) {
        if (a.comprada) {
            a.despierta = true;
            a.inicioDespierta = Date.now();
            a.ultimoDisparo = Date.now();
        }
    }

    actualizarInterfaz();
    guardarProgreso();
    programarSiguienteEnemigo();

    mostrarAvisoRobo(`¡RENACIMIENTO! +${ganancia} Esencias`);
}

// Ayudantes
// Distribución:
// [N8] [N1]       [N4] [N9]
// [N10][N2] [CAJA][N5] [N11]
// [N12][N3]       [N6] [N13]
//                 [N7][N14]  ← últimos dos junto al borde inferior
// Los ayudantes exteriores alternan izquierda/derecha por filas.

function crearSpriteAyudante(id) {
    if (!zonaAyudantes || !ayudantes[id]) return null;

    let s = document.getElementById(`mini-alma-${id}`);
    if (s) return s;

    s = crearElemento("button", "mini-alma");
    s.type = "button";
    s.id = `mini-alma-${id}`;
    s.setAttribute("aria-label", `Mini alma ${id}`);

    const forma = crearElemento("span", "mini-alma-forma");
    forma.setAttribute("aria-hidden", "true");

    const sueno = crearElemento("span", "zzz-sueno", "Zzz");
    sueno.setAttribute("aria-hidden", "true");

    s.append(forma, sueno);

    s.style.position = "absolute";
    s.style.margin = "0";
    s.style.top = "auto";
    s.style.bottom = "auto";
    s.style.left = "auto";
    s.style.right = "auto";

    s.addEventListener("click", event => {
        event.stopPropagation();

        const a = ayudantes[id];

        if (
            !a ||
            !a.comprada ||
            a.despierta ||
            almaActiva === "dorada"
        ) {
            return;
        }

        a.despierta = true;
        a.inicioDespierta = Date.now();
        a.ultimoDisparo = Date.now();
        a.tiempoRestante = 0;

        actualizarInterfaz();
        guardarProgreso();
    });

    zonaAyudantes.appendChild(s);
    colocarSpriteAyudante(id);
    actualizarRayosEnlaceAyudantes();
    return s;
}

function crearSpriteEspecial(id) {
    if (!zonaAyudantes || id < 1 || id > obtenerCantidadEspecial()) {
        return null;
    }

    const sid = `mini-alma-especial-${id}`;
    let s = document.getElementById(sid);

    if (s) return s;

    s = crearElemento("button", "mini-alma mini-alma-especial");
    s.type = "button";
    s.id = sid;
    s.setAttribute("aria-label", `Ayudante especial ${id}`);
    s.title = `Ayudante especial ${id}`;

    const forma = crearElemento("span", "mini-alma-forma");
    forma.setAttribute("aria-hidden", "true");

    s.appendChild(forma);

    s.style.position = "absolute";
    s.style.margin = "0";
    s.style.top = "auto";
    s.style.bottom = "auto";
    s.style.left = "auto";
    s.style.right = "auto";

    zonaAyudantes.appendChild(s);
    colocarSpriteEspecial(id);

    return s;
}

function crearSpriteAyudanteApoyo() {
    if (!ayudanteApoyoComprado || !zonaAyudantes) return null;

    let s = document.getElementById("mini-alma-apoyo");
    if (s) {
        s.classList.toggle("crecido", growUpApoyoComprado);
        colocarSpriteAyudanteApoyo();
        return s;
    }

    s = crearElemento("div", `mini-alma mini-alma-apoyo${growUpApoyoComprado ? " crecido" : ""}`);
    s.id = "mini-alma-apoyo";
    s.setAttribute("role", "img");
    s.setAttribute("aria-label", "Ayudante de apoyo: cura al jugador");
    s.setAttribute("title", "Ayudante de apoyo · Curación pasiva");

    const forma = crearElemento("span", "mini-alma-forma");
    forma.setAttribute("aria-hidden", "true");
    s.appendChild(forma);

    s.style.position = "absolute";
    s.style.margin = "0";
    s.style.top = "auto";
    s.style.bottom = "auto";
    s.style.left = "auto";
    s.style.right = "auto";
    s.style.pointerEvents = "none";

    zonaAyudantes.appendChild(s);
    colocarSpriteAyudanteApoyo();
    return s;
}

function colocarSpriteAyudanteApoyo() {
    const s = document.getElementById("mini-alma-apoyo");
    if (!s || !zonaAyudantes || !boton) return;

    const zr = zonaAyudantes.getBoundingClientRect();
    const ar = boton.getBoundingClientRect();
    const sw = s.offsetWidth || 28;
    const sh = s.offsetHeight || 28;
    const altoEspecial = 42;
    const margenEspecial = 24;
    const separacion = 8;
    const boxMidX = ar.left + ar.width / 2 - zr.left;
    const boxTop = ar.top - zr.top;

    // El corazón verde ocupa una fila propia, justo encima de los especiales.
    const filaEspecialY = boxTop - margenEspecial - altoEspecial;
    const y = filaEspecialY - separacion - sh;

    s.style.left = `${Math.max(4, Math.min(boxMidX - sw / 2, zr.width - sw - 4))}px`;
    s.style.top = `${Math.max(4, y)}px`;
}

function colocarSpriteAyudante(id) {
    const s = document.getElementById(`mini-alma-${id}`);
    if (!s || !zonaAyudantes || !boton) return;

    const zr = zonaAyudantes.getBoundingClientRect();
    const ar = boton.getBoundingClientRect();

    const sw = s.offsetWidth || 36;
    const sh = s.offsetHeight || 36;
    const gap = 12;
    const margen = 32;

    const boxLeft = ar.left - zr.left;
    const boxRight = ar.right - zr.left;
    const boxMidY = ar.top - zr.top + ar.height / 2;

    // Las almas 1–6 ocupan las columnas interiores y 8–13 las exteriores,
    // alternando izquierda/derecha por filas. Las almas 7 y 14 van abajo.
    if (id >= 1 && id <= 3) {
        const slot = id - 1; // 0,1,2 de arriba a abajo
        const x = boxLeft - margen - sw;
        const columnaAlto = 3 * sh + 2 * gap;
        const y0 = boxMidY - columnaAlto / 2;
        const y = y0 + slot * (sh + gap);
        s.style.left = `${Math.max(4, x)}px`;
        s.style.top = `${Math.max(4, Math.min(y, zr.height - sh - 4))}px`;
    } else if (id >= 4 && id <= 6) {
        const slot = id - 4; // 0,1,2 de arriba a abajo
        const x = boxRight + margen;
        const columnaAlto = 3 * sh + 2 * gap;
        const y0 = boxMidY - columnaAlto / 2;
        const y = y0 + slot * (sh + gap);
        s.style.left = `${Math.min(x, zr.width - sw - 4)}px`;
        s.style.top = `${Math.max(4, Math.min(y, zr.height - sh - 4))}px`;
    } else if ([8, 10, 12].includes(id)) {
        // Columna exterior izquierda: 8 arriba, 10 al centro y 12 abajo.
        const slot = (id - 8) / 2;
        const columnaAlto = 3 * sh + 2 * gap;
        const y0 = boxMidY - columnaAlto / 2;
        const x = boxLeft - margen - (2 * sw) - (2 * gap);
        const y = y0 + slot * (sh + gap);
        s.style.left = `${Math.max(4, x)}px`;
        s.style.top = `${Math.max(4, Math.min(y, zr.height - sh - 4))}px`;
    } else if ([9, 11, 13].includes(id)) {
        // Columna exterior derecha: 9 arriba, 11 al centro y 13 abajo.
        const slot = (id - 9) / 2;
        const columnaAlto = 3 * sh + 2 * gap;
        const y0 = boxMidY - columnaAlto / 2;
        const x = boxRight + margen + sw + (2 * gap);
        const y = y0 + slot * (sh + gap);
        s.style.left = `${Math.min(x, zr.width - sw - 4)}px`;
        s.style.top = `${Math.max(4, Math.min(y, zr.height - sh - 4))}px`;
    } else if (id === 7 || id === 14) {
        // El 14 queda junto al 7, centrados en la parte inferior.
        const x = zr.width / 2 + (id === 7 ? -sw - gap / 2 : gap / 2);
        const yPantalla = window.innerHeight - sh - 12;
        const y = yPantalla - zr.top;
        s.style.left = `${Math.max(4, Math.min(x, zr.width - sw - 4))}px`;
        s.style.top = `${Math.max(4, Math.min(y, zr.height - sh - 4))}px`;
    }
}

function colocarSpriteEspecial(id) {
    const s = document.getElementById(`mini-alma-especial-${id}`);
    if (!s || !zonaAyudantes || !boton) return;

    const zr = zonaAyudantes.getBoundingClientRect();
    const ar = boton.getBoundingClientRect();

    const sw = s.offsetWidth || 42;
    const sh = s.offsetHeight || 42;
    const gap = 14;
    const margen = 24;

    const boxMidX = ar.left + ar.width / 2 - zr.left;
    const boxTop = ar.top - zr.top;

    // Especiales encima de la caja, en línea horizontal centrada
    const total = Math.max(1, obtenerCantidadEspecial());
    const filaY = boxTop - margen - sh;

    if (total === 1) {
        s.style.left = `${boxMidX - sw / 2}px`;
    } else {
        const filaAncho = total * sw + (total - 1) * gap;
        const inicioX = boxMidX - filaAncho / 2;
        s.style.left = `${inicioX + (id - 1) * (sw + gap)}px`;
    }

    s.style.top = `${Math.max(4, filaY)}px`;
}

// Enlaces estáticos: los ayudantes exteriores (8–13) se conectan
// con el ayudante interior que tienen delante. No generan proyectiles.
const PARES_RAYO_AYUDANTES = [
    [8, 1], [9, 4], [10, 2], [11, 5], [12, 3], [13, 6]
];

function actualizarRayosEnlaceAyudantes() {
    if (!zonaAyudantes) return;

    const zona = zonaAyudantes.getBoundingClientRect();
    for (const [atras, delante] of PARES_RAYO_AYUDANTES) {
        const origen = document.getElementById(`mini-alma-${atras}`);
        const destino = document.getElementById(`mini-alma-${delante}`);
        const idRayo = `rayo-enlace-ayudante-${atras}`;
        let rayo = document.getElementById(idRayo);

        if (!origen || !destino) {
            rayo?.remove();
            continue;
        }

        if (!rayo) {
            rayo = crearElemento("div", "rayo-enlace-ayudante");
            rayo.id = idRayo;
            rayo.setAttribute("aria-hidden", "true");
            zonaAyudantes.insertBefore(rayo, zonaAyudantes.firstChild);
        }

        const a = origen.getBoundingClientRect();
        const b = destino.getBoundingClientRect();
        let x1 = a.left + a.width / 2 - zona.left;
        let y1 = a.top + a.height / 2 - zona.top;
        let x2 = b.left + b.width / 2 - zona.left;
        let y2 = b.top + b.height / 2 - zona.top;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distancia = Math.hypot(dx, dy);
        if (distancia <= 1) continue;

        // El rayo termina en el borde de ambas almas, no atraviesa sus centros.
        const margen = Math.min(18, distancia / 3);
        const ux = dx / distancia;
        const uy = dy / distancia;
        x1 += ux * margen;
        y1 += uy * margen;
        x2 -= ux * margen;
        y2 -= uy * margen;

        const largo = Math.max(1, distancia - margen * 2);
        rayo.style.left = `${x1}px`;
        rayo.style.top = `${y1}px`;
        rayo.style.width = `${largo}px`;
        rayo.style.transform = `translateY(-50%) rotate(${Math.atan2(dy, dx)}rad)`;
        rayo.style.display = almaActiva === "roja" ? "block" : "none";
    }
}

function colocarTodosLosSpritesAyudantes() {
    for (let id = 1; id <= 14; id++) {
        if (ayudantes[id]?.comprada) {
            colocarSpriteAyudante(id);
        }
    }
}

function colocarTodosLosEspeciales() {
    for (let id = 1; id <= obtenerCantidadEspecial(); id++) {
        colocarSpriteEspecial(id);
    }
}

function colocarTodosLosAyudantes() {
    colocarTodosLosSpritesAyudantes();
    colocarTodosLosEspeciales();
    if (ayudanteApoyoComprado) {
        crearSpriteAyudanteApoyo();
        colocarSpriteAyudanteApoyo();
    }
    actualizarRayosEnlaceAyudantes();
}

function actualizarVisibilidadAyudantes() {
    const ocultos = almaActiva !== "roja";

    if (zonaAyudantes) {
        zonaAyudantes.classList.toggle("ayudantes-ocultos", ocultos);
    }

    document.querySelectorAll(".mini-alma").forEach(s => {
        s.style.visibility = ocultos ? "hidden" : "visible";
        s.style.pointerEvents = ocultos ? "none" : "auto";
    });
    document.querySelectorAll(".rayo-enlace-ayudante").forEach(rayo => {
        rayo.style.display = ocultos ? "none" : "block";
    });

    // El ayudante de apoyo es pasivo: sigue visible y curando aunque cambies de alma.
    const apoyo = document.getElementById("mini-alma-apoyo");
    if (apoyo) {
        apoyo.style.visibility = (!jugadorMuerto && !juegoFinalizado) ? "visible" : "hidden";
        apoyo.style.pointerEvents = "none";
    }
}

function comprarAyudanteNormal(id) {
    const a = ayudantes[id];

    if (
        !a ||
        a.comprada ||
        !requisitoAyudanteCumplido(id) ||
        obtenerSiguienteAyudanteNormal() !== Number(id) ||
        clicks < a.coste
    ) {
        return;
    }

    clicks -= a.coste;
    a.comprada = true;
    a.despierta = true;
    a.inicioDespierta = Date.now();
    a.ultimoDisparo = Date.now();
    a.tiempoRestante = 0;

    crearSpriteAyudante(id);
    actualizarInterfaz();
    guardarProgreso();
}

// Enemigos
function elegirTipoEnemigo() {
    const r = Math.random() * 100;

    return r < 80
        ? "errante"
        : r < 95
            ? "corrupta"
            : "abismal";
}

function asegurarAvisoOleadas() {
    if (avisoOleadas || !zonaEnemigos) return;
    avisoOleadas = crearElemento("div", "aviso-oleadas");
    avisoOleadas.id = "aviso-oleadas";
    avisoOleadas.setAttribute("role", "status");
    avisoOleadas.setAttribute("aria-live", "polite");

    textoAvisoOleadas = crearElemento("span", "aviso-oleadas-texto");
    avisoOleadas.appendChild(textoAvisoOleadas);

    botonIniciarOleada = crearElemento("button", "boton-iniciar-oleada", "INICIAR OLEADA AHORA · +100 TP");
    botonIniciarOleada.type = "button";
    botonIniciarOleada.hidden = true;
    botonIniciarOleada.addEventListener("click", iniciarOleadaAhora);
    avisoOleadas.appendChild(botonIniciarOleada);

    zonaEnemigos.appendChild(avisoOleadas);
}

function iniciarOleadaAhora() {
    if (
        !almaDoradaDesbloqueada || !proximaOleadaAt || oleadaActiva || jefe ||
        jugadorMuerto || juegoFinalizado || alertaJefeEnCurso
    ) return;

    // Adelantar la siguiente oleada concede una pequeña compensación de TP.
    // Los enemigos ambientales no impiden iniciar la oleada.
    tpTotal += 100;
    proximaOleadaAt = Date.now();
    actualizarEnemigos();
    actualizarInterfaz();
    guardarProgreso();
}

const OLEADAS_PARA_JEFE = 10;
const TP_PARA_JEFE = 1000;

// El aviso del jefe se realiza sobre el borde del cuadro de batalla, sin una
// capa fija a pantalla completa ni una viñeta que consuma recursos.
function cancelarAlertaJefe() {
    if (intervaloAlertaJefe !== null) {
        clearInterval(intervaloAlertaJefe);
        intervaloAlertaJefe = null;
    }
    alertaJefeEnCurso = false;
    boton?.classList.remove("alerta-jefe-rojo");
}

function iniciarAlertaJefe() {
    if (alertaJefeEnCurso) return;
    alertaJefeEnCurso = true;
    if (!boton) {
        alertaJefeEnCurso = false;
        crearJefe();
        return;
    }

    // Cinco destellos completos: rojo / color normal, repetido cinco veces.
    let cambios = 1;
    boton.classList.add("alerta-jefe-rojo");
    intervaloAlertaJefe = setInterval(() => {
        cambios++;
        boton.classList.toggle("alerta-jefe-rojo", cambios % 2 === 1);
        if (cambios >= 10) {
            clearInterval(intervaloAlertaJefe);
            intervaloAlertaJefe = null;
            boton.classList.remove("alerta-jefe-rojo");
            alertaJefeEnCurso = false;
            crearJefe();
        }
    }, 250);
}

function cantidadEnemigosOleada() {
    const minimo = 1;
    const maximo = 3;
    return minimo + Math.floor(Math.random() * (maximo - minimo + 1));
}

// Las oleadas se programan por tiempo y no dependen de los TP.
function programarSiguienteEnemigo() {
    asegurarAvisoOleadas();
    if (alertaJefeEnCurso) return;
    if (!almaDoradaDesbloqueada) {
        if (textoAvisoOleadas) textoAvisoOleadas.textContent = "DESBLOQUEA EL ALMA DORADA PARA ACTIVAR OLEADAS";
        if (botonIniciarOleada) botonIniciarOleada.hidden = true;
        return;
    }
    if (!proximaOleadaAt && !oleadaActiva) proximaOleadaAt = Date.now() + INTERVALO_OLEADA_MS;
    if (!oleadaActiva && textoAvisoOleadas) {
        const segundos = Math.max(0, Math.ceil((proximaOleadaAt - Date.now()) / 1000));
        textoAvisoOleadas.textContent = `OLEADA ${numeroOleada + 1} · EN ${segundos}s`;
    }
    if (botonIniciarOleada) {
        // Los enemigos ambientales no bloquean el inicio de oleada.
        botonIniciarOleada.hidden = oleadaActiva || !!jefe || jugadorMuerto || juegoFinalizado || alertaJefeEnCurso;
    }
}

function intervaloAparicionAmbiente() {
    return INTERVALO_APARICION_MIN +
        Math.random() * (INTERVALO_APARICION_MAX - INTERVALO_APARICION_MIN);
}

function crearBarraVida(contenedor, vida) {
    contenedor.replaceChildren();
    contenedor.classList.add("barra-vida-enemigo");
    const relleno = crearElemento("span", "vida-enemigo-relleno");
    relleno.style.width = "100%";
    contenedor.appendChild(relleno);
}

function crearEnemigo(forzarHexagonial = false, ambiente = false) {
    const limite = forzarHexagonial
        ? MAX_ENEMIGOS
        : ambiente
            ? MAX_ENEMIGOS_AMBIENTE
            : MAX_ENEMIGOS;
    if (
        juegoFinalizado ||
        !zonaEnemigos ||
        (!oleadaActiva && !forzarHexagonial && !ambiente) ||
        enemigos.length >= limite ||
        !almaDoradaDesbloqueada ||
        jugadorMuerto
    ) {
        return;
    }

    const tipo = elegirTipoEnemigo();
    const d = TIPOS_ENEMIGOS[tipo];
    const id = siguienteIdEnemigo++;

    const el = crearElemento("button", `alma-enemiga ${d.clase}${forzarHexagonial ? " enemigo-hexagonial" : ""}`);
    el.type = "button";
    el.id = `enemigo-${id}`;
    el.tabIndex = -1;
    el.setAttribute("aria-label", d.nombre);

    el.style.setProperty(
        "--color-enemigo",
        COLORES_ENEMIGOS[
            Math.floor(Math.random() * COLORES_ENEMIGOS.length)
        ]
    );

    const forma = crearElemento("span", "alma-enemiga-forma");
    const nombre = crearElemento("span", "nombre-enemigo", d.nombre);
    const vida = crearElemento("span", "vida-enemigo");
    const textoVida = crearElemento("span", "texto-vida-enemigo");

    el.append(forma, nombre, vida, textoVida);
    const vidaMaxima = vidaEscalada(d.vida * (forzarHexagonial ? 1.35 : 1));
    crearBarraVida(vida, vidaMaxima);

    const ahora = Date.now();
    const slotsRutaOcupados = new Set(enemigos
        .filter(enemigo => enemigo.enRutaHexagonial && !enemigo.derrotado)
        .map(enemigo => enemigo.slotRutaHexagonial));
    const slotRutaHexagonial = forzarHexagonial
        ? Array.from({ length: 8 }, (_, i) => i).find(i => !slotsRutaOcupados.has(i)) ?? (enemigos.length % 8)
        : null;

    const e = {
        id,
        tipo,
        vidaActual: vidaMaxima,
        vidaMaxima,
        recompensa: d.recompensa,
        roboTP: d.roboTP,
        roboInicial: d.roboInicial,
        elemento: el,
        vida,
        textoVida,
        angulo: Math.random() * Math.PI * 2,
        velocidadOrbita: 0.00018 + Math.random() * 0.00012,
        radio: 220 + Math.random() * 55,
        ultimoRobo: ahora,
        ultimoRoboTP: ahora,
        creado: ahora,
        derrotado: false,
        enRutaHexagonial: forzarHexagonial,
        slotRutaHexagonial,
        inicioRutaHexagonial: jefe?.creado ?? ahora,
        faseRuta: slotRutaHexagonial ?? Math.random() * 8
    };

    // Evitar el cuadrado de foco; el disparo lo gestiona el listener global
    el.addEventListener("mousedown", event => {
        event.preventDefault();
    });

    el.addEventListener("click", event => {
        // No stopPropagation: el disparo global debe poder actuar
        if (almaActiva === "dorada" && !jugadorMuerto) {
            event.stopPropagation();
            crearProyectilJugador();
        }
    });

    zonaEnemigos.appendChild(el);
    enemigos.push(e);

    actualizarVidaEnemigo(e);

    clicks = Math.max(0, clicks - e.roboInicial);

    mostrarAvisoRobo(`${d.nombre}: -${d.roboInicial} clicks`);

    actualizarInterfaz();
    guardarProgreso();
    return true;
}

function actualizarVidaEnemigo(e) {
    if (!e || e.derrotado) return;
    const relleno = e.vida.querySelector(".vida-enemigo-relleno");
    if (relleno) relleno.style.width = `${Math.max(0, e.vidaActual / e.vidaMaxima * 100)}%`;
    e.textoVida.textContent = `${e.vidaActual}/${e.vidaMaxima}`;
}

function atacarEnemigo(e, danio = 1) {
    if (!e || e.derrotado || almaActiva !== "dorada") return;

    e.vidaActual = Math.max(0, e.vidaActual - danio);

    e.elemento.classList.remove("recibiendo-dano");
    void e.elemento.offsetWidth;
    e.elemento.classList.add("recibiendo-dano");

    actualizarVidaEnemigo(e);

    if (e.vidaActual <= 0) {
        derrotarEnemigo(e);
    }
}

function actualizarDificultadEnemigosExistentes() {
    for (const e of enemigos) {
        if (e.derrotado) continue;

        const proporcionVida = e.vidaMaxima > 0
            ? e.vidaActual / e.vidaMaxima
            : 1;
        const nuevaVidaMaxima = vidaEscalada(TIPOS_ENEMIGOS[e.tipo].vida);

        e.vidaMaxima = nuevaVidaMaxima;
        e.vidaActual = Math.max(
            1,
            Math.min(nuevaVidaMaxima, Math.ceil(nuevaVidaMaxima * proporcionVida))
        );

        e.vida.replaceChildren();
        crearBarraVida(e.vida, e.vidaMaxima);
        actualizarVidaEnemigo(e);
    }

    if (jefe && !jefe.derrotado) {
        const proporcionVida = jefe.vidaMaxima > 0
            ? jefe.vidaActual / jefe.vidaMaxima
            : 1;
        const nuevaVidaMaxima = vidaEscalada(jefe.tipo === "hexagonial" ? 220 : 120 + jefesDerrotadosRun * 40);
        jefe.vidaMaxima = nuevaVidaMaxima;
        jefe.vidaActual = Math.max(1, Math.min(
            nuevaVidaMaxima,
            Math.ceil(nuevaVidaMaxima * proporcionVida)
        ));
        jefe.vida.replaceChildren();
        crearBarraVida(jefe.vida, jefe.vidaMaxima);
        actualizarVidaJefe();
    }
}

function otorgarEsenciasPorDerrota(tipo = "errante", esJefe = false) {
    if (mejorasEsencia.cosecha.nivel <= 0) return 0;
    const base = esJefe ? 30 : (tipo === "sanadora" ? 5 : tipo === "abismal" ? 5 : tipo === "corrupta" ? 3 : 2);
    const cantidad = Math.max(1, Math.round(base * (1 + 0.25 * (mejorasEsencia.cosecha.nivel - 1)) * multiplicadorSobrecarga()));
    esencia += cantidad;
    actualizarInterfaz();
    guardarProgreso();
    return cantidad;
}

function derrotarEnemigo(e) {
    if (!e || e.derrotado) return;
    e.derrotado = true;
    e.elemento.classList.add("derrotada");
    darTP(e.recompensa);
    const esenciasGanadas = otorgarEsenciasPorDerrota(e.tipo, false);
    mostrarAvisoRobo(`¡ENEMIGO DERROTADO! +${e.recompensa} TP${esenciasGanadas ? ` · +${esenciasGanadas} ESENCIAS` : ""}`);
    setTimeout(() => e.elemento.remove(), 300);
    enemigos = enemigos.filter(x => x.id !== e.id);
}

function actualizarOrbitaEnemigos() {
    if (!zonaEnemigos) return;

    const w = zonaEnemigos.clientWidth;
    const h = zonaEnemigos.clientHeight;
    const cx = w / 2;
    const cy = h / 2;
    const now = Date.now();

    const br = boton?.getBoundingClientRect();

    const radioMin =
        (br ? Math.max(br.width, br.height) / 2 : 120) + 45;

    const radioMax = Math.max(
        radioMin,
        Math.min(w / 2 - 38, h / 2 - 35, 300)
    );

    enemigos.forEach((e, i) => {
        if (e.derrotado) return;
        if (e.enRutaHexagonial) {
            const lado = Math.min(w * 0.84, h * 0.76);
            const izquierda = (w - lado) / 2;
            const arriba = (h - lado) / 2;
            const puntos = [
                [izquierda, arriba],
                [w / 2, arriba],
                [izquierda + lado, arriba],
                [izquierda + lado, h / 2],
                [izquierda + lado, arriba + lado],
                [w / 2, arriba + lado],
                [izquierda, arriba + lado],
                [izquierda, h / 2]
            ];
            const inicioRuta = e.inicioRutaHexagonial ?? e.creado;
            const fase = ((((now - inicioRuta) / 60000) * 8) + (e.faseRuta ?? 0)) % 8;
            const tramo = Math.floor(fase), t = fase - tramo;
            const a = puntos[tramo], b = puntos[(tramo + 1) % puntos.length];
            e.elemento.style.left = `${a[0] + (b[0] - a[0]) * t}px`;
            e.elemento.style.top = `${a[1] + (b[1] - a[1]) * t}px`;
            return;
        }
        const r = Math.min(
            Math.max(e.radio + i * 12, radioMin),
            radioMax
        );

        const a = e.angulo + (now - e.creado) * e.velocidadOrbita;

        e.elemento.style.left = `${cx + Math.cos(a) * r}px`;
        e.elemento.style.top = `${cy + Math.sin(a) * r * 0.82}px`;
    });
}

function actualizarRobosEnemigos() {
    if (!almaDoradaDesbloqueada || jugadorMuerto) return;

    const now = Date.now();
    let c = 0;
    let t = 0;

    for (const e of enemigos) {
        if (e.derrotado) continue;

        if (now - e.ultimoRobo >= INTERVALO_ROBO) {
            const n = Math.floor(
                (now - e.ultimoRobo) / INTERVALO_ROBO
            );

            c += n;
            e.ultimoRobo += n * INTERVALO_ROBO;
        }

        if (now - e.ultimoRoboTP >= INTERVALO_ROBO) {
            const n = Math.floor(
                (now - e.ultimoRoboTP) / INTERVALO_ROBO
            );

            t += n * e.roboTP;
            e.ultimoRoboTP += n * INTERVALO_ROBO;
        }
    }

    if (c <= 0 && t <= 0) return;

    clicks = Math.max(0, clicks - c);
    tpTotal = Math.max(0, tpTotal - t);

    const partes = [];

    if (c) partes.push(`-${c} clicks`);
    if (t) partes.push(`-${t} TP`);

    mostrarAvisoRobo(
        `¡LAS ALMAS TE ROBAN! ${partes.join(" · ")}`
    );

    actualizarInterfaz();
    guardarProgreso();
}

function actualizarEnemigos() {
    if (juegoFinalizado || !almaDoradaDesbloqueada || jugadorMuerto) return;
    const now = Date.now();
    asegurarAvisoOleadas();

    // Enemigos ambientales: fuera de oleada y sin jefe, aparecen de uno en uno
    // cada 5–10 s (máx. MAX_ENEMIGOS_AMBIENTE a la vez). Las oleadas son el evento extra.
    if (!oleadaActiva && !jefe && !alertaJefeEnCurso) {
        if (!siguienteEnemigoAmbienteAt || siguienteEnemigoAmbienteAt < now - 60000) {
            siguienteEnemigoAmbienteAt = now + intervaloAparicionAmbiente();
        }
        if (now >= siguienteEnemigoAmbienteAt) {
            if (enemigos.length < MAX_ENEMIGOS_AMBIENTE && crearEnemigo(false, true)) {
                siguienteEnemigoAmbienteAt = now + intervaloAparicionAmbiente();
            } else {
                // Campo lleno o falló el spawn: reintentar más tarde sin spamear.
                siguienteEnemigoAmbienteAt = now + 2000;
            }
        }
    } else {
        siguienteEnemigoAmbienteAt = 0;
    }

    // La oleada puede empezar aunque haya enemigos ambientales en pantalla.
    if (!oleadaActiva && !jefe && proximaOleadaAt && now >= proximaOleadaAt) {
        numeroOleada++;
        oleadaActiva = true;
        segundaOportunidadUsadaOleada = false;
        inicioOleadaAt = now;
        gruposOleadaRestantes = GRUPOS_POR_OLEADA;
        siguienteGrupoOleadaAt = now;
        siguienteSpawnPendienteAt = now;
        enemigosPendientesOleada = 0;
        if (textoAvisoOleadas) textoAvisoOleadas.textContent = `¡OLEADA ${numeroOleada}!`;
        if (botonIniciarOleada) botonIniciarOleada.hidden = true;
    }

    if (oleadaActiva && gruposOleadaRestantes > 0 && now >= siguienteGrupoOleadaAt) {
        enemigosPendientesOleada += cantidadEnemigosOleada();
        gruposOleadaRestantes--;
        siguienteGrupoOleadaAt = now + INTERVALO_GRUPO_OLEADA_MS;
    }

    if (oleadaActiva && enemigosPendientesOleada > 0 && enemigos.length < MAX_ENEMIGOS && now >= siguienteSpawnPendienteAt) {
        if (crearEnemigo()) {
            enemigosPendientesOleada--;
            siguienteSpawnPendienteAt = now + 350;
        } else {
            siguienteSpawnPendienteAt = now + 500;
        }
    }

    if (oleadaActiva && gruposOleadaRestantes === 0 && enemigosPendientesOleada === 0 && enemigos.length === 0) {
        oleadaActiva = false;
        oleadaCompletadaAlMenosUnaVez = true;
        oleadasCompletadasTotal++;
        // El descanso empieza al terminar la oleada; nunca se consume durante el combate.
        proximaOleadaAt = now + DESCANSO_ENTRE_OLEADAS_MS;
        guardarProgreso();
        if (textoAvisoOleadas) textoAvisoOleadas.textContent = `¡OLEADA ${numeroOleada} COMPLETADA!`;
        if (botonIniciarOleada) botonIniciarOleada.hidden = true;
        mostrarAvisoRobo(`¡OLEADA ${numeroOleada} COMPLETADA!`);
        programarSiguienteEnemigo();
    }

    if (oleadaActiva && textoAvisoOleadas) {
        textoAvisoOleadas.textContent = gruposOleadaRestantes > 0
            ? `OLEADA ${numeroOleada} · ${enemigos.length + enemigosPendientesOleada} RESTANTES · ${gruposOleadaRestantes} GRUPOS POR LLEGAR`
            : `OLEADA ${numeroOleada} · ${enemigos.length + enemigosPendientesOleada} RESTANTES`;
        if (botonIniciarOleada) botonIniciarOleada.hidden = true;
    } else if (!jefe) {
        programarSiguienteEnemigo();
    }
    // La órbita se actualiza una sola vez desde el ciclo principal de 100 ms.
    actualizarRobosEnemigos();
    comprobarAparicionJefe();
}

// Enemigo especial que aparece ocasionalmente junto a un jefe.
function crearEnemigoSanador() {
    if (!zonaEnemigos || !jefe || jugadorMuerto) return;
    // Solo puede existir una sanadora activa: controla un único ataque de borde.
    if (enemigos.some(e => e.tipo === "sanadora" && !e.derrotado && e.elemento?.isConnected)) return;
    const d = TIPOS_ENEMIGOS.sanadora;
    const id = siguienteIdEnemigo++;
    const el = crearElemento("button", `alma-enemiga ${d.clase}`);
    el.type = "button";
    el.id = `enemigo-${id}`;
    el.tabIndex = -1;
    el.setAttribute("aria-label", d.nombre);
    const color = COLORES_ENEMIGOS[Math.floor(Math.random() * COLORES_ENEMIGOS.length)];
    el.style.setProperty("--color-enemigo", color);
    const forma = crearElemento("span", "alma-enemiga-forma");
    const nombre = crearElemento("span", "nombre-enemigo", d.nombre);
    const vida = crearElemento("span", "vida-enemigo");
    const textoVida = crearElemento("span", "texto-vida-enemigo");
    el.append(forma, nombre, vida, textoVida);
    const vidaMaxima = vidaEscalada(d.vida);
    crearBarraVida(vida, vidaMaxima);
    const ahora = Date.now();
    const sanadoraEnRuta = jefe?.tipo === "hexagonial";
    const slotsRutaOcupados = new Set(enemigos
        .filter(enemigo => enemigo.enRutaHexagonial && !enemigo.derrotado)
        .map(enemigo => enemigo.slotRutaHexagonial));
    const slotRutaHexagonial = sanadoraEnRuta
        ? Array.from({ length: 8 }, (_, i) => i).find(i => !slotsRutaOcupados.has(i)) ?? (enemigos.length % 8)
        : null;
    const e = { id, tipo: "sanadora", vidaActual: vidaMaxima, vidaMaxima, recompensa: d.recompensa, roboTP: 0, roboInicial: 0, elemento: el, vida, textoVida, angulo: Math.random() * Math.PI * 2, velocidadOrbita: 0.00012, radio: 175, ultimoRobo: ahora, ultimoRoboTP: ahora, creado: ahora, derrotado: false, ultimoDisparo: ahora, enRutaHexagonial: sanadoraEnRuta, slotRutaHexagonial, inicioRutaHexagonial: jefe?.creado ?? ahora, faseRuta: slotRutaHexagonial ?? Math.random() * 8 };
    el.addEventListener("mousedown", event => event.preventDefault());
    el.addEventListener("click", event => {
        if (almaActiva === "dorada" && !jugadorMuerto) { event.stopPropagation(); crearProyectilJugador(); }
    });
    zonaEnemigos.appendChild(el);
    enemigos.push(e);
    actualizarVidaEnemigo(e);
    // La sanadora no cura ni dispara: su único ataque es el borde del cuadro.
    activarAtaqueBordeSanador(e, color);
}

function activarAtaqueBordeSanador(sanador, color) {
    if (ataqueBordeSanador) ataqueBordeSanador.elementos.forEach(el => el.remove());
    const elementos = Array.from({ length: 4 }, () => {
        const el = crearElemento("div", "ataque-borde-sanador");
        Object.assign(el.style, { position: "fixed", background: color, boxShadow: `0 0 7px ${color}, 0 0 14px ${color}`, zIndex: "99998", pointerEvents: "none" });
        document.body.appendChild(el);
        return el;
    });
    ataqueBordeSanador = { sanador, elementos, siguienteDanio: 0, color };
}

function actualizarAtaquesContinuos() {
    const almaRect = alma?.getBoundingClientRect();
    if (ataqueBordeSanador) {
        const a = ataqueBordeSanador;
        if (a.sanador.derrotado || !a.sanador.elemento.isConnected) {
            a.elementos.forEach(el => el.remove());
            ataqueBordeSanador = null;
        } else {
            const r = boton?.getBoundingClientRect();
            if (r) {
                const grosor = 8, inset = 10;
                const rects = [
                    { left: r.left + inset, top: r.top + inset, width: r.width - inset * 2, height: grosor },
                    { left: r.left + inset, top: r.bottom - inset - grosor, width: r.width - inset * 2, height: grosor },
                    { left: r.left + inset, top: r.top + inset, width: grosor, height: r.height - inset * 2 },
                    { left: r.right - inset - grosor, top: r.top + inset, width: grosor, height: r.height - inset * 2 }
                ];
                rects.forEach((box, i) => Object.assign(a.elementos[i].style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` }));
                if (almaRect && rects.some(box => almaRect.left < box.left + box.width && almaRect.right > box.left && almaRect.top < box.top + box.height && almaRect.bottom > box.top)) {
                    if (Date.now() >= a.siguienteDanio) { recibirDanio(8); a.siguienteDanio = Date.now() + 650; }
                }
            }
        }
    }
    zonasLaserActivas = zonasLaserActivas.filter(z => {
        if (Date.now() >= z.fin || !z.elemento.isConnected) { z.elemento.remove(); return false; }
        if (almaRect && Date.now() >= z.siguienteDanio) {
            let enLaser = false;
            // Láser de Hexagonial: colisión por distancia al segmento (haz rotado).
            if (z.linea && Number.isFinite(z.x0) && Number.isFinite(z.y0) && Number.isFinite(z.x1) && Number.isFinite(z.y1)) {
                const cx = (almaRect.left + almaRect.right) / 2;
                const cy = (almaRect.top + almaRect.bottom) / 2;
                enLaser = distanciaPuntoASegmento(cx, cy, z.x0, z.y0, z.x1, z.y1) <= (z.radio || 12);
            } else {
                // Láseres axis-aligned (cruz, etc.): AABB.
                const r = z.elemento.getBoundingClientRect();
                enLaser = almaRect.left < r.right && almaRect.right > r.left &&
                    almaRect.top < r.bottom && almaRect.bottom > r.top;
            }
            if (enLaser) {
                // Cada tick pasa por recibirDanio → aplica defensa y suelo mínimo.
                recibirDanio(z.danio);
                z.siguienteDanio = Date.now() + (z.intervaloDanio || 200);
            }
        }
        return true;
    });
}

// Distancia del punto (px,py) al segmento (x0,y0)-(x1,y1).
function distanciaPuntoASegmento(px, py, x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len2 = dx * dx + dy * dy;
    if (len2 <= 0) return Math.hypot(px - x0, py - y0);
    let t = ((px - x0) * dx + (py - y0) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy));
}

// Jefes
function comprobarAparicionJefe() {
    if (!almaDoradaDesbloqueada || oleadasCompletadasTotal < OLEADAS_PARA_JEFE || !oleadaCompletadaAlMenosUnaVez || jefe || oleadaActiva || enemigos.length > 0 || jugadorMuerto || juegoFinalizado || Date.now() < bloqueoJefesHasta || tpDesdeJefe < TP_PARA_JEFE) return;
    // Si ya toca una oleada, esta tiene prioridad sobre el jefe.
    if (proximaOleadaAt && Date.now() >= proximaOleadaAt) return;
    iniciarAlertaJefe();
}

function crearJefe(forzarHexagonial = false, restaurando = false) {
    if (!zonaEnemigos || jefe || jugadorMuerto || oleadaActiva || enemigos.length > 0) return;
    if (!restaurando) bossCount++;
    const esHexagonial = forzarHexagonial || bossCount === 1;
    const vidaMax = vidaEscalada(esHexagonial ? calcularVidaDinamicaHexagonial() : 120 + jefesDerrotadosRun * 40);
    const id = siguienteIdJefe++;
    const nombreJefe = esHexagonial ? "HEXAGONIAL" : `MINIJEFE ${bossCount - 1}`;
    const el = crearElemento("button", esHexagonial
        ? "alma-enemiga alma-jefe alma-abismal jefe-enemigo hexagonial"
        : "alma-enemiga alma-jefe alma-abismal jefe-enemigo");
    el.type = "button"; el.id = `jefe-${id}`; el.tabIndex = -1;
    el.setAttribute("aria-label", nombreJefe);
    el.style.setProperty("--color-enemigo", esHexagonial ? "#ffffff" : "#ff4545");
    const forma = crearElemento("span", "alma-enemiga-forma");
    const nombre = crearElemento("span", "nombre-enemigo", nombreJefe);
    const vida = crearElemento("span", "vida-enemigo");
    const textoVida = crearElemento("span", "texto-vida-enemigo");
    el.append(forma, nombre, vida, textoVida);
    crearBarraVida(vida, vidaMax);
    jefe = {
        id, numero: bossCount, tipo: esHexagonial ? "hexagonial" : "minijefe",
        vidaActual: vidaMax, vidaMaxima: vidaMax, elemento: el, vida, textoVida,
        ultimoDisparo: Date.now(), creado: Date.now(), angulo: 0, pasoCamino: 0,
        // Primera esquina + ataque poco después de aparecer
        siguientePaso: Date.now() + 500, siguienteInvocacion: Date.now() + 2000,
        ultimoAtaqueBorde: Date.now(), derrotado: false, faseDosAnunciada: false,
        siguienteCruzDiagonal: false
    };
    el.addEventListener("mousedown", event => event.preventDefault());
    el.addEventListener("click", event => {
        event.stopPropagation();
        if (almaActiva === "dorada" && !jugadorMuerto) crearProyectilJugador();
    });
    zonaEnemigos.appendChild(el);

    if (esHexagonial) {
        const camino = crearElemento("div", "camino-hexagonial");
        camino.id = "camino-hexagonial";
        zonaEnemigos.appendChild(camino);
        jefe.camino = camino;
    }
    crearHUDVidaJefe();
    actualizarVidaJefe();
    mostrarAvisoRobo(esHexagonial ? "¡HEXAGONIAL HA APARECIDO!" : `¡MINIJEFE ${bossCount - 1} APARECIÓ!`);
    if (!esHexagonial && !restaurando && Math.random() < 0.30) crearEnemigoSanador();
    if (proximaOleadaAt && proximaOleadaAt < Date.now() + 10000) proximaOleadaAt = Date.now() + 10000;
    guardarProgreso();
}

function crearHUDVidaJefe() {
    document.getElementById("barra-jefe-inferior")?.remove();
    const barra = crearElemento("div", "barra-jefe-inferior");
    barra.id = "barra-jefe-inferior";
    const nombre = crearElemento("div", "nombre-jefe-inferior", jefe?.tipo === "hexagonial" ? "HEXAGONIAL" : `MINIJEFE ${(jefe?.numero || bossCount) - 1}`);
    const fondo = crearElemento("div", "fondo-vida-jefe-inferior");
    const relleno = crearElemento("div", "relleno-vida-jefe-inferior");
    relleno.id = "relleno-vida-jefe-inferior";
    fondo.appendChild(relleno);
    const cifra = crearElemento("div", "texto-vida-jefe-inferior");
    cifra.id = "texto-vida-jefe-inferior";
    barra.append(nombre, fondo, cifra);
    document.body.appendChild(barra);
}

function actualizarVidaJefe() {
    if (!jefe || jefe.derrotado) return;
    const relleno = jefe.vida.querySelector(".vida-enemigo-relleno");
    if (relleno) relleno.style.width = `${Math.max(0, jefe.vidaActual / jefe.vidaMaxima * 100)}%`;
    jefe.textoVida.textContent = `${jefe.vidaActual}/${jefe.vidaMaxima}`;
    const rellenoInferior = document.getElementById("relleno-vida-jefe-inferior");
    const cifraInferior = document.getElementById("texto-vida-jefe-inferior");
    if (rellenoInferior) rellenoInferior.style.width = `${Math.max(0, jefe.vidaActual / jefe.vidaMaxima * 100)}%`;
    if (cifraInferior) cifraInferior.textContent = `${jefe.vidaActual} / ${jefe.vidaMaxima}`;
}

function atacarJefe(danio = 1) {
    if (juegoFinalizado || !jefe || jefe.derrotado || almaActiva !== "dorada") return;

    jefe.vidaActual = Math.max(0, jefe.vidaActual - danio);

    jefe.elemento.classList.remove("recibiendo-dano");
    void jefe.elemento.offsetWidth;
    jefe.elemento.classList.add("recibiendo-dano");

    actualizarVidaJefe();
    guardarProgreso();

    if (jefe.vidaActual <= 0) {
        jefe.derrotado = true;
        jefe.elemento.classList.add("derrotada");

        const jefeDerrotado = jefe;
        if (jefeDerrotado.tipo === "hexagonial") hexagonialDerrotado = true;
        jefesDerrotadosRun++;
        actualizarDificultadEnemigosExistentes();

        tpDesdeJefe = 0;
        bloqueoJefesHasta = Date.now() + 60000;

        mostrarAvisoRobo(
            `¡${jefeDerrotado.tipo === "hexagonial" ? "JEFE" : "MINIJEFE"} DERROTADO! +1.000 TP · DIFICULTAD ${jefesDerrotadosRun}`
        );

        jefe = null;
        document.querySelectorAll(".aviso-laser-hexagonial, .laser-hexagonial").forEach(el => el.remove());
        document.getElementById("barra-jefe-inferior")?.remove();
        document.getElementById("camino-hexagonial")?.remove();
        enemigos = enemigos.filter(e => {
            if (e.enRutaHexagonial) {
                // Se convierten visualmente en enemigos normales, conservando
                // su recorrido cuadrado; al desaparecer el jefe recuperan
                // automáticamente los patrones normales de ataque.
                e.elemento.classList.remove("enemigo-hexagonial");
                return true;
            }
            if (e.tipo === "sanadora") {
                e.derrotado = true;
                e.elemento.remove();
                return false;
            }
            return true;
        });
        proximaOleadaAt = Math.max(proximaOleadaAt, Date.now() + 10000);
        actualizarInterfaz();
        guardarProgreso();

        // La recompensa del jefe no cuenta para invocar al siguiente.
        darTP(1000, false);
        const esenciasJefe = otorgarEsenciasPorDerrota(jefeDerrotado.tipo, true);
        if (esenciasJefe) mostrarAvisoRobo(`¡RECOMPENSA DEL JEFE! +${esenciasJefe} ESENCIAS`);

        setTimeout(() => jefeDerrotado.elemento.remove(), 350);

        setTimeout(comprobarAparicionJefe, 400);
    }
}

function obtenerTrayectoriaLaserHexagonial(origenRect, destinoRect) {
    const x0 = origenRect.left + origenRect.width / 2;
    const y0 = origenRect.top + origenRect.height / 2;
    const x1 = destinoRect.left + destinoRect.width / 2;
    const y1 = destinoRect.top + destinoRect.height / 2;
    const dx = x1 - x0, dy = y1 - y0;
    const longitud = Math.hypot(dx, dy) || 1;
    const ux = dx / longitud, uy = dy / longitud;
    const limites = [];
    if (ux > 0) limites.push((window.innerWidth - x0) / ux);
    else if (ux < 0) limites.push((0 - x0) / ux);
    if (uy > 0) limites.push((window.innerHeight - y0) / uy);
    else if (uy < 0) limites.push((0 - y0) / uy);
    return { x0, y0, dx, dy, distancia: Math.min(...limites.filter(v => v >= 0)) };
}

function crearHazLaserHexagonial(trayectoria) {
    if (!jefe || jefe.tipo !== "hexagonial" || !boton) return;
    // Si no se pasa trayectoria, se calcula al momento (compatibilidad).
    if (!trayectoria) {
        trayectoria = obtenerTrayectoriaLaserHexagonial(
            jefe.elemento.getBoundingClientRect(), boton.getBoundingClientRect()
        );
    }
    const ang = Math.atan2(trayectoria.dy, trayectoria.dx);
    const x1 = trayectoria.x0 + Math.cos(ang) * trayectoria.distancia;
    const y1 = trayectoria.y0 + Math.sin(ang) * trayectoria.distancia;
    const haz = crearElemento("div", "laser-hexagonial");
    Object.assign(haz.style, {
        left: `${trayectoria.x0}px`, top: `${trayectoria.y0}px`,
        width: `${trayectoria.distancia}px`,
        transform: `rotate(${ang}rad)`
    });
    document.body.appendChild(haz);
    // Daño continuo: ticks cada 180 ms mientras el alma esté sobre el haz.
    // Base 10 de daño por tick (la defensa se aplica en recibirDanio).
    // Duración corta ~0.5 s.
    zonasLaserActivas.push({
        elemento: haz,
        fin: Date.now() + 500,
        siguienteDanio: Date.now(),
        intervaloDanio: 180,
        danio: 10,
        linea: true,
        x0: trayectoria.x0,
        y0: trayectoria.y0,
        x1,
        y1,
        radio: 14
    });
}

function limpiarLaseresHexagonial() {
    document.querySelectorAll(".aviso-laser-hexagonial, .laser-hexagonial").forEach(el => el.remove());
    zonasLaserActivas = zonasLaserActivas.filter(z => {
        if (z.elemento && z.elemento.classList && z.elemento.classList.contains("laser-hexagonial")) {
            z.elemento.remove();
            return false;
        }
        return true;
    });
}

function esFaseDosHexagonial() {
    return !!(jefe && jefe.tipo === "hexagonial" && jefe.vidaMaxima > 0 &&
        jefe.vidaActual / jefe.vidaMaxima <= 0.5);
}

function crearHazLaserDesdeSegmento(x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const distancia = Math.hypot(dx, dy) || 1;
    const ang = Math.atan2(dy, dx);
    const haz = crearElemento("div", "laser-hexagonial");
    Object.assign(haz.style, {
        left: `${x0}px`, top: `${y0}px`,
        width: `${distancia}px`,
        transform: `rotate(${ang}rad)`
    });
    document.body.appendChild(haz);
    zonasLaserActivas.push({
        elemento: haz,
        fin: Date.now() + 500,
        siguienteDanio: Date.now(),
        intervaloDanio: 180,
        danio: 10,
        linea: true,
        x0, y0, x1, y1,
        radio: 14
    });
}

function crearAvisoLaserDesdeSegmento(x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const distancia = Math.hypot(dx, dy) || 1;
    const ang = Math.atan2(dy, dx);
    const aviso = crearElemento("div", "aviso-laser-hexagonial");
    Object.assign(aviso.style, {
        left: `${x0}px`, top: `${y0}px`,
        width: `${distancia}px`,
        transform: `rotate(${ang}rad)`
    });
    document.body.appendChild(aviso);
    return aviso;
}

function rayoHastaBordePantalla(cx, cy, dx, dy) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const candidatos = [];
    if (dx > 0) candidatos.push((W - cx) / dx);
    if (dx < 0) candidatos.push((0 - cx) / dx);
    if (dy > 0) candidatos.push((H - cy) / dy);
    if (dy < 0) candidatos.push((0 - cy) / dy);
    const t = Math.min(...candidatos.filter(v => v > 0));
    return [cx + dx * t, cy + dy * t];
}

function dispararLaserCruzHexagonial() {
    if (!jefe || jefe.tipo !== "hexagonial" || !boton || jefe.avisoLaserActivo) return;
    const idJefe = jefe.id;
    limpiarLaseresHexagonial();

    // Cruz centrada en el cuadro: alterna ortogonal ↔ diagonal.
    const caja = boton.getBoundingClientRect();
    const cx = caja.left + caja.width / 2;
    const cy = caja.top + caja.height / 2;
    const W = window.innerWidth;
    const H = window.innerHeight;

    const usarDiagonal = !!jefe.siguienteCruzDiagonal;
    jefe.siguienteCruzDiagonal = !usarDiagonal;

    let segmentos;
    if (!usarDiagonal) {
        // Horizontal + vertical
        segmentos = [
            [0, cy, W, cy],
            [cx, 0, cx, H]
        ];
    } else {
        // Diagonales (↘ y ↗) a través del centro del cuadro
        const a1 = rayoHastaBordePantalla(cx, cy, 1, 1);
        const a2 = rayoHastaBordePantalla(cx, cy, -1, -1);
        const b1 = rayoHastaBordePantalla(cx, cy, 1, -1);
        const b2 = rayoHastaBordePantalla(cx, cy, -1, 1);
        segmentos = [
            [a2[0], a2[1], a1[0], a1[1]],
            [b2[0], b2[1], b1[0], b1[1]]
        ];
    }

    const avisos = segmentos.map(([x0, y0, x1, y1]) => crearAvisoLaserDesdeSegmento(x0, y0, x1, y1));
    jefe.avisoLaserActivo = true;

    setTimeout(() => {
        avisos.forEach(a => { if (a.isConnected) a.remove(); });
        if (!jefe || jefe.id !== idJefe || jefe.derrotado) {
            if (jefe) jefe.avisoLaserActivo = false;
            return;
        }
        jefe.avisoLaserActivo = false;
        segmentos.forEach(([x0, y0, x1, y1]) => crearHazLaserDesdeSegmento(x0, y0, x1, y1));
    }, 350);
}

function dispararLaserHexagonial() {
    if (!jefe || jefe.tipo !== "hexagonial" || !boton || jefe.avisoLaserActivo) return;

    // Fase 2 (≤50% vida): el láser se convierte en cruz.
    if (esFaseDosHexagonial()) {
        dispararLaserCruzHexagonial();
        return;
    }

    const idJefe = jefe.id;
    limpiarLaseresHexagonial();

    // Fase 1: láser simple dirigido.
    const trayectoria = obtenerTrayectoriaLaserHexagonial(
        jefe.elemento.getBoundingClientRect(), boton.getBoundingClientRect()
    );
    const ang = Math.atan2(trayectoria.dy, trayectoria.dx);
    const aviso = crearAvisoLaserDesdeSegmento(
        trayectoria.x0,
        trayectoria.y0,
        trayectoria.x0 + Math.cos(ang) * trayectoria.distancia,
        trayectoria.y0 + Math.sin(ang) * trayectoria.distancia
    );
    jefe.avisoLaserActivo = true;

    setTimeout(() => {
        if (aviso.isConnected) aviso.remove();
        if (!jefe || jefe.id !== idJefe || jefe.derrotado) {
            if (jefe) jefe.avisoLaserActivo = false;
            return;
        }
        jefe.avisoLaserActivo = false;
        crearHazLaserHexagonial(trayectoria);
    }, 350);
}

function actualizarJefe() {
    if (juegoFinalizado || !jefe || jefe.derrotado || !zonaEnemigos) return;
    const w = zonaEnemigos.clientWidth, h = zonaEnemigos.clientHeight, now = Date.now();
    if (jefe.tipo === "hexagonial") {
        const lado = Math.min(w * 0.84, h * 0.76);
        const izquierda = (w - lado) / 2;
        const arriba = (h - lado) / 2;
        if (jefe.camino) {
            jefe.camino.style.width = `${lado}px`;
            jefe.camino.style.height = `${lado}px`;
        }
        const puntos = [
            [izquierda, arriba],
            [w / 2, arriba],
            [izquierda + lado, arriba],
            [izquierda + lado, h / 2],
            [izquierda + lado, arriba + lado],
            [w / 2, arriba + lado],
            [izquierda, arriba + lado],
            [izquierda, h / 2]
        ];
        // Al llegar a cada esquina: colocar, avisar y atacar. Se queda más tiempo
        // en esa posición para completar indicador + láser de forma rápida.
        let acabaDeLlegar = false;
        if (now >= jefe.siguientePaso) {
            jefe.pasoCamino = (jefe.pasoCamino + 1) % puntos.length;
            // 350 ms indicador + 500 ms láser + margen breve ≈ 1 s en la esquina
            jefe.siguientePaso = now + 1000;
            acabaDeLlegar = true;
        }
        const [px, py] = puntos[jefe.pasoCamino];
        jefe.elemento.style.left = `${px}px`;
        jefe.elemento.style.top = `${py}px`;
        if (acabaDeLlegar && !jefe.avisoLaserActivo) {
            dispararLaserHexagonial();
        }
        // Aviso único al entrar en fase 2 (láser en cruz).
        if (esFaseDosHexagonial() && !jefe.faseDosAnunciada) {
            jefe.faseDosAnunciada = true;
            mostrarAvisoRobo("¡HEXAGONIAL ENTRA EN FASE 2! LÁSER EN CRUZ");
        }
        // Invocaciones moderadas: frecuentes, sin saturar.
        // Fase 1: 1–2 cada ~3.2 s | Fase 2: 2 cada ~2.6 s
        if (now >= jefe.siguienteInvocacion) {
            const hueco = MAX_ENEMIGOS - enemigos.filter(e => !e.derrotado).length;
            const maxPorOleada = esFaseDosHexagonial() ? 2 : (Math.random() < 0.55 ? 2 : 1);
            const cantidad = Math.min(hueco, maxPorOleada);
            for (let i = 0; i < cantidad; i++) crearEnemigo(true);
            jefe.siguienteInvocacion = now + (esFaseDosHexagonial() ? 2600 : 3200);
        }
        // Hexagonial: láser al llegar a cada esquina (simple o cruz según fase).
        return;
    }
    jefe.angulo += 0.001;
    jefe.elemento.style.left = `${w / 2 + Math.cos(jefe.angulo) * Math.min(160, w * 0.22)}px`;
    jefe.elemento.style.top = `${h * 0.22 + Math.sin(jefe.angulo * 0.7) * 35}px`;
    if (now - jefe.ultimoDisparo >= intervaloDisparoJefeActual()) {
        jefe.ultimoDisparo = now;
        dispararContraJugador(true, null, jefe.tipo === "hexagonial");
    }
}

// HUD del jugador
function crearHUDCombate() {
    // Eliminar elementos de combate que ya no deben mostrarse
    const modo = document.getElementById("modo-alma");
    if (modo) modo.remove();

    const controles = document.getElementById("controles-combate");
    if (controles) controles.remove();

    let cont = document.getElementById("contenedor-vida-jugador");

    if (!cont) {
        cont = crearElemento("div", "contenedor-vida-jugador");
        cont.id = "contenedor-vida-jugador";
        document.body.appendChild(cont);
    }

    Object.assign(cont.style, {
        position: "fixed",
        zIndex: "12",
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        margin: "0",
        padding: "0"
    });

    let texto = document.getElementById("texto-vida-jugador");

    if (!texto) {
        texto = crearElemento("div", "", "VIDA: 100/100");
        texto.id = "texto-vida-jugador";
        cont.appendChild(texto);
    }

    Object.assign(texto.style, {
        textAlign: "center",
        whiteSpace: "nowrap",
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "8px",
        lineHeight: "1.6",
        color: "#fff",
        textShadow: "0 0 6px #ff0000, 1px 1px #000",
        margin: "0",
        padding: "0"
    });

    let barra = document.getElementById("barra-vida-jugador");

    if (!barra) {
        barra = crearElemento("div", "barra-vida-jugador");
        barra.id = "barra-vida-jugador";
        cont.appendChild(barra);
    }

    Object.assign(barra.style, {
        width: "140px",
        height: "10px",
        border: "1px solid #ff3333",
        background: "#210707",
        padding: "1px",
        boxSizing: "border-box",
        boxShadow: "0 0 7px #ff000044",
        overflow: "hidden"
    });

    let relleno = document.getElementById("relleno-vida-jugador");

    if (!relleno) {
        relleno = crearElemento("div", "relleno-vida-jugador");
        relleno.id = "relleno-vida-jugador";
        barra.appendChild(relleno);
    }

    Object.assign(relleno.style, {
        display: "block",
        height: "100%",
        width: "100%",
        background: "linear-gradient(90deg, #ff2222, #ff6666)",
        boxShadow: "0 0 7px #ff0000",
        transition: "width 0.15s linear"
    });

    colocarVidaDebajoCaja();
    actualizarBarraVida();
}

function colocarVidaDebajoCaja() {
    const cont = document.getElementById("contenedor-vida-jugador");
    if (!cont || !boton) return;

    const caja = boton.getBoundingClientRect();

    cont.style.left = `${caja.left + caja.width / 2}px`;
    cont.style.top = `${caja.bottom + 8}px`;
    cont.style.transform = "translateX(-50%)";
}

function actualizarBarraVida() {
    const relleno = document.getElementById("relleno-vida-jugador");
    const barra = document.getElementById("barra-vida-jugador");
    const texto = document.getElementById("texto-vida-jugador");

    const max = maxVida();
    const pct = max > 0 ? Math.max(0, Math.min(100, (vidaJugador / max) * 100)) : 0;

    if (relleno) {
        relleno.style.width = `${pct}%`;
    }

    if (barra) {
        barra.classList.toggle("media", pct <= 50 && pct > 25);
        barra.classList.toggle("baja", pct <= 25);
    }

    if (texto) {
        texto.textContent =
            `VIDA: ${formatear(vidaJugador)}/${max} · ` +
            `DEFENSA ${Math.round(obtenerDefensa() * 100)}%`;
    }
}


function obtenerLimitesCajaVerde() {
    if (!boton || !alma) return null;

    const caja = boton.getBoundingClientRect();
    const juego = alma.parentElement;
    if (!juego) return null;

    const juegoRect = juego.getBoundingClientRect();

    // Posición de la caja verde relativa a .juego (donde vive el alma)
    const cajaLeft = caja.left - juegoRect.left;
    const cajaTop  = caja.top  - juegoRect.top;
    const cajaW    = caja.width;
    const cajaH    = caja.height;

    // Tamaño visual real del corazón (medido)
    const almaRect = alma.getBoundingClientRect();
    const visualW  = almaRect.width  || 33;
    const visualH  = almaRect.height || 33;

    // left/top se aplican a la caja de layout (coincide con CSS .alma)
    const layoutW = 22;
    const layoutH = 22;

    const halfExtraW = (visualW - layoutW) / 2;
    const halfExtraH = (visualH - layoutH) / 2;

    // Margen interior para que el corazón no roce el borde verde
    const margen = 4;

    const minX = cajaLeft + margen + halfExtraW;
    const minY = cajaTop  + margen + halfExtraH;
    const maxX = cajaLeft + cajaW - layoutW - margen - halfExtraW;
    const maxY = cajaTop  + cajaH - layoutH - margen - halfExtraH;

    return {
        minX: Math.min(minX, maxX),
        minY: Math.min(minY, maxY),
        maxX: Math.max(minX, maxX),
        maxY: Math.max(minY, maxY)
    };
}

function mantenerJugadorEnZona() {
    if (!alma) return;

    const limites = obtenerLimitesCajaVerde();
    if (!limites) return;

    const { minX, minY, maxX, maxY } = limites;

    if (posicionJugador.x === null || posicionJugador.y === null) {
        // Centrar dentro de la caja verde
        posicionJugador.x = (minX + maxX) / 2;
        posicionJugador.y = (minY + maxY) / 2;
    }

    posicionJugador.x = Math.max(minX, Math.min(posicionJugador.x, maxX));
    posicionJugador.y = Math.max(minY, Math.min(posicionJugador.y, maxY));

    alma.style.left = `${posicionJugador.x}px`;
    alma.style.top  = `${posicionJugador.y}px`;
}

function crearImagenResidualDash() {
    if (!alma) return;
    const rect = alma.getBoundingClientRect();
    const estilo = getComputedStyle(alma);
    let angulo = 45;
    if (estilo.transform && estilo.transform !== "none") {
        try {
            const matriz = new DOMMatrixReadOnly(estilo.transform);
            angulo = Math.atan2(matriz.b, matriz.a) * 180 / Math.PI;
        } catch (_) { /* Mantener la orientación de diamante por defecto. */ }
    }
    const copia = alma.cloneNode(false);
    copia.removeAttribute("id");
    copia.setAttribute("aria-hidden", "true");
    copia.classList.remove("latir");
    copia.classList.add("dash-afterimage");
    Object.assign(copia.style, {
        position: "fixed",
        left: `${rect.left + rect.width / 2}px`,
        top: `${rect.top + rect.height / 2}px`,
        width: "22px",
        height: "22px",
        margin: "0",
        zIndex: "5",
        pointerEvents: "none",
        opacity: "0.58",
        transform: `translate(-50%, -50%) rotate(${angulo}deg)`,
        transformOrigin: "center center",
        animation: "none"
    });
    document.body.appendChild(copia);
    setTimeout(() => copia.remove(), 240);
}

function activarDash() {
    const ahora = Date.now();
    if (!alma || jugadorMuerto || juegoFinalizado ||
        ahora < dashHasta) return;

    const limites = obtenerLimitesCajaVerde();
    if (!limites) return;
    if (posicionJugador.x === null || posicionJugador.y === null) {
        posicionJugador.x = (limites.minX + limites.maxX) / 2;
        posicionJugador.y = (limites.minY + limites.maxY) / 2;
    }

    let dx = 0, dy = 0;
    if (teclasPulsadas.has("ArrowLeft") || teclasPulsadas.has("a")) dx--;
    if (teclasPulsadas.has("ArrowRight") || teclasPulsadas.has("d")) dx++;
    if (teclasPulsadas.has("ArrowUp") || teclasPulsadas.has("w")) dy--;
    if (teclasPulsadas.has("ArrowDown") || teclasPulsadas.has("s")) dy++;
    if (dx === 0 && dy === 0) {
        dx = ultimaDireccionMovimiento.x;
        dy = ultimaDireccionMovimiento.y;
    }
    const modulo = Math.hypot(dx, dy) || 1;
    dx /= modulo;
    dy /= modulo;

    dashOrigen = { x: posicionJugador.x, y: posicionJugador.y };
    dashDestino = {
        x: Math.max(limites.minX, Math.min(posicionJugador.x + dx * DISTANCIA_DASH, limites.maxX)),
        y: Math.max(limites.minY, Math.min(posicionJugador.y + dy * DISTANCIA_DASH, limites.maxY))
    };
    if (Math.hypot(dashDestino.x - dashOrigen.x, dashDestino.y - dashOrigen.y) < 4) {
        dashOrigen = dashDestino = null;
        return;
    }

    dashInicio = ahora;
    dashHasta = ahora + DURACION_DASH;
    dashSiguienteEstela = ahora;
    document.body.classList.add("dash-activo");
}

function moverJugador() {
    if (!alma || jugadorMuerto || juegoFinalizado) return;

    const ahora = Date.now();

    // Fuente de curación independiente: se acumula con la del Alma Verde.
    if (ayudanteApoyoComprado) {
        if (ultimaCuracionApoyo <= 0) ultimaCuracionApoyo = ahora;
        const ticksApoyo = Math.floor((ahora - ultimaCuracionApoyo) / 1000);
        if (ticksApoyo > 0) {
            ultimaCuracionApoyo += ticksApoyo * 1000;
            const vidaAnterior = vidaJugador;
            vidaJugador = Math.min(
                maxVida(),
                vidaJugador + ticksApoyo * CURACION_ALMA_VERDE * (growUpApoyoComprado ? 2 : 1)
            );
            if (vidaJugador !== vidaAnterior) actualizarBarraVida();
        }
    }

    if (ahora < dashHasta && dashOrigen && dashDestino) {
        if (ahora >= dashSiguienteEstela) {
            crearImagenResidualDash();
            dashSiguienteEstela = ahora + INTERVALO_ESTELA_DASH;
        }
        const progreso = Math.min(1, (ahora - dashInicio) / DURACION_DASH);
        const suavizado = 1 - Math.pow(1 - progreso, 2);
        posicionJugador.x = dashOrigen.x + (dashDestino.x - dashOrigen.x) * suavizado;
        posicionJugador.y = dashOrigen.y + (dashDestino.y - dashOrigen.y) * suavizado;
        alma.style.left = `${posicionJugador.x}px`;
        alma.style.top = `${posicionJugador.y}px`;
        actualizarOrientacionAlma();
        return;
    }
    if (dashHasta > 0 && ahora >= dashHasta) {
        if (dashDestino) {
            posicionJugador.x = dashDestino.x;
            posicionJugador.y = dashDestino.y;
            alma.style.left = `${posicionJugador.x}px`;
            alma.style.top = `${posicionJugador.y}px`;
        }
        dashHasta = 0;
        dashInicio = 0;
        dashOrigen = null;
        dashDestino = null;
        document.body.classList.remove("dash-activo");
    }

    const limites = obtenerLimitesCajaVerde();
    if (!limites) return;

    const { minX, minY, maxX, maxY } = limites;

    if (almaActiva === "verde") {
        // El alma verde bloquea el movimiento, pero conserva la última posición.
        // Solo se inicializa en el centro si todavía no existe una posición.
        if (posicionJugador.x === null || posicionJugador.y === null) {
            posicionJugador.x = (minX + maxX) / 2;
            posicionJugador.y = (minY + maxY) / 2;
        }
        posicionJugador.x = Math.max(minX, Math.min(posicionJugador.x, maxX));
        posicionJugador.y = Math.max(minY, Math.min(posicionJugador.y, maxY));
        alma.style.left = `${posicionJugador.x}px`;
        alma.style.top = `${posicionJugador.y}px`;
        if (ahora - ultimaCuracionVerde >= 1000) {
            ultimaCuracionVerde = ahora;
            vidaJugador = Math.min(maxVida(), vidaJugador + CURACION_ALMA_VERDE);
            actualizarBarraVida();
        }
        return;
    }

    if (posicionJugador.x === null || posicionJugador.y === null) {
        posicionJugador.x = (minX + maxX) / 2;
        posicionJugador.y = (minY + maxY) / 2;
    }

    // ÚNICO control de posición: teclado WASD / flechas.
    // El ratón NUNCA mueve left/top del alma.
    let dx = 0;
    let dy = 0;

    if (teclasPulsadas.has("ArrowLeft")  || teclasPulsadas.has("a")) dx--;
    if (teclasPulsadas.has("ArrowRight") || teclasPulsadas.has("d")) dx++;
    if (teclasPulsadas.has("ArrowUp")    || teclasPulsadas.has("w")) dy--;
    if (teclasPulsadas.has("ArrowDown")  || teclasPulsadas.has("s")) dy++;

    if (dx !== 0 || dy !== 0) {
        if (dx !== 0 && dy !== 0) {
            dx *= Math.SQRT1_2;
            dy *= Math.SQRT1_2;
        }
        ultimaDireccionMovimiento = { x: dx, y: dy };

        posicionJugador.x = Math.max(
            minX,
            Math.min(posicionJugador.x + dx * VELOCIDAD_JUGADOR, maxX)
        );
        posicionJugador.y = Math.max(
            minY,
            Math.min(posicionJugador.y + dy * VELOCIDAD_JUGADOR, maxY)
        );
    } else {
        // Mantener dentro de límites aunque no haya input
        posicionJugador.x = Math.max(minX, Math.min(posicionJugador.x, maxX));
        posicionJugador.y = Math.max(minY, Math.min(posicionJugador.y, maxY));
    }

    // Posición fija en el layout (independiente de la rotación)
    alma.style.left = `${posicionJugador.x}px`;
    alma.style.top = `${posicionJugador.y}px`;

    actualizarOrientacionAlma();
}

function actualizarOrientacionAlma() {
    if (!alma) return;

    if (almaActiva !== "dorada" || posicionRaton.x === null) {
        alma.style.removeProperty("transform");
        alma.style.removeProperty("transform-origin");
        return;
    }

    const juego = alma.parentElement;
    if (!juego || posicionJugador.x === null) return;

    const juegoRect = juego.getBoundingClientRect();
    const layoutW = 22;
    const layoutH = 22;

    // Pivote = punta del corazón (borde inferior del diamante a 45°)
    // Coordenadas de la punta en el layout, sin rotación
    const tipX = juegoRect.left + posicionJugador.x + layoutW / 2;
    const tipY = juegoRect.top + posicionJugador.y + layoutH;

    const dx = posicionRaton.x - tipX;
    const dy = posicionRaton.y - tipY;

    // Ángulo desde la punta hacia el ratón
    const angulo = Math.atan2(dy, dx) * (180 / Math.PI);

    // Forma base del corazón: rotate(45deg) → punta hacia abajo (90°).
    // Queremos que la punta mire a `angulo`:
    //   rotacion = 45 + (angulo - 90) = angulo - 45
    const rotacion = angulo - 45;

    // Anclar el giro en la punta (abajo del elemento)
    alma.style.setProperty("transform-origin", "50% 100%", "important");
    alma.style.setProperty(
        "transform",
        `rotate(${rotacion}deg)`,
        "important"
    );
} 

function cambiarAlma() {
    // Q alterna entre el alma roja y la dorada. El alma verde se activa con E.
    if (almaActiva === "verde") {
        almaActiva = "roja";
    } else if (!almaDoradaDesbloqueada) {
        almaActiva = "roja";
    } else {
        almaActiva = almaActiva === "roja" ? "dorada" : "roja";
    }

    if (alma) {
        alma.classList.toggle("alma-dorada", almaActiva === "dorada");
        alma.classList.toggle("alma-verde", almaActiva === "verde");
    }

    if (boton) {
        boton.classList.toggle("modo-dorado", almaActiva === "dorada");
        boton.classList.toggle("modo-verde", almaActiva === "verde");
    }

    if (almaActiva === "verde") {
        // No cambiar posicionJugador aquí: debe quedarse donde estaba al pulsar E.
        ultimaCuracionVerde = Date.now();
    }

    actualizarOrientacionAlma();
    actualizarVisibilidadAyudantes();
    actualizarInterfaz();

    const mensajes = {
        roja: "ALMA ROJA: movimiento libre y ayudantes activos.",
        dorada: "ALMA DORADA: ratón para apuntar · clic para disparar.",
        verde: "ALMA VERDE: te quedas inmóvil donde estabas y recuperas 5 HP por segundo."
    };
    mostrarAvisoRobo(mensajes[almaActiva]);
}

// Disparos del Alma Dorada (líneas hacia el cursor)
function obtenerPosicionAlmaViewport() {
    if (alma) {
        const r = alma.getBoundingClientRect();
        return {
            x: r.left + r.width / 2,
            y: r.top + r.height / 2
        };
    }

    if (boton) {
        const r = boton.getBoundingClientRect();
        return {
            x: r.left + r.width / 2,
            y: r.top + r.height / 2
        };
    }

    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

function crearEstelaProyectil(colorGlow) {
    const estela = document.createElement("span");
    estela.className = "proyectil-estela";
    estela.setAttribute("aria-hidden", "true");
    estela.style.setProperty("--proy-glow", colorGlow || "#ffffff");
    return estela;
}

function actualizarEstela(estela, x, y, x0, y0, q) {
    if (!estela) return;
    const dx = x - x0;
    const dy = y - y0;
    const len = Math.hypot(dx, dy);
    if (len < 4 || q < 0.02) {
        estela.style.opacity = "0";
        return;
    }
    const ang = Math.atan2(dy, dx) * (180 / Math.PI);
    // Estela detrás del rombo: anclada al centro actual, extendida hacia atrás
    const trailLen = Math.min(42, 12 + len * 0.10);
    estela.style.width = `${trailLen}px`;
    estela.style.left = `${x}px`;
    estela.style.top = `${y}px`;
    estela.style.transform = `translate(-100%, -50%) rotate(${ang}deg)`;
    estela.style.opacity = String(0.95 * (1 - q * 0.55));
}

function crearUnaBalaJugador(x0, y0, x1, y1, golpesCompartidos = null, registrarHistorial = true) {
    const p = crearElemento("span", "proyectil-jugador proyectil-bala-deltarune");
    p.setAttribute("aria-hidden", "true");

    Object.assign(p.style, {
        position: "fixed",
        left: `${x0}px`,
        top: `${y0}px`,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: "15"
    });

    const estela = crearEstelaProyectil("#ffd700");
    Object.assign(estela.style, {
        position: "fixed",
        left: `${x0}px`,
        top: `${y0}px`,
        opacity: "0"
    });

    document.body.appendChild(estela);
    document.body.appendChild(p);

    const danioDisparo = obtenerDanioAlmaDorada();
    if (registrarHistorial) registrarDisparoJugador(danioDisparo);
    proyectilesJugador.push({
        id: siguienteIdProyectil++,
        elemento: p,
        estela,
        inicio: Date.now(),
        duracion: 280,
        danio: danioDisparo,
        x0,
        y0,
        x1,
        y1,
        linea: false,
        // Escopeta: mismas marcas de impacto entre las 5 balas → 1 golpe por enemigo.
        golpes: golpesCompartidos || new Set()
    });
}

function crearProyectilJugador(dirX, dirY) {
    if (
        juegoFinalizado ||
        almaActiva !== "dorada" ||
        !almaDoradaDesbloqueada ||
        jugadorMuerto
    ) {
        return;
    }

    const origen = obtenerPosicionAlmaViewport();
    const x0 = origen.x;
    const y0 = origen.y;

    // Dirección: argumento explícito, última posición del ratón, o arriba
    let x1 = dirX !== undefined && dirX !== null ? dirX : posicionRaton.x;
    let y1 = dirY !== undefined && dirY !== null ? dirY : posicionRaton.y;

    if (x1 === null || y1 === null || x1 === undefined || y1 === undefined) {
        x1 = x0;
        y1 = y0 - 400;
    }

    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.hypot(dx, dy) || 1;
    const alcance = Math.max(400, Math.min(700, dist * 1.4));
    const anguloBase = Math.atan2(dy, dx);

    // Escopeta: un solo disparo, 5 balas en abanico desde el mismo punto.
    // Mismo daño por bala, pero solo una bala puede impactar al mismo enemigo
    // por disparo (así no multiplica ×5 el daño a un solo blanco).
    if (escopetaDesbloqueada) {
        const golpesVolley = new Set();
        const abanico = [-0.30, -0.15, 0, 0.15, 0.30];
        abanico.forEach((offset, i) => {
            const a = anguloBase + offset;
            crearUnaBalaJugador(
                x0,
                y0,
                x0 + Math.cos(a) * alcance,
                y0 + Math.sin(a) * alcance,
                golpesVolley,
                i === 0 // historial de daño: 1 vez por disparo, no ×5
            );
        });
        return;
    }

    crearUnaBalaJugador(
        x0,
        y0,
        x0 + (dx / dist) * alcance,
        y0 + (dy / dist) * alcance
    );
}

function proyectilTocaRect(x, y, radio, rect) {
    const cercanoX = Math.max(rect.left, Math.min(x, rect.right));
    const cercanoY = Math.max(rect.top, Math.min(y, rect.bottom));
    const dx = x - cercanoX;
    const dy = y - cercanoY;
    return dx * dx + dy * dy <= radio * radio;
}

function actualizarProyectilesJugador() {
    const now = Date.now();

    proyectilesJugador = proyectilesJugador.filter(p => {
        if (p.helper) return true;

        const q = Math.min(1, (now - p.inicio) / p.duracion);
        const x = p.x0 + (p.x1 - p.x0) * q;
        const y = p.y0 + (p.y1 - p.y0) * q;

        p.elemento.style.position = "fixed";
        p.elemento.style.left = `${x}px`;
        p.elemento.style.top = `${y}px`;
        p.elemento.style.transform = "translate(-50%, -50%)";

        actualizarEstela(p.estela, x, y, p.x0, p.y0, q);

        // Colisión continua con enemigos y jefe
        const radioHit = 10;

        for (const e of enemigos) {
            if (e.derrotado || p.golpes?.has(`e${e.id}`)) continue;

            const r = e.elemento.getBoundingClientRect();

            if (proyectilTocaRect(x, y, radioHit, r)) {
                p.golpes.add(`e${e.id}`);
                atacarEnemigo(e, p.danio || obtenerDanioAlmaDorada());
            }
        }

        if (jefe && !jefe.derrotado && !p.golpes?.has(`j${jefe.id}`)) {
            const r = jefe.elemento.getBoundingClientRect();

            if (proyectilTocaRect(x, y, radioHit, r)) {
                p.golpes.add(`j${jefe.id}`);
                atacarJefe(p.danio || obtenerDanioAlmaDorada());
            }
        }

        if (q < 1) return true;

        p.elemento.remove();
        if (p.estela) p.estela.remove();
        return false;
    });
}

// Disparos enemigos: patrones variados (dirigido, abanico, ráfaga, anillo, ola, combinados)
// Reutiliza el sistema de proyectiles y colisiones existente.

function obtenerColorDisparoEnemigo(esJefe, enemigoOrigen = null) {
    if (esJefe) return "#FF1744";
    if (enemigoOrigen && enemigoOrigen.elemento) {
        const color = enemigoOrigen.elemento.style.getPropertyValue("--color-enemigo").trim();
        if (color) return color;
    }
    return COLORES_ENEMIGOS[Math.floor(Math.random() * COLORES_ENEMIGOS.length)];
}

function obtenerOrigenDisparoEnemigo(esJefe, enemigoOrigen = null) {
    if (esJefe && jefe && jefe.elemento) {
        const r = jefe.elemento.getBoundingClientRect();
        return {
            x: r.left + r.width / 2,
            y: r.top + r.height / 2
        };
    }

    // En las descargas coordinadas, cada enemigo dispara desde su propia posición.
    if (enemigoOrigen && !enemigoOrigen.derrotado && enemigoOrigen.elemento) {
        const r = enemigoOrigen.elemento.getBoundingClientRect();
        return {
            x: r.left + r.width / 2,
            y: r.top + r.height / 2
        };
    }

    // Preferir la posición de un enemigo vivo si hay
    if (enemigos.length > 0) {
        const vivos = enemigos.filter(e => !e.derrotado && e.elemento);
        if (vivos.length > 0) {
            const e = vivos[Math.floor(Math.random() * vivos.length)];
            const r = e.elemento.getBoundingClientRect();
            return {
                x: r.left + r.width / 2,
                y: r.top + r.height / 2
            };
        }
    }

    // Fallback: borde superior aleatorio
    return {
        x: Math.random() * window.innerWidth,
        y: 0
    };
}

function spawnProyectilEnemigo(x0, y0, x1, y1, esJefe, opts = {}) {
    if (jugadorMuerto) return;

    // Visualmente todos son rombos neón; el movimiento es siempre puntual.
    // Se conserva la duración/daño/radio originales de cada patrón.
    const danio = opts.danio != null
        ? opts.danio
        : (esJefe ? 15 : 8);
    const duracion = opts.duracion != null
        ? opts.duracion
        : (esJefe ? 900 : 1300);
    const radio = opts.radio != null ? opts.radio : 12;

    const clases = esJefe
        ? "proyectil-enemigo proyectil-jefe"
        : "proyectil-enemigo";
    const el = crearElemento("span", clases);
    el.setAttribute("aria-hidden", "true");

    let colorEmisor = null;
    if (!esJefe && !opts.color) {
        let distanciaMinima = Infinity;
        for (const emisor of enemigos) {
            if (!emisor || emisor.derrotado || !emisor.elemento || !emisor.elemento.isConnected) continue;
            const r = emisor.elemento.getBoundingClientRect();
            const dx = r.left + r.width / 2 - x0;
            const dy = r.top + r.height / 2 - y0;
            const distancia = dx * dx + dy * dy;
            if (distancia < distanciaMinima) {
                distanciaMinima = distancia;
                colorEmisor = emisor.elemento.style.getPropertyValue("--color-enemigo").trim();
            }
        }
    }
    const colorBala = opts.color || (esJefe ? "#FF1744" : (colorEmisor || COLORES_ENEMIGOS[Math.floor(Math.random() * COLORES_ENEMIGOS.length)]));
    const glow = colorBala;
    el.style.setProperty("--proy-nucleo", colorBala);
    el.style.setProperty("--proy-borde", colorBala);
    el.style.setProperty("--proy-glow", colorBala);

    Object.assign(el.style, {
        position: "fixed",
        left: `${x0}px`,
        top: `${y0}px`,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: "15"
    });

    const estela = crearEstelaProyectil(glow);
    Object.assign(estela.style, {
        position: "fixed",
        left: `${x0}px`,
        top: `${y0}px`,
        opacity: "0"
    });

    document.body.appendChild(estela);
    document.body.appendChild(el);

    proyectilesEnemigos.push({
        elemento: el,
        estela,
        inicio: Date.now(),
        duracion,
        x0,
        y0,
        x1,
        y1,
        danio,
        radio,
        linea: false,
        impactoRegistrado: false
    });
}

function extenderHacia(x0, y0, x1, y1, extra = 40) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.hypot(dx, dy) || 1;
    return {
        x: x0 + (dx / dist) * (dist + extra),
        y: y0 + (dy / dist) * (dist + extra)
    };
}

function direccionHaciaAlma(x0, y0) {
    const corazon = obtenerPosicionAlmaViewport();
    return { x: corazon.x, y: corazon.y };
}

// --- PATRONES ---

function patronDirigido(esJefe, enemigoOrigen = null) {
    const origen = obtenerOrigenDisparoEnemigo(esJefe, enemigoOrigen);
    const target = direccionHaciaAlma(origen.x, origen.y);
    const end = extenderHacia(origen.x, origen.y, target.x, target.y, 50);
    const opts = { color: obtenerColorDisparoEnemigo(esJefe, enemigoOrigen), linea: true, danio: esJefe ? 15 : 8, duracion: esJefe ? 850 : 1200 };
    // El disparo dirigido no muestra indicador.
    spawnProyectilEnemigo(origen.x, origen.y, end.x, end.y, esJefe, opts);
}

function patronAbanico(esJefe, cantidad = null, enemigoOrigen = null) {
    const origen = obtenerOrigenDisparoEnemigo(esJefe, enemigoOrigen);
    const target = direccionHaciaAlma(origen.x, origen.y);
    const baseAng = Math.atan2(target.y - origen.y, target.x - origen.x);
    const n = cantidad != null ? cantidad : (esJefe ? 5 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 2));
    const spread = esJefe ? 0.55 : 0.42;
    const alcance = esJefe ? 620 : 520;
    const disparos = [];
    for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const ang = baseAng + (t - 0.5) * spread;
        disparos.push({ x0: origen.x, y0: origen.y, x1: origen.x + Math.cos(ang) * alcance, y1: origen.y + Math.sin(ang) * alcance,
            opts: { color: obtenerColorDisparoEnemigo(esJefe, enemigoOrigen), linea: true, danio: esJefe ? 12 : 7, duracion: esJefe ? 900 : 1250 } });
    }
    mostrarIndicadoresDeTrayectorias(disparos, esJefe, () => disparos.forEach(d => spawnProyectilEnemigo(d.x0,d.y0,d.x1,d.y1,esJefe,d.opts)));
}

function patronRafaga(esJefe, cantidad = null, enemigoOrigen = null) {
    const n = cantidad != null ? cantidad : (esJefe ? 4 : 3);
    const intervalo = esJefe ? 110 : 140;
    const origen = obtenerOrigenDisparoEnemigo(esJefe, enemigoOrigen);
    for (let i=0;i<n;i++) setTimeout(() => {
        if (jugadorMuerto) return;
        const target = direccionHaciaAlma(origen.x, origen.y);
        const end = extenderHacia(origen.x, origen.y, target.x, target.y, 50);
        spawnProyectilEnemigo(origen.x, origen.y, end.x, end.y, esJefe, {color: obtenerColorDisparoEnemigo(esJefe, enemigoOrigen),linea:true,danio:esJefe?15:8,duracion:esJefe?850:1200});
    }, i*intervalo);
}

function patronAnillo(esJefe, cantidad = null, enemigoOrigen = null) {
    let cx, cy;
    if (!esJefe && enemigoOrigen && !enemigoOrigen.derrotado && enemigoOrigen.elemento) {
        const origen = obtenerOrigenDisparoEnemigo(false, enemigoOrigen);
        cx = origen.x;
        cy = origen.y;
    } else if (esJefe && jefe && jefe.elemento) {
        const r = jefe.elemento.getBoundingClientRect(); cx = r.left + r.width/2; cy = r.top + r.height/2;
    } else { cx = window.innerWidth*(0.3+Math.random()*0.4); cy = window.innerHeight*0.18+Math.random()*40; }
    const n = cantidad != null ? cantidad : (esJefe ? 10+Math.floor(Math.random()*3) : 7+Math.floor(Math.random()*2));
    const alcance = esJefe ? 480 : 400, duracion = esJefe ? 1100 : 1400, danio = esJefe ? 11 : 7;
    const color = obtenerColorDisparoEnemigo(esJefe, enemigoOrigen);
    const disparos=[];
    for(let i=0;i<n;i++) { const ang=(i/n)*Math.PI*2+Math.random()*0.08;
        disparos.push({x0:cx,y0:cy,x1:cx+Math.cos(ang)*alcance,y1:cy+Math.sin(ang)*alcance,opts:{color,linea:false,danio,duracion,radio:esJefe?14:11}});
    }
    // El aviso del anillo usa el mismo color que todos sus proyectiles.
    if (jugadorMuerto) return;
    const aviso = crearElemento("div", "aviso-circulo-ataque");
    aviso.setAttribute("aria-hidden", "true");
    aviso.textContent = "!";
    Object.assign(aviso.style, {
        position: "fixed", left: `${cx}px`, top: `${cy}px`, transform: "translate(-50%, -50%)",
        width: "42px", height: "42px", boxSizing: "border-box", display: "flex",
        alignItems: "center", justifyContent: "center", color, fontSize: "30px",
        fontWeight: "900", lineHeight: "1", border: `3px dotted ${color}`, borderRadius: "3px",
        background: `color-mix(in srgb, ${color} 8%, transparent)`, textShadow: `0 0 5px ${color}`,
        zIndex: "99999", pointerEvents: "none"
    });
    document.body.appendChild(aviso);
    setTimeout(() => {
        aviso.remove();
        if (!jugadorMuerto) disparos.forEach(d=>spawnProyectilEnemigo(d.x0,d.y0,d.x1,d.y1,esJefe,d.opts));
    }, esJefe ? 460 : 400);
}

function patronOla(esJefe, enemigoOrigen = null) {
    // Lluvia más estrecha y lenta, claramente distinta del abanico/escopeta.
    const n = esJefe ? 10 + Math.floor(Math.random() * 3) : 7 + Math.floor(Math.random() * 3);
    const huecos = esJefe ? 2 : 1;
    const indicesHueco = new Set();
    while (indicesHueco.size < huecos) indicesHueco.add(1 + Math.floor(Math.random() * (n - 2)));

    const margen = 40;
    let ancho = esJefe ? Math.min(280, Math.max(210, window.innerWidth - margen * 2)) : Math.min(190, Math.max(130, window.innerWidth - margen * 2));
    let xInicio = (window.innerWidth - ancho) / 2;
    let y0 = 8 + Math.random() * 25;

    if (!esJefe && enemigoOrigen && !enemigoOrigen.derrotado && enemigoOrigen.elemento) {
        const origen = obtenerOrigenDisparoEnemigo(false, enemigoOrigen);
        xInicio = Math.max(margen, Math.min(origen.x - ancho / 2, window.innerWidth - margen - ancho));
        y0 = Math.max(8, Math.min(origen.y - 25, window.innerHeight * 0.30));
    }

    const disparos = [];
    const almaPos = obtenerPosicionAlmaViewport();
    for (let i = 0; i < n; i++) {
        if (indicesHueco.has(i)) continue;
        const x0 = xInicio + (i / (n - 1)) * ancho;
        // Todos los proyectiles convergen hacia la posición actual del jugador,
        // con una dispersión pequeña para mantener rutas legibles.
        const x1 = almaPos.x + (Math.random() - 0.5) * 12;
        const y1 = almaPos.y + (Math.random() - 0.5) * 12;
        disparos.push({
            x0, y0, x1, y1,
            opts: {
                color: obtenerColorDisparoEnemigo(esJefe, enemigoOrigen),
                linea: false,
                danio: esJefe ? 11 : 6,
                duracion: (esJefe ? 1850 : 2050) + Math.floor(Math.random() * 140),
                radio: esJefe ? 9 : 8
            }
        });
    }
    mostrarIndicadoresDeTrayectorias(disparos, esJefe, () => {
        disparos.forEach(d => spawnProyectilEnemigo(d.x0, d.y0, d.x1, d.y1, esJefe, d.opts));
    }, true);
}

// Ataque de pantalla completa desde un borde aleatorio. Hexagonial lo repite
// un segundo después desde un lado distinto; los minijefes solo una vez.
function obtenerHuecosSegurosBorde(lado, cantidadCarriles) {
    // Los huecos se calculan usando el cuadro verde del jugador, no la pantalla.
    const rect = boton?.getBoundingClientRect();
    const fallback = {
        left: window.innerWidth / 2 - 120,
        right: window.innerWidth / 2 + 120,
        top: window.innerHeight / 2 - 120,
        bottom: window.innerHeight / 2 + 120
    };
    const caja = rect && rect.width > 0 && rect.height > 0 ? rect : fallback;
    const vertical = lado === "arriba" || lado === "abajo";
    const inicioCaja = vertical ? caja.left : caja.top;
    const finCaja = vertical ? caja.right : caja.bottom;
    const extension = vertical ? window.innerWidth : window.innerHeight;
    const paso = extension / cantidadCarriles;
    const candidatos = [];

    for (let i = 0; i < cantidadCarriles; i++) {
        const posicion = (i + 0.5) * paso;
        if (posicion >= inicioCaja + 8 && posicion <= finCaja - 8) candidatos.push(i);
    }

    // Cada hueco debe permitir que quepa el alma completa, más el radio
    // de la bala y un pequeño margen para que no haya impactos por rozamiento.
    const almaRect = alma?.getBoundingClientRect();
    const tamAlma = almaRect && almaRect.width > 0
        ? Math.max(almaRect.width, almaRect.height)
        : 31;
    const radioBala = 11;
    const anchoHueco = tamAlma + radioBala * 2 + 10;
    const mitadHueco = anchoHueco / 2;

    // Hasta tres huecos anchos, centrados dentro del cuadro verde.
    const huecos = new Set();
    const objetivos = [0.25, 0.5, 0.75].map(f => inicioCaja + (finCaja - inicioCaja) * f);
    for (const objetivo of objetivos) {
        if (!candidatos.length) break;
        let centro = candidatos[0];
        let distancia = Infinity;
        for (const indice of candidatos) {
            const posicion = (indice + 0.5) * paso;
            const d = Math.abs(posicion - objetivo);
            if (d < distancia) { distancia = d; centro = indice; }
        }
        const centroX = (centro + 0.5) * paso;
        for (const indice of candidatos) {
            const posicion = (indice + 0.5) * paso;
            if (Math.abs(posicion - centroX) <= mitadHueco) huecos.add(indice);
        }
    }
    return huecos;
}

// Ataque de pantalla completa desde un borde aleatorio. Los únicos carriles
// seguros quedan dentro del cuadro verde; Hexagonial repite desde otro lado.
function patronBorde(esJefe, enemigoOrigen = null, esJefePrincipal = false) {
    const lados = ["arriba", "abajo", "izquierda", "derecha"];
    const primerLado = lados[Math.floor(Math.random() * lados.length)];
    const color = obtenerColorDisparoEnemigo(esJefe, enemigoOrigen);

    const lanzarDesdeLado = lado => {
        if (jugadorMuerto) return;
        const vertical = lado === "arriba" || lado === "abajo";
        const extension = vertical ? window.innerWidth : window.innerHeight;
        const separacion = 30;
        const n = Math.max(12, Math.ceil(extension / separacion));
        const huecos = obtenerHuecosSegurosBorde(lado, n);
        const disparos = [];

        for (let i = 0; i < n; i++) {
            if (huecos.has(i)) continue;
            const t = (i + 0.5) / n;
            let x0, y0, x1, y1;
            if (lado === "arriba") { x0 = t * window.innerWidth; y0 = -18; x1 = x0; y1 = window.innerHeight + 18; }
            else if (lado === "abajo") { x0 = t * window.innerWidth; y0 = window.innerHeight + 18; x1 = x0; y1 = -18; }
            else if (lado === "izquierda") { x0 = -18; y0 = t * window.innerHeight; x1 = window.innerWidth + 18; y1 = y0; }
            else { x0 = window.innerWidth + 18; y0 = t * window.innerHeight; x1 = -18; y1 = y0; }
            disparos.push({
                x0, y0, x1, y1,
                opts: {
                    color, linea: false,
                    danio: esJefe ? 12 : 7,
                    duracion: esJefe ? 1450 : 1650,
                    radio: esJefe ? 11 : 9
                }
            });
        }

        mostrarIndicadoresDeTrayectorias(disparos, esJefe, () => {
            if (esJefe && (!jefe || jefe.derrotado)) return;
            disparos.forEach(d => spawnProyectilEnemigo(d.x0, d.y0, d.x1, d.y1, esJefe, d.opts));
        }, true);
    };

    lanzarDesdeLado(primerLado);
    if (esJefePrincipal) {
        setTimeout(() => {
            if (jugadorMuerto || !jefe || jefe.derrotado || jefe.tipo !== "hexagonial") return;
            const restantes = lados.filter(lado => lado !== primerLado);
            lanzarDesdeLado(restantes[Math.floor(Math.random() * restantes.length)]);
        }, 1000);
    }
}

function patronCombinadoJefe() {
    // Combinaciones más complejas solo para jefes; dificultad progresiva
    const nivel = jefesDerrotadosRun;
    const roll = Math.random();

    if (nivel >= 4 && roll < 0.28) {
        // Anillo + abanico
        patronAnillo(true, 9 + Math.min(4, nivel));
        setTimeout(() => {
            if (!jugadorMuerto) patronAbanico(true, 5);
        }, 280);
    } else if (nivel >= 2 && roll < 0.50) {
        // Ráfaga + ola
        patronRafaga(true, 3);
        setTimeout(() => {
            if (!jugadorMuerto) patronOla(true);
        }, 320);
    } else if (roll < 0.72) {
        // Doble abanico desde lados ligeramente distintos
        patronAbanico(true, 4);
        setTimeout(() => {
            if (!jugadorMuerto) patronAbanico(true, 4);
        }, 220);
    } else {
        // Anillo denso + dirigido
        patronAnillo(true, 11);
        setTimeout(() => {
            if (!jugadorMuerto) patronDirigido(true);
        }, 180);
    }
}

// ATAQUE NUEVO: cruz láser centrada en una posición aleatoria fija (no sigue al jugador).
function patronLaserCruz(esJefe, enemigoOrigen = null) {
    if (jugadorMuerto) return;
    let x = window.innerWidth * (0.18 + Math.random() * 0.64);
    let y = window.innerHeight * (0.18 + Math.random() * 0.58);
    if (!esJefe && enemigoOrigen && !enemigoOrigen.derrotado && enemigoOrigen.elemento) {
        const origen = obtenerOrigenDisparoEnemigo(false, enemigoOrigen); x = origen.x; y = origen.y;
    }
    const color = obtenerColorDisparoEnemigo(esJefe, enemigoOrigen);
    const aviso = crearElemento("div", "aviso-cruz-laser");
    Object.assign(aviso.style, { position: "fixed", left: `${x}px`, top: `${y}px`, width: "30px", height: "30px", transform: "translate(-50%,-50%)", border: `2px dotted ${color}`, boxShadow: `0 0 7px ${color}`, zIndex: "99999", pointerEvents: "none" });
    document.body.appendChild(aviso);
    setTimeout(() => {
        aviso.remove(); if (jugadorMuerto) return;
        const anchoPantalla = window.innerWidth;
        const altoPantalla = window.innerHeight;
        const grosor = 14;
        // Cuatro brazos independientes: cada uno nace en un borde y termina justo en el centro.
        [
            [0, y - grosor / 2, x, grosor],
            [x, y - grosor / 2, anchoPantalla - x, grosor],
            [x - grosor / 2, 0, grosor, y],
            [x - grosor / 2, y, grosor, altoPantalla - y]
        ].forEach(([left,top,width,height]) => {
            const haz = crearElemento("div", "laser-continuo-enemigo");
            Object.assign(haz.style, { position: "fixed", left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`, background: color, boxShadow: `0 0 7px ${color}, 0 0 16px ${color}`, opacity: "0.95", zIndex: "99997", pointerEvents: "none" });
            document.body.appendChild(haz);
            zonasLaserActivas.push({ elemento: haz, fin: Date.now() + 2600, siguienteDanio: 0, danio: esJefe ? 18 : 12 });
        });
    }, esJefe ? 550 : 650);
}

// ATAQUE NUEVO: embestida dirigida hacia la posición del jugador al iniciar.
function patronEmbestida(esJefe, enemigoOrigen = null) {
    const o = obtenerOrigenDisparoEnemigo(esJefe, enemigoOrigen);
    const t = direccionHaciaAlma(o.x,o.y);
    const end = extenderHacia(o.x,o.y,t.x,t.y,80);
    const color = obtenerColorDisparoEnemigo(esJefe, enemigoOrigen);
    const aviso = crearElemento("div", "indicador-ataque-punto");
    Object.assign(aviso.style,{position:"fixed",left:`${t.x}px`,top:`${t.y}px`,width:"26px",height:"26px",border:`2px dotted ${color}`,background:`color-mix(in srgb, ${color} 22%, transparent)`,boxShadow:`0 0 7px ${color}, 0 0 14px ${color}`,transform:"translate(-50%,-50%)",zIndex:"99999",pointerEvents:"none"});
    document.body.appendChild(aviso);
    setTimeout(()=>{aviso.remove();spawnProyectilEnemigo(o.x,o.y,end.x,end.y,esJefe,{color,linea:true,danio:esJefe?20:12,duracion:esJefe?450:600,radio:17});},400);
}

// ATAQUE NUEVO: espiral de proyectiles con aviso previo de cada trayectoria.
// Las balas viajan en líneas rectas con ángulos consecutivos; los trazos
// punteados muestran exactamente por dónde pasará cada una antes del disparo.
function patronEspiral(esJefe, enemigoOrigen = null) {
    const o = obtenerOrigenDisparoEnemigo(esJefe, enemigoOrigen);
    const n = esJefe ? 16 : 10;
    const alcance = Math.max(window.innerWidth, window.innerHeight) * 0.8;
    const color = obtenerColorDisparoEnemigo(esJefe, enemigoOrigen);
    const avisoMs = esJefe ? 650 : 550;
    const intervalo = esJefe ? 45 : 65;
    const trayectorias = [];

    // Primero se muestran todas las rutas para que el jugador pueda leer
    // el patrón completo antes de que empiecen a salir los proyectiles.
    for (let i = 0; i < n; i++) {
        const angulo = i * 0.48;
        const indicador = crearElemento("div", "indicador-trayectoria-espiral");
        Object.assign(indicador.style, {
            position: "fixed",
            left: `${o.x}px`,
            top: `${o.y}px`,
            width: `${alcance}px`,
            height: "3px",
            transform: `rotate(${angulo}rad)`,
            transformOrigin: "0 50%",
            background: `repeating-linear-gradient(90deg, ${color} 0 5px, transparent 5px 12px)`,
            opacity: "0.78",
            filter: `drop-shadow(0 0 3px ${color})`,
            zIndex: "99996",
            pointerEvents: "none"
        });
        document.body.appendChild(indicador);
        trayectorias.push({ angulo, indicador });
    }

    setTimeout(() => {
        trayectorias.forEach(({ indicador }) => indicador.remove());
        if (jugadorMuerto) return;
        trayectorias.forEach(({ angulo }, i) => {
            setTimeout(() => {
                if (jugadorMuerto) return;
                spawnProyectilEnemigo(
                    o.x, o.y,
                    o.x + Math.cos(angulo) * alcance,
                    o.y + Math.sin(angulo) * alcance,
                    esJefe,
                    { color, danio: esJefe ? 10 : 6, duracion: esJefe ? 1050 : 1300, radio: 11 }
                );
            }, i * intervalo);
        });
    }, avisoMs);
}

// ATAQUE NUEVO: doble ráfaga con corrección de dirección entre ráfagas.
function patronDobleDirigido(esJefe, enemigoOrigen = null) {
    patronDirigido(esJefe, enemigoOrigen);
    setTimeout(()=>{if(!jugadorMuerto) patronDirigido(esJefe, enemigoOrigen);},esJefe?260:340);
}

function elegirYEjecutarPatron(esJefe, enemigosOrigen = null, esJefePrincipal = esJefe) {
    if (jugadorMuerto) return;
    const nivel = jefesDerrotadosRun;
    const r = Math.random();

    if (esJefe) {
        // Minijefes conservan la selección potente de los antiguos jefes.
        if (nivel >= 1 && r < 0.18) {
            patronCombinadoJefe();
        } else if (r < 0.34) {
            patronAbanico(true);
        } else if (r < 0.48) {
            patronRafaga(true);
        } else if (r < 0.62) {
            patronAnillo(true);
        } else if (r < 0.74) {
            patronOla(true);
        } else if (r < 0.86) {
            patronBorde(true, null, esJefePrincipal);
        } else if (r < 0.92) {
            patronLaserCruz(true);
        } else if (r < 0.96) {
            patronEmbestida(true);
        } else {
            patronEspiral(true);
        }
        return;
    }

    const emisores = Array.isArray(enemigosOrigen)
        ? enemigosOrigen.filter(e => e && !e.derrotado && e.elemento)
        : enemigosOrigen && !enemigosOrigen.derrotado
            ? [enemigosOrigen]
            : enemigos.filter(e => e && !e.derrotado && e.elemento);

    const ejecutarPorEmisor = ataque => {
        if (emisores.length) emisores.forEach(emisor => ataque(emisor));
        else ataque(null);
    };

    // Probabilidades fijas: todos los ataques mantienen una frecuencia reconocible.
    if (r < 0.18) {
        ejecutarPorEmisor(emisor => patronDirigido(false, emisor));
    } else if (r < 0.26) {
        ejecutarPorEmisor(emisor => patronDobleDirigido(false, emisor));
    } else if (r < 0.43) {
        ejecutarPorEmisor(emisor => patronAbanico(false, null, emisor));
    } else if (r < 0.57) {
        ejecutarPorEmisor(emisor => patronRafaga(false, null, emisor));
    } else if (r < 0.70) {
        ejecutarPorEmisor(emisor => patronOla(false, emisor));
    } else if (r < 0.81) {
        ejecutarPorEmisor(emisor => patronAnillo(false, null, emisor));
    } else if (r < 0.90) {
        patronBorde(false, emisores[0] || null, false);
    } else if (r < 0.95) {
        ejecutarPorEmisor(emisor => patronLaserCruz(false, emisor));
    } else if (r < 0.98) {
        ejecutarPorEmisor(emisor => patronEmbestida(false, emisor));
    } else {
        ejecutarPorEmisor(emisor => patronEspiral(false, emisor));
    }
}

function mostrarIndicadoresDeTrayectorias(disparos, esJefe, alTerminar, marcarOrigen = false) {
    if (jugadorMuerto || !disparos.length) return;
    const elementos = [];
    for (const d of disparos) {
        // Cada trayectoria toma el color del proyectil que anuncia.
        const color = d.opts?.color || obtenerColorDisparoEnemigo(esJefe);
        const dx=d.x1-d.x0, dy=d.y1-d.y0, distancia=Math.hypot(dx,dy), angulo=Math.atan2(dy,dx)*(180/Math.PI);
        const linea=crearElemento("span","indicador-ataque-linea");
        linea.setAttribute("aria-hidden","true");
        Object.assign(linea.style,{position:"fixed",left:`${d.x0}px`,top:`${d.y0}px`,width:`${distancia}px`,transform:`rotate(${angulo}deg)`,transformOrigin:"0 50%","--indicador-color":color});
        document.body.appendChild(linea); elementos.push(linea);
        const marca=crearElemento("span",marcarOrigen?"indicador-ataque-origen":"indicador-ataque-punto");
        marca.setAttribute("aria-hidden","true");
        Object.assign(marca.style,{position:"fixed",left:`${d.x0}px`,top:`${d.y0}px`,"--indicador-color":color});
        document.body.appendChild(marca); elementos.push(marca);
    }
    const demora=esJefe?460:400;
    setTimeout(()=>{ elementos.forEach(el=>el.remove()); if(!jugadorMuerto) alTerminar(); },demora);
}

function dispararNormalDesdeEnemigo(enemigo) {
    if (!enemigo || enemigo.derrotado || !enemigo.elemento?.isConnected || jugadorMuerto) return;
    const origen = obtenerOrigenDisparoEnemigo(false, enemigo);
    const objetivo = obtenerPosicionAlmaViewport();
    spawnProyectilEnemigo(
        origen.x, origen.y, objetivo.x, objetivo.y, false,
        { color: obtenerColorDisparoEnemigo(false, enemigo), linea: false, danio: 8, duracion: 1100, radio: 10 }
    );
}

function dispararContraJugador(esJefe = false, enemigosOrigen = null, esJefePrincipal = esJefe) {
    if (jugadorMuerto) return;
    elegirYEjecutarPatron(esJefe, enemigosOrigen, esJefePrincipal);
}

function actualizarProyectilesEnemigos() {
    const now = Date.now();

    proyectilesEnemigos = proyectilesEnemigos.filter(p => {
        const q = Math.min(1, (now - p.inicio) / p.duracion);

        const x = p.x0 + (p.x1 - p.x0) * q;
        const y = p.y0 + (p.y1 - p.y0) * q;

        p.elemento.style.position = "fixed";
        p.elemento.style.left = `${x}px`;
        p.elemento.style.top = `${y}px`;
        p.elemento.style.transform = "translate(-50%, -50%)";

        actualizarEstela(p.estela, x, y, p.x0, p.y0, q);

        // Colisión con el corazón real del jugador (no con el centro de la caja)
        if (!p.impactoRegistrado && alma) {
            const hr = alma.getBoundingClientRect();

            if (proyectilTocaRect(x, y, p.radio || 12, hr)) {
                p.impactoRegistrado = true;
                p.elemento.remove();
                if (p.estela) p.estela.remove();
                recibirDanio(p.danio);
                return false;
            }
        }

        if (q < 1) return true;

        p.elemento.remove();
        if (p.estela) p.estela.remove();
        return false;
    });
}

function recibirDanio(cantidad) {
    if (jugadorMuerto || Date.now() < dashHasta) return;

    // Suelo mínimo de 3 de daño: la defensa nunca puede bajar el impacto por debajo de eso.
    const real = Math.max(
        3,
        Math.ceil(cantidad * (1 - obtenerDefensa()))
    );

    vidaJugador = Math.max(0, vidaJugador - real);

    // Feedback de daño del alma: solo expande y retrae su neón actual.
    if (alma) {
        alma.classList.remove("impacto-neon");
        void alma.offsetWidth;
        alma.classList.add("impacto-neon");
    }

    actualizarInterfaz();
    guardarProgreso();

    mostrarAvisoRobo(`¡IMPACTO! -${real} HP`);

    if (vidaJugador <= 0) {
        if (oleadaActiva && mejorasEsencia.segunda.nivel > 0 && !segundaOportunidadUsadaOleada) {
            segundaOportunidadUsadaOleada = true;
            vidaJugador = Math.max(1, Math.ceil(maxVida() * 0.35));
            mostrarAvisoRobo(`¡SEGUNDA OPORTUNIDAD! ${vidaJugador} HP`);
            actualizarInterfaz();
            guardarProgreso();
            return;
        }
        morirJugador();
    }
}

// Muerte y reinicio de la partida
function limpiarCombate() {
    cancelarAlertaJefe();
    dashInicio = 0;
    dashHasta = 0;
    dashOrigen = null;
    dashDestino = null;
    document.body.classList.remove("dash-activo");
    document.querySelectorAll(".dash-afterimage").forEach(el => el.remove());
    enemigos.forEach(e => e.elemento.remove());
    enemigos = [];
    if (ataqueBordeSanador) { ataqueBordeSanador.elementos.forEach(el => el.remove()); ataqueBordeSanador = null; }
    zonasLaserActivas.forEach(z => z.elemento.remove());
    zonasLaserActivas = [];

    proyectilesJugador.forEach(p => {
        p.elemento.remove();
        if (p.estela) p.estela.remove();
    });
    proyectilesJugador = [];

    proyectilesEnemigos.forEach(p => {
        p.elemento.remove();
        if (p.estela) p.estela.remove();
    });
    proyectilesEnemigos = [];
    document.querySelectorAll(".indicador-ataque-linea, .indicador-ataque-objetivo, .indicador-ataque-punto, .indicador-ataque-origen")
        .forEach(el => el.remove());

    if (jefe) {
        jefe.elemento.remove();
    }
    document.getElementById("barra-jefe-inferior")?.remove();
    document.getElementById("camino-hexagonial")?.remove();

    jefe = null;
}

function morirJugador() {
    if (jugadorMuerto) return;

    jugadorMuerto = true;
    limpiarCombate();

    const verdePermanente = almaVerdeDesbloqueada;
    const doradaPermanente = almaDoradaDesbloqueada;

    clicks = 0;
    tpBarra = 0;
    tpTotal = 0;
    nivel = 1;
    esencia = 0;
    tpGanadoRun = 0;
    tpDesdeJefe = 0;
    oleadaCompletadaAlMenosUnaVez = false;
    numeroOleada = 0;
    renacimientos = 0;

    // La muerte borra progresión económica y mejoras de clic/renacer,
    // pero conserva mejoras de combate, ayudantes y sus compras.
    for (const m of Object.values(mejoras)) m.comprada = false;
    for (const m of Object.values(mejorasEsencia)) m.nivel = 0;
    sobrecargaInicio = 0;
    segundaOportunidadUsadaOleada = false;
    for (const a of Object.values(ayudantes)) {
        if (a.comprada) {
            a.despierta = true;
            a.inicioDespierta = Date.now();
            a.ultimoDisparo = Date.now();
        }
    }

    vidaJugador = maxVida();
    almaActiva = "roja";
    bloqueoJefesHasta = 0;
    ultimaCuracionVerde = 0;
    ultimaCuracionApoyo = ayudanteApoyoComprado ? Date.now() : 0;
    if (alma) alma.classList.remove("alma-verde", "alma-dorada");
    if (boton) boton.classList.remove("modo-verde", "modo-dorado");
    bossCount = 0;
    jefesDerrotadosRun = 0;
    ultimoDisparoEnemigo = 0;
    almaVerdeDesbloqueada = verdePermanente;
    almaDoradaDesbloqueada = doradaPermanente;

    jugadorMuerto = false;
    oleadaActiva = false;
    enemigosPendientesOleada = 0;
    proximaOleadaAt = Date.now() + INTERVALO_OLEADA_MS;
    inicioOleadaAt = 0;
    gruposOleadaRestantes = 0;
    siguienteGrupoOleadaAt = 0;
    siguienteSpawnPendienteAt = 0;
    enemigosPendientesOleada = 0;
    posicionJugador = { x: null, y: null };

    if (alma) alma.classList.remove("alma-dorada");
    if (boton) boton.classList.remove("modo-dorado");

    crearHUDCombate();
    actualizarInterfaz();
    guardarProgreso();

    mostrarAvisoRobo(
        "HAS MUERTO: perdiste clicks, TP, esencias y mejoras de clic/renacer. Conservas combate y ayudantes."
    );

    setTimeout(() => {
        mantenerJugadorEnZona();
        programarSiguienteEnemigo();
    }, 50);
}

// Ayudantes: solo disparan con el Alma Roja
function enemigoMasCercano(x, y) {
    let cercano = null;
    let distanciaMinima = Infinity;

    for (const e of enemigos) {
        if (e.derrotado) continue;

        const r = e.elemento.getBoundingClientRect();

        const d = Math.hypot(
            r.left + r.width / 2 - x,
            r.top + r.height / 2 - y
        );

        if (d < distanciaMinima) {
            distanciaMinima = d;
            cercano = e;
        }
    }

    return cercano;
}


function radioProyectilAyudante(especial) {
    // Radio real del proyectil (mitad del tamaño CSS 16px + margen)
    return especial ? 9 : 8;
}

function proyectilTocaCajaVerde(x, y, radio) {
    if (!boton) return false;

    const caja = boton.getBoundingClientRect();

    // Colisión círculo-AABB: punto más cercano del rectángulo al centro
    const cercanoX = Math.max(caja.left, Math.min(x, caja.right));
    const cercanoY = Math.max(caja.top, Math.min(y, caja.bottom));
    const dx = x - cercanoX;
    const dy = y - cercanoY;

    return dx * dx + dy * dy <= radio * radio;
}

function registrarImpactoCajaVerde(p) {
    if (p.impactoRegistrado || almaActiva !== "roja" || jugadorMuerto) return;
    p.impactoRegistrado = true;
    const esAyudante = p.helper === true;
    const multiplicadorMorado = esAyudante && nivelCuadroMorado > 0 ? 2 : 1;
    const mejoraAyudantes = esAyudante ? 1 + 0.25 * mejorasEsencia.ayudantes.nivel : 1;
    const mejoraSinergia = esAyudante && !p.especial ? 1 + 0.15 * mejorasEsencia.sinergia.nivel : 1;
    darRecompensa(multiplicadorMorado * mejoraAyudantes * mejoraSinergia);
    animarCorazon();
    if (p.especial) {
        const mejoraEspecial = 1 + 0.25 * mejorasEsencia.especial.nivel;
        darTPEspecial(obtenerTPEspecial() * mejoraEspecial * multiplicadorMorado);
    }
}

function lanzarProyectilDesde(sprite, especial = false) {
    if (
        !sprite ||
        !boton ||
        !zonaAyudantes ||
        almaActiva === "dorada" ||
        jugadorMuerto
    ) {
        return;
    }

    const origen = sprite.getBoundingClientRect();

    const x0 = origen.left + origen.width / 2;
    const y0 = origen.top + origen.height / 2;

    // Los ayudantes NUNCA disparan a enemigos: solo a la caja verde
    const destino = boton.getBoundingClientRect();

    const cx = destino.left + destino.width / 2;
    const cy = destino.top + destino.height / 2;

    const dx = cx - x0;
    const dy = cy - y0;

    const tx = Math.abs(dx) > 0.001
        ? (destino.width / 2) / Math.abs(dx)
        : Infinity;

    const ty = Math.abs(dy) > 0.001
        ? (destino.height / 2) / Math.abs(dy)
        : Infinity;

    // Extra 8px para que el proyectil entre en la hitbox del borde
    const t = Math.min(tx, ty) + 8 / Math.hypot(dx || 1, dy || 1);

    const x1 = x0 + dx * t;
    const y1 = y0 + dy * t;

    const p = crearElemento(
        "span",
        especial ? "proyectil-especial" : "mini-alma-proyectil"
    );

    p.setAttribute("aria-hidden", "true");

    const glow = especial ? "#00e5ff" : "#ff1744";
    const estela = crearEstelaProyectil(glow);
    Object.assign(estela.style, {
        position: "absolute",
        opacity: "0"
    });

    zonaAyudantes.appendChild(estela);
    zonaAyudantes.appendChild(p);

    proyectilesJugador.push({
        elemento: p,
        estela,
        inicio: Date.now(),
        duracion: especial ? 350 : 500,
        x0,
        y0,
        x1,
        y1,
        objetivo: null,
        helper: true,
        especial,
        impactoRegistrado: false,
        radio: radioProyectilAyudante(especial)
    });
}

function actualizarProyectilesAyudantes() {
    const now = Date.now();

    proyectilesJugador = proyectilesJugador.filter(p => {
        // Solo proyectiles de ayudantes; el resto lo gestiona
        // actualizarProyectilesJugador (Alma Dorada → enemigos).
        if (!p.helper) return true;

        const q = Math.min(1, (now - p.inicio) / p.duracion);
        const zona = zonaAyudantes?.getBoundingClientRect();
        const zl = zona?.left || 0;
        const zt = zona?.top || 0;

        const x = p.x0 + (p.x1 - p.x0) * q;
        const y = p.y0 + (p.y1 - p.y0) * q;

        p.elemento.style.position = "absolute";
        p.elemento.style.left = `${x - zl}px`;
        p.elemento.style.top = `${y - zt}px`;
        p.elemento.style.transform = "translate(-50%, -50%)";

        if (p.estela) {
            p.estela.style.position = "absolute";
            actualizarEstela(p.estela, x - zl, y - zt, p.x0 - zl, p.y0 - zt, q);
        }

        // Único efecto: impacto en la caja verde → clic
        if (
            !p.impactoRegistrado &&
            proyectilTocaCajaVerde(x, y, p.radio || 5)
        ) {
            registrarImpactoCajaVerde(p);
            p.elemento.remove();
            if (p.estela) p.estela.remove();
            return false;
        }

        if (q < 1) return true;

        p.elemento.remove();
        if (p.estela) p.estela.remove();

        // Fallback: si llegó al final sin detectar colisión, cuenta clic
        if (!p.impactoRegistrado && almaActiva === "roja") {
            registrarImpactoCajaVerde(p);
        }

        return false;
    });
}

function actualizarCicloAyudantes() {
    const ahora = Date.now();

    if (almaActiva === "roja" && !jugadorMuerto) {
        for (const id of Object.keys(ayudantes).map(Number)) {
            const a = ayudantes[id];

            if (!a.comprada) continue;

            if (durabilidades[3].comprada) {
                a.despierta = true;
                a.tiempoRestante = 0;
            }

            if (a.despierta) {
                if (
                    !durabilidades[3].comprada &&
                    ahora - a.inicioDespierta >= obtenerTiempoDespierto()
                ) {
                    a.despierta = false;
                    a.inicioSueno = ahora;
                    a.tiempoRestante = 0;
                    continue;
                }

                // Los ayudantes 8–13 enlazan con un rayo estático al ayudante
                // interior correspondiente. El 14 conserva su disparo inferior.
                if ((id <= 7 || id === 14) && ahora - a.ultimoDisparo >= obtenerVelocidadNormal()) {
                    lanzarProyectilDesde(
                        document.getElementById(`mini-alma-${id}`),
                        false
                    );
                    a.ultimoDisparo = ahora;
                }
            }
        }

        for (let id = 1; id <= obtenerCantidadEspecial(); id++) {
            const sprite = crearSpriteEspecial(id);

            if (ayudanteEspecial.ultimoDisparo[id] === undefined) {
                ayudanteEspecial.ultimoDisparo[id] = ahora;
            }

            if (
                sprite &&
                ahora - ayudanteEspecial.ultimoDisparo[id] >=
                obtenerIntervaloEspecial()
            ) {
                lanzarProyectilDesde(sprite, true);
                ayudanteEspecial.ultimoDisparo[id] = ahora;
            }
        }
    } else {
        proyectilesJugador = proyectilesJugador.filter(p => {
            if (p.helper) {
                p.elemento.remove();
                if (p.estela) p.estela.remove();
                return false;
            }

            return true;
        });
    }

    actualizarProyectilesAyudantes();
    actualizarProyectilesJugador();
    actualizarProyectilesEnemigos();
}

// Actualización de la interfaz
function asegurarMejorasClickEnMenu() {
    const lista = document.getElementById("lista-mejoras");
    if (!lista) return;

    // Las mejoras que cuestan TP se agrupan en el menú MEJORAS.
    let seccionTP = document.getElementById("seccion-tp-ayudantes");
    if (!seccionTP) {
        seccionTP = crearElemento("div", "separador-menu", "PRODUCCIÓN DE LOS AYUDANTES");
        seccionTP.id = "seccion-tp-ayudantes";
        lista.appendChild(seccionTP);
    }

    let mejoraTP = document.getElementById("mejora-tp-ayudantes");
    if (!mejoraTP) {
        mejoraTP = crearElemento("button", "", "TP por disparo +50% · 5 TP");
        mejoraTP.id = "mejora-tp-ayudantes";
        mejoraTP.type = "button";
        mejoraTP.addEventListener("click", comprarMejoraTPAyudantes);
        lista.appendChild(mejoraTP);
    }

    const separador = lista.querySelector(".separador-menu");

    for (const id of Object.keys(mejoras).map(Number).sort((a, b) => a - b)) {
        if (document.querySelector(`.comprar-mejora[data-mejora="${id}"]`)) {
            continue;
        }

        const m = mejoras[id];
        const bloque = crearElemento("div", "mejora");
        const info = crearElemento("div", "info-mejora");

        info.append(
            crearElemento("span", "nombre-mejora", `Click ${id}`),
            crearElemento(
                "span",
                "efecto-mejora",
                `Multiplicador ×${m.multiplicador}`
            ),
            crearElemento(
                "span",
                "precio-mejora",
                `Coste: ${formatear(m.coste)} TP`
            )
        );

        const boton = crearElemento("button", "comprar-mejora", "COMPRAR");
        boton.type = "button";
        boton.dataset.mejora = String(id);
        boton.addEventListener("click", () => {
            comprarMejoraClick(id);
        });

        bloque.append(info, boton);

        if (separador) {
            lista.insertBefore(bloque, separador);
        } else {
            lista.appendChild(bloque);
        }
    }
}

function actualizarBotonesCompra() {
    asegurarMejorasClickEnMenu();

    const idsMejorasClick = Object.keys(mejoras).map(Number).sort((a, c) => a - c);
    const ultimaMejoraClick = idsMejorasClick[idsMejorasClick.length - 1];
    const siguiente = idsMejorasClick.find(id => !mejoras[id].comprada);

    document.querySelectorAll(".comprar-mejora").forEach(b => {
        const id = Number(b.dataset.mejora);
        const m = mejoras[id];

        if (!m) return;

        const ok = requisitoCumplido(mejoras, id);
        const bloque = b.closest(".mejora");
        const esMaximo = siguiente === undefined && id === ultimaMejoraClick;
        actualizarIndicadorMaximo(b, esMaximo);

        if (bloque) {
            bloque.hidden = esMaximo ? false : (m.comprada || id !== siguiente);
        }

        b.disabled = m.comprada || !ok || tpTotal < m.coste;
        b.textContent = !ok
            ? `MEJORA ${id} · BLOQUEADA`
            : `MEJORA ${id} · ${formatear(m.coste)} TP`;
    });

    const idsDurabilidad = Object.keys(durabilidades).map(Number).sort((a, c) => a - c);
    const ultimaDurabilidad = idsDurabilidad[idsDurabilidad.length - 1];
    const siguienteDurabilidad = idsDurabilidad.find(id => !durabilidades[id].comprada);

    document.querySelectorAll(".comprar-durabilidad").forEach(b => {
        const id = Number(b.dataset.durabilidad);
        const m = durabilidades[id];

        if (!m) return;

        const ok = requisitoCumplido(durabilidades, id);
        const bloque = b.closest(".mejora");
        const esMaximo = siguienteDurabilidad === undefined && id === ultimaDurabilidad;
        actualizarIndicadorMaximo(b, esMaximo);

        if (bloque) {
            bloque.hidden = esMaximo ? false : (m.comprada || id !== siguienteDurabilidad);
        }

        b.disabled = m.comprada || !ok || tpTotal < m.coste;
        b.textContent = `DURABILIDAD ${id} · ${formatear(m.coste)} TP`;
    });
}

function actualizarAyudantes() {
    // En el menú solo se muestra una tarjeta: el siguiente ayudante pendiente.
    // Al comprarlo, su tarjeta desaparece y la siguiente ocupa su lugar.
    const ids = Object.keys(ayudantes).map(Number).sort((a, b) => a - b);
    const siguienteAyudante = obtenerSiguienteAyudanteNormal();
    const todosLosAyudantesComprados = ids.every(id => ayudantes[id].comprada === true);
    const ultimoAyudante = ids[ids.length - 1];

    for (const id of ids) {
        const a = ayudantes[id];
        const boton = document.querySelector(`.comprar-ayudante[data-ayudante="${id}"]`);
        const tarjeta = boton?.closest('.ayudante');
        const spriteExistente = document.getElementById(`mini-alma-${id}`);
        const comprado = a.comprada === true;
        const esSiguiente = id === siguienteAyudante;
        const visibleEnMenu = !comprado && esSiguiente;
        const mostrarMaximo = todosLosAyudantesComprados && id === ultimoAyudante;
        const puedePagar = clicks >= a.coste;
        const puedeComprar = visibleEnMenu && puedePagar;

        if (boton) actualizarIndicadorMaximo(boton, mostrarMaximo);

        if (tarjeta) {
            // Al completar la cadena, la última tarjeta se convierte en MÁXIMO.
            tarjeta.hidden = !visibleEnMenu && !mostrarMaximo;
            tarjeta.classList.toggle('ayudante-comprado', comprado);
            tarjeta.classList.toggle('ayudante-disponible', puedeComprar);
            tarjeta.classList.toggle('ayudante-siguiente', visibleEnMenu && !puedePagar);
            tarjeta.classList.remove('ayudante-bloqueado');
        }

        if (boton) {
            boton.hidden = !visibleEnMenu;
            boton.style.display = visibleEnMenu ? 'block' : 'none';
            boton.disabled = !puedeComprar;
            boton.setAttribute('aria-disabled', String(!puedeComprar));
            // Fila compacta: nombre a la izquierda y compra con precio a la derecha.
            // El botón queda gris/amarillo cuando no alcanza el saldo.
            boton.textContent = `COMPRAR · ${formatear(a.coste)} CLICKS`;
        }

        if (comprado) {
            if (!document.getElementById(`mini-alma-${id}`)) crearSpriteAyudante(id);
            const sprite = document.getElementById(`mini-alma-${id}`);
            if (sprite) {
                sprite.classList.toggle('dormida', !a.despierta);
                sprite.disabled = false;
                sprite.title = a.despierta ? `Mini alma ${id}` : 'Haz clic para despertar';
            }
        } else {
            if (spriteExistente) spriteExistente.remove();
        }
    }

    for (let id = 1; id <= obtenerCantidadEspecial(); id++) crearSpriteEspecial(id);
    colocarTodosLosAyudantes();
    actualizarVisibilidadAyudantes();
}

function actualizarPanelProgresion() {
    const ce = document.getElementById("contador-esencia");
    const ir = document.getElementById("info-renacer");
    const br = document.getElementById("boton-renacer");

    const be = document.getElementById("comprar-especial");
    const bApoyo = document.getElementById("comprar-ayudante-apoyo");
    const bGrowUpApoyo = document.getElementById("mejora-grow-up-apoyo");
    const bv = document.getElementById("mejora-especial-velocidad");
    const bt = document.getElementById("mejora-especial-tp");
    const btp = document.getElementById("mejora-tp-ayudantes");

    const n = obtenerCantidadEspecial();

    if (ce) {
        ce.textContent = `Esencias: ${formatear(esencia)}`;
    }

    if (ir) {
        ir.textContent = tpGanadoRun >= 100
            ? `Puedes renacer y ganar ${formatear(Math.floor(tpGanadoRun / 10))} Esencias.`
            : `TP acumulado en esta vida: ${formatear(tpGanadoRun)} / 100. Te faltan ${formatear(Math.max(0, 100 - tpGanadoRun))} TP.`;
    }

    if (br) {
        br.disabled = tpGanadoRun < 100;

        br.textContent = tpGanadoRun >= 100
            ? `RENACER · +${formatear(Math.floor(tpGanadoRun / 10))} ESENCIAS`
            : "RENACER (BLOQUEADO)";
    }

    document.querySelectorAll(".comprar-mejora-esencia").forEach(b => {
        const tipo = b.dataset.mejorEsencia;
        const m = mejorasEsencia[tipo];
        const max = m.nivel >= m.precios.length;
        const coste = max ? 0 : m.precios[m.nivel];

        actualizarIndicadorMaximo(b, max);
        b.disabled = max || esencia < coste;
        const nombres = { click: "Poder de clic", velocidad: "Velocidad normal", ayudantes: "Recompensa de ayudantes", especial: "TP de ayudantes especiales", sobrecarga: "Sobrecarga", cosecha: "Cosecha de esencias", nucleo: "Núcleo de TP", sinergia: "Sinergia", segunda: "Segunda oportunidad", danio: "Potencia del Alma Dorada" };
        if (tipo === "sobrecarga" && m.nivel > 0) {
            b.disabled = true;
            b.textContent = `Sobrecarga · ${obtenerEstadoSobrecarga()} · ×1,5 durante 5s / recarga 10s`;
        } else if (tipo === "segunda" && m.nivel > 0) {
            b.disabled = true;
            b.textContent = `SEGUNDA OPORTUNIDAD · ${segundaOportunidadUsadaOleada ? "USADA ESTA OLEADA" : "DISPONIBLE EN OLEADAS"}`;
        } else {
            b.textContent = tipo === "danio"
                ? `${nombres[tipo]} · Daño ${obtenerDanioAlmaDorada()} → ${obtenerDanioAlmaDorada() + 1} · ${coste} Esencias`
                : `${nombres[tipo] || tipo} · Nivel ${m.nivel} · ${coste} Esencias`;
        }
    });

    if (bApoyo) {
        bApoyo.disabled = ayudanteApoyoComprado || tpTotal < COSTE_AYUDANTE_APOYO;
        bApoyo.textContent = `Ayudante de apoyo · ${formatear(COSTE_AYUDANTE_APOYO)} TP`;
        actualizarIndicadorComprado(bApoyo, ayudanteApoyoComprado);
    }
    if (bGrowUpApoyo) {
        bGrowUpApoyo.disabled = !ayudanteApoyoComprado || growUpApoyoComprado || tpTotal < COSTE_GROW_UP_APOYO;
        bGrowUpApoyo.textContent = growUpApoyoComprado
            ? "GROW UP · AYUDANTE CURATIVO MEJORADO (4 HP/s)"
            : !ayudanteApoyoComprado
                ? "GROW UP · REQUIERE AYUDANTE DE APOYO"
                : `GROW UP · ${formatear(COSTE_GROW_UP_APOYO)} TP · 4 HP/s Y TAMAÑO NORMAL`;
        actualizarIndicadorComprado(bGrowUpApoyo, growUpApoyoComprado);
    }

    if (be) {
        const max = n >= MAX_ESPECIALES;
        actualizarIndicadorMaximo(be, max);
        be.disabled = max || esencia < COSTE_ESPECIAL;
        be.textContent = `Comprar ayudante especial · ${COSTE_ESPECIAL} Esencias (${n}/${MAX_ESPECIALES})`;
    }

    if (bv) {
        const k = ayudanteEspecial.nivelVelocidad;
        const max = k >= PRECIOS_ESPECIAL.length;
        const c = max ? 0 : PRECIOS_ESPECIAL[k];

        actualizarIndicadorMaximo(bv, max && n > 0, n > 0);
        bv.disabled = n === 0 || max || esencia < c;

        bv.textContent = `Velocidad especial · Nivel ${k} · ${c} Esencias`;
    }

    if (bt) {
        const k = ayudanteEspecial.nivelTP;
        const max = k >= PRECIOS_ESPECIAL.length;
        const c = max ? 0 : PRECIOS_ESPECIAL[k];

        actualizarIndicadorMaximo(bt, max && n > 0, n > 0);
        bt.disabled = n === 0 || max || esencia < c;

        bt.textContent = `TP especial · Nivel ${k} · ${c} Esencias`;
    }

    if (btp) {
        const k = mejoraTPAyudantes.nivel;
        const max = k >= mejoraTPAyudantes.precios.length;
        const c = max ? 0 : mejoraTPAyudantes.precios[k];

        actualizarIndicadorMaximo(btp, max);
        btp.disabled = max || tpTotal < c;
        btp.textContent = `TP por disparo +50% · Nivel ${k} · ${c} TP`;
    }

    const bVerde = document.getElementById("comprar-alma-verde");
    if (bVerde) {
        bVerde.disabled = almaVerdeDesbloqueada || tpTotal < COSTE_ALMA_VERDE;
        bVerde.textContent = almaVerdeDesbloqueada
            ? "ALMA VERDE · DESBLOQUEADA PARA SIEMPRE (E)"
            : `Desbloquear Alma Verde · ${formatear(COSTE_ALMA_VERDE)} TP`;
        actualizarIndicadorComprado(bVerde, almaVerdeDesbloqueada);
    }

    const bd = document.getElementById("comprar-alma-dorada");

    if (bd) {
        bd.disabled =
            almaDoradaDesbloqueada ||
            esencia < COSTE_ALMA_DORADA;

        bd.textContent = almaDoradaDesbloqueada
            ? "ALMA DORADA · DESBLOQUEADA PARA SIEMPRE"
            : `Desbloquear Alma Dorada · ${formatear(COSTE_ALMA_DORADA)} Esencias`;
        actualizarIndicadorComprado(bd, almaDoradaDesbloqueada);
    }

    const bEscopeta = document.getElementById("comprar-escopeta");
    if (bEscopeta) {
        bEscopeta.disabled =
            escopetaDesbloqueada ||
            !almaDoradaDesbloqueada ||
            tpTotal < COSTE_ESCOPETA;
        bEscopeta.textContent = escopetaDesbloqueada
            ? "DISPARO DE ESCOPETA · DESBLOQUEADO (5 BALAS)"
            : !almaDoradaDesbloqueada
                ? `Disparo de escopeta · Requiere Alma Dorada · ${formatear(COSTE_ESCOPETA)} TP`
                : `Disparo de escopeta (5 balas) · ${formatear(COSTE_ESCOPETA)} TP`;
        actualizarIndicadorComprado(bEscopeta, escopetaDesbloqueada);
    }

    const bvj = document.getElementById("mejora-vida");

    if (bvj) {
        const max = nivelVida >= COSTES_VIDA.length;
        const c = max ? 0 : COSTES_VIDA[nivelVida];

        actualizarIndicadorMaximo(bvj, max);
        bvj.disabled = max || esencia < c;

        bvj.textContent = `Vida +${VIDA_POR_MEJORA} · Nivel ${nivelVida} · ${c} Esencias`;
    }

    const bdef = document.getElementById("mejora-defensa");

    if (bdef) {
        const max = nivelDefensa >= COSTES_DEFENSA.length;
        const c = max ? 0 : COSTES_DEFENSA[nivelDefensa];

        actualizarIndicadorMaximo(bdef, max);
        bdef.disabled = max || esencia < c;

        bdef.textContent = `Defensa ${Math.round(obtenerDefensa() * 100)}% → ${Math.round(Math.min(62.5, (nivelDefensa + 1) * 6.25))}% · ${c} Esencias`;
    }

    const bTamanoCaja = document.getElementById("mejora-tamano-caja");
    if (bTamanoCaja) {
        const max = nivelTamanoCaja >= COSTES_TAMANO_CAJA.length;
        const tamanoActual = TAMANO_CAJA_BASE + nivelTamanoCaja * AUMENTO_TAMANO_CAJA;
        const coste = max ? 0 : COSTES_TAMANO_CAJA[nivelTamanoCaja];
        const siguienteTamano = tamanoActual + AUMENTO_TAMANO_CAJA;
        actualizarIndicadorMaximo(bTamanoCaja, max);
        bTamanoCaja.disabled = max || esencia < coste;
        bTamanoCaja.textContent = `AMPLIAR CUADRO · ${tamanoActual}→${siguienteTamano}px · Nivel ${nivelTamanoCaja + 1}/${COSTES_TAMANO_CAJA.length} · ${formatear(coste)} Esencias`;
    }


    const bMorado = document.getElementById("mejora-cuadro-morado");
    if (bMorado) {
        bMorado.disabled = nivelCuadroMorado > 0 || esencia < 500;
        bMorado.textContent = nivelCuadroMorado > 0 ? "CUADRO MORADO · COMPRADO" : "Desbloquear cuadro morado · 500 Esencias";
        actualizarIndicadorComprado(bMorado, nivelCuadroMorado > 0);
    }
    const bSepia = document.getElementById("boton-modo-sepia");
    if (bSepia) bSepia.textContent = modoSepia ? "DESACTIVAR MODO SEPIA" : "ACTIVAR MODO SEPIA";

    const bDestello = document.getElementById("comprar-el-destello");
    if (bDestello) {
        bDestello.disabled = juegoFinalizado || !hexagonialDerrotado || clicks < COSTE_DESTELLO;
        bDestello.textContent = juegoFinalizado
            ? "EL DESTELLO · JUEGO COMPLETADO"
            : !hexagonialDerrotado
                ? "EL DESTELLO · DERROTA A HEXAGONIAL"
                : `EL DESTELLO · ${formatear(COSTE_DESTELLO)} clicks`;
        actualizarIndicadorComprado(bDestello, juegoFinalizado);
    }
}

function actualizarInterfaz() {
    if (contador) {
        contador.textContent = formatear(clicks);
    }

    if (textoNivel) {
        textoNivel.textContent = "LV " + nivel;
    }

    if (textoTPTotal) {
        textoTPTotal.textContent = formatear(tpTotal);
    }

    if (textoTP) {
        textoTP.textContent = `${tpBarra.toFixed(1)}%`;
    }

    if (rellenoTP) {
        rellenoTP.style.height = `${tpBarra}%`;
    }

    actualizarBarraVida();
    colocarVidaDebajoCaja();

    actualizarBotonesCompra();
    actualizarAyudantes();
    actualizarPanelProgresion();
}

// Eventos
if (botonReset) {
    botonReset.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();

        // Ignora dobles clics mientras el reinicio está en curso.
        if (reinicioEnCurso) return;

        if (!confirm(
            "¿Seguro que quieres reiniciar DELTACLICKER?\n\n" +
            "Perderás todo el progreso, incluido el desbloqueo del Alma Dorada."
        )) {
            return;
        }

        try {
            reinicioEnCurso = true;
            botonReset.disabled = true;
            botonReset.textContent = "REINICIANDO...";

            // Detiene el autoguardado antes de borrar la partida para que
            // no vuelva a escribir el progreso antiguo durante la recarga.
            if (intervaloGuardado !== null) {
                clearInterval(intervaloGuardado);
                intervaloGuardado = null;
            }

            localStorage.removeItem(CLAVE_GUARDADO);
            location.reload();
        } catch (e) {
            console.error("No se pudo reiniciar DELTACLICKER:", e);
            reinicioEnCurso = false;
            botonReset.disabled = false;
            botonReset.textContent = "RESET";
            alert("No se pudo borrar el guardado. Comprueba el almacenamiento del navegador.");
        }
    });
}

document.querySelectorAll(".comprar-mejora").forEach(b => {
    b.addEventListener("click", () => {
        comprarMejoraClick(Number(b.dataset.mejora));
    });
});

document.querySelectorAll(".comprar-durabilidad").forEach(b => {
    b.addEventListener("click", () => {
        const id = Number(b.dataset.durabilidad);
        const m = durabilidades[id];

        if (
            !m ||
            m.comprada ||
            !requisitoCumplido(durabilidades, id) ||
            tpTotal < m.coste
        ) {
            return;
        }

        tpTotal -= m.coste;
        m.comprada = true;

        const boton = document.querySelector(`.comprar-durabilidad[data-durabilidad="${id}"]`);
        if (boton) {
            const siguiente = boton.cloneNode(false);
            siguiente.addEventListener("click", () => {
                const siguienteId = Number(siguiente.dataset.durabilidad);
                const mejora = durabilidades[siguienteId];
                if (!mejora || mejora.comprada || !requisitoCumplido(durabilidades, siguienteId) || tpTotal < mejora.coste) return;
                tpTotal -= mejora.coste;
                mejora.comprada = true;
                if (siguienteId === 3) {
                    for (const a of Object.values(ayudantes)) {
                        a.despierta = true;
                        a.tiempoRestante = 0;
                        a.inicioDespierta = Date.now();
                    }
                }
                actualizarInterfaz();
                guardarProgreso();
            });
            boton.replaceWith(siguiente);
        }

        if (id === 3) {
            for (const a of Object.values(ayudantes)) {
                a.despierta = true;
                a.tiempoRestante = 0;
                a.inicioDespierta = Date.now();
            }
        }

        actualizarInterfaz();
        guardarProgreso();
    });
});

document.querySelectorAll(".comprar-ayudante").forEach(b => {
    b.addEventListener("click", () => {
        comprarAyudanteNormal(Number(b.dataset.ayudante));
    });
});

if (boton) {
    boton.addEventListener("click", event => {
        event.stopPropagation();

        if (jugadorMuerto || juegoFinalizado) return;

        // El Alma Verde es defensiva: los clics sobre el corazón no deben
        // atravesarla ni generar clicks mientras permanece activa.
        if (almaActiva === "verde") return;

        if (almaActiva === "dorada") {
            crearProyectilJugador();
        } else {
            darRecompensa(1);
            animarCorazon();
        }
    });
}

// Con Alma Dorada se puede disparar haciendo clic en cualquier parte del escenario
document.addEventListener("click", event => {
    if (jugadorMuerto || almaActiva !== "dorada" || !almaDoradaDesbloqueada) {
        return;
    }

    // Clic en enemigo/jefe: ya dispara su propio handler
    if (event.target.closest(".alma-enemiga")) {
        return;
    }

    // No disparar si el clic es sobre menús o botones de la UI
    // (excepto la caja verde, que tiene su propio handler)
    const ui = event.target.closest(
        "#menu-mejoras, #menu-ayudantes, #panel-progresion, #panel-almas, #lista-mejoras, #lista-ayudantes, #boton-reset, #boton-mejoras, #boton-ayudantes, #boton-progresion, #boton-almas, .comprar-mejora, .comprar-ayudante, .comprar-durabilidad, #panel-progresion button, #panel-almas button"
    );
    if (ui) {
        return;
    }

    // Evitar doble disparo si ya lo lanzó el botón de la caja
    if (event.target === boton || boton?.contains(event.target)) {
        return;
    }

    // Otros botones de la UI genéricos
    if (event.target.closest("button") && !event.target.closest("#boton-click")) {
        return;
    }

    crearProyectilJugador();
});

const mensajesEnterActivos = [];
let contenedorMensajesEnter = null;

function mostrarNoPorEnter() {
    // Máximo cinco avisos simultáneos para evitar acumulaciones.
    if (mensajesEnterActivos.length >= 5) return;

    const escenario = document.querySelector(".juego");
    if (!escenario) return;

    if (!contenedorMensajesEnter) {
        contenedorMensajesEnter = document.createElement("div");
        contenedorMensajesEnter.id = "mensajes-enter";
        Object.assign(contenedorMensajesEnter.style, {
            position: "fixed",
            inset: "0",
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: "99999"
        });
        document.body.appendChild(contenedorMensajesEnter);
    }

    const aviso = document.createElement("span");
    aviso.className = "mensaje-enter-no";
    aviso.textContent = "NO";
    contenedorMensajesEnter.appendChild(aviso);
    mensajesEnterActivos.push(aviso);

    // El aviso permanece fijo y desaparece de golpe, sin animación.
    window.setTimeout(() => {
        aviso.remove();
        const indice = mensajesEnterActivos.indexOf(aviso);
        if (indice !== -1) mensajesEnterActivos.splice(indice, 1);
        if (!mensajesEnterActivos.length) {
            contenedorMensajesEnter?.remove();
            contenedorMensajesEnter = null;
        }
    }, 850);
}

window.addEventListener("keydown", event => {
    // Los campos de texto tienen prioridad: permiten escribir espacios,
    // usar Enter para enviar el formulario y navegar/editar el texto.
    const objetivo = event.target;
    const escribiendoTexto = objetivo instanceof HTMLElement && (
        objetivo.isContentEditable ||
        objetivo.matches("input, textarea, select")
    );
    if (escribiendoTexto) return;

    const k = event.key.length === 1
        ? event.key.toLowerCase()
        : event.key;

    // Enter nunca genera clics. Solo una pulsación nueva muestra NO;
    // mantener la tecla presionada no repite el aviso ni activa autoclick.
    if (k === "Enter" || event.code === "Enter" || event.code === "NumpadEnter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat) mostrarNoPorEnter();
        return;
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(k)) {
        event.preventDefault();
    }

    // E: activar el alma verde, disponible tras comprar su desbloqueo.
    if (k === "e" && !event.repeat) {
        if (jugadorMuerto || juegoFinalizado) return;
        if (!almaVerdeDesbloqueada) {
            mostrarAvisoRobo(`El Alma Verde está bloqueada. Cómprala por ${formatear(COSTE_ALMA_VERDE)} TP en el menú de almas.`);
            return;
        }

        // E activa el alma verde; pulsarla otra vez vuelve al alma roja.
        almaActiva = almaActiva === "verde" ? "roja" : "verde";
        if (alma) {
            alma.classList.toggle("alma-dorada", almaActiva === "dorada");
            alma.classList.toggle("alma-verde", almaActiva === "verde");
        }
        if (boton) {
            boton.classList.toggle("modo-dorado", almaActiva === "dorada");
            boton.classList.toggle("modo-verde", almaActiva === "verde");
        }

        if (almaActiva === "verde") {
            // Mantener la última posición al activar el alma verde.
            ultimaCuracionVerde = Date.now();
        }

        actualizarOrientacionAlma();
        actualizarVisibilidadAyudantes();
        actualizarInterfaz();
        mostrarAvisoRobo(almaActiva === "verde"
            ? "ALMA VERDE: te quedas inmóvil donde estabas y recuperas 5 HP por segundo."
            : "ALMA ROJA: movimiento libre y ayudantes activos.");
        return;
    }

    if (k === "q" && !event.repeat) {
        cambiarAlma();
        return;
    }

    if (
        [
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            "w",
            "a",
            "s",
            "d"
        ].includes(k)
    ) {
        teclasPulsadas.add(k);
    }
}, true); // capture: funciona aunque un botón tenga el foco

// Clic derecho: activar el dash y evitar que aparezca el menú contextual.
window.addEventListener("mousedown", event => {
    if (event.button !== 2) return;

    const objetivo = event.target;
    const escribiendoTexto = objetivo instanceof HTMLElement && (
        objetivo.isContentEditable ||
        objetivo.matches("input, textarea, select")
    );
    if (escribiendoTexto) return;

    event.preventDefault();
    activarDash();
}, true);

window.addEventListener("contextmenu", event => {
    event.preventDefault();
}, true);

window.addEventListener("keyup", event => {
    const k = event.key.length === 1
        ? event.key.toLowerCase()
        : event.key;

    teclasPulsadas.delete(k);
});

window.addEventListener("blur", () => {
    teclasPulsadas.clear();
});

window.addEventListener("mousemove", event => {
    posicionRaton.x = event.clientX;
    posicionRaton.y = event.clientY;
    actualizarOrientacionAlma();
});

// Inicio
crearPanelesNuevos();
crearHUDCombate();

configurarMenu(
    botonMejoras,
    listaMejoras,
    "MEJORAS"
);

configurarMenu(
    botonAyudantes,
    listaAyudantes,
    "AYUDANTES"
);

cargarProgreso();
// Asegura que partidas antiguas no dejen el modo extremo activo ni su botón residual.
modoExtremo = false;
document.getElementById("boton-modo-extremo")?.remove();

for (const id of Object.keys(ayudantes).map(Number)) {
    const a = ayudantes[id];

    if (a.comprada) {
        a.inicioDespierta = Date.now();
        a.ultimoDisparo = Date.now();
        crearSpriteAyudante(id);
    }
}

for (let id = 1; id <= obtenerCantidadEspecial(); id++) {
    ayudanteEspecial.ultimoDisparo[id] = Date.now();
    crearSpriteEspecial(id);
}

if (ayudanteApoyoComprado) {
    ultimaCuracionApoyo = Date.now();
    crearSpriteAyudanteApoyo();
}

if (alma) {
    alma.classList.toggle("alma-dorada", almaActiva === "dorada");
    alma.classList.toggle("alma-verde", almaActiva === "verde");
}

if (boton) {
    boton.classList.toggle("modo-dorado", almaActiva === "dorada");
    boton.classList.toggle("modo-verde", almaActiva === "verde");
}

actualizarVisibilidadAyudantes();
colocarTodosLosAyudantes();
colocarBotonesJuntos();
crearModoDesarrollador();
aplicarTamanoCuadroBatalla();
mantenerJugadorEnZona();
actualizarInterfaz();
boton?.classList.toggle("cuadro-morado", nivelCuadroMorado > 0);
document.body.classList.toggle("modo-sepia", modoSepia);
programarSiguienteEnemigo();
if (combateJefeGuardado && !juegoFinalizado && !jugadorMuerto) {
    const guardado = combateJefeGuardado;
    const esHexagonialGuardado = guardado.tipo === "hexagonial";
    crearJefe(esHexagonialGuardado, true);
    if (jefe) {
        jefe.vidaMaxima = Math.max(1, numeroSeguro(guardado.vidaMaxima, jefe.vidaMaxima));
        jefe.vidaActual = Math.max(1, Math.min(jefe.vidaMaxima, numeroSeguro(guardado.vidaActual, jefe.vidaMaxima)));
        // Recalcula sin el ×2 del antiguo modo extremo (mantiene proporción de vida).
        actualizarDificultadEnemigosExistentes();
        actualizarVidaJefe();
        mostrarAvisoRobo(`COMBATE RESTAURADO · ${jefe.vidaActual}/${jefe.vidaMaxima} HP`);
    }
    combateJefeGuardado = null;
    guardarProgreso();
}
if (juegoFinalizado) mostrarFinalElDestello(false);

setInterval(moverJugador, 16);
setInterval(actualizarCicloAyudantes, 50);

setInterval(() => {
    actualizarEnemigos();
    actualizarJefe();
    actualizarOrbitaEnemigos();
    actualizarAtaquesContinuos();
}, 100);

setInterval(() => {
    if (
        !almaDoradaDesbloqueada ||
        jugadorMuerto ||
        Date.now() - ultimoDisparoEnemigo < intervaloDisparoEnemigoActual()
    ) {
        return;
    }

    const emisores = enemigos.filter(e => !e.derrotado && e.tipo !== "sanadora" && e.elemento?.isConnected);
    if (!emisores.length) return;

    ultimoDisparoEnemigo = Date.now();
    // Todos los enemigos (incluidos los hexágonos invocados por Hexagonial)
    // usan el set completo de patrones. El láser de Hexagonial sigue siendo
    // exclusivo del jefe y no se elige aquí.
    dispararContraJugador(false, emisores);
}, 100);

intervaloGuardado = setInterval(guardarProgreso, 5000);
setInterval(() => {
    const b = document.getElementById("mejora-esencia-sobrecarga");
    if (b && mejorasEsencia.sobrecarga.nivel > 0) b.textContent = `Sobrecarga · ${obtenerEstadoSobrecarga()} · ×1,5 durante 5s / recarga 10s`;
    const segunda = document.getElementById("mejora-esencia-segunda");
    if (segunda && mejorasEsencia.segunda.nivel > 0) segunda.textContent = `SEGUNDA OPORTUNIDAD · ${segundaOportunidadUsadaOleada ? "USADA ESTA OLEADA" : "DISPONIBLE EN OLEADAS"}`;
}, 250);

window.addEventListener("resize", () => {
    mantenerJugadorEnZona();
    colocarTodosLosAyudantes();
    colocarBotonesJuntos();
    colocarVidaDebajoCaja();
});
setTimeout(() => {
    const juego = document.querySelector(".juego");

    console.log("=== DELTACLICKER: DIAGNÓSTICO ===");
    console.log("Contenedor del alma:", alma?.parentElement);
    console.log("¿Está dentro de .juego?:", juego?.contains(alma));
    console.log("Zona del juego:", juego?.getBoundingClientRect());
    console.log("Posición del alma:", alma?.getBoundingClientRect());
    console.log("Coordenadas guardadas:", posicionJugador);
}, 1000);