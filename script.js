const map = L.map('map').setView([-23.55052, -46.633308], 12); // São Paulo

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);

function searchPlaces() {
  const query = document.getElementById('searchInput').value.trim();
  const filter = document.getElementById('filterType').value;

  if (!query) {
    alert("Digite um nome para buscar.");
    return;
  }

  markersLayer.clearLayers();

  // Escapar caracteres problemáticos na query do usuário (ex: aspas, barras, etc)
  const escapedQuery = query.replace(/["\\]/g, '');

  let filters = [];

  if (filter === "museum" || filter === "all") {
    filters.push(`node["tourism"="museum"]["name"~"${escapedQuery}", i](around:10000, -23.55052, -46.633308);`);
    filters.push(`way["tourism"="museum"]["name"~"${escapedQuery}", i](around:10000, -23.55052, -46.633308);`);
    filters.push(`relation["tourism"="museum"]["name"~"${escapedQuery}", i](around:10000, -23.55052, -46.633308);`);
  }

  if (filter === "library" || filter === "all") {
    filters.push(`node["amenity"="library"]["name"~"${escapedQuery}", i](around:10000, -23.55052, -46.633308);`);
    filters.push(`way["amenity"="library"]["name"~"${escapedQuery}", i](around:10000, -23.55052, -46.633308);`);
    filters.push(`relation["amenity"="library"]["name"~"${escapedQuery}", i](around:10000, -23.55052, -46.633308);`);
  }

  const overpassQuery = `
    [out:json][timeout:25];
    (
      ${filters.join('\n')}
    );
    out center;
  `;

  const url = 'https://overpass-api.de/api/interpreter';
  const bodyData = new URLSearchParams();
  bodyData.append("data", overpassQuery);

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: bodyData
  })
  .then(response => {
    if (!response.ok) throw new Error("Resposta inválida da Overpass API");
    return response.json();
  })
  .then(data => {
    if (!data.elements || data.elements.length === 0) {
      alert("Nenhum local encontrado.");
      return;
    }

    data.elements.forEach(el => {
      let lat = el.lat || el.center?.lat;
      let lon = el.lon || el.center?.lon;

      if (lat && lon) {
        L.marker([lat, lon])
          .addTo(markersLayer)
          .bindPopup(el.tags?.name || "Sem nome");
      }
    });
  })
  .catch(error => {
    console.error("Erro na busca:", error);
    alert("Erro ao buscar dados.");
  });
}
