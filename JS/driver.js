const driverId = document.getElementById("id");
const driverName = document.getElementById("name");
const driverPhone = document.getElementById("phone");
const licenseNumber = document.getElementById("license");

const actionBtn = document.getElementById("action-btn");
const toggleFind = document.getElementById("toggle-find");
const toggleNew = document.getElementById("toggle-new");
const dbFeedback = document.getElementById("id-db-feedback");
const nextBtn = document.getElementById("next-btn");

const API_BASE_URL = "http://localhost:3000/driver";

let activeMode = "FIND"; 
let originalSnapshot = { name: "", phone: "", license: "" };
let idExistsInDB = false;
let isNavigating = false;

function captureSnapshot() {

    originalSnapshot = {
        name: driverName.value.trim(),
        phone: driverPhone.value.trim(),
        license: licenseNumber.value.trim()
    };
}


function dataIsMutated() {
    return (
        driverName.value.trim() !== originalSnapshot.name ||
        driverPhone.value.trim() !== originalSnapshot.phone ||
        licenseNumber.value.trim() !== originalSnapshot.license
    );
}


function isFormBlank() {
    return !driverName.value.trim() && !driverPhone.value.trim() && !licenseNumber.value.trim();
}


function clearFields() {
    driverName.value = "";
    driverPhone.value = "";
    licenseNumber.value = "";
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

        driverId.disabled = true; 
        clearFields();

        try {
            const response = await fetch(`${API_BASE_URL}/new-id`);

            if (response.ok) {
                const data = await response.json();
                driverId.value = data.nextId;
            }
        } catch (err) {
            console.error("Error retrieving auto-increment value sequences:", err);
        }

        idExistsInDB = false;
        captureSnapshot();

    } else {
        toggleFind.classList.add("active");
        toggleNew.classList.remove("active");
        nextBtn.classList.remove("d-none");

        actionBtn.innerText = "Update";
        actionBtn.className = "btn btn-warning rounded-3 px-4 fw-bold text-dark";
    
        driverId.disabled = false;
        driverId.value = "";
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


driverId.addEventListener("input", async () => {

    if (activeMode === "NEW") {
        return; 
    }
    const id = driverId.value.trim();

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
            dbFeedback.innerText = `Driver ID "${id}" does not exist.`;
            dbFeedback.style.display = "block";

            idExistsInDB = false;

            return; 
        }
        resetInlineFeedback();

        const data = await response.json();

        driverName.value = data.driverName || "";
        driverPhone.value = data.driverPhone || "";
        licenseNumber.value = data.licenseNumber || "";

        idExistsInDB = true;
        captureSnapshot();

    } catch (err) {
        console.error(err);
    }
});

async function commitFormAction(silent = false) {

    const phoneRegex = /^[0-9]{10}$/;

    if (!driverName.value.trim()) {
        Swal.fire({ icon: "error", title: "Name Required", text: "Full Name field is required to submit this record.", confirmButtonColor: "#5b2e8a" });
        return false;
    }

    if (!driverPhone.value.trim()) {
        Swal.fire({ icon: "error", title: "Phone Required", text: "Phone Number field is required to submit this record.", confirmButtonColor: "#5b2e8a" });
        return false;
    }


    if (!licenseNumber.value.trim()) {
        Swal.fire({ icon: "error", title: "License Required", text: "License Number field is required to submit this record.", confirmButtonColor: "#5b2e8a" });
        return false;
    }


    if (!phoneRegex.test(driverPhone.value.trim())) {
        Swal.fire({ icon: "error", title: "Invalid Input", text: "Phone records must contain exactly 10 digits.", confirmButtonColor: "#5b2e8a" });
        return false;
    }


    if (activeMode === "FIND") {
        const id = driverId.value.trim();

        if (!id) {
            Swal.fire({ icon: "error", title: "ID Missing", text: "Please enter or search for a valid Driver ID first.", confirmButtonColor: "#5b2e8a" });
            return false;
        }

        try {
            const checkResp = await fetch(`${API_BASE_URL}/${id}`);

            if (!checkResp.ok) {
                Swal.fire({ icon: "error", title: "Operation Denied", text: "Cannot update. This Driver ID does not exist in the system.", confirmButtonColor: "#5b2e8a" });
                return false;
            }

        } catch(e) {
            return false;
        }

        if (!dataIsMutated()) {
            showToast("info", "No changes detected. Form matches current database record.");
            return true;
        }

        if (!silent) {
            const confirmBox = await Swal.fire({
                title: "Confirm Update",
                html: `Are you sure you want to update the details for <b>Driver ID ${id}</b>?`,
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
                    driverName: driverName.value.trim(),
                    driverPhone: driverPhone.value.trim(),
                    licenseNumber: licenseNumber.value.trim()
                })
            });

            const data = await response.json();

            await Swal.fire({ position: "center", icon: "success", title: "Updated!", text: data.message || "Driver record modified successfully.", showConfirmButton: false, timer: 1800 });

            captureSnapshot();

            return true;

        } catch (err) {
            console.error(err);
            return false;
        }

    } else {
        if (!silent) {
            const confirmBox = await Swal.fire({
                title: "Confirm Save",
                text: "Are you sure you want to save this new driver record?",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Yes, Save",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#16a34a",
                cancelButtonColor: "#6b7280"
            });

            if (!confirmBox.isConfirmed) {
                return false;
            }
        }

        try {
            const response = await fetch(API_BASE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    driverName: driverName.value.trim(),
                    driverPhone: driverPhone.value.trim(),
                    licenseNumber: licenseNumber.value.trim()
                })
            });

            const data = await response.json();
            await showToast("success", data.message || "New driver registered successfully.");

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
        let id = driverId.value.trim();

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

            driverId.value = data.driverId;
            driverName.value = data.driverName || "";
            driverPhone.value = data.driverPhone || "";
            licenseNumber.value = data.licenseNumber || "";

            idExistsInDB = true;
            captureSnapshot();

        } catch (err) {
            console.error(err);
        }
    });
});


document.getElementById("previous-btn").addEventListener("click", async () => {

    let id = driverId.value.trim();

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

            driverId.value = data.driverId;
            driverName.value = data.driverName || "";
            driverPhone.value = data.driverPhone || "";
            licenseNumber.value = data.licenseNumber || "";
            idExistsInDB = true;

            captureSnapshot();

        } catch (err) {
            console.error(err);
        }
    });
});