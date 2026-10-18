/**
 * ============================================================================
 * GUÍA FRONTEND CONSUMO DE API - EJECUCIÓN EN NAVEGADOR (app.js)
 * Autor: Francisco Javier Urbina Mejía - Ingeniería de Sistemas
 * ============================================================================
 */

const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/pokemon";

const TYPE_COLORS = {
    normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C",
    grass: "#7AC74C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1",
    ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
    rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", dark: "#705746",
    steel: "#B7B7CE", fairy: "#D685AD"
};

const STAT_NAMES_ES = {
    "hp": "PS (Vida)",
    "attack": "Ataque",
    "defense": "Defensa",
    "special-attack": "Ataque Esp.",
    "special-defense": "Defensa Esp.",
    "speed": "Velocidad"
};

// 1. Consumo de Endpoint Individual: GET https://pokeapi.co/api/v2/pokemon/:identificador
async function buscarPokemonIndividual(identificadorOpcional) {
    const inputEl = document.getElementById("input-identificador");
    const urlDisplay = document.getElementById("url-individual-display");
    const contenedor = document.getElementById("resultado-individual");

    const valorBruto = identificadorOpcional !== undefined ? String(identificadorOpcional) : inputEl.value;
    const identificador = valorBruto.trim().toLowerCase();

    if (!identificador) return;
    inputEl.value = valorBruto;

    const endpointUrl = `${POKEAPI_BASE_URL}/${encodeURIComponent(identificador)}`;
    urlDisplay.textContent = endpointUrl;

    contenedor.innerHTML = `
        <div class="loader-box">
            <div class="pokeball-spinner"></div>
            <p>Consultando PokéAPI para <strong>${valorBruto}</strong>...</p>
        </div>
    `;

    try {
        const respuesta = await fetch(endpointUrl);
        if (!respuesta.ok) {
            throw new Error(`No se encontró ningún Pokémon con el identificador "${valorBruto}" (Código ${respuesta.status}).`);
        }

        const pokemon = await respuesta.json();
        renderizarPokemonIndividual(pokemon, contenedor);
    } catch (error) {
        contenedor.innerHTML = `
            <div class="error-alert">
                ⚠️ ${error.message || "Error al conectar con PokéAPI."} Verifica el nombre o número de Pokédex.
            </div>
        `;
    }
}

function renderizarPokemonIndividual(pokemon, contenedor) {
    const imagenHD = pokemon.sprites?.other?.["official-artwork"]?.front_default || pokemon.sprites.front_default;
    const alturaMetros = (pokemon.height / 10).toFixed(1);
    const pesoKg = (pokemon.weight / 10).toFixed(1);
    const habilidades = pokemon.abilities.map(a => a.ability.name.replace("-", " ")).join(", ");

    const tiposHtml = pokemon.types.map(t => {
        const color = TYPE_COLORS[t.type.name] || "#555";
        return `<span class="type-badge" style="background-color: ${color};">${t.type.name}</span>`;
    }).join("");

    const statsHtml = pokemon.stats.map(s => {
        const nombreStat = STAT_NAMES_ES[s.stat.name] || s.stat.name;
        const porcentaje = Math.min(100, Math.round((s.base_stat / 255) * 100));
        return `
            <div class="stat-row">
                <span class="stat-name">${nombreStat}</span>
                <span class="stat-num">${s.base_stat}</span>
                <div class="stat-bar-bg">
                    <div class="stat-bar-fill" style="width: ${porcentaje}%;"></div>
                </div>
            </div>
        `;
    }).join("");

    const botonSonido = pokemon.cries?.latest
        ? `<button type="button" class="btn-action btn-secondary" onclick="reproducirGrito('${pokemon.cries.latest}')">🔊 Escuchar Grito</button>`
        : "";

    contenedor.innerHTML = `
        <article class="pokemon-featured-card">
            <div class="pokemon-visual-col">
                <span class="pokedex-number-badge">#${String(pokemon.id).padStart(4, "0")}</span>
                <img src="${imagenHD}" alt="${pokemon.name}" class="pokemon-main-img">
                <div class="pokemon-types">${tiposHtml}</div>
            </div>

            <div class="pokemon-details-col">
                <div class="pokemon-title-row">
                    <h2>${pokemon.name}</h2>
                    ${botonSonido}
                </div>

                <div class="metrics-grid">
                    <div class="metric-box">
                        <div class="metric-label">Altura</div>
                        <div class="metric-value">${alturaMetros} m</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">Peso</div>
                        <div class="metric-value">${pesoKg} kg</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">Exp. Base</div>
                        <div class="metric-value">${pokemon.base_experience ?? "N/A"}</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">Habilidades</div>
                        <div class="metric-value" style="font-size: 0.9rem; text-transform: capitalize;">${habilidades}</div>
                    </div>
                </div>

                <div class="stats-container">
                    <h4>📊 Estadísticas Base</h4>
                    ${statsHtml}
                </div>
            </div>
        </article>
    `;
}

