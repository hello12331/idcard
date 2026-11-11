/**
 * CIT ID Card Generator - Admin Studio Logic
 * Interactive Visual Field Editor, Template Manager, and Landing Page Customizer
 */

let config = null;
let activeFieldId = "name";
let showBoundingBoxes = true;
let isDraggingField = false;
let dragFieldId = null;
let dragStartX = 0, dragStartY = 0;
let initialFieldX = 0, initialFieldY = 0;

let canvas, ctx;
let barcodeOffscreenCanvas;
let templateImg = null;

// Field bounding boxes map for click & drag detection
let fieldBoundingBoxes = {};

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Canvas
  canvas = document.getElementById("adminCanvas");
  ctx = canvas.getContext("2d");
  canvas.width = 768;
  canvas.height = 1024;
  barcodeOffscreenCanvas = document.createElement("canvas");

  // 2. Load Configuration
  config = ConfigManager.load();

  // 3. Load Images
  loadAdminAssets();

  // 4. Initialize Tabs & UI Bindings
  initTabs();
  renderFieldsPills();
  bindInspectorEvents();
  bindTemplateTabEvents();
  bindLandingTabEvents();
  bindJSONTabEvents();
  bindCanvasInteractions();
  bindGlobalActionButtons();

  // 5. Select Initial Field
  selectField("name");

  // 6. Fonts ready render
  if (document.fonts) {
    document.fonts.ready.then(() => {
      renderAdminCanvas();
    });
  }
});

// Load template & sample photo
function loadAdminAssets() {
  templateImg = new Image();
  templateImg.onload = () => renderAdminCanvas();
  templateImg.onerror = () => {
    templateImg.src = "assets/perfect_base_template.png";
  };

  if (config.template.customTemplateBase64) {
    templateImg.src = config.template.customTemplateBase64;
  } else if (typeof EMBEDDED_ASSETS !== "undefined" && EMBEDDED_ASSETS.templateBase64) {
    templateImg.src = EMBEDDED_ASSETS.templateBase64;
  } else {
    templateImg.src = "assets/perfect_base_template.png";
  }
}

/**
 * Main Admin Studio Render Engine
 */
