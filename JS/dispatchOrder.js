/* =========================================================
   dispatchOrder.js  –  Find / New sliding toggle
   • Status dropdown loaded from LOV table (DispatchOrderStatus)
   • All popups/alerts reviewed and placed correctly
   • 2-column no-scroll layout support
   ========================================================= */

// ── DOM refs ──────────────────────────────────────────────────
const orderId           = document.getElementById("order-id");
const customerId        = document.getElementById("customer-id");         // hidden value
const customerIdDisplay = document.getElementById("customer-id-display"); // visible LOV input
const dispatchDate      = document.getElementById("dispatch-date");
const source            = document.getElementById("source");
const destination       = document.getElementById("destination");
const status            = document.getElementById("status");

const saveBtn     = document.getElementById("save-btn");
const updateBtn   = document.getElementById("update-btn");
const previousBtn = document.getElementById("previous-btn");
const nextBtn     = document.getElementById("next-btn");
const exitBtn     = document.getElementById("exit-btn");

const modeFindRadio = document.getElementById("mode-find");
const modeNewRadio  = document.getElementById("mode-new");
const modeToggle    = document.getElementById("mode-toggle");
const idAlert       = document.getElementById("id-alert");

const apiBase = "http://127.0.0.1:3000/dispatch-order";

// ── State ─────────────────────────────────────────────────────
let activeRecordId   = null;
let lastSavedState   = null;
let isDirty          = false;
let currentMode      = "find";
let newModeSessionId = null;
let isNavigating     = false;
let findDebounceTimer = null;

