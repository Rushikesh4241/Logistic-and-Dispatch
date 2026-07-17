const vehicleId = document.getElementById("vehicle-id");
const vehicleNumber = document.getElementById("vehicle-number");
const vehicleType = document.getElementById("vehicle-type");
const capacity = document.getElementById("capacity");

const actionBtn = document.getElementById("action-btn");
const toggleFind = document.getElementById("toggle-find");
const toggleNew = document.getElementById("toggle-new");
const dbFeedback = document.getElementById("id-db-feedback");
const nextBtn = document.getElementById("next-btn");

const API_BASE_URL = "http://127.0.0.1:3000/vehicle";

let activeMode = "FIND"; 
let originalSnapshot = { vehicleNumber: "", vehicleType: "", capacity: "" };
let idExistsInDB = false; 
let isNavigating = false;


function captureSnapshot() {

    originalSnapshot = {
        vehicleNumber: vehicleNumber.value.trim(),
        vehicleType: vehicleType.value.trim(),
        capacity: capacity.value.trim()
    };
}

function dataIsMutated() {

    return (
        vehicleNumber.value.trim() !== originalSnapshot.vehicleNumber ||
        vehicleType.value.trim() !== originalSnapshot.vehicleType ||
        capacity.value.trim() !== originalSnapshot.capacity
    );
}

// Keeping this function format as per requirements
function isFormBlank() {

    return !vehicleNumber.value.trim() && !vehicleType.value.trim() && !capacity.value.trim();
}

function clearFields() {

    vehicleNumber.value = "";
    vehicleType.value = "";
    capacity.value = "";
}


function resetInlineFeedback() {

    dbFeedback.innerText = "";
    dbFeedback.style.display = "none";
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

        toggleNew.classList.add("active");
        toggleFind.classList.remove("active");
        nextBtn.classList.add("d-none");

        actionBtn.innerText = "Save";
        actionBtn.className = "btn btn-success rounded-3 px-4 fw-bold";

        vehicleId.disabled = true; 
        clearFields();

        try {
            const response = await fetch(`${API_BASE_URL}/new-id`);

            if (response.ok) {
                const data = await response.json();

                vehicleId.value = data.nextId;
            }

        } catch (err) {
            console.error("Error retrieving auto-increment sequences:", err);
        }

        idExistsInDB = false; 

        captureSnapshot();

    } else {

        toggleFind.classList.add("active");
        toggleNew.classList.remove("active");
        nextBtn.classList.remove("d-none");

        actionBtn.innerText = "Update";
        actionBtn.className = "btn btn-warning rounded-3 px-4 fw-bold text-dark";

        vehicleId.disabled = false;
        vehicleId.value = "";
        clearFields();

        idExistsInDB = false;
        captureSnapshot();
    }
}


toggleFind.addEventListener("click", async () => {

    if (activeMode === "FIND") {
        return;
    }
    await guardNavigation(() => setFormMode("FIND"));
});


toggleNew.addEventListener("click", async () => {

    if (activeMode === "NEW") {
        return;
    }
    await guardNavigation(() => setFormMode("NEW"));
});


vehicleId.addEventListener("input", async () => {

    if (activeMode === "NEW") {
        return; 
    }

    const id = vehicleId.value.trim();

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
            dbFeedback.innerText = `Vehicle ID "${id}" does not exist.`;
            dbFeedback.style.display = "block";
            idExistsInDB = false;

            return; 
        }

        resetInlineFeedback();

        const data = await response.json();

        vehicleNumber.value = data.vehicleNumber || "";
        vehicleType.value = data.vehicleType || "";
        capacity.value = data.capacity || "";

        idExistsInDB = true; 

        captureSnapshot();

    } catch (err) {
        console.error(err);
    }
});


