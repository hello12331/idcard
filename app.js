/**
 * Chalapathi Institute of Technology - ID Card Generator
 * Master Render Engine (Exact Pixel Match with Official Reference)
 */

// Active Config from Admin Studio (or default)
let activeConfig = (typeof ConfigManager !== "undefined") ? ConfigManager.load() : (typeof DEFAULT_CONFIG !== "undefined" ? DEFAULT_CONFIG : null);

// Application State
const state = {
  name: "KODELA KIRAN KUMAR",
  regNo: "23HT1A4353",
  branch: "CSE-AI",
  mobile: "9908406687",
  bloodGroup: "O+ve",
  batch: "2023 - 2027",
  showUnderlines: false, // Clean look matching target reference
  customFieldsData: {}, // Additional custom dynamic fields
  
  // Photo state
  photoImg: null,
  photoScale: 1.0,
  photoPanX: 0,
  photoPanY: 0,
  isDraggingPhoto: false,
  dragStartX: 0,
  dragStartY: 0,
  initialPanX: 0,
  initialPanY: 0,

  // Template image
  templateImg: null,

  // Barcode & settings
  useDynamicBarcode: false, // Default to authentic barcode from official reference
  
  // Batch processing
  batchList: [],
  batchIndex: 0
};

// Canvas references
let canvas, ctx;
let barcodeOffscreenCanvas;

// Photo frame dimensions matching official target reference (137, 305, 354, 396)
const PHOTO_FRAME = (activeConfig && activeConfig.template && activeConfig.template.photoFrame)
  ? { ...activeConfig.template.photoFrame }
  : { x: 137, y: 305, width: 354, height: 396 };

// Helper to get coordinates and canvas styling dynamically from active config
function getCoords(id, fallback) {
  if (activeConfig && activeConfig.fields) {
    const f = activeConfig.fields.find(item => item.id === id);
    if (f && f.canvas) {
      return {
        x: f.canvas.x,
        y: f.canvas.y,
        font: `${f.canvas.fontWeight || "bold"} ${f.canvas.fontSize || 30}px ${f.canvas.fontFamily || "'Montserrat', Arial, sans-serif"}`,
        maxW: f.canvas.maxWidth || fallback.maxW || 550,
        color: f.canvas.color || "#000000",
        textAlign: f.canvas.textAlign || fallback.textAlign || "left",
        textBaseline: f.canvas.textBaseline || fallback.textBaseline || "alphabetic",
        rotation: f.canvas.rotation !== undefined ? f.canvas.rotation : (fallback.rotation || 0),
        prefix: f.canvas.prefix || ""
      };
    }
  }
  return fallback;
}

const DEFAULT_COORDS = {
  branch: { x: 323, y: 288, font: "bold 30px 'Montserrat', Arial, sans-serif", maxW: 200, textAlign: "left", textBaseline: "alphabetic" },
  name: { x: 92, y: 753, font: "bold 32px 'Montserrat', Arial, sans-serif", maxW: 550, textAlign: "left", textBaseline: "alphabetic" },
  mobile: { x: 261, y: 802, font: "bold 29px 'Montserrat', Arial, sans-serif", maxW: 260, textAlign: "left", textBaseline: "alphabetic" },
  regNo: { x: 227, y: 851, font: "bold 29px 'Montserrat', Arial, sans-serif", maxW: 320, textAlign: "left", textBaseline: "alphabetic" },
  bloodGroup: { x: 565, y: 212, font: "bold 36px 'Montserrat', Arial, sans-serif", textAlign: "center", textBaseline: "middle" },
  batch: { x: 98, y: 481, font: "bold 34px 'Montserrat', Arial, sans-serif", textAlign: "center", textBaseline: "middle", rotation: -90 }
};

// Exact coordinates calibrated with fallback support
const COORDS = {
  get branch() { return getCoords("branch", DEFAULT_COORDS.branch); },
  get name() { return getCoords("name", DEFAULT_COORDS.name); },
  get mobile() { return getCoords("mobile", DEFAULT_COORDS.mobile); },
  get regNo() { return getCoords("regNo", DEFAULT_COORDS.regNo); },
  get bloodGroup() { return getCoords("bloodGroup", DEFAULT_COORDS.bloodGroup); },
  get batch() { return getCoords("batch", DEFAULT_COORDS.batch); }
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("idCardCanvas");
  ctx = canvas.getContext("2d");
  
  canvas.width = 768;
  canvas.height = 1024;

  barcodeOffscreenCanvas = document.createElement("canvas");

  // Load Assets
  loadAssets();

  // Initialize Dynamic Admin Studio Settings & Custom Fields
  initDynamicAdminFeatures();

  // Initial immediate render
  renderCard();

  if (document.fonts) {
    document.fonts.ready.then(() => {
      renderCard();
    });
  }

  // Bind UI Events
  bindInputEvents();
  bindPhotoControls();
  bindInteractiveCanvasDrag();
  bindExportButtons();
  bindBatchFeatures();
  bindMobileTabs();
});