// ── Utility: deep equality ─────────────────────────────────────
function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function getCurrentFormState() {
  return {
    customerId  : customerId.value.trim(),
    dispatchDate: dispatchDate.value.trim(),
    source      : source.value.trim(),
    destination : destination.value.trim(),
    status      : status.value.trim(),
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

// ══════════════════════════════════════════════════════════════
//  POPUP & ALERT GUIDE
//  ─────────────────────────────────────────────────────────────
//  showAlert(type, msg)       → auto-dismiss toast (1.8 s)
//     WHEN: Save success, Update success,
//           "No changes detected", validation error
//
//  showIdAlert(msg)           → small inline red box under Order ID
//     WHEN: Find mode — typed ID does not exist in DB
//
//  Swal.fire (confirmButton)  → blocking popup requiring user action
//     WHEN: Confirm before Update, Unsaved-changes guard,
//           Beginning/End of list, Exit with dirty form,
//           No record loaded when navigating
// ══════════════════════════════════════════════════════════════

// Auto-dismiss SweetAlert2 toast
function showAlert(type, message) {
  return Swal.fire({
    position         : "center",
    icon             : type,
    title            : message,
    showConfirmButton: false,
    timer            : 1800,
  });
}

// Inline red alert under Order ID (Find mode — ID not found)
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

// ── Form-mode: show Save or Update button ─────────────────────
function setFormMode(isUpdate) {
  saveBtn.style.display   = isUpdate ? "none"        : "inline-flex";
  updateBtn.style.display = isUpdate ? "inline-flex" : "none";
}

function clearFields() {
  customerId.value        = "";
  customerIdDisplay.value = "";
  dispatchDate.value      = "";
  source.value            = "";
  destination.value       = "";
  // Keep first LOV option (default "Pending") if loaded
  if (status.options.length > 0) status.selectedIndex = 0;
}

// ── Slider calibration ────────────────────────────────────────
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

function activateFindUI() {
  currentMode = "find";
  modeFindRadio.checked = true;
  orderId.removeAttribute("placeholder");
  orderId.readOnly = false;
  orderId.classList.remove("id-locked");
  // Show Next button in Find mode
  nextBtn.style.display = "inline-flex";
  calibrateSlider();
}

function activateNewUI() {
  currentMode = "new";
  modeNewRadio.checked = true;
  orderId.placeholder = "Auto-assigned";
  orderId.readOnly    = true;
  orderId.classList.add("id-locked");
  // Hide Next button in New mode
  nextBtn.style.display = "none";
  calibrateSlider();
}

// ── Find mode: fetch & populate ───────────────────────────────
async function doFind() {
  const id = orderId.value.trim();
  if (!id) {
    // POPUP: user pressed Enter without typing an ID
    showAlert("info", "Enter an Order ID to search.");
    return;
  }
  const record = await fetchOrderById(id);
  if (!record) {
    clearFields();
    activeRecordId = null;
    setFormMode(false);
    // INLINE ALERT (not popup): ID not found in DB
    showIdAlert(`⚠ Order ID "${id}" does not exist.`);
    return;
  }
  hideIdAlert();
  populateForm(record);
}

// ── New mode: reserve next ID, set today's date ───────────────
async function doNew() {
  const nextId = await fetchNextOrderId();
  if (!nextId) {
    // POPUP: server unable to generate next ID (connection/DB error)
    showAlert("error", "Unable to reserve a new Order ID.");
    return;
  }
  orderId.value    = nextId;
  newModeSessionId = String(nextId);

  clearFields();

  // Default Dispatch Date = today
  const today = new Date();
  dispatchDate.value = today.toISOString().split("T")[0];

  activeRecordId = null;
  setFormMode(false);
  markClean(getCurrentFormState());
  customerId.focus();
}

// ══════════════════════════════════════════════════════════════
//  VALIDATION  —  returns false and shows alert on first error
//  POPUP used for every validation failure (user must acknowledge)
// ══════════════════════════════════════════════════════════════
function validateDispatchForm() {
  const cid  = customerId.value.trim();
  const date = dispatchDate.value.trim();
  const src  = source.value.trim();
  const dst  = destination.value.trim();
  const st   = status.value.trim();

  // ── Required: Customer ─────────────────────────────────────
  if (!cid) {
    Swal.fire({
      icon : "error", title: "Customer Required",
      text : "Please select a Customer before saving.",
      confirmButtonColor: "#5b2e8a",
    });
    customerId.focus();
    return false;
  }

  // ── Required: Dispatch Date ────────────────────────────────
  if (!date) {
    Swal.fire({
      icon : "error", title: "Dispatch Date Required",
      text : "Please pick a Dispatch Date.",
      confirmButtonColor: "#5b2e8a",
    });
    dispatchDate.focus();
    return false;
  }

  // ── Date must not be in the past (only for NEW records) ────
  if (!activeRecordId) {
    const selected = new Date(date);
    const today    = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected < today) {
      Swal.fire({
        icon : "warning", title: "Invalid Date",
        text : "Dispatch Date cannot be in the past for a new order.",
        confirmButtonColor: "#d97706",
      });
      dispatchDate.focus();
      return false;
    }
  }

  // ── Required: Source ───────────────────────────────────────
  if (!src) {
    Swal.fire({
      icon : "error", title: "Source Required",
      text : "Please enter the pickup / source location.",
      confirmButtonColor: "#5b2e8a",
    });
    source.focus();
    return false;
  }

  // ── Required: Destination ──────────────────────────────────
  if (!dst) {
    Swal.fire({
      icon : "error", title: "Destination Required",
      text : "Please enter the delivery destination.",
      confirmButtonColor: "#5b2e8a",
    });
    destination.focus();
    return false;
  }

  // ── Source ≠ Destination ───────────────────────────────────
  if (src.toLowerCase() === dst.toLowerCase()) {
    Swal.fire({
      icon : "warning", title: "Same Location",
      text : "Source and Destination cannot be the same place.",
      confirmButtonColor: "#d97706",
    });
    destination.focus();
    return false;
  }

  // ── Length constraints (DB VARCHAR 255) ────────────────────
  if (src.length > 255) {
    Swal.fire({
      icon : "error", title: "Source Too Long",
      text : "Source must not exceed 255 characters.",
      confirmButtonColor: "#5b2e8a",
    });
    source.focus();
    return false;
  }
  if (dst.length > 255) {
    Swal.fire({
      icon : "error", title: "Destination Too Long",
      text : "Destination must not exceed 255 characters.",
      confirmButtonColor: "#5b2e8a",
    });
    destination.focus();
    return false;
  }

  // ── Status must be selected ────────────────────────────────
  if (!st) {
    Swal.fire({
      icon : "error", title: "Status Required",
      text : "Please select a Status for this order.",
      confirmButtonColor: "#5b2e8a",
    });
    status.focus();
    return false;
  }

  return true;
}

// ── API helpers ───────────────────────────────────────────────
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

// ── Customer list cache ────────────────────────────────────────
let customerList = [];   // [{customerId, customerName}, ...]

// Load customers from server into local cache, then build LOV dropdown
async function loadCustomers() {
  customerIdDisplay.placeholder = "Loading customers...";
  try {
    const res = await fetch(`${apiBase}/customers`);
    if (!res.ok) throw new Error();
    customerList = await res.json();
    customerIdDisplay.placeholder = "Select Customer";
    renderCustomerRows(customerList);
  } catch {
    customerIdDisplay.placeholder = "Unable to load customers";
    Swal.fire({
      icon : "warning", title: "Customer Load Failed",
      text : "Could not retrieve the customer list. Check server connection.",
      confirmButtonColor: "#5b2e8a",
    });
  }
}

// Render rows into the LOV table body
function renderCustomerRows(list) {
  const tbody = document.getElementById("customer-table-body");
  tbody.innerHTML = list.map(c =>
    `<tr class="lov-table-row" data-id="${c.customerId}" data-name="${c.customerName}">
       <td>${c.customerId}</td>
       <td>${c.customerName}</td>
     </tr>`
  ).join("");
  tbody.querySelectorAll(".lov-table-row").forEach(row =>
    row.addEventListener("click", () => {
      customerId.value        = row.dataset.id;
      customerIdDisplay.value = `${row.dataset.id} - ${row.dataset.name}`;
      document.getElementById("customer-dropdown").style.display = "none";
      isDirty = hasUnsavedChanges();
    })
  );
}

// LOV dropdown wiring (same pattern as dispatch-assignment)
(function setupCustomerLOV() {
  const dropEl      = document.getElementById("customer-dropdown");
  const searchInput = dropEl.querySelector(".lov-search");

  customerIdDisplay.addEventListener("click", (e) => {
    if (customerIdDisplay.disabled) return;
    e.stopPropagation();
    document.querySelectorAll(".lov-dropdown").forEach(d => d.style.display = "none");
    dropEl.style.display = "block";
    searchInput.value = "";
    renderCustomerRows(customerList);
    searchInput.focus();
  });

  searchInput.addEventListener("click", (e) => e.stopPropagation());

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    const filtered = q
      ? customerList.filter(c =>
          String(c.customerId).toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q)
        )
      : customerList;
    renderCustomerRows(filtered);
  });

  document.addEventListener("click", () => dropEl.style.display = "none");
})();

