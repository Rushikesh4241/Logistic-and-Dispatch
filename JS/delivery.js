const deliveryId = document.getElementById("delivery-id");
const orderId = document.getElementById("order-id");
const deliveryDate = document.getElementById("delivery-date");
const remarks = document.getElementById("remarks");
const proofOfDelivery = document.getElementById("proof");

const registerBtn = document.getElementById("register-btn");
const updateBtn = document.getElementById("update-btn");
const clearBtn = document.getElementById("clear-btn");

const API_BASE_URL = "http://localhost:3000/delivery";

function toggleFormMode(isUpdateMode) {
    registerBtn.classList.toggle("d-none", isUpdateMode);
    updateBtn.classList.toggle("d-none", !isUpdateMode);
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
    const id = deliveryId.value.trim();

    if (!id) {
        clearFields();
        toggleFormMode(false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);

        if (!response.ok) {
            clearFields();
            deliveryId.value = id;
            toggleFormMode(false);
            Swal.fire({
                position: "center",
                icon: "error",
                title: "No delivery found for that ID",
                showConfirmButton: true,
            });
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
});

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

clearBtn.addEventListener("click", () => {
    clearFields();
    toggleFormMode(false);
});

loadOrderIds();
toggleFormMode(false);