// Load Template & Sample Photo
function loadAssets() {
  const triggerRender = () => {
    requestAnimationFrame(() => renderCard());
  };

  state.templateImg = new Image();
  state.templateImg.onload = triggerRender;
  state.templateImg.onerror = () => {
    state.templateImg.src = "assets/perfect_base_template.png";
  };
  if (activeConfig && activeConfig.template && activeConfig.template.customTemplateBase64) {
    state.templateImg.src = activeConfig.template.customTemplateBase64;
  } else if (typeof EMBEDDED_ASSETS !== "undefined" && EMBEDDED_ASSETS.templateBase64) {
    state.templateImg.src = EMBEDDED_ASSETS.templateBase64;
  } else {
    state.templateImg.src = "assets/perfect_base_template.png";
  }

  state.photoImg = new Image();
  state.photoImg.onload = triggerRender;
  state.photoImg.onerror = () => {
    state.photoImg.src = "assets/sample_photo.jpg";
  };
  if (typeof EMBEDDED_ASSETS !== "undefined" && EMBEDDED_ASSETS.samplePhotoBase64) {
    state.photoImg.src = EMBEDDED_ASSETS.samplePhotoBase64;
  } else {
    state.photoImg.src = "assets/sample_photo.jpg";
  }
}

function initDynamicAdminFeatures() {
  if (!activeConfig) return;

  // 1. Branding: Header, College Name, Subtitle, Badge
  if (activeConfig.branding) {
    const headerCollege = document.getElementById("headerCollegeName");
    if (headerCollege && activeConfig.branding.collegeName) {
      headerCollege.textContent = activeConfig.branding.collegeName;
    }
    const headerSub = document.getElementById("headerSubtitle");
    if (headerSub && activeConfig.branding.subtitle) {
      headerSub.textContent = activeConfig.branding.subtitle;
    }
    const headerBadge = document.getElementById("headerBadge");
    if (headerBadge && activeConfig.branding.portalBadge) {
      headerBadge.textContent = activeConfig.branding.portalBadge;
    }

    // Toggle features visibility if configured
    if (activeConfig.branding.features) {
      const feat = activeConfig.branding.features;
      const batchCard = document.getElementById("batchCard");
      if (batchCard && feat.batchMode === false) {
        batchCard.classList.add("hidden");
      }
      const btnFillSample = document.getElementById("btnFillSample");
      if (btnFillSample && feat.sampleData === false) {
        btnFillSample.classList.add("hidden");
      }
      const templateUploadContainer = document.getElementById("templateUpload")?.closest(".p-3");
      if (templateUploadContainer && feat.templateUpload === false) {
        templateUploadContainer.classList.add("hidden");
      }
    }
  }

  // 2. Custom Dynamic Fields in Form
  const customFieldsCard = document.getElementById("customFieldsCard");
  const customFieldsInputsList = document.getElementById("customFieldsInputsList");

  if (customFieldsCard && customFieldsInputsList && Array.isArray(activeConfig.fields)) {
    const customFields = activeConfig.fields.filter(f => f.category === 'custom' && f.visible !== false);
    if (customFields.length > 0) {
      customFieldsCard.classList.remove("hidden");
      customFieldsInputsList.innerHTML = "";

      customFields.forEach(f => {
        if (state.customFieldsData[f.id] === undefined) {
          state.customFieldsData[f.id] = f.defaultValue || "";
        }

        const wrapper = document.createElement("div");
        wrapper.className = "flex flex-col gap-1";

        const label = document.createElement("label");
        label.className = "text-xs font-semibold text-slate-700 flex items-center justify-between";
        label.innerHTML = `<span>${f.label}</span> <span class="text-[10px] text-slate-400 font-mono">#${f.id}</span>`;

        const input = document.createElement("input");
        input.type = "text";
        input.id = `custom_${f.id}`;
        input.value = state.customFieldsData[f.id];
        input.placeholder = f.placeholder || f.label;
        input.className = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white shadow-sm";

        input.addEventListener("input", (e) => {
          state.customFieldsData[f.id] = e.target.value.toUpperCase();
          e.target.value = state.customFieldsData[f.id];
          renderCard();
        });

        wrapper.appendChild(label);
        wrapper.appendChild(input);
        customFieldsInputsList.appendChild(wrapper);
      });
    } else {
      customFieldsCard.classList.add("hidden");
    }
  }
}

