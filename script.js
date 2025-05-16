const map = L.map('map').setView([-23.55052, -46.633308], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);
let debounceTimeout;
let suggestionIndex = -1;

document.addEventListener('click', function (e) {
  if (!document.getElementById('searchInput').contains(e.target)) {
    document.getElementById('suggestions').innerHTML = "";
  }
});

document.getElementById('searchInput').addEventListener('keydown', (e) => {
  const suggestions = document.querySelectorAll('#suggestions div');
  if (suggestions.length === 0) return;

  if (e.key === 'ArrowDown') {
    suggestionIndex = (suggestionIndex + 1) % suggestions.length;
  } else if (e.key === 'ArrowUp') {
    suggestionIndex = (suggestionIndex - 1 + suggestions.length) % suggestions.length;
  } else if (e.key === 'Enter') {
    if (suggestionIndex >= 0) {
      suggestions[suggestionIndex].click();
      e.preventDefault();
    }
    return;
  } else {
    suggestionIndex = -1;
    return;
  }

  suggestions.forEach((s, i) => {
    s.classList.toggle('selected', i === suggestionIndex);
  });
});

function handleInput() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(fetchSuggestions, 500);
}

function fetchSuggestions() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filter = document.getElementById('filterType').value;
  const spinner = document.getElementById('loadingSpinner');
  const container = document.getElementById('suggestions');

  if (query.length < 3) {
    container.innerHTML = "";
    spinner.style.display = "none";
    return;
  }

  spinner.style.display = "inline-block";

  let filters = [];
  if (filter === "museum" || filter === "all") {
    filters.push(`node["tourism"="museum"]["name"~"${query}",i]`);
    filters.push(`way["tourism"="museum"]["name"~"${query}",i]`);
  }
  if (filter === "library" || filter === "all") {
    filters.push(`node["amenity"="library"]["name"~"${query}",i]`);
    filters.push(`way["amenity"="library"]["name"~="${query}",i]`);
  }

  const overpassQuery = `
    [out:json][timeout:15];
    (
      ${filters.join(";\n")}
    );
    out center;
  `;

  fetch('https://overpass.kumi.systems/api/interpreter', {
    method: 'POST',
    body: overpassQuery
  })
    .then(res => res.json())
    .then(data => {
      spinner.style.display = "none";
      const names = new Set();
      data.elements.forEach(el => {
        if (el.tags?.name) {
          names.add(el.tags.name);
        }
      });
      showSuggestions([...names].slice(0, 10));
    })
    .catch(err => {
      spinner.style.display = "none";
      console.error("Erro ao buscar sugestões:", err);
    });
}

function showSuggestions(suggestions) {
  const container = document.getElementById('suggestions');
  container.innerHTML = "";

  suggestions.forEach(name => {
    const div = document.createElement("div");
    div.textContent = name;
    div.onclick = () => {
      document.getElementById('searchInput').value = name;
      container.innerHTML = "";
      searchPlaces();
    };
    container.appendChild(div);
  });
  suggestionIndex = -1;
}

function searchPlaces() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filter = document.getElementById('filterType').value;
  document.getElementById('suggestions').innerHTML = "";

  if (!query) {
    alert("Digite um nome para buscar.");
    return;
  }

  markersLayer.clearLayers();

  let filters = [];
  if (filter === "museum" || filter === "all") {
    filters.push(`node["tourism"="museum"]["name"~"${query}",i]`);
    filters.push(`way["tourism"="museum"]["name"~="${query}",i]`);
    filters.push(`relation["tourism"="museum"]["name"~="${query}",i]`);
  }
  if (filter === "library" || filter === "all") {
    filters.push(`node["amenity"="library"]["name"~"${query}",i]`);
    filters.push(`way["amenity"="library"]["name"~="${query}",i]`);
    filters.push(`relation["amenity"="library"]["name"~="${query}",i]`);
  }

  const overpassQuery = `
    [out:json][timeout:25];
    (
      ${filters.join(";\n")}
    );
    out center;
  `;

  fetch('https://overpass.kumi.systems/api/interpreter', {
    method: 'POST',
    body: overpassQuery
  })
    .then(response => response.json())
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