async function commitFormAction(silent = false) {

    const number = vehicleNumber.value.trim();
    const type = vehicleType.value.trim();
    const cap = capacity.value.trim();
    const numRegex = /^[A-Z0-9 \-]{3,15}$/i;

    if (!number || !type) {
        Swal.fire({ icon: "error", title: "Missing Fields", text: "Please fill required fields: Vehicle Number and Type.", confirmButtonColor: "#5b2e8a" });

        return false;
    }

    if (!numRegex.test(number)) {
        Swal.fire({ icon: "error", title: "Invalid Format", text: "Vehicle Number must be 3–15 characters (letters, numbers, hyphen).", confirmButtonColor: "#5b2e8a" });

        return false;
    }

    if (cap && (isNaN(cap) || Number(cap) <= 0)) {
        Swal.fire({ icon: "error", title: "Invalid Input", text: "Capacity must be a valid positive number if provided.", confirmButtonColor: "#5b2e8a" });

        return false;
    }

    if (activeMode === "FIND") {
        const id = vehicleId.value.trim();

        if (!id) {
            Swal.fire({ icon: "error", title: "ID Missing", text: "Please enter or search for a valid Vehicle ID first.", confirmButtonColor: "#5b2e8a" });

            return false;
        }

        try {
            const checkResp = await fetch(`${API_BASE_URL}/${id}`);

            if (!checkResp.ok) {
                Swal.fire({ icon: "error", title: "Operation Denied", text: "Cannot update. This Vehicle ID does not exist in the system.", confirmButtonColor: "#5b2e8a" });

                return false;
            }

        } catch(e) {
            return false;
        }

        if (!dataIsMutated()) {
            showToast("info", "No changes detected. Form matches database record.");

            return true;
        }


        if (!silent) {
            const confirmBox = await Swal.fire({
                title: "Confirm Update",
                html: `Are you sure you want to update the details for <b>Vehicle ID ${id}</b>?`,
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

            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    vehicleNumber: number,
                    vehicleType: type,
                    capacity: cap
                })
            });

            const data = await response.json();

            await Swal.fire({ position: "center", icon: "success", title: "Updated!", text: data.message || "Vehicle records modified successfully.", showConfirmButton: false, timer: 1800 });

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
                    vehicleNumber: number,
                    vehicleType: type,
                    capacity: cap
                })
            });

            const data = await response.json();

            await showToast("success", data.message || "New vehicle registered successfully.");

            clearFields();

            await setFormMode("FIND");

            return true;

        } catch (err) {
            console.error(err);
            return false;
        }
    }
}

actionBtn.addEventListener("click", async () => {
    await commitFormAction(false);
});


nextBtn.addEventListener("click", async () => {

    await guardNavigation(async () => {

        let id = vehicleId.value.trim();

        if (!id) {
            id = 0;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/next/${id}`);

            if (!response.ok) { 
                await Swal.fire({ icon: "warning", title: "End of List", html: "<p>You have reached the <b>last entry</b>.<br>There are no subsequent records to display.</p>", confirmButtonText: "OK", confirmButtonColor: "#4f46e5" }); 
                return; 
            }

            const data = await response.json();

            await setFormMode("FIND"); 

            vehicleId.value = data.vehicleId;
            vehicleNumber.value = data.vehicleNumber || "";
            vehicleType.value = data.vehicleType || "";
            capacity.value = data.capacity || "";

            idExistsInDB = true;

            captureSnapshot();

        } catch (err) {
            console.error(err);
        }
    });
});


document.getElementById("previous-btn").addEventListener("click", async () => {

    let id = vehicleId.value.trim();

    if (!id && activeMode === "FIND") {

        await Swal.fire({ icon: "info", title: "No Record Loaded", text: "Please look up or load an active entry sequence first before navigating.", confirmButtonText: "OK", confirmButtonColor: "#4f46e5" });
        return;
    }

    await guardNavigation(async () => {

        try {
            const response = await fetch(`${API_BASE_URL}/previous/${id}`);

            if (!response.ok) { 
                await Swal.fire({ icon: "warning", title: "Beginning of List", html: "<p>You are already at the <b>first entry</b>.<br>There is no prior record to display.</p>", confirmButtonText: "OK", confirmButtonColor: "#4f46e5" }); 
                return; 
            }

            const data = await response.json();

            await setFormMode("FIND"); 

            vehicleId.value = data.vehicleId;
            vehicleNumber.value = data.vehicleNumber || "";
            vehicleType.value = data.vehicleType || "";
            capacity.value = data.capacity || "";

            idExistsInDB = true;

            captureSnapshot();

        } catch (err) {
            console.error(err);
        }
    });
});


async function loadVehicleTypes() {

    vehicleType.disabled = true;
    vehicleType.innerHTML = "<option value=''>Loading vehicle types...</option>";

    try {
        const res = await fetch(`${API_BASE_URL}/types`);

        if (res.ok) {
            const types = await res.json();
            
            vehicleType.innerHTML = "<option value=''>Select Vehicle Type</option>";
            vehicleType.innerHTML += types.map(t => `<option value="${t}">${t}</option>`).join("");
        }

    } catch (err) {
        console.error(err);
        vehicleType.innerHTML = "<option value=''>Unable to load vehicle types</option>";
    } finally {
        vehicleType.disabled = false;
    }
}

document.addEventListener("DOMContentLoaded", async () => {

    await loadVehicleTypes();
    
    await setFormMode("FIND");
});