// Bind text and select inputs
function bindInputEvents() {
  const nameInput = document.getElementById("studentName");
  const regNoInput = document.getElementById("regNo");
  const branchSelect = document.getElementById("branchSelect");
  const branchCustom = document.getElementById("branchCustom");
  const mobileInput = document.getElementById("mobileNo");
  const bloodSelect = document.getElementById("bloodGroup");
  const batchSelect = document.getElementById("batchSelect");
  const batchCustom = document.getElementById("batchCustom");
  const barcodeToggle = document.getElementById("barcodeToggle");
  const underlineToggle = document.getElementById("underlineToggle");

  nameInput.addEventListener("input", (e) => {
    state.name = e.target.value.toUpperCase();
    e.target.value = state.name;
    renderCard();
  });

  regNoInput.addEventListener("input", (e) => {
    state.regNo = e.target.value.toUpperCase();
    e.target.value = state.regNo;
    renderCard();
  });

  branchSelect.addEventListener("change", (e) => {
    if (e.target.value === "CUSTOM") {
      branchCustom.classList.remove("hidden");
      state.branch = branchCustom.value.toUpperCase() || "CSE";
    } else {
      branchCustom.classList.add("hidden");
      state.branch = e.target.value;
    }
    renderCard();
  });

  branchCustom.addEventListener("input", (e) => {
    state.branch = e.target.value.toUpperCase();
    e.target.value = state.branch;
    renderCard();
  });

  mobileInput.addEventListener("input", (e) => {
    state.mobile = e.target.value.replace(/\D/g, "").slice(0, 10);
    e.target.value = state.mobile;
    renderCard();
  });

  bloodSelect.addEventListener("change", (e) => {
    state.bloodGroup = e.target.value;
    renderCard();
  });

  batchSelect.addEventListener("change", (e) => {
    if (e.target.value === "CUSTOM") {
      batchCustom.classList.remove("hidden");
      state.batch = batchCustom.value.trim() || "2023 - 2027";
    } else if (e.target.value === "NONE") {
      batchCustom.classList.add("hidden");
      state.batch = "";
    } else {
      batchCustom.classList.add("hidden");
      state.batch = e.target.value;
    }
    renderCard();
  });

  batchCustom.addEventListener("input", (e) => {
    state.batch = e.target.value.trim();
    renderCard();
  });

  if (barcodeToggle) {
    barcodeToggle.checked = state.useDynamicBarcode;
    barcodeToggle.addEventListener("change", (e) => {
      state.useDynamicBarcode = e.target.checked;
      renderCard();
    });
  }

  if (underlineToggle) {
    underlineToggle.checked = state.showUnderlines;
    underlineToggle.addEventListener("change", (e) => {
      state.showUnderlines = e.target.checked;
      renderCard();
    });
  }

  document.getElementById("btnFillSample").addEventListener("click", () => {
    fillSampleData();
  });

  document.getElementById("btnClearAll").addEventListener("click", () => {
    clearAllData();
  });

  document.getElementById("templateUpload").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImg = new Image();
        newImg.onload = () => {
          state.templateImg = newImg;
          renderCard();
          showNotification("Custom template loaded!");
        };
        newImg.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}

// Bind photo upload, zoom, pan
function bindPhotoControls() {
  const photoInput = document.getElementById("photoUpload");
  const zoomSlider = document.getElementById("photoZoom");
  const panXSlider = document.getElementById("photoPanX");
  const panYSlider = document.getElementById("photoPanY");
  const btnResetPhoto = document.getElementById("btnResetPhoto");
  const btnLoadSamplePhoto = document.getElementById("btnLoadSamplePhoto");
  const btnRemovePhoto = document.getElementById("btnRemovePhoto");

  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          state.photoImg = img;
          resetPhotoAdjustments();
          renderCard();
          showNotification("Photo uploaded!");
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  const dropZone = document.getElementById("photoDropZone");
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("border-blue-500", "bg-blue-50");
  });
  dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dropZone.classList.remove("border-blue-500", "bg-blue-50");
  });
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("border-blue-500", "bg-blue-50");
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          state.photoImg = img;
          resetPhotoAdjustments();
          renderCard();
          showNotification("Photo uploaded!");
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  zoomSlider.addEventListener("input", (e) => {
    state.photoScale = parseFloat(e.target.value);
    document.getElementById("zoomValue").textContent = `${Math.round(state.photoScale * 100)}%`;
    renderCard();
  });

  panXSlider.addEventListener("input", (e) => {
    state.photoPanX = parseInt(e.target.value, 10);
    renderCard();
  });
  panYSlider.addEventListener("input", (e) => {
    state.photoPanY = parseInt(e.target.value, 10);
    renderCard();
  });

  btnResetPhoto.addEventListener("click", () => {
    resetPhotoAdjustments();
    renderCard();
  });

  btnLoadSamplePhoto.addEventListener("click", () => {
    state.photoImg = new Image();
    state.photoImg.onload = () => {
      resetPhotoAdjustments();
      renderCard();
      showNotification("Reference student photo loaded!");
    };
    if (typeof EMBEDDED_ASSETS !== "undefined" && EMBEDDED_ASSETS.samplePhotoBase64) {
      state.photoImg.src = EMBEDDED_ASSETS.samplePhotoBase64;
    } else {
      state.photoImg.src = "assets/sample_photo.jpg";
    }
  });

  btnRemovePhoto.addEventListener("click", () => {
    state.photoImg = null;
    photoInput.value = "";
    renderCard();
    showNotification("Photo removed.");
  });
}

function resetPhotoAdjustments() {
  state.photoScale = 1.0;
  state.photoPanX = 0;
  state.photoPanY = 0;
  document.getElementById("photoZoom").value = 1.0;
  document.getElementById("zoomValue").textContent = "100%";
  document.getElementById("photoPanX").value = 0;
  document.getElementById("photoPanY").value = 0;
}