// Load Status dropdown directly from LOV table (DispatchOrderStatus) — NO hardcoded fallback
async function loadStatuses() {
  status.disabled = true;
  status.innerHTML = "<option value=''>Loading statuses...</option>";
  try {
    const res = await fetch(`${apiBase}/statuses`);
    if (!res.ok) throw new Error();
    const statuses = await res.json();   // array of strings from LOV table
    if (!Array.isArray(statuses) || statuses.length === 0) {
      status.innerHTML = "<option value=''>No statuses configured in LOV table</option>";
      return;
    }
    status.innerHTML = "";   // clear loading message
    statuses.forEach(s => {
      const opt = document.createElement("option");
      opt.value = opt.textContent = s;
      status.appendChild(opt);
    });
    status.selectedIndex = 0;   // select first LOV value (Pending)
  } catch {
    // No hardcoded fallback — show error and warn user
    status.innerHTML = "<option value=''>Unable to load statuses</option>";
    Swal.fire({
      icon : "warning", title: "Status Load Failed",
      text : "Could not load status options from the LOV table. Check server connection.",
      confirmButtonColor: "#5b2e8a",
    });
  } finally {
    status.disabled = false;
  }
}

function populateForm(record) {
  activeRecordId     = record.orderId;
  orderId.value      = record.orderId;
  // Set hidden value and resolve display text from cache
  const cid = String(record.customerId || "");
  customerId.value        = cid;
  const found = customerList.find(c => String(c.customerId) === cid);
  customerIdDisplay.value = found ? `${found.customerId} - ${found.customerName}` : cid;
  dispatchDate.value = record.dispatchDate
    ? String(record.dispatchDate).split("T")[0]
    : "";
  source.value      = record.source      || "";
  destination.value = record.destination || "";
  status.value      = record.status      || "";
  setFormMode(true);
  markClean();
  hideIdAlert();
}

