const endpoint = "https://query.wikidata.org/sparql";
const map = L.map('map').setView([-14.235, -51.9253], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let locais = [];
let markers = [];

const searchInput = document.getElementById('search');
const suggestions = document.getElementById('suggestions');
const typeFilter = document.getElementById('typeFilter');
const searchBtn = document.getElementById('searchBtn');

async function buscarLocais() {
  const query = `
    SELECT ?item ?itemLabel ?coord ?tipo WHERE {
      VALUES ?tipo { wd:Q33506 wd:Q7075 } # Museu ou Biblioteca
      ?item (wdt:P31/wdt:P279*) ?tipo.
      ?item wdt:P17 wd:Q155. # Brasil
      ?item wdt:P625 ?coord.
      SERVICE wikibase:label { bd:serviceParam wikibase:language "pt". }
    }
    UNION {
      VALUES ?item { wd:Q82941 wd:Q371803 wd:Q18482277 } # MASP, Museu do Ipiranga, Catavento
      ?item wdt:P625 ?coord.
      ?item wdt:P31 ?tipo.
      SERVICE wikibase:label { bd:serviceParam wikibase:language "pt". }
    }
    LIMIT 600
  `;

  const url = endpoint + "?query=" + encodeURIComponent(query);
  const headers = { "Accept": "application/sparql-results+json" };

  try {
    const response = await fetch(url, { headers });
    const data = await response.json();

    locais = data.results.bindings.map(item => {
      const coords = item.coord.value
        .replace('Point(', '')
        .replace(')', '')
        .split(' ');
      return {
        nome: item.itemLabel.value,
        lat: parseFloat(coords[1]),
        lng: parseFloat(coords[0]),
        tipo: item.tipo.value.includes("Q7075") ? "library" : "museum"
      };
    });

    exibirTodosNoMapa();
  } catch (erro) {
    console.error("Erro ao buscar dados da Wikidata:", erro);
  }
}

function exibirTodosNoMapa() {
  limparMarcadores();
  const filtro = typeFilter.value;
  locais
    .filter(l => filtro === 'all' || l.tipo === filtro)
    .forEach(l => adicionarMarcador(l));
}

function adicionarMarcador(local) {
  const marker = L.marker([local.lat, local.lng]).addTo(map);
  marker.bindPopup(`<strong>${local.nome}</strong><br>${local.tipo === 'library' ? 'Biblioteca' : 'Museu'}`);
  markers.push(marker);
}

function limparMarcadores() {
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];
}

searchInput.addEventListener('input', atualizarSugestoes);
typeFilter.addEventListener('change', exibirTodosNoMapa);
searchBtn.addEventListener('click', () => {
  const termo = searchInput.value.toLowerCase();
  const filtro = typeFilter.value;
  const localEncontrado = locais.find(l => (filtro === 'all' || l.tipo === filtro) && l.nome.toLowerCase().includes(termo));
  if (localEncontrado) {
    focarLocal(localEncontrado);
    suggestions.innerHTML = '';
  }
});

function atualizarSugestoes() {
  const termo = searchInput.value.toLowerCase();
  const filtro = typeFilter.value;
  suggestions.innerHTML = '';
  locais
    .filter(l => (filtro === 'all' || l.tipo === filtro) && l.nome.toLowerCase().includes(termo))
    .slice(0, 10)
    .forEach(l => {
      const item = document.createElement('li');
      item.textContent = l.nome;
      item.addEventListener('click', () => {
        searchInput.value = l.nome;
        suggestions.innerHTML = '';
        focarLocal(l);
      });
      suggestions.appendChild(item);
    });
}

function focarLocal(local) {
  limparMarcadores();
  adicionarMarcador(local);
  map.setView([local.lat, local.lng], 15);
}

// Ocultar sugestões ao clicar fora
document.addEventListener('click', (event) => {
  if (!searchInput.contains(event.target) && !suggestions.contains(event.target)) {
    suggestions.innerHTML = '';
  }
});

buscarLocais();