// Mouse dragging directly inside photo frame
function bindInteractiveCanvasDrag() {
  canvas.addEventListener("mousedown", (e) => {
    if (!state.photoImg) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (
      mouseX >= PHOTO_FRAME.x &&
      mouseX <= PHOTO_FRAME.x + PHOTO_FRAME.width &&
      mouseY >= PHOTO_FRAME.y &&
      mouseY <= PHOTO_FRAME.y + PHOTO_FRAME.height
    ) {
      state.isDraggingPhoto = true;
      state.dragStartX = mouseX;
      state.dragStartY = mouseY;
      state.initialPanX = state.photoPanX;
      state.initialPanY = state.photoPanY;
      canvas.classList.add("canvas-interactive");
    }
  });

  window.addEventListener("mousemove", (e) => {
    if (!state.isDraggingPhoto) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const deltaX = mouseX - state.dragStartX;
    const deltaY = mouseY - state.dragStartY;

    state.photoPanX = Math.max(-200, Math.min(200, Math.round(state.initialPanX + deltaX)));
    state.photoPanY = Math.max(-200, Math.min(200, Math.round(state.initialPanY + deltaY)));

    document.getElementById("photoPanX").value = state.photoPanX;
    document.getElementById("photoPanY").value = state.photoPanY;

    renderCard();
  });

  window.addEventListener("mouseup", () => {
    if (state.isDraggingPhoto) {
      state.isDraggingPhoto = false;
      canvas.classList.remove("canvas-interactive");
    }
  });

  canvas.addEventListener("touchstart", (e) => {
    if (!state.photoImg || e.touches.length !== 1) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    const mouseX = (touch.clientX - rect.left) * scaleX;
    const mouseY = (touch.clientY - rect.top) * scaleY;

    if (
      mouseX >= PHOTO_FRAME.x &&
      mouseX <= PHOTO_FRAME.x + PHOTO_FRAME.width &&
      mouseY >= PHOTO_FRAME.y &&
      mouseY <= PHOTO_FRAME.y + PHOTO_FRAME.height
    ) {
      state.isDraggingPhoto = true;
      state.dragStartX = mouseX;
      state.dragStartY = mouseY;
      state.initialPanX = state.photoPanX;
      state.initialPanY = state.photoPanY;
      e.preventDefault();
    }
  }, { passive: false });

  window.addEventListener("touchmove", (e) => {
    if (!state.isDraggingPhoto || e.touches.length !== 1) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    const mouseX = (touch.clientX - rect.left) * scaleX;
    const mouseY = (touch.clientY - rect.top) * scaleY;

    const deltaX = mouseX - state.dragStartX;
    const deltaY = mouseY - state.dragStartY;

    state.photoPanX = Math.max(-200, Math.min(200, Math.round(state.initialPanX + deltaX)));
    state.photoPanY = Math.max(-200, Math.min(200, Math.round(state.initialPanY + deltaY)));

    document.getElementById("photoPanX").value = state.photoPanX;
    document.getElementById("photoPanY").value = state.photoPanY;

    renderCard();
  });

  window.addEventListener("touchend", () => {
    state.isDraggingPhoto = false;
  });

  window.addEventListener("touchcancel", () => {
    state.isDraggingPhoto = false;
  });
}

function generateBarcodeOffscreen(text) {
  if (!text || text.trim() === "") text = "23HT1A4353";
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
  } catch (err) {
    console.error("Barcode generation error:", err);
    return null;
  }
}

/**
 * Main Canvas Render Function
 * 1:1 Pixel Alignment with the Official Target Reference Image
 */
