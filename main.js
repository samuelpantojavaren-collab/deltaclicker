"use strict";

// ============================================
// DELTACLICKER 1.0.1 — PRIMERA REVISIÓN
// ============================================

const CLAVE_GUARDADO = "deltaclicker";
const TIEMPO_SUENO = 10000;
const INTERVALO_DISPARO = 700;
const MAX_ENEMIGOS = 3;
const MAX_ESPECIALES = 4;
const INTERVALO_ROBO = 5000;
const INTERVALO_APARICION_MIN = 7000;
const INTERVALO_APARICION_MAX = 12000;
const DANIO_CLIC = 1;
const COSTE_ESPECIAL = 15;
const COSTE_ALMA_VERDE = 100;
const COSTE_ALMA_DORADA = 2500;
const COSTE_DESTELLO = 1000000000;
const COSTE_PARRY = 1000;
const DURACION_PARRY = 500;
const COOLDOWN_PARRY = 5000;
const CURACION_ALMA_VERDE = 5;
const VIDA_INICIAL = 100;
const VIDA_MAXIMA = 150;
const VIDA_POR_MEJORA = 10;
const COSTES_VIDA = [50, 100, 200, 350, 500];
const COSTES_DEFENSA = [100, 200, 400, 800, 1600];
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
let almaActiva = "roja";
let parryDesbloqueado = false;
let parryHasta = 0;
let parryCooldownHasta = 0;
let ultimaCuracionVerde = 0;
let bloqueoJefesHasta = 0;
let nivelVida = 0;
let nivelDefensa = 0;
let vidaJugador = VIDA_INICIAL;
let jugadorMuerto = false;

let bossCount = 0;
let jefesDerrotadosRun = 0;
let juegoFinalizado = false;
let tpDesdeJefe = 0;
let ultimoDisparoEnemigo = 0;

let teclasPulsadas = new Set();
let posicionJugador = { x: null, y: null };
let posicionRaton = { x: null, y: null };

let proyectilesJugador = [];
let proyectilesEnemigos = [];
let jefe = null;

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
    15: { coste: 987, multiplicador: 350, comprada: false }
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
    7: crearAyudante(1250000)
};

const PRECIOS_ESENCIA = [5, 10, 20, 35, 55];

const mejorasEsencia = {
    click: { nivel: 0, precios: [...PRECIOS_ESENCIA] },
    velocidad: { nivel: 0, precios: [...PRECIOS_ESENCIA] }
};

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
    return Math.max(350, INTERVALO_DISPARO_ENEMIGO /
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
        vida: 3,
        recompensa: 5,
        roboInicial: 1,
        roboTP: 1
    },
    corrupta: {
        nombre: "ALMA CORRUPTA",
        clase: "alma-corrupta",
        vida: 6,
        recompensa: 15,
        roboInicial: 2,
        roboTP: 3
    },
    abismal: {
        nombre: "ALMA ABISMAL",
        clase: "alma-abismal",
        vida: 12,
        recompensa: 35,
        roboInicial: 5,
        roboTP: 5
    }
};

const COLORES_ENEMIGOS = [
    "#53e6cf",
    "#a88bff",
    "#ffcb69",
    "#ff78ad",
    "#83df79",
    "#70b9ff",
    "#ff9870",
    "#e5e5e5"
];

let enemigos = [];
let siguienteIdEnemigo = 1;
let siguienteAparicion = 0;
let temporizadorAviso = null;

// Elementos de la página
const contador =
    document.getElementById("clicks") ||
    document.getElementById("contador");

const boton = document.getElementById("boton-click");
const alma = document.querySelector(".alma");
const temporizadorParry = document.getElementById("temporizador-parry");
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

function obtenerCantidadEspecial() {
    return Math.min(
        MAX_ESPECIALES,
        Math.max(0, Math.floor(ayudanteEspecial.cantidad))
    );
}

function maxVida() {
    return Math.min(
        VIDA_MAXIMA,
        VIDA_INICIAL + nivelVida * VIDA_POR_MEJORA
    );
}

