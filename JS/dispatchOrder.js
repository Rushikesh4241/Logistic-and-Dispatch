const orderId = document.getElementById("order-id");
const customerId = document.getElementById("customer-id");
const customerIdDisplay = document.getElementById("customer-id-display");
const dispatchDate = document.getElementById("dispatch-date");
const source = document.getElementById("source");
const destination = document.getElementById("destination");
const status = document.getElementById("status");

const saveBtn = document.getElementById("save-btn");
const updateBtn = document.getElementById("update-btn");
const previousBtn = document.getElementById("previous-btn");
const nextBtn = document.getElementById("next-btn");
const exitBtn = document.getElementById("exit-btn");

const modeFindRadio = document.getElementById("mode-find");
const modeNewRadio = document.getElementById("mode-new");
const modeToggle = document.getElementById("mode-toggle");
const idAlert = document.getElementById("id-alert");

const apiBase = "http://127.0.0.1:3000/dispatch-order";

let activeRecordId = null;
let lastSavedState = null;
let isDirty = false;
let activeMode = "FIND";
let idExistsInDB = false;
let isNavigating = false;
let findDebounceTimer = null;


function captureSnapshot() {

  lastSavedState = {
    customerId: customerId.value.trim(),
    dispatchDate: dispatchDate.value.trim(),
    source: source.value.trim(),
    destination: destination.value.trim(),
    status: status.value.trim()
  };
}

function dataIsMutated() {

  return (
    customerId.value.trim() !== lastSavedState.customerId ||
    dispatchDate.value.trim() !== lastSavedState.dispatchDate ||
    source.value.trim() !== lastSavedState.source ||
    destination.value.trim() !== lastSavedState.destination ||
    status.value.trim() !== lastSavedState.status
  );
}

function isFormBlank() {

  return !customerId.value.trim() && !dispatchDate.value.trim() && !source.value.trim() && !destination.value.trim();
}

function clearFields() {

  customerId.value = "";
  customerIdDisplay.value = "";
  dispatchDate.value = "";
  source.value = "";
  destination.value = "";

  if (status.options.length > 0) {
    status.selectedIndex = 0;
  }
}


function resetInlineFeedback() {

  idAlert.innerText = "";
  idAlert.style.display = "none";
}

function showToast(type, message) {

  return Swal.fire({
    position: "center",
    icon: type,
    title: message,
    showConfirmButton: false,
    timer: 1800,
  });
}

async function guardNavigation(callback) {

  if (isNavigating) {
    return;
  }

  if (!dataIsMutated()) {
    await callback();
    return;
  }

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

      if (!success) {
        return;
      }
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

    modeNewRadio.checked = true;
    nextBtn.classList.add("d-none");

    saveBtn.style.display = "inline-flex";
    updateBtn.style.display = "none";

    orderId.disabled = true;
    orderId.placeholder = "Auto-assigned";
    clearFields();

    try {
      const response = await fetch(`${apiBase}/next-id`);

      if (response.ok) {
        const data = await response.json();

        orderId.value = data.nextId;
      }

    } catch (err) {
      console.error("Error retrieving auto-increment sequences:", err);
    }

    idExistsInDB = false;

    captureSnapshot();

  } else {

    modeFindRadio.checked = true;
    nextBtn.classList.remove("d-none");

    saveBtn.style.display = "none";
    updateBtn.style.display = "inline-flex";

    orderId.disabled = false;
    orderId.placeholder = "";
    orderId.value = "";
    clearFields();

    idExistsInDB = false;

    captureSnapshot();
  }
}


modeFindRadio.addEventListener("change", async () => {

  if (activeMode === "FIND") {
    return;
  }
  await guardNavigation(() => setFormMode("FIND"));
});


modeNewRadio.addEventListener("change", async () => {

  if (activeMode === "NEW") {
    return;
  }
  await guardNavigation(() => setFormMode("NEW"));
});


