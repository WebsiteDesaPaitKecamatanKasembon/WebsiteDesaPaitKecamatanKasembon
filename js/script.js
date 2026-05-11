document.addEventListener('DOMContentLoaded', function(){

  // ===============================
  // BURGER MENU & NAVIGATION
  // ===============================
  const burger = document.querySelector('.burger');
  const navUL = document.querySelector('.main-nav ul');

  if(burger && navUL){
    burger.addEventListener('click', function(){
      navUL.classList.toggle('show');
    });
  }

  document.querySelectorAll('.main-nav .dropdown > a').forEach(function(btn){
    btn.addEventListener('click', function(e){
      const menu = btn.parentElement.querySelector('.dropdown-content');
      if(!menu) return;

      e.preventDefault();

      document.querySelectorAll('.dropdown-content').forEach(function(m){
        if(m !== menu) m.classList.remove('show');
      });

      menu.classList.toggle('show');
    });
  });

  document.addEventListener('click', function(e){
    if(!e.target.closest('.site-header')){
      document.querySelectorAll('.dropdown-content').forEach(function(m){
        m.classList.remove('show');
      });

      if(navUL) navUL.classList.remove('show');
    }
  });


  // ===============================
  // CEK HALAMAN (AGAR TIDAK ERROR DI PAGE LAIN)
  // ===============================
  const mapContainer = document.getElementById('map');
  if(!mapContainer) return; // kalau bukan halaman rute, berhenti


  // ===============================
  // DATA LOKASI (KOORDINAT)
  // ===============================
  const locations = {
    "Balai Desa": [-7.8026316,112.3656867],
    "Batik Tulis": [-7.8033707,112.3645719],
    "Produksi Tusuk Sate": [-7.803584,112.367272],
    "Kopi Gupait": [-7.7999141,112.364961],
    "Kandang Sapi Perah": [-7.803909,112.371169],
    "Koperasi Susu": [-7.804265,112.372452],
    "Coban Kethak": [-7.8028103,112.3569176],
    "Coban Slimpring": [-7.793932,112.4032878]
  };

  const mapLinks = {
    "Balai Desa":"https://maps.app.goo.gl/3HaUk1QvLNeQoe46A",
    "Batik Tulis":"https://maps.app.goo.gl/FZVJr1Afrw4VUTjN7",
    "Produksi Tusuk Sate":"https://maps.app.goo.gl/XggQjXmGU3gN6TQB7",
    "Kopi Gupait":"https://maps.app.goo.gl/izhRiKhcFKGTzMeQ7",
    "Kandang Sapi Perah":"https://maps.app.goo.gl/VAxyMakRKh5tbZMy5",
    "Koperasi Susu":"https://maps.app.goo.gl/fMiZ2Ws5x5THPEwv9",
    "Coban Kethak":"https://maps.app.goo.gl/LFd2x1CG9tJAFkQj9",
    "Coban Slimpring":"https://maps.app.goo.gl/djLwGSKVEvWfqMm99"
  };

  // ===============================
  // NODE & INDEX
  // ===============================
  const nodes = Object.keys(locations);
  const indexOf = Object.fromEntries(nodes.map((n,i)=>[n,i]));
  const N = nodes.length;
  const INF = Infinity;

  // ===============================
  // MATRIX GRAPH
  // ===============================
  const graph = [
    [0,147.77,INF,INF,INF,INF,INF,INF],
    [147.77,0,298.40,INF,INF,INF,INF,INF],
    [INF,298.40,0,480.98,INF,INF,INF,INF],
    [INF,INF,480.98,0,815.50,INF,INF,INF],
    [INF,INF,INF,815.50,0,193.60,INF,INF],
    [INF,INF,INF,INF,193.60,0,1718.9,INF],
    [INF,INF,INF,INF,INF,1718.9,0,5102.9],
    [INF,INF,INF,INF,INF,INF,5102.9,0]
  ];

  // ===============================
  // FLOYD WARSHALL
  // ===============================
  function floydWarshall(m){
    const d = m.map(row => row.slice());

    for(let k=0;k<N;k++){
      for(let i=0;i<N;i++){
        for(let j=0;j<N;j++){
          if(d[i][k] + d[k][j] < d[i][j]){
            d[i][j] = d[i][k] + d[k][j];
          }
        }
      }
    }
    return d;
  }
  const APSP = floydWarshall(graph);

  // ===============================
  // TSP NEAREST NEIGHBOR
  // ===============================
  function tspNearestNeighbor(startName){
    const start = indexOf[startName];
    const visited = Array(N).fill(false);

    let path = [start];
    let total = 0;
    visited[start] = true;

    for(let step=1; step<N; step++){
      const last = path[path.length-1];
      let next = -1;
      let best = INF;

      for(let i=0;i<N;i++){
        if(!visited[i] && APSP[last][i] < best){
          best = APSP[last][i];
          next = i;
        }
      }

      visited[next] = true;
      path.push(next);
      total += best;
    }

    return {
      order: path.map(i=>nodes[i]),
      distance: Math.round(total)
    };
  }

  // ===============================
  // LEAFLET MAP
  // ===============================
  let map = L.map('map').setView([-7.8026,112.3656],14);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  let markers=[], polyline, movingMarker;

  function drawRoute(start){
    const data = tspNearestNeighbor(start);
    const route = data.order.map(n=>locations[n]);

    markers.forEach(m=>map.removeLayer(m));
    markers=[];
    if(polyline) map.removeLayer(polyline);
    if(movingMarker) map.removeLayer(movingMarker);

    polyline = L.polyline(route,{color:"yellow",weight:5}).addTo(map);
    map.fitBounds(polyline.getBounds());

    route.forEach((pos,i)=>{
      let mk = L.marker(pos).addTo(map);
      mk.bindTooltip(`${i+1}. ${data.order[i]}`,{permanent:true});
      markers.push(mk);
    });

    movingMarker = L.marker(route[0]).addTo(map);
    animate(route,0);

    document.getElementById("distanceInfo").style.display="block";
    document.getElementById("distanceInfo").innerHTML =
      `Total Jarak: <span style="color:red">${data.distance.toLocaleString()} meter</span>`;

    document.getElementById("routeSteps").innerHTML =
      data.order.map((v,i)=>`
        <b>${i+1}.</b> ${v}<br>
        <a href="${mapLinks[v]}" target="_blank" class="map-link">Lihat di Google Maps</a>
      `).join("<br>");
  }

  function animate(route,i){
    if(i>=route.length) return;
    movingMarker.setLatLng(route[i]);
    setTimeout(()=>animate(route,i+1),1200);
  }

  const select = document.getElementById("startPointSelect");
  if(select){
    select.addEventListener("change",e=>drawRoute(e.target.value));
  }

  drawRoute("Balai Desa");

});