"use strict";

// ============================================
// DELTACLICKER 0.3.0
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
const COSTE_ALMA_DORADA = 50000;
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

let almaDoradaDesbloqueada = false;
let almaActiva = "roja";
let nivelVida = 0;
let nivelDefensa = 0;
let vidaJugador = VIDA_INICIAL;
let jugadorMuerto = false;

let bossCount = 0;
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

function configurarMenu(botonMenu, lista, nombre) {
    if (!botonMenu || !lista) return;

    lista.hidden = true;
    botonMenu.setAttribute("aria-expanded", "false");

    botonMenu.addEventListener("click", () => {
        const abrir = lista.hidden;

        lista.hidden = !abrir;
        botonMenu.setAttribute("aria-expanded", String(abrir));
        botonMenu.textContent = nombre + (abrir ? " ▲" : " ▼");
    });
}

function colocarBotonesJuntos() {
    const botonProgresion = document.getElementById("boton-progresion");

    if (!botonAyudantes || !botonProgresion) return;

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

    grupo.append(botonAyudantes, botonProgresion);
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

        panel.appendChild(
            crearElemento("h3", "", "COMBATE")
        );

        const combate = crearElemento("div", "lista-combate");
        combate.id = "lista-combate";
        panel.appendChild(combate);

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

    const combate = document.getElementById("lista-combate");

    if (combate && !combate.dataset.creada) {
        combate.dataset.creada = "true";

        const dorada = crearElemento(
            "button",
            "",
            "Desbloquear Alma Dorada · 1.000.000 Esencias"
        );

        dorada.id = "comprar-alma-dorada";
        dorada.type = "button";
        dorada.addEventListener("click", comprarAlmaDorada);
        combate.appendChild(dorada);

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

        almaDoradaDesbloqueada = d.almaDoradaDesbloqueada === true;

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
            almaDoradaDesbloqueada,
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
        tpDesdeJefe += ganados;
        nivel += ganados;
        tpBarra %= 100;
    }

    comprobarAparicionJefe();
}

function darRecompensa(cantidadBase = 1) {
    if (jugadorMuerto) return;

    const cantidad = cantidadBase * obtenerMultiplicador();

    clicks += cantidad;
    tpBarra += cantidad;

    procesarBarraTP();
    actualizarInterfaz();
    guardarProgreso();
}

