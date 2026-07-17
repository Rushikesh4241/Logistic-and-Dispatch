const toggleLogin = document.getElementById("login");

const toggleRegister = document.getElementById("register");

const formLogin = document.getElementById("form-login");

const formRegister = document.getElementById("form-register");


toggleLogin.addEventListener("click", () => {

  toggleLogin.classList.add("active");

  toggleRegister.classList.remove("active");

  formLogin.classList.remove("d-none");

  formRegister.classList.add("d-none");

});


toggleRegister.addEventListener("click", () => {

  toggleLogin.classList.remove("active");

  toggleRegister.classList.add("active");

  formLogin.classList.add("d-none");

  formRegister.classList.remove("d-none");

});


const login = document.getElementById("form-login");


login.addEventListener("submit", async function loginUser(event) {

  event.preventDefault();


  const username = document.getElementById("username").value.trim();

  const password = document.getElementById("password").value.trim();


  if (!username || !password) {

    alert("Please enter your username and password");

    return;

  }


  try {

    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password
      })
    });


    if (!response.ok) {

      const errorData = await response.json().catch(() => null);

      const errorMessage = errorData?.message || "Login failed";

      alert(errorMessage);

      return;

    }


    const data = await response.json();


    if (data.success) {

        window.location.href = data.redirect;

    }

    else {

        alert(data.message);

    }

  } catch (error) {

    console.error("Login error:", error);

    alert("An error occurred while logging in. Please try again.");

  }

});
