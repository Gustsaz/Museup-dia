let map = L.map('map').setView([-23.5505, -46.6333], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);

async function handleInput(event) {
  const query = event.target.value;
  if (query.length < 3) {
    document.getElementById('suggestions').innerHTML = '';
    return;
  }
  fetchSuggestions(query);
}

async function fetchSuggestions(query) {
  const overpassQuery = `
    [out:json][timeout:10];
    (
      node["tourism"="museum"]["name"~"${query}",i];
      node["amenity"="library"]["name"~"${query}",i];
    );
    out body;
  `;
  try {
    const res = await fetch("https://overpass.kumi.systems/api/interpreter", {
      method: "POST",
      body: overpassQuery,
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Erro bruto:", errText);
      throw new Error("Erro na requisição");
    }
    const data = await res.json();
    const suggestions = data.elements.map(el => el.tags.name).filter(Boolean);
    showSuggestions([...new Set(suggestions)]);
  } catch (err) {
    console.error("Erro ao buscar sugestões:", err);
  }
}

function showSuggestions(suggestions) {
  const ul = document.getElementById('suggestions');
  ul.innerHTML = '';
  suggestions.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    li.onclick = () => searchPlaces(name);
    ul.appendChild(li);
  });
}

async function searchPlaces(query) {
  const overpassQuery = `
    [out:json][timeout:10];
    (
      node["tourism"="museum"]["name"~"${query}",i];
      node["amenity"="library"]["name"~"${query}",i];
    );
    out body;
  `;
  try {
    const res = await fetch("https://overpass.kumi.systems/api/interpreter", {
      method: "POST",
      body: overpassQuery,
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Erro bruto:", errText);
      throw new Error("Erro na requisição");
    }
    const data = await res.json();
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });
    data.elements.forEach(el => {
      if (el.lat && el.lon) {
        L.marker([el.lat, el.lon]).addTo(map).bindPopup(el.tags.name || "Local encontrado");
      }
    });
  } catch (err) {
    console.error("Erro na busca:", err);
  }
}