function obtenerDefensa() {
    return Math.min(0.5, nivelDefensa * 0.1);
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
    const botonProgresion = document.getElementById("boton-progresion");
    const botonAlmas = document.getElementById("boton-almas");

    if (!botonAyudantes || !botonProgresion || !botonAlmas) return;

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

        const padre = botonAyudantes.parentElement;

        if (padre) {
            padre.insertBefore(grupo, botonAyudantes);
        } else {
            document.body.appendChild(grupo);
        }
    }

    grupo.append(botonAyudantes, botonProgresion, botonAlmas);
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

        panel.appendChild(
            crearElemento("h3", "", "AYUDANTES ESPECIALES")
        );

        const especiales = crearElemento("div", "lista-especial");
        especiales.id = "lista-especial";
        panel.appendChild(especiales);

        panel.appendChild(
            crearElemento("h3", "", "PRODUCCIÓN DE LOS AYUDANTES")
        );

        const tp = crearElemento("div", "lista-tp-ayudantes");
        tp.id = "lista-tp-ayudantes";
        panel.appendChild(tp);

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
            )
        );
    }

    const listaEspecial = document.getElementById("lista-especial");

    if (listaEspecial && !listaEspecial.dataset.creada) {
        listaEspecial.dataset.creada = "true";

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

    const listaTP = document.getElementById("lista-tp-ayudantes");

    if (listaTP && !listaTP.dataset.creada) {
        listaTP.dataset.creada = "true";

        const mejora = crearElemento(
            "button",
            "",
            "TP por disparo +50% · 5 TP"
        );

        mejora.id = "mejora-tp-ayudantes";
        mejora.type = "button";
        mejora.addEventListener("click", comprarMejoraTPAyudantes);
        listaTP.appendChild(mejora);
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

        const parry = crearElemento("button", "", "Desbloquear Parry · 1.000 Esencias");
        parry.id = "comprar-parry";
        parry.type = "button";
        parry.addEventListener("click", comprarParry);
        combate.appendChild(parry);

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
    b.dataset.mejorEsencia = tipo;
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

        almaVerdeDesbloqueada = d.almaVerdeDesbloqueada === true;
        almaDoradaDesbloqueada = d.almaDoradaDesbloqueada === true;
        parryDesbloqueado = d.parryDesbloqueado === true;

        nivelVida = Math.min(5, numeroSeguro(d.nivelVida));
        nivelDefensa = Math.min(5, numeroSeguro(d.nivelDefensa));
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

        for (const tipo of Object.keys(mejorasEsencia)) {
            if (d.mejorasEsencia?.[tipo]) {
                mejorasEsencia[tipo].nivel = Math.min(
                    PRECIOS_ESENCIA.length,
                    numeroSeguro(d.mejorasEsencia[tipo].nivel)
                );
            }
        }

        mejoraTPAyudantes.nivel = Math.min(
            mejoraTPAyudantes.precios.length,
            numeroSeguro(d.mejoraTPAyudantes?.nivel)
        );

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
            almaVerdeDesbloqueada,
            almaDoradaDesbloqueada,
            parryDesbloqueado,
            nivelVida,
            nivelDefensa,
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
function procesarBarraTP() {
    if (tpBarra >= 100) {
        const ganados = Math.floor(tpBarra / 100);

        tpTotal += ganados;
        tpGanadoRun += ganados;
        if (Date.now() >= bloqueoJefesHasta) tpDesdeJefe += ganados;
        nivel += ganados;
        tpBarra %= 100;
    }

    comprobarAparicionJefe();
}

function darRecompensa(cantidadBase = 1) {
    if (jugadorMuerto || juegoFinalizado) return;

    const cantidad = cantidadBase * obtenerMultiplicador();

    clicks += cantidad;
    tpBarra += cantidad;

    procesarBarraTP();
    actualizarInterfaz();
    guardarProgreso();
}

function darTP(cantidad, contarParaJefe = true) {
    if (!Number.isFinite(cantidad) || cantidad <= 0 || jugadorMuerto || juegoFinalizado) {
        return;
    }

    tpTotal += cantidad;
    tpGanadoRun += cantidad;
    if (contarParaJefe && Date.now() >= bloqueoJefesHasta) {
        tpDesdeJefe += cantidad;
    }

    comprobarAparicionJefe();
    actualizarInterfaz();
    guardarProgreso();
}

function darTPEspecial(cantidad) {
    if (!Number.isFinite(cantidad) || cantidad <= 0 || jugadorMuerto) {
        return;
    }

    tpBarra += cantidad;

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

    actualizarInterfaz();
    guardarProgreso();
}

function comprarElDestello() {
    if (juegoFinalizado) return;

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
    overlay.append(haz, blanco, texto);
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

    actualizarInterfaz();
    guardarProgreso();
}

function comprarMejoraDefensa() {
    if (nivelDefensa >= COSTES_DEFENSA.length) return;

    const coste = COSTES_DEFENSA[nivelDefensa];
    if (esencia < coste) return;

    esencia -= coste;
    nivelDefensa++;

    actualizarInterfaz();
    guardarProgreso();
}

// Renacimiento voluntario

function comprarParry() {
    if (parryDesbloqueado) return;
    if (esencia < COSTE_PARRY) {
        mostrarAvisoRobo(`Necesitas ${formatear(COSTE_PARRY)} Esencias para desbloquear el Parry.`);
        return;
    }

    esencia -= COSTE_PARRY;
    parryDesbloqueado = true;
    actualizarInterfaz();
    guardarProgreso();
    mostrarAvisoRobo("¡PARRY DESBLOQUEADO! ESPACIO: inmunidad durante 0,5 segundos · Recarga: 5 segundos.");
}

function activarParry() {
    const ahora = Date.now();
    if (!parryDesbloqueado || jugadorMuerto || juegoFinalizado || ahora < parryHasta || ahora < parryCooldownHasta) return false;

    parryHasta = ahora + DURACION_PARRY;
    parryCooldownHasta = ahora + COOLDOWN_PARRY;
    // Congelar inmediatamente todos los controles durante el Parry.
    teclasPulsadas.clear();
    if (alma) alma.classList.add("parry-activo");
    document.body.classList.add("parry-activo");
    mostrarAvisoRobo("¡PARRY! INMUNE DURANTE 0,5 SEGUNDOS · CONTROLES BLOQUEADOS");
    return true;
}

function renacer() {
    if (juegoFinalizado) return;
    if (tpGanadoRun < 100) {
        return mostrarAvisoRobo(
            "Necesitas acumular 100 TP antes de renacer."
        );
    }

    const ganancia = Math.floor(tpGanadoRun / 10);

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
//        [S1] [S2]           ← 2 especiales arriba (línea horizontal)
//   [N1]              [N4]
//   [N2]    [CAJA]    [N5]   ← 3 normales a cada lado (columnas verticales)
//   [N3]              [N6]
//              [N7]          ← el 7º pegado al borde inferior de la pantalla

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

    // Columnas verticales a cada lado de la caja:
    //   [1]              [4]
    //   [2]    [CAJA]    [5]
    //   [3]              [6]
    //          [7]  ← pegado al borde inferior de la pantalla
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
    } else if (id === 7) {
        // Centro horizontal, pegado al borde inferior de la PANTALLA
        // (coordenadas viewport → relativas a zonaAyudantes)
        const x = zr.width / 2 - sw / 2;
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

function colocarTodosLosSpritesAyudantes() {
    for (let id = 1; id <= 7; id++) {
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
}

function comprarAyudanteNormal(id) {
    const a = ayudantes[id];

    if (
        !a ||
        a.comprada ||
        !requisitoCumplido(ayudantes, id) ||
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

function programarSiguienteEnemigo() {
    siguienteAparicion = Date.now() +
        INTERVALO_APARICION_MIN +
        Math.random() *
        (INTERVALO_APARICION_MAX - INTERVALO_APARICION_MIN);
}

function crearBarraVida(
    contenedor,
    vida,
    clase = "vida-enemigo-segmento"
) {
    // Limitar los segmentos visuales para que las vidas enormes no creen
    // miles de nodos y ralenticen el juego en dificultades altas.
    const segmentos = Math.min(100, Math.max(1, Math.ceil(vida)));
    for (let i = 0; i < segmentos; i++) {
        contenedor.appendChild(crearElemento("span", clase));
    }
}

function crearEnemigo() {
    if (
        juegoFinalizado ||
        !zonaEnemigos ||
        enemigos.length >= MAX_ENEMIGOS ||
        !almaDoradaDesbloqueada ||
        jugadorMuerto
    ) {
        return;
    }

    const tipo = elegirTipoEnemigo();
    const d = TIPOS_ENEMIGOS[tipo];
    const id = siguienteIdEnemigo++;

    const el = crearElemento("button", `alma-enemiga ${d.clase}`);
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
    const vidaMaxima = vidaEscalada(d.vida);
    crearBarraVida(vida, vidaMaxima);

    const ahora = Date.now();

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
        derrotado: false
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
}

function actualizarVidaEnemigo(e) {
    if (!e || e.derrotado) return;

    const segmentos = e.vida.querySelectorAll(".vida-enemigo-segmento");
    const activos = Math.ceil((e.vidaActual / e.vidaMaxima) * segmentos.length);
    segmentos.forEach((s, i) => s.classList.toggle("activo", i < activos));

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
}

function derrotarEnemigo(e) {
    if (!e || e.derrotado) return;

    e.derrotado = true;
    e.elemento.classList.add("derrotada");

    darTP(e.recompensa);

    mostrarAvisoRobo(
        `¡ENEMIGO DERROTADO! +${e.recompensa} TP`
    );

    setTimeout(() => e.elemento.remove(), 300);

    enemigos = enemigos.filter(x => x.id !== e.id);

    programarSiguienteEnemigo();
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

    if (
        enemigos.length < MAX_ENEMIGOS &&
        now >= siguienteAparicion
    ) {
        crearEnemigo();
        programarSiguienteEnemigo();
    }

    actualizarOrbitaEnemigos();
    actualizarRobosEnemigos();
}

// Jefes
function comprobarAparicionJefe() {
    if (
        !almaDoradaDesbloqueada ||
        jefe ||
        jugadorMuerto ||
        Date.now() < bloqueoJefesHasta ||
        tpDesdeJefe < 1000
    ) {
        return;
    }

    crearJefe();
}

function crearJefe() {
    if (!zonaEnemigos || jefe || jugadorMuerto) return;

    bossCount++;

    const vidaMax = vidaEscalada(40 + jefesDerrotadosRun * 15);
    const id = siguienteIdJefe++;

    const el = crearElemento(
        "button",
        "alma-enemiga alma-jefe alma-abismal"
    );

    el.type = "button";
    el.id = `jefe-${id}`;
    el.tabIndex = -1;
    el.setAttribute("aria-label", `JEFE ${bossCount}`);
    el.style.setProperty("--color-enemigo", "#ff4545");

    const forma = crearElemento("span", "alma-enemiga-forma");
    const nombre = crearElemento(
        "span",
        "nombre-enemigo",
        `JEFE ${bossCount}`
    );

    const vida = crearElemento("span", "vida-enemigo");
    const textoVida = crearElemento("span", "texto-vida-enemigo");

    el.append(forma, nombre, vida, textoVida);
    crearBarraVida(vida, vidaMax);

    jefe = {
        id,
        numero: bossCount,
        vidaActual: vidaMax,
        vidaMaxima: vidaMax,
        elemento: el,
        vida,
        textoVida,
        ultimoDisparo: Date.now(),
        creado: Date.now(),
        angulo: Math.random() * Math.PI * 2,
        derrotado: false
    };

    // Evitar el cuadrado de foco del navegador
    el.addEventListener("mousedown", event => {
        event.preventDefault();
    });

    // Con Alma Dorada, el clic dispara (el daño solo llega por proyectiles)
    el.addEventListener("click", event => {
        event.stopPropagation();
        if (almaActiva === "dorada" && !jugadorMuerto) {
            crearProyectilJugador();
        }
    });

    zonaEnemigos.appendChild(el);

    actualizarVidaJefe();

    mostrarAvisoRobo(`¡JEFE ${bossCount} APARECIÓ!`);
}

function actualizarVidaJefe() {
    if (!jefe || jefe.derrotado) return;

    const segmentos = jefe.vida.querySelectorAll(".vida-enemigo-segmento");
    const activos = Math.ceil((jefe.vidaActual / jefe.vidaMaxima) * segmentos.length);
    segmentos.forEach((s, i) => s.classList.toggle("activo", i < activos));

    jefe.textoVida.textContent =
        `${jefe.vidaActual}/${jefe.vidaMaxima}`;
}

function atacarJefe(danio = 1) {
    if (juegoFinalizado || !jefe || jefe.derrotado || almaActiva !== "dorada") return;

    jefe.vidaActual = Math.max(0, jefe.vidaActual - danio);

    jefe.elemento.classList.remove("recibiendo-dano");
    void jefe.elemento.offsetWidth;
    jefe.elemento.classList.add("recibiendo-dano");

    actualizarVidaJefe();

    if (jefe.vidaActual <= 0) {
        jefe.derrotado = true;
        jefe.elemento.classList.add("derrotada");

        const jefeDerrotado = jefe;
        jefesDerrotadosRun++;
        actualizarDificultadEnemigosExistentes();

        tpDesdeJefe = 0;
        bloqueoJefesHasta = Date.now() + 60000;

        mostrarAvisoRobo(
            `¡JEFE DERROTADO! +1.000 TP · DIFICULTAD ${jefesDerrotadosRun}`
        );

        jefe = null;
        actualizarInterfaz();
        guardarProgreso();

        // La recompensa del jefe no cuenta para invocar al siguiente.
        darTP(1000, false);

        setTimeout(() => jefeDerrotado.elemento.remove(), 350);

        setTimeout(comprobarAparicionJefe, 400);
    }
}

function actualizarJefe() {
    if (juegoFinalizado || !jefe || jefe.derrotado || !zonaEnemigos) return;

    const w = zonaEnemigos.clientWidth;
    const h = zonaEnemigos.clientHeight;
    const t = Date.now();

    jefe.angulo += 0.001;

    jefe.elemento.style.left =
        `${w / 2 + Math.cos(jefe.angulo) * Math.min(160, w * 0.22)}px`;

    jefe.elemento.style.top =
        `${h * 0.22 + Math.sin(jefe.angulo * 0.7) * 35}px`;

    if (t - jefe.ultimoDisparo >= intervaloDisparoJefeActual()) {
        jefe.ultimoDisparo = t;
        dispararContraJugador(true);
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

function moverJugador() {
    if (!alma || jugadorMuerto || juegoFinalizado) return;

    const ahora = Date.now();
    if (parryHasta > 0 && ahora >= parryHasta) {
        parryHasta = 0;
        alma.classList.remove("parry-activo");
        document.body.classList.remove("parry-activo");
    }
    // Durante el Parry el jugador queda completamente inmóvil.
    // Las teclas también se limpian al entrar para evitar movimiento residual.
    if (ahora < parryHasta) {
        teclasPulsadas.clear();
        return;
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
        dorada: "ALMA DORADA: ratón para apuntar · ESPACIO para disparar.",
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

function crearProyectilJugador(dirX, dirY) {
    // El Parry bloquea también los disparos del Alma Dorada, sin importar
    // si se intenta disparar con clic, desde un enemigo o desde la caja.
    if (
        juegoFinalizado ||
        almaActiva !== "dorada" ||
        !almaDoradaDesbloqueada ||
        jugadorMuerto ||
        Date.now() < parryHasta
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

    // Extender el alcance para que el proyectil viaje lejos
    const alcance = Math.max(400, Math.min(700, dist * 1.4));
    x1 = x0 + (dx / dist) * alcance;
    y1 = y0 + (dy / dist) * alcance;

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

    proyectilesJugador.push({
        id: siguienteIdProyectil++,
        elemento: p,
        estela,
        inicio: Date.now(),
        duracion: 280,
        x0,
        y0,
        x1,
        y1,
        linea: false,
        golpes: new Set()
    });
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
                atacarEnemigo(e, 1);
            }
        }

        if (jefe && !jefe.derrotado && !p.golpes?.has(`j${jefe.id}`)) {
            const r = jefe.elemento.getBoundingClientRect();

            if (proyectilTocaRect(x, y, radioHit, r)) {
                p.golpes.add(`j${jefe.id}`);
                atacarJefe(1);
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

function obtenerOrigenDisparoEnemigo(esJefe) {
    if (esJefe && jefe && jefe.elemento) {
        const r = jefe.elemento.getBoundingClientRect();
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

    const glow = esJefe ? "#ff8800" : "#ff0000";

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

function patronDirigido(esJefe) {
    const origen = obtenerOrigenDisparoEnemigo(esJefe);
    const target = direccionHaciaAlma(origen.x, origen.y);
    const end = extenderHacia(origen.x, origen.y, target.x, target.y, 50);
    const opts = { linea: true, danio: esJefe ? 15 : 8, duracion: esJefe ? 850 : 1200 };
    // El disparo dirigido no muestra indicador.
    spawnProyectilEnemigo(origen.x, origen.y, end.x, end.y, esJefe, opts);
}

function patronAbanico(esJefe, cantidad = null) {
    const origen = obtenerOrigenDisparoEnemigo(esJefe);
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
            opts: { linea: true, danio: esJefe ? 12 : 7, duracion: esJefe ? 900 : 1250 } });
    }
    mostrarIndicadoresDeTrayectorias(disparos, esJefe, () => disparos.forEach(d => spawnProyectilEnemigo(d.x0,d.y0,d.x1,d.y1,esJefe,d.opts)));
}

function patronRafaga(esJefe, cantidad = null) {
    const n = cantidad != null ? cantidad : (esJefe ? 4 : 3);
    const intervalo = esJefe ? 110 : 140;
    const origen = obtenerOrigenDisparoEnemigo(esJefe);
    for (let i=0;i<n;i++) setTimeout(() => {
        if (jugadorMuerto) return;
        const target = direccionHaciaAlma(origen.x, origen.y);
        const end = extenderHacia(origen.x, origen.y, target.x, target.y, 50);
        spawnProyectilEnemigo(origen.x, origen.y, end.x, end.y, esJefe, {linea:true,danio:esJefe?15:8,duracion:esJefe?850:1200});
    }, i*intervalo);
}

function patronAnillo(esJefe, cantidad = null) {
    let cx, cy;
    if (esJefe && jefe && jefe.elemento) {
        const r = jefe.elemento.getBoundingClientRect(); cx = r.left + r.width/2; cy = r.top + r.height/2;
    } else { cx = window.innerWidth*(0.3+Math.random()*0.4); cy = window.innerHeight*0.18+Math.random()*40; }
    const n = cantidad != null ? cantidad : (esJefe ? 10+Math.floor(Math.random()*3) : 7+Math.floor(Math.random()*2));
    const alcance = esJefe ? 480 : 400, duracion = esJefe ? 1100 : 1400, danio = esJefe ? 11 : 7;
    const disparos=[];
    for(let i=0;i<n;i++) { const ang=(i/n)*Math.PI*2+Math.random()*0.08;
        disparos.push({x0:cx,y0:cy,x1:cx+Math.cos(ang)*alcance,y1:cy+Math.sin(ang)*alcance,opts:{linea:false,danio,duracion,radio:esJefe?14:11}});
    }
    // Aviso único del círculo: signo de exclamación en un cuadrado rojo punteado.
    if (jugadorMuerto) return;
    const aviso = crearElemento("div", "aviso-circulo-ataque");
    aviso.setAttribute("aria-hidden", "true");
    aviso.textContent = "!";
    Object.assign(aviso.style, {
        position: "fixed", left: `${cx}px`, top: `${cy}px`, transform: "translate(-50%, -50%)",
        width: "42px", height: "42px", boxSizing: "border-box", display: "flex",
        alignItems: "center", justifyContent: "center", color: "#ff2525", fontSize: "30px",
        fontWeight: "900", lineHeight: "1", border: "3px dotted #ff2525", borderRadius: "3px",
        background: "rgba(255, 0, 0, 0.08)", textShadow: "0 0 5px rgba(255,0,0,.35)",
        zIndex: "99999", pointerEvents: "none"
    });
    document.body.appendChild(aviso);
    setTimeout(() => {
        aviso.remove();
        if (!jugadorMuerto) disparos.forEach(d=>spawnProyectilEnemigo(d.x0,d.y0,d.x1,d.y1,esJefe,d.opts));
    }, esJefe ? 460 : 400);
}

function patronOla(esJefe) {
    // Lluvia más densa, conservando pequeños huecos para esquivar.
    const n=esJefe?18+Math.floor(Math.random()*4):12+Math.floor(Math.random()*4);
    const huecos=esJefe?2+Math.floor(Math.random()*2):1+Math.floor(Math.random()*2), indicesHueco=new Set();
    while(indicesHueco.size<huecos) indicesHueco.add(1+Math.floor(Math.random()*(n-2)));
    const margen=40, ancho=window.innerWidth-margen*2, y0=8+Math.random()*25, targetY=window.innerHeight*0.85;
    const disparos=[];
    for(let i=0;i<n;i++) { if(indicesHueco.has(i)) continue;
        const x0=margen+(i/(n-1))*ancho, almaPos=obtenerPosicionAlmaViewport(), x1=x0+(almaPos.x-x0)*0.18;
        disparos.push({x0,y0,x1,y1:targetY,opts:{linea:false,danio:esJefe?12:7,duracion:(esJefe?1050:1350)+Math.floor(Math.random()*80),radio:esJefe?13:11}});
    }
    // La lluvia conserva indicadores de aparición y trayectoria, incluidos los huecos.
    mostrarIndicadoresDeTrayectorias(disparos, esJefe, () => disparos.forEach(d=>spawnProyectilEnemigo(d.x0,d.y0,d.x1,d.y1,esJefe,d.opts)), true);
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

function elegirYEjecutarPatron(esJefe) {
    if (jugadorMuerto) return;

    const nivel = jefesDerrotadosRun;
    const r = Math.random();

    if (esJefe) {
        // Jefes: más peso a patrones complejos y combinados
        if (nivel >= 1 && r < 0.32) {
            patronCombinadoJefe();
        } else if (r < 0.48) {
            patronAbanico(true);
        } else if (r < 0.62) {
            patronRafaga(true);
        } else if (r < 0.76) {
            patronAnillo(true);
        } else if (r < 0.88) {
            patronOla(true);
        } else {
            patronDirigido(true);
        }
        return;
    }

    // Enemigos normales: variedad, evitando siempre el mismo patrón
    // Con más jefes derrotados, aparecen patrones más difíciles con más frecuencia
    if (r < 0.28) {
        patronDirigido(false);
    } else if (r < 0.48) {
        patronAbanico(false);
    } else if (r < 0.64) {
        patronRafaga(false);
    } else if (r < 0.78 + Math.min(0.08, nivel * 0.02)) {
        patronOla(false);
    } else if (r < 0.90 + Math.min(0.05, nivel * 0.015)) {
        patronAnillo(false);
    } else {
        patronDirigido(false);
    }
}

function mostrarIndicadoresDeTrayectorias(disparos, esJefe, alTerminar, marcarOrigen = false) {
    if (jugadorMuerto || !disparos.length) return;
    const elementos = [];
    const color = "#f05b62"; // rojo suave, sin neón intenso
    for (const d of disparos) {
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

function dispararContraJugador(esJefe = false) {
    if (jugadorMuerto) return;
    elegirYEjecutarPatron(esJefe);
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
    if (jugadorMuerto || Date.now() < parryHasta) return;

    const real = Math.max(
        1,
        Math.ceil(cantidad * (1 - obtenerDefensa()))
    );

    vidaJugador = Math.max(0, vidaJugador - real);

    actualizarInterfaz();
    guardarProgreso();

    mostrarAvisoRobo(`¡IMPACTO! -${real} HP`);

    if (vidaJugador <= 0) {
        morirJugador();
    }
}

// Muerte y reinicio de la partida
function limpiarCombate() {
    enemigos.forEach(e => e.elemento.remove());
    enemigos = [];

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

    jefe = null;
}

function morirJugador() {
    if (jugadorMuerto) return;

    jugadorMuerto = true;
    limpiarCombate();

    const verdePermanente = almaVerdeDesbloqueada;
    const doradaPermanente = almaDoradaDesbloqueada;
    const nuevoRenacimiento = renacimientos + 1;

    clicks = 0;
    tpBarra = 0;
    tpTotal = 0;
    nivel = 1;
    esencia = 0;
    tpGanadoRun = 0;
    tpDesdeJefe = 0;
    renacimientos = nuevoRenacimiento;

    nivelVida = 0;
    nivelDefensa = 0;
    vidaJugador = VIDA_INICIAL;

    almaActiva = "roja";
    parryHasta = 0;
    parryCooldownHasta = 0;
    bloqueoJefesHasta = 0;
    ultimaCuracionVerde = 0;
    document.body.classList.remove("parry-activo");
    if (alma) { alma.classList.remove("parry-activo", "alma-verde", "alma-dorada"); }
    if (boton) boton.classList.remove("modo-verde", "modo-dorado");
    bossCount = 0;
    jefesDerrotadosRun = 0;
    ultimoDisparoEnemigo = 0;

    for (const m of Object.values(mejoras)) {
        m.comprada = false;
    }

    for (const d of Object.values(durabilidades)) {
        d.comprada = false;
    }

    for (const a of Object.values(ayudantes)) {
        Object.assign(a, {
            comprada: false,
            despierta: true,
            inicioDespierta: 0,
            inicioSueno: 0,
            tiempoRestante: 0,
            ultimoDisparo: 0
        });
    }

    for (const m of Object.values(mejorasEsencia)) {
        m.nivel = 0;
    }

    mejoraTPAyudantes.nivel = 0;

    Object.assign(ayudanteEspecial, {
        cantidad: 0,
        intervaloBase: INTERVALO_DISPARO / 2,
        nivelVelocidad: 0,
        nivelTP: 0,
        ultimoDisparo: []
    });

    almaVerdeDesbloqueada = verdePermanente;
    almaDoradaDesbloqueada = doradaPermanente;

    jugadorMuerto = false;
    posicionJugador = { x: null, y: null };

    if (alma) alma.classList.remove("alma-dorada");
    if (boton) boton.classList.remove("modo-dorado");

    crearHUDCombate();
    actualizarInterfaz();
    guardarProgreso();

    mostrarAvisoRobo(
        "RENACIMIENTO POR DERROTA: has perdido las mejoras y las esencias."
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
    if (p.impactoRegistrado || almaActiva !== "roja" || jugadorMuerto) {
        return;
    }

    p.impactoRegistrado = true;
    darRecompensa(1);
    animarCorazon();

    if (p.especial) {
        darTPEspecial(obtenerTPEspecial());
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

                if (ahora - a.ultimoDisparo >= obtenerVelocidadNormal()) {
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

    document.querySelectorAll(".comprar-mejora").forEach(b => {
        const id = Number(b.dataset.mejora);
        const m = mejoras[id];

        if (!m) return;

        const ok = requisitoCumplido(mejoras, id);
        const bloque = b.closest(".mejora");
        const siguiente = Object.keys(mejoras).map(Number).sort((a, c) => a - c)
            .find(n => !mejoras[n].comprada);
        if (bloque) bloque.hidden = m.comprada || id !== siguiente;

        b.disabled = m.comprada || !ok || tpTotal < m.coste;

        b.textContent = m.comprada
            ? `MEJORA ${id} · COMPRADA`
            : !ok
                ? `MEJORA ${id} · BLOQUEADA`
                : `MEJORA ${id} · ${formatear(m.coste)} TP`;
    });

    document.querySelectorAll(".comprar-durabilidad").forEach(b => {
        const id = Number(b.dataset.durabilidad);
        const m = durabilidades[id];

        if (!m) return;

        const ok = requisitoCumplido(durabilidades, id);

        b.disabled = m.comprada || !ok || tpTotal < m.coste;

        b.textContent = m.comprada
            ? "COMPRADA"
            : !ok
                ? "BLOQUEADA"
                : "COMPRAR";
    });
}

function actualizarAyudantes() {
    document.querySelectorAll(".comprar-ayudante").forEach(b => {
        const id = Number(b.dataset.ayudante);

        if (!ayudantes[id]) b.hidden = true;
    });

    for (const id of Object.keys(ayudantes).map(Number)) {
        const a = ayudantes[id];

        const estado = document.getElementById(
            `estado-ayudante-${id}`
        );

        const b = document.querySelector(
            `.comprar-ayudante[data-ayudante="${id}"]`
        );

        let s = document.getElementById(`mini-alma-${id}`);

        if (!a.comprada) {
            if (s) s.remove();

            const ok = requisitoCumplido(ayudantes, id);

            if (b) {
                b.hidden = false;
                b.disabled = !ok || clicks < a.coste;

                b.textContent = ok
                    ? `COMPRAR · ${formatear(a.coste)} clicks`
                    : "BLOQUEADA";
            }

            if (estado) {
                estado.textContent = ok ? "Sin comprar" : "Bloqueada";
            }

            continue;
        }

        if (!s) s = crearSpriteAyudante(id);

        if (b) b.hidden = true;
        if (!s) continue;

        s.classList.toggle("dormida", !a.despierta);
        s.disabled = false;

        s.title = a.despierta
            ? `Mini alma ${id}`
            : "Haz clic para despertar";

        if (estado) {
            estado.textContent = a.despierta
                ? "Despierta"
                : "¡Haz clic para despertar!";
        }
    }

    for (let id = 1; id <= obtenerCantidadEspecial(); id++) {
        crearSpriteEspecial(id);
    }

    colocarTodosLosAyudantes();
    actualizarVisibilidadAyudantes();
}

function actualizarPanelProgresion() {
    const ce = document.getElementById("contador-esencia");
    const ir = document.getElementById("info-renacer");
    const br = document.getElementById("boton-renacer");

    const be = document.getElementById("comprar-especial");
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

        b.disabled = max || esencia < coste;

        b.textContent = max
            ? `${tipo === "click" ? "Poder de clic" : "Velocidad normal"} · MÁXIMO`
            : `${tipo === "click" ? "Poder de clic" : "Velocidad normal"} · Nivel ${m.nivel} · ${coste} Esencias`;
    });

    if (be) {
        be.disabled = n >= MAX_ESPECIALES || esencia < COSTE_ESPECIAL;

        be.textContent = n >= MAX_ESPECIALES
            ? `Ayudantes especiales · MÁXIMO ${MAX_ESPECIALES}/${MAX_ESPECIALES}`
            : `Comprar ayudante especial · ${COSTE_ESPECIAL} Esencias (${n}/${MAX_ESPECIALES})`;
    }

    if (bv) {
        const k = ayudanteEspecial.nivelVelocidad;
        const max = k >= PRECIOS_ESPECIAL.length;
        const c = max ? 0 : PRECIOS_ESPECIAL[k];

        bv.hidden = n === 0;
        bv.disabled = n === 0 || max || esencia < c;

        bv.textContent = max
            ? "Velocidad especial · MÁXIMO"
            : `Velocidad especial · Nivel ${k} · ${c} Esencias`;
    }

    if (bt) {
        const k = ayudanteEspecial.nivelTP;
        const max = k >= PRECIOS_ESPECIAL.length;
        const c = max ? 0 : PRECIOS_ESPECIAL[k];

        bt.hidden = n === 0;
        bt.disabled = n === 0 || max || esencia < c;

        bt.textContent = max
            ? "TP especial · MÁXIMO"
            : `TP especial · Nivel ${k} · ${c} Esencias`;
    }

    if (btp) {
        const k = mejoraTPAyudantes.nivel;
        const max = k >= mejoraTPAyudantes.precios.length;
        const c = max ? 0 : mejoraTPAyudantes.precios[k];

        btp.disabled = max || tpTotal < c;

        btp.textContent = max
            ? "TP por disparo · MÁXIMO"
            : `TP por disparo +50% · Nivel ${k} · ${c} TP`;
    }

    const bVerde = document.getElementById("comprar-alma-verde");
    if (bVerde) {
        bVerde.disabled = almaVerdeDesbloqueada || tpTotal < COSTE_ALMA_VERDE;
        bVerde.textContent = almaVerdeDesbloqueada
            ? "ALMA VERDE · DESBLOQUEADA PARA SIEMPRE (E)"
            : `Desbloquear Alma Verde · ${formatear(COSTE_ALMA_VERDE)} TP`;
    }

    const bd = document.getElementById("comprar-alma-dorada");

    if (bd) {
        bd.disabled =
            almaDoradaDesbloqueada ||
            esencia < COSTE_ALMA_DORADA;

        bd.textContent = almaDoradaDesbloqueada
            ? "ALMA DORADA · DESBLOQUEADA PARA SIEMPRE"
            : `Desbloquear Alma Dorada · ${formatear(COSTE_ALMA_DORADA)} Esencias`;
    }

    const bvj = document.getElementById("mejora-vida");

    if (bvj) {
        const max = nivelVida >= COSTES_VIDA.length;
        const c = max ? 0 : COSTES_VIDA[nivelVida];

        bvj.disabled = max || esencia < c;

        bvj.textContent = max
            ? `Vida · MÁXIMA (${maxVida()} HP)`
            : `Vida +${VIDA_POR_MEJORA} · Nivel ${nivelVida} · ${c} Esencias`;
    }

    const bdef = document.getElementById("mejora-defensa");

    if (bdef) {
        const max = nivelDefensa >= COSTES_DEFENSA.length;
        const c = max ? 0 : COSTES_DEFENSA[nivelDefensa];

        bdef.disabled = max || esencia < c;

        bdef.textContent = max
            ? "Defensa · MÁXIMA (50%)"
            : `Defensa ${Math.round(obtenerDefensa() * 100)}% → ${Math.round((nivelDefensa + 1) * 10)}% · ${c} Esencias`;
    }

    const bParry = document.getElementById("comprar-parry");
    if (bParry) {
        bParry.disabled = parryDesbloqueado || esencia < COSTE_PARRY;
        bParry.textContent = parryDesbloqueado
            ? "PARRY · DESBLOQUEADO (ESPACIO)"
            : `Desbloquear Parry · ${formatear(COSTE_PARRY)} Esencias`;
    }

    const bDestello = document.getElementById("comprar-el-destello");
    if (bDestello) {
        bDestello.disabled = juegoFinalizado || clicks < COSTE_DESTELLO;
        bDestello.textContent = juegoFinalizado
            ? "EL DESTELLO · JUEGO COMPLETADO"
            : `EL DESTELLO · ${formatear(COSTE_DESTELLO)} clicks`;
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
    botonReset.addEventListener("click", () => {
        if (!confirm(
            "¿Seguro que quieres reiniciar DELTACLICKER?\n\n" +
            "Perderás todo el progreso, incluido el desbloqueo del Alma Dorada."
        )) {
            return;
        }

        try {
            localStorage.removeItem(CLAVE_GUARDADO);
            location.reload();
        } catch (e) {
            console.error(e);
            alert("No se pudo borrar el guardado.");
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

window.addEventListener("keydown", event => {
    const k = event.key.length === 1
        ? event.key.toLowerCase()
        : event.key;

    // Espacio: siempre prevenir scroll; en modo dorado dispara
    if (k === " " || event.code === "Space") {
        event.preventDefault();

        if (!event.repeat && !jugadorMuerto && !juegoFinalizado) {
            if (parryDesbloqueado) {
                activarParry();
            } else if (almaActiva === "dorada" && almaDoradaDesbloqueada) {
                crearProyectilJugador();
            }
        }
        return;
    }

    // Mientras el Parry está activo no se puede mover, apuntar por teclado,
    // cambiar de alma ni activar ninguna otra acción.
    if (Date.now() < parryHasta) {
        event.preventDefault();
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
    // No permitir apuntar ni cambiar la orientación durante el Parry.
    if (Date.now() < parryHasta) return;
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
mantenerJugadorEnZona();
actualizarInterfaz();
programarSiguienteEnemigo();
if (juegoFinalizado) mostrarFinalElDestello(false);

function actualizarTemporizadorParry() {
    if (!temporizadorParry) return;
    if (!parryDesbloqueado) {
        temporizadorParry.textContent = "PARRY: BLOQUEADO";
        temporizadorParry.classList.remove("parry-listo", "parry-recarga", "parry-en-uso");
        return;
    }
    const ahora = Date.now();
    if (ahora < parryHasta) {
        temporizadorParry.textContent = `PARRY ACTIVO · ${((parryHasta - ahora) / 1000).toFixed(1)} s`;
        temporizadorParry.classList.add("parry-en-uso");
        temporizadorParry.classList.remove("parry-listo", "parry-recarga");
    } else if (ahora < parryCooldownHasta) {
        temporizadorParry.textContent = `PARRY: ${((parryCooldownHasta - ahora) / 1000).toFixed(1)} s`;
        temporizadorParry.classList.add("parry-recarga");
        temporizadorParry.classList.remove("parry-listo", "parry-en-uso");
    } else {
        temporizadorParry.textContent = "PARRY: LISTO";
        temporizadorParry.classList.add("parry-listo");
        temporizadorParry.classList.remove("parry-recarga", "parry-en-uso");
    }
}

setInterval(actualizarTemporizadorParry, 50);
setInterval(moverJugador, 16);
setInterval(actualizarCicloAyudantes, 50);

setInterval(() => {
    actualizarEnemigos();
    actualizarJefe();
    actualizarOrbitaEnemigos();
}, 100);

setInterval(() => {
    if (
        almaDoradaDesbloqueada &&
        !jugadorMuerto &&
        Date.now() - ultimoDisparoEnemigo >= intervaloDisparoEnemigoActual() &&
        enemigos.length > 0
    ) {
        ultimoDisparoEnemigo = Date.now();
        dispararContraJugador(false);
    }
}, 100);

setInterval(guardarProgreso, 5000);

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