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
  if (!response.ok) throw new Error("Bad response from Overpass API");
  return response.json();
})
.then(data => {
  // Resto do código igual...
})
.catch(error => {
  console.error("Erro na busca:", error);
  alert("Erro ao buscar dados.");
});