// 2. Consumo de Endpoint por Lista/Rango: GET https://pokeapi.co/api/v2/pokemon?limit=X&offset=Y
async function cargarListaPorRango() {
    const inputInicio = document.getElementById("input-inicio");
    const inputFin = document.getElementById("input-fin");
    const badgeParams = document.getElementById("badge-params");
    const urlListaDisplay = document.getElementById("url-lista-display");
    const contenedorLista = document.getElementById("resultado-lista");

    let inicio = parseInt(inputInicio.value, 10);
    let fin = parseInt(inputFin.value, 10);

    if (isNaN(inicio) || inicio < 1) inicio = 1;
    if (isNaN(fin) || fin < inicio) fin = inicio;

    if (fin - inicio >= 60) {
        fin = inicio + 59;
        inputFin.value = String(fin);
    }

    const offset = inicio - 1;
    const limit = (fin - inicio) + 1;

    badgeParams.innerHTML = `limit: <strong>${limit}</strong> | offset: <strong>${offset}</strong>`;
    const endpointLista = `${POKEAPI_BASE_URL}?limit=${limit}&offset=${offset}`;
    urlListaDisplay.textContent = endpointLista;

    contenedorLista.innerHTML = `
        <div class="loader-box">
            <div class="pokeball-spinner"></div>
            <p>Cargando lista de Pokémon desde el <strong>#${inicio}</strong> hasta el <strong>#${fin}</strong>...</p>
        </div>
    `;

    try {
        const respuesta = await fetch(endpointLista);
        if (!respuesta.ok) {
            throw new Error(`Error al obtener la lista (Código ${respuesta.status})`);
        }

        const dataLista = await respuesta.json();

        const promesasDetalles = dataLista.results.map(item =>
            fetch(item.url).then(res => res.json())
        );

        const pokemonesDetallados = await Promise.all(promesasDetalles);
        renderizarListaPokemon(pokemonesDetallados, contenedorLista);
    } catch (error) {
        contenedorLista.innerHTML = `
            <div class="error-alert">
                ⚠️ Ocurrió un problema al cargar el rango de Pokémon: ${error.message}
            </div>
        `;
    }
}

function renderizarListaPokemon(lista, contenedor) {
    contenedor.innerHTML = lista.map((poke, idx) => {
        const imgUrl = poke.sprites?.other?.["official-artwork"]?.front_default || poke.sprites.front_default;
        const tiposHtml = poke.types.map(t => {
            const color = TYPE_COLORS[t.type.name] || "#555";
            return `<span class="type-badge" style="background-color: ${color}; font-size: 0.7rem; padding: 0.22rem 0.65rem;">${t.type.name}</span>`;
        }).join("");

        return `
            <div class="poke-item-card" style="animation-delay: ${idx * 0.04}s;" onclick="seleccionarPokemonDeLista(${poke.id})">
                <span class="poke-item-id">#${String(poke.id).padStart(4, "0")}</span>
                <div class="poke-item-img-wrap">
                    <img src="${imgUrl}" alt="${poke.name}" loading="lazy">
                </div>
                <h4 class="poke-item-name">${poke.name}</h4>
                <div class="pokemon-types" style="margin-top: 0.2rem;">${tiposHtml}</div>
                <span class="poke-item-hint">Ver ficha completa ➔</span>
            </div>
        `;
    }).join("");
}

