const driverId = document.getElementById("id");
const driverName = document.getElementById("name");
const driverPhone = document.getElementById("phone");
const licenseNumber = document.getElementById("license");

const actionBtn = document.getElementById("action-btn");
const toggleFind = document.getElementById("toggle-find");
const toggleNew = document.getElementById("toggle-new");
const dbFeedback = document.getElementById("id-db-feedback");

const API_BASE_URL = "http://localhost:3000/driver";

let activeMode = "FIND"; 
let originalSnapshot = { name: "", phone: "", license: "" };

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

function clearFields() {
    driverName.value = "";
    driverPhone.value = "";
    licenseNumber.value = "";
}

function resetInlineFeedback() {
    dbFeedback.innerText = "";
    dbFeedback.style.display = "none";
}

// Dynamically alters button context metrics based on selection row targets
async function setFormMode(mode) {
    activeMode = mode;
    resetInlineFeedback();
    
    if (mode === "NEW") {
        toggleNew.classList.add("active");
        toggleFind.classList.remove("active");
        
        // Transform button presentation for safe insertion handling
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
        captureSnapshot();
    } else {
        toggleFind.classList.add("active");
        toggleNew.classList.remove("active");
        
        // Transform button presentation back into update edit configuration parameters
        actionBtn.innerText = "Update";
        actionBtn.className = "btn btn-warning rounded-3 px-4 fw-bold text-dark";
        
        driverId.disabled = false;
        driverId.value = "";
        clearFields();
        captureSnapshot();
    }
}

// Button click state changes
toggleFind.addEventListener("click", () => {
    if (activeMode === "FIND") return;
    setFormMode("FIND");
});

toggleNew.addEventListener("click", async () => {
    if (activeMode === "NEW") return;
    
    if (dataIsMutated() && driverName.value.trim() !== "") {
        Swal.fire({
            title: "Unsaved Modifications",
            text: "Switching modes will discard unsaved entry modifications. Proceed?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#5b2e8a",
            cancelButtonColor: "#dc3545",
            confirmButtonText: "Yes, discard"
        }).then((result) => { if (result.isConfirmed) setFormMode("NEW"); });
    } else {
        setFormMode("NEW");
    }
});

// Live validation loop checking input existence records dynamically on type key event
driverId.addEventListener("input", async () => {
    if (activeMode === "NEW") return; 

    const id = driverId.value.trim();
    if (!id) { clearFields(); captureSnapshot(); resetInlineFeedback(); return; }

    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        
        if (!response.ok) { 
            clearFields(); 
            captureSnapshot(); 
            // Injects styling matching snapshot file requirements perfectly
            dbFeedback.innerText = `Driver ID "${id}" does not exist.`;
            dbFeedback.style.display = "block";
            return; 
        }

        resetInlineFeedback();
        const data = await response.json();
        driverName.value = data.driverName || "";
        driverPhone.value = data.driverPhone || "";
        licenseNumber.value = data.licenseNumber || "";
        captureSnapshot();
    } catch (err) {
        console.error(err);
    }
});

// UNIFIED BUTTON DELEGATOR (Fires PUT or POST actions gracefully depending on active state parameters)
actionBtn.addEventListener("click", async () => {
    const phoneRegex = /^[0-9]{10}$/;

    // UPDATED VALIDATION: Only Full Name is strictly required across operations
    if (!driverName.value.trim()) {
        Swal.fire({ icon: "error", title: "Missing Fields", text: "Full Name is required.", confirmButtonColor: "#5b2e8a" });
        return;
    }

    // Phone format validation only runs if the field is not empty
    if (driverPhone.value.trim() !== "" && !phoneRegex.test(driverPhone.value.trim())) {
        Swal.fire({ icon: "error", title: "Invalid Data Parameter", text: "Phone records must contain exactly 10 digits.", confirmButtonColor: "#5b2e8a" });
        return;
    }

    // HANDLER FOR UPDATE ROUTE
    if (activeMode === "FIND") {
        const id = driverId.value.trim();
        if (!id) { Swal.fire({ icon: "error", title: "ID Missing", text: "Provide a valid target Driver ID to edit.", confirmButtonColor: "#5b2e8a" }); return; }

        if (!dataIsMutated()) {
            Swal.fire({ icon: "info", title: "No Changes Detected", text: "Please enter new changes before clicking Update.", confirmButtonColor: "#5b2e8a" });
            return;
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
            Swal.fire({ icon: "success", title: data.message || "Driver Updated Successfully", timer: 1500, showConfirmButton: false });
            captureSnapshot();
        } catch (err) { console.error(err); }

    // HANDLER FOR SAVE ROUTE
    } else {
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
            Swal.fire({ icon: "success", title: data.message || "Driver Registered Successfully", timer: 1500, showConfirmButton: false });
            clearFields();
            setFormMode("FIND");
        } catch (err) { console.error(err); }
    }
});

// Guardrail checking modifications safety boundaries
async function verifyNavigationSafety() {
    if (dataIsMutated() && driverName.value.trim() !== "") {
        const check = await Swal.fire({
            title: "Data Won't Be Saved",
            text: "You have unsaved changes. Do you want to discard them and navigate?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#28a745",
            cancelButtonColor: "#5b2e8a",
            confirmButtonText: "Yes, discard and move"
        });
        return check.isConfirmed;
    }
    return true;
}

// NEXT
document.getElementById("next-btn").addEventListener("click", async () => {
    const isSafe = await verifyNavigationSafety();
    if (!isSafe) return;

    let id = driverId.value.trim();
    if (!id || activeMode === "NEW") id = 0;

    try {
        const response = await fetch(`${API_BASE_URL}/next/${id}`);
        if (!response.ok) { Swal.fire({ icon: "info", title: "End of dataset reached", confirmButtonColor: "#5b2e8a" }); return; }

        const data = await response.json();
        setFormMode("FIND");
        driverId.value = data.driverId;
        driverName.value = data.driverName || "";
        driverPhone.value = data.driverPhone || "";
        licenseNumber.value = data.licenseNumber || "";
        captureSnapshot();
    } catch (err) { console.error(err); }
});

// PREVIOUS
document.getElementById("previous-btn").addEventListener("click", async () => {
    let id = driverId.value.trim();
    if (!id || activeMode === "NEW") { 
        Swal.fire({ icon: "info", title: "Missing ID", text: "Please enter an active reference code or switch to Find mode.", confirmButtonColor: "#5b2e8a" }); 
        return; 
    }

    const isSafe = await verifyNavigationSafety();
    if (!isSafe) return;

    try {
        const response = await fetch(`${API_BASE_URL}/previous/${id}`);
        if (!response.ok) { Swal.fire({ icon: "info", title: "Beginning of dataset reached", confirmButtonColor: "#5b2e8a" }); return; }

        const data = await response.json();
        setFormMode("FIND");
        driverId.value = data.driverId;
        driverName.value = data.driverName || "";
        driverPhone.value = data.driverPhone || "";
        licenseNumber.value = data.licenseNumber || "";
        captureSnapshot();
    } catch (err) { console.error(err); }
});