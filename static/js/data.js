const earthquakeLayers = {
    1: L.layerGroup().addTo(map),
    2: L.layerGroup().addTo(map),
    3: L.layerGroup().addTo(map),
    4: L.layerGroup().addTo(map)
};

function fetchEarthquakes(category) {
    let url = `data/deprem/category${category}`;

    $.ajax({
        url: url,
        method: "GET",
        success: function(data) {
            earthquakeLayers[category].clearLayers();

            data.earthquakes.forEach(function(earthquake) {
                var lat = earthquake.latitude;
                var lng = earthquake.longitude;
                var depth = earthquake.depth;
                var location = earthquake.location;
                var mag = earthquake.magnitude;

                var time = new Date(earthquake.time).toLocaleString('tr-TR', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                    hour12: false, timeZone: 'Europe/Istanbul'
                });

                var markerColor = getMarkerColor(mag);

                var marker = L.circleMarker([lat, lng], {
                    color: markerColor,
                    radius: 8,
                    fillOpacity: 0.6
                }).addTo(earthquakeLayers[category]); 

                marker.bindPopup(
                    `<b>Yer:</b> ${location}<br><b>Büyüklük:</b> ${mag}<br><b>Zaman:</b> ${time}`
                );
            });
        }
    });
}

function getMarkerColor(mag) {
    if (mag >= 7.0) return '#940404';
    if (mag >= 6.0) return '#e88310';
    if (mag >= 5.0) return '#f1e84d';
    if  (mag >= 4.0) return ' #2bbd2b';
    return 'gray';
}

// Checkbox kontrol fonksiyonu (tekrar kullanılabilir)
function setupCheckbox(id, category) {
    $(`#${id}`).change(function () {
        if ($(this).is(":checked")) {
            fetchEarthquakes(category);
        } else {
            earthquakeLayers[category].clearLayers(); 
        }
    });
}

setupCheckbox('category1', 1);
setupCheckbox('category2', 2);
setupCheckbox('category3', 3);
setupCheckbox('category4', 4);


//Fay verileri
function fetchFaylar() {
    fetch('/data/deprem/faylar')
    .then(response=> response.json())
    .then(data => {
        addFayToMap(data);
    })
    .catch(error => {
        console.log('Fay verileri alınamadı',error)
    });
}

let fayLayer;

function addFayToMap(fayData){
    if (fayLayer){
        map.removeLayer(fayLayer);
    }

    fayLayer = L.geoJSON(fayData, {
        style: {
            color: 'red',  
            weight: 3      
        }
    }).addTo(map);  
}

document.getElementById('fayCheckbox').addEventListener('change', function(){
    if (this.checked){
        fetchFaylar();
    } else {
        if (fayLayer){
            map.removeLayer(fayLayer);
            fayLayer = null;
        }
    }
});