// 3. Funciones auxiliares e interactividad del portal
function buscarPokemonAleatorio() {
    const idAleatorio = Math.floor(Math.random() * 1025) + 1;
    buscarPokemonIndividual(idAleatorio);
}

function aplicarRangoRapido(inicio, fin) {
    document.getElementById("input-inicio").value = inicio;
    document.getElementById("input-fin").value = fin;
    cargarListaPorRango();
}

function seleccionarPokemonDeLista(id) {
    const panelBusqueda = document.getElementById("panel-busqueda");
    panelBusqueda.classList.remove("hidden-section");
    buscarPokemonIndividual(id);
    panelBusqueda.scrollIntoView({ behavior: "smooth", block: "start" });
}

function reproducirGrito(audioUrl) {
    const audio = new Audio(audioUrl);
    audio.volume = 0.5;
    audio.play().catch(err => console.warn("No se pudo reproducir el audio:", err));
}

function cambiarVista(modo, botonActivo) {
    document.querySelectorAll(".menu-btn").forEach(btn => btn.classList.remove("active"));
    botonActivo.classList.add("active");

    const panelBusqueda = document.getElementById("panel-busqueda");
    const panelRango = document.getElementById("panel-rango");

    if (modo === "ambos") {
        panelBusqueda.classList.remove("hidden-section");
        panelRango.classList.remove("hidden-section");
    } else if (modo === "buscar") {
        panelBusqueda.classList.remove("hidden-section");
        panelRango.classList.add("hidden-section");
    } else if (modo === "rango") {
        panelBusqueda.classList.add("hidden-section");
        panelRango.classList.remove("hidden-section");
    }
}

// Actualizar la etiqueta de equivalencia limit/offset en tiempo real al cambiar los números
function actualizarPreviewParametros() {
    const inicio = parseInt(document.getElementById("input-inicio").value, 10) || 1;
    const fin = parseInt(document.getElementById("input-fin").value, 10) || inicio;
    if (fin >= inicio) {
        const offset = inicio - 1;
        const limit = (fin - inicio) + 1;
        document.getElementById("badge-params").innerHTML = `limit: <strong>${limit}</strong> | offset: <strong>${offset}</strong>`;
    }
}

// Convierte logo.jpg en un icono circular con borde para la pestaña del navegador
function estilizarFaviconCircular() {
    const img = new Image();
    img.src = "logo.jpg";
    img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");

        // Recorte circular
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Dibujar logo.jpg centrado
        ctx.drawImage(img, 0, 0, 64, 64);

        // Anillo rojo carmesí alrededor del icono
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, Math.PI * 2);
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#C8102E";
        ctx.stroke();

        // Aplicar a la pestaña
        let link = document.querySelector("link[rel*='icon']") || document.createElement("link");
        link.type = "image/png";
        link.rel = "icon";
        link.href = canvas.toDataURL("image/png");
        document.head.appendChild(link);
    };
}

// Ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", estilizarFaviconCircular);

// Inicialización automática al abrir el portal (Carga a Arceus y los primeros 10 Pokémon como en tus capturas de Bruno)
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("input-inicio").addEventListener("input", actualizarPreviewParametros);
    document.getElementById("input-fin").addEventListener("input", actualizarPreviewParametros);

    buscarPokemonIndividual("Arceus");
    cargarListaPorRango();
});