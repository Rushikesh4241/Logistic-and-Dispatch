const toggleRegister = document.getElementById("toggle-register");
const toggleUpdate = document.getElementById("toggle-update");

const fetchId = document.getElementById("fetch-id");
const prevNext = document.getElementById("prev-next");

const registerBtn = document.getElementById("register-btn");
const updateBtn = document.getElementById("update-btn");


toggleRegister.addEventListener("click", () => {
    toggleRegister.classList.add("active");
    toggleUpdate.classList.remove("active");

    fetchId.classList.add("d-none");

    registerBtn.classList.remove("d-none");
    updateBtn.classList.add("d-none");

    prevNext.classList.add("d-none");
});

toggleUpdate.addEventListener("click", () => {
    toggleRegister.classList.remove("active");
    toggleUpdate.classList.add("active");

    fetchId.classList.remove("d-none");

    registerBtn.classList.add("d-none");
    updateBtn.classList.remove("d-none");

    prevNext.classList.remove("d-none");
});

const driverId = document.getElementById("driver-id");
const driverName = document.getElementById("driver-name");
const driverPhone = document.getElementById("driver-phone");
const licenseNumber = document.getElementById("license");

document.getElementById("fetch-btn").addEventListener("click", async () => {
    const id = driverId.value.trim();

    if (!id) {
        Swal.fire({
            position: "center",
            icon: "error",
            title: "Enter Driver ID",
            showConfirmButton: false,
            timer: 1500,
        });
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/driver/${id}`);

        if (!response.ok) {
            throw new Error("Driver not found");
        }

        const data = await response.json();
        driverName.value = data.driverName;
        driverPhone.value = data.driverPhone;
        licenseNumber.value = data.licenseNumber;
    } catch (err) {
        console.error(err);

        Swal.fire({
            position: "center",
            icon: "error",
            title: "Driver not found",
            showConfirmButton: false,
            timer: 1500,
        });
    }
});

document.getElementById("register-btn").addEventListener("click", async () => {

    if (!driverName.value || !driverPhone.value || !licenseNumber.value) {
        Swal.fire({
            position: "center",
            icon: "error",
            title: "Please fill in all fields",
            showConfirmButton: true
        });
        return; 
    }

    try {
        const response = await fetch("http://localhost:3000/driver", {
            method: "POST",
            headers: {
                "Content-type": "application/json",
            },
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
            title: data.message,
            showConfirmButton: false,
            timer: 1500,
        });
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

document.getElementById("update-btn").addEventListener("click", async () => {
    const id = driverId.value.trim();

    if (!id) {
        Swal.fire({
            position: "center",
            icon: "error",
            title: "Enter valid Driver ID to Update",
            showConfirmButton: false,
            timer: 1500,
        });
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/driver/${id}`, {
            method: "PUT",
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify({
                driverName: driverName.value,
                driverPhone: driverPhone.value,
                licenseNumber: licenseNumber.value,
            }),
        });
        const data = await response.json();

        Swal.fire({
            position: "center",
            icon: "success",
            title: data.message,
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


document.getElementById("clear-btn").addEventListener("click", async () => {
    driverId.value = "";
    driverName.value = "";
    driverPhone.value = "";
    licenseNumber.value = "";
});

document.getElementById("next-btn").addEventListener("click", async () => {
    let id = driverId.value.trim();

    if (!id || id === "") {
        id = 0;
    }

    try {
        const response = await fetch (`http://localhost:3000/driver/next/${id}`);

        if (!response.ok) {
            Swal.fire({
            position: "center",
            icon: "success",
            title: "End of Drivers",
            showConfirmButton: false,
            timer: 1500,
        });
        return;
        }

        const data = await response.json();
        driverId.value = data.driverId;
        driverName.value = data.driverName;
        driverPhone.value = data.driverPhone;
        licenseNumber.value = data.licenseNumber;
    }
    catch (err) {
        Swal.fire({
            position: "center",
            icon: "success",
            title: "End of Drivers",
            showConfirmButton: false,
            timer: 1500,
        });
        return;
    }
});

document.getElementById("previous-btn").addEventListener("click", async () => {
    let id = driverId.value.trim();

    if (!id || id === "") {
        id = 2;
    }

    try {
        const response = await fetch(`http://localhost:3000/driver/previous/${id}`);

    if (!response.ok) {
        Swal.fire({
            position: "center",
            icon: "success",
            title: "End of Drivers",
            showConfirmButton: false,
            timer: 1500,
        });
        return;
    };

    const data = await response.json();
    driverId.value = data.driverId;
    driverName.value = data.driverName;
    driverPhone.value = data.driverPhone;
    licenseNumber.value = data.licenseNumber;
    }
    catch (err) {
        Swal.fire({
            position: "center",
            icon: "success",
            title: "End of Drivers",
            showConfirmButton: false,
            timer: 1500,
        })
        return;
    }
});
