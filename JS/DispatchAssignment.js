const assignmentId = document.getElementById("assignment-id");
const orderId = document.getElementById("order-id");
const driverId = document.getElementById("driver-id");
const vehicleId = document.getElementById("vehicle-id");
const dateTime = document.getElementById("date-time");

const actionBtn = document.getElementById("action-btn");
const toggleFind = document.getElementById("toggle-find");
const toggleNew = document.getElementById("toggle-new");
const dbFeedback = document.getElementById("id-db-feedback");
const nextBtn = document.getElementById("next-btn");

const API_BASE_URL = "http://localhost:3000/dispatch-assignment";

let activeMode = "FIND";
let originalSnapshot = { order: "", driver: "", vehicle: "", date: "" };
let idExistsInDB = false;
let isNavigating = false;

let rawOrders = [];
let rawDrivers = [];
let rawVehicles = [];

function captureSnapshot() {
  originalSnapshot = {
    order: orderId.value.trim(),
    driver: driverId.value.trim(),
    vehicle: vehicleId.value.trim(),
    date: dateTime.value,
  };
}

function dataIsMutated() {
  return (
    orderId.value.trim() !== originalSnapshot.order ||
    driverId.value.trim() !== originalSnapshot.driver ||
    vehicleId.value.trim() !== originalSnapshot.vehicle ||
    dateTime.value !== originalSnapshot.date
  );
}

function isFormBlank() {
  return (
    !orderId.value.trim() && !driverId.value.trim() && !vehicleId.value.trim()
  );
}

function clearFields() {
  orderId.value = "";
  driverId.value = "";
  vehicleId.value = "";
  dateTime.value = "";
}

function resetInlineFeedback() {
  dbFeedback.innerText = "";
  dbFeedback.style.display = "none";
}

// Auto-dismiss informational toasts
function showToast(type, message) {
  return Swal.fire({
    position: "center",
    icon: type,
    title: message,
    showConfirmButton: false,
    timer: 1800,
  });
}

// ── Navigation Guardrail Interceptor ───────────────────────────
async function guardNavigation(callback) {
  if (isNavigating) return;
  if (!dataIsMutated()) { await callback(); return; }

  isNavigating = true;
  try {
    const result = await Swal.fire({
      title: "Unsaved Changes",
      text: "You have unsaved changes on the form. How would you like to proceed?",
      icon: "warning",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: activeMode === "FIND" && idExistsInDB ? "Update & Continue" : "Save & Continue",
      denyButtonText: "Discard Changes",
      cancelButtonText: "Stay Here",
      confirmButtonColor: "#16a34a",
      denyButtonColor: "#6b7280",
      cancelButtonColor: "#5b2e8a",
    });

    if (result.isConfirmed) {
      const success = await commitFormAction(true);
      if (!success) return;
      await callback();
    } else if (result.isDenied) {
      captureSnapshot();
      await callback();
    }
  } finally {
    isNavigating = false;
  }
}

async function setFormMode(mode) {
  activeMode = mode;
  resetInlineFeedback();

  if (mode === "NEW") {
    toggleNew.classList.add("active");
    toggleFind.classList.remove("active");

    actionBtn.innerText = "Save";
    actionBtn.className = "btn btn-success rounded-3 px-4 fw-bold";

    nextBtn.classList.add("d-none");

    assignmentId.disabled = true;
    clearFields();

    try {
      const response = await fetch(`${API_BASE_URL}/new-id`);
      if (response.ok) {
        const data = await response.json();
        assignmentId.value = data.nextId;
      }
    } catch (err) {
      console.error("Error calculating target index keys:", err);
    }
    idExistsInDB = false;
    captureSnapshot();
  } else {
    toggleFind.classList.add("active");
    toggleNew.classList.remove("active");

    actionBtn.innerText = "Update";
    actionBtn.className = "btn btn-warning rounded-3 px-4 fw-bold text-dark";

    nextBtn.classList.remove("d-none");

    assignmentId.disabled = false;
    assignmentId.value = "";
    clearFields();
    idExistsInDB = false;
    captureSnapshot();
  }
}

toggleFind.addEventListener("click", async () => {
  if (activeMode === "FIND") return;
  await guardNavigation(() => setFormMode("FIND"));
});

toggleNew.addEventListener("click", async () => {
  if (activeMode === "NEW") return;
  await guardNavigation(() => setFormMode("NEW"));
});

