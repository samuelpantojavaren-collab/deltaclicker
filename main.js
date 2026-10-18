
"use strict";

// ================================
// DELTACLICKER
// ================================

let clicks = 0;
let tpBarra = 0;
let tpTotal = 0;
let nivel = 1;

const CLAVE_GUARDADO = "deltaclicker";
const INTERVALO_DISPARO = 700;
const TIEMPO_SUENO = 10000;

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
    2: crearAyudante(100),
    3: crearAyudante(1000),
    4: crearAyudante(10000),
    5: crearAyudante(100000),
    6: crearAyudante(1000000),
    7: crearAyudante(10000000),
    8: crearAyudante(100000000)
};

const durabilidades = {
    1: { coste: 10, comprada: false },
    2: { coste: 50, comprada: false },
    3: { coste: 100, comprada: false }
};

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

let proyectiles = [];

// ================================
// RESET
// ================================

if (botonReset) {
    botonReset.addEventListener("click", function() {
        const confirmado = confirm(
            "¿Seguro que quieres reiniciar DELTACLICKER?\n\n" +
            "Perderás tus clicks, TP, niveles y mejoras."
        );

        if (!confirmado) return;

        try {
            localStorage.removeItem(CLAVE_GUARDADO);
        } catch (error) {
            console.error("No se pudo borrar la partida:", error);
            alert("No se pudo borrar el guardado.");
            return;
        }

        location.reload();
    });
}

// ================================
// GUARDADO Y CARGA
// ================================

function cargarProgreso() {
    try {
        const texto = localStorage.getItem(CLAVE_GUARDADO);
        if (!texto) return;

        const datos = JSON.parse(texto);

        clicks = Math.max(0, Number(datos.clicks) || 0);
        tpBarra = Math.max(0, Math.min(99, Number(datos.tpBarra) || 0));
        tpTotal = Math.max(0, Number(datos.tpTotal) || 0);
        nivel = Math.max(1, Number(datos.nivel) || 1);

        for (const id of Object.keys(mejoras)) {
            if (datos.mejoras?.[id] !== undefined) {
                mejoras[id].comprada = datos.mejoras[id] === true;
            }
        }

        for (const id of Object.keys(durabilidades)) {
            if (datos.durabilidades?.[id] !== undefined) {
                durabilidades[id].comprada =
                    datos.durabilidades[id] === true;
            }
        }

        for (const id of Object.keys(ayudantes)) {
            const guardado = datos.ayudantes?.[id];

            if (guardado) {
                ayudantes[id].comprada = guardado.comprada === true;
                ayudantes[id].despierta = guardado.despierta !== false;
            }
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
            mejoras: {},
            durabilidades: {},
            ayudantes: {}
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

        localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(datos));
    } catch (error) {
        console.error("Error al guardar la partida:", error);
    }
}

// ================================
// LÓGICA PRINCIPAL
// ================================

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

    return multiplicador;
}

function obtenerTiempoDespierto() {
    if (durabilidades[3].comprada) return Infinity;
    if (durabilidades[2].comprada) return 20000;
    if (durabilidades[1].comprada) return 15000;

    return TIEMPO_SUENO;
}

function darRecompensa(cantidadBase = 1) {
    const cantidad = cantidadBase * obtenerMultiplicador();

    clicks += cantidad;
    tpBarra += cantidad;

    if (tpBarra >= 100) {
        const ganados = Math.floor(tpBarra / 100);
        tpTotal += ganados;
        nivel += ganados;
        tpBarra %= 100;
    }

    actualizarInterfaz();
    guardarProgreso();
}

function animarCorazon() {
    if (!alma) return;

    alma.classList.remove("latir");
    void alma.offsetWidth;
    alma.classList.add("latir");
}

// ================================
// MENÚS
// ================================

function configurarMenu(botonMenu, lista, nombre) {
    if (!botonMenu || !lista) return;

    botonMenu.addEventListener("click", function() {
        const abrir = lista.hidden;

        lista.hidden = !abrir;
        botonMenu.setAttribute("aria-expanded", String(abrir));
        botonMenu.textContent = nombre + (abrir ? " ▲" : " ▼");
    });
}

configurarMenu(botonMejoras, listaMejoras, "MEJORAS");
configurarMenu(botonAyudantes, listaAyudantes, "AYUDANTES");

// ================================
// DESBLOQUEOS SECUENCIALES
// ================================