// ══════════════════════════════════════════════════════════════
//  UNSAVED-CHANGES GUARD
//  POPUP: shown when user tries to navigate/switch mode with
//         unsaved edits — offers Save/Update & Continue, Discard,
//         or Stay Here.
// ══════════════════════════════════════════════════════════════
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
      confirmButtonColor: "#16a34a",
      denyButtonColor   : "#6b7280",
      cancelButtonColor : "#5b2e8a",
    });

    if (result.isConfirmed) {
      const ok = activeRecordId ? await performUpdate(true) : await performSave();
      if (!ok) return;
      await callback();
    } else if (result.isDenied) {
      markClean();
      await callback();
    }
    // cancelled → stay here, do nothing
  } finally {
    isNavigating = false;
  }
}

// ══════════════════════════════════════════════════════════════
//  SAVE  —  POST new record
//  POPUP: success toast after save; error popup on failure
// ══════════════════════════════════════════════════════════════
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
    const res  = await fetch(apiBase, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      // POPUP: server-returned error (e.g. FK violation, DB down)
      Swal.fire({
        icon : "error", title: "Save Failed",
        text : data.message || "Unable to save dispatch order.",
        confirmButtonColor: "#dc2626",
      });
      return false;
    }

    const assignedId = data.orderId || orderId.value.trim();
    // POPUP: auto-dismiss success toast
    await showAlert("success", `Order ID ${assignedId} saved!`);
    await doNew();
    return true;
  } catch {
    // POPUP: network/connection error
    Swal.fire({
      icon : "error", title: "Connection Error",
      text : "Cannot reach the server. Please check your connection.",
      confirmButtonColor: "#dc2626",
    });
    return false;
  }
}

