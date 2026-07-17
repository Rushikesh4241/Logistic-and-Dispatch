const deliveryId = document.getElementById("delivery-id");
const orderId = document.getElementById("order-id");
const deliveryDate = document.getElementById("delivery-date");
const remarks = document.getElementById("remarks");
const proofOfDelivery = document.getElementById("proof");

const registerBtn = document.getElementById("register-btn");
const updateBtn = document.getElementById("update-btn");
const prevNext = document.getElementById("prev-next");
const findBtn = document.getElementById("find-btn");
const newBtn = document.getElementById("new-btn");

const API_BASE_URL = "http://localhost:3000/delivery";

let findMode = true;

function setFindMode(isFindMode) {

    findMode = isFindMode;
    findBtn.classList.toggle("active", findMode);
    newBtn.classList.toggle("active", !findMode);

    if (!findMode) {
        toggleFormMode(false);
    }
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

    if (!findMode) {
        return;
    }

    const id = deliveryId.value.trim();

    if (!id) {

        clearFields();

        toggleFormMode(false);

        return;
    }

    await lookupDeliveryById();
});


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


if (findBtn) {

    findBtn.addEventListener("click", () => {

        setFindMode(true);

        if (deliveryId.value.trim()) {
            lookupDeliveryById();
        }
    });
}


if (newBtn) {

    newBtn.addEventListener("click", async () => {
        setFindMode(false);

        clearFields();

        const nextId = await getNextDeliveryId();

        if (nextId) {
            deliveryId.value = nextId;
        }

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


document.getElementById("next-btn").addEventListener("click", async () => {

    let id = deliveryId.value.trim();

    if (!id) {
        id = 0;
    }

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

    } catch (err) {
        console.error(err);
    }

});

document.getElementById("previous-btn").addEventListener("click", async () => {

    let id = deliveryId.value.trim();

    if (!id) {
        return;
    }

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

try {
    const popoverTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.forEach((el) => new bootstrap.Popover(el));

} catch (e) {
}
