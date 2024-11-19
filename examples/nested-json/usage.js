import { jsonToHtml } from "../../main"; // htmlify-json if using via npm

const nestedJson = {
  interplanetaryExploration: {
    missions: [
      {
        missionId: "m001",
        name: "Voyager Program",
        startDate: "1977-09-05",
        status: "Operational",
        spacecraft: [
          {
            name: "Voyager 1",
            type: "Space Probe",
            launchSite: "Cape Canaveral",
            instruments: [
              "Imaging Science Subsystem",
              "Ultraviolet Spectrometer",
              "Cosmic Ray System",
            ],
            destination: [
              {
                planet: "Jupiter",
                flybyDate: "1979-03-05",
              },
              {
                planet: "Saturn",
                flybyDate: "1980-11-12",
              },
            ],
            currentStatus: {
              distanceFromEarth: "24 billion km",
              powerSource: "RTG (Radioisotope Thermoelectric Generator)",
            },
          },
          {
            name: "Voyager 2",
            type: "Space Probe",
            launchSite: "Cape Canaveral",
            instruments: [
              "Magnetometer",
              "Plasma Science Instrument",
              "Photopolarimeter Subsystem",
            ],
            destination: [
              {
                planet: "Jupiter",
                flybyDate: "1979-07-09",
              },
              {
                planet: "Saturn",
                flybyDate: "1981-08-26",
              },
              {
                planet: "Uranus",
                flybyDate: "1986-01-24",
              },
              {
                planet: "Neptune",
                flybyDate: "1989-08-25",
              },
            ],
            currentStatus: {
              distanceFromEarth: "19 billion km",
              powerSource: "RTG (Radioisotope Thermoelectric Generator)",
            },
          },
        ],
      },
      {
        missionId: "m002",
        name: "Mars Exploration Program",
        startDate: "2003-06-10",
        status: "Ongoing",
        rovers: [
          {
            name: "Spirit",
            landingSite: "Gusev Crater",
            launchDate: "2003-06-10",
            missionDuration: "6 years",
            discoveries: [
              "Evidence of ancient hot springs",
              "Chemical traces of water",
            ],
          },
          {
            name: "Curiosity",
            landingSite: "Gale Crater",
            launchDate: "2011-11-26",
            missionDuration: "Ongoing",
            discoveries: [
              "Methane spikes in atmosphere",
              "Complex organic molecules in rock samples",
            ],
          },
        ],
      },
    ],
    planetsExplored: [
      {
        name: "Mars",
        radius: "3,389.5 km",
        moons: ["Phobos", "Deimos"],
        missions: ["Mars Exploration Program", "Mars Reconnaissance Orbiter"],
      },
      {
        name: "Jupiter",
        radius: "69,911 km",
        moons: ["Europa", "Ganymede", "Io", "Callisto"],
        missions: ["Voyager Program", "Galileo", "Juno"],
      },
    ],
    scientificGoals: {
      astrobiology: {
        focus: "Search for signs of life",
        keyRegions: ["Subsurface oceans on Europa", "Methane pockets on Mars"],
      },
      planetaryGeology: {
        focus: "Understand surface processes",
        keyRegions: ["Valles Marineris", "Olympus Mons"],
      },
    },
    futureProjects: [
      {
        name: "Europa Clipper",
        plannedLaunch: "2024",
        goal: "Investigate the habitability of Europa",
        technology: {
          propulsion: "Solar Electric Propulsion",
          instruments: ["Ice-Penetrating Radar", "Mass Spectrometer"],
        },
      },
      {
        name: "Mars Sample Return",
        plannedLaunch: "2026",
        goal: "Retrieve samples from Mars surface",
        collaboration: ["NASA", "ESA"],
      },
    ],
  },
};

const equifaxJson = {
  result: {
    efxStatusCode: "200.1001",
    clearIndicator: "YES",
    matchedRecords: [
      {
        nameAliases: [
          "dfOQneJLjh AE LBKkh",
          "aIUcdKENDL oo bMFkP",
          "MMTFzFimMS Dk pEpsp",
        ],
        primaryName: "wPmKYGyVrU TW QREUF",
        dateOfBirths: ["2023-11-21"],
        listedAddresses: [
          {
            county: "Forsyth",
            address: "01916 TFEXjEDHnlkXAak mtB eZB",
            dateLastReported: "05/2023",
            dateFirstReported: "05/2023",
          },
          {
            county: "Forsyth",
            address: "rwzDqwUVXHARKRF qqM uNl FYnxPTaXhl",
            dateLastReported: "05/2023",
            dateFirstReported: "05/2023",
          },
        ],
      },
    ],
    trackingNumber: "ABC123",
    referenceNumber: "998750870273",
    customerIdentifier: "123456789",
    matchedRecordsCount: 1,
    masterReferenceNumber: "998750858096",
    additionalStatusDetails: {
      code: "1001",
      message: "Hit",
    },
    customerIdentifierIssuedYear: "2012",
    customerIdentifierIssuedState: "GA",
  },
  search: {
    id: "04795f15-3c67-40b0-a84d-b395560384ff",
    dob: null,
    ssn: "123-48-9234",
    file: 3310,
    guid: "2ff7d9d5-251a-44f0-95ad-48a99767561d",
    name: "Advanced - TenantCheck Government",
    type: "equifax_advanced_tenant_check_government",
    email: null,
    state: null,
    status: "New",
    cra_guid: "cae9a86f-ed27-42e4-a264-dda5fc0d20cd",
    vendor_id: "cbb3d90d-ebe3-49e1-9f91-8c082b0aaccc",
    created_at: "2024-11-13T21:33:22.891Z",
    updated_at: "2024-11-13T21:33:22.891Z",
    processing_status: "new",
    vendor_product_id: "04795f15-3c67-40b0-a84d-b395560384ff",
    processing_message: "",
    client_product_guid: "1e020ef0-aa91-48c3-b943-5b46a8b4616c",
  },
};

const response = jsonToHtml(nestedJson, {
  formatKeys: true,
  listObjects: true,
  styleLocation: "inline",
  headers: {
    interplanetaryExploration: 1,
    "interplanetaryExploration.planetsExplored": 2,
    "interplanetaryExploration.scientificGoals": 2,
    "interplanetaryExploration.futureProjects": 2,
    "interplanetaryExploration.missions": 2,
    "interplanetaryExploration.missions[].rovers": 3,
  },
});

const response2 = jsonToHtml(equifaxJson, {
  formatKeys: true,
  listObjects: true,
  styleLocation: "inline",
  headers: {
    result: 1,
    search: 2,
    matchedRecords: 3,
  },
});

console.log(response2);
