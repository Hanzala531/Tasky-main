

function toggleForms() {
    document.getElementById('loginForm').style.display =
        document.getElementById('loginForm').style.display === 'none' ? 'block' : 'none';
    document.getElementById('signupForm').style.display =
        document.getElementById('signupForm').style.display === 'none' ? 'block' : 'none';
}
const apiBaseUrl = 'https://taskybackend-sepia.vercel.app/';
async function signup() {
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageElement = document.getElementById('signupMessage');

    if (password !== confirmPassword) {
        messageElement.textContent = "Passwords do not match!";
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (response.ok) {
            messageElement.style.color = "green";
            messageElement.textContent = "Signup successful! Please login.";
            alert("Signup successful! Please login.");
            toggleForms();
        } else {
            messageElement.textContent = data.message || "Signup failed!";
        }
    } catch (error) {
        messageElement.textContent = "Error connecting to server!";
    }
}

async function login() {
    const email = document.getElementById('loginUsername').value.trim(); // Adjust if using email instead of username
    const password = document.getElementById('loginPassword').value;
    const messageElement = document.getElementById('loginMessage');

    if (!email || !password) {
        messageElement.textContent = "Please fill in both fields!";
        messageElement.style.color = "red";
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        console.log("Login Response:", data); // Debugging step

        if (!response.ok) {
            if (data.message && data.message.includes("User not found")) {
                messageElement.textContent = "Account does not exist. Please sign up!";
            } else if (data.message && data.message.includes("Invalid credentials")) {
                messageElement.textContent = "Incorrect email or password!";
            } else {
                messageElement.textContent = data.message || "Login failed!";
            }
            messageElement.style.color = "red";
            return;
        }

        // If login is successful
        const name = data.loggedInUser.username;
        localStorage.setItem("taskyUsername", name);
        localStorage.setItem("token", data.accessToken);

        messageElement.style.color = "green";
        messageElement.textContent = "Login successful!";
        alert("Login successful!");
        window.location.href = "../index.html";

    } catch (error) {
        console.error("Error:", error);
        messageElement.textContent = "Error connecting to the server!";
        messageElement.style.color = "red";
    }
}