function darTP(cantidad) {
    if (!Number.isFinite(cantidad) || cantidad <= 0 || jugadorMuerto) {
        return;
    }

    tpTotal += cantidad;
    tpGanadoRun += cantidad;
    tpDesdeJefe += cantidad;

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
    colocarTodosLosEspeciales();
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

function comprarAlmaDorada() {
    if (almaDoradaDesbloqueada) return;

    if (esencia < COSTE_ALMA_DORADA) {
        return mostrarAvisoRobo("Necesitas 1.000.000 de Esencias.");
    }

    esencia -= COSTE_ALMA_DORADA;
    almaDoradaDesbloqueada = true;

    mostrarAvisoRobo("¡ALMA DORADA DESBLOQUEADA PARA SIEMPRE!");

    actualizarInterfaz();
    guardarProgreso();
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
function renacer() {
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

    mostrarAvisoRobo(`¡RENACIMIENTO! +${ganancia} Esencias`);
}

// Ayudantes
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

    zonaAyudantes.appendChild(s);
    colocarSpriteEspecial(id);

    return s;
}

function colocarSpriteEspecial(id) {
    const s = document.getElementById(`mini-alma-especial-${id}`);

    if (!s || !zonaAyudantes || !alma || !boton) return;

    const zr = zonaAyudantes.getBoundingClientRect();
    const ar = boton.getBoundingClientRect();

    const cx = ar.left + ar.width / 2 - zr.left;
    const cy = ar.top + ar.height / 2 - zr.top;

    const sw = s.offsetWidth || 42;
    const sh = s.offsetHeight || 42;
    const n = obtenerCantidadEspecial();

    const ang = -Math.PI / 2 +
        (2 * Math.PI * (id - 1)) / Math.max(1, n);

    const dist = Math.max(ar.width / 2 + 40, 75);

    s.style.left = `${Math.max(
        0,
        Math.min(cx + Math.cos(ang) * dist - sw / 2, zr.width - sw)
    )}px`;

    s.style.top = `${Math.max(
        0,
        Math.min(cy + Math.sin(ang) * dist - sh / 2, zr.height - sh)
    )}px`;
}

function colocarTodosLosEspeciales() {
    for (let id = 1; id <= obtenerCantidadEspecial(); id++) {
        colocarSpriteEspecial(id);
    }
}

function actualizarVisibilidadAyudantes() {
    const ocultos = almaActiva === "dorada";

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
    for (let i = 0; i < vida; i++) {
        contenedor.appendChild(crearElemento("span", clase));
    }
}

function crearEnemigo() {
    if (
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
    crearBarraVida(vida, d.vida);

    const ahora = Date.now();

    const e = {
        id,
        tipo,
        vidaActual: d.vida,
        vidaMaxima: d.vida,
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
    enemigos.push(e);

    actualizarVidaEnemigo(e);

    clicks = Math.max(0, clicks - e.roboInicial);

    mostrarAvisoRobo(`${d.nombre}: -${d.roboInicial} clicks`);

    actualizarInterfaz();
    guardarProgreso();
}

function actualizarVidaEnemigo(e) {
    if (!e || e.derrotado) return;

    e.vida.querySelectorAll(".vida-enemigo-segmento").forEach(
        (s, i) => s.classList.toggle("activo", i < e.vidaActual)
    );

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
    if (!almaDoradaDesbloqueada || jugadorMuerto) return;

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
        tpDesdeJefe < 1000
    ) {
        return;
    }

    crearJefe();
}

function crearJefe() {
    if (!zonaEnemigos || jefe || jugadorMuerto) return;

    bossCount++;

    const vidaMax = 40 + (bossCount - 1) * 15;
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

    jefe.vida.querySelectorAll(".vida-enemigo-segmento").forEach(
        (s, i) => s.classList.toggle("activo", i < jefe.vidaActual)
    );

    jefe.textoVida.textContent =
        `${jefe.vidaActual}/${jefe.vidaMaxima}`;
}

function atacarJefe(danio = 1) {
    if (!jefe || jefe.derrotado || almaActiva !== "dorada") return;

    jefe.vidaActual = Math.max(0, jefe.vidaActual - danio);

    jefe.elemento.classList.remove("recibiendo-dano");
    void jefe.elemento.offsetWidth;
    jefe.elemento.classList.add("recibiendo-dano");

    actualizarVidaJefe();

    if (jefe.vidaActual <= 0) {
        jefe.derrotado = true;
        jefe.elemento.classList.add("derrotada");

        const jefeDerrotado = jefe;

        tpDesdeJefe = Math.max(0, tpDesdeJefe - 1000);

        mostrarAvisoRobo("¡JEFE DERROTADO! +1.000 TP");

        jefe = null;

        darTP(1000);

        setTimeout(() => jefeDerrotado.elemento.remove(), 350);

        setTimeout(comprobarAparicionJefe, 400);
    }
}

function actualizarJefe() {
    if (!jefe || jefe.derrotado || !zonaEnemigos) return;

    const w = zonaEnemigos.clientWidth;
    const h = zonaEnemigos.clientHeight;
    const t = Date.now();

    jefe.angulo += 0.001;

    jefe.elemento.style.left =
        `${w / 2 + Math.cos(jefe.angulo) * Math.min(160, w * 0.22)}px`;

    jefe.elemento.style.top =
        `${h * 0.22 + Math.sin(jefe.angulo * 0.7) * 35}px`;

    if (t - jefe.ultimoDisparo >= INTERVALO_DISPARO_JEFE) {
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
    if (!alma || jugadorMuerto) return;

    const limites = obtenerLimitesCajaVerde();
    if (!limites) return;

    const { minX, minY, maxX, maxY } = limites;

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
    if (!almaDoradaDesbloqueada) {
        mostrarAvisoRobo(
            "Desbloquea el Alma Dorada para cambiar de alma."
        );
        return;
    }

    almaActiva = almaActiva === "roja" ? "dorada" : "roja";

    if (alma) {
        alma.classList.toggle(
            "alma-dorada",
            almaActiva === "dorada"
        );
    }

    if (boton) {
        boton.classList.toggle(
            "modo-dorado",
            almaActiva === "dorada"
        );
    }

    actualizarOrientacionAlma();
    actualizarVisibilidadAyudantes();
    actualizarInterfaz();

    mostrarAvisoRobo(
        almaActiva === "dorada"
            ? "ALMA DORADA: ratón para apuntar · ESPACIO para disparar"
            : "ALMA ROJA: los ayudantes vuelven a funcionar."
    );
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

function crearProyectilJugador() {
    if (
        almaActiva !== "dorada" ||
        !almaDoradaDesbloqueada ||
        jugadorMuerto
    ) {
        return;
    }

    const origen = obtenerPosicionAlmaViewport();
    const x0 = origen.x;
    const y0 = origen.y;

    let x1 = posicionRaton.x;
    let y1 = posicionRaton.y;

    // Si no hay posición de ratón, disparar hacia arriba
    if (x1 === null || y1 === null) {
        x1 = x0;
        y1 = y0 - 400;
    }

    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.hypot(dx, dy) || 1;

    // Extender el rayo hasta ~600 px para que sea una línea visible
    const alcance = Math.max(400, Math.min(700, dist * 1.4));
    x1 = x0 + (dx / dist) * alcance;
    y1 = y0 + (dy / dist) * alcance;

    const p = crearElemento("span", "proyectil-jugador proyectil-linea");
    p.setAttribute("aria-hidden", "true");

    Object.assign(p.style, {
        position: "fixed",
        left: `${x0}px`,
        top: `${y0}px`,
        width: "0px",
        height: "3px",
        transformOrigin: "0 50%",
        background: "linear-gradient(90deg, #ffd700, #fff5a0, transparent)",
        boxShadow: "0 0 6px #ffd700, 0 0 14px #ff9900",
        border: "none",
        pointerEvents: "none",
        zIndex: "15"
    });

    document.body.appendChild(p);

    proyectilesJugador.push({
        id: siguienteIdProyectil++,
        elemento: p,
        inicio: Date.now(),
        duracion: 280,
        x0,
        y0,
        x1,
        y1,
        linea: true,
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

        if (p.linea) {
            const dx = x - p.x0;
            const dy = y - p.y0;
            const len = Math.hypot(dx, dy);
            const ang = Math.atan2(dy, dx) * (180 / Math.PI);

            p.elemento.style.width = `${len}px`;
            p.elemento.style.transform = `rotate(${ang}deg)`;
        } else {
            p.elemento.style.position = "fixed";
            p.elemento.style.left = `${x}px`;
            p.elemento.style.top = `${y}px`;
            p.elemento.style.transform = "translate(-50%, -50%)";
        }

        // Colisión continua con enemigos y jefe a lo largo de la línea
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
        return false;
    });
}

// Disparos enemigos: línea recta hacia el corazón (no hacia el centro de la caja)
function dispararContraJugador(esJefe = false) {
    if (jugadorMuerto) return;

    const origen = esJefe && jefe
        ? jefe.elemento.getBoundingClientRect()
        : null;

    // Origen: jefe o un punto aleatorio en el borde superior
    const x0 = origen
        ? origen.left + origen.width / 2
        : Math.random() * window.innerWidth;

    const y0 = origen
        ? origen.top + origen.height / 2
        : 0;

    // Objetivo: posición actual del corazón del jugador
    const corazon = obtenerPosicionAlmaViewport();
    let x1 = corazon.x;
    let y1 = corazon.y;

    // Extender un poco más allá del corazón para que la línea lo atraviese
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.hypot(dx, dy) || 1;
    const extra = 40;
    x1 = x0 + (dx / dist) * (dist + extra);
    y1 = y0 + (dy / dist) * (dist + extra);

    const el = crearElemento(
        "span",
        esJefe
            ? "proyectil-enemigo proyectil-jefe proyectil-linea"
            : "proyectil-enemigo proyectil-linea"
    );

    el.setAttribute("aria-hidden", "true");

    Object.assign(el.style, {
        position: "fixed",
        left: `${x0}px`,
        top: `${y0}px`,
        width: "0px",
        height: esJefe ? "4px" : "3px",
        transformOrigin: "0 50%",
        background: esJefe
            ? "linear-gradient(90deg, #ff8800, #ff4400, transparent)"
            : "linear-gradient(90deg, #00ff99, #caffee, transparent)",
        boxShadow: esJefe
            ? "0 0 6px #ff8800, 0 0 12px #ff4400"
            : "0 0 5px #00ff99, 0 0 10px #00ff99",
        border: "none",
        pointerEvents: "none",
        zIndex: "15"
    });

    document.body.appendChild(el);

    proyectilesEnemigos.push({
        elemento: el,
        inicio: Date.now(),
        duracion: esJefe ? 900 : 1300,
        x0,
        y0,
        x1,
        y1,
        danio: esJefe ? 15 : 8,
        radio: 12,
        linea: true,
        impactoRegistrado: false
    });
}

function actualizarProyectilesEnemigos() {
    const now = Date.now();

    proyectilesEnemigos = proyectilesEnemigos.filter(p => {
        const q = Math.min(1, (now - p.inicio) / p.duracion);

        const x = p.x0 + (p.x1 - p.x0) * q;
        const y = p.y0 + (p.y1 - p.y0) * q;

        if (p.linea) {
            const dx = x - p.x0;
            const dy = y - p.y0;
            const len = Math.hypot(dx, dy);
            const ang = Math.atan2(dy, dx) * (180 / Math.PI);

            p.elemento.style.width = `${Math.max(0, len)}px`;
            p.elemento.style.height = p.elemento.style.height || "3px";
            p.elemento.style.transform = `rotate(${ang}deg)`;
            p.elemento.style.left = `${p.x0}px`;
            p.elemento.style.top = `${p.y0}px`;
        } else {
            p.elemento.style.position = "fixed";
            p.elemento.style.left = `${x}px`;
            p.elemento.style.top = `${y}px`;
            p.elemento.style.transform = "translate(-50%, -50%)";
        }

        // Colisión con el corazón real del jugador (no con el centro de la caja)
        if (!p.impactoRegistrado && alma) {
            const hr = alma.getBoundingClientRect();

            if (proyectilTocaRect(x, y, p.radio || 12, hr)) {
                p.impactoRegistrado = true;
                p.elemento.remove();
                recibirDanio(p.danio);
                return false;
            }
        }

        if (q < 1) return true;

        p.elemento.remove();
        return false;
    });
}

function recibirDanio(cantidad) {
    if (jugadorMuerto) return;

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

    proyectilesJugador.forEach(p => p.elemento.remove());
    proyectilesJugador = [];

    proyectilesEnemigos.forEach(p => p.elemento.remove());
    proyectilesEnemigos = [];

    if (jefe) {
        jefe.elemento.remove();
    }

    jefe = null;
}

function morirJugador() {
    if (jugadorMuerto) return;

    jugadorMuerto = true;
    limpiarCombate();

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
    bossCount = 0;

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
    // Radio real del proyectil (mitad del tamaño CSS + un poco de margen)
    return especial ? 6 : 5;
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

    const enemigo = almaDoradaDesbloqueada
        ? enemigoMasCercano(x0, y0)
        : null;

    let x1;
    let y1;

    if (enemigo) {
        // Si hay un enemigo, apuntar a su centro.
        const destino = enemigo.elemento.getBoundingClientRect();

        x1 = destino.left + destino.width / 2;
        y1 = destino.top + destino.height / 2;
    } else {
        // Si no hay enemigos, apuntar al borde de la caja verde
        // (un poco más allá del borde exterior para asegurar cruce).
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

        x1 = x0 + dx * t;
        y1 = y0 + dy * t;
    }

    const p = crearElemento(
        "span",
        especial
            ? "proyectil-especial"
            : enemigo
                ? "proyectil-enemigo"
                : "mini-alma-proyectil"
    );

    p.setAttribute("aria-hidden", "true");
    zonaAyudantes.appendChild(p);

    proyectilesJugador.push({
        elemento: p,
        inicio: Date.now(),
        duracion: especial ? 350 : 500,
        x0,
        y0,
        x1,
        y1,
        objetivo: enemigo
            ? { tipo: "enemigo", id: enemigo.id }
            : null,
        helper: true,
        especial,
        impactoRegistrado: false,
        radio: radioProyectilAyudante(especial)
    });
}

function actualizarProyectilesAyudantes() {
    const now = Date.now();

    proyectilesJugador = proyectilesJugador.filter(p => {
        if (!p.helper) return true;

        const q = Math.min(1, (now - p.inicio) / p.duracion);
        const zona = zonaAyudantes?.getBoundingClientRect();

        const x = p.x0 + (p.x1 - p.x0) * q;
        const y = p.y0 + (p.y1 - p.y0) * q;

        p.elemento.style.position = "absolute";
        p.elemento.style.left = `${x - (zona?.left || 0)}px`;
        p.elemento.style.top = `${y - (zona?.top || 0)}px`;
        p.elemento.style.transform = "translate(-50%, -50%)";

        // Solo los proyectiles de ayudantes sin objetivo enemigo
        // colisionan con el borde de la caja verde.
        if (
            !p.objetivo &&
            !p.impactoRegistrado &&
            proyectilTocaCajaVerde(x, y, p.radio || 5)
        ) {
            registrarImpactoCajaVerde(p);
            p.elemento.remove();
            return false;
        }

        if (q < 1) return true;

        p.elemento.remove();

        if (p.objetivo) {
            const e = enemigos.find(
                e => e.id === p.objetivo.id
            );

            if (e && almaDoradaDesbloqueada) {
                if (almaActiva === "roja") {
                    e.vidaActual = Math.max(0, e.vidaActual - 1);

                    actualizarVidaEnemigo(e);

                    if (e.vidaActual <= 0) {
                        derrotarEnemigo(e);
                    }

                    darTP(
                        p.especial
                            ? obtenerTPEspecial()
                            : obtenerTPPorDisparoNormal()
                    );
                }
            }
        } else if (!p.impactoRegistrado && almaActiva === "roja") {
            // Fallback si el proyectil llegó al final sin haber
            // detectado colisión (por redondeo de coordenadas).
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

    colocarTodosLosEspeciales();
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

        if (jugadorMuerto) return;

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
        "#menu-mejoras, #menu-ayudantes, #panel-progresion, #lista-mejoras, #lista-ayudantes, #boton-reset, #boton-mejoras, #boton-ayudantes, #boton-progresion, .comprar-mejora, .comprar-ayudante, .comprar-durabilidad, #panel-progresion button"
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

        if (
            !event.repeat &&
            almaActiva === "dorada" &&
            almaDoradaDesbloqueada &&
            !jugadorMuerto
        ) {
            crearProyectilJugador();
        }
        return;
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(k)) {
        event.preventDefault();
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
    alma.classList.toggle(
        "alma-dorada",
        almaActiva === "dorada"
    );
}

if (boton) {
    boton.classList.toggle(
        "modo-dorado",
        almaActiva === "dorada"
    );
}

actualizarVisibilidadAyudantes();
colocarTodosLosEspeciales();
colocarBotonesJuntos();
mantenerJugadorEnZona();
actualizarInterfaz();
programarSiguienteEnemigo();

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
        Date.now() - ultimoDisparoEnemigo >= INTERVALO_DISPARO_ENEMIGO &&
        enemigos.length > 0
    ) {
        ultimoDisparoEnemigo = Date.now();
        dispararContraJugador(false);
    }
}, 100);

setInterval(guardarProgreso, 5000);

window.addEventListener("resize", () => {
    mantenerJugadorEnZona();
    colocarTodosLosEspeciales();
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