const vehicleId = document.getElementById("vehicle-id");
const vehicleNumber = document.getElementById("vehicle-number");
const vehicleType = document.getElementById("vehicle-type");
const capacity = document.getElementById("capacity");
const newFetchBtn = document.getElementById("new-fetch-btn");
const saveBtn = document.getElementById("save-btn");
const updateBtn = document.getElementById("update-btn");
const previousBtn = document.getElementById("previous-btn");
const nextBtn = document.getElementById("next-btn");
const prevNext = document.getElementById("prev-next");

const apiBase = "http://127.0.0.1:3000";

let activeRecordId = null;

function setFormMode(isUpdate) {
  if (isUpdate) {
    saveBtn.classList.add("d-none");
    updateBtn.classList.remove("d-none");
    prevNext.classList.remove("d-none");
  } else {
    saveBtn.classList.remove("d-none");
    updateBtn.classList.add("d-none");
    prevNext.classList.add("d-none");
  }
}

function showAlert(type, message) {
  Swal.fire({
    position: "center",
    icon: type,
    title: message,
    showConfirmButton: false,
    timer: 1700,
  });
}

function validateVehicleForm() {
  const number = vehicleNumber.value.trim();
  const type = vehicleType.value.trim();
  const cap = capacity.value.trim();

  if (!number || !type || !cap) {
    showAlert("error", "Please complete all required fields before saving.");
    return false;
  }

  if (isNaN(cap) || Number(cap) <= 0) {
    showAlert("error", "Capacity must be a valid positive number.");
    return false;
  }

  return true;
}

function updateActionButtonLabel() {
  const id = vehicleId.value.trim();
  newFetchBtn.textContent = id ? "Fetch" : "New";
}

async function loadVehicleTypes() {
  vehicleType.disabled = true;
  vehicleType.innerHTML = "<option value=''>Loading vehicle types...</option>";

  try {
    const response = await fetch(`${apiBase}/vehicle/types`);
    if (!response.ok) {
      throw new Error("Unable to load vehicle types");
    }

    const types = await response.json();
    vehicleType.innerHTML = "<option value=''>Select Vehicle Type</option>";

    if (!Array.isArray(types) || types.length === 0) {
      vehicleType.innerHTML = "<option value=''>No vehicle types configured</option>";
      return;
    }

    types.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      vehicleType.appendChild(option);
    });
  } catch (err) {
    console.error(err);
    vehicleType.innerHTML = "<option value=''>Unable to load vehicle types</option>";
  } finally {
    vehicleType.disabled = false;
  }
}

async function fetchVehicleById(id) {
  try {
    const response = await fetch(`${apiBase}/vehicle/${id}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function fetchNextVehicleId() {
  try {
    const response = await fetch(`${apiBase}/vehicle/next-id`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.nextId;
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function loadVehicleById(id, showNotFound = true) {
  if (!id) {
    activeRecordId = null;
    setFormMode(false);
    updateActionButtonLabel();
    return null;
  }

  const record = await fetchVehicleById(id);
  if (!record) {
    activeRecordId = null;
    vehicleNumber.value = "";
    vehicleType.value = "";
    capacity.value = "";
    setFormMode(false);
    updateActionButtonLabel();

    if (showNotFound) {
      showAlert("info", "Vehicle ID not found. You may create a new record using this ID.");
    }
    return null;
  }

  activeRecordId = record.vehicleId;
  vehicleNumber.value = record.vehicleNumber || "";
  vehicleType.value = record.vehicleType || "";
  capacity.value = record.capacity || "";
  setFormMode(true);
  updateActionButtonLabel();
  return record;
}

vehicleId.addEventListener("input", () => {
  updateActionButtonLabel();
  if (!vehicleId.value.trim()) {
    activeRecordId = null;
    setFormMode(false);
  }
});

vehicleId.addEventListener("blur", async () => {
  const id = vehicleId.value.trim();
  if (id) {
    await loadVehicleById(id);
  }
});

newFetchBtn.addEventListener("click", async () => {
  const id = vehicleId.value.trim();
  if (!id) {
    const nextId = await fetchNextVehicleId();
    if (!nextId) {
      showAlert("error", "Unable to reserve a new Vehicle ID.");
      return;
    }
    vehicleId.value = nextId;
    setFormMode(false);
    updateActionButtonLabel();
    showAlert("success", `New Vehicle ID reserved: ${nextId}`);
    return;
  }

  const record = await loadVehicleById(id);
  if (!record) {
    showAlert("info", "Vehicle ID not found. Fill details and click Save to register a new vehicle.");
  }
});

saveBtn.addEventListener("click", async () => {
  if (!validateVehicleForm()) {
    return;
  }

  const payload = {
    vehicleNumber: vehicleNumber.value.trim(),
    vehicleType: vehicleType.value.trim(),
    capacity: capacity.value.trim(),
  };

  if (vehicleId.value.trim()) {
    payload.vehicleId = Number(vehicleId.value.trim());
  }

  try {
    const response = await fetch(`${apiBase}/vehicle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      showAlert("error", data.message || "Unable to save vehicle.");
      return;
    }

    const assignedId = data.vehicleId || vehicleId.value.trim();
    vehicleId.value = assignedId;
    activeRecordId = assignedId;
    setFormMode(true);
    updateActionButtonLabel();
    showAlert("success", `Vehicle saved successfully. ID: ${assignedId}`);
  } catch (err) {
    console.error(err);
    showAlert("error", "Unable to save vehicle.");
  }
});