orderId.addEventListener("input", async () => {

  if (activeMode === "NEW") {
    return;
  }

  const id = orderId.value.trim();

  if (!id) {
    clearFields();
    captureSnapshot();
    resetInlineFeedback();
    idExistsInDB = false;

    return;
  }

  clearTimeout(findDebounceTimer);

  findDebounceTimer = setTimeout(async () => {
    try {
      const response = await fetch(`${apiBase}/${id}`);

      if (!response.ok) {
        clearFields();
        captureSnapshot();
        idAlert.innerText = `Order ID "${id}" does not exist.`;
        idAlert.style.display = "block";
        idExistsInDB = false;

        return;
      }

      resetInlineFeedback();

      const data = await response.json();

      customerId.value = data.customerId || "";
      dispatchDate.value = data.dispatchDate ? data.dispatchDate.split("T")[0] : "";
      source.value = data.source || "";
      destination.value = data.destination || "";
      status.value = data.status || "";

      idExistsInDB = true;

      captureSnapshot();

      if (customerId.value) {
        const match = customerList.find(c => String(c.customerId) === String(customerId.value));

        if (match) {
          customerIdDisplay.value = `${match.customerId} - ${match.customerName}`;
        }
      }

    } catch (err) {
      console.error(err);
    }
  }, 400);
});


async function commitFormAction(silent = false) {

  const cid = customerId.value.trim();
  const date = dispatchDate.value.trim();
  const src = source.value.trim();
  const dst = destination.value.trim();
  const st = status.value.trim();

  if (!cid) {
    Swal.fire({ icon: "error", title: "Customer Required", text: "Please select a Customer before saving.", confirmButtonColor: "#5b2e8a" });
    return false;
  }

  if (!date) {
    Swal.fire({ icon: "error", title: "Dispatch Date Required", text: "Please pick a Dispatch Date.", confirmButtonColor: "#5b2e8a" });
    return false;
  }

  if (!src) {
    Swal.fire({ icon: "error", title: "Source Required", text: "Please enter the pickup / source location.", confirmButtonColor: "#5b2e8a" });
    return false;
  }

  if (!dst) {
    Swal.fire({ icon: "error", title: "Destination Required", text: "Please enter the delivery destination.", confirmButtonColor: "#5b2e8a" });
    return false;
  }

  if (src.toLowerCase() === dst.toLowerCase()) {
    Swal.fire({ icon: "warning", title: "Same Location", text: "Source and Destination cannot be the same place.", confirmButtonColor: "#d97706" });
    return false;
  }

  if (!st) {
    Swal.fire({ icon: "error", title: "Status Required", text: "Please select a Status for this order.", confirmButtonColor: "#5b2e8a" });
    return false;
  }

  if (activeMode === "FIND") {
    const id = orderId.value.trim();

    if (!id) {
      Swal.fire({ icon: "error", title: "ID Missing", text: "Please enter or search for a valid Order ID first.", confirmButtonColor: "#5b2e8a" });
      return false;
    }

    if (!dataIsMutated()) {
      showToast("info", "No changes detected. Form matches database record.");
      return true;
    }

    if (!silent) {
      const confirmBox = await Swal.fire({
        title: "Confirm Update",
        html: `Are you sure you want to update the details for <b>Order ID ${id}</b>?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, Update",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#d97706",
        cancelButtonColor: "#6b7280"
      });

      if (!confirmBox.isConfirmed) {
        return false;
      }
    }

    try {
      const response = await fetch(`${apiBase}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: cid, dispatchDate: date, source: src, destination: dst, status: st })
      });

      const data = await response.json();

      await Swal.fire({ position: "center", icon: "success", title: "Updated!", text: data.message || "Order modified successfully.", showConfirmButton: false, timer: 1800 });

      captureSnapshot();

      return true;

    } catch (err) {
      console.error(err);
      return false;
    }

  } else {

    try {
      const response = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: cid, dispatchDate: date, source: src, destination: dst, status: st })
      });

      const data = await response.json();

      await showToast("success", data.message || "New dispatch order registered successfully.");

      clearFields();

      await setFormMode("FIND");

      return true;

    } catch (err) {
      console.error(err);
      return false;
    }
  }
}

saveBtn.addEventListener("click", async () => {
  await commitFormAction(false);
});

updateBtn.addEventListener("click", async () => {
  await commitFormAction(false);
});


