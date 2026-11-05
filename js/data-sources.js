/**
 * OpenAgriMap France - Open Data Catalog & Metadata Definitions
 */

const OPEN_DATA_CATALOG = {
  soil: {
    title: "Sols & Pédologie",
    providers: [
      {
        name: "ISRIC SoilGrids 2.0",
        coverage: "France & Monde (Résolution 250m)",
        type: "REST API",
        endpoint: "https://rest.isric.org/soilgrids/v2.0/properties/query",
        license: "CC-BY 4.0",
        description: "Fournit le pH (H2O), les teneurs en argile, sable, limon et densité apparente par profondeur (0-5cm, 5-15cm)."
      },
      {
        name: "INRAE / GIS Sol (RMQS & BDAT)",
        coverage: "France métropolitaine",
        type: "WMS / WFS",
        endpoint: "https://agroenvgeo.data.inra.fr/geoserver/gissol_rmqs/wms",
        license: "Licence Ouverte 2.0",
        description: "Réseau de Mesure de la Qualité des Sols et Banque de Données des Analyses de Terre."
      },
      {
        name: "Hub'Eau / BRGM",
        coverage: "France métropolitaine",
        type: "REST API (GeoJSON)",
        endpoint: "https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/stations",
        license: "Licence Ouverte 2.0",
        description: "Suivi piézométrique des nappes souterraines et conductivité pour évaluer le drainage naturel."
      }
    ]
  },
  groundwater: {
    title: "Nappes phréatiques (eaux souterraines)",
    providers: [
      {
        name: "Hub'Eau / BRGM — API Piézométrie (données ADES)",
        coverage: "France entière (métropole & DROM)",
        type: "REST API (JSON / GeoJSON / CSV)",
        endpoint: "https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/stations",
        license: "Licence Ouverte 2.0",
        description: "Référentiel des piézomètres (stations), chroniques de niveaux piézométriques en m NGF (chroniques) et mesures horaires télétransmises (chroniques_tr)."
      },
      {
        name: "ADES — portail national d'accès aux données sur les eaux souterraines",
        coverage: "France entière",
        type: "Portail & fiches points d'eau",
        endpoint: "https://ades.eaufrance.fr",
        license: "Licence Ouverte 2.0",
        description: "Fiche détaillée de chaque point d'eau (code BSS) : niveaux, qualité, producteur."
      }
    ]
  },
  biodiversity: {
    title: "Biodiversité & Faune Auxiliaire",
    providers: [
      {
        name: "GBIF France (Global Biodiversity Information Facility)",
        coverage: "France",
        type: "REST API",
        endpoint: "https://api.gbif.org/v1/occurrence/search",
        license: "CC-BY 4.0",
        description: "Occurrences mondiales intégrant les données du MNHN, de la LPO et d'iNaturalist. Taxons clés : Aves (212), Insecta (216), Apis mellifera (1341976)."
      },
      {
        name: "INPN / OpenObs (MNHN - OFB)",
        coverage: "France entière",
        type: "Portail & Données SINP",
        endpoint: "https://openobs.mnhn.fr",
        license: "Licence Ouverte SINP",
        description: "Plateforme nationale d'accès aux données d'observation sur les espèces sauvages."
      },
      {
        name: "Spipoll (Vigie-Nature / MNHN)",
        coverage: "France",
        type: "Open Data (data.gouv.fr)",
        endpoint: "https://www.data.gouv.fr/fr/datasets/spipoll/",
        license: "Licence Ouverte 2.0",
        description: "Suivi Photographique des Insectes Pollinisateurs par science participative."
      }
    ]
  },
  crops: {
    title: "Cultures, Parcelles & Variétés",
    providers: [
      {
        name: "IGN & ASP - Registre Parcellaire Graphique (RPG)",
        coverage: "France métropolitaine et DROM",
        type: "WMS / WFS / GeoPackage",
        endpoint: "https://data.geopf.fr/wms-r",
        license: "Licence Ouverte 2.0",
        description: "Contours géoréférencés des îlots culturaux déclarés PAC avec codes cultures (ex: BTH pour blé tendre, MIE pour maïs)."
      },
      {
        name: "ApiCarto IGN (Module RPG)",
        coverage: "France",
        type: "REST API (GeoJSON)",
        endpoint: "https://apicarto.ign.fr/api/doc/",
        license: "Licence Ouverte 2.0",
        description: "Interrogation ponctuelle et spatiale des parcelles agricoles sans téléchargement massif."
      },
      {
        name: "GEVES & SEMAE",
        coverage: "France & Union Européenne",
        type: "Catalogue Ouvert",
        endpoint: "https://www.geves.fr & https://www.semae.fr",
        license: "Domaine Public",
        description: "Catalogue officiel des espèces et variétés de plantes cultivées inscrites en France."
      }
    ]
  },
  diseases: {
    title: "Vigilance Phytosanitaire & Maladies",
    providers: [
      {
        name: "Bulletins de Santé du Végétal (BSV / DRAAF)",
        coverage: "Toutes régions françaises",
        type: "Open Data / PDF archivés",
        endpoint: "https://www.data.gouv.fr (Projet UniBSV)",
        license: "Licence Ouverte",
        description: "Surveillance hebdomadaire des ravageurs et maladies sur grandes cultures, arboriculture, maraîchage et viticulture."
      },
      {
        name: "Météo-France Open Data",
        coverage: "France entière",
        type: "REST API",
        endpoint: "https://meteo.data.gouv.fr",
        license: "Licence Ouverte 2.0",
        description: "Précipitations, humidité relative et température horaire pour alimenter les modèles épidémiologiques de mildiou (Mills / Goidanich)."
      },
      {
        name: "OpenAgriMap Collaborative Reports",
        coverage: "France & Europe",
        type: "ODbL Participatif",
        endpoint: "Base communautaire temps réel",
        license: "Open Database License (ODbL)",
        description: "Signalements géolocalisés de jardiniers et agriculteurs avec calcul de grappes d'alerte de proximité."
      }
    ]
  }
};
