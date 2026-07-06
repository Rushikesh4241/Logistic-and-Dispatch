const customerId = document.getElementById("id");
const customerName = document.getElementById("name");
const customerAddress = document.getElementById("address");
const customerPhone = document.getElementById("phone");

const saveBtn = document.getElementById("save-btn");
const toggleFind = document.getElementById("toggle-find");
const toggleNew = document.getElementById("toggle-new");

const API_BASE_URL = "http://localhost:3000/customer";

let activeMode = "FIND"; // Defaults to find mode
let originalSnapshot = { name: "", address: "", phone: "" };

function captureSnapshot() {
    originalSnapshot = {
        name: customerName.value.trim(),
        address: customerAddress.value.trim(),
        phone: customerPhone.value.trim()
    };
}

function dataIsMutated() {
    return (
        customerName.value.trim() !== originalSnapshot.name ||
        customerAddress.value.trim() !== originalSnapshot.address ||
        customerPhone.value.trim() !== originalSnapshot.phone
    );
}

function clearFields() {
    customerName.value = "";
    customerAddress.value = "";
    customerPhone.value = "";
}

// Switches form behaviors gracefully
async function setFormMode(mode) {
    activeMode = mode;
    if (mode === "NEW") {
        toggleNew.classList.add("active");
        toggleFind.classList.remove("active");
        
        // Lock ID input to read-only during data entry to protect sequential integrity
        customerId.readOnly = true; 
        clearFields();

        try {
            // Request max(id) + 1 context calculation directly from backend routing logic
            const response = await fetch(`${API_BASE_URL}/new-id`);
            if (response.ok) {
                const data = await response.json();
                customerId.value = data.nextId;
            }
        } catch (err) {
            console.error("Error retrieving sequential ID assignment:", err);
        }
        
        captureSnapshot();
    } else {
        toggleFind.classList.add("active");
        toggleNew.classList.remove("active");
        
        // Unlock ID input for search and browsing operations
        customerId.readOnly = false;
        customerId.value = "";
        clearFields();
        captureSnapshot();
    }
}

// Mode Toggle Event Listeners
toggleFind.addEventListener("click", () => {
    if (activeMode === "FIND") return;
    setFormMode("FIND");
});

toggleNew.addEventListener("click", async () => {
    if (activeMode === "NEW") return;
    
    if (dataIsMutated() && customerName.value.trim() !== "") {
        Swal.fire({
            title: "Unsaved Modifications",
            text: "Switching modes will discard unsaved entry modifications. Proceed?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, discard"
        }).then((result) => { if (result.isConfirmed) setFormMode("NEW"); });
    } else {
        setFormMode("NEW");
    }
});

// Live dynamic database record fetching listener
customerId.addEventListener("input", async () => {
    // Blocks execution immediately if user is inside the NEW Entry mode matrix
    if (activeMode === "NEW") return;

    const id = customerId.value.trim();
    if (!id) { clearFields(); captureSnapshot(); return; }

    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if (!response.ok) { clearFields(); captureSnapshot(); return; }

        const data = await response.json();
        customerName.value = data.customerName || "";
        customerAddress.value = data.customerAddress || "";
        customerPhone.value = data.customerPhone || "";
        captureSnapshot();
    } catch (err) {
        console.error(err);
    }
});

// SAVE (Handles both POST Insertions and PUT Updates cleanly)
saveBtn.addEventListener("click", async () => {
    const phoneRegex = /^[0-9]{10}$/;

    if (!customerName.value.trim() || !customerAddress.value.trim() || !customerPhone.value.trim()) {
        Swal.fire({ icon: "error", title: "Missing Required Fields", text: "Please populate all fields with asterisks." });
        return;
    }
    if (!phoneRegex.test(customerPhone.value.trim())) {
        Swal.fire({ icon: "error", title: "Invalid Data Parameter", text: "Phone records must contain exactly 10 digits." });
        return;
    }

    // UPDATE ROUTE
    if (activeMode === "FIND") {
        const id = customerId.value.trim();
        if (!id) { Swal.fire({ icon: "error", title: "ID Missing", text: "Provide a valid target Customer ID to edit." }); return; }

        if (!dataIsMutated()) {
            Swal.fire({ icon: "info", title: "No Changes Detected", text: "Please enter new changes before clicking Save." });
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName: customerName.value.trim(),
                    customerAddress: customerAddress.value.trim(),
                    customerPhone: customerPhone.value.trim()
                })
            });
            const data = await response.json();
            Swal.fire({ icon: "success", title: data.message || "Customer Updated Successfully", timer: 1500, showConfirmButton: false });
            captureSnapshot();
        } catch (err) { console.error(err); }

    // INSERT ROUTE
    } else {
        try {
            const response = await fetch(API_BASE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName: customerName.value.trim(),
                    customerAddress: customerAddress.value.trim(),
                    customerPhone: customerPhone.value.trim()
                })
            });
            const data = await response.json();
            Swal.fire({ icon: "success", title: data.message || "Customer Registered", timer: 1500, showConfirmButton: false });
            clearFields();
            setFormMode("FIND");
        } catch (err) { console.error(err); }
    }
});

// Navigation intercept prompt helper layout logic
async function verifyNavigationSafety() {
    if (dataIsMutated() && customerName.value.trim() !== "") {
        const check = await Swal.fire({
            title: "Data Won't Be Saved",
            text: "You have unsaved changes. Do you want to discard them and navigate?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#28a745",
            cancelButtonColor: "#dc3545",
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

    let id = customerId.value.trim();
    if (!id || activeMode === "NEW") id = 0;

    try {
        const response = await fetch(`${API_BASE_URL}/next/${id}`);
        if (!response.ok) { Swal.fire({ icon: "info", title: "End of dataset reached" }); return; }

        const data = await response.json();
        setFormMode("FIND");
        customerId.value = data.customerId;
        customerName.value = data.customerName || "";
        customerAddress.value = data.customerAddress || "";
        customerPhone.value = data.customerPhone || "";
        captureSnapshot();
    } catch (err) { console.error(err); }
});

// PREVIOUS
document.getElementById("previous-btn").addEventListener("click", async () => {
    let id = customerId.value.trim();
    if (!id || activeMode === "NEW") { 
        Swal.fire({ icon: "info", title: "Missing ID", text: "Please enter an active reference code or switch to Find mode." }); 
        return; 
    }

    const isSafe = await verifyNavigationSafety();
    if (!isSafe) return;

    try {
        const response = await fetch(`${API_BASE_URL}/previous/${id}`);
        if (!response.ok) { Swal.fire({ icon: "info", title: "Beginning of dataset reached" }); return; }

        const data = await response.json();
        setFormMode("FIND");
        customerId.value = data.customerId;
        customerName.value = data.customerName || "";
        customerAddress.value = data.customerAddress || "";
        customerPhone.value = data.customerPhone || "";
        captureSnapshot();
    } catch (err) { console.error(err); }
});
