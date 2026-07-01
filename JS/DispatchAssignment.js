const API_BASE_URL = "http://localhost:3000/dispatch-assignment";

const assignmentId = document.getElementById("assignment-id");
const orderId = document.getElementById("order-id");
const driverId = document.getElementById("driver-id");
const vehicleId = document.getElementById("vehicle-id");
const dateTime = document.getElementById("date-time");

const registerBtn = document.getElementById("register-btn");
const updateBtn = document.getElementById("update-btn");
const prevNext = document.getElementById("prev-next");

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
    assignmentId.value = "";
    orderId.value = "";
    driverId.value = "";
    vehicleId.value = "";
    dateTime.value = "";
}

assignmentId.addEventListener("input", async () => {
    const id = assignmentId.value.trim();

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
        assignmentId.value = data.assignmentId || "";
        orderId.value = data.orderId || "";
        driverId.value = data.driverId || "";
        vehicleId.value = data.vehicleId || "";
        
        if (data.assignedDate) {
            dateTime.value = data.assignedDate.split("T")[0];
        } else {
            dateTime.value = "";
        }

        toggleFormMode(true);
    } catch (err) {
        console.error("Connection error", err);
    }
});

registerBtn.addEventListener("click", async () => {
    if (!orderId.value || !driverId.value || !vehicleId.value) {
        Swal.fire({
            position: "center",
            icon: "info",
            title: "Please fill in all required fields",
            showConfirmButton: true
        });
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                orderId: orderId.value,
                driverId: driverId.value,
                vehicleId: vehicleId.value,
                assignedDate: dateTime.value
            }),
        });

        const data = await response.json();

        Swal.fire({
            position: "center",
            icon: "success",
            title: data.message || "Assignment Saved",
            showConfirmButton: false,
            timer: 1500,
        });
        
        clearFields();
        toggleFormMode(false);
    } catch (err) {
        console.error(err);
    }
});


updateBtn.addEventListener("click", async () => {
    const id = assignmentId.value.trim();

    if (!id) {
        Swal.fire({
            position: "center",
            icon: "error",
            title: "No valid Assignment ID specified for update",
            showConfirmButton: true
        });
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
                assignedDate: dateTime.value
            }),
        });

        const data = await response.json();

        Swal.fire({
            position: "center",
            icon: "success",
            title: data.message || "Assignment Updated",
            showConfirmButton: false,
            timer: 1500,
        });
    } catch (err) {
        console.error(err);
    }
});


document.getElementById("previous-btn").addEventListener("click", async () => {
    let id = assignmentId.value.trim();
    if (!id) return;

    try {
        const response = await fetch(`${API_BASE_URL}/previous/${id}`);

        if (!response.ok) {
            Swal.fire({
                position: "center",
                icon: "info",
                title: "Reached the beginning of Assignment list",
                showConfirmButton: false,
                timer: 1500,
            });
            return;
        }

        const data = await response.json();
        assignmentId.value = data.assignmentId || "";
        orderId.value = data.orderId || "";
        driverId.value = data.driverId || "";
        vehicleId.value = data.vehicleId || "";
        
        if (data.assignedDate) {
            dateTime.value = data.assignedDate.split("T")[0];
        } else {
            dateTime.value = "";
        }
        
        toggleFormMode(true);
    } catch (err) {
        console.error(err);
    }
});

document.getElementById("next-btn").addEventListener("click", async () => {
    let id = assignmentId.value.trim();
    if (!id) id = 0;

    try {
        const response = await fetch(`${API_BASE_URL}/next/${id}`);

        if (!response.ok) {
            Swal.fire({
                position: "center",
                icon: "info",
                title: "Reached the End of Assignment list",
                showConfirmButton: false,
                timer: 1500,
            });
            return;
        }

        const data = await response.json();
        assignmentId.value = data.assignmentId || "";
        orderId.value = data.orderId || "";
        driverId.value = data.driverId || "";
        vehicleId.value = data.vehicleId || "";
        
        if (data.assignedDate) {
            dateTime.value = data.assignedDate.split("T")[0];
        } else {
            dateTime.value = "";
        }
        
        toggleFormMode(true);
    } catch (err) {
        console.error(err);
    }
});

document.getElementById("clear-btn").addEventListener("click", () => {
    clearFields();
    toggleFormMode(false);
});


document.addEventListener("DOMContentLoaded", async () => {
    try {
        const resOrders = await fetch(`${API_BASE_URL}/orders`);
        const dataOrders = await resOrders.text();
        document.getElementById("order-id").innerHTML = dataOrders;

        const resDrivers = await fetch(`${API_BASE_URL}/drivers`);
        const dataDrivers = await resDrivers.text();
        document.getElementById("driver-id").innerHTML = dataDrivers;

        const resVehicles = await fetch(`${API_BASE_URL}/vehicles`);
        const dataVehicles = await resVehicles.text();
        document.getElementById("vehicle-id").innerHTML = dataVehicles;

    } 
    catch (err) {
        console.error("Error loading structural initialization selectors:", err);
    }
});