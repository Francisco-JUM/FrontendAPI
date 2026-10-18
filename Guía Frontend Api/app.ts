/**
 * ============================================================================
 * GUÍA FRONTEND CONSUMO DE API - LÓGICA EN TYPESCRIPT
 * Autor: Francisco Javier Urbina Mejía - Ingeniería de Sistemas
 * ============================================================================
 */

// 1. Interfaces de tipado para PokéAPI v2
interface PokemonTypeSlot {
    slot: number;
    type: {
        name: string;
        url: string;
    };
}

interface PokemonStatSlot {
    base_stat: number;
    effort: number;
    stat: {
        name: string;
    };
}

interface PokemonAbilitySlot {
    is_hidden: boolean;
    ability: {
        name: string;
    };
}

interface PokemonDetailResponse {
    id: number;
    name: string;
    height: number;
    weight: number;
    base_experience: number;
    types: PokemonTypeSlot[];
    stats: PokemonStatSlot[];
    abilities: PokemonAbilitySlot[];
    cries?: {
        latest?: string;
    };
    sprites: {
        front_default: string;
        other?: {
            "official-artwork"?: {
                front_default: string;
            };
        };
    };
}

interface PokemonListItem {
    name: string;
    url: string;
}

interface PokemonListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: PokemonListItem[];
}

// 2. Constante base de la API pública
const POKEAPI_BASE_URL: string = "https://pokeapi.co/api/v2/pokemon";

// Mapa de colores según el tipo de Pokémon
const TYPE_COLORS: Record<string, string> = {
    normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C",
    grass: "#7AC74C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1",
    ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
    rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", dark: "#705746",
    steel: "#B7B7CE", fairy: "#D685AD"
};

// Traducción de nombres de estadísticas
const STAT_NAMES_ES: Record<string, string> = {
    "hp": "PS (Vida)",
    "attack": "Ataque",
    "defense": "Defensa",
    "special-attack": "Ataque Esp.",
    "special-defense": "Defensa Esp.",
    "speed": "Velocidad"
};

/**
 * Consume el endpoint individual: GET https://pokeapi.co/api/v2/pokemon/:identificador
 */
async function buscarPokemonIndividual(identificadorOpcional?: string | number): Promise<void> {
    const inputEl = document.getElementById("input-identificador") as HTMLInputElement;
    const urlDisplay = document.getElementById("url-individual-display") as HTMLElement;
    const contenedor = document.getElementById("resultado-individual") as HTMLElement;

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
        const respuesta: Response = await fetch(endpointUrl);
        if (!respuesta.ok) {
            throw new Error(`No se encontró ningún Pokémon con el identificador "${valorBruto}" (HTTP ${respuesta.status}).`);
        }

        const pokemon: PokemonDetailResponse = await respuesta.json();
        renderizarPokemonIndividual(pokemon, contenedor);
    } catch (error: any) {
        contenedor.innerHTML = `
            <div class="error-alert">
                ⚠️ ${error.message || "Error al conectar con PokéAPI."} Verifica el nombre o número de Pokédex.
            </div>
        `;
    }
}

/**
 * Renderiza la tarjeta detallada de un Pokémon con sus barras de estadísticas
 */
function renderizarPokemonIndividual(pokemon: PokemonDetailResponse, contenedor: HTMLElement): void {
    const imagenHD = pokemon.sprites.other?.["official-artwork"]?.front_default || pokemon.sprites.front_default;
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

/**
 * Consume el endpoint por rango: GET https://pokeapi.co/api/v2/pokemon?limit=X&offset=Y
 */
async function cargarListaPorRango(): Promise<void> {
    const inputInicio = document.getElementById("input-inicio") as HTMLInputElement;
    const inputFin = document.getElementById("input-fin") as HTMLInputElement;
    const badgeParams = document.getElementById("badge-params") as HTMLElement;
    const urlListaDisplay = document.getElementById("url-lista-display") as HTMLElement;
    const contenedorLista = document.getElementById("resultado-lista") as HTMLElement;

    let inicio = parseInt(inputInicio.value, 10);
    let fin = parseInt(inputFin.value, 10);

    if (isNaN(inicio) || inicio < 1) inicio = 1;
    if (isNaN(fin) || fin < inicio) fin = inicio;

    // Limitamos el máximo por consulta a 60 para mantener una carga veloz y fluida
    if (fin - inicio >= 60) {
        fin = inicio + 59;
        inputFin.value = String(fin);
    }

    const offset: number = inicio - 1;
    const limit: number = (fin - inicio) + 1;

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
            throw new Error(`Error al obtener la lista (HTTP ${respuesta.status})`);
        }

        const dataLista: PokemonListResponse = await respuesta.json();

        // Obtenemos los detalles de cada Pokémon del rango en paralelo para mostrar imagen y tipos
        const promesasDetalles: Promise<PokemonDetailResponse>[] = dataLista.results.map(item =>
            fetch(item.url).then(res => res.json())
        );

        const pokemonesDetallados: PokemonDetailResponse[] = await Promise.all(promesasDetalles);
        renderizarListaPokemon(pokemonesDetallados, contenedorLista);
    } catch (error: any) {
        contenedorLista.innerHTML = `
            <div class="error-alert">
                ⚠️ Ocurrió un problema al cargar el rango de Pokémon: ${error.message}
            </div>
        `;
    }
}

/**
 * Renderiza la cuadrícula de tarjetas para el rango seleccionado
 */
function renderizarListaPokemon(lista: PokemonDetailResponse[], contenedor: HTMLElement): void {
    contenedor.innerHTML = lista.map((poke, idx) => {
        const imgUrl = poke.sprites.other?.["official-artwork"]?.front_default || poke.sprites.front_default;
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