function renderCard() {
  if (!ctx) return;

  // 1. Clear Canvas with Pure White
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Base Template Layer (Official Chalapathi Template)
  if (state.templateImg && state.templateImg.complete) {
    ctx.drawImage(state.templateImg, 0, 0, canvas.width, canvas.height);
  }

  // 2b. Dashed accreditation line (Optional overlay if template doesn't have it)
  const dashedCfg = (activeConfig && activeConfig.template && activeConfig.template.dashedLine)
    ? activeConfig.template.dashedLine
    : { enabled: false, y: 187, startX: 60, endX: 708, color: "#063c9e", width: 2.5, dash: [12, 5] };

  if (dashedCfg.enabled === true) {
    ctx.save();
    ctx.strokeStyle = dashedCfg.color || "#063c9e";
    ctx.lineWidth = dashedCfg.width || 2.5;
    ctx.setLineDash(dashedCfg.dash || [12, 5]);
    ctx.beginPath();
    ctx.moveTo(dashedCfg.startX !== undefined ? dashedCfg.startX : 60, dashedCfg.y || 187);
    ctx.lineTo(dashedCfg.endX !== undefined ? dashedCfg.endX : 708, dashedCfg.y || 187);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Optional Underlines (Only if explicitly checked)
  if (state.showUnderlines) {
    ctx.save();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(320, 286);
    ctx.lineTo(480, 286);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(80, 751);
    ctx.lineTo(556, 751);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(260, 802);
    ctx.lineTo(480, 802);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(225, 851);
    ctx.lineTo(480, 851);
    ctx.stroke();
    ctx.restore();
  }

  // 4. Batch Year (Rotated -90° on left edge: 2023-2027)
  if (state.batch && state.batch.trim() !== "") {
    ctx.save();
    ctx.translate(COORDS.batch.x, COORDS.batch.y);
    ctx.rotate(-Math.PI / 2);
    ctx.font = COORDS.batch.font;
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(state.batch, 0, 0);
    ctx.restore();
  }

  // 5. Blood Group (Centered above 3D blood drop at x=580, y=212)
  if (state.bloodGroup && state.bloodGroup !== "NONE") {
    ctx.save();
    ctx.font = COORDS.bloodGroup.font;
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(state.bloodGroup, COORDS.bloodGroup.x, COORDS.bloodGroup.y);
    ctx.restore();
  }

  // 6. Student Photo Layer (138, 307, 352, 394)
  if (state.photoImg && state.photoImg.complete) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(PHOTO_FRAME.x, PHOTO_FRAME.y, PHOTO_FRAME.width, PHOTO_FRAME.height);
    ctx.clip();

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(PHOTO_FRAME.x, PHOTO_FRAME.y, PHOTO_FRAME.width, PHOTO_FRAME.height);

    const imgAspect = state.photoImg.width / state.photoImg.height;
    const frameAspect = PHOTO_FRAME.width / PHOTO_FRAME.height;

    let baseW, baseH;
    if (imgAspect > frameAspect) {
      baseH = PHOTO_FRAME.height;
      baseW = PHOTO_FRAME.height * imgAspect;
    } else {
      baseW = PHOTO_FRAME.width;
      baseH = PHOTO_FRAME.width / imgAspect;
    }

    const scaledW = baseW * state.photoScale;
    const scaledH = baseH * state.photoScale;

    const posX = PHOTO_FRAME.x + (PHOTO_FRAME.width - scaledW) / 2 + state.photoPanX;
    const posY = PHOTO_FRAME.y + (PHOTO_FRAME.height - scaledH) / 2 + state.photoPanY;

    ctx.drawImage(state.photoImg, posX, posY, scaledW, scaledH);
    ctx.restore();
  }

  // 7. Dynamic Barcode Layer (Only if enabled)
  if (state.useDynamicBarcode && state.regNo) {
    const bcCanvas = generateBarcodeOffscreen(state.regNo);
    if (bcCanvas) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(520, 388, 126, 308);

      ctx.save();
      ctx.translate(640, 396);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(bcCanvas, 0, 0, 290, 118);
      ctx.restore();
    }
  }

  // 8. Branch Name (Directly after 'Branch: ' at x=320)
  if (state.branch) {
    ctx.save();
    let fontSize = 30;
    ctx.font = `bold ${fontSize}px 'Montserrat', Arial, sans-serif`;
    while (ctx.measureText(state.branch).width > 200 && fontSize > 16) {
      fontSize -= 1;
      ctx.font = `bold ${fontSize}px 'Montserrat', Arial, sans-serif`;
    }
    ctx.fillStyle = "#000000";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(state.branch, COORDS.branch.x, COORDS.branch.y);
    ctx.restore();
  }

  // 9. Student Full Name (KODELA KIRAN KUMAR at x=90, y=738)
  if (state.name) {
    ctx.save();
    ctx.fillStyle = "#000000";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    let fontSize = 32;
    ctx.font = `bold ${fontSize}px 'Montserrat', Arial, sans-serif`;
    while (ctx.measureText(state.name).width > COORDS.name.maxW && fontSize > 18) {
      fontSize -= 1;
      ctx.font = `bold ${fontSize}px 'Montserrat', Arial, sans-serif`;
    }

    ctx.fillText(state.name, COORDS.name.x, COORDS.name.y);
    ctx.restore();
  }

  // 10. Mobile Number (After 'Mobile No: ' at x=260, y=786)
  if (state.mobile) {
    ctx.save();
    ctx.font = COORDS.mobile.font;
    ctx.fillStyle = "#000000";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(state.mobile, COORDS.mobile.x, COORDS.mobile.y);
    ctx.restore();
  }

  // 11. Registration Number (After 'REG.NO: ' at x=227, y=835)
  if (state.regNo) {
    ctx.save();
    ctx.font = COORDS.regNo.font;
    ctx.fillStyle = "#000000";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(state.regNo, COORDS.regNo.x, COORDS.regNo.y);
    ctx.restore();
  }

  // 12. Dynamic Admin-Defined Custom Fields
  if (activeConfig && Array.isArray(activeConfig.fields)) {
    const customFields = activeConfig.fields.filter(f => f.category === 'custom' && f.visible !== false);
    for (const field of customFields) {
      const val = state.customFieldsData[field.id] !== undefined ? state.customFieldsData[field.id] : (field.defaultValue || "");
      if (val && val.trim() !== "") {
        const textToDraw = (field.canvas.prefix || "") + val;
        ctx.save();
        const fSize = field.canvas.fontSize || 28;
        const fWeight = field.canvas.fontWeight || "bold";
        const fFamily = field.canvas.fontFamily || "'Montserrat', Arial, sans-serif";
        ctx.font = `${fWeight} ${fSize}px ${fFamily}`;
        ctx.fillStyle = field.canvas.color || "#000000";
        ctx.textAlign = field.canvas.textAlign || "left";
        ctx.textBaseline = field.canvas.textBaseline || "alphabetic";

        let posX = field.canvas.x;
        let posY = field.canvas.y;

        if (field.canvas.rotation) {
          ctx.translate(posX, posY);
          ctx.rotate((field.canvas.rotation * Math.PI) / 180);
          posX = 0;
          posY = 0;
        }

        if (field.canvas.maxWidth) {
          let curSize = fSize;
          while (ctx.measureText(textToDraw).width > field.canvas.maxWidth && curSize > 12) {
            curSize -= 1;
            ctx.font = `${fWeight} ${curSize}px ${fFamily}`;
          }
        }

        ctx.fillText(textToDraw, posX, posY);
        ctx.restore();
      }
    }
  }
}

