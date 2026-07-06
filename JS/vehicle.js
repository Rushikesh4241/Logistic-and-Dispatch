/* =========================================================
   vehicle.js  –  Find / New sliding toggle + full constraints
   ========================================================= */

// ── DOM refs ────────────────────────────────────────────────
const vehicleId     = document.getElementById("vehicle-id");
const vehicleNumber = document.getElementById("vehicle-number");
const vehicleType   = document.getElementById("vehicle-type");
const capacity      = document.getElementById("capacity");
const saveBtn       = document.getElementById("save-btn");
const updateBtn     = document.getElementById("update-btn");
const previousBtn   = document.getElementById("previous-btn");
const nextBtn       = document.getElementById("next-btn");
const exitBtn       = document.getElementById("exit-btn");

const modeFindRadio = document.getElementById("mode-find");
const modeNewRadio  = document.getElementById("mode-new");
const modeToggle    = document.getElementById("mode-toggle");

// Inline feedback element (small red alert under ID field)
const idAlert = document.getElementById("id-alert");

const apiBase = "http://127.0.0.1:3000";

// ── State ───────────────────────────────────────────────────
let activeRecordId   = null;   // ID of the record currently loaded
let lastSavedState   = null;   // snapshot of fields after last save/load
let isDirty          = false;  // true when form differs from lastSavedState
let currentMode      = "find"; // "find" | "new"
let newModeSessionId = null;   // ID reserved when entering New mode
let isNavigating     = false;  // prevents double guardNavigation popup race

// ── Utilities ───────────────────────────────────────────────
function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function getCurrentFormState() {
  return {
    vehicleNumber: vehicleNumber.value.trim(),
    vehicleType  : vehicleType.value.trim(),
    capacity     : capacity.value.trim(),
  };
}

function hasUnsavedChanges() {
  if (!lastSavedState) return false;
  return !deepEqual(getCurrentFormState(), lastSavedState);
}

function markClean(state) {
  lastSavedState = state || getCurrentFormState();
  isDirty = false;
}

// General auto-dismiss alert
function showAlert(type, message) {
  return Swal.fire({
    position         : "center",
    icon             : type,
    title            : message,
    showConfirmButton: false,
    timer            : 1800,
  });
}

// ── Inline ID-not-found alert (red box under ID field) ──────
function showIdAlert(msg) {
  if (!idAlert) return;
  idAlert.textContent   = msg;
  idAlert.style.display = "block";
}

function hideIdAlert() {
  if (!idAlert) return;
  idAlert.textContent   = "";
  idAlert.style.display = "none";
}

// ── Form-mode helpers ────────────────────────────────────────
function setFormMode(isUpdate) {
  if (isUpdate) {
    saveBtn.style.display   = "none";
    updateBtn.style.display = "inline-flex";
  } else {
    saveBtn.style.display   = "inline-flex";
    updateBtn.style.display = "none";
  }
}

function clearFields() {
  vehicleNumber.value = "";
  vehicleType.value   = "";
  capacity.value      = "";
}

// ── Slider sizing ────────────────────────────────────────────
function calibrateSlider() {
  const findLabel = modeToggle.querySelector("label[for='mode-find']");
  const newLabel  = modeToggle.querySelector("label[for='mode-new']");
  const slider    = modeToggle.querySelector(".slider");
  if (!findLabel || !newLabel || !slider) return;

  requestAnimationFrame(() => {
    const fw = findLabel.offsetWidth;
    const nw = newLabel.offsetWidth;
    modeToggle.style.setProperty("--slider-shift", fw + "px");
    slider.style.width = (currentMode === "find" ? fw : nw) + "px";
  });
}

// ── Switch to Find mode (UI only) ───────────────────────────
function activateFindUI() {
  currentMode = "find";
  modeFindRadio.checked = true;
  vehicleId.removeAttribute("placeholder"); // No placeholder in Find mode
  vehicleId.readOnly = false;
  vehicleId.classList.remove("id-locked");
  calibrateSlider();
}

// ── Switch to New mode (UI only) ────────────────────────────
function activateNewUI() {
  currentMode = "new";
  modeNewRadio.checked = true;
  vehicleId.placeholder = "Auto-assigned";
  vehicleId.readOnly    = true;
  vehicleId.classList.add("id-locked");
  calibrateSlider();
}

