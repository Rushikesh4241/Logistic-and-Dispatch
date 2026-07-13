const deliveryId = document.getElementById("delivery-id");
const orderId = document.getElementById("order-id");
const deliveryDate = document.getElementById("delivery-date");
const remarks = document.getElementById("remarks");
const proofOfDelivery = document.getElementById("proof");

<<<<<<< HEAD
const registerBtn = document.getElementById("register-btn");
const updateBtn = document.getElementById("update-btn");
const prevNext = document.getElementById("prev-next");
const findBtn = document.getElementById("find-btn");
const newBtn = document.getElementById("new-btn");
=======
const actionBtn = document.getElementById("action-btn");
const toggleFind = document.getElementById("toggle-find");
const toggleNew = document.getElementById("toggle-new");
const dbFeedback = document.getElementById("id-db-feedback");
const nextBtn = document.getElementById("next-btn");
>>>>>>> main

const API_BASE_URL = "http://localhost:3000/delivery";
let findMode = true;

<<<<<<< HEAD
function setFindMode(isFindMode) {
    findMode = isFindMode;
    findBtn.classList.toggle("active", findMode);
    newBtn.classList.toggle("active", !findMode);
    if (!findMode) {
        toggleFormMode(false);
    }
=======
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
>>>>>>> main
}

function toggleFormMode(isUpdateMode) {
    if (isUpdateMode) {
        registerBtn.classList.add("d-none");
        updateBtn.classList.remove("d-none");
    } else {
        registerBtn.classList.remove("d-none");
        updateBtn.classList.add("d-none");
    }
}

function isFormBlank() {
    return !driverName.value.trim() && !driverPhone.value.trim() && !licenseNumber.value.trim();
}

function clearFields() {
    deliveryId.value = "";
    orderId.value = "";
    deliveryDate.value = "";
    remarks.value = "";
    proofOfDelivery.value = "";
}

async function loadOrderIds() {
    try {
        const response = await fetch(`${API_BASE_URL}/orders`);
        const data = await response.json();

<<<<<<< HEAD
        if (!Array.isArray(data)) {
            return;
        }

        const currentValue = orderId.value;
        orderId.innerHTML = '<option value="">Select Order ID</option>';

        data.forEach((item) => {
            const opt = document.createElement("option");
            opt.value = item.ORDERID || item.orderId || item.ORDER_ID || item.order_id;
            opt.textContent = opt.value;
            orderId.appendChild(opt);
        });

        if (currentValue) {
            orderId.value = currentValue;
        }
    } catch (err) {
        console.error(err);
    }
}

async function getNextDeliveryId() {
    try {
        const response = await fetch(`${API_BASE_URL}/next-id`);
        const data = await response.json();
        return data.nextDeliveryId || "";
    } catch (err) {
        console.error(err);
        return "";
    }
}

deliveryId.addEventListener("input", async () => {
    if (!findMode) return;

    const id = deliveryId.value.trim();
    if (!id) {
        clearFields();
        toggleFormMode(false);
        return;
    }

    await lookupDeliveryById();
});

// also support Enter and blur for faster form interaction
deliveryId.addEventListener("keydown", async (event) => {
    if (findMode && event.key === "Enter") {
        event.preventDefault();
        await lookupDeliveryById();
    }
});

deliveryId.addEventListener("blur", async () => {
    if (findMode && deliveryId.value.trim()) {
        await lookupDeliveryById();
    }
});

async function lookupDeliveryById() {
    const id = deliveryId.value.trim();
    if (!id) {
        Swal.fire({ position: "center", icon: "error", title: "Please enter a Delivery ID to find", showConfirmButton: true });
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if (!response.ok) {
            Swal.fire({ position: "center", icon: "error", title: "No delivery found for that ID", showConfirmButton: true });
            return;
        }
        const data = await response.json();
        orderId.value = data.orderId || "";
        deliveryDate.value = data.deliveryDate ? data.deliveryDate.split("T")[0] : "";
        remarks.value = data.remarks || "";
        proofOfDelivery.value = data.proofOfDelivery || "";
        toggleFormMode(true);
    } catch (err) {
        console.error(err);
    }
}

// Find button: switch to find mode and automatically lookup later
if (findBtn) {
    findBtn.addEventListener("click", () => {
        setFindMode(true);
        if (deliveryId.value.trim()) {
            lookupDeliveryById();
        }
    });
}

// New button: prepare form for a new delivery
if (newBtn) {
    newBtn.addEventListener("click", async () => {
        setFindMode(false);
        clearFields();
        const nextId = await getNextDeliveryId();
        if (nextId) deliveryId.value = nextId;
        toggleFormMode(false);
    });
}