function renderAdminCanvas() {
  if (!ctx) return;

  fieldBoundingBoxes = {};

  // 1. Clear Canvas with Pure White
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Base Template Layer
  if (templateImg && templateImg.complete) {
    ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
  }

  // 3. Continuous Accreditation Dashed Line
  if (config.template.dashedLine && config.template.dashedLine.enabled) {
    const dl = config.template.dashedLine;
    ctx.save();
    ctx.strokeStyle = dl.color || "#063c9e";
    ctx.lineWidth = dl.lineWidth || 2.5;
    ctx.setLineDash([dl.dashLength || 12, dl.gapLength || 5]);
    ctx.beginPath();
    ctx.moveTo(dl.startX || 514, dl.y || 170.5);
    ctx.lineTo(dl.endX || 705, dl.y || 170.5);
    ctx.stroke();
    ctx.restore();
  }

  // 4. Student Photo Frame Area (Clean white placeholder - no person photo)
  const pf = config.template.photoFrame;
  if (pf) {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(pf.x, pf.y, pf.width, pf.height);

    // If overlays enabled, draw a sleek dashed calibration guide
    if (overlaysVisible) {
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(pf.x, pf.y, pf.width, pf.height);

      ctx.fillStyle = "#64748b";
      ctx.font = "bold 18px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PHOTO FRAME", pf.x + pf.width / 2, pf.y + pf.height / 2 - 12);
      ctx.font = "14px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(`${pf.width} × ${pf.height} px`, pf.x + pf.width / 2, pf.y + pf.height / 2 + 14);
    }

    // Photo frame border if configured
    if (pf.borderWidth > 0) {
      ctx.strokeStyle = pf.borderColor || "#0b4594";
      ctx.lineWidth = pf.borderWidth;
      ctx.setLineDash([]);
      ctx.strokeRect(pf.x, pf.y, pf.width, pf.height);
    }
    ctx.restore();
  }

  // 5. Dynamic Barcode Layer
  if (config.template.barcode && config.template.barcode.enabled) {
    const bc = config.template.barcode;
    const regNoField = config.fields.find(f => f.id === "regNo");
    const barcodeText = (regNoField && regNoField.defaultValue) || "23HT1A4353";
    const bcCanvas = generateBarcode(barcodeText);
    if (bcCanvas) {
      if (bc.clearBox) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(bc.clearBox.x, bc.clearBox.y, bc.clearBox.width, bc.clearBox.height);
      }
      ctx.save();
      ctx.translate(bc.x, bc.y);
      ctx.rotate((bc.rotation * Math.PI) / 180);
      ctx.drawImage(bcCanvas, 0, 0, bc.width, bc.height);
      ctx.restore();
    }
  }

  // 6. Draw All Configured Fields Dynamically
  config.fields.forEach((field) => {
    if (!field.enabled) return;

    const c = field.canvas;
    const textVal = `${c.prefix || ""}${field.defaultValue || field.placeholder || field.label}${c.suffix || ""}`;

    ctx.save();

    let fontSize = parseInt(c.fontSize, 10) || 28;
    ctx.font = `${c.fontWeight || "bold"} ${fontSize}px ${c.fontFamily || "'Montserrat', Arial, sans-serif"}`;
    ctx.fillStyle = c.color || "#000000";
    ctx.textAlign = c.textAlign || "left";
    ctx.textBaseline = c.textBaseline || "alphabetic";

    // Auto-fit if max width specified
    if (c.maxWidth && c.maxWidth > 0) {
      while (ctx.measureText(textVal).width > c.maxWidth && fontSize > 14) {
        fontSize -= 1;
        ctx.font = `${c.fontWeight || "bold"} ${fontSize}px ${c.fontFamily || "'Montserrat', Arial, sans-serif"}`;
      }
    }

    const metrics = ctx.measureText(textVal);
    const textWidth = metrics.width;
    const textHeight = fontSize;

    if (c.rotation && c.rotation !== 0) {
      ctx.translate(c.x, c.y);
      ctx.rotate((c.rotation * Math.PI) / 180);
      ctx.fillText(textVal, 0, 0);

      // Save approximate bounding box
      fieldBoundingBoxes[field.id] = {
        id: field.id,
        label: field.label,
        x: c.x - textHeight / 2,
        y: c.y - textWidth / 2,
        width: textHeight + 10,
        height: textWidth + 10,
        rotation: c.rotation
      };
      ctx.restore();
    } else {
      ctx.fillText(textVal, c.x, c.y);

      let boxX = c.x;
      if (c.textAlign === "center") boxX = c.x - textWidth / 2;
      else if (c.textAlign === "right") boxX = c.x - textWidth;

      let boxY = c.y - textHeight;
      if (c.textBaseline === "middle") boxY = c.y - textHeight / 2;
      else if (c.textBaseline === "top") boxY = c.y;

      fieldBoundingBoxes[field.id] = {
        id: field.id,
        label: field.label,
        x: boxX - 4,
        y: boxY - 2,
        width: textWidth + 8,
        height: textHeight + 4,
        rotation: 0
      };
      ctx.restore();
    }
  });

  // 7. Visual Bounding Box Overlays
  if (showBoundingBoxes) {
    ctx.save();
    Object.values(fieldBoundingBoxes).forEach((bbox) => {
      const isSelected = bbox.id === activeFieldId;

      ctx.save();
      if (isSelected) {
        ctx.strokeStyle = "#2563eb"; // Bold Blue for selected field
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 2]);
        ctx.fillStyle = "rgba(37, 99, 235, 0.12)";
      } else {
        ctx.strokeStyle = "rgba(100, 116, 139, 0.5)"; // Subtle Gray
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.fillStyle = "rgba(255, 255, 255, 0.0)";
      }

      ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
      if (isSelected) {
        ctx.fillRect(bbox.x, bbox.y, bbox.width, bbox.height);

        // Coordinate Handle Badge
        ctx.fillStyle = "#2563eb";
        const tagText = `${bbox.label} (${Math.round(bbox.x)}, ${Math.round(bbox.y)})`;
        ctx.font = "bold 12px 'JetBrains Mono', monospace";
        const tagW = ctx.measureText(tagText).width + 10;
        ctx.fillRect(bbox.x, bbox.y - 18, tagW, 16);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(tagText, bbox.x + 5, bbox.y - 6);
      }
      ctx.restore();
    });

    // Draw Photo Frame Bounding Box
    if (pf) {
      ctx.save();
      ctx.strokeStyle = "rgba(16, 185, 129, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(pf.x, pf.y, pf.width, pf.height);
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 12px 'JetBrains Mono', monospace";
      ctx.fillText(`Photo Frame (${pf.width}×${pf.height})`, pf.x + 6, pf.y + 16);
      ctx.restore();
    }

    ctx.restore();
  }
}