// Bind Export Buttons: Print, PNG, PDF
function bindExportButtons() {
  document.getElementById("btnPrintCard").addEventListener("click", () => {
    printIDCard();
  });

  const btnPrintCardPreview = document.getElementById("btnPrintCardPreview");
  if (btnPrintCardPreview) {
    btnPrintCardPreview.addEventListener("click", () => {
      printIDCard();
    });
  }

  document.getElementById("btnDownloadPNG").addEventListener("click", () => {
    downloadPNG();
  });

  document.getElementById("btnDownloadPDF").addEventListener("click", () => {
    downloadPDF();
  });

  const cardContainer = document.getElementById("cardCanvasContainer");
  document.getElementById("btnZoomFit").addEventListener("click", () => {
    cardContainer.style.transform = "scale(1)";
  });
  document.getElementById("btnZoom100").addEventListener("click", () => {
    const isMobile = window.innerWidth < 640;
    cardContainer.style.transform = isMobile ? "scale(1.05)" : "scale(1.15)";
  });
}

function printIDCard() {
  renderCard();
  window.print();
}

function downloadPNG() {
  renderCard();
  const filename = `ID_CARD_${state.regNo || "STUDENT"}_${state.name.replace(/\s+/g, "_") || "CARD"}.png`;
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png", 1.0);
  link.click();
  showNotification("High-resolution PNG downloaded!");
}

function downloadPDF() {
  renderCard();
  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [72, 96]
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    pdf.addImage(imgData, "JPEG", 0, 0, 72, 96);
    const filename = `ID_CARD_${state.regNo || "STUDENT"}.pdf`;
    pdf.save(filename);
    showNotification("Print-ready PDF downloaded!");
  } catch (err) {
    console.error("PDF generation error:", err);
    downloadPNG();
  }
}

function fillSampleData() {
  state.name = "KODELA KIRAN KUMAR";
  state.regNo = "23HT1A4353";
  state.branch = "CSE-AI";
  state.mobile = "9908406687";
  state.bloodGroup = "O+ve";
  state.batch = "2023 - 2027";
  state.useDynamicBarcode = false;
  state.showUnderlines = false;

  document.getElementById("studentName").value = state.name;
  document.getElementById("regNo").value = state.regNo;
  document.getElementById("branchSelect").value = state.branch;
  document.getElementById("branchCustom").classList.add("hidden");
  document.getElementById("mobileNo").value = state.mobile;
  document.getElementById("bloodGroup").value = state.bloodGroup;
  
  const batchSelect = document.getElementById("batchSelect");
  const batchCustom = document.getElementById("batchCustom");
  if (batchSelect) {
    batchSelect.value = "2023 - 2027";
    if (batchCustom) batchCustom.classList.add("hidden");
  }
  
  const barcodeToggle = document.getElementById("barcodeToggle");
  if (barcodeToggle) barcodeToggle.checked = false;

  const underlineToggle = document.getElementById("underlineToggle");
  if (underlineToggle) underlineToggle.checked = false;

  state.photoImg = new Image();
  state.photoImg.onload = () => {
    resetPhotoAdjustments();
    renderCard();
  };
  if (typeof EMBEDDED_ASSETS !== "undefined" && EMBEDDED_ASSETS.samplePhotoBase64) {
    state.photoImg.src = EMBEDDED_ASSETS.samplePhotoBase64;
  } else {
    state.photoImg.src = "assets/sample_photo.jpg";
  }

  // Set default values for custom dynamic fields
  if (activeConfig && Array.isArray(activeConfig.fields)) {
    activeConfig.fields.filter(f => f.category === 'custom').forEach(f => {
      state.customFieldsData[f.id] = f.defaultValue || "";
      const inp = document.getElementById(`custom_${f.id}`);
      if (inp) inp.value = state.customFieldsData[f.id];
    });
  }

  showNotification("Official reference student details loaded!");
}

