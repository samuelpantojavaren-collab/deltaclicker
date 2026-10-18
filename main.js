
"use strict";

// ============================================
// DELTACLICKER 0.2.0
// ============================================

const CLAVE_GUARDADO = "deltaclicker";
const TIEMPO_SUENO = 10000;
const INTERVALO_DISPARO = 700;
const MAX_ENEMIGOS = 3;
const INTERVALO_ROBO = 5000;
const INTERVALO_APARICION_MIN = 7000;
const INTERVALO_APARICION_MAX = 12000;
const DANIO_CLIC = 1;

let clicks = 0;
let tpBarra = 0;
let tpTotal = 0;
let nivel = 1;
let esencia = 0;
let tpGanadoRun = 0;
let renacimientos = 0;

// ============================================
// MEJORAS DE CLICK
// ============================================

const mejoras = {
    1: { coste: 1, multiplicador: 2, comprada: false },
    2: { coste: 2, multiplicador: 3, comprada: false },
    3: { coste: 3, multiplicador: 4, comprada: false },
    4: { coste: 5, multiplicador: 6, comprada: false },
    5: { coste: 8, multiplicador: 9, comprada: false },
    6: { coste: 13, multiplicador: 13, comprada: false },
    7: { coste: 21, multiplicador: 20, comprada: false },
    8: { coste: 34, multiplicador: 30, comprada: false }
};

const durabilidades = {
    1: { coste: 10, comprada: false },
    2: { coste: 50, comprada: false },
    3: { coste: 100, comprada: false }
};

// ============================================
// AYUDANTES NORMALES
// ============================================

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
    8: crearAyudante(8500000)
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

const ayudanteEspecial = {
    comprado: false,
    intervaloBase: INTERVALO_DISPARO / 2,
    nivelVelocidad: 0,
    nivelTP: 0,
    ultimoDisparo: 0
};

const PRECIOS_ESPECIAL = [15, 30, 60, 105, 165];

// ============================================
// ENEMIGOS
// ============================================

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
    "#53e6cf", "#a88bff", "#ffcb69", "#ff78ad",
    "#83df79", "#70b9ff", "#ff9870", "#e5e5e5"
];

let enemigos = [];
let siguienteIdEnemigo = 1;
let siguienteAparicion = 0;
let proyectiles = [];
let temporizadorAviso = null;

// ============================================
// ELEMENTOS HTML
// ============================================

const contador = document.getElementById("clicks");
const boton = document.getElementById("boton-click");
const alma = document.querySelector(".alma");
const botonReset = document.getElementById("boton-reset");

const textoTP = document.getElementById("texto-tp");
const rellenoTP = document.getElementById("relleno-tp");
const textoTPTotal = document.getElementById("tp-total");
const textoNivel = document.getElementById("nivel");

const botonMejoras = document.getElementById("boton-mejoras");
const listaMejoras = document.getElementById("lista-mejoras");
const botonAyudantes = document.getElementById("boton-ayudantes");
const listaAyudantes = document.getElementById("lista-ayudantes");

const zonaAyudantes = document.getElementById("zona-ayudantes");
const zonaEnemigos = document.getElementById("zona-enemigos");

// ============================================
// UTILIDADES
// ============================================

function numeroSeguro(valor, minimo = 0) {
    const numero = Number(valor);
    return Number.isFinite(numero)
        ? Math.max(minimo, numero)
        : minimo;
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
    if (id === 1) return true;
    return coleccion[id - 1]?.comprada === true;
}

// ============================================
// PANEL DE RENACIMIENTO
// ============================================

