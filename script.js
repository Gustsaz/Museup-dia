const map = L.map('map').setView([-23.55052, -46.633308], 13); // Começa em São Paulo

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);

function searchPlaces() {
  const query = document.getElementById('searchInput').value;
  if (!query) return;

  // Limpa os marcadores anteriores
  markersLayer.clearLayers();

  // Consulta à API Nominatim filtrando por museus e bibliotecas
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&extratags=1&namedetails=1&limit=20`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const filtered = data.filter(place => {
        const category = place.class + '/' + place.type;
        return (
          category.includes("tourism/museum") ||
          category.includes("amenity/library") ||
          place.type === "library" ||
          place.type === "museum"
        );
      });

      if (filtered.length === 0) {
        alert("Nenhum museu ou biblioteca encontrado.");
        return;
      }

      filtered.forEach(place => {
        const marker = L.marker([place.lat, place.lon])
          .bindPopup(`<b>${place.display_name}</b>`)
          .addTo(markersLayer);
      });

      const first = filtered[0];
      map.setView([first.lat, first.lon], 14);
    })
    .catch(error => {
      console.error("Erro na busca:", error);
    });
}