assignmentId.addEventListener("input", async () => {
  if (activeMode === "NEW") return;

  const id = assignmentId.value.trim();
  if (!id) {
    clearFields();
    captureSnapshot();
    resetInlineFeedback();
    idExistsInDB = false;
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${id}`);

    if (!response.ok) {
      clearFields();
      captureSnapshot();
      dbFeedback.innerText = `Assignment ID "${id}" does not exist.`;
      dbFeedback.style.display = "block";
      idExistsInDB = false;
      return;
    }

    resetInlineFeedback();
    const data = await response.json();

    orderId.value = data.orderId || "";
    driverId.value = data.driverId || "";
    vehicleId.value = data.vehicleId || "";

    if (data.assignedDate) {
      dateTime.value = data.assignedDate.split("T")[0];
    } else {
      dateTime.value = "";
    }
    idExistsInDB = true;
    captureSnapshot();
  } catch (err) {
    console.error(err);
  }
});

// ── Primary Combined Validation & Save/Update Action Delegator ──
async function commitFormAction(silent = false) {
  if (!orderId.value || !driverId.value || !vehicleId.value) {
    Swal.fire({
      icon: "error",
      title: "Missing Fields",
      text: "Please select an Order, Driver, and Vehicle.",
      confirmButtonColor: "#5b2e8a",
    });
    return false;
  }

  if (activeMode === "FIND") {
    const id = assignmentId.value.trim();
    if (!id) {
      Swal.fire({
        icon: "error",
        title: "ID Missing",
        text: "Please look up or enter a valid target Assignment ID to edit.",
        confirmButtonColor: "#5b2e8a",
      });
      return false;
    }

    try {
      const checkResp = await fetch(`${API_BASE_URL}/${id}`);
      if (!checkResp.ok) {
        Swal.fire({
          icon: "error",
          title: "Operation Denied",
          text: "Cannot update. This Assignment ID does not exist in the system.",
          confirmButtonColor: "#5b2e8a",
        });
        return false;
      }
    } catch (e) {
      return false;
    }

    if (!dataIsMutated()) {
      showToast("info", "No changes detected. Form matches current database record.");
      return true;
    }

    if (!silent) {
      const confirmBox = await Swal.fire({
        title: "Confirm Update",
        html: `Are you sure you want to update the details for <b>Assignment ID ${id}</b>?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, Update",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#d97706",
        cancelButtonColor: "#6b7280"
      });
      if (!confirmBox.isConfirmed) return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId.value,
          driverId: driverId.value,
          vehicleId: vehicleId.value,
          dateTime: dateTime.value,
        }),
      });
      const data = await response.json();
      await Swal.fire({
        position: "center",
        icon: "success",
        title: "Updated!",
        text: data.message || "Assignment modified successfully.",
        showConfirmButton: false,
        timer: 1500,
      });
      captureSnapshot();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  } else {
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId.value,
          driverId: driverId.value,
          vehicleId: vehicleId.value,
          dateTime: dateTime.value,
        }),
      });
      const data = await response.json();
      await showToast("success", data.message || "New assignment recorded successfully.");
      clearFields();
      await setFormMode("FIND");
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}

actionBtn.addEventListener("click", async () => { await commitFormAction(false); });

// ── Pagination Module Interactors ──────────────────────────────
nextBtn.addEventListener("click", async () => {
  await guardNavigation(async () => {
    let id = assignmentId.value.trim();
    if (!id) id = 0;

    try {
      const response = await fetch(`${API_BASE_URL}/next/${id}`);
      if (!response.ok) {
        await Swal.fire({
          icon: "warning",
          title: "End of List",
          html: "<p>You have reached the <b>last entry</b>.<br>There are no subsequent records to display.</p>",
          confirmButtonText: "OK",
          confirmButtonColor: "#4f46e5",
        });
        return;
      }

      const data = await response.json();
      await setFormMode("FIND");
      assignmentId.value = data.assignmentId;
      orderId.value = data.orderId || "";
      driverId.value = data.driverId || "";
      vehicleId.value = data.vehicleId || "";
      if (data.assignedDate) {
        dateTime.value = data.assignedDate.split("T")[0];
      } else {
        dateTime.value = "";
      }
      idExistsInDB = true;
      captureSnapshot();
    } catch (err) {
      console.error(err);
    }
  });
});