function generateBarcode(text) {
  try {
    JsBarcode(barcodeOffscreenCanvas, text, {
      format: "CODE128",
      width: 3,
      height: 110,
      displayValue: false,
      margin: 0,
      background: "#ffffff",
      lineColor: "#000000"
    });
    return barcodeOffscreenCanvas;
  } catch (e) {
    return null;
  }
}

/**
 * Tab Navigation Setup
 */
function initTabs() {
  const tabs = [
    { btn: "tabBtnFields", pane: "paneFields", title: "Card Fields Editor" },
    { btn: "tabBtnTemplate", pane: "paneTemplate", title: "Template Manager" },
    { btn: "tabBtnLanding", pane: "paneLanding", title: "Landing & Branding" },
    { btn: "tabBtnJSON", pane: "paneJSON", title: "Config JSON Backup" }
  ];

  tabs.forEach(({ btn, pane, title }) => {
    const btnEl = document.getElementById(btn);
    if (!btnEl) return;
    btnEl.addEventListener("click", () => {
      tabs.forEach(t => {
        const b = document.getElementById(t.btn);
        const p = document.getElementById(t.pane);
        if (t.btn === btn) {
          b.className = "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition group bg-blue-600 text-white shadow-xs";
          p.classList.remove("hidden");
        } else {
          b.className = "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition group";
          p.classList.add("hidden");
        }
      });

      const breadcrumb = document.getElementById("activeBreadcrumb");
      if (breadcrumb) {
        breadcrumb.textContent = title;
      }

      if (pane === "paneJSON") {
        updateRawJSONTextarea();
      }

      if (window.lucide) {
        window.lucide.createIcons();
      }
    });
  });
}

/**
 * Render Dynamic Field Selector Pills
 */
function renderFieldsPills() {
  const container = document.getElementById("fieldsPillsContainer");
  if (!container) return;
  container.innerHTML = "";

  config.fields.forEach((field) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.id = `pill_${field.id}`;
    pill.className = `px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
      field.id === activeFieldId
        ? "border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-xs ring-1 ring-blue-600"
        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
    }`;

    let iconClass = "fa-solid fa-font";
    if (field.id === "name") iconClass = "fa-solid fa-user";
    else if (field.id === "regNo") iconClass = "fa-solid fa-hashtag";
    else if (field.id === "branch") iconClass = "fa-solid fa-graduation-cap";
    else if (field.id === "mobile") iconClass = "fa-solid fa-phone";
    else if (field.id === "bloodGroup") iconClass = "fa-solid fa-droplet";
    else if (field.id === "batch") iconClass = "fa-regular fa-calendar";

    pill.innerHTML = `
      <i class="${iconClass} text-[11px]"></i>
      <span>${field.label}</span>
    `;

    pill.addEventListener("click", () => {
      selectField(field.id);
    });

    container.appendChild(pill);
  });
}

/**
 * Select a Field to Inspect & Edit
 */