nextBtn.addEventListener("click", async () => {

  await guardNavigation(async () => {

    let id = orderId.value.trim();

    if (!id) {
      id = 0;
    }

    try {
      const response = await fetch(`${apiBase}/next/${id}`);

      if (!response.ok) {
        await Swal.fire({ icon: "warning", title: "End of List", html: "<p>You have reached the <b>last entry</b>.<br>There are no subsequent records to display.</p>", confirmButtonText: "OK", confirmButtonColor: "#4f46e5" });
        return;
      }

      const data = await response.json();

      await setFormMode("FIND");

      orderId.value = data.orderId;
      customerId.value = data.customerId || "";
      dispatchDate.value = data.dispatchDate ? data.dispatchDate.split("T")[0] : "";
      source.value = data.source || "";
      destination.value = data.destination || "";
      status.value = data.status || "";

      idExistsInDB = true;

      captureSnapshot();

      if (customerId.value) {
        const match = customerList.find(c => String(c.customerId) === String(customerId.value));
        if (match) customerIdDisplay.value = `${match.customerId} - ${match.customerName}`;
      }

    } catch (err) {
      console.error(err);
    }
  });
});


previousBtn.addEventListener("click", async () => {

  let id = orderId.value.trim();

  if (!id && activeMode === "FIND") {
    await Swal.fire({ icon: "info", title: "No Record Loaded", text: "Please look up or load an active entry sequence first before navigating.", confirmButtonText: "OK", confirmButtonColor: "#4f46e5" });
    return;
  }

  await guardNavigation(async () => {

    try {
      const response = await fetch(`${apiBase}/previous/${id}`);

      if (!response.ok) {
        await Swal.fire({ icon: "warning", title: "Beginning of List", html: "<p>You are already at the <b>first entry</b>.<br>There is no prior record to display.</p>", confirmButtonText: "OK", confirmButtonColor: "#4f46e5" });
        return;
      }

      const data = await response.json();

      await setFormMode("FIND");

      orderId.value = data.orderId;
      customerId.value = data.customerId || "";
      dispatchDate.value = data.dispatchDate ? data.dispatchDate.split("T")[0] : "";
      source.value = data.source || "";
      destination.value = data.destination || "";
      status.value = data.status || "";

      idExistsInDB = true;

      captureSnapshot();

      if (customerId.value) {
        const match = customerList.find(c => String(c.customerId) === String(customerId.value));
        if (match) customerIdDisplay.value = `${match.customerId} - ${match.customerName}`;
      }

    } catch (err) {
      console.error(err);
    }
  });
});


let customerList = [];

async function loadCustomers() {

  try {
    const res = await fetch(`${apiBase}/customers`);

    if (res.ok) {
      customerList = await res.json();
      renderCustomerRows(customerList);
    }
  } catch (err) {
    console.error(err);
  }
}

function renderCustomerRows(list) {

  const tbody = document.getElementById("customer-table-body");

  if (!tbody) return;

  tbody.innerHTML = list.map(c =>
    `<tr class="lov-table-row" data-id="${c.customerId}" data-name="${c.customerName}">
           <td>${c.customerId}</td>
           <td>${c.customerName}</td>
         </tr>`
  ).join("");

  tbody.querySelectorAll(".lov-table-row").forEach(row =>
    row.addEventListener("click", () => {
      customerId.value = row.dataset.id;
      customerIdDisplay.value = `${row.dataset.id} - ${row.dataset.name}`;
      document.getElementById("customer-dropdown").style.display = "none";
    })
  );
}

async function loadStatuses() {

  try {
    const res = await fetch(`${apiBase}/statuses`);

    if (res.ok) {
      const statuses = await res.json();
      status.innerHTML = statuses.map(s => `<option value="${s}">${s}</option>`).join("");
    }
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {

  await Promise.all([loadCustomers(), loadStatuses()]);

  const dropEl = document.getElementById("customer-dropdown");
  const searchInput = dropEl ? dropEl.querySelector(".lov-search") : null;

  if (customerIdDisplay && dropEl) {
    customerIdDisplay.addEventListener("click", (e) => {
      e.stopPropagation();
      dropEl.style.display = "block";
      if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
      }
      renderCustomerRows(customerList);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("click", (e) => e.stopPropagation());
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();
      const filtered = q ? customerList.filter(c => String(c.customerId).toLowerCase().includes(q) || c.customerName.toLowerCase().includes(q)) : customerList;
      renderCustomerRows(filtered);
    });
  }

  document.addEventListener("click", () => {
    if (dropEl) dropEl.style.display = "none";
  });

  await setFormMode("FIND");
});