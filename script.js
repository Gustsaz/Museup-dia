const map = L.map('map').setView([-23.55052, -46.633308], 12); // São Paulo

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);

function searchPlaces() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filter = document.getElementById('filterType').value;

  if (!query) {
    alert("Digite um nome para buscar.");
    return;
  }

  markersLayer.clearLayers();

  let filters = [];
  if (filter === "museum" || filter === "all") {
    filters.push(`node["tourism"="museum"]["name"~"${query}",i]`);
    filters.push(`way["tourism"="museum"]["name"~"${query}",i]`);
    filters.push(`relation["tourism"="museum"]["name"~"${query}",i]`);
  }
  if (filter === "library" || filter === "all") {
    filters.push(`node["amenity"="library"]["name"~"${query}",i]`);
    filters.push(`way["amenity"="library"]["name"~"${query}",i]`);
    filters.push(`relation["amenity"="library"]["name"~"${query}",i]`);
  }

  const overpassQuery = `
    [out:json][timeout:25];
    (
      ${filters.join(";\n")}
    );
    out center;
  `;

  const url = 'https://overpass-api.de/api/interpreter';

  fetch(url, {
    method: 'POST',
    body: overpassQuery
  })
    .then(response => {
      if (!response.ok) throw new Error("Bad response from Overpass API");
      return response.json();
    })
    .then(data => {
      if (!data.elements.length) {
        alert("Nenhum resultado encontrado.");
        return;
      }

      data.elements.forEach(element => {
        const lat = element.lat || element.center?.lat;
        const lon = element.lon || element.center?.lon;
        const name = element.tags?.name || "Sem nome";

        if (lat && lon) {
          L.marker([lat, lon])
            .bindPopup(`<b>${name}</b>`)
            .addTo(markersLayer);
        }
      });

      const first = data.elements[0];
      const centerLat = first.lat || first.center?.lat;
      const centerLon = first.lon || first.center?.lon;
      map.setView([centerLat, centerLon], 15);
    })
    .catch(error => {
      console.error("Erro na busca:", error);
      alert("Erro ao buscar dados.");
    });
}