function selectField(fieldId) {
  activeFieldId = fieldId;
  const field = config.fields.find(f => f.id === fieldId);
  if (!field) return;

  // Update pills active styling
  document.querySelectorAll("#fieldsPillsContainer button").forEach(btn => {
    if (btn.id === `pill_${fieldId}`) {
      btn.className = "px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 border-blue-600 bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-600";
    } else {
      btn.className = "px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs";
    }
  });

  // Populate Inspector
  document.getElementById("inspectorFieldTitle").textContent = field.label;
  document.getElementById("inspectorFieldId").textContent = `ID: ${field.id}`;
  document.getElementById("propLabel").value = field.label;
  document.getElementById("propDefaultValue").value = field.defaultValue || "";

  const c = field.canvas;
  document.getElementById("propCoordBadge").textContent = `X: ${c.x}, Y: ${c.y}`;
  document.getElementById("propXNum").value = c.x;
  document.getElementById("propXRange").value = c.x;
  document.getElementById("propYNum").value = c.y;
  document.getElementById("propYRange").value = c.y;

  document.getElementById("propFontSize").value = c.fontSize || 30;
  document.getElementById("propFontWeight").value = c.fontWeight || "bold";
  document.getElementById("propColorPicker").value = c.color || "#000000";
  document.getElementById("propColorText").value = c.color || "#000000";

  document.getElementById("propTextAlign").value = c.textAlign || "left";
  document.getElementById("propRotation").value = String(c.rotation || 0);
  document.getElementById("propTextBaseline").value = c.textBaseline || "alphabetic";
  document.getElementById("propMaxWidth").value = c.maxWidth || 0;
  document.getElementById("propPrefix").value = c.prefix || "";

  // Delete button visibility (core fields cannot be deleted)
  const btnDelete = document.getElementById("btnDeleteCurrentField");
  if (field.category === "core") {
    btnDelete.classList.add("hidden");
  } else {
    btnDelete.classList.remove("hidden");
  }

  renderAdminCanvas();
}

/**
 * Bind Inspector Form Controls to Active Field
 */
