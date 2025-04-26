document.addEventListener("DOMContentLoaded", function () {
  document.querySelector("#nameUser").innerHTML = ` ${localStorage.getItem(
    "taskyUsername"
  )}`;
  saveTimeToServer();
  showTimeWorked();
const apiBaseUrl = "https://taskybackend-sepia.vercel.app/api/v1/";
  const workedTime = document.querySelector("#workedTime");
  const percentageTime = document.querySelector("#timePercentage");
  

  const sidebarLinks = document.querySelectorAll(
    ".left-sidebar-content ul li a"
  );
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", function (event) {
      // event.preventDefault();
      sidebarLinks.forEach((l) => l.classList.remove("active"));
      this.classList.add("active");
      const linkId = this.id;
      updateContent(linkId);
    });
  });

  const startTimeTrackerBtn = document.querySelector(
    "#headerBox .header-right"
  );
  let startTime;
  let timerInterval;
  let elapsedTime = 0;
  const elapsedTimeDisplay = document.getElementById("elapsedTimeDisplay");
  const pauseSvg = document.createElement("img");
  pauseSvg.src = "./Svg/pause.svg";
  pauseSvg.alt = "Pause";
  pauseSvg.style.display = "none";
  startTimeTrackerBtn.appendChild(pauseSvg);

  startTimeTrackerBtn.addEventListener("click", function () {
    if (!timerInterval) {
      // Reset elapsedTime to start from zero
      elapsedTime = 0;
      startTime = Date.now();
      timerInterval = setInterval(updateTimeDisplay, 10);
      showTimeWorked();

      startTimeTrackerBtn.querySelector("p").textContent = "Pause Time Tracker";
      startTimeTrackerBtn.querySelector("img").style.display = "none";
      pauseSvg.style.display = "inline-block";
    } else {
      // Pause Timer
      clearInterval(timerInterval);
      timerInterval = null;

      startTimeTrackerBtn.querySelector("p").textContent = "Start Time Tracker";
      startTimeTrackerBtn.querySelector("img").src = "./Svg/playbtn.svg";
      startTimeTrackerBtn.querySelector("img").style.display = "inline-block";
      pauseSvg.style.display = "none";

      // Send elapsed time to the backend
      saveTimeToServer(elapsedTime);
    }
  });



  // Function to save time worked to the server
  function saveTimeToServer(elapsedTime) {
    console.log("Elapsed Time Before Sending:", elapsedTime);
  
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      console.error("Auth token not found!");
      return;
    }
  
    // Ensure elapsedTime is converted to a number
    const timeWorked = Number(elapsedTime);
    if (isNaN(timeWorked)) {
      console.error("Invalid timeWorked:", elapsedTime);
      return;
    }
  
    fetch(`${apiBaseUrl}users/time`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ timeWorked }), // Ensure number is sent
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Time saved successfully:", data);
      })
      .catch((error) => {
        console.error("Error saving time:", error);
      });
  }
  