registerBtn.addEventListener("click", async () => {
    if (!orderId.value) {
        Swal.fire({
            position: "center",
            icon: "error",
            title: "Please select an Order ID",
            showConfirmButton: true,
        });
        return;
    }

    try {
        let finalDeliveryId = deliveryId.value.trim();
        if (!finalDeliveryId) {
            finalDeliveryId = await getNextDeliveryId();
=======
// Auto-dismiss short business alert toasts
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
        
        // Hide next option dynamically in raw registration mode layout
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
        
        // Restore next option visibility in lookup layout template
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
    if (activeMode === "FIND") return;
    await guardNavigation(() => setFormMode("FIND"));
});

toggleNew.addEventListener("click", async () => {
    if (activeMode === "NEW") return;
    await guardNavigation(() => setFormMode("NEW"));
});

driverId.addEventListener("input", async () => {
    if (activeMode === "NEW") return; 

    const id = driverId.value.trim();
    if (!id) { clearFields(); captureSnapshot(); resetInlineFeedback(); idExistsInDB = false; return; }

    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        
        if (!response.ok) { 
            clearFields(); 
            captureSnapshot(); 
            dbFeedback.innerText = `Driver ID "${id}" does not exist.`;
            dbFeedback.style.display = "block";
            idExistsInDB = false;
            return; 
>>>>>>> main
        }

        const response = await fetch(API_BASE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                deliveryId: finalDeliveryId || null,
                orderId: orderId.value,
                deliveryDate: deliveryDate.value || null,
                remarks: remarks.value.trim(),
                proofOfDelivery: proofOfDelivery.value.trim(),
            }),
        });

        const data = await response.json();
<<<<<<< HEAD

        if (!response.ok) {
            throw new Error(data.message || "Unable to register delivery");
        }

        Swal.fire({
            position: "center",
            icon: "success",
            title: data.message || "Delivery Registered Successfully",
            showConfirmButton: false,
            timer: 1500,
        });

        clearFields();
        toggleFormMode(false);
    } catch (err) {
        console.error(err);
        Swal.fire({
            position: "center",
            icon: "error",
            title: "Unable to add Delivery",
            showConfirmButton: false,
            timer: 1500,
        });
    }
});

updateBtn.addEventListener("click", async () => {
    if (!deliveryId.value.trim()) {
        Swal.fire({
            position: "center",
            icon: "error",
            title: "Please enter a Delivery ID to update",
            showConfirmButton: true,
        });
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${deliveryId.value.trim()}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                orderId: orderId.value,
                deliveryDate: deliveryDate.value || null,
                remarks: remarks.value.trim(),
                proofOfDelivery: proofOfDelivery.value.trim(),
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to update delivery");
        }

        Swal.fire({
            position: "center",
            icon: "success",
            title: data.message || "Delivery Updated Successfully",
            showConfirmButton: false,
            timer: 1500,
        });
    } catch (err) {
        console.error(err);
        Swal.fire({
            position: "center",
            icon: "error",
            title: "Unable to update Delivery",
            showConfirmButton: false,
            timer: 1500,
        });
    }
});

document.getElementById("next-btn").addEventListener("click", async () => {
    let id = deliveryId.value.trim();
    if (!id) id = 0;

    try {
        const response = await fetch(`${API_BASE_URL}/next/${id}`);

        if (!response.ok) {
            Swal.fire({
                position: "center",
                icon: "info",
                title: "End of Delivery list reached",
                showConfirmButton: false,
                timer: 1500,
            });
            return;
        }

        const data = await response.json();
        deliveryId.value = data.deliveryId;
        orderId.value = data.orderId || "";
        deliveryDate.value = data.deliveryDate ? data.deliveryDate.split("T")[0] : "";
        remarks.value = data.remarks || "";
        proofOfDelivery.value = data.proofOfDelivery || "";
        toggleFormMode(true);
=======
        driverName.value = data.driverName || "";
        driverPhone.value = data.driverPhone || "";
        licenseNumber.value = data.licenseNumber || "";
        idExistsInDB = true;
        captureSnapshot();
>>>>>>> main
    } catch (err) {
        console.error(err);
    }
});

<<<<<<< HEAD
document.getElementById("previous-btn").addEventListener("click", async () => {
    let id = deliveryId.value.trim();
    if (!id) return;

    try {
        const response = await fetch(`${API_BASE_URL}/previous/${id}`);

        if (!response.ok) {
            Swal.fire({
                position: "center",
                icon: "info",
                title: "Reached the beginning of Delivery list",
                showConfirmButton: false,
                timer: 1500,
            });
            return;
        }

        const data = await response.json();
        deliveryId.value = data.deliveryId;
        orderId.value = data.orderId || "";
        deliveryDate.value = data.deliveryDate ? data.deliveryDate.split("T")[0] : "";
        remarks.value = data.remarks || "";
        proofOfDelivery.value = data.proofOfDelivery || "";
        toggleFormMode(true);
    } catch (err) {
        console.error(err);
    }
});

loadOrderIds();
toggleFormMode(false);

// initialize bootstrap popovers for any info buttons (click/focus)
try {
    const popoverTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.forEach((el) => new bootstrap.Popover(el));
} catch (e) {
    // ignore if bootstrap isn't available
}
=======
// ── Primary Combined Validation & Save/Update Action Delegator ──
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

    // HANDLER FOR UPDATE ROUTE
    if (activeMode === "FIND") {
        const id = driverId.value.trim();
        if (!id) { Swal.fire({ icon: "error", title: "ID Missing", text: "Please enter or search for a valid Driver ID first.", confirmButtonColor: "#5b2e8a" }); return false; }

        try {
            const checkResp = await fetch(`${API_BASE_URL}/${id}`);
            if (!checkResp.ok) {
                Swal.fire({ icon: "error", title: "Operation Denied", text: "Cannot update. This Driver ID does not exist in the system.", confirmButtonColor: "#5b2e8a" });
                return false;
            }
        } catch(e) { return false; }

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
            if (!confirmBox.isConfirmed) return false;
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
        } catch (err) { console.error(err); return false; }

    // HANDLER FOR SAVE ROUTE
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
            if (!confirmBox.isConfirmed) return false;
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
        } catch (err) { console.error(err); return false; }
    }
}

actionBtn.addEventListener("click", async () => { await commitFormAction(false); });

// ── Pagination Module Interactors ──────────────────────────────
nextBtn.addEventListener("click", async () => {
    await guardNavigation(async () => {
        let id = driverId.value.trim();
        if (!id) id = 0;

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
        } catch (err) { console.error(err); }
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
        } catch (err) { console.error(err); }
    });
});
>>>>>>> main