// ── Apply Find mode actions ─────────────────────────────────
async function doFind() {
  const id = vehicleId.value.trim();
  if (!id) {
    showAlert("info", "Enter a Vehicle ID to search.");
    return;
  }
  const record = await fetchVehicleById(id);
  if (!record) {
    clearFields();
    activeRecordId = null;
    setFormMode(false);
    // Show small inline red alert below the ID field — no popup
    showIdAlert(` Vehicle ID "${id}" does not exist.`);
    return;
  }
  hideIdAlert();
  populateForm(record);
}

// ── Apply New mode actions ───────────────────────────────────
async function doNew() {
  const nextId = await fetchNextVehicleId();
  if (!nextId) { showAlert("error", "Unable to reserve a new Vehicle ID."); return; }

  vehicleId.value  = nextId;
  newModeSessionId = String(nextId);

  clearFields();
  activeRecordId = null;
  setFormMode(false);
  markClean(getCurrentFormState());
  vehicleNumber.focus();
}

// ── Validation ──────────────────────────────────────────────
function validateVehicleForm() {
  const number   = vehicleNumber.value.trim();
  const type     = vehicleType.value.trim();
  const cap      = capacity.value.trim();
  const numRegex = /^[A-Z0-9 \-]{3,15}$/i;

  if (!number || !type) {
    showAlert("error", "Please fill required fields: Vehicle Number and Type.");
    return false;
  }
  if (!numRegex.test(number)) {
    showAlert("error", "Vehicle Number must be 3–15 characters (letters, numbers, hyphen).");
    return false;
  }
  if (cap && (isNaN(cap) || Number(cap) <= 0)) {
    showAlert("error", "Capacity must be a valid positive number if provided.");
    return false;
  }
  return true;
}

