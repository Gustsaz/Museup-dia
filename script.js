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
const bbox = '( -23.7, -46.9, -23.4, -46.4 )'; // caixa São Paulo

if (filter === "museum" || filter === "all") {
  filters.push(`node["tourism"="museum"][name~"${query}",i]${bbox}`);
}
if (filter === "library" || filter === "all") {
  filters.push(`node["amenity"="library"][name~"${query}",i]${bbox}`);
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
    if (!data.elements.length) {
      alert("Nenhum resultado encontrado.");
      return;
    }

    data.elements.forEach(element => {
      let lat = element.lat;
      let lon = element.lon;

      // Para 'ways' e 'relations', usamos o centro
      if (!lat || !lon) {
        if (element.center) {
          lat = element.center.lat;
          lon = element.center.lon;
        }
      }

      if (lat && lon) {
        const name = element.tags?.name || "Sem nome";
        L.marker([lat, lon])
          .addTo(markersLayer)
          .bindPopup(`<b>${name}</b>`);
      }
    });
  })
  .catch(error => {
    console.error("Erro na busca:", error);
    alert("Erro ao buscar dados.");
  });
}