function crearPanelesNuevos() {
    let panel = document.getElementById("panel-progresion");

    if (!panel) {
        panel = crearElemento("section", "panel-progresion");
        panel.id = "panel-progresion";

        const titulo = crearElemento("h2", "", "RENACER Y ESENCIAS");
        panel.appendChild(titulo);

        const textoEsencia = crearElemento("p", "", "Esencias: 0");
        textoEsencia.id = "contador-esencia";
        panel.appendChild(textoEsencia);

        const textoRenacer = crearElemento("p", "", "");
        textoRenacer.id = "info-renacer";
        panel.appendChild(textoRenacer);

        const botonRenacer = crearElemento("button", "", "RENACER");
        botonRenacer.id = "boton-renacer";
        botonRenacer.type = "button";
        panel.appendChild(botonRenacer);

        const tituloTienda = crearElemento("h3", "", "MEJORAS PERMANENTES");
        panel.appendChild(tituloTienda);

        const lista = crearElemento("div", "lista-esencia");
        lista.id = "lista-esencia";
        panel.appendChild(lista);

        const tituloAyudantes = crearElemento("h3", "", "AYUDANTES ESPECIALES");
        panel.appendChild(tituloAyudantes);

        const listaEspecial = crearElemento("div", "lista-especial");
        listaEspecial.id = "lista-especial";
        panel.appendChild(listaEspecial);

        const tituloTP = crearElemento("h3", "", "PRODUCCIÓN DE LOS AYUDANTES");
        panel.appendChild(tituloTP);

        const listaTP = crearElemento("div", "lista-tp-ayudantes");
        listaTP.id = "lista-tp-ayudantes";
        panel.appendChild(listaTP);

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

        botonPanel.addEventListener("click", function() {
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

        listaEsencia.appendChild(
            crearBotonMejoraEsencia(
                "click",
                "Poder de clic",
                "+50% por nivel"
            )
        );

        listaEsencia.appendChild(
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

        const produccion = crearElemento(
            "button",
            "",
            "TP especial · 15 Esencias"
        );

        produccion.id = "mejora-especial-tp";
        produccion.type = "button";
        produccion.addEventListener(
            "click",
            () => comprarMejoraEspecial("tp")
        );

        listaEspecial.appendChild(produccion);
    }

    const listaTP = document.getElementById("lista-tp-ayudantes");

    if (listaTP && !listaTP.dataset.creada) {
        listaTP.dataset.creada = "true";

        const mejoraTP = crearElemento(
            "button",
            "",
            "TP por disparo +50% · 5 TP"
        );

        mejoraTP.id = "mejora-tp-ayudantes";
        mejoraTP.type = "button";
        mejoraTP.addEventListener("click", comprarMejoraTPAyudantes);
        listaTP.appendChild(mejoraTP);
    }

    const botonRenacer = document.getElementById("boton-renacer");

    if (botonRenacer && !botonRenacer.dataset.eventoCreado) {
        botonRenacer.dataset.eventoCreado = "true";
        botonRenacer.addEventListener("click", renacer);
    }
}

function crearBotonMejoraEsencia(tipo, nombre, efecto) {
    const botonMejora = crearElemento(
        "button",
        "comprar-mejora-esencia",
        `${nombre}: ${efecto}`
    );

    botonMejora.type = "button";
    botonMejora.dataset.mejorEsencia = tipo;

    botonMejora.addEventListener(
        "click",
        () => comprarMejoraEsencia(tipo)
    );

    return botonMejora;
}

// ============================================
// GUARDADO Y CARGA
// ============================================

function cargarProgreso() {
    try {
        const texto = localStorage.getItem(CLAVE_GUARDADO);
        if (!texto) return;

        const datos = JSON.parse(texto);

        clicks = numeroSeguro(datos.clicks);
        tpBarra = Math.min(99.999, numeroSeguro(datos.tpBarra));
        tpTotal = numeroSeguro(datos.tpTotal);
        nivel = Math.max(1, numeroSeguro(datos.nivel, 1));

        tpGanadoRun = numeroSeguro(datos.tpGanadoRun);
        esencia = numeroSeguro(datos.esencia);
        renacimientos = numeroSeguro(datos.renacimientos);

        for (const id of Object.keys(mejoras)) {
            mejoras[id].comprada = datos.mejoras?.[id] === true;
        }

        for (const id of Object.keys(durabilidades)) {
            durabilidades[id].comprada =
                datos.durabilidades?.[id] === true;
        }

        for (const id of Object.keys(ayudantes)) {
            const guardado = datos.ayudantes?.[id];
            if (!guardado) continue;

            ayudantes[id].comprada = guardado.comprada === true;
            ayudantes[id].despierta = guardado.despierta !== false;
        }

        for (const tipo of Object.keys(mejorasEsencia)) {
            const guardado = datos.mejorasEsencia?.[tipo];

            if (guardado) {
                mejorasEsencia[tipo].nivel = Math.min(
                    PRECIOS_ESENCIA.length,
                    numeroSeguro(guardado.nivel)
                );
            }
        }

        mejoraTPAyudantes.nivel = Math.min(
            mejoraTPAyudantes.precios.length,
            numeroSeguro(datos.mejoraTPAyudantes?.nivel)
        );

        if (datos.ayudanteEspecial) {
            ayudanteEspecial.comprado =
                datos.ayudanteEspecial.comprado === true;

            ayudanteEspecial.intervaloBase = Math.max(
                100,
                numeroSeguro(
                    datos.ayudanteEspecial.intervaloBase,
                    INTERVALO_DISPARO / 2
                )
            );

            ayudanteEspecial.nivelVelocidad = Math.min(
                PRECIOS_ESPECIAL.length,
                numeroSeguro(datos.ayudanteEspecial.nivelVelocidad)
            );

            ayudanteEspecial.nivelTP = Math.min(
                PRECIOS_ESPECIAL.length,
                numeroSeguro(datos.ayudanteEspecial.nivelTP)
            );
        }
    } catch (error) {
        console.error("Error al cargar la partida:", error);
    }
}

function guardarProgreso() {
    try {
        const datos = {
            clicks,
            tpBarra,
            tpTotal,
            nivel,
            esencia,
            tpGanadoRun,
            renacimientos,
            mejoras: {},
            durabilidades: {},
            ayudantes: {},
            mejorasEsencia: {},
            mejoraTPAyudantes: {
                nivel: mejoraTPAyudantes.nivel
            },
            ayudanteEspecial: {
                comprado: ayudanteEspecial.comprado,
                intervaloBase: ayudanteEspecial.intervaloBase,
                nivelVelocidad: ayudanteEspecial.nivelVelocidad,
                nivelTP: ayudanteEspecial.nivelTP
            }
        };

        for (const id of Object.keys(mejoras)) {
            datos.mejoras[id] = mejoras[id].comprada;
        }

        for (const id of Object.keys(durabilidades)) {
            datos.durabilidades[id] = durabilidades[id].comprada;
        }

        for (const id of Object.keys(ayudantes)) {
            datos.ayudantes[id] = {
                comprada: ayudantes[id].comprada,
                despierta: ayudantes[id].despierta
            };
        }

        for (const tipo of Object.keys(mejorasEsencia)) {
            datos.mejorasEsencia[tipo] = {
                nivel: mejorasEsencia[tipo].nivel
            };
        }

        localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(datos));
    } catch (error) {
        console.error("Error al guardar la partida:", error);
    }
}

// ============================================
// RECURSOS Y MULTIPLICADORES
// ============================================

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

function procesarBarraTP() {
    if (tpBarra >= 100) {
        const ganados = Math.floor(tpBarra / 100);

        tpTotal += ganados;
        tpGanadoRun += ganados;
        nivel += ganados;
        tpBarra %= 100;
    }
}

function darRecompensa(cantidadBase = 1) {
    const cantidad = cantidadBase * obtenerMultiplicador();

    clicks += cantidad;
    tpBarra += cantidad;

    procesarBarraTP();
    actualizarInterfaz();
    guardarProgreso();
}

function darTP(cantidad) {
    if (!Number.isFinite(cantidad) || cantidad <= 0) return;

    tpTotal += cantidad;
    tpGanadoRun += cantidad;

    actualizarInterfaz();
    guardarProgreso();
}

function darTPEspecial(cantidad) {
    if (!Number.isFinite(cantidad) || cantidad <= 0) return;

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

// ============================================
// RESET TOTAL
// ============================================

if (botonReset) {
    botonReset.addEventListener("click", function() {
        const confirmado = confirm(
            "¿Seguro que quieres reiniciar DELTACLICKER?\n\n" +
            "Perderás clicks, TP, Esencias, renacimientos y todas las mejoras."
        );

        if (!confirmado) return;

        try {
            localStorage.removeItem(CLAVE_GUARDADO);
            location.reload();
        } catch (error) {
            console.error("No se pudo borrar la partida:", error);
            alert("No se pudo borrar el guardado.");
        }
    });
}

// ============================================
// AVISOS
// ============================================

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

// ============================================
// MENÚS EXISTENTES
// ============================================

function configurarMenu(botonMenu, lista, nombre) {
    if (!botonMenu || !lista) return;

    lista.hidden = true;
    botonMenu.setAttribute("aria-expanded", "false");

    botonMenu.addEventListener("click", function() {
        const abrir = lista.hidden;

        lista.hidden = !abrir;
        botonMenu.setAttribute("aria-expanded", String(abrir));
        botonMenu.textContent = nombre + (abrir ? " ▲" : " ▼");
    });
}

configurarMenu(botonMejoras, listaMejoras, "MEJORAS");
configurarMenu(botonAyudantes, listaAyudantes, "AYUDANTES");

// ============================================
// COMPRAR MEJORAS DE CLICK
// ============================================

document.querySelectorAll(".comprar-mejora").forEach(function(botonCompra) {
    botonCompra.addEventListener("click", function() {
        const id = Number(botonCompra.dataset.mejora);
        const mejora = mejoras[id];

        if (!mejora || mejora.comprada) return;
        if (!requisitoCumplido(mejoras, id)) return;
        if (tpTotal < mejora.coste) return;

        tpTotal -= mejora.coste;
        mejora.comprada = true;

        actualizarInterfaz();
        guardarProgreso();
    });
});

// ============================================
// COMPRAR DURABILIDAD
// ============================================

document.querySelectorAll(".comprar-durabilidad").forEach(function(botonCompra) {
    botonCompra.addEventListener("click", function() {
        const id = Number(botonCompra.dataset.durabilidad);
        const mejora = durabilidades[id];

        if (!mejora || mejora.comprada) return;
        if (!requisitoCumplido(durabilidades, id)) return;
        if (tpTotal < mejora.coste) return;

        tpTotal -= mejora.coste;
        mejora.comprada = true;

        if (id === 3) {
            for (const ayudante of Object.values(ayudantes)) {
                ayudante.despierta = true;
                ayudante.tiempoRestante = 0;
                ayudante.inicioDespierta = Date.now();
            }
        }

        actualizarInterfaz();
        guardarProgreso();
    });
});

// ============================================
// RENACER
// ============================================

function renacer() {
    if (tpGanadoRun < 100) {
        mostrarAvisoRobo("Necesitas acumular 100 TP antes de renacer.");
        return;
    }

    const ganancia = Math.floor(tpGanadoRun / 10);

    const confirmado = confirm(
        `¿Renacer ahora?\n\n` +
        `Recibirás ${ganancia} Esencias.\n` +
        "Se reiniciarán los clicks, TP y mejoras normales.\n" +
        "Conservarás tus ayudantes, Esencias y mejoras permanentes."
    );

    if (!confirmado) return;

    esencia += ganancia;
    renacimientos += 1;

    clicks = 0;
    tpBarra = 0;
    tpTotal = 0;
    nivel = 1;
    tpGanadoRun = 0;

    for (const mejora of Object.values(mejoras)) {
        mejora.comprada = false;
    }

    for (const mejora of Object.values(durabilidades)) {
        mejora.comprada = false;
    }

    mejoraTPAyudantes.nivel = 0;

    for (const ayudante of Object.values(ayudantes)) {
        if (!ayudante.comprada) continue;

        ayudante.despierta = true;
        ayudante.inicioDespierta = Date.now();
        ayudante.ultimoDisparo = Date.now();
    }

    actualizarInterfaz();
    guardarProgreso();

    mostrarAvisoRobo(`¡RENACIMIENTO! +${ganancia} Esencias`);
}

// ============================================
// COMPRAS CON ESENCIA
// ============================================

function comprarMejoraEsencia(tipo) {
    const mejora = mejorasEsencia[tipo];
    if (!mejora) return;

    const nivelActual = mejora.nivel;
    if (nivelActual >= mejora.precios.length) return;

    const coste = mejora.precios[nivelActual];
    if (esencia < coste) return;

    esencia -= coste;
    mejora.nivel += 1;

    actualizarInterfaz();
    guardarProgreso();
}

function comprarAyudanteEspecial() {
    if (ayudanteEspecial.comprado || esencia < 15) return;

    esencia -= 15;
    ayudanteEspecial.comprado = true;

    ayudanteEspecial.intervaloBase = obtenerVelocidadNormal() / 2;
    ayudanteEspecial.ultimoDisparo = Date.now();

    crearSpriteEspecial();
    colocarSpriteEspecial();

    actualizarInterfaz();
    guardarProgreso();
}

function comprarMejoraEspecial(tipo) {
    if (!ayudanteEspecial.comprado) return;

    const propiedad = tipo === "velocidad"
        ? "nivelVelocidad"
        : "nivelTP";

    const nivelActual = ayudanteEspecial[propiedad];

    if (nivelActual >= PRECIOS_ESPECIAL.length) return;

    const coste = PRECIOS_ESPECIAL[nivelActual];
    if (esencia < coste) return;

    esencia -= coste;
    ayudanteEspecial[propiedad] += 1;

    actualizarInterfaz();
    guardarProgreso();
}

function comprarMejoraTPAyudantes() {
    const nivelActual = mejoraTPAyudantes.nivel;

    if (nivelActual >= mejoraTPAyudantes.precios.length) return;

    const coste = mejoraTPAyudantes.precios[nivelActual];
    if (tpTotal < coste) return;

    tpTotal -= coste;
    mejoraTPAyudantes.nivel += 1;

    actualizarInterfaz();
    guardarProgreso();
}

// ============================================
// AYUDANTES: SPRITES NORMALES
// ============================================

function crearSpriteAyudante(id) {
    if (!zonaAyudantes) return null;

    let sprite = document.getElementById(`mini-alma-${id}`);
    if (sprite) return sprite;

    sprite = crearElemento("button", "mini-alma");
    sprite.type = "button";
    sprite.id = `mini-alma-${id}`;
    sprite.setAttribute("aria-label", `Mini alma ${id}`);

    const forma = crearElemento("span", "mini-alma-forma");
    forma.setAttribute("aria-hidden", "true");

    const sueno = crearElemento("span", "zzz-sueno", "Zzz");
    sueno.setAttribute("aria-hidden", "true");

    sprite.append(forma, sueno);

    sprite.addEventListener("click", function(event) {
        event.stopPropagation();

        const ayudante = ayudantes[id];
        if (!ayudante.comprada || ayudante.despierta) return;

        ayudante.despierta = true;
        ayudante.inicioDespierta = Date.now();
        ayudante.ultimoDisparo = Date.now();
        ayudante.tiempoRestante = 0;

        actualizarInterfaz();
        guardarProgreso();
    });

    zonaAyudantes.appendChild(sprite);
    return sprite;
}

// ============================================
// AYUDANTE ESPECIAL
// ============================================

function crearSpriteEspecial() {
    if (!zonaAyudantes || !ayudanteEspecial.comprado) return null;

    let sprite = document.getElementById("mini-alma-especial");

    if (sprite) {
        colocarSpriteEspecial();
        return sprite;
    }

    sprite = crearElemento("button", "mini-alma mini-alma-especial");
    sprite.type = "button";
    sprite.id = "mini-alma-especial";
    sprite.setAttribute("aria-label", "Ayudante especial");

    const forma = crearElemento("span", "mini-alma-forma");
    forma.setAttribute("aria-hidden", "true");
    sprite.appendChild(forma);

    sprite.style.position = "absolute";
    sprite.style.margin = "0";

    zonaAyudantes.appendChild(sprite);

    colocarSpriteEspecial();

    return sprite;
}

function colocarSpriteEspecial() {
    const sprite = document.getElementById("mini-alma-especial");

    if (!sprite || !zonaAyudantes || !alma) return;

    const zonaRect = zonaAyudantes.getBoundingClientRect();
    const corazonRect = alma.getBoundingClientRect();

    const centroX = corazonRect.left + corazonRect.width / 2 - zonaRect.left;
    const centroY = corazonRect.top + corazonRect.height / 2 - zonaRect.top;

    const anchoSprite = sprite.offsetWidth || 42;
    const altoSprite = sprite.offsetHeight || 42;

    const distancia = Math.max(corazonRect.width / 2 + 24, 70);

    let x = centroX + distancia - anchoSprite / 2;
    let y = centroY - altoSprite / 2;

    const maxX = Math.max(0, zonaRect.width - anchoSprite);
    const maxY = Math.max(0, zonaRect.height - altoSprite);

    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));

    sprite.style.left = `${x}px`;
    sprite.style.top = `${y}px`;
}

// ============================================
// COMPRAR AYUDANTES NORMALES
// ============================================

document.querySelectorAll(".comprar-ayudante").forEach(function(botonCompra) {
    botonCompra.addEventListener("click", function() {
        const id = Number(botonCompra.dataset.ayudante);
        const ayudante = ayudantes[id];

        if (!ayudante || ayudante.comprada) return;
        if (!requisitoCumplido(ayudantes, id)) return;
        if (clicks < ayudante.coste) return;

        clicks -= ayudante.coste;

        ayudante.comprada = true;
        ayudante.despierta = true;
        ayudante.inicioDespierta = Date.now();
        ayudante.ultimoDisparo = Date.now();
        ayudante.tiempoRestante = 0;

        crearSpriteAyudante(id);

        actualizarInterfaz();
        guardarProgreso();
    });
});

// ============================================
// INTERFAZ
// ============================================

function actualizarBotonesCompra() {
    document.querySelectorAll(".comprar-mejora").forEach(function(botonCompra) {
        const id = Number(botonCompra.dataset.mejora);
        const mejora = mejoras[id];

        if (!mejora) return;

        const desbloqueada = requisitoCumplido(mejoras, id);

        botonCompra.disabled =
            mejora.comprada ||
            !desbloqueada ||
            tpTotal < mejora.coste;

        botonCompra.textContent = mejora.comprada
            ? "COMPRADA"
            : !desbloqueada
                ? "BLOQUEADA"
                : "COMPRAR";
    });

    document.querySelectorAll(".comprar-durabilidad").forEach(function(botonCompra) {
        const id = Number(botonCompra.dataset.durabilidad);
        const mejora = durabilidades[id];

        if (!mejora) return;

        const desbloqueada = requisitoCumplido(durabilidades, id);

        botonCompra.disabled =
            mejora.comprada ||
            !desbloqueada ||
            tpTotal < mejora.coste;

        botonCompra.textContent = mejora.comprada
            ? "COMPRADA"
            : !desbloqueada
                ? "BLOQUEADA"
                : "COMPRAR";
    });
}

function actualizarAyudantes() {
    for (const id of Object.keys(ayudantes).map(Number)) {
        const ayudante = ayudantes[id];

        const estado = document.getElementById(`estado-ayudante-${id}`);

        const botonCompra = document.querySelector(
            `.comprar-ayudante[data-ayudante="${id}"]`
        );

        let sprite = document.getElementById(`mini-alma-${id}`);

        if (!ayudante.comprada) {
            if (sprite) sprite.remove();

            const desbloqueada = requisitoCumplido(ayudantes, id);

            if (botonCompra) {
                botonCompra.hidden = false;
                botonCompra.disabled =
                    !desbloqueada ||
                    clicks < ayudante.coste;

                botonCompra.textContent = desbloqueada
                    ? `COMPRAR · ${formatear(ayudante.coste)} clicks`
                    : "BLOQUEADA";
            }

            if (estado) {
                estado.textContent = desbloqueada
                    ? "Sin comprar"
                    : "Bloqueada";
            }

            continue;
        }

        if (!sprite) sprite = crearSpriteAyudante(id);

        if (botonCompra) botonCompra.hidden = true;
        if (!sprite) continue;

        sprite.classList.toggle("dormida", !ayudante.despierta);
        sprite.disabled = false;

        sprite.title = ayudante.despierta
            ? `Mini alma ${id}`
            : "Haz clic para despertar";

        if (estado) {
            estado.textContent = ayudante.despierta
                ? "Despierta"
                : "¡Haz clic para despertar!";
        }
    }

    if (ayudanteEspecial.comprado) {
        colocarSpriteEspecial();
    }
}

function actualizarPanelProgresion() {
    const contadorEsencia = document.getElementById("contador-esencia");
    const infoRenacer = document.getElementById("info-renacer");
    const botonRenacer = document.getElementById("boton-renacer");

    const botonEspecial = document.getElementById("comprar-especial");
    const botonVelocidadEspecial =
        document.getElementById("mejora-especial-velocidad");
    const botonTPEspecial =
        document.getElementById("mejora-especial-tp");
    const botonTPNormal =
        document.getElementById("mejora-tp-ayudantes");

    if (contadorEsencia) {
        contadorEsencia.textContent = `Esencias: ${formatear(esencia)}`;
    }

    if (infoRenacer) {
        const faltan = Math.max(0, 100 - tpGanadoRun);
        const ganancia = Math.floor(tpGanadoRun / 10);

        infoRenacer.textContent = tpGanadoRun >= 100
            ? `Puedes renacer y ganar ${formatear(ganancia)} Esencias.`
            : `TP acumulado en esta vida: ${formatear(tpGanadoRun)} / 100. Te faltan ${formatear(faltan)} TP.`;
    }

    if (botonRenacer) {
        botonRenacer.disabled = tpGanadoRun < 100;

        botonRenacer.textContent = tpGanadoRun >= 100
            ? `RENACER · +${formatear(Math.floor(tpGanadoRun / 10))} ESENCIAS`
            : "RENACER (BLOQUEADO)";
    }

    document.querySelectorAll(".comprar-mejora-esencia").forEach(function(botonMejora) {
        const tipo = botonMejora.dataset.mejorEsencia;
        const mejora = mejorasEsencia[tipo];

        const nivelActual = mejora.nivel;
        const maximo = nivelActual >= mejora.precios.length;
        const coste = maximo ? 0 : mejora.precios[nivelActual];

        botonMejora.disabled = maximo || esencia < coste;

        botonMejora.textContent = maximo
            ? `${tipo === "click" ? "Poder de clic" : "Velocidad normal"} · MÁXIMO`
            : `${tipo === "click" ? "Poder de clic" : "Velocidad normal"} · Nivel ${nivelActual} · ${coste} Esencias`;
    });

    if (botonEspecial) {
        botonEspecial.hidden = ayudanteEspecial.comprado;
        botonEspecial.disabled = esencia < 15;
    }

    if (botonVelocidadEspecial) {
        const nivelActual = ayudanteEspecial.nivelVelocidad;
        const maximo = nivelActual >= PRECIOS_ESPECIAL.length;
        const coste = maximo ? 0 : PRECIOS_ESPECIAL[nivelActual];

        botonVelocidadEspecial.hidden = !ayudanteEspecial.comprado;

        botonVelocidadEspecial.disabled =
            !ayudanteEspecial.comprado ||
            maximo ||
            esencia < coste;

        botonVelocidadEspecial.textContent = maximo
            ? "Velocidad especial · MÁXIMO"
            : `Velocidad especial · Nivel ${nivelActual} · ${coste} Esencias`;
    }

    if (botonTPEspecial) {
        const nivelActual = ayudanteEspecial.nivelTP;
        const maximo = nivelActual >= PRECIOS_ESPECIAL.length;
        const coste = maximo ? 0 : PRECIOS_ESPECIAL[nivelActual];

        botonTPEspecial.hidden = !ayudanteEspecial.comprado;

        botonTPEspecial.disabled =
            !ayudanteEspecial.comprado ||
            maximo ||
            esencia < coste;

        botonTPEspecial.textContent = maximo
            ? "TP especial · MÁXIMO"
            : `TP especial · Nivel ${nivelActual} · ${coste} Esencias`;
    }

    if (botonTPNormal) {
        const nivelActual = mejoraTPAyudantes.nivel;
        const maximo = nivelActual >= mejoraTPAyudantes.precios.length;
        const coste = maximo ? 0 : mejoraTPAyudantes.precios[nivelActual];

        botonTPNormal.disabled = maximo || tpTotal < coste;

        botonTPNormal.textContent = maximo
            ? "TP por disparo · MÁXIMO"
            : `TP por disparo +50% · Nivel ${nivelActual} · ${coste} TP`;
    }
}

function actualizarInterfaz() {
    if (contador) contador.textContent = formatear(clicks);
    if (textoNivel) textoNivel.textContent = "LV " + nivel;
    if (textoTPTotal) textoTPTotal.textContent = formatear(tpTotal);

    if (textoTP) textoTP.textContent = `${tpBarra.toFixed(1)}%`;
    if (rellenoTP) rellenoTP.style.height = `${tpBarra}%`;

    actualizarBotonesCompra();
    actualizarAyudantes();
    actualizarPanelProgresion();
}

// ============================================
// SISTEMA DE ENEMIGOS
// ============================================

function elegirTipoEnemigo() {
    const azar = Math.random() * 100;

    if (azar < 80) return "errante";
    if (azar < 95) return "corrupta";

    return "abismal";
}

function programarSiguienteEnemigo() {
    siguienteAparicion = Date.now() +
        INTERVALO_APARICION_MIN +
        Math.random() * (
            INTERVALO_APARICION_MAX - INTERVALO_APARICION_MIN
        );
}

function crearEnemigo() {
    if (!zonaEnemigos || enemigos.length >= MAX_ENEMIGOS) return;

    const tipo = elegirTipoEnemigo();
    const datos = TIPOS_ENEMIGOS[tipo];
    const id = siguienteIdEnemigo++;

    const elemento = crearElemento(
        "button",
        `alma-enemiga ${datos.clase}`
    );

    elemento.type = "button";
    elemento.id = `enemigo-${id}`;
    elemento.setAttribute("aria-label", datos.nombre);

    const color = COLORES_ENEMIGOS[
        Math.floor(Math.random() * COLORES_ENEMIGOS.length)
    ];

    elemento.style.setProperty("--color-enemigo", color);

    const forma = crearElemento("span", "alma-enemiga-forma");
    forma.setAttribute("aria-hidden", "true");

    const nombre = crearElemento("span", "nombre-enemigo", datos.nombre);
    const vida = crearElemento("span", "vida-enemigo");
    const textoVida = crearElemento("span", "texto-vida-enemigo");

    elemento.append(forma, nombre, vida, textoVida);

    for (let i = 0; i < datos.vida; i++) {
        vida.appendChild(
            crearElemento("span", "vida-enemigo-segmento")
        );
    }

    const ahora = Date.now();

    const enemigo = {
        id,
        tipo,
        vidaActual: datos.vida,
        vidaMaxima: datos.vida,
        recompensa: datos.recompensa,
        roboTP: datos.roboTP,
        roboInicial: datos.roboInicial,
        elemento,
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

    elemento.addEventListener("click", function(event) {
        event.stopPropagation();
        atacarEnemigo(enemigo, DANIO_CLIC);
    });

    zonaEnemigos.appendChild(elemento);
    enemigos.push(enemigo);

    actualizarVidaEnemigo(enemigo);

    clicks = Math.max(0, clicks - enemigo.roboInicial);

    mostrarAvisoRobo(`${datos.nombre}: -${enemigo.roboInicial} clicks`);

    actualizarInterfaz();
    guardarProgreso();
}

function actualizarVidaEnemigo(enemigo) {
    if (!enemigo || enemigo.derrotado) return;

    const segmentos = enemigo.vida.querySelectorAll(
        ".vida-enemigo-segmento"
    );

    segmentos.forEach((segmento, indice) => {
        segmento.classList.toggle(
            "activo",
            indice < enemigo.vidaActual
        );
    });

    enemigo.textoVida.textContent =
        `${enemigo.vidaActual}/${enemigo.vidaMaxima}`;
}

function atacarEnemigo(enemigo, danio = 1) {
    if (!enemigo || enemigo.derrotado) return;

    enemigo.vidaActual = Math.max(
        0,
        enemigo.vidaActual - danio
    );

    enemigo.elemento.classList.remove("recibiendo-dano");
    void enemigo.elemento.offsetWidth;
    enemigo.elemento.classList.add("recibiendo-dano");

    actualizarVidaEnemigo(enemigo);

    if (enemigo.vidaActual <= 0) {
        derrotarEnemigo(enemigo);
    }
}

function derrotarEnemigo(enemigo) {
    if (!enemigo || enemigo.derrotado) return;

    enemigo.derrotado = true;
    enemigo.elemento.classList.add("derrotada");

    darTP(enemigo.recompensa);

    mostrarAvisoRobo(
        `¡ENEMIGO DERROTADO! +${enemigo.recompensa} TP`
    );

    setTimeout(() => enemigo.elemento.remove(), 300);

    enemigos = enemigos.filter(
        actual => actual.id !== enemigo.id
    );

    programarSiguienteEnemigo();
}

function actualizarOrbitaEnemigos() {
    if (!zonaEnemigos) return;

    const ancho = zonaEnemigos.clientWidth;
    const alto = zonaEnemigos.clientHeight;
    const centroX = ancho / 2;
    const centroY = alto / 2;
    const ahora = Date.now();

    const botonRect = boton?.getBoundingClientRect();

    const mitadCuadrado = botonRect
        ? Math.max(botonRect.width, botonRect.height) / 2
        : 120;

    const radioMinimo = mitadCuadrado + 45;

    const radioMaximo = Math.max(
        radioMinimo,
        Math.min(
            ancho / 2 - 38,
            alto / 2 - 35,
            300
        )
    );

    enemigos.forEach((enemigo, indice) => {
        if (enemigo.derrotado) return;

        const radio = Math.min(
            Math.max(enemigo.radio + indice * 12, radioMinimo),
            radioMaximo
        );

        const angulo = enemigo.angulo +
            (ahora - enemigo.creado) * enemigo.velocidadOrbita;

        const x = centroX + Math.cos(angulo) * radio;
        const y = centroY + Math.sin(angulo) * radio * 0.82;

        enemigo.elemento.style.left = `${x}px`;
        enemigo.elemento.style.top = `${y}px`;
    });
}

function actualizarRobosEnemigos() {
    const ahora = Date.now();

    let clicksRobados = 0;
    let tpRobado = 0;

    for (const enemigo of enemigos) {
        if (enemigo.derrotado) continue;

        if (ahora - enemigo.ultimoRobo >= INTERVALO_ROBO) {
            const intervalos = Math.floor(
                (ahora - enemigo.ultimoRobo) / INTERVALO_ROBO
            );

            clicksRobados += intervalos;
            enemigo.ultimoRobo += intervalos * INTERVALO_ROBO;
        }

        if (ahora - enemigo.ultimoRoboTP >= INTERVALO_ROBO) {
            const intervalos = Math.floor(
                (ahora - enemigo.ultimoRoboTP) / INTERVALO_ROBO
            );

            tpRobado += intervalos * enemigo.roboTP;
            enemigo.ultimoRoboTP += intervalos * INTERVALO_ROBO;
        }
    }

    if (clicksRobados <= 0 && tpRobado <= 0) return;

    clicks = Math.max(0, clicks - clicksRobados);
    tpTotal = Math.max(0, tpTotal - tpRobado);

    const partes = [];

    if (clicksRobados > 0) {
        partes.push(`-${clicksRobados} clicks`);
    }

    if (tpRobado > 0) {
        partes.push(`-${tpRobado} TP`);
    }

    mostrarAvisoRobo(
        `¡LAS ALMAS TE ROBAN! ${partes.join(" · ")}`
    );

    actualizarInterfaz();
    guardarProgreso();
}

function actualizarEnemigos() {
    const ahora = Date.now();

    if (
        enemigos.length < MAX_ENEMIGOS &&
        ahora >= siguienteAparicion
    ) {
        crearEnemigo();
        programarSiguienteEnemigo();
    }

    actualizarOrbitaEnemigos();
    actualizarRobosEnemigos();
}

// ============================================
// PROYECTILES
// ============================================

function enemigoMasCercano(x, y) {
    let cercano = null;
    let distanciaMinima = Infinity;

    for (const enemigo of enemigos) {
        if (enemigo.derrotado) continue;

        const rect = enemigo.elemento.getBoundingClientRect();

        const distancia = Math.hypot(
            rect.left + rect.width / 2 - x,
            rect.top + rect.height / 2 - y
        );

        if (distancia < distanciaMinima) {
            distanciaMinima = distancia;
            cercano = enemigo;
        }
    }

    return cercano;
}

function lanzarProyectilDesde(sprite, especial = false) {
    if (!sprite || !alma || !zonaAyudantes) return;

    const origen = sprite.getBoundingClientRect();

    const enemigo = enemigoMasCercano(
        origen.left + origen.width / 2,
        origen.top + origen.height / 2
    );

    const destino = enemigo
        ? enemigo.elemento.getBoundingClientRect()
        : alma.getBoundingClientRect();

    const zona = zonaAyudantes.getBoundingClientRect();

    const proyectil = crearElemento(
        "span",
        especial
            ? "proyectil-especial"
            : enemigo
                ? "proyectil-enemigo"
                : "mini-alma-proyectil"
    );

    proyectil.setAttribute("aria-hidden", "true");

    zonaAyudantes.appendChild(proyectil);

    proyectiles.push({
        elemento: proyectil,
        inicio: Date.now(),
        duracion: especial ? 350 : 500,
        xInicial: origen.left + origen.width / 2 - zona.left,
        yInicial: origen.top + origen.height / 2 - zona.top,
        xFinal: destino.left + destino.width / 2 - zona.left,
        yFinal: destino.top + destino.height / 2 - zona.top,
        objetivoId: enemigo ? enemigo.id : null,
        especial
    });
}

function lanzarProyectil(id) {
    lanzarProyectilDesde(
        document.getElementById(`mini-alma-${id}`),
        false
    );
}

function actualizarProyectiles() {
    const ahora = Date.now();

    proyectiles = proyectiles.filter(function(proyectil) {
        const progreso = Math.min(
            1,
            (ahora - proyectil.inicio) / proyectil.duracion
        );

        const x = proyectil.xInicial +
            (proyectil.xFinal - proyectil.xInicial) * progreso;

        const y = proyectil.yInicial +
            (proyectil.yFinal - proyectil.yInicial) * progreso;

        proyectil.elemento.style.transform =
            `translate(${x}px, ${y}px) translate(-50%, -50%)`;

        if (progreso < 1) return true;

        proyectil.elemento.remove();

        if (proyectil.objetivoId !== null) {
            const enemigo = enemigos.find(
                actual => actual.id === proyectil.objetivoId
            );

            if (enemigo && !enemigo.derrotado) {
                atacarEnemigo(enemigo, 1);

                if (proyectil.especial) {
                    darTPEspecial(obtenerTPEspecial());
                } else {
                    darTP(obtenerTPPorDisparoNormal());
                }
            }
        } else {
            // Todo proyectil que llegue al corazón genera clicks.
            darRecompensa(1);
            animarCorazon();

            // El ayudante especial también conserva su producción extra de TP.
            if (proyectil.especial) {
                darTPEspecial(obtenerTPEspecial());
            }
        }

        return false;
    });
}

// ============================================
// CICLO DE LOS AYUDANTES
// ============================================

function actualizarCicloAyudantes() {
    const ahora = Date.now();

    for (const id of Object.keys(ayudantes).map(Number)) {
        const ayudante = ayudantes[id];

        if (!ayudante.comprada) continue;

        if (durabilidades[3].comprada) {
            ayudante.despierta = true;
            ayudante.tiempoRestante = 0;
        }

        if (ayudante.despierta) {
            if (
                !durabilidades[3].comprada &&
                ahora - ayudante.inicioDespierta >= obtenerTiempoDespierto()
            ) {
                ayudante.despierta = false;
                ayudante.inicioSueno = ahora;
                ayudante.tiempoRestante = 0;
                continue;
            }

            if (
                ahora - ayudante.ultimoDisparo >= obtenerVelocidadNormal()
            ) {
                lanzarProyectil(id);
                ayudante.ultimoDisparo = ahora;
            }
        }
    }

    if (ayudanteEspecial.comprado) {
        const spriteEspecial = crearSpriteEspecial();

        colocarSpriteEspecial();

        if (
            spriteEspecial &&
            ahora - ayudanteEspecial.ultimoDisparo >= obtenerIntervaloEspecial()
        ) {
            lanzarProyectilDesde(spriteEspecial, true);
            ayudanteEspecial.ultimoDisparo = ahora;
        }
    }

    actualizarProyectiles();
}

// ============================================
// CLIC DEL JUGADOR
// ============================================

if (boton) {
    boton.addEventListener("click", function(event) {
        event.stopPropagation();

        darRecompensa(1);
        animarCorazon();
    });
}

// ============================================
// INICIAR
// ============================================

crearPanelesNuevos();
cargarProgreso();

for (const id of Object.keys(ayudantes).map(Number)) {
    const ayudante = ayudantes[id];

    if (ayudante.comprada) {
        ayudante.inicioDespierta = Date.now();
        ayudante.ultimoDisparo = Date.now();

        crearSpriteAyudante(id);
    }
}

if (ayudanteEspecial.comprado) {
    ayudanteEspecial.ultimoDisparo = Date.now();

    crearSpriteEspecial();
    colocarSpriteEspecial();
}

actualizarInterfaz();
programarSiguienteEnemigo();

setInterval(actualizarCicloAyudantes, 50);
setInterval(actualizarEnemigos, 100);
setInterval(guardarProgreso, 5000);

window.addEventListener("resize", colocarSpriteEspecial);
