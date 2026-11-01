/**
 * OpenAgriMap France - Outbreak & Proximity Alert Engine
 * Drives the headline feature:
 * "Late blight has been reported by 17 gardeners within 30 km"
 */

class OutbreakEngine {
  constructor(initialReports = []) {
    this.reports = [...initialReports];
    this.centerLat = DEFAULT_CENTER.lat;
    this.centerLng = DEFAULT_CENTER.lng;
    this.radiusKm = 30; // default 30 km
    this.onStateChangeCallbacks = [];
  }

  subscribe(callback) {
    this.onStateChangeCallbacks.push(callback);
  }

  notify() {
    const summary = this.getProximitySummary();
    this.onStateChangeCallbacks.forEach(cb => cb(summary));
  }

  setCenter(lat, lng) {
    this.centerLat = lat;
    this.centerLng = lng;
    this.notify();
  }

  setRadius(radiusKm) {
    this.radiusKm = radiusKm;
    this.notify();
  }

  /**
   * Calculate distance between two points in km (Haversine formula)
   */
  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (window.turf) {
      const from = turf.point([lon1, lat1]);
      const to = turf.point([lon2, lat2]);
      return turf.distance(from, to, { units: 'kilometers' });
    }
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Query all reports within the active radius of the current center point
   */
  getNearbyReports() {
    return this.reports.map(rep => {
      const dist = this.calculateDistanceKm(this.centerLat, this.centerLng, rep.lat, rep.lng);
      return {
        ...rep,
        calculatedDistanceKm: parseFloat(dist.toFixed(1)),
        isWithinRadius: dist <= this.radiusKm
      };
    });
  }

  /**
   * Produce stats and dynamic alert headline
   */
  getProximitySummary() {
    const allEnriched = this.getNearbyReports();
    const activeWithinRadius = allEnriched.filter(r => r.isWithinRadius);

    // Filter by type
    const mildewReports = activeWithinRadius.filter(r => r.disease === 'mildew');
    const rustReports = activeWithinRadius.filter(r => r.disease === 'rust');
    const pestReports = activeWithinRadius.filter(r => r.disease !== 'mildew' && r.disease !== 'rust');

    const mildewCount = mildewReports.length;
    const rustCount = rustReports.length;
    const pestCount = pestReports.length;

    // Headline generation (Exact request match)
    let headline = "";
    if (mildewCount > 0) {
      headline = `Le mildiou a été signalé par <span class="highlight-count">${mildewCount} jardinier${mildewCount > 1 ? 's' : ''}</span> dans un rayon de <span class="highlight-dist">${this.radiusKm} km</span>.`;
    } else if (rustCount > 0) {
      headline = `La rouille a été signalée par <span class="highlight-count">${rustCount} agriculteur${rustCount > 1 ? 's' : ''}</span> dans un rayon de <span class="highlight-dist">${this.radiusKm} km</span>.`;
    } else if (pestCount > 0) {
      headline = `Des bioagresseurs (doryphores/pucerons) ont été signalés par <span class="highlight-count">${pestCount} observateur${pestCount > 1 ? 's' : ''}</span> dans un rayon de <span class="highlight-dist">${this.radiusKm} km</span>.`;
    } else {
      headline = `Aucun foyer sanitaire actif dans un rayon de <span class="highlight-dist">${this.radiusKm} km</span>.`;
    }

    return {
      centerLat: this.centerLat,
      centerLng: this.centerLng,
      radiusKm: this.radiusKm,
      mildewCount,
      rustCount,
      pestCount,
      headline,
      allReports: allEnriched,
      nearbyReports: activeWithinRadius
    };
  }

  /**
   * Add a new community user-submitted report
   */
  addReport(newReportData) {
    const newReport = {
      id: newReportData.id || `rep-user-${Date.now()}`,
      disease: newReportData.disease,
      diseaseName: this.getDiseaseDisplayName(newReportData.disease),
      severity: newReportData.severity || 'medium',
      crop: newReportData.crop || 'Culture maraîchère',
      reporter: newReportData.reporter || 'Jardinier citoyen (Vous)',      reporterRole: newReportData.reporterRole || 'gardener',
      lat: parseFloat(newReportData.lat),
      lng: parseFloat(newReportData.lng),
      date: "À l'instant",
      notes: newReportData.notes || "Signalement communautaire en direct.",
      status: newReportData.status || "pending_moderation",
      ...(newReportData.photoUrl ? { photoUrl: newReportData.photoUrl } : {})
    };

    // Prepend to list
    this.reports.unshift(newReport);
    this.notify();
    return newReport;
  }

  getDiseaseDisplayName(code) {
    switch (code) {
      case 'mildew': return 'Mildiou (Phytophthora infestans / Plasmopara)';
      case 'rust': return 'Rouille (Puccinia spp.)';
      case 'colorado_beetle': return 'Doryphore de la pomme de terre';
      case 'aphids': return 'Pucerons colonisateurs';
      case 'powdery_mildew': return 'Oïdium foliaire';
      case 'box_moth': return 'Pyrale / Chenille défoliatrice';
      default: return 'Bioagresseur signalé';
    }
  }
}
