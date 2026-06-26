const vehicleId = document.getElementById("vehicle-id");
const vehicleNumber = document.getElementById("vehicle-number");
const vehicleType = document.getElementById("vehicle-type");
const capacity = document.getElementById("capacity");
const registerBtn = document.getElementById("register-btn");
const updateBtn = document.getElementById("update-btn");
const previousBtn = document.getElementById("previous-btn");
const nextBtn = document.getElementById("next-btn");
const clearBtn = document.getElementById("clear-btn");
const prevNext = document.getElementById("prev-next");

let updateMode = false;

function setFormMode(isUpdate) {
  updateMode = isUpdate;

  if (isUpdate) {
    registerBtn.classList.add("d-none");
    updateBtn.classList.remove("d-none");
    prevNext.classList.remove("d-none");
  } else {
    registerBtn.classList.remove("d-none");
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
    timer: 1600,
  });
}

function validateVehicleForm() {
  const number = vehicleNumber.value.trim();
  const type = vehicleType.value.trim();
  const cap = capacity.value.trim();

  if (!number || !type || !cap) {
    showAlert("error", "Please fill in all required fields.");
    return false;
  }

  if (isNaN(cap) || Number(cap) <= 0) {
    showAlert("error", "Capacity must be a valid positive number.");
    return false;
  }

  return true;
}

async function fetchVehicleById(id) {
  try {
    const response = await fetch(`http://localhost:3000/vehicle/${id}`);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function loadVehicleById(id) {
  if (!id) {
    setFormMode(false);
    return;
  }

  const record = await fetchVehicleById(id);

  if (!record) {
    vehicleNumber.value = "";
    vehicleType.value = "";
    capacity.value = "";
    setFormMode(false);
    showAlert("error", "Vehicle ID not present for update or view. Enter a valid ID or leave blank to register.");
    return;
  }

  vehicleNumber.value = record.vehicleNumber || "";
  vehicleType.value = record.vehicleType || "";
  capacity.value = record.capacity || "";
  setFormMode(true);
}

let vehicleIdTimer = null;
vehicleId.addEventListener("input", () => {
  clearTimeout(vehicleIdTimer);
  const id = vehicleId.value.trim();

  vehicleIdTimer = setTimeout(async () => {
    if (!id) {
      setFormMode(false);
      return;
    }
    await loadVehicleById(id);
  }, 500);
});

vehicleId.addEventListener("blur", async () => {
  const id = vehicleId.value.trim();

  if (!id) {
    setFormMode(false);
    return;
  }

  await loadVehicleById(id);
});

registerBtn.addEventListener("click", async () => {
  if (!validateVehicleForm()) {
    return;
  }

  if (vehicleId.value.trim()) {
    showAlert("error", "Clear Vehicle ID before registering a new vehicle.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/vehicle", {
      method: "POST",
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
      showAlert("error", data.message || "Unable to add vehicle.");
      return;
    }

    showAlert("success", data.message || "Vehicle saved successfully.");
    clearForm();
  } catch (err) {
    console.error(err);
    showAlert("error", "Unable to add vehicle.");
  }
});

updateBtn.addEventListener("click", async () => {
  const id = vehicleId.value.trim();

  if (!id) {
    showAlert("error", "Enter an existing Vehicle ID to update.");
    return;
  }

  if (!validateVehicleForm()) {
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/vehicle/${id}`, {
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

    showAlert("success", data.message || "Vehicle updated successfully.");
    setFormMode(true);
  } catch (err) {
    console.error(err);
    showAlert("error", "Unable to update vehicle.");
  }
});

nextBtn.addEventListener("click", async () => {
  const id = vehicleId.value.trim() || "0";

  try {
    const response = await fetch(`http://localhost:3000/vehicle/next/${id}`);

    if (!response.ok) {
      showAlert("info", "End of vehicles.");
      return;
    }

    const data = await response.json();
    vehicleId.value = data.vehicleId;
    vehicleNumber.value = data.vehicleNumber;
    vehicleType.value = data.vehicleType;
    capacity.value = data.capacity;
    setFormMode(true);
  } catch (err) {
    console.error(err);
    showAlert("info", "End of vehicles.");
  }
});

previousBtn.addEventListener("click", async () => {
  const id = vehicleId.value.trim() || "999999999";

  try {
    const response = await fetch(`http://localhost:3000/vehicle/previous/${id}`);

    if (!response.ok) {
      showAlert("info", "End of vehicles.");
      return;
    }

    const data = await response.json();
    vehicleId.value = data.vehicleId;
    vehicleNumber.value = data.vehicleNumber;
    vehicleType.value = data.vehicleType;
    capacity.value = data.capacity;
    setFormMode(true);
  } catch (err) {
    console.error(err);
    showAlert("info", "End of vehicles.");
  }
});

function clearForm() {
  vehicleId.value = "";
  vehicleNumber.value = "";
  vehicleType.value = "";
  capacity.value = "";
  setFormMode(false);
}

clearBtn.addEventListener("click", () => {
  clearForm();
});

setFormMode(false);
