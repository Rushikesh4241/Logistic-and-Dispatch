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



const customerId = document.getElementById("id");
const customerName = document.getElementById("name");
const customerAddress = document.getElementById("address");
const customerPhone = document.getElementById("phone");

document.getElementById("fetch-btn").addEventListener("click", async () => {
    const id = customerId.value.trim();
    
    if (!id) {
        alert("Enter Customer ID !");
        return
    }

    try {
        const response = await fetch (`http://localhost:3000/customer/${id}`);

        if (!response.ok) {
            throw new Error("Customer not found");
        }

        const data = await response.json();
        customerName.value = data.customerName;
        customerAddress.value = data.customerAddress;
        customerPhone.value = data.customerPhone;
    }
    catch (err){
        console.error(err);
        alert("Customer not found");
    }
});

document.getElementById("register-btn").addEventListener("click", async () => {

    try {
        const response = await fetch ("http://localhost:3000/customer", {
            method: "POST",
            headers: {
                "Content-type":
                "application/json"
            },
            body: JSON.stringify({
                customerName: customerName.value.trim(),
                customerAddress: customerAddress.value.trim(),
                customerPhone: customerPhone.value.trim()
            })

        });

        const data = await response.json();

        alert(data.message);
    }
    catch(err) {
        console.error(err);
        alert("Unable to add Customer");
    }
});

document.getElementById("update-btn").addEventListener("click", async () => {

    const id = customerId.value.trim();

    if (!id) {
        alert("Enter valid Customer ID to Update")
    }

    try {
        const response = await fetch (`http://localhost:3000/customer/${id}`, {
            method: "PUT",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                customerName: customerName.value,
                customerAddress: customerAddress.value,
                customerPhone: customerPhone.value
            })
        });
        const data = await response.json();

        alert(data.message);
    }
    catch(err) {
        console.error(err);
        alert("Unable to add Customer");
    }
});

document.getElementById("delete-btn").addEventListener("click", async () => {

    const id = customerId.value.trim();

    if (!id) {
        alert("Enter valid Customer ID to Update")
    }

    try {
        const response = await fetch (`http://localhost:3000/customer/${id}`, {
            method: "DELETE",
        });

        const data = await response.json();
        alert(data.message);
    }
    catch(err) {
        console.error(err);
        alert("Unable to add Customer");
    }
});

document.getElementById("clear-btn").addEventListener("click", async () => {
    customerId.value = "";
    customerName.value = "";
    customerAddress.value = "";
    customerPhone.value = "";
});