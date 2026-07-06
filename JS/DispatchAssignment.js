const assignmentId = document.getElementById("assignment-id");
const orderId = document.getElementById("order-id");
const driverId = document.getElementById("driver-id");
const vehicleId = document.getElementById("vehicle-id");
const dateTime = document.getElementById("date-time");

const actionBtn = document.getElementById("action-btn");
const toggleFind = document.getElementById("toggle-find");
const toggleNew = document.getElementById("toggle-new");
const dbFeedback = document.getElementById("id-db-feedback");

const API_BASE_URL = "http://localhost:3000/dispatch-assignment";

let activeMode = "FIND"; 
let originalSnapshot = { order: "", driver: "", vehicle: "", date: "" };

function captureSnapshot() {
    originalSnapshot = {
        order: orderId.value,
        driver: driverId.value,
        vehicle: vehicleId.value,
        date: dateTime.value
    };
}

function dataIsMutated() {
    return (
        orderId.value !== originalSnapshot.order ||
        driverId.value !== originalSnapshot.driver ||
        vehicleId.value !== originalSnapshot.vehicle ||
        dateTime.value !== originalSnapshot.date
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

// Switches form configurations and handles max(id) + 1 increments asynchronously
async function setFormMode(mode) {
    activeMode = mode;
    resetInlineFeedback();
    
    if (mode === "NEW") {
        toggleNew.classList.add("active");
        toggleFind.classList.remove("active");
        
        actionBtn.innerText = "Save";
        actionBtn.className = "btn btn-success rounded-3 px-4 fw-bold";
        
        assignmentId.disabled = true; 
        clearFields();

        try {
            const response = await fetch(`${API_BASE_URL}/new-id`);
            if (response.ok) {
                const data = await response.json();
                assignmentId.value = data.nextId;
            }
        } catch (err) {
            console.error("Error fetching sequential transaction id sequence:", err);
        }
        captureSnapshot();
    } else {
        toggleFind.classList.add("active");
        toggleNew.classList.remove("active");
        
        actionBtn.innerText = "Update";
        actionBtn.className = "btn btn-warning rounded-3 px-4 fw-bold text-dark";
        
        assignmentId.disabled = false;
        assignmentId.value = "";
        clearFields();
        captureSnapshot();
    }
}

// Mode Toggle Event Triggers
toggleFind.addEventListener("click", () => {
    if (activeMode === "FIND") return;
    setFormMode("FIND");
});

toggleNew.addEventListener("click", async () => {
    if (activeMode === "NEW") return;
    
    if (dataIsMutated() && orderId.value !== "") {
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

// Auto-fetch data array matching inputs on data inputs string mutations
assignmentId.addEventListener("input", async () => {
    if (activeMode === "NEW") return; 

    const id = assignmentId.value.trim();
    if (!id) { clearFields(); captureSnapshot(); resetInlineFeedback(); return; }

    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        
        if (!response.ok) { 
            clearFields(); 
            captureSnapshot(); 
            dbFeedback.innerText = `Assignment ID "${id}" does not exist.`;
            dbFeedback.style.display = "block";
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
        captureSnapshot();
    } catch (err) {
        console.error(err);
    }
});

// COMBINED DATA COMMIT ENGINE
actionBtn.addEventListener("click", async () => {
    if (!orderId.value || !driverId.value || !vehicleId.value) {
        Swal.fire({ icon: "error", title: "Missing Fields", text: "Please select an Order, Driver, and Vehicle.", confirmButtonColor: "#5b2e8a" });
        return;
    }

    // UPDATE ROUTE
    if (activeMode === "FIND") {
        const id = assignmentId.value.trim();
        if (!id) { Swal.fire({ icon: "error", title: "ID Missing", text: "Provide a valid target Assignment ID to edit.", confirmButtonColor: "#5b2e8a" }); return; }

        if (!dataIsMutated()) {
            Swal.fire({ icon: "info", title: "No Changes Detected", text: "Please enter new changes before clicking Update.", confirmButtonColor: "#5b2e8a" });
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: orderId.value,
                    driverId: driverId.value,
                    vehicleId: vehicleId.value,
                    dateTime: dateTime.value
                })
            });
            const data = await response.json();
            Swal.fire({ icon: "success", title: data.message || "Assignment Updated", timer: 1500, showConfirmButton: false });
            captureSnapshot();
        } catch (err) { console.error(err); }

    // SAVE ROUTE
    } else {
        try {
            const response = await fetch(API_BASE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: orderId.value,
                    driverId: driverId.value,
                    vehicleId: vehicleId.value,
                    dateTime: dateTime.value
                })
            });
            const data = await response.json();
            Swal.fire({ icon: "success", title: data.message || "Assignment Saved", timer: 1500, showConfirmButton: false });
            clearFields();
            setFormMode("FIND");
        } catch (err) { console.error(err); }
    }
});

// Safety navigation warning interceptor block
async function verifyNavigationSafety() {
    if (dataIsMutated() && orderId.value !== "") {
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

    let id = assignmentId.value.trim();
    if (!id || activeMode === "NEW") id = 0;

    try {
        const response = await fetch(`${API_BASE_URL}/next/${id}`);
        if (!response.ok) { Swal.fire({ icon: "info", title: "End of dataset reached", confirmButtonColor: "#5b2e8a" }); return; }

        const data = await response.json();
        setFormMode("FIND");
        assignmentId.value = data.assignmentId;
        orderId.value = data.orderId || "";
        driverId.value = data.driverId || "";
        vehicleId.value = data.vehicleId || "";
        if (data.assignedDate) {
            dateTime.value = data.assignedDate.split("T")[0];
        } else {
            dateTime.value = "";
        }
        captureSnapshot();
    } catch (err) { console.error(err); }
});

// PREVIOUS
document.getElementById("previous-btn").addEventListener("click", async () => {
    let id = assignmentId.value.trim();
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
        assignmentId.value = data.assignmentId;
        orderId.value = data.orderId || "";
        driverId.value = data.driverId || "";
        vehicleId.value = data.vehicleId || "";
        if (data.assignedDate) {
            dateTime.value = data.assignedDate.split("T")[0];
        } else {
            dateTime.value = "";
        }
        captureSnapshot();
    } catch (err) { console.error(err); }
});

// INITIAL DROPDOWN DOM DATA POPULATION POPULATOR
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const resOrders = await fetch(`${API_BASE_URL}/orders`);
        document.getElementById("order-id").innerHTML = await resOrders.text();

        const resDrivers = await fetch(`${API_BASE_URL}/drivers`);
        document.getElementById("driver-id").innerHTML = await resDrivers.text();

        const resVehicles = await fetch(`${API_BASE_URL}/vehicles`);
        document.getElementById("vehicle-id").innerHTML = await resVehicles.text();
    } catch (err) {
        console.error("Initialization failure handling choice rows mappings:", err);
    }
});