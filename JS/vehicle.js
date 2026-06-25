const toggleRegister = document.getElementById("toggle-register");
const toggleUpdate = document.getElementById("toggle-update");
const toggleDelete = document.getElementById("toggle-delete");

const fetchId = document.getElementById("fetch-id");

const registerBtn = document.getElementById("register-btn");
const updateBtn = document.getElementById("update-btn");
const deleteBtn = document.getElementById("delete-btn");


toggleRegister.addEventListener("click", () => {
  toggleRegister.classList.add("active");
  toggleUpdate.classList.remove("active");
  toggleDelete.classList.remove("active");

  fetchId.classList.add("d-none");
  registerBtn.classList.remove("d-none");
  updateBtn.classList.add("d-none");
  deleteBtn.classList.add("d-none");
});

toggleUpdate.addEventListener("click", () => {
  toggleRegister.classList.remove("active");
  toggleUpdate.classList.add("active");
  toggleDelete.classList.remove("active");

  fetchId.classList.remove("d-none");

  registerBtn.classList.add("d-none");
  updateBtn.classList.remove("d-none");
  deleteBtn.classList.add("d-none");
});

toggleDelete.addEventListener("click", () => {
  toggleRegister.classList.remove("active");
  toggleUpdate.classList.remove("active");
  toggleDelete.classList.add("active");

  fetchId.classList.remove("d-none");
  registerBtn.classList.add("d-none");
  updateBtn.classList.add("d-none");
  deleteBtn.classList.remove("d-none");
});



const vehicleId = document.getElementById("vehicle-id");
const vehicleNumber = document.getElementById("vehicle-number");
const vehicleType = document.getElementById("vehicleType");
const capacity = document.getElementById("capacity");

document.getElementById("fetch-btn").addEventListener("click", async () => {
    const id = vehicleId.value.trim();
    
    if (!id) {
        alert("Enter Vehicle ID !");
        return
    }

    try {
        const response = await fetch (`http://localhost:3000/vehicle/${id}`);

        if (!response.ok) {
            throw new Error("Vehicle not found");
        }

        const data = await response.json();
        vehicleNumber.value = data.vehicleNumber;
        vehicleType.value = data.vehicleType;
        capacity.value = data.capacity;
    }
    catch (err){
        console.error(err);
        alert("Vehicle not found");
    }
});

document.getElementById("register-btn").addEventListener("click", async () => {

    try {
        const response = await fetch ("http://localhost:3000/vehicle", {
            method: "POST",
            headers: {
                "Content-type":
                "application/json"
            },
            body: JSON.stringify({
                vehicleNumber: vehicleNumber.value.trim(),
                vehicleType: vehicleType.value.trim(),
                capacity: capacity.value.trim()
            })

        });

        const data = await response.json();

        alert(data.message);
    }
    catch(err) {
        console.error(err);
        alert("Unable to add Vehicle");
    }
});

document.getElementById("update-btn").addEventListener("click", async () => {

    const id = vehicleId.value.trim();

    if (!id) {
        alert("Enter valid Vehicle ID to Update")
    }

    try {
        const response = await fetch (`http://localhost:3000/vehicle/${id}`, {
            method: "PUT",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                vehicleNumber: vehicleNumber.value,
                vehicleType: vehicleType.value,
                capacity: capacity.value
            })
        });
        const data = await response.json();

        alert(data.message);
    }
    catch(err) {
        console.error(err);
        alert("Unable to add Vehicle");
    }
});

document.getElementById("delete-btn").addEventListener("click", async () => {

    const id = vehicleId.value.trim();

    if (!id) {
        alert("Enter valid Vehicle ID to Update")
    }

    try {
        const response = await fetch (`http://localhost:3000/vehicle/${id}`, {
            method: "DELETE",
        });

        const data = await response.json();
        alert(data.message);
    }
    catch(err) {
        console.error(err);
        alert("Unable to add Vehicle");
    }
});

document.getElementById("clear-btn").addEventListener("click", async () => {
    vehicleId.value = "";
    vehicleNumber.value = "";
    vehicleType.value = "";
    capacity.value = "";
});
