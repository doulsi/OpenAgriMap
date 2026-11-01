/**
 * OpenAgriMap France - Main Application Orchestrator
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide icons
  if (window.lucide) lucide.createIcons();

  // State Management
  const state = {
    inspectMode: false,
    selectedSoilProperty: "ph",
    bioFilter: "all",
    selectedCountry: "FR",  // Currently selected country for GBIF data streams
    isInsideFrance: true,   // Whether the map center is currently inside France
    diseaseFilter: {
      mildew: true,
      rust: true,
      pests: true
    },
    activeBasemap: "osmfr",
    center: { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng }
  };

  // Instantiate Outbreak Engine with 17 initial seeded reports
  const outbreakEngine = new OutbreakEngine(INITIAL_OUTBREAK_REPORTS);

  // 1. INITIALIZE LEAFLET MAP
  const map = L.map("map", {
    zoomControl: false,
    attributionControl: true
  }).setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], DEFAULT_CENTER.zoom);

  L.control.zoom({ position: "bottomright" }).addTo(map);

  // 100% Free & Open Source Basemap Tile Layers (Zero API Key, Unlimited Open Access)
  const tileLayers = {
    osmfr: L.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 20
    }),
    opentopo: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      attribution: 'Map: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
      maxZoom: 17
    }),
    ign: L.tileLayer("https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}", {
      attribution: '&copy; <a href="https://www.ign.fr/">IGN Géoplateforme</a> (Licence Ouverte 2.0)',
      maxZoom: 19
    }),
    osm: L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    })
  };

  // Add OSM France by default
  tileLayers.osmfr.addTo(map);

  // Layer Groups
  const soilLayerGroup = L.layerGroup().addTo(map);
  const bioLayerGroup = L.layerGroup().addTo(map);
  const cropLayerGroup = L.layerGroup().addTo(map);
  const waterLayerGroup = L.layerGroup().addTo(map);
  const diseaseLayerGroup = (window.L && typeof L.markerClusterGroup === 'function') ? L.markerClusterGroup({
    maxClusterRadius: 42,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    iconCreateFunction: function(cluster) {
      const count = cluster.getChildCount();
      let sizeClass = 'small';
      if (count > 25) sizeClass = 'large';
      else if (count > 10) sizeClass = 'medium';
      return L.divIcon({
        html: `<div class="agri-cluster-badge ${sizeClass}"><span>${count}</span></div>`,
        className: 'custom-cluster-icon',
        iconSize: L.point(42, 42)
      });
    }
  }).addTo(map) : L.layerGroup().addTo(map);
  let radiusCircleLayer = null;

  // 2. RENDER THE 30KM SURVEILLANCE RADIUS CIRCLE
  function renderRadiusCircle(summary) {
    if (radiusCircleLayer) {
      map.removeLayer(radiusCircleLayer);
    }

    const radiusMeters = summary.radiusKm * 1000;
    radiusCircleLayer = L.circle([summary.centerLat, summary.centerLng], {
      radius: radiusMeters,
      color: '#ef4444',
      weight: 2,
      opacity: 0.65,
      dashArray: '6, 8',
      fillColor: '#ef4444',
      fillOpacity: 0.05
    }).addTo(map);

    radiusCircleLayer.bindTooltip(`Zone de veille participative (${summary.radiusKm} km)`, {
      permanent: false,
      direction: 'top',
      className: 'custom-radius-tooltip'
    });
  }

  // 3. RENDER THE THEMATIC LAYERS

  // LAYER 2: Biodiversity Occurrences (Seeded Baseline + LIVE GBIF REST API)
  let gbifDebounce = null;
  async function renderBiodiversityLayer() {
    bioLayerGroup.clearLayers();
    if (!document.getElementById("toggleBioLayer").checked) return;

    function addBioMarker(pt) {
      let iconHtml = pt.iconHtml || "🐞";
      let iconClass = "bio-marker insect-marker";
      if (pt.category === "birds") {
        iconHtml = "🦅";
        iconClass = "bio-marker bird-marker";
      } else if (pt.category === "pollinators") {
        iconHtml = "🐝";
        iconClass = "bio-marker pollinator-marker";
      }

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="${iconClass}">${iconHtml}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([pt.lat, pt.lng], { icon: customIcon });

      marker.bindPopup(`
        <div class="map-popup">
          <div class="popup-tag bio-tag">
            ${pt.isLive ? '🟢 FLUX EN DIRECT GBIF / INPN' : 'BIODIVERSITÉ & AUXILIAIRES • INPN'}
          </div>
          <h4>${pt.name}</h4>
          ${pt.scientificName && pt.scientificName !== pt.name ? `<div style="font-size:0.75rem; color:#94a3b8; font-style:italic;">${pt.scientificName}</div>` : ''}
          <p class="popup-role">${pt.role}</p>
          <div class="popup-meta-row">
            <span><strong>Date :</strong> ${pt.date}</span>
            <span><strong>Source :</strong> ${pt.observer}</span>
          </div>
          <div class="popup-status"><strong>Statut :</strong> ${pt.status}</div>
        </div>
      `);

      bioLayerGroup.addLayer(marker);
    }

    // 1. Render seeded national occurrences
    if (window.BIODIVERSITY_POINTS) {
      BIODIVERSITY_POINTS.forEach(pt => {
        if (state.bioFilter !== "all" && pt.category !== state.bioFilter) return;
        addBioMarker(pt);
      });
    }

    // 2. Fetch LIVE occurrences from GBIF API for current viewport bounds
    clearTimeout(gbifDebounce);
    gbifDebounce = setTimeout(async () => {
      const bounds = map.getBounds();
      const countryCode = state.selectedCountry || "FR";
      const liveRecords = await Services.fetchLiveGBIFOccurrences(bounds, state.bioFilter, countryCode);
      liveRecords.forEach(pt => addBioMarker(pt));
    }, 350);
  }

  // Live National IGN RPG 2024 Raster Layer (Covering ALL parcels in France)
  const nationalRpgWmsLayer = L.tileLayer.wms("https://data.geopf.fr/wms-r/wms", {
    layers: "IGNF_RPG_PARCELLES-AGRICOLES-CATEGORISEES_2024",
    format: "image/png",
    transparent: true,
    minZoom: 7,
    maxZoom: 19,
    opacity: 0.70,
    attribution: '&copy; <a href="https://geoservices.ign.fr/">IGN Registre Parcellaire Graphique (RPG 2024)</a>'
  });

  // LAYER 3: Crop Parcels (RPG style)
  function renderCropLayer() {
    cropLayerGroup.clearLayers();
    if (!document.getElementById("toggleCropLayer").checked) return;

    // 1. Add official IGN nationwide WMS layer (displays all agricultural parcels in France when zoomed in)
    cropLayerGroup.addLayer(nationalRpgWmsLayer);

    // 2. Add detailed interactive parcels with complete rotation history
    CROP_PARCELS.forEach(parcel => {
      const polygon = L.polygon(parcel.coords, {
        color: "#3b82f6",
        weight: 2,
        fillColor: "#3b82f6",
        fillOpacity: 0.28,
        dashArray: "4, 4"
      });

      let historyHtml = parcel.history.map(h => `
        <tr>
          <td><strong>${h.year}</strong></td>
          <td>${h.crop}</td>
          <td>${h.yield || h.status}</td>
        </tr>
      `).join("");

      polygon.bindPopup(`
        <div class="map-popup map-popup-lg">
          <div class="popup-tag crop-tag">PARCELLE AGRICOLE RPG • IGN / ASP</div>
          <h4>${parcel.name}</h4>
          <div class="popup-sub">${parcel.farm} (${parcel.region}) • Surface: <strong>${parcel.areaHa} ha</strong> ${parcel.organicCertified ? '<span class="badge-bio">BIO 🌿</span>' : ''}</div>
          
          <div class="popup-current-crop">
            <strong>Culture en cours (2026) :</strong> ${parcel.currentCrop}
            <div class="crop-variety">Variété officielle : <em>${parcel.variety}</em> (Code: ${parcel.cropCode})</div>
          </div>

          <div class="history-table-wrap">
            <div class="table-title">Historique d'assolement & rotation :</div>
            <table class="popup-history-table">
              <thead><tr><th>Année</th><th>Culture</th><th>Observation</th></tr></thead>
              <tbody>${historyHtml}</tbody>
            </table>
          </div>
        </div>
      `);

      cropLayerGroup.addLayer(polygon);
    });
  }

  // LAYER 4: Soil Water Status & Moisture Stations (Open-Meteo / Hub'Eau)
  function renderWaterLayer() {
    waterLayerGroup.clearLayers();
    const toggle = document.getElementById("toggleWaterLayer");
    if (toggle && !toggle.checked) return;

    if (window.SOIL_WATER_STATIONS) {
      SOIL_WATER_STATIONS.forEach(station => {
        let badgeColor = "#10b981";
        if (station.status === "drought") badgeColor = "#ef4444";
        else if (station.status === "deficit") badgeColor = "#f59e0b";
        else if (station.status === "saturated") badgeColor = "#3b82f6";

        const icon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="water-station-marker" style="border-color:${badgeColor}; box-shadow:0 0 10px ${badgeColor}66;">💧</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([station.lat, station.lng], { icon: icon });

        marker.bindPopup(`
          <div class="map-popup">
            <div class="popup-tag" style="background:${badgeColor}22; color:${badgeColor}; border:1px solid ${badgeColor}44;">
              STATUT HYDRIQUE DES SOLS • OPEN-METEO
            </div>
            <h4>${station.name}</h4>
            <div style="margin: 6px 0; font-size: 0.8rem; font-weight:700; color:${badgeColor};">
              ● ${station.statusLabel}
            </div>
            <div class="popup-metrics" style="grid-template-columns: 1fr 1fr; gap:6px; margin: 8px 0;">
              <div style="background:rgba(15,23,42,0.6); padding:6px 8px; border-radius:4px;">
                <span style="font-size:0.7rem; color:#94a3b8;">Surface (0-3cm):</span><br>
                <strong style="color:#38bdf8; font-size:0.95rem;">${station.surfaceMoisture}%</strong>
              </div>
              <div style="background:rgba(15,23,42,0.6); padding:6px 8px; border-radius:4px;">
                <span style="font-size:0.7rem; color:#94a3b8;">Racines (15-30cm):</span><br>
                <strong style="color:#38bdf8; font-size:0.95rem;">${station.rootMoisture}%</strong>
              </div>
            </div>
            <div style="font-size:0.75rem; color:#cbd5e1; margin-top:6px;">
              <strong>Température sol :</strong> ${station.soilTemp}°C • Bilan hydrique calculé en continu
            </div>
          </div>
        `);

        waterLayerGroup.addLayer(marker);
      });
    }
  }

  // LAYER 5: Disease & Pest Outbreaks (The Crowdsourced Alert Engine)
  function renderDiseaseLayer(summary) {
    diseaseLayerGroup.clearLayers();
    if (!document.getElementById("toggleDiseaseLayer").checked) return;

    summary.allReports.forEach(report => {
      // Filter checkboxes
      if (report.disease === 'mildew' && !state.diseaseFilter.mildew) return;
      if (report.disease === 'rust' && !state.diseaseFilter.rust) return;
      if (report.disease !== 'mildew' && report.disease !== 'rust' && !state.diseaseFilter.pests) return;

      let markerColor = "#ef4444";
      let iconSymbol = "🍄";
      if (report.disease === "rust") {
        markerColor = "#f59e0b";
        iconSymbol = "🍂";
      } else if (report.disease !== "mildew") {
        markerColor = "#a855f7";
        iconSymbol = "🪲";
      }

      const isInside = report.isWithinRadius;
      const pulseClass = isInside && report.severity === 'high' ? 'pulse-danger' : '';

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="outbreak-marker ${pulseClass}" style="background-color: ${markerColor};">
            <span>${iconSymbol}</span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([report.lat, report.lng], { icon: customIcon });

      marker.bindPopup(`
        <div class="map-popup">
          <div class="popup-tag danger-tag">SIGNALEMENT CITOYEN • OPEN DATA PARTICIPATIF</div>
          <h4>${report.diseaseName}</h4>
          <div class="popup-distance-badge">
            <i data-lucide="navigation"></i> À ${report.calculatedDistanceKm} km de votre zone
          </div>
          <div class="popup-metrics">
            <div><strong>Culture affectée :</strong> ${report.crop}</div>
            <div><strong>Sévérité :</strong> <span class="badge-sev-${report.severity}">${report.severity.toUpperCase()}</span></div>
            <div><strong>Observateur :</strong> ${report.reporter}</div>
            <div><strong>Date :</strong> ${report.date}</div>
          </div>
          <div class="popup-notes">"${report.notes}"</div>
        </div>
      `);

      diseaseLayerGroup.addLayer(marker);
    });

    if (window.lucide) lucide.createIcons();
  }

  // 4. UPDATE SIDEBAR UI & RECENT REPORTS FEED
  function updateAlertUI(summary) {
    // Update Headline
    const headlineEl = document.getElementById("mainAlertHeadline");
    if (headlineEl) headlineEl.innerHTML = summary.headline;

    // Update Counts
    const mildewEl = document.getElementById("activeMildewCount");
    const rustEl = document.getElementById("activeRustCount");
    const pestEl = document.getElementById("activePestCount");
    if (mildewEl) mildewEl.textContent = summary.mildewCount;
    if (rustEl) rustEl.textContent = summary.rustCount;
    if (pestEl) pestEl.textContent = summary.pestCount;

    // Render surveillance radius circle on map
    renderRadiusCircle(summary);

    // Fetch live agro-weather risk for this center (Open-Meteo API)
    Services.fetchLiveAgroWeather(summary.centerLat, summary.centerLng).then(weather => {
      const detailsEl = document.getElementById("mainAlertDetails");
      if (detailsEl) {
        detailsEl.innerHTML = `
          <strong>Météo agricole en direct :</strong> ${weather.temperature}°C • Humidité: <strong>${weather.humidity}%</strong> • Pluie: ${weather.rain}mm.<br>
          <span style="color: ${weather.riskColor}; font-weight: 600;">⚠️ Risque bioclimatique d'infection : ${weather.riskLevel}</span> — ${weather.riskDetail}
        `;
      }
    });

    // Re-render disease markers with distance context
    renderDiseaseLayer(summary);

    // Populate recent reports stream
    const feedContainer = document.getElementById("reportsFeedContainer");
    if (feedContainer) {
      feedContainer.innerHTML = "";
      const recentList = summary.allReports.slice(0, 8);
      recentList.forEach(item => {
        let icon = "🍄";
        if (item.disease === 'rust') icon = "🍂";
        else if (item.disease !== 'mildew') icon = "🪲";

        const div = document.createElement("div");
        div.className = "feed-item";
        div.innerHTML = `
          <div class="feed-item-header">
            <span class="feed-item-disease">${icon} ${item.diseaseName.split('(')[0]}</span>
            <span class="feed-item-time">${item.date}</span>
          </div>
          <div class="feed-item-meta">
            ${item.crop} • <strong>${item.calculatedDistanceKm} km</strong>
          </div>
        `;
        div.addEventListener("click", () => {
          map.flyTo([item.lat, item.lng], 14, { duration: 1.2 });
        });
        feedContainer.appendChild(div);
      });
    }
  }

  // Subscribe to Outbreak Engine updates
  outbreakEngine.subscribe(summary => updateAlertUI(summary));

  // 5. SOIL INSPECTOR TOOL (Live query ISRIC SoilGrids REST API)
  const soilInspectorPanel = document.getElementById("soilInspectorPanel");
  const inspectModeToggleBtn = document.getElementById("liveInspectSoilToggle");
  const inspectModeLabel = document.getElementById("inspectModeLabel");
  const soilOutsideFranceBanner = document.getElementById("soilOutsideFranceBanner");

  /**
   * Updates soil inspector button availability based on map center position.
   * The full soil inspector (INRAE/BRGM data) is only available inside France.
   */
  function updateSoilInspectorAvailability(lat, lng) {
    const inside = Services.isInsideFrance(lat, lng);
    state.isInsideFrance = inside;

    if (!inside) {
      // Disable the toggle button and deactivate inspect mode if active
      inspectModeToggleBtn.classList.add("soil-btn-disabled");
      inspectModeToggleBtn.setAttribute("title", "Sondeur de sol disponible uniquement sur le territoire fran\u00e7ais");
      if (state.inspectMode) {
        state.inspectMode = false;
        inspectModeToggleBtn.classList.remove("active");
        soilInspectorPanel.classList.add("hidden");
      }
      inspectModeLabel.textContent = "Sondeur de Sol : Hors France";
      if (soilOutsideFranceBanner) soilOutsideFranceBanner.classList.remove("hidden");
    } else {
      inspectModeToggleBtn.classList.remove("soil-btn-disabled");
      inspectModeToggleBtn.setAttribute("title", "Cliquer sur la carte pour sonder le sol via SoilGrids API");
      if (!state.inspectMode) {
        inspectModeLabel.textContent = "Sondeur de Sol : OFF";
      }
      if (soilOutsideFranceBanner) soilOutsideFranceBanner.classList.add("hidden");
    }
  }

  inspectModeToggleBtn.addEventListener("click", () => {
    // Block activation outside France
    if (!state.isInsideFrance) {
      showToast("\u26a0\ufe0f Le Sondeur de Sol est disponible uniquement sur le territoire fran\u00e7ais m\u00e9tropolitain (donn\u00e9es INRAE / BRGM).", "warning");
      return;
    }
    state.inspectMode = !state.inspectMode;
    if (state.inspectMode) {
      inspectModeToggleBtn.classList.add("active");
      inspectModeLabel.textContent = "Sondeur de Sol : ACTIF (Cliquez sur la carte)";
      showToast("Mode Sondeur ACTIF : Cliquez n'importe o\u00f9 sur la carte pour interroger l'API SoilGrids.", "info");
    } else {
      inspectModeToggleBtn.classList.remove("active");
      inspectModeLabel.textContent = "Sondeur de Sol : OFF";
      soilInspectorPanel.classList.add("hidden");
    }
  });

  document.getElementById("closeInspectorBtn").addEventListener("click", () => {
    soilInspectorPanel.classList.add("hidden");
  });

  // Map Click Listener
  map.on("click", async (e) => {
    const { lat, lng } = e.latlng;

    if (state.inspectMode) {
      soilInspectorPanel.classList.remove("hidden");
      document.getElementById("inspectorCoordsLabel").textContent = `Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`;

      const loadingEl = document.getElementById("inspectorLoadingState");
      const contentEl = document.getElementById("inspectorContentState");
      const noDataEl = document.getElementById("inspectorNoDataState");
      const outsideBanner = document.getElementById("soilOutsideFranceBanner");

      // 1. Guardrail against Ocean / Sea coordinates
      if (Services.isMaritimeOrOcean(lat, lng)) {
        loadingEl.classList.add("hidden");
        contentEl.classList.add("hidden");
        outsideBanner.classList.add("hidden");
        noDataEl.classList.remove("hidden");

        const iconWrap = document.getElementById("inspectorNoDataIconWrap");
        const badge = document.getElementById("inspectorNoDataBadge");
        const title = document.getElementById("inspectorNoDataTitle");
        const desc = document.getElementById("inspectorNoDataDesc");
        const hint = document.getElementById("inspectorNoDataHint");
        const icon = document.getElementById("inspectorNoDataIcon");

        if (iconWrap) iconWrap.className = "nodata-icon-wrap ocean";
        if (badge) {
          badge.className = "soil-source-badge ocean";
          badge.textContent = "🌊 Milieu marin / Océan";
        }
        if (title) title.textContent = "Zone maritime non couverte";
        if (desc) desc.textContent = "Le point sélectionné se situe en mer ou dans l'océan. Le sondeur pédologique ne s'applique qu'aux terres émergées et sols agricoles répertoriés.";
        if (hint) hint.textContent = "Naviguez vers une terre émergée ou une parcelle agricole pour utiliser le sondeur de sol.";
        if (icon) icon.setAttribute("data-lucide", "waves");

        if (window.lucide) lucide.createIcons();
        showToast("🌊 Océan / Mer : aucune donnée de sol n'existe en milieu marin.", "warning");
        return;
      }

      // 2. Guardrail: Check European terrestrial territory
      if (!Services.isInsideEurope(lat, lng)) {
        loadingEl.classList.add("hidden");
        contentEl.classList.add("hidden");
        noDataEl.classList.add("hidden");
        outsideBanner.classList.remove("hidden");
        showToast("⚠️ Le sondeur pédologique et hydrique est actif sur les terres européennes.", "warning");
        return;
      }

      // 3. Location is on land: prepare UI & query live service
      outsideBanner.classList.add("hidden");
      noDataEl.classList.add("hidden");
      contentEl.classList.add("hidden");
      loadingEl.classList.remove("hidden");

      // Query live API service (ISRIC SoilGrids + Open-Meteo soil moisture)
      const soilData = await Services.querySoilProperties(lat, lng);

      loadingEl.classList.add("hidden");

      // 4. Guardrail: ensure data is KNOWN!
      if (!soilData || !soilData.hasData) {
        contentEl.classList.add("hidden");
        noDataEl.classList.remove("hidden");

        const iconWrap = document.getElementById("inspectorNoDataIconWrap");
        const badge = document.getElementById("inspectorNoDataBadge");
        const title = document.getElementById("inspectorNoDataTitle");
        const desc = document.getElementById("inspectorNoDataDesc");
        const hint = document.getElementById("inspectorNoDataHint");
        const icon = document.getElementById("inspectorNoDataIcon");

        if (iconWrap) iconWrap.className = "nodata-icon-wrap nodata";
        if (badge) {
          badge.className = "soil-source-badge nodata";
          badge.textContent = "🚫 Données inconnues";
        }
        if (title) title.textContent = "Mesures non disponibles";
        if (desc) desc.textContent = soilData?.reason || "Données de sol non répertoriées pour ce point précis (plan d'eau, surface rocheuse ou absence de relevés). Le sondeur ne restitue que les mesures certifiées.";
        if (hint) hint.textContent = "Sélectionnez une autre parcelle ou terre agricole pour interroger l'API ISRIC.";
        if (icon) icon.setAttribute("data-lucide", "alert-circle");

        if (window.lucide) lucide.createIcons();
        showToast("⚠️ Données de sol inconnues pour ces coordonnées.", "warning");
        return;
      }

      // 5. Data is known: populate verified measurements
      contentEl.classList.remove("hidden");
      noDataEl.classList.add("hidden");

      // Show source badge with country context
      const sourceBadgeEl = document.getElementById("soilSourceBadge");
      if (sourceBadgeEl) {
        const countryLabel = soilData.countryCode ? `${soilData.countryCode}` : 'Europe';
        sourceBadgeEl.textContent = `🟢 ISRIC SoilGrids 2.0 & Open-Meteo (${countryLabel})`;
        sourceBadgeEl.className = "soil-source-badge live";
      }

      // Populate UI with verified soil data
      document.getElementById("soilPhVal").textContent = soilData.ph !== null ? soilData.ph : "--";
      document.getElementById("soilPhStatus").textContent = soilData.ph !== null ? (soilData.ph < 6.5 ? "Acide" : (soilData.ph > 7.5 ? "Calcaire" : "Neutre")) : "Non mesuré";
      document.getElementById("soilTextureVal").textContent = soilData.textureClass;
      document.getElementById("soilTextureDetail").textContent = soilData.textureAdvice;
      document.getElementById("soilDrainageVal").textContent = soilData.drainageClass;
      document.getElementById("soilDrainageDetail").textContent = soilData.drainageDesc;

      const granuloBox = document.getElementById("soilGranuloBox");
      if (soilData.hasSoilTexture) {
        if (granuloBox) granuloBox.style.display = "block";
        document.getElementById("clayPct").textContent = `${soilData.clayPct}%`;
        document.getElementById("siltPct").textContent = `${soilData.siltPct}%`;
        document.getElementById("sandPct").textContent = `${soilData.sandPct}%`;

        document.getElementById("clayBar").style.width = `${soilData.clayPct}%`;
        document.getElementById("siltBar").style.width = `${soilData.siltPct}%`;
        document.getElementById("sandBar").style.width = `${soilData.sandPct}%`;
      } else {
        if (granuloBox) granuloBox.style.display = "none";
      }

      // Populate Live Water Status Section
      if (soilData.waterStatus) {
        const ws = soilData.waterStatus;
        const sVal = document.getElementById("soilWaterSurfaceVal");
        const rVal = document.getElementById("soilWaterRootVal");
        const tVal = document.getElementById("soilTempVal");
        const wBadge = document.getElementById("soilWaterStatusBadge");
        const wBar = document.getElementById("soilWaterBar");
        const wDiag = document.getElementById("soilWaterDiagText");

        if (sVal) sVal.textContent = `${ws.surfaceMoisturePct}%`;
        if (rVal) rVal.textContent = `${ws.rootMoisturePct}%`;
        if (tVal) tVal.textContent = `${ws.soilTemp}°C`;
        if (wBadge) {
          wBadge.className = `soil-water-badge ${ws.statusBadgeClass}`;
          wBadge.textContent = `💧 ${ws.statusLabel}`;
        }
        if (wBar) {
          wBar.style.width = `${ws.barWidth}%`;
          wBar.style.background = `linear-gradient(90deg, ${ws.statusColor}, #0284c7)`;
        }
        if (wDiag) wDiag.textContent = ws.diagnostic;
      }

      document.getElementById("soilRecText").textContent = soilData.recommendation;

      if (window.lucide) lucide.createIcons();
      showToast(`Sol analysé : ${soilData.textureClass} • Statut hydrique : ${soilData.waterStatus?.statusLabel || 'Mesuré'}`, "success");
    }
  });

  // 6. SEARCH BAR (IGN Geocodage API)
  const searchInput = document.getElementById("communeSearchInput");
  const searchDropdown = document.getElementById("searchResultsDropdown");
  const clearSearchBtn = document.getElementById("clearSearchBtn");

  let searchDebounce = null;
  searchInput.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    clearTimeout(searchDebounce);
    if (val.length < 2) {
      searchDropdown.classList.add("hidden");
      return;
    }

    searchDebounce = setTimeout(async () => {
      const results = await Services.searchCommune(val);
      if (results.length === 0) {
        searchDropdown.classList.add("hidden");
        return;
      }

      searchDropdown.innerHTML = "";
      results.forEach(res => {
        const item = document.createElement("div");
        item.className = "search-dropdown-item";
        item.innerHTML = `<i data-lucide="map-pin"></i> <span><strong>${res.label}</strong> <small style="color:#94a3b8">(${res.context})</small></span>`;
        item.addEventListener("click", () => {
          map.flyTo([res.lat, res.lng], 13, { duration: 1.5 });
          outbreakEngine.setCenter(res.lat, res.lng);
          searchDropdown.classList.add("hidden");
          searchInput.value = res.label;
          showToast(`Carte centrée sur ${res.label}. Rayon de veille recalculé.`, "success");
        });
        searchDropdown.appendChild(item);
      });
      searchDropdown.classList.remove("hidden");
      if (window.lucide) lucide.createIcons();
    }, 250);
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchDropdown.classList.add("hidden");
  });

  // Automatically recalculate vigilance proximity & reload live GBIF biodiversity when user pans map
  let mapMoveTimeout = null;
  map.on("moveend", () => {
    clearTimeout(mapMoveTimeout);
    mapMoveTimeout = setTimeout(() => {
      const c = map.getCenter();
      outbreakEngine.setCenter(c.lat, c.lng);
      // Check if map center is still inside France for soil inspector
      updateSoilInspectorAvailability(c.lat, c.lng);
      if (document.getElementById("toggleBioLayer").checked) {
        renderBiodiversityLayer();
      }
    }, 350);
  });

  // 7. RADIUS SLIDER EVENT
  const radiusSlider = document.getElementById("alertRadiusSlider");
  const radiusLabel = document.getElementById("radiusValueLabel");

  radiusSlider.addEventListener("input", (e) => {
    const r = parseInt(e.target.value, 10);
    radiusLabel.textContent = `${r} km`;
    outbreakEngine.setRadius(r);
  });

  // 8. LAYER TOGGLES & RADIO CONTROLS
  document.getElementById("toggleBioLayer").addEventListener("change", renderBiodiversityLayer);
  document.getElementById("toggleCropLayer").addEventListener("change", renderCropLayer);
  const toggleWater = document.getElementById("toggleWaterLayer");
  if (toggleWater) toggleWater.addEventListener("change", renderWaterLayer);
  document.getElementById("toggleDiseaseLayer").addEventListener("change", () => {
    outbreakEngine.notify();
  });

  document.querySelectorAll('[data-bio-filter]').forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll('[data-bio-filter]').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.bioFilter = e.target.getAttribute('data-bio-filter');
      renderBiodiversityLayer();
    });
  });

  document.getElementById("filterMildew").addEventListener("change", (e) => {
    state.diseaseFilter.mildew = e.target.checked;
    outbreakEngine.notify();
  });
  document.getElementById("filterRust").addEventListener("change", (e) => {
    state.diseaseFilter.rust = e.target.checked;
    outbreakEngine.notify();
  });
  document.getElementById("filterPests").addEventListener("change", (e) => {
    state.diseaseFilter.pests = e.target.checked;
    outbreakEngine.notify();
  });

  // Basemap Switcher
  document.querySelectorAll('[data-basemap]').forEach(btn => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget.getAttribute("data-basemap");
      document.querySelectorAll('[data-basemap]').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');

      Object.values(tileLayers).forEach(layer => map.removeLayer(layer));
      tileLayers[target].addTo(map);
    });
  });

  // Country Selector for GBIF Data Streams
  const countrySelector = document.getElementById("gbifCountrySelector");
  if (countrySelector) {
    countrySelector.addEventListener("change", (e) => {
      state.selectedCountry = e.target.value;
      const profile = COUNTRY_PROFILES[state.selectedCountry];
      const profileName = profile ? profile.name : state.selectedCountry;
      showToast(`🌍 Flux de données GBIF basculé sur : ${profileName}`, "info");
      if (document.getElementById("toggleBioLayer").checked) {
        renderBiodiversityLayer();
      }
      // Update country info banner
      const countryInfoEl = document.getElementById("countryInfoDesc");
      if (countryInfoEl && profile) {
        countryInfoEl.textContent = profile.description;
      }
    });
  }

  // 9. MODALS: REPORT OUTBREAK & OPEN DATA SOURCES
  const reportModal = document.getElementById("reportModal");
  const sourcesModal = document.getElementById("sourcesModal");

  document.getElementById("openReportModalBtn").addEventListener("click", () => {
    const center = map.getCenter();
    document.getElementById("reportLatitude").value = center.lat.toFixed(4);
    document.getElementById("reportLongitude").value = center.lng.toFixed(4);
    reportModal.classList.remove("hidden");
  });

  document.getElementById("closeReportModalBtn").addEventListener("click", () => reportModal.classList.add("hidden"));
  document.getElementById("cancelReportModalBtn").addEventListener("click", () => reportModal.classList.add("hidden"));

  document.getElementById("openSourcesModalBtn").addEventListener("click", () => sourcesModal.classList.remove("hidden"));
  document.getElementById("closeSourcesModalBtn").addEventListener("click", () => sourcesModal.classList.add("hidden"));
  document.getElementById("confirmSourcesModalBtn").addEventListener("click", () => sourcesModal.classList.add("hidden"));

  document.getElementById("useMyMapLocationBtn").addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          document.getElementById("reportLatitude").value = pos.coords.latitude.toFixed(4);
          document.getElementById("reportLongitude").value = pos.coords.longitude.toFixed(4);
          showToast("Position GPS du terrain insérée.", "success");
        },
        () => {
          const c = map.getCenter();
          document.getElementById("reportLatitude").value = c.lat.toFixed(4);
          document.getElementById("reportLongitude").value = c.lng.toFixed(4);
          showToast("GPS indisponible, coordonnées de la vue cartographique insérées.", "info");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      const c = map.getCenter();
      document.getElementById("reportLatitude").value = c.lat.toFixed(4);
      document.getElementById("reportLongitude").value = c.lng.toFixed(4);
      showToast("Coordonnées de la vue cartographique insérées.", "info");
    }
  });

  // Form Submission
  document.getElementById("outbreakReportForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const disease = document.getElementById("reportDiseaseType").value;
    const severity = document.getElementById("reportSeverity").value;
    const crop = document.getElementById("reportCropAffected").value;
    const lat = document.getElementById("reportLatitude").value;
    const lng = document.getElementById("reportLongitude").value;
    const reporterRole = document.getElementById("reportUserRole").value;
    const reporterName = document.getElementById("reportDisplayName").value.trim();
    const notes = document.getElementById("reportNotes").value;
    const photoInput = document.getElementById("reportPhoto");
    const photoFile = photoInput && photoInput.files && photoInput.files[0];
    let photoUrl = "";
    if (photoFile) {
      photoUrl = URL.createObjectURL(photoFile); // local preview only; real upload needs P1 accounts/storage
    }

    if (!reporterName) {
      showToast("Un nom d'affichage est requis : les signalements anonymes sont refusés.", "error");
      return;
    }

    const observation = {
      bioaggressor: disease,
      severity,
      crop,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      observedAt: new Date().toISOString(),
      notes,
      ...(photoUrl ? { photoUrl } : {}),
      reporter: { role: reporterRole, displayName: reporterName }
    };

    let persisted = false;
    try {
      const saved = await ApiClient.submitReport(observation);
      persisted = true;
      observation.id = saved.id;
    } catch (err) {
      if (err.status === 422) {
        const detail = (err.details || []).join(" ; ");
        showToast(`Signalement refusé par le schéma d'observation : ${detail}`, "error");
        return;
      }
      console.warn("API unreachable, keeping report locally (mock mode):", err.message);
    }

    const newReport = outbreakEngine.addReport({
      id: observation.id,
      disease,
      severity,
      crop,
      lat,
      lng,
      reporter: reporterName,
      reporterRole,
      notes
    });

    reportModal.classList.add("hidden");
    document.getElementById("outbreakReportForm").reset();

    // Fly smoothly to new report and open popup
    map.flyTo([lat, lng], 13);
    showToast(persisted
      ? `Signalement enregistré avec succès dans l'Open Data agricole ! Alerte de proximité actualisée.`
      : `Signalement enregistré localement (mode hors ligne) : l'API n'est pas joignable.`, persisted ? "success" : "info");
  });

  // 10. TOAST NOTIFICATION HELPER
  function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i data-lucide="check-circle-2"></i> <span>${message}</span>`;
    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Initial trigger to populate everything
  renderBiodiversityLayer();
  renderCropLayer();
  renderWaterLayer();
  outbreakEngine.notify();
  // Initial soil inspector availability check
  updateSoilInspectorAvailability(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);

  console.log("OpenAgriMap Multi-Country initialized successfully.");
});