// ══════════════════════════════════════════════════════════════
//  UPDATE  —  PUT existing record
//  POPUP (silent=false): "Confirm Update?" before sending
//  POPUP: success toast after update; error popup on failure
//  No popup (silent=true): when called from guardNavigation
// ══════════════════════════════════════════════════════════════
async function performUpdate(silent = false) {
  const id = orderId.value.trim();
  if (!id) {
    // POPUP: Update clicked without any record loaded
    Swal.fire({
      icon : "error", title: "No Record Selected",
      text : "Load a record first by entering its Order ID in Find mode.",
      confirmButtonColor: "#dc2626",
    });
    return false;
  }

  if (!validateDispatchForm()) return false;

  const current = getCurrentFormState();

  // No actual changes — inform user, treat as success
  if (lastSavedState && deepEqual(current, lastSavedState)) {
    // POPUP: auto-dismiss info toast — "nothing changed"
    showAlert("info", "No changes detected. Nothing was updated.");
    markClean(current);
    return true;
  }

  if (!silent) {
    // POPUP (blocking): explicit confirmation before overwriting DB
    const confirm = await Swal.fire({
      title             : "Confirm Update",
      html              : `Update <b>Order ID ${id}</b> with the new details?`,
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

    if (!res.ok) {
      Swal.fire({
        icon : "error", title: "Update Failed",
        text : data.message || "Unable to update the dispatch order.",
        confirmButtonColor: "#dc2626",
      });
      return false;
    }

    activeRecordId = Number(id);
    setFormMode(true);

    // POPUP: auto-dismiss success toast
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
    Swal.fire({
      icon : "error", title: "Connection Error",
      text : "Cannot reach the server. Please try again.",
      confirmButtonColor: "#dc2626",
    });
    return false;
  }
}

// ── Track field changes for dirty flag ───────────────────────
[dispatchDate, source, destination, status].forEach(el => {
  el.addEventListener("input",  () => { isDirty = hasUnsavedChanges(); });
  el.addEventListener("change", () => { isDirty = hasUnsavedChanges(); });
});
// customerId (hidden) is set via selectCustomer which calls hasUnsavedChanges directly

// ══ Mode toggle: Find ↔ New ══════════════════════════════════
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

// ── Order ID: Enter key ───────────────────────────────────────
orderId.addEventListener("keydown", async (e) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  if (currentMode === "find") {
    clearTimeout(findDebounceTimer);
    hideIdAlert();
    await guardNavigation(doFind);
  } else {
    customerId.focus();
  }
});

// ── Order ID: auto-search while typing (Find mode, 400ms) ────
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

// ── Order ID: blur also triggers search ──────────────────────
orderId.addEventListener("blur", async () => {
  if (currentMode !== "find" || isNavigating) return;
  const id = orderId.value.trim();
  if (!id || (activeRecordId && String(activeRecordId) === id)) return;
  clearTimeout(findDebounceTimer);
  await guardNavigation(doFind);
});

// ── Save button ───────────────────────────────────────────────
saveBtn.addEventListener("click", async () => { await performSave(); });

// ── Update button ─────────────────────────────────────────────
updateBtn.addEventListener("click", async () => { await performUpdate(false); });

// ══ Previous button ══════════════════════════════════════════
// POPUP (blocking): "Beginning of list" if no previous record exists
// POPUP (blocking): "No record loaded" if navigating without a record
previousBtn.addEventListener("click", async () => {
  await guardNavigation(async () => {
    const startId = orderId.value.trim() || (activeRecordId ? String(activeRecordId) : null);

    if (!startId) {
      // POPUP: no record loaded, cannot navigate
      await Swal.fire({
        icon             : "info",
        title            : "No Record Loaded",
        text             : "Load a dispatch order first, then use Previous/Next to navigate.",
        confirmButtonText: "OK",
        confirmButtonColor: "#4f46e5",
      });
      return;
    }

    try {
      const res = await fetch(`${apiBase}/previous/${startId}`);
      if (!res.ok) {
        // POPUP: already at first record
        await Swal.fire({
          icon              : "warning",
          title             : "Beginning of List",
          html              : `<p>You are already at the <b>first record</b>.<br>There is no previous record to show.</p>`,
          confirmButtonText : "OK",
          confirmButtonColor: "#4f46e5",
          footer            : `<small>Switch to <b>New</b> mode to create a new order.</small>`,
        });
        return;
      }
      populateForm(await res.json());
    } catch {
      showAlert("error", "Unable to load previous record.");
    }
  });
});

// ══ Next button ═══════════════════════════════════════════════
// POPUP (blocking): "End of list" with offer to switch to New mode
nextBtn.addEventListener("click", async () => {
  await guardNavigation(async () => {
    const id = orderId.value.trim() || "0";

    try {
      const res = await fetch(`${apiBase}/next/${id}`);
      if (!res.ok) {
        // POPUP: reached last record — offer to create new one
        const result = await Swal.fire({
          icon              : "warning",
          title             : "End of List",
          html              : `<p>You have reached the <b>last record</b>. No more records to show.</p>
                               <p style="margin-top:8px;">Would you like to add a new dispatch order?</p>`,
          showCancelButton  : true,
          confirmButtonText : "Switch to New Mode",
          cancelButtonText  : "Stay Here",
          confirmButtonColor: "#16a34a",
          cancelButtonColor : "#6b7280",
        });
        if (result.isConfirmed) {
          modeNewRadio.checked = true;
          activateNewUI();
          orderId.value    = "";
          newModeSessionId = null;
          hideIdAlert();
          await doNew();
          calibrateSlider();
        }
        return;
      }
      populateForm(await res.json());
    } catch {
      showAlert("error", "Unable to load next record.");
    }
  });
});

// ══ Exit button ═══════════════════════════════════════════════
// POPUP (blocking): warn before leaving if form is dirty
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
      confirmButtonColor: "#dc2626",
      cancelButtonColor : "#5b2e8a",
    });
    if (res.isConfirmed) window.location = exitBtn.href;
  });
}

// ── Reset form ───────────────────────────────────────────────
function resetForm() {
  orderId.value  = "";
  clearFields();
  activeRecordId = null;
  isDirty        = false;
  setFormMode(false);
  lastSavedState = getCurrentFormState();
  hideIdAlert();
}

// ── Init ─────────────────────────────────────────────────────
(async function init() {
  await Promise.all([loadCustomers(), loadStatuses()]);
  resetForm();
  activateFindUI();
  setTimeout(calibrateSlider, 50);
})();