document.getElementById("previous-btn").addEventListener("click", async () => {
  let id = assignmentId.value.trim();

  if (!id && activeMode === "FIND") {
    await Swal.fire({
      icon: "info",
      title: "No Record Loaded",
      text: "Please look up or load an active entry sequence first before navigating.",
      confirmButtonText: "OK",
      confirmButtonColor: "#4f46e5",
    });
    return;
  }

  await guardNavigation(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/previous/${id}`);
      if (!response.ok) {
        await Swal.fire({
          icon: "warning",
          title: "Beginning of List",
          html: "<p>You are already at the <b>first entry</b>.<br>There is no prior record to display.</p>",
          confirmButtonText: "OK",
          confirmButtonColor: "#4f46e5",
        });
        return;
      }

      const data = await response.json();
      await setFormMode("FIND");
      assignmentId.value = data.assignmentId;
      orderId.value = data.orderId || "";
      driverId.value = data.driverId || "";
      vehicleId.value = data.vehicleId || "";
      if (data.assignedDate) {
        dateTime.value = data.assignedDate.split("T")[0];
      } else {
        dateTime.value = "";
      }
      idExistsInDB = true;
      captureSnapshot();
    } catch (err) {
      console.error(err);
    }
  });
});

function buildCustomDropdown(inputId, dropdownId, searchClass, listBuilderFn) {
  const inputInput = document.getElementById(inputId);
  const dropEl = document.getElementById(dropdownId);
  const searchInput = dropEl.querySelector("." + searchClass);

  inputInput.addEventListener("click", (e) => {
    if (inputInput.disabled) return;
    e.stopPropagation();
    document
      .querySelectorAll(".lov-dropdown")
      .forEach((d) => (d.style.display = "none"));
    dropEl.style.display = "block";
    searchInput.focus();
  });

  searchInput.addEventListener("click", (e) => e.stopPropagation());

  searchInput.addEventListener("input", () => {
    const filterVal = searchInput.value.toLowerCase();
    listBuilderFn(filterVal);
  });

  document.addEventListener("click", () => (dropEl.style.display = "none"));
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1. Orders Custom Search Matrix Table Builder
    const resOrders = await fetch(`${API_BASE_URL}/orders`);
    rawOrders = await resOrders.json();
    const renderOrders = (filter = "") => {
      const container = document.getElementById("order-table-body");
      container.innerHTML = "";

      rawOrders
        .filter(
          (o) =>
            String(o.orderId).toLowerCase().includes(filter) ||
            String(o.customerId).toLowerCase().includes(filter) ||
            String(o.dispatchDate).toLowerCase().includes(filter) ||
            String(o.source).toLowerCase().includes(filter) ||
            String(o.destination).toLowerCase().includes(filter) ||
            String(o.status).toLowerCase().includes(filter),
        )
        .forEach((o) => {
          const tr = document.createElement("tr");
          tr.className = "lov-table-row";
          tr.innerHTML = `
            <td><strong>${o.orderId}</strong></td>
            <td>${o.customerId || "N/A"}</td>
            <td>${o.dispatchDate}</td>
            <td><small>${o.source || "N/A"} &rarr; ${o.destination || "N/A"}</small></td>
            <td><span class="badge bg-secondary">${o.status || "Pending"}</span></td>
          `;

          tr.addEventListener("click", () => {
            document.getElementById("order-id").value = o.orderId;
            document.getElementById("order-dropdown").style.display = "none";
          });
          container.appendChild(tr);
        });
    };
    buildCustomDropdown("order-id", "order-dropdown", "lov-search", renderOrders);
    renderOrders();

    // 2. Drivers Custom Search Matrix Table Builder
    const resDrivers = await fetch(`${API_BASE_URL}/drivers`);
    rawDrivers = await resDrivers.json();
    const renderDrivers = (filter = "") => {
      const container = document.getElementById("driver-table-body");
      container.innerHTML = "";
      rawDrivers
        .filter(
          (d) =>
            String(d.driverId).toLowerCase().includes(filter) ||
            d.driverName.toLowerCase().includes(filter),
        )
        .forEach((d) => {
          const tr = document.createElement("tr");
          tr.className = "lov-table-row";
          tr.innerHTML = `<td>${d.driverId}</td><td>${d.driverName}</td>`;
          tr.addEventListener("click", () => {
            document.getElementById("driver-id").value = d.driverId;
            document.getElementById("driver-dropdown").style.display = "none";
          });
          container.appendChild(tr);
        });
    };
    buildCustomDropdown("driver-id", "driver-dropdown", "lov-search", renderDrivers);
    renderDrivers();

    // 3. Vehicles Rich Grid Table Dropdown Setup
    const resVehicles = await fetch(`${API_BASE_URL}/vehicles`);
    rawVehicles = await resVehicles.json();
    const renderVehicles = (filter = "") => {
      const container = document.getElementById("vehicle-table-body");
      container.innerHTML = "";
      rawVehicles
        .filter((v) => String(v.vehicleId).toLowerCase().includes(filter))
        .forEach((v) => {
          const tr = document.createElement("tr");
          tr.className = "lov-table-row";
          tr.innerHTML = `<td>${v.vehicleId}</td><td>${v.vehicleNumber}</td><td>${v.vehicleType}</td><td>${v.capacity} KGs</td>`;
          tr.addEventListener("click", () => {
            document.getElementById("vehicle-id").value = v.vehicleId;
            document.getElementById("vehicle-dropdown").style.display = "none";
          });
          container.appendChild(tr);
        });
    };
    buildCustomDropdown("vehicle-id", "vehicle-dropdown", "lov-search", renderVehicles);
    renderVehicles();
  } catch (err) {
    console.error("Initialization error mapped across grid rows:", err);
  }
});