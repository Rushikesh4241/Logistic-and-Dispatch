const API_BASE_URL = "http://localhost:3000/dispatch-order";

const orderId = document.getElementById("order-id");
const customerId = document.getElementById("customer-id");
const dispatchDate = document.getElementById("dispatch-date");
const source = document.getElementById("source");
const destination = document.getElementById("destination");
const status = document.getElementById("status");

const registerBtn = document.getElementById("register-btn");
const updateBtn = document.getElementById("update-btn");
const clearBtn = document.getElementById("clear-btn");
const prevNext = document.getElementById("prev-next");
const previousBtn = document.getElementById("previous-btn");
const nextBtn = document.getElementById("next-btn");

// Initialize customer dropdown on page load
document.addEventListener("DOMContentLoaded", async () => {
    await loadCustomers();
    
    clearBtn.addEventListener("click", clearFields);
    registerBtn.addEventListener("click", handleRegister);
    updateBtn.addEventListener("click", handleUpdate);
    previousBtn.addEventListener("click", loadPrevious);
    nextBtn.addEventListener("click", loadNext);

    // Tooltip initialization
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
});

// Load customers into dropdown
async function loadCustomers() {
    try {
        const response = await fetch(`${API_BASE_URL}/customers`);
        const htmlString = await response.text();
        customerId.innerHTML = htmlString;
    } catch (err) {
        console.error("Error loading customers:", err);
        customerId.innerHTML = '<option value="">Error Loading Customers</option>';
    }
}

function toggleFormMode(isUpdateMode) {
    if (isUpdateMode) {
        registerBtn.classList.add("d-none");
        updateBtn.classList.remove("d-none");
        prevNext.classList.remove("d-none");
        prevNext.style.setProperty("display", "inline-flex", "important");
    } else {
        registerBtn.classList.remove("d-none");
        updateBtn.classList.add("d-none");
        prevNext.style.setProperty("display", "none", "important");
        prevNext.classList.add("d-none");
    }
}

function clearFields() {
    orderId.value = "";
    customerId.value = "";
    dispatchDate.value = "";
    source.value = "";
    destination.value = "";
    status.value = "Pending";
    toggleFormMode(false);
}

// Fetch and load order data when Order ID is entered
orderId.addEventListener("input", async () => {
    const id = orderId.value.trim();

    if (!id) {
        clearFields();
        toggleFormMode(false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);

        if (!response.ok) {
            clearFields();
            toggleFormMode(false);
            return;
        }

        const data = await response.json();
        orderId.value = data.orderId || "";
        customerId.value = data.customerId || "";
        source.value = data.source || "";
        destination.value = data.destination || "";
        status.value = data.status || "Pending";
        
        if (data.dispatchDate) {
            dispatchDate.value = data.dispatchDate.split("T")[0];
        } else {
            dispatchDate.value = "";
        }

        toggleFormMode(true);
    } catch (err) {
        console.error("Connection error", err);
    }
});

async function handleRegister() {
    // Validation
    if (!customerId.value || !source.value || !destination.value) {
        Swal.fire({
            position: "center",
            icon: "warning",
            title: "Required Fields Missing",
            text: "Please fill in Customer ID, Source, and Destination",
            showConfirmButton: true
        });
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customerId: customerId.value,
                source: source.value,
                destination: destination.value,
                dispatchDate: dispatchDate.value || null,
                status: status.value
            }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            Swal.fire({
                position: "center",
                icon: "success",
                title: "Success",
                text: data.message || "Dispatch Order created successfully",
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                clearFields();
            });
        } else {
            Swal.fire({
                position: "center",
                icon: "error",
                title: "Error",
                text: data.message || "Failed to create Dispatch Order",
                showConfirmButton: true
            });
        }
    } catch (err) {
        console.error("Error:", err);
        Swal.fire({
            position: "center",
            icon: "error",
            title: "Connection Error",
            text: "Failed to connect to server",
            showConfirmButton: true
        });
    }
}

async function handleUpdate() {
    // Validation
    if (!orderId.value || !customerId.value || !source.value || !destination.value) {
        Swal.fire({
            position: "center",
            icon: "warning",
            title: "Required Fields Missing",
            text: "Please fill in all required fields",
            showConfirmButton: true
        });
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${orderId.value}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customerId: customerId.value,
                source: source.value,
                destination: destination.value,
                dispatchDate: dispatchDate.value || null,
                status: status.value
            }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            Swal.fire({
                position: "center",
                icon: "success",
                title: "Success",
                text: data.message || "Dispatch Order updated successfully",
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                clearFields();
            });
        } else {
            Swal.fire({
                position: "center",
                icon: "error",
                title: "Error",
                text: data.message || "Failed to update Dispatch Order",
                showConfirmButton: true
            });
        }
    } catch (err) {
        console.error("Error:", err);
        Swal.fire({
            position: "center",
            icon: "error",
            title: "Connection Error",
            text: "Failed to connect to server",
            showConfirmButton: true
        });
    }
}

async function loadPrevious() {
    if (!orderId.value) return;

    try {
        const response = await fetch(`${API_BASE_URL}/previous/${orderId.value}`);

        if (!response.ok) {
            Swal.fire({
                position: "center",
                icon: "info",
                title: "Information",
                text: "No previous records found",
                showConfirmButton: true
            });
            return;
        }

        const data = await response.json();
        orderId.value = data.orderId || "";
        customerId.value = data.customerId || "";
        source.value = data.source || "";
        destination.value = data.destination || "";
        status.value = data.status || "Pending";
        
        if (data.dispatchDate) {
            dispatchDate.value = data.dispatchDate.split("T")[0];
        } else {
            dispatchDate.value = "";
        }
    } catch (err) {
        console.error("Error loading previous record:", err);
    }
}

async function loadNext() {
    if (!orderId.value) return;

    try {
        const response = await fetch(`${API_BASE_URL}/next/${orderId.value}`);

        if (!response.ok) {
            Swal.fire({
                position: "center",
                icon: "info",
                title: "Information",
                text: "No more records found",
                showConfirmButton: true
            });
            return;
        }

        const data = await response.json();
        orderId.value = data.orderId || "";
        customerId.value = data.customerId || "";
        source.value = data.source || "";
        destination.value = data.destination || "";
        status.value = data.status || "Pending";
        
        if (data.dispatchDate) {
            dispatchDate.value = data.dispatchDate.split("T")[0];
        } else {
            dispatchDate.value = "";
        }
    } catch (err) {
        console.error("Error loading next record:", err);
    }
}
