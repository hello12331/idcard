/**
 * CIT ID Card Generator - Global Configuration & Persistence Engine
 * Used across both Student Generator (index.html) and Admin Studio (admin.html)
 */

const CONFIG_STORAGE_KEY = "CIT_ID_CARD_MASTER_CONFIG_V1";

// Default Factory Configuration (1:1 with Official Chalapathi Autonomous Card)
const DEFAULT_CONFIG = {
  version: "1.0.0",
  lastUpdated: new Date().toISOString(),

  // 1. Institutional Branding & Landing Page Editor
  branding: {
    collegeName: "CHALAPATHI INSTITUTE OF TECHNOLOGY",
    subtitle: "Autonomous • NBA & NAAC 'A' Grade • Student ID Card Portal",
    badgeText: "CIT",
    primaryColor: "#0b4594",
    primaryDark: "#072a5b",
    accentColor: "#c9142e",
    portalTitle: "Student ID Card Portal",
    contactEmail: "chalapathicit@gmail.com",
    contactPhone: "+91-9505505566, 9848133748",
    websiteUrl: "www.city.ac.in",
    campusAddress: "A.R Nagar, Mothadaka, Guntur",
    footerNotice: "Standard PVC CR80 Print Resolution (300 DPI equivalent)",
    
    // Feature Visibility Toggles
    enableBatchMode: true,
    enableDynamicBarcode: true,
    enableCustomTemplateUpload: true,
    enableFieldUnderlines: false,
    enableSampleDataButton: true
  },

  // 2. Base Template & Physical Canvas Dimensions
  template: {
    id: "official_cit_2024",
    name: "Chalapathi Autonomous Official Template",
    width: 768,
    height: 1024,
    aspectRatio: "3/4",
    
    // Photo Frame Box (Calibrated 137, 305, 354, 396)
    photoFrame: {
      x: 137,
      y: 305,
      width: 354,
      height: 396,
      borderRadius: 0,
      borderWidth: 0,
      borderColor: "#0b4594"
    },

    // Accreditation Dashed Divider Line (Full width continuous)
    dashedLine: {
      enabled: true,
      startX: 514,
      endX: 705,
      y: 170.5,
      dashLength: 12,
      gapLength: 5,
      lineWidth: 2.5,
      color: "#063c9e"
    },

    // Dynamic Barcode Placement (Code 128)
    barcode: {
      enabled: true,
      x: 640,
      y: 396,
      width: 290,
      height: 118,
      rotation: 90,
      clearBox: { x: 520, y: 388, width: 126, height: 308 }
    },

    // Custom uploaded template override (base64 string if user uploads custom)
    customTemplateBase64: null
  },

  // 3. Dynamic Card Fields (Admin can add, edit, reposition, recolor, or delete)
  fields: [
    {
      id: "name",
      label: "Student Full Name",
      placeholder: "e.g. KODELA KIRAN KUMAR",
      defaultValue: "KODELA KIRAN KUMAR",
      type: "text",
      category: "core",
      required: true,
      uppercase: true,
      enabled: true,
      canvas: {
        x: 92,
        y: 753,
        fontSize: 32,
        fontWeight: "bold",
        fontFamily: "'Montserrat', Arial, sans-serif",
        color: "#000000",
        textAlign: "left",
        textBaseline: "alphabetic",
        rotation: 0,
        maxWidth: 550,
        prefix: "",
        suffix: ""
      }
    },
    {
      id: "regNo",
      label: "Registration No. (Roll)",
      placeholder: "e.g. 23HT1A4353",
      defaultValue: "23HT1A4353",
      type: "text",
      category: "core",
      required: true,
      uppercase: true,
      enabled: true,
      canvas: {
        x: 227,
        y: 851,
        fontSize: 29,
        fontWeight: "bold",
        fontFamily: "'Montserrat', Arial, sans-serif",
        color: "#000000",
        textAlign: "left",
        textBaseline: "alphabetic",
        rotation: 0,
        maxWidth: 320,
        prefix: "",
        suffix: ""
      }
    },
    {
      id: "branch",
      label: "Branch / Program",
      placeholder: "e.g. CSE-AI",
      defaultValue: "CSE-AI",
      type: "select_or_text",
      category: "core",
      options: [
        "CSE-AI",
        "CSE",
        "CSE-AI&ML",
        "CSE-DS",
        "ECE",
        "EEE",
        "MECH",
        "CIVIL",
        "IT",
        "MCA",
        "MBA"
      ],
      required: true,
      uppercase: true,
      enabled: true,
      canvas: {
        x: 323,
        y: 288,
        fontSize: 30,
        fontWeight: "bold",
        fontFamily: "'Montserrat', Arial, sans-serif",
        color: "#000000",
        textAlign: "left",
        textBaseline: "alphabetic",
        rotation: 0,
        maxWidth: 200,
        prefix: "",
        suffix: ""
      }
    },
    {
      id: "mobile",
      label: "Mobile Number",
      placeholder: "e.g. 9908406687",
      defaultValue: "9908406687",
      type: "tel",
      category: "core",
      required: true,
      uppercase: false,
      enabled: true,
      canvas: {
        x: 261,
        y: 802,
        fontSize: 29,
        fontWeight: "bold",
        fontFamily: "'Montserrat', Arial, sans-serif",
        color: "#000000",
        textAlign: "left",
        textBaseline: "alphabetic",
        rotation: 0,
        maxWidth: 260,
        prefix: "",
        suffix: ""
      }
    },
    {
      id: "bloodGroup",
      label: "Blood Group",
      placeholder: "e.g. O+ve",
      defaultValue: "O+ve",
      type: "select",
      category: "core",
      options: ["O+ve", "A+ve", "B+ve", "AB+ve", "O-ve", "A-ve", "B-ve", "AB-ve", "NONE"],
      required: false,
      uppercase: true,
      enabled: true,
      canvas: {
        x: 565,
        y: 212,
        fontSize: 36,
        fontWeight: "bold",
        fontFamily: "'Montserrat', Arial, sans-serif",
        color: "#000000",
        textAlign: "center",
        textBaseline: "middle",
        rotation: 0,
        maxWidth: 160,
        prefix: "",
        suffix: ""
      }
    },
    {
      id: "batch",
      label: "Academic Batch / Duration",
      placeholder: "e.g. 2023 - 2027",
      defaultValue: "2023 - 2027",
      type: "select_or_text",
      category: "core",
      options: [
        "2022 - 2026",
        "2023 - 2027",
        "2024 - 2028",
        "2025 - 2029",
        "2026 - 2030"
      ],
      required: false,
      uppercase: false,
      enabled: true,
      canvas: {
        x: 98,
        y: 481,
        fontSize: 34,
        fontWeight: "bold",
        fontFamily: "'Montserrat', Arial, sans-serif",
        color: "#000000",
        textAlign: "center",
        textBaseline: "middle",
        rotation: -90,
        maxWidth: 280,
        prefix: "",
        suffix: ""
      }
    }
  ],

  // 4. Template Presets Catalog
  templateCatalog: [
    {
      id: "official_cit_2024",
      name: "CIT Official Autonomous 2024",
      tag: "Active Default",
      description: "Official Autonomous Student ID Card with complete accreditations & principal signature.",
      thumbnail: "assets/perfect_base_template.png"
    },
    {
      id: "faculty_template",
      name: "Faculty & Staff ID Template",
      tag: "Staff",
      description: "Faculty / Staff ID Card with Department & Designation emphasis.",
      thumbnail: "assets/perfect_base_template.png"
    },
    {
      id: "library_pass",
      name: "Campus & Library Digital Pass",
      tag: "Library",
      description: "Simplified card for library issuance, sports, and computer lab access.",
      thumbnail: "assets/perfect_base_template.png"
    }
  ]
};

