/* =========================================================
   dispatchOrder.js  –  Find / New sliding toggle + full constraints
   Mirrors vehicle.js architecture exactly.
   ========================================================= */

// ── DOM refs ────────────────────────────────────────────────
const orderId      = document.getElementById("order-id");
const customerId   = document.getElementById("customer-id");
const dispatchDate = document.getElementById("dispatch-date");
const source       = document.getElementById("source");
const destination  = document.getElementById("destination");
const status       = document.getElementById("status");

const saveBtn     = document.getElementById("save-btn");
const updateBtn   = document.getElementById("update-btn");
const previousBtn = document.getElementById("previous-btn");
const nextBtn     = document.getElementById("next-btn");
const exitBtn     = document.getElementById("exit-btn");

const modeFindRadio = document.getElementById("mode-find");
const modeNewRadio  = document.getElementById("mode-new");
const modeToggle    = document.getElementById("mode-toggle");

// Inline feedback element (small red alert under ID field)
const idAlert = document.getElementById("id-alert");

const apiBase = "http://127.0.0.1:3000/dispatch-order";

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
    customerId   : customerId.value.trim(),
    dispatchDate : dispatchDate.value.trim(),
    source       : source.value.trim(),
    destination  : destination.value.trim(),
    status       : status.value.trim(),
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
  customerId.value   = "";
  dispatchDate.value = "";
  source.value       = "";
  destination.value  = "";
  status.value       = "Pending";
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
  orderId.removeAttribute("placeholder");
  orderId.readOnly = false;
  orderId.classList.remove("id-locked");
  calibrateSlider();
}

// ── Switch to New mode (UI only) ────────────────────────────
function activateNewUI() {
  currentMode = "new";
  modeNewRadio.checked = true;
  orderId.placeholder = "Auto-assigned";
  orderId.readOnly    = true;
  orderId.classList.add("id-locked");
  calibrateSlider();
}

// ── Apply Find mode actions ─────────────────────────────────
async function doFind() {
  const id = orderId.value.trim();
  if (!id) {
    showAlert("info", "Enter an Order ID to search.");
    return;
  }
  const record = await fetchOrderById(id);
  if (!record) {
    clearFields();
    activeRecordId = null;
    setFormMode(false);
    showIdAlert(` Order ID "${id}" does not exist.`);
    return;
  }
  hideIdAlert();
  populateForm(record);
}

// ── Apply New mode actions ───────────────────────────────────
async function doNew() {
  const nextId = await fetchNextOrderId();
  if (!nextId) { showAlert("error", "Unable to reserve a new Order ID."); return; }

  orderId.value    = nextId;
  newModeSessionId = String(nextId);

  clearFields();

  // Set today's date as default for Dispatch Date
  const today = new Date();
  const yyyy  = today.getFullYear();
  const mm    = String(today.getMonth() + 1).padStart(2, "0");
  const dd    = String(today.getDate()).padStart(2, "0");
  dispatchDate.value = `${yyyy}-${mm}-${dd}`;

  activeRecordId = null;
  setFormMode(false);
  markClean(getCurrentFormState());
  customerId.focus();
}