function requisitoCumplido(coleccion, id) {
    if (id === 1) return true;
    return coleccion[id - 1]?.comprada === true;
}

// ================================
// COMPRAR MEJORAS DE CLICK
// ================================

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

// ================================
// COMPRAR DURABILIDAD
// ================================

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

// ================================
// MINI ALMAS
// ================================

function crearSpriteAyudante(id) {
    if (!zonaAyudantes) return null;

    let sprite = document.getElementById(`mini-alma-${id}`);
    if (sprite) return sprite;

    sprite = document.createElement("button");
    sprite.type = "button";
    sprite.id = `mini-alma-${id}`;
    sprite.className = "mini-alma";
    sprite.setAttribute("aria-label", `Mini alma ${id}`);

    const forma = document.createElement("span");
    forma.className = "mini-alma-forma";
    forma.setAttribute("aria-hidden", "true");

    const sueno = document.createElement("span");
    sueno.className = "zzz-sueno";
    sueno.textContent = "Zzz";
    sueno.setAttribute("aria-hidden", "true");

    sprite.appendChild(forma);
    sprite.appendChild(sueno);

    sprite.addEventListener("click", function(event) {
        event.stopPropagation();

        const ayudante = ayudantes[id];

        if (!ayudante.comprada || ayudante.despierta) return;

        ayudante.despierta = true;
        ayudante.tiempoRestante = 0;
        ayudante.inicioDespierta = Date.now();
        ayudante.ultimoDisparo = Date.now();

        actualizarInterfaz();
        guardarProgreso();
    });

    zonaAyudantes.appendChild(sprite);
    return sprite;
}

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

// ================================
// INTERFAZ
// ================================

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
                    !desbloqueada || clicks < ayudante.coste;

                botonCompra.textContent = desbloqueada
                    ? "COMPRAR"
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
}

function actualizarInterfaz() {
    if (contador) contador.textContent = Math.floor(clicks);
    if (textoNivel) textoNivel.textContent = "LV " + nivel;
    if (textoTPTotal) textoTPTotal.textContent = tpTotal;

    if (textoTP) textoTP.textContent = tpBarra + "%";
    if (rellenoTP) rellenoTP.style.height = tpBarra + "%";

    actualizarBotonesCompra();
    actualizarAyudantes();
}

// ================================
// PROYECTILES
// ================================

function lanzarProyectil(id) {
    const sprite = document.getElementById(`mini-alma-${id}`);

    if (!sprite || !alma || !zonaAyudantes) return;

    const origen = sprite.getBoundingClientRect();
    const destino = alma.getBoundingClientRect();
    const zona = zonaAyudantes.getBoundingClientRect();

    const proyectil = document.createElement("span");
    proyectil.className = "mini-alma-proyectil";
    proyectil.setAttribute("aria-hidden", "true");
    zonaAyudantes.appendChild(proyectil);

    proyectiles.push({
        elemento: proyectil,
        inicio: Date.now(),
        duracion: 500,
        xInicial: origen.left + origen.width / 2 - zona.left,
        yInicial: origen.top + origen.height / 2 - zona.top,
        xFinal: destino.left + destino.width / 2 - zona.left,
        yFinal: destino.top + destino.height / 2 - zona.top
    });
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

        if (progreso >= 1) {
            proyectil.elemento.remove();
            darRecompensa(1);
            animarCorazon();
            return false;
        }

        return true;
    });
}

// ================================
// CICLO DE LOS AYUDANTES
// ================================

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

            if (ahora - ayudante.ultimoDisparo >= INTERVALO_DISPARO) {
                lanzarProyectil(id);
                ayudante.ultimoDisparo = ahora;
            }
        } else {
            ayudante.tiempoRestante = 0;
        }
    }

    actualizarInterfaz();
    actualizarProyectiles();
}

// ================================
// INICIAR
// ================================

cargarProgreso();

for (const id of Object.keys(ayudantes).map(Number)) {
    const ayudante = ayudantes[id];

    if (ayudante.comprada) {
        ayudante.inicioDespierta = Date.now();
        ayudante.ultimoDisparo = Date.now();
        crearSpriteAyudante(id);
    }
}

if (boton) {
    boton.addEventListener("click", function() {
        darRecompensa(1);
        animarCorazon();
    });
}

actualizarInterfaz();

setInterval(actualizarCicloAyudantes, 50);
setInterval(guardarProgreso, 5000);