function clearAllData() {
  state.name = "";
  state.regNo = "";
  state.branch = "CSE-AI";
  state.mobile = "";
  state.bloodGroup = "NONE";
  state.batch = "";
  state.photoImg = null;
  state.showUnderlines = false;

  // Clear custom dynamic fields
  if (state.customFieldsData) {
    Object.keys(state.customFieldsData).forEach(k => {
      state.customFieldsData[k] = "";
      const inp = document.getElementById(`custom_${k}`);
      if (inp) inp.value = "";
    });
  }

  document.getElementById("studentName").value = "";
  document.getElementById("regNo").value = "";
  document.getElementById("branchSelect").value = "CSE-AI";
  document.getElementById("branchCustom").classList.add("hidden");
  document.getElementById("branchCustom").value = "";
  document.getElementById("mobileNo").value = "";
  document.getElementById("bloodGroup").value = "NONE";
  const batchSelectEl = document.getElementById("batchSelect");
  if (batchSelectEl) batchSelectEl.value = "NONE";
  const batchCustomEl = document.getElementById("batchCustom");
  if (batchCustomEl) {
    batchCustomEl.value = "";
    batchCustomEl.classList.add("hidden");
  }
  document.getElementById("photoUpload").value = "";

  const underlineToggle = document.getElementById("underlineToggle");
  if (underlineToggle) underlineToggle.checked = false;

  resetPhotoAdjustments();
  renderCard();
  showNotification("Form cleared.");
}

function showNotification(msg) {
  const toast = document.getElementById("toastNotification");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove("opacity-0", "translate-y-4");
  toast.classList.add("opacity-100", "translate-y-0");

  setTimeout(() => {
    toast.classList.remove("opacity-100", "translate-y-0");
    toast.classList.add("opacity-0", "translate-y-4");
  }, 2800);
}

