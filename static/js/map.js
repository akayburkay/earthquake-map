const depremToggle = document.getElementById("deprem-toggle");
const depremContent = document.getElementById("deprem-content");

depremToggle.addEventListener("click", () => {
    if (depremContent.style.display === 'none' || depremContent.style.display === '') {
        depremContent.style.display = 'block'; 
        depremToggle.innerHTML = 'Depremler &#9660;';  
    } else {
        depremContent.style.display = 'none'; 
        depremToggle.innerHTML = 'Depremler &#9654;';  
    }
});

// Harita katmanları
const map = L.map('map').setView([39, 35], 5);

const layers = {
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }),
    dark:L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CartoDB</a>',
        subdomains: 'abcd',
        maxZoom: 19
      })
      ,
    topo: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri'
    })
};

let currentBaseLayer = layers.dark.addTo(map);

const earthquakeLayer = L.layerGroup().addTo(map);

const select = document.getElementById("basemap-select");

select.addEventListener("change", function () {
    map.removeLayer(currentBaseLayer);
    currentBaseLayer = layers[select.value].addTo(map);

    if (!map.hasLayer(earthquakeLayer)) {
        earthquakeLayer.addTo(map);
    }
});


let isMeasuring = false;
let startPoint = null;
let tempLine = null;
let distanceLabel = null;
let finalLines = [];

const mapContainer = map.getContainer();

document.getElementById('measureBtn').addEventListener('click', () => {
  isMeasuring = true;
  startPoint = null;
  mapContainer.style.cursor = 'crosshair';
  mapContainer.classList.add('map-measure-cursor');
  alert('Ölçüm moduna geçildi. İlk noktaya tıklayın, ardından ikinci noktaya tıklayın. Sağ tık ile çıkabilirsiniz.');
});

map.on('click', (e) => {
  if (!isMeasuring) return;

  if (!startPoint) {
    startPoint = e.latlng;
    return;
  }

  const endPoint = e.latlng;
  const distance = map.distance(startPoint, endPoint);
  const distanceText = distance >= 1000
    ? (distance / 1000).toFixed(2) + ' km'
    : Math.round(distance) + ' m';

  const finalLine = L.polyline([startPoint, endPoint], { color: 'blue' }).addTo(map);
  finalLine.bindPopup(`Mesafe: ${distanceText}`);
  finalLines.push(finalLine);

  const midLatLng = L.latLng(
    (startPoint.lat + endPoint.lat) / 2,
    (startPoint.lng + endPoint.lng) / 2
  );

  const label = L.marker(midLatLng, {
    icon: L.divIcon({
      className: 'distance-label',
      html: distanceText
    }),
    interactive: false
  }).addTo(map);

  finalLine.label = label;

  // Temizle
  if (tempLine) {
    map.removeLayer(tempLine);
    tempLine = null;
  }
  if (distanceLabel) {
    map.removeLayer(distanceLabel);
    distanceLabel = null;
  }

  startPoint = null; // yeni ölçüme hazır
});

map.on('mousemove', (e) => {
  if (!isMeasuring || !startPoint) return;

  if (tempLine) map.removeLayer(tempLine);
  if (distanceLabel) map.removeLayer(distanceLabel);

  const tempPoints = [startPoint, e.latlng];
  tempLine = L.polyline(tempPoints, { color: 'gray', dashArray: '5, 5' }).addTo(map);

  const distance = map.distance(startPoint, e.latlng);
  const distanceText = distance >= 1000
    ? (distance / 1000).toFixed(2) + ' km'
    : Math.round(distance) + ' m';

  const midLatLng = L.latLng(
    (startPoint.lat + e.latlng.lat) / 2,
    (startPoint.lng + e.latlng.lng) / 2
  );

  distanceLabel = L.marker(midLatLng, {
    icon: L.divIcon({
      className: 'distance-label',
      html: distanceText
    }),
    interactive: false
  }).addTo(map);
});

// Sağ tık ile ölçüm modunu bitir (çizgi ve etiket kalır)
mapContainer.addEventListener('contextmenu', (e) => {
  if (!isMeasuring) return;

  e.preventDefault();
  isMeasuring = false;
  startPoint = null;

  if (tempLine) {
    map.removeLayer(tempLine);
    tempLine = null;
  }

  if (distanceLabel) {
    map.removeLayer(distanceLabel);
    distanceLabel = null;
  }

  mapContainer.style.cursor = '';
  mapContainer.classList.remove('map-measure-cursor');
});



let userLocationMarker = null;

document.getElementById('get-location').addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Tarayıcınız konum almayı desteklemiyor.');
    return;
  }

  // Konum alımına başla
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const userLatLng = L.latLng(lat, lng);

      // Daha önce eklenmişse kaldır
      if (userLocationMarker) {
        map.removeLayer(userLocationMarker);
      }

      // Harita moduna göre ikonu seç
      const currentBaseLayer = map.hasLayer(layers.dark) ? 'dark' : 'light';
      const iconUrl = currentBaseLayer === 'dark' 
        ? 'https://cdn-icons-png.flaticon.com/512/684/684908.png' // Dark mode icon
        : 'https://cdn-icons-png.flaticon.com/512/4879/4879523.png'; // Light mode icon

      // Marker ekle
      userLocationMarker = L.marker(userLatLng, {
        title: "Konumunuz",
        icon: L.icon({
          iconUrl: iconUrl,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        })
      }).addTo(map)
        .bindPopup("Konumunuz")
        .openPopup();

      // Haritayı konuma götür
      map.setView(userLatLng, 15);
    },
    (error) => {
      // Hata mesajı
      switch (error.code) {
        case error.PERMISSION_DENIED:
          alert("Konum izni verilmedi.");
          break;
        case error.POSITION_UNAVAILABLE:
          alert("Konum bilgisi alınamıyor.");
          break;
        case error.TIMEOUT:
          alert("Konum alma süresi aşıldı.");
          break;
        case error.UNKNOWN_ERROR:
          alert("Bilinmeyen bir hata oluştu.");
          break;
      }
    },
    {
      enableHighAccuracy: true,  // Daha doğru konum alımı için
      timeout: 10000             // Zaman aşımını 10 saniye olarak ayarlıyoruz
    }
  );
});