// ── Validation ──────────────────────────────────────────────
function validateDispatchForm() {
  const cid  = customerId.value.trim();
  const date = dispatchDate.value.trim();
  const src  = source.value.trim();
  const dst  = destination.value.trim();

  // Required field checks
  if (!cid) {
    showAlert("error", "Please select a Customer.");
    customerId.focus();
    return false;
  }

  if (!date) {
    showAlert("error", "Dispatch Date is required.");
    dispatchDate.focus();
    return false;
  }

  if (!src) {
    showAlert("error", "Source location is required.");
    source.focus();
    return false;
  }

  if (!dst) {
    showAlert("error", "Destination is required.");
    destination.focus();
    return false;
  }

  // Length constraint — matches DB VARCHAR(255)
  if (src.length > 255) {
    showAlert("error", "Source must not exceed 255 characters.");
    source.focus();
    return false;
  }

  if (dst.length > 255) {
    showAlert("error", "Destination must not exceed 255 characters.");
    destination.focus();
    return false;
  }

  // Source and Destination must not be the same
  if (src.toLowerCase() === dst.toLowerCase()) {
    showAlert("error", "Source and Destination cannot be the same location.");
    destination.focus();
    return false;
  }

  // Date — must not be in the past (for new records)
  if (!activeRecordId) {
    const selectedDate = new Date(date);
    const today        = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      showAlert("warning", "Dispatch Date cannot be in the past.");
      dispatchDate.focus();
      return false;
    }
  }

  // Status constraint — must match allowed values
  const allowedStatuses = ["Pending", "In Progress", "Completed", "Cancelled"];
  if (!allowedStatuses.includes(status.value)) {
    showAlert("error", "Invalid status value selected.");
    return false;
  }

  // Business rule: Cannot set Completed/Cancelled if source is empty
  if ((status.value === "Completed" || status.value === "Cancelled") && !src) {
    showAlert("warning", `Status "${status.value}" requires a valid Source location.`);
    return false;
  }

  return true;
}