function bindInspectorEvents() {
  const getActiveField = () => config.fields.find(f => f.id === activeFieldId);

  // Label & Default Value
  document.getElementById("propLabel").addEventListener("input", (e) => {
    const f = getActiveField();
    if (!f) return;
    f.label = e.target.value;
    document.getElementById("inspectorFieldTitle").textContent = f.label;
    renderFieldsPills();
    renderAdminCanvas();
  });

  document.getElementById("propDefaultValue").addEventListener("input", (e) => {
    const f = getActiveField();
    if (!f) return;
    f.defaultValue = e.target.value;
    renderAdminCanvas();
  });

  // Coordinates: X Sliders & Numeric Inputs
  const xNum = document.getElementById("propXNum");
  const xRange = document.getElementById("propXRange");
  const updateX = (val) => {
    const f = getActiveField();
    if (!f) return;
    f.canvas.x = parseInt(val, 10) || 0;
    xNum.value = f.canvas.x;
    xRange.value = f.canvas.x;
    document.getElementById("propCoordBadge").textContent = `X: ${f.canvas.x}, Y: ${f.canvas.y}`;
    renderAdminCanvas();
  };
  xNum.addEventListener("input", (e) => updateX(e.target.value));
  xRange.addEventListener("input", (e) => updateX(e.target.value));

  // Coordinates: Y Sliders & Numeric Inputs
  const yNum = document.getElementById("propYNum");
  const yRange = document.getElementById("propYRange");
  const updateY = (val) => {
    const f = getActiveField();
    if (!f) return;
    f.canvas.y = parseInt(val, 10) || 0;
    yNum.value = f.canvas.y;
    yRange.value = f.canvas.y;
    document.getElementById("propCoordBadge").textContent = `X: ${f.canvas.x}, Y: ${f.canvas.y}`;
    renderAdminCanvas();
  };
  yNum.addEventListener("input", (e) => updateY(e.target.value));
  yRange.addEventListener("input", (e) => updateY(e.target.value));

  // Typography
  document.getElementById("propFontSize").addEventListener("input", (e) => {
    const f = getActiveField();
    if (!f) return;
    f.canvas.fontSize = parseInt(e.target.value, 10) || 24;
    renderAdminCanvas();
  });

  document.getElementById("propFontWeight").addEventListener("change", (e) => {
    const f = getActiveField();
    if (!f) return;
    f.canvas.fontWeight = e.target.value;
    renderAdminCanvas();
  });

  // Colors
  const colorPicker = document.getElementById("propColorPicker");
  const colorText = document.getElementById("propColorText");
  colorPicker.addEventListener("input", (e) => {
    const f = getActiveField();
    if (!f) return;
    f.canvas.color = e.target.value;
    colorText.value = e.target.value;
    renderAdminCanvas();
  });
  colorText.addEventListener("input", (e) => {
    const f = getActiveField();
    if (!f) return;
    f.canvas.color = e.target.value;
    colorPicker.value = e.target.value;
    renderAdminCanvas();
  });

  // Alignment & Rotation
  document.getElementById("propTextAlign").addEventListener("change", (e) => {
    const f = getActiveField();
    if (!f) return;
    f.canvas.textAlign = e.target.value;
    renderAdminCanvas();
  });

  document.getElementById("propRotation").addEventListener("change", (e) => {
    const f = getActiveField();
    if (!f) return;
    f.canvas.rotation = parseInt(e.target.value, 10) || 0;
    renderAdminCanvas();
  });

  document.getElementById("propTextBaseline").addEventListener("change", (e) => {
    const f = getActiveField();
    if (!f) return;
    f.canvas.textBaseline = e.target.value;
    renderAdminCanvas();
  });

  document.getElementById("propMaxWidth").addEventListener("input", (e) => {
    const f = getActiveField();
    if (!f) return;
    f.canvas.maxWidth = parseInt(e.target.value, 10) || 0;
    renderAdminCanvas();
  });

  document.getElementById("propPrefix").addEventListener("input", (e) => {
    const f = getActiveField();
    if (!f) return;
    f.canvas.prefix = e.target.value;
    renderAdminCanvas();
  });

  // Delete Custom Field
  document.getElementById("btnDeleteCurrentField").addEventListener("click", () => {
    const f = getActiveField();
    if (!f || f.category === "core") return;
    if (confirm(`Are you sure you want to delete custom field "${f.label}"?`)) {
      config.fields = config.fields.filter(x => x.id !== f.id);
      renderFieldsPills();
      selectField("name");
      showToast("Custom field deleted");
    }
  });

  // Add Custom Field Modal
  const modal = document.getElementById("modalAddField");
  document.getElementById("btnOpenAddFieldModal").addEventListener("click", () => {
    document.getElementById("newFieldLabel").value = "";
    document.getElementById("newFieldId").value = "";
    document.getElementById("newFieldDefault").value = "";
    document.getElementById("newFieldX").value = 92;
    document.getElementById("newFieldY").value = 680;
    modal.classList.remove("hidden");
  });

  const closeModal = () => modal.classList.add("hidden");
  document.getElementById("btnCloseAddFieldModal").addEventListener("click", closeModal);
  document.getElementById("btnCancelAddField").addEventListener("click", closeModal);

  document.getElementById("newFieldLabel").addEventListener("input", (e) => {
    const idInput = document.getElementById("newFieldId");
    if (!idInput.dataset.manual) {
      idInput.value = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    }
  });
  document.getElementById("newFieldId").addEventListener("input", (e) => {
    e.target.dataset.manual = "true";
  });

  document.getElementById("btnConfirmAddField").addEventListener("click", () => {
    const label = document.getElementById("newFieldLabel").value.trim();
    let id = document.getElementById("newFieldId").value.trim();
    const defVal = document.getElementById("newFieldDefault").value.trim();
    const posX = parseInt(document.getElementById("newFieldX").value, 10) || 92;
    const posY = parseInt(document.getElementById("newFieldY").value, 10) || 680;

    if (!label) {
      alert("Please enter a field label");
      return;
    }
    if (!id) {
      id = label.toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    if (config.fields.some(f => f.id === id)) {
      alert(`A field with ID "${id}" already exists. Please choose a unique ID.`);
      return;
    }

    const newField = {
      id: id,
      label: label,
      placeholder: `Enter ${label}...`,
      defaultValue: defVal || label.toUpperCase(),
      type: "text",
      category: "custom",
      required: false,
      uppercase: true,
      enabled: true,
      canvas: {
        x: posX,
        y: posY,
        fontSize: 28,
        fontWeight: "bold",
        fontFamily: "'Montserrat', Arial, sans-serif",
        color: "#000000",
        textAlign: "left",
        textBaseline: "alphabetic",
        rotation: 0,
        maxWidth: 400,
        prefix: "",
        suffix: ""
      }
    };

    config.fields.push(newField);
    renderFieldsPills();
    selectField(id);
    closeModal();
    showToast(`Created custom field "${label}"!`);
  });
}

/**
 * Bind Template Management Events
 */
function bindTemplateTabEvents() {
  const fileInput = document.getElementById("adminTemplateFileInput");
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const b64 = event.target.result;
        config.template.customTemplateBase64 = b64;
        templateImg = new Image();
        templateImg.onload = () => {
          renderAdminCanvas();
          showToast("New custom background template loaded!");
        };
        templateImg.src = b64;
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById("btnResetTemplateImage").addEventListener("click", () => {
    config.template.customTemplateBase64 = null;
    loadAdminAssets();
    showToast("Reset to official CIT template");
  });

  // Photo Frame Inputs
  const pfX = document.getElementById("photoFrameX");
  const pfY = document.getElementById("photoFrameY");
  const pfW = document.getElementById("photoFrameW");
  const pfH = document.getElementById("photoFrameH");
  const updatePF = () => {
    config.template.photoFrame.x = parseInt(pfX.value, 10) || 137;
    config.template.photoFrame.y = parseInt(pfY.value, 10) || 305;
    config.template.photoFrame.width = parseInt(pfW.value, 10) || 354;
    config.template.photoFrame.height = parseInt(pfH.value, 10) || 396;
    document.getElementById("photoFrameDimensionsBadge").textContent = 
      `${config.template.photoFrame.x}, ${config.template.photoFrame.y} (${config.template.photoFrame.width}×${config.template.photoFrame.height})`;
    renderAdminCanvas();
  };
  [pfX, pfY, pfW, pfH].forEach(input => input.addEventListener("input", updatePF));

  // Dashed Line Inputs
  const dashedEnable = document.getElementById("dashedLineEnabled");
  const dashedY = document.getElementById("dashedLineY");
  const dashedPattern = document.getElementById("dashedLinePattern");
  const dashedColor = document.getElementById("dashedLineColor");

  dashedEnable.addEventListener("change", (e) => {
    config.template.dashedLine.enabled = e.target.checked;
    renderAdminCanvas();
  });
  dashedY.addEventListener("input", (e) => {
    config.template.dashedLine.y = parseFloat(e.target.value) || 170.5;
    renderAdminCanvas();
  });
  dashedPattern.addEventListener("input", (e) => {
    const parts = e.target.value.split(",").map(p => parseInt(p.trim(), 10)).filter(p => !isNaN(p));
    if (parts.length >= 2) {
      config.template.dashedLine.dashLength = parts[0];
      config.template.dashedLine.gapLength = parts[1];
      renderAdminCanvas();
    }
  });
  dashedColor.addEventListener("input", (e) => {
    config.template.dashedLine.color = e.target.value;
    renderAdminCanvas();
  });
}

/**
 * Bind Landing Page & Institutional Branding Events
 */
function bindLandingTabEvents() {
  const b = config.branding;

  // Set initial input values from loaded config
  const elCollege = document.getElementById("brandCollegeName");
  const elSubtitle = document.getElementById("brandSubtitle");
  const elBadge = document.getElementById("brandBadgeText");
  const elPrimaryColor = document.getElementById("brandPrimaryColor");
  const elPrimaryColorText = document.getElementById("brandPrimaryColorText");
  const elPortalTitle = document.getElementById("brandPortalTitle");
  const elAddress = document.getElementById("brandCampusAddress");
  const elWebsite = document.getElementById("brandWebsite");
  const elPhone = document.getElementById("brandPhone");
  const elEmail = document.getElementById("brandEmail");

  const toggleBatch = document.getElementById("toggleEnableBatch");
  const toggleBarcode = document.getElementById("toggleEnableBarcode");
  const toggleTplUpload = document.getElementById("toggleEnableTemplateUpload");
  const toggleSampleData = document.getElementById("toggleEnableSampleData");

  if (elCollege) elCollege.value = b.collegeName || "";
  if (elSubtitle) elSubtitle.value = b.subtitle || "";
  if (elBadge) elBadge.value = b.badgeText || "CIT";
  if (elPrimaryColor) elPrimaryColor.value = b.primaryColor || "#0b4594";
  if (elPrimaryColorText) elPrimaryColorText.value = b.primaryColor || "#0b4594";
  if (elPortalTitle) elPortalTitle.value = b.portalTitle || "";
  if (elAddress) elAddress.value = b.campusAddress || "";
  if (elWebsite) elWebsite.value = b.websiteUrl || "";
  if (elPhone) elPhone.value = b.contactPhone || "";
  if (elEmail) elEmail.value = b.contactEmail || "";

  if (toggleBatch) toggleBatch.checked = b.enableBatchMode !== false;
  if (toggleBarcode) toggleBarcode.checked = b.enableDynamicBarcode !== false;
  if (toggleTplUpload) toggleTplUpload.checked = b.enableCustomTemplateUpload !== false;
  if (toggleSampleData) toggleSampleData.checked = b.enableSampleDataButton !== false;

  // Bind live updates to config
  elCollege.addEventListener("input", (e) => b.collegeName = e.target.value);
  elSubtitle.addEventListener("input", (e) => b.subtitle = e.target.value);
  elBadge.addEventListener("input", (e) => b.badgeText = e.target.value);
  elPrimaryColor.addEventListener("input", (e) => {
    b.primaryColor = e.target.value;
    elPrimaryColorText.value = e.target.value;
  });
  elPrimaryColorText.addEventListener("input", (e) => {
    b.primaryColor = e.target.value;
    elPrimaryColor.value = e.target.value;
  });
  elPortalTitle.addEventListener("input", (e) => b.portalTitle = e.target.value);
  elAddress.addEventListener("input", (e) => b.campusAddress = e.target.value);
  elWebsite.addEventListener("input", (e) => b.websiteUrl = e.target.value);
  elPhone.addEventListener("input", (e) => b.contactPhone = e.target.value);
  elEmail.addEventListener("input", (e) => b.contactEmail = e.target.value);

  toggleBatch.addEventListener("change", (e) => b.enableBatchMode = e.target.checked);
  toggleBarcode.addEventListener("change", (e) => b.enableDynamicBarcode = e.target.checked);
  toggleTplUpload.addEventListener("change", (e) => b.enableCustomTemplateUpload = e.target.checked);
  toggleSampleData.addEventListener("change", (e) => b.enableSampleDataButton = e.target.checked);
}

/**
 * Raw JSON Tab Editor
 */
function bindJSONTabEvents() {
  document.getElementById("btnFormatJSON").addEventListener("click", () => {
    updateRawJSONTextarea();
  });

  document.getElementById("btnApplyRawJSON").addEventListener("click", () => {
    const raw = document.getElementById("rawJsonTextarea").value;
    try {
      const parsed = JSON.parse(raw);
      config = ConfigManager.mergeDefaults(parsed, DEFAULT_CONFIG);
      renderFieldsPills();
      selectField(activeFieldId);
      loadAdminAssets();
      renderAdminCanvas();
      showToast("Applied raw JSON configuration!");
    } catch (err) {
      alert("Invalid JSON syntax: " + err.message);
    }
  });
}

function updateRawJSONTextarea() {
  const textarea = document.getElementById("rawJsonTextarea");
  if (textarea) {
    textarea.value = JSON.stringify(config, null, 2);
  }
}

/**
 * Interactive Canvas Clicking & Dragging
 */
function bindCanvasInteractions() {
  const hoverBadge = document.getElementById("canvasHoverCoords");

  const getCanvasCoords = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY)
    };
  };

  // Hover coordinate indicator
  canvas.addEventListener("mousemove", (e) => {
    const { x, y } = getCanvasCoords(e);
    if (hoverBadge) hoverBadge.textContent = `X: ${x}, Y: ${y}`;

    // Dragging field handle
    if (isDraggingField && dragFieldId) {
      const f = config.fields.find(item => item.id === dragFieldId);
      if (f) {
        const deltaX = x - dragStartX;
        const deltaY = y - dragStartY;
        f.canvas.x = Math.max(0, Math.min(768, Math.round(initialFieldX + deltaX)));
        f.canvas.y = Math.max(0, Math.min(1024, Math.round(initialFieldY + deltaY)));

        // Update inspector fields
        document.getElementById("propXNum").value = f.canvas.x;
        document.getElementById("propXRange").value = f.canvas.x;
        document.getElementById("propYNum").value = f.canvas.y;
        document.getElementById("propYRange").value = f.canvas.y;
        document.getElementById("propCoordBadge").textContent = `X: ${f.canvas.x}, Y: ${f.canvas.y}`;

        renderAdminCanvas();
      }
    } else {
      // Check if mouse is over any field bounding box
      let isOver = false;
      Object.values(fieldBoundingBoxes).forEach(bbox => {
        if (x >= bbox.x && x <= bbox.x + bbox.width && y >= bbox.y && y <= bbox.y + bbox.height) {
          isOver = true;
        }
      });
      canvas.style.cursor = isOver ? "pointer" : "crosshair";
    }
  });

  // Click / Mousedown on field to select or drag
  canvas.addEventListener("mousedown", (e) => {
    const { x, y } = getCanvasCoords(e);
    let hitField = null;

    Object.values(fieldBoundingBoxes).forEach(bbox => {
      if (x >= bbox.x && x <= bbox.x + bbox.width && y >= bbox.y && y <= bbox.y + bbox.height) {
        hitField = bbox.id;
      }
    });

    if (hitField) {
      selectField(hitField);
      isDraggingField = true;
      dragFieldId = hitField;
      dragStartX = x;
      dragStartY = y;
      const f = config.fields.find(item => item.id === hitField);
      initialFieldX = f.canvas.x;
      initialFieldY = f.canvas.y;
      canvas.style.cursor = "grabbing";
    }
  });

  window.addEventListener("mouseup", () => {
    if (isDraggingField) {
      isDraggingField = false;
      dragFieldId = null;
      canvas.style.cursor = "default";
      showToast("Field position updated!");
    }
  });

  // Toggle bounding boxes
  document.getElementById("btnToggleOverlays").addEventListener("click", () => {
    showBoundingBoxes = !showBoundingBoxes;
    renderAdminCanvas();
  });

  // Zoom Fit
  const wrapper = document.getElementById("adminCanvasWrapper");
  document.getElementById("btnZoomFit").addEventListener("click", () => {
    wrapper.style.transform = wrapper.style.transform === "scale(1)" ? "scale(1.1)" : "scale(1)";
  });
}

