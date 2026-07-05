const customerId = document.getElementById("id");
const customerName = document.getElementById("name");
const customerAddress = document.getElementById("address");
const customerPhone = document.getElementById("phone");

const registerBtn = document.getElementById("register-btn");
const updateBtn = document.getElementById("update-btn");
const prevNext = document.getElementById("prev-next");

const API_BASE_URL = "http://localhost:3000/customer";

function toggleFormMode(isUpdateMode) {
    if (isUpdateMode) {
        registerBtn.classList.add("d-none");
        updateBtn.classList.remove("d-none");
        prevNext.classList.remove("d-none");
    } else {
        registerBtn.classList.remove("d-none");
        updateBtn.classList.add("d-none");
        prevNext.style.setProperty("display", "none", "important");
        prevNext.classList.add("d-none");
    }
}


function clearFields() {
    customerName.value = "";
    customerAddress.value = "";
    customerPhone.value = "";
}

customerId.addEventListener("input", async () => {
    const id = customerId.value.trim();

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

            Swal.fire({
            position: "center",
            icon: "error",
            title: "Enter valid Customer ID to Update or view, Leave blank to register",
            showConfirmButton: true
        });

            return;
        }

        const data = await response.json();
        
        customerName.value = data.customerName || "";
        customerAddress.value = data.customerAddress || "";
        customerPhone.value = data.customerPhone || "";
        
        toggleFormMode(true);

    } catch (err) {
        console.error("Live fetch connection error:", err);
    }
});


registerBtn.addEventListener("click", async () => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!customerName.value.trim() || !customerAddress.value.trim() || !customerPhone.value.trim()) {
        Swal.fire({
            position: "center",
            icon: "error",
            title: "Please fill in all required fields",
            showConfirmButton: true
        });
        return; 
    }

    if (!phoneRegex.test(customerPhone.value.trim())) {
        Swal.fire({
            position: "center",
            icon: "error",
            title: "Phone number must be 10 digits",
            showConfirmButton: true
        });
        return;
    }

    try {
        const response = await fetch(API_BASE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customerName: customerName.value.trim(),
                customerAddress: customerAddress.value.trim(),
                customerPhone: customerPhone.value.trim(),
            }),
        });

        const data = await response.json();

        Swal.fire({
            position: "center",
            icon: "success",
            title: data.message || "Customer Registered Successfully",
            showConfirmButton: false,
            timer: 1500,
        });

        customerId.value = "";
        clearFields();
        toggleFormMode(false);

    } catch (err) {
        console.error(err);
        Swal.fire({
            position: "center",
            icon: "error",
            title: "Unable to add Customer",
            showConfirmButton: false,
            timer: 1500,
        });
    }
});

updateBtn.addEventListener("click", async () => {
    const id = customerId.value.trim();

    if (!id) {
        Swal.fire({
            position: "center",
            icon: "error",
            title: "No valid Customer ID specified for update",
            showConfirmButton: false,
            timer: 1500,
        });
        return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!customerName.value.trim() || !customerAddress.value.trim() || !customerPhone.value.trim()) {
        Swal.fire({
            position: "center",
            icon: "error",
            title: "Please fill in all required fields",
            showConfirmButton: true
        });
        return; 
    }

    if (!phoneRegex.test(customerPhone.value.trim())) {
        Swal.fire({
            position: "center",
            icon: "error",
            title: "Phone number must be 10 digits",
            showConfirmButton: true
        });
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customerName: customerName.value.trim(),
                customerAddress: customerAddress.value.trim(),
                customerPhone: customerPhone.value.trim(),
            }),
        });
        const data = await response.json();

        Swal.fire({
            position: "center",
            icon: "success",
            title: data.message || "Customer Record Updated",
            showConfirmButton: false,
            timer: 1500,
        });

    } catch (err) {
        console.error(err);
        Swal.fire({
            position: "center",
            icon: "error",
            title: "Unable to update Customer",
            showConfirmButton: false,
            timer: 1500,
        });
    }
});

document.getElementById("clear-btn").addEventListener("click", () => {
    customerId.value = "";
    clearFields();
    toggleFormMode(false);
});

document.getElementById("next-btn").addEventListener("click", async () => {
    let id = customerId.value.trim();
    if (!id) id = 0;

    try {
        const response = await fetch(`${API_BASE_URL}/next/${id}`);

        if (!response.ok) {
            Swal.fire({
                position: "center",
                icon: "info",
                title: "End of Customers list reached",
                showConfirmButton: false,
                timer: 1500,
            });
            return;
        }

        const data = await response.json();
        customerId.value = data.customerId;
        customerName.value = data.customerName || "";
        customerAddress.value = data.customerAddress || "";
        customerPhone.value = data.customerPhone || "";
        
        toggleFormMode(true);
    } catch (err) {
        console.error(err);
    }
});

document.getElementById("previous-btn").addEventListener("click", async () => {
    let id = customerId.value.trim();
    if (!id) return;

    try {
        const response = await fetch(`${API_BASE_URL}/previous/${id}`);

        if (!response.ok) {
            Swal.fire({
                position: "center",
                icon: "info",
                title: "Reached the beginning of Customer list",
                showConfirmButton: false,
                timer: 1500,
            });
            return;
        }

        const data = await response.json();
        customerId.value = data.customerId;
        customerName.value = data.customerName || "";
        customerAddress.value = data.customerAddress || "";
        customerPhone.value = data.customerPhone || "";
        
        toggleFormMode(true);
    } catch (err) {
        console.error(err);
    }
});