// ── API helpers ──────────────────────────────────────────────
async function fetchOrderById(id) {
  try {
    const res = await fetch(`${apiBase}/${id}`);
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

async function fetchNextOrderId() {
  try {
    const res = await fetch(`${apiBase}/next-id`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.nextId;
  } catch { return null; }
}

async function loadCustomers() {
  customerId.disabled = true;
  customerId.innerHTML = "<option value=''>Loading customers...</option>";
  try {
    const res = await fetch(`${apiBase}/customers`);
    if (!res.ok) throw new Error();
    const html = await res.text();
    customerId.innerHTML = html;
  } catch {
    customerId.innerHTML = "<option value=''>Unable to load customers</option>";
    Swal.fire({
      icon : "warning",
      title: "Customer Load Failed",
      text : "Could not retrieve customer list from server. Please check your connection.",
      confirmButtonColor: "#5b2e8a",
    });
  } finally {
    customerId.disabled = false;
  }
}

function populateForm(record) {
  activeRecordId     = record.orderId;
  orderId.value      = record.orderId;
  customerId.value   = record.customerId   || "";
  dispatchDate.value = record.dispatchDate
    ? String(record.dispatchDate).split("T")[0]
    : "";
  source.value      = record.source      || "";
  destination.value = record.destination || "";
  status.value      = record.status      || "Pending";
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
        const ok = await performUpdate(true);
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
  if (!validateDispatchForm()) return false;

  const payload = {
    customerId  : customerId.value.trim(),
    dispatchDate: dispatchDate.value.trim() || null,
    source      : source.value.trim(),
    destination : destination.value.trim(),
    status      : status.value.trim(),
  };

  try {
    const res  = await fetch(`${apiBase}`, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      showAlert("error", data.message || "Unable to save dispatch order.");
      return false;
    }

    const assignedId = data.orderId || orderId.value.trim();

    await showAlert("success", `Order ID ${assignedId} saved! Ready for next entry.`);
    await doNew(); // reserve next ID and clear fields
    return true;
  } catch {
    showAlert("error", "Unable to save dispatch order. Check server connection.");
    return false;
  }
}

// ── Update logic (returns true on success) ───────────────────
// silent = true skips the "Confirm Update?" popup (used from guardNavigation)
async function performUpdate(silent = false) {
  const id = orderId.value.trim();
  if (!id) { showAlert("error", "Enter a valid Order ID to update."); return false; }
  if (!validateDispatchForm()) return false;

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
      html              : `Are you sure you want to update <b>Order ID ${id}</b>?`,
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
    const res  = await fetch(`${apiBase}/${id}`, {
      method : "PUT",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify(current),
    });
    const data = await res.json();
    if (!res.ok) { showAlert("error", data.message || "Unable to update dispatch order."); return false; }

    activeRecordId = Number(id);
    setFormMode(true);

    // Success popup after update
    await Swal.fire({
      position         : "center",
      icon             : "success",
      title            : "Updated!",
      text             : data.message || `Order ID ${id} updated successfully.`,
      showConfirmButton: false,
      timer            : 2000,
    });

    markClean(current);
    return true;
  } catch {
    showAlert("error", "Unable to update dispatch order.");
    return false;
  }
}

// ── Track field changes ──────────────────────────────────────
[customerId, dispatchDate, source, destination, status].forEach(el => {
  el.addEventListener("input", () => {
    isDirty = hasUnsavedChanges();
  });
  el.addEventListener("change", () => {
    isDirty = hasUnsavedChanges();
  });
});

// ── Mode toggle: Find ↔ New ──────────────────────────────────
modeFindRadio.addEventListener("change", async () => {
  if (!modeFindRadio.checked) return;
  await guardNavigation(async () => {
    activateFindUI();
    clearFields();
    orderId.value    = "";
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
    orderId.value    = "";
    newModeSessionId = null;
    hideIdAlert();
    await doNew();
  });
  calibrateSlider();
});

// ── Order ID field: Enter key ────────────────────────────────
let findDebounceTimer = null;

orderId.addEventListener("keydown", async (e) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  if (currentMode === "find") {
    clearTimeout(findDebounceTimer);
    hideIdAlert();
    await guardNavigation(doFind);
  } else {
    customerId.focus(); // New mode: jump to first data field
  }
});

// ── Order ID: auto-search while typing (Find mode) ──────────
orderId.addEventListener("input", () => {
  if (currentMode !== "find") return;
  const id = orderId.value.trim();
  clearTimeout(findDebounceTimer);
  hideIdAlert();
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

// ── Order ID: blur triggers search (Find mode) ──────────────
orderId.addEventListener("blur", async () => {
  if (currentMode !== "find") return;
  if (isNavigating) return;
  const id = orderId.value.trim();
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
    const idInput = orderId.value.trim();
    const startId = idInput || (activeRecordId ? String(activeRecordId) : null);

    if (!startId) {
      await Swal.fire({
        icon             : "info",
        title            : "No Record Loaded",
        text             : "Please load a dispatch order first before navigating.",
        confirmButtonText: "OK",
        confirmButtonColor: "#4f46e5",
      });
      return;
    }

    try {
      const res = await fetch(`${apiBase}/previous/${startId}`);
      if (!res.ok) {
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
      showAlert("error", "Unable to load previous dispatch order.");
    }
  });
});

// ── Next button ──────────────────────────────────────────────
nextBtn.addEventListener("click", async () => {
  await guardNavigation(async () => {
    const id = orderId.value.trim() || "0";

    try {
      const res = await fetch(`${apiBase}/next/${id}`);
      if (!res.ok) {
        await Swal.fire({
          icon              : "warning",
          title             : "End of List",
          html              : `<p>You have reached the <b>last record</b>.<br>No more data to show.</p>
                               <p style="margin-top:8px;">Would you like to add a new dispatch order?</p>`,
          showCancelButton  : true,
          confirmButtonText : "Switch to New Mode",
          cancelButtonText  : "Stay Here",
          confirmButtonColor: "#16a34a",
          cancelButtonColor : "#6b7280",
        }).then(async (result) => {
          if (result.isConfirmed) {
            modeNewRadio.checked = true;
            activateNewUI();
            orderId.value    = "";
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
      showAlert("error", "Unable to load next dispatch order.");
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
  orderId.value = "";
  clearFields();
  activeRecordId = null;
  isDirty        = false;
  setFormMode(false);
  lastSavedState = getCurrentFormState();
  hideIdAlert();
}

// ── Init ─────────────────────────────────────────────────────
(async function init() {
  await loadCustomers();
  resetForm();
  activateFindUI();
  setTimeout(calibrateSlider, 50);
})();
