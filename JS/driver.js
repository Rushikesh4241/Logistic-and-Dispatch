const driverId = document.getElementById("driver-id");
const driverName = document.getElementById("driver-name");
const driverPhone = document.getElementById("driver-phone");
const licenseNumber = document.getElementById("license");

const registerBtn = document.getElementById("register-btn");
const updateBtn = document.getElementById("update-btn");
const prevNext = document.getElementById("prev-next");

const API_BASE_URL = "http://localhost:3000/driver";

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
    driverName.value = "";
    driverPhone.value = "";
    licenseNumber.value = "";
}


driverId.addEventListener("input", async () => {
    const id = driverId.value.trim();

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
        
        driverName.value = data.driverName || "";
        driverPhone.value = data.driverPhone || "";
        licenseNumber.value = data.licenseNumber || "";
        
        toggleFormMode(true);

    } catch (err) {
        console.error("Live fetch connection failure:", err);
    }
});


// REGISTER (POST)
registerBtn.addEventListener("click", async () => {
    if (!driverName.value.trim() || !driverPhone.value.trim() || !licenseNumber.value.trim()) {
        Swal.fire({
            position: "center",
            icon: "error",
            title: "Please fill in all required fields",
            showConfirmButton: true
        });
        return; 
    }

    try {
        const response = await fetch(API_BASE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                driverName: driverName.value.trim(),
                driverPhone: driverPhone.value.trim(),
                licenseNumber: licenseNumber.value.trim(),
            }),
        });

        const data = await response.json();

        Swal.fire({
            position: "center",
            icon: "success",
            title: data.message || "Driver Registered Successfully",
            showConfirmButton: false,
            timer: 1500,
        });

        // Clear view space upon successful validation
        driverId.value = "";
        clearFields();
        toggleFormMode(false);

    } catch (err) {
        console.error(err);
        Swal.fire({
            position: "center",
            icon: "error",
            title: "Unable to add Driver",
            showConfirmButton: false,
            timer: 1500,
        });
    }
});

// UPDATE (PUT)
updateBtn.addEventListener("click", async () => {
    const id = driverId.value.trim();

    if (!id) {
        Swal.fire({
            position: "center",
            icon: "error",
            title: "No valid Driver ID specified for update",
            showConfirmButton: false,
            timer: 1500,
        });
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                driverName: driverName.value.trim(),
                driverPhone: driverPhone.value.trim(),
                licenseNumber: licenseNumber.value.trim(),
            }),
        });
        const data = await response.json();

        Swal.fire({
            position: "center",
            icon: "success",
            title: data.message || "Driver Record Updated",
            showConfirmButton: false,
            timer: 1500,
        });

    } catch (err) {
        console.error(err);
        Swal.fire({
            position: "center",
            icon: "error",
            title: "Unable to update Driver",
            showConfirmButton: false,
            timer: 1500,
        });
    }
});

// CLEAR
document.getElementById("clear-btn").addEventListener("click", () => {
    driverId.value = "";
    clearFields();
    toggleFormMode(false);
});


// NEXT
document.getElementById("next-btn").addEventListener("click", async () => {
    let id = driverId.value.trim();
    if (!id) id = 0;

    try {
        const response = await fetch(`${API_BASE_URL}/next/${id}`);

        if (!response.ok) {
            Swal.fire({
                position: "center",
                icon: "info",
                title: "End of Drivers list reached",
                showConfirmButton: false,
                timer: 1500,
            });
            return;
        }

        const data = await response.json();
        driverId.value = data.driverId;
        driverName.value = data.driverName || "";
        driverPhone.value = data.driverPhone || "";
        licenseNumber.value = data.licenseNumber || "";
        
        toggleFormMode(true);
    } catch (err) {
        console.error(err);
    }
});

// PREVIOUS
document.getElementById("previous-btn").addEventListener("click", async () => {
    let id = driverId.value.trim();
    if (!id) return;

    try {
        const response = await fetch(`${API_BASE_URL}/previous/${id}`);

        if (!response.ok) {
            Swal.fire({
                position: "center",
                icon: "info",
                title: "Reached the beginning of Drivers list",
                showConfirmButton: false,
                timer: 1500,
            });
            return;
        }

        const data = await response.json();
        driverId.value = data.driverId;
        driverName.value = data.driverName || "";
        driverPhone.value = data.driverPhone || "";
        licenseNumber.value = data.licenseNumber || "";
        
        toggleFormMode(true);
    } catch (err) {
        console.error(err);
    }
});