updateBtn.addEventListener("click", async () => {
  const id = vehicleId.value.trim();
  if (!id) {
    showAlert("error", "Enter a valid Vehicle ID to update.");
    return;
  }

  if (!validateVehicleForm()) {
    return;
  }

  try {
    const response = await fetch(`${apiBase}/vehicle/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vehicleNumber: vehicleNumber.value.trim(),
        vehicleType: vehicleType.value.trim(),
        capacity: capacity.value.trim(),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      showAlert("error", data.message || "Unable to update vehicle.");
      return;
    }

    activeRecordId = Number(id);
    setFormMode(true);
    updateActionButtonLabel();
    showAlert("success", data.message || "Vehicle updated successfully.");
  } catch (err) {
    console.error(err);
    showAlert("error", "Unable to update vehicle.");
  }
});

nextBtn.addEventListener("click", async () => {
  const id = vehicleId.value.trim() || "0";

  try {
    const response = await fetch(`${apiBase}/vehicle/next/${id}`);
    if (!response.ok) {
      showAlert("info", "No next vehicle record found.");
      return;
    }

    const data = await response.json();
    vehicleId.value = data.vehicleId;
    vehicleNumber.value = data.vehicleNumber;
    vehicleType.value = data.vehicleType;
    capacity.value = data.capacity;
    activeRecordId = data.vehicleId;
    setFormMode(true);
    updateActionButtonLabel();
  } catch (err) {
    console.error(err);
    showAlert("error", "Unable to load next vehicle.");
  }
});

previousBtn.addEventListener("click", async () => {
  const idInput = vehicleId.value.trim();
  const startId = idInput || (activeRecordId ? String(activeRecordId) : null);

  if (!startId) {
    showAlert("info", "No current Vehicle ID selected. Enter or fetch a record first.");
    return;
  }

  try {
    const response = await fetch(`${apiBase}/vehicle/previous/${startId}`);
    if (!response.ok) {
      showAlert("info", "No previous vehicle record found.");
      return;
    }

    const data = await response.json();
    vehicleId.value = data.vehicleId;
    vehicleNumber.value = data.vehicleNumber || "";
    vehicleType.value = data.vehicleType || "";
    capacity.value = data.capacity || "";
    activeRecordId = data.vehicleId;
    setFormMode(true);
    updateActionButtonLabel();
  } catch (err) {
    console.error(err);
    showAlert("error", "Unable to load previous vehicle.");
  }
});

function resetForm() {
  vehicleId.value = "";
  vehicleNumber.value = "";
  vehicleType.value = "";
  capacity.value = "";
  activeRecordId = null;
  setFormMode(false);
  updateActionButtonLabel();
}

(async function initializeForm() {
  await loadVehicleTypes();
  resetForm();
})();