// Batch Mode Features
function bindBatchFeatures() {
  const btnOpenBatch = document.getElementById("btnOpenBatch");
  const batchModal = document.getElementById("batchModal");
  const btnCloseBatch = document.getElementById("btnCloseBatch");
  const csvFileInput = document.getElementById("csvFileInput");
  const btnDownloadSampleCSV = document.getElementById("btnDownloadSampleCSV");
  const btnPrevRecord = document.getElementById("btnPrevRecord");
  const btnNextRecord = document.getElementById("btnNextRecord");
  const btnExportAllZip = document.getElementById("btnExportAllZip");

  if (!btnOpenBatch) return;

  btnOpenBatch.addEventListener("click", () => {
    batchModal.classList.remove("hidden");
  });

  btnCloseBatch.addEventListener("click", () => {
    batchModal.classList.add("hidden");
  });

  btnDownloadSampleCSV.addEventListener("click", () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Name,RegNo,Branch,Mobile,BloodGroup,Batch\n" +
      "KODELA KIRAN KUMAR,23HT1A4353,CSE-AI,9908406687,O+ve,2023-2027\n" +
      "CHINTHA RAVINDRA BABU,23HT1A0501,CSE-AI&ML,9848133748,O+ve,2024-2028\n" +
      "SHAIK MOHAMMAD ARBAZ,23HT1A0412,ECE,9876543210,A+ve,2023-2027\n" +
      "BANDARU SNEHA,23HT1A1208,IT,9123456789,AB+ve,2025-2029\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "students_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  csvFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            state.batchList = results.data;
            state.batchIndex = 0;
            updateBatchUI();
            loadRecordIntoForm(state.batchList[0]);
            showNotification(`Imported ${results.data.length} students from CSV!`);
          } else {
            alert("No student records found in CSV file.");
          }
        }
      });
    }
  });

  btnPrevRecord.addEventListener("click", () => {
    if (state.batchList.length === 0) return;
    if (state.batchIndex > 0) {
      state.batchIndex--;
      updateBatchUI();
      loadRecordIntoForm(state.batchList[state.batchIndex]);
    }
  });

  btnNextRecord.addEventListener("click", () => {
    if (state.batchList.length === 0) return;
    if (state.batchIndex < state.batchList.length - 1) {
      state.batchIndex++;
      updateBatchUI();
      loadRecordIntoForm(state.batchList[state.batchIndex]);
    }
  });

  btnExportAllZip.addEventListener("click", async () => {
    if (state.batchList.length === 0) {
      alert("Please upload a CSV file first.");
      return;
    }

    const zip = new JSZip();
    const btn = btnExportAllZip;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-spin inline-block mr-2">⏳</span> Generating Cards...`;

    try {
      for (let i = 0; i < state.batchList.length; i++) {
        const item = state.batchList[i];
        loadRecordIntoForm(item);
        renderCard();
        
        await new Promise(r => setTimeout(r, 60));

        const dataUrl = canvas.toDataURL("image/png");
        const b64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        const fname = `${item.RegNo || `STUDENT_${i+1}`}_${(item.Name || "CARD").replace(/\s+/g, "_")}.png`;
        zip.file(fname, b64Data, { base64: true });
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "CIT_ID_Cards_Batch.zip");
      showNotification("Batch ZIP exported!");
    } catch (err) {
      console.error("Batch zip error:", err);
      alert("Failed to export ZIP.");
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
}

function updateBatchUI() {
  const counter = document.getElementById("batchRecordCounter");
  const total = state.batchList.length;
  if (total > 0) {
    counter.textContent = `Student ${state.batchIndex + 1} of ${total}`;
  } else {
    counter.textContent = "No CSV loaded";
  }
}

function loadRecordIntoForm(row) {
  state.name = (row.Name || "").toUpperCase();
  state.regNo = (row.RegNo || "").toUpperCase();
  state.branch = (row.Branch || "CSE-AI").toUpperCase();
  state.mobile = (row.Mobile || "").slice(0, 10);
  state.bloodGroup = row.BloodGroup || "O+ve";
  state.batch = row.Batch || "2023-2027";

  document.getElementById("studentName").value = state.name;
  document.getElementById("regNo").value = state.regNo;
  
  const branchSelect = document.getElementById("branchSelect");
  const branchCustom = document.getElementById("branchCustom");
  const validBranches = ["CSE-AI", "CSE", "CSE-AI&ML", "CSE-DS", "ECE", "EEE", "MECH", "CIVIL", "IT", "MCA", "MBA"];
  
  if (validBranches.includes(state.branch)) {
    branchSelect.value = state.branch;
    branchCustom.classList.add("hidden");
  } else {
    branchSelect.value = "CUSTOM";
    branchCustom.value = state.branch;
    branchCustom.classList.remove("hidden");
  }

  document.getElementById("mobileNo").value = state.mobile;
  document.getElementById("bloodGroup").value = state.bloodGroup;
  
  const batchSelectRec = document.getElementById("batchSelect");
  const batchCustomRec = document.getElementById("batchCustom");
  const validBatches = ["2023 - 2027", "2024 - 2028", "2022 - 2026", "2025 - 2029", "2026 - 2030"];
  if (batchSelectRec) {
    if (validBatches.includes(state.batch) || validBatches.includes(state.batch.replace(/(\d{4})-(\d{4})/, "$1 - $2"))) {
      batchSelectRec.value = state.batch.includes(" - ") ? state.batch : state.batch.replace(/(\d{4})-(\d{4})/, "$1 - $2");
      if (batchCustomRec) batchCustomRec.classList.add("hidden");
    } else if (!state.batch) {
      batchSelectRec.value = "NONE";
      if (batchCustomRec) batchCustomRec.classList.add("hidden");
    } else {
      batchSelectRec.value = "CUSTOM";
      if (batchCustomRec) {
        batchCustomRec.value = state.batch;
        batchCustomRec.classList.remove("hidden");
      }
    }
  }

  renderCard();
}

/**
 * Responsive Mobile Tabs & Viewport Navigation
 * Seamless single-page experience across mobile, tablet, and desktop
 */
function bindMobileTabs() {
  const tabBtnForm = document.getElementById("tabBtnForm");
  const tabBtnPreview = document.getElementById("tabBtnPreview");
  const controlsPanel = document.getElementById("controlsPanel");
  const previewSection = document.getElementById("previewSection");
  const mobileFloatingBar = document.getElementById("mobileFloatingBar");
  const btnFloatingPreview = document.getElementById("btnFloatingPreview");
  const btnBackToForm = document.getElementById("btnBackToForm");

  if (!tabBtnForm || !tabBtnPreview || !controlsPanel || !previewSection) return;

  function setMobileView(view) {
    if (view === "preview") {
      tabBtnPreview.classList.add("bg-blue-900", "text-white", "shadow-sm");
      tabBtnPreview.classList.remove("text-slate-600");
      tabBtnForm.classList.remove("bg-blue-900", "text-white", "shadow-sm");
      tabBtnForm.classList.add("text-slate-600");

      if (window.innerWidth < 1024) {
        controlsPanel.classList.add("hidden");
        previewSection.classList.remove("hidden");
        if (mobileFloatingBar) mobileFloatingBar.classList.add("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      renderCard();
    } else {
      tabBtnForm.classList.add("bg-blue-900", "text-white", "shadow-sm");
      tabBtnForm.classList.remove("text-slate-600");
      tabBtnPreview.classList.remove("bg-blue-900", "text-white", "shadow-sm");
      tabBtnPreview.classList.add("text-slate-600");

      if (window.innerWidth < 1024) {
        controlsPanel.classList.remove("hidden");
        previewSection.classList.add("hidden");
        if (mobileFloatingBar) mobileFloatingBar.classList.remove("hidden");
      }
    }
  }

  tabBtnForm.addEventListener("click", () => setMobileView("form"));
  tabBtnPreview.addEventListener("click", () => setMobileView("preview"));
  if (btnFloatingPreview) {
    btnFloatingPreview.addEventListener("click", () => setMobileView("preview"));
  }
  if (btnBackToForm) {
    btnBackToForm.addEventListener("click", () => setMobileView("form"));
  }

  // Handle responsive resize dynamically
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) {
      controlsPanel.classList.remove("hidden");
      previewSection.classList.remove("hidden");
      if (mobileFloatingBar) mobileFloatingBar.classList.add("hidden");
    } else {
      const isPreview = tabBtnPreview.classList.contains("bg-blue-900");
      setMobileView(isPreview ? "preview" : "form");
    }
  });

  // Initial setup for current screen size
  if (window.innerWidth < 1024) {
    setMobileView("form");
  }
}