/**
 * Global Save, Export, Import, Reset Actions
 */
function bindGlobalActionButtons() {
  const saveAll = () => {
    ConfigManager.save(config);
    showToast("All changes saved & published to live portal!");
  };

  document.getElementById("btnSaveConfig").addEventListener("click", saveAll);
  document.getElementById("btnBottomSaveCTA").addEventListener("click", saveAll);

  // Reset to Factory Defaults
  document.getElementById("btnResetConfig").addEventListener("click", () => {
    if (confirm("Reset ALL fields, coordinates, branding, and templates back to official CIT factory defaults?")) {
      config = ConfigManager.reset();
      renderFieldsPills();
      selectField("name");
      bindLandingTabEvents();
      loadAdminAssets();
      renderAdminCanvas();
      showToast("Factory defaults restored!");
    }
  });

  // Export JSON
  document.getElementById("btnExportJSON").addEventListener("click", () => {
    ConfigManager.exportToFile(config);
    showToast("Configuration JSON exported!");
  });

  // Import JSON
  const importInput = document.getElementById("importFileInput");
  document.getElementById("btnImportJSON").addEventListener("click", () => {
    importInput.click();
  });

  importInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      ConfigManager.importFromFile(file, (err, importedConfig) => {
        if (err) {
          alert("Error importing file: " + err.message);
        } else {
          config = importedConfig;
          renderFieldsPills();
          selectField("name");
          bindLandingTabEvents();
          loadAdminAssets();
          renderAdminCanvas();
          showToast("Configuration imported successfully!");
        }
      });
    }
  });
}

function showToast(msg) {
  const toast = document.getElementById("adminToast");
  const toastMsg = document.getElementById("adminToastMsg");
  if (!toast || !toastMsg) return;

  toastMsg.textContent = msg;
  toast.classList.remove("opacity-0", "translate-y-4");
  toast.classList.add("opacity-100", "translate-y-0");

  setTimeout(() => {
    toast.classList.remove("opacity-100", "translate-y-0");
    toast.classList.add("opacity-0", "translate-y-4");
  }, 2500);
}