// Global Configuration Accessor
const ConfigManager = {
  /**
   * Load active configuration from localStorage or return factory defaults
   */
  load() {
    try {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Deep merge with defaults to ensure any missing new keys are present
        return ConfigManager.mergeDefaults(parsed, DEFAULT_CONFIG);
      }
    } catch (e) {
      console.warn("Error loading stored configuration, using default:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  },

  /**
   * Save configuration to localStorage
   */
  save(config) {
    try {
      config.lastUpdated = new Date().toISOString();
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
      return true;
    } catch (e) {
      console.error("Error saving configuration to localStorage:", e);
      return false;
    }
  },

  /**
   * Reset configuration to original factory defaults
   */
  reset() {
    try {
      localStorage.removeItem(CONFIG_STORAGE_KEY);
      return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    } catch (e) {
      console.error("Error resetting configuration:", e);
      return DEFAULT_CONFIG;
    }
  },

  /**
   * Export configuration as a JSON file download
   */
  exportToFile(config) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config || ConfigManager.load(), null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cit_id_card_config_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  /**
   * Import configuration from a JSON file
   */
  importFromFile(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const merged = ConfigManager.mergeDefaults(parsed, DEFAULT_CONFIG);
        ConfigManager.save(merged);
        callback(null, merged);
      } catch (err) {
        callback(err, null);
      }
    };
    reader.onerror = () => callback(new Error("Failed to read file"), null);
    reader.readAsText(file);
  },

  /**
   * Safe deep merge of loaded config with default schema
   */
  mergeDefaults(loaded, defaults) {
    const result = { ...defaults, ...loaded };
    result.branding = { ...defaults.branding, ...(loaded.branding || {}) };
    result.template = { ...defaults.template, ...(loaded.template || {}) };
    result.template.photoFrame = { ...defaults.template.photoFrame, ...(loaded.template?.photoFrame || {}) };
    result.template.dashedLine = { ...defaults.template.dashedLine, ...(loaded.template?.dashedLine || {}) };
    result.template.barcode = { ...defaults.template.barcode, ...(loaded.template?.barcode || {}) };
    
    // Ensure fields exist
    if (!Array.isArray(result.fields) || result.fields.length === 0) {
      result.fields = JSON.parse(JSON.stringify(defaults.fields));
    }
    return result;
  }
};

// Make available in window object
if (typeof window !== "undefined") {
  window.ConfigManager = ConfigManager;
  window.DEFAULT_CONFIG = DEFAULT_CONFIG;
}