// Function to update the time display
  function updateTimeDisplay() {
    elapsedTime = Date.now() - startTime;
    const milliseconds = Math.floor(elapsedTime % 1000);
    const seconds = Math.floor((elapsedTime / 1000) % 60);
    const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
    const hours = Math.floor(elapsedTime / (1000 * 60 * 60));

    const display =
      (hours < 10 ? "0" + hours : hours) +
      ":" +
      (minutes < 10 ? "0" + minutes : minutes) +
      ":" +
      (seconds < 10 ? "0" + seconds : seconds) +
      "." +
      (milliseconds < 10
        ? "00" + milliseconds
        : milliseconds < 100
        ? "0" + milliseconds
        : milliseconds);

    elapsedTimeDisplay.textContent = display;
  }


  // Displaying the time worked both in percentage and seconds on the dashboard
  function showTimeWorked() {
    fetch(`${apiBaseUrl}users/time`, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json(); // Parse the JSON from the response body
      })
      .then((data) => {
        // Now 'data' contains the parsed JSON
        if (data && data.success && data.data) {
          const totalHoursLastWeek = data.data.totalHoursLastWeek;
          console.log("Total Hours Last Week:", totalHoursLastWeek);
          
          // Convert totalHoursLastWeek to a displayable format if needed
          const displayTime = convertTimeToDisplay(totalHoursLastWeek); 
          // Convert totalHoursLastWeek to a percentage if needed
          const displayPercentage = convertTimeToPercentage(totalHoursLastWeek);
          workedTime.innerHTML = displayTime; // Update the HTML element
          // Update the percentage time
          percentageTime.innerHTML = `${displayPercentage.toFixed(2)}%`;
        } else {
          console.error("Invalid data format:", data);
          workedTime.innerHTML = "Error fetching time"; // Display an error message
        }
      })
      .catch((error) => {
        console.error("Error fetching time:", error);
        workedTime.innerHTML = "Error fetching time"; // Display an error message
      });
  }
  
  function convertTimeToDisplay(time) {
    const seconds = Math.floor((time / 1000) % 60);
    const minutes = Math.floor((time / (1000 * 60)) % 60);
    const hours = Math.floor(time / (1000 * 60 * 60));

    return `${
      hours < 10 ? "0" + hours : hours
    }:${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  }

  convertTimeToPercentage = (time) => {
    const percentage = (time / 28800000) * 100;
    return percentage;
  }
  

  function updateContent(linkId) {
    if (linkId === "dashboard") {
      console.log("Loading dashboard content...");
    } else if (linkId === "analytic") {
      console.log("Loading analytic content...");
    }
  }


  const recentActivityDiv = document.querySelector(
    ".box.two-thirds:nth-child(5) div"
  );

  const progressBar = document.querySelector(".progress");

  function displayCurrentDateTime() {
    const now = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayOfWeek = days[now.getDay()];
    const dayOfMonth = now.getDate();
    const year = now.getFullYear();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;

    const formattedDate = `${dayOfWeek} ${dayOfMonth}, ${year} | ${
      formattedHours < 10 ? "0" + formattedHours : formattedHours
    }:${minutes < 10 ? "0" + minutes : minutes} ${ampm}`;

    document.querySelector("#headerBox p:nth-child(2)").textContent =
      formattedDate;
  }

  displayCurrentDateTime();
  setInterval(displayCurrentDateTime, 60000);
});




// Logout function implementation
function logoutUser() {
  // Show loading alert
  showCustomAlert('Logging out...', 'info');
  
  fetch(`${apiBaseUrl}users/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Logout failed');
    }
    return response.json();
  })
  .then(data => {
    // Clear the authentication token
    localStorage.removeItem('token');
    
    // Show success message
    showCustomAlert('Logged out successfully', 'success');
    
    // Redirect to login page after a short delay
    setTimeout(() => {
      // Replace current history state to prevent going back
      window.location.href = 'loginSignup.html';
      
      // Add additional security by clearing history state
      window.history.pushState(null, '', 'loginSignup.html');
      window.addEventListener('popstate', function() {
        window.history.pushState(null, '', 'loginSignup.htmll');
      });
    }, 1000);
  })
  .catch(error => {
    console.error('Error during logout:', error);
    showCustomAlert('Logout failed. Please try again.', 'error');
  });
}

// Add event listener to logout link
document.addEventListener('DOMContentLoaded', function() {
  const logoutLink = document.querySelector('.dropdown a:nth-child(3)');
  if (logoutLink) {
    logoutLink.addEventListener('click', function(e) {
      e.preventDefault();
      logoutUser();
    });
  }
  
  // Check if token is valid on page load
  const token = localStorage.getItem('token');
  if (!token || isTokenExpired(token)) {
    // No valid token, redirect to login
    window.location.replace('loginSignup.html');
  }
});


function showCustomAlert(title, message, type) {
  // Create alert container
  const alertContainer = document.createElement('div');
  alertContainer.className = `custom-alert ${type}`;
  alertContainer.style.position = 'fixed';
  alertContainer.style.top = '20px';
  alertContainer.style.right = '20px';
  alertContainer.style.padding = '15px 20px';
  alertContainer.style.borderRadius = '5px';
  alertContainer.style.zIndex = '1000';
  alertContainer.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
  alertContainer.style.minWidth = '300px';
  alertContainer.style.transition = 'all 0.3s ease-in-out';
  
  // Set color based on type
  if (type === 'success') {
    alertContainer.style.backgroundColor = '#4CAF50';
    alertContainer.style.color = 'white';
  } else if (type === 'error') {
    alertContainer.style.backgroundColor = '#F44336';
    alertContainer.style.color = 'white';
  } else if (type === 'warning') {
    alertContainer.style.backgroundColor = '#FF9800';
    alertContainer.style.color = 'white';
  } else {
    alertContainer.style.backgroundColor = '#2196F3';
    alertContainer.style.color = 'white';
  }
  
  // Create title element
  const titleElement = document.createElement('h4');
  titleElement.style.margin = '0 0 10px 0';
  titleElement.textContent = title;
  
  // Create message element
  const messageElement = document.createElement('p');
  messageElement.style.margin = '0';
  messageElement.textContent = message;
  
  // Create close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '5px';
  closeButton.style.right = '5px';
  closeButton.style.border = 'none';
  closeButton.style.background = 'transparent';
  closeButton.style.color = 'inherit';
  closeButton.style.fontSize = '20px';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = function() {
    document.body.removeChild(alertContainer);
  };
  
  // Assemble the alert
  alertContainer.appendChild(closeButton);
  alertContainer.appendChild(titleElement);
  alertContainer.appendChild(messageElement);
  
  // Add to document
  document.body.appendChild(alertContainer);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    if (document.body.contains(alertContainer)) {
      document.body.removeChild(alertContainer);
    }
  }, 3000);
}