// ── API helpers ──────────────────────────────────────────────
async function fetchVehicleById(id) {
  try {
    const res = await fetch(`${apiBase}/vehicle/${id}`);
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

async function fetchNextVehicleId() {
  try {
    const res = await fetch(`${apiBase}/vehicle/next-id`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.nextId;
  } catch { return null; }
}

async function loadVehicleTypes() {
  vehicleType.disabled = true;
  vehicleType.innerHTML = "<option value=''>Loading vehicle types...</option>";
  try {
    const res = await fetch(`${apiBase}/vehicle/types`);
    if (!res.ok) throw new Error();
    const types = await res.json();
    vehicleType.innerHTML = "<option value=''>Select Vehicle Type</option>";
    if (!Array.isArray(types) || types.length === 0) {
      vehicleType.innerHTML = "<option value=''>No vehicle types configured</option>";
      return;
    }
    types.forEach(t => {
      const opt = document.createElement("option");
      opt.value = opt.textContent = t;
      vehicleType.appendChild(opt);
    });
  } catch {
    vehicleType.innerHTML = "<option value=''>Unable to load vehicle types</option>";
  } finally {
    vehicleType.disabled = false;
  }
}

function populateForm(record) {
  activeRecordId      = record.vehicleId;
  vehicleId.value     = record.vehicleId;
  vehicleNumber.value = record.vehicleNumber || "";
  vehicleType.value   = record.vehicleType   || "";
  capacity.value      = record.capacity      || "";
  setFormMode(true);
  markClean();
  hideIdAlert();
}

// ── Unsaved-changes guard ────────────────────────────────────
async function guardNavigation(callback) {
  if (isNavigating) return;
  if (!isDirty) { await callback(); return; }

  isNavigating = true;
  try {
    const result = await Swal.fire({
      title            : "Unsaved Changes",
      text             : "You have unsaved changes. What would you like to do?",
      icon             : "warning",
      showCancelButton : true,
      showDenyButton   : true,
      confirmButtonText: activeRecordId ? "Update & Continue" : "Save & Continue",
      denyButtonText   : "Discard Changes",
      cancelButtonText : "Stay Here",
      reverseButtons   : false,
    });

    if (result.isConfirmed) {
      if (activeRecordId) {
        const ok = await performUpdate(true); // silent = skip confirm popup inside nav guard
        if (!ok) return;
      } else {
        const ok = await performSave();
        if (!ok) return;
      }
      await callback();
    } else if (result.isDenied) {
      markClean();
      isDirty = false;
      await callback();
    }
    // else cancelled – stay
  } finally {
    isNavigating = false;
  }
}

// ── Save logic (returns true on success) ─────────────────────
async function performSave() {
  if (!validateVehicleForm()) return false;

  const payload = {
    vehicleNumber: vehicleNumber.value.trim(),
    vehicleType  : vehicleType.value.trim(),
    capacity     : capacity.value.trim(),
  };
  if (vehicleId.value.trim()) payload.vehicleId = Number(vehicleId.value.trim());

  try {
    const res  = await fetch(`${apiBase}/vehicle`, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { showAlert("error", data.message || "Unable to save vehicle."); return false; }

    const assignedId = data.vehicleId || vehicleId.value.trim();

    await showAlert("success", `Vehicle ID ${assignedId} saved! Ready for next entry.`);
    await doNew(); // reserve next ID and clear fields
    return true;
  } catch {
    showAlert("error", "Unable to save vehicle.");
    return false;
  }
}

// ── Update logic (returns true on success) ───────────────────
// silent = true skips the "Confirm Update?" popup (used from guardNavigation)
async function performUpdate(silent = false) {
  const id = vehicleId.value.trim();
  if (!id) { showAlert("error", "Enter a valid Vehicle ID to update."); return false; }
  if (!validateVehicleForm()) return false;

  const current = getCurrentFormState();

  // No actual changes – inform user and treat as success
  if (lastSavedState && deepEqual(current, lastSavedState)) {
    showAlert("info", "No changes detected. Nothing was updated.");
    markClean(current);
    return true;
  }

  // ── Confirmation popup before updating ──────────────────────
  if (!silent) {
    const confirm = await Swal.fire({
      title             : "Confirm Update",
      html              : `Are you sure you want to update <b>Vehicle ID ${id}</b>?`,
      icon              : "question",
      showCancelButton  : true,
      confirmButtonText : "✔ Yes, Update",
      cancelButtonText  : "✖ Cancel",
      confirmButtonColor: "#d97706",
      cancelButtonColor : "#6b7280",
    });
    if (!confirm.isConfirmed) return false;
  }

  try {
    const res  = await fetch(`${apiBase}/vehicle/${id}`, {
      method : "PUT",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify(current),
    });
    const data = await res.json();
    if (!res.ok) { showAlert("error", data.message || "Unable to update vehicle."); return false; }

    activeRecordId = Number(id);
    setFormMode(true);

    // Success popup after update
    await Swal.fire({
      position         : "center",
      icon             : "success",
      title            : "Updated!",
      text             : data.message || `Vehicle ID ${id} updated successfully.`,
      showConfirmButton: false,
      timer            : 2000,
    });

    markClean(current);
    return true;
  } catch {
    showAlert("error", "Unable to update vehicle.");
    return false;
  }
}

// ── Track field changes ──────────────────────────────────────
[vehicleNumber, vehicleType, capacity].forEach(el => {
  el.addEventListener("input", () => {
    isDirty = hasUnsavedChanges();
  });
});

// ── Mode toggle: Find ↔ New ──────────────────────────────────
modeFindRadio.addEventListener("change", async () => {
  if (!modeFindRadio.checked) return;
  await guardNavigation(async () => {
    activateFindUI();
    clearFields();
    vehicleId.value  = "";
    activeRecordId   = null;
    newModeSessionId = null;
    setFormMode(false);
    markClean(getCurrentFormState());
    hideIdAlert();
  });
  calibrateSlider();
});

modeNewRadio.addEventListener("change", async () => {
  if (!modeNewRadio.checked) return;
  await guardNavigation(async () => {
    activateNewUI();
    vehicleId.value  = "";
    newModeSessionId = null;
    hideIdAlert();
    await doNew();
  });
  calibrateSlider();
});

// ── Vehicle ID field: Enter key ──────────────────────────────
let findDebounceTimer = null;

vehicleId.addEventListener("keydown", async (e) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  if (currentMode === "find") {
    clearTimeout(findDebounceTimer);
    hideIdAlert();
    await guardNavigation(doFind);
  } else {
    vehicleNumber.focus(); // New mode: jump to first data field
  }
});

// ── Vehicle ID: auto-search while typing (Find mode) ────────
vehicleId.addEventListener("input", () => {
  if (currentMode !== "find") return;
  const id = vehicleId.value.trim();
  clearTimeout(findDebounceTimer);
  hideIdAlert(); // clear alert while user is typing
  if (!id) {
    clearFields();
    activeRecordId = null;
    setFormMode(false);
    markClean(getCurrentFormState());
    return;
  }
  findDebounceTimer = setTimeout(async () => {
    if (activeRecordId && String(activeRecordId) === id) return;
    await guardNavigation(doFind);
  }, 400);
});

// ── Vehicle ID: blur triggers search (Find mode) ─────────────
vehicleId.addEventListener("blur", async () => {
  if (currentMode !== "find") return;
  if (isNavigating) return;
  const id = vehicleId.value.trim();
  if (!id) return;
  if (activeRecordId && String(activeRecordId) === id) return;
  clearTimeout(findDebounceTimer);
  await guardNavigation(doFind);
});

// ── Save button ──────────────────────────────────────────────
saveBtn.addEventListener("click", async () => {
  await performSave();
});

// ── Update button (with confirm popup) ──────────────────────
updateBtn.addEventListener("click", async () => {
  await performUpdate(false); // false = show confirmation popup
});

// ── Previous button ──────────────────────────────────────────
previousBtn.addEventListener("click", async () => {
  await guardNavigation(async () => {
    const idInput = vehicleId.value.trim();
    const startId = idInput || (activeRecordId ? String(activeRecordId) : null);

    if (!startId) {
      await Swal.fire({
        icon             : "info",
        title            : "No Record Loaded",
        text             : "Please load a vehicle record first before navigating.",
        confirmButtonText: "OK",
        confirmButtonColor: "#4f46e5",
      });
      return;
    }

    try {
      const res = await fetch(`${apiBase}/vehicle/previous/${startId}`);
      if (!res.ok) {
        // End of list – popup message
        await Swal.fire({
          icon              : "warning",
          title             : "Beginning of List",
          html              : `<p>You are already at the <b>first record</b>.<br>There is no previous data to show.</p>`,
          confirmButtonText : "OK",
          confirmButtonColor: "#4f46e5",
          footer            : `<small>Switch to <b>New</b> mode to add more records.</small>`,
        });
        return;
      }
      populateForm(await res.json());
    } catch {
      showAlert("error", "Unable to load previous vehicle.");
    }
  });
});

// ── Next button ──────────────────────────────────────────────
nextBtn.addEventListener("click", async () => {
  await guardNavigation(async () => {
    const id = vehicleId.value.trim() || "0";

    try {
      const res = await fetch(`${apiBase}/vehicle/next/${id}`);
      if (!res.ok) {
        // End of list – popup message
        await Swal.fire({
          icon              : "warning",
          title             : "End of List",
          html              : `<p>You have reached the <b>last record</b>.<br>No more data to show.</p>
                               <p style="margin-top:8px;">Would you like to add a new vehicle?</p>`,
          showCancelButton  : true,
          confirmButtonText : "Switch to New Mode",
          cancelButtonText  : "Stay Here",
          confirmButtonColor: "#16a34a",
          cancelButtonColor : "#6b7280",
        }).then(async (result) => {
          if (result.isConfirmed) {
            // Automatically switch to New mode
            modeNewRadio.checked = true;
            activateNewUI();
            vehicleId.value  = "";
            newModeSessionId = null;
            hideIdAlert();
            await doNew();
            calibrateSlider();
          }
        });
        return;
      }
      populateForm(await res.json());
    } catch {
      showAlert("error", "Unable to load next vehicle.");
    }
  });
});

// ── Exit button ──────────────────────────────────────────────
if (exitBtn) {
  exitBtn.addEventListener("click", async (e) => {
    if (!isDirty) return;
    e.preventDefault();
    const res = await Swal.fire({
      title            : "Unsaved Changes",
      text             : "You have unsaved changes. Leave without saving?",
      icon             : "warning",
      showCancelButton : true,
      confirmButtonText: "Leave",
      cancelButtonText : "Stay",
    });
    if (res.isConfirmed) {
      window.location = exitBtn.href;
    }
  });
}

// ── Reset form ───────────────────────────────────────────────
function resetForm() {
  vehicleId.value = "";
  clearFields();
  activeRecordId  = null;
  isDirty         = false;
  setFormMode(false);
  lastSavedState  = getCurrentFormState();
  hideIdAlert();
}

// ── Init ─────────────────────────────────────────────────────
(async function init() {
  await loadVehicleTypes();
  resetForm();
  activateFindUI();
  setTimeout(calibrateSlider, 50);
})();