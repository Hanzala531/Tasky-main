// Initiate the timesheets page
      function isTokenExpired(token) {
        if (!token) {
          // window.location.href = './html/loginSignup.html'; // Redirect to login page
          return true;
        } // If no token, consider it expired

        const payloadBase64 = token.split('.')[1]; // Get the payload part
        const decodedPayload = JSON.parse(atob(payloadBase64)); // Decode base64

        const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds

        return decodedPayload.exp < currentTime; // Compare expiration time
      }


      const token = localStorage.getItem('token');
      if (isTokenExpired(token)) {
        console.log('Token is expired');

        window.location.href = './html/loginSignup.html';
        localStorage.removeItem('token');
      } else {
        console.log('Token is valid');
      }



      // Function to fetch timesheets
async function fetchTimesheets() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    const response = await fetch('http://localhost:4000/api/v1/timesheets', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success === false) {
      console.warn('API returned success: false, but data was received:', data);
    }
    
    displayTimesheets(data.data);
    renderTimesheetCharts(data.data);
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    document.querySelector('.content-box').innerHTML = `
      <div class="alert alert-danger">
        Failed to load timesheet data. Please try again later.
      </div>
    `;
  }
}

// Function to convert milliseconds to hours, minutes, seconds format
function formatMilliseconds(ms) {
  // Convert milliseconds to hours (1 hour = 3,600,000 milliseconds)
  const hours = Math.floor(ms / 3600000);
  
  // Convert remaining milliseconds to minutes
  const minutes = Math.floor((ms % 3600000) / 60000);
  
  // Convert remaining milliseconds to seconds
  const seconds = Math.floor((ms % 60000) / 1000);
  
  // Format as HH:MM:SS
  return `${hours}h ${minutes}m ${seconds}s`;
}

// Function to display timesheets
function displayTimesheets(timesheets) {
  const contentBox = document.querySelector('.content-box');
  
  if (!timesheets || timesheets.length === 0) {
    contentBox.innerHTML = `
      <div class="alert alert-info">
        No timesheet data available.
      </div>
    `;
    return;
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Create timesheet container with chart area and table
  let timesheetHtml = `
    <div class="container mt-4">
      <h3>My Timesheets</h3>
      
      <!-- Chart Containers -->
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              Daily Hours Distribution
            </div>
            <div class="card-body">
              <canvas id="dailyHoursChart"></canvas>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              Weekly Hours Summary
            </div>
            <div class="card-body">
              <canvas id="weeklyHoursChart"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Timesheet Table -->
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th width="70%" >Date</th>
              <th>Time Worked</th>
              
            </tr> 
          </thead>
          <tbody>
  `;

  // Add timesheet rows
  timesheets.forEach(timesheet => {
    timesheetHtml += `
      <tr>
        <td>${formatDate(timesheet.date)}</td>
        <td>${formatMilliseconds(timesheet.hours)}</td>
        
      </tr>
    `;
  });

  timesheetHtml += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  contentBox.innerHTML = timesheetHtml;

  // Add event listeners for view buttons
  document.querySelectorAll('.view-timesheet').forEach(button => {
    button.addEventListener('click', function() {
      const timesheetId = this.getAttribute('data-id');
      // This would typically open a modal or navigate to a detail page
      alert(`View timesheet with ID: ${timesheetId}`);
    });
  });
}

// Function to render timesheet charts
function renderTimesheetCharts(timesheets) {
  if (!timesheets || timesheets.length === 0) return;

  // Process data for charts
  // Sort timesheets by date (oldest first)
  timesheets.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Prepare data for daily hours chart
  const dailyLabels = timesheets.map(entry => {
    const date = new Date(entry.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  
  const dailyData = timesheets.map(entry => entry.hours / 3600000); // Convert ms to hours
  
  // Prepare data for weekly chart
  const weeklyData = {};
  
  timesheets.forEach(entry => {
    const date = new Date(entry.date);
    const weekNumber = getWeekNumber(date);
    const weekYear = `${date.getFullYear()}-W${weekNumber}`;
    
    if (!weeklyData[weekYear]) {
      weeklyData[weekYear] = 0;
    }
    
    weeklyData[weekYear] += entry.hours / 3600000; // Convert ms to hours
  });
  
  const weeklyLabels = Object.keys(weeklyData);
  const weeklyHours = Object.values(weeklyData);
  
  // Create daily hours chart
  createChart('dailyHoursChart', 'bar', {
    labels: dailyLabels,
    datasets: [{
      label: 'Hours Worked',
      data: dailyData,
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  });
  
  // Create weekly hours chart
  createChart('weeklyHoursChart', 'bar', {
    labels: weeklyLabels,
    datasets: [{
      label: 'Weekly Hours',
      data: weeklyHours,
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1
    }]
  });
}

// Helper function to get week number
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Function to create a chart
function createChart(canvasId, type, data) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  
  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') {
    console.error('Chart.js is not loaded. Please include Chart.js in your project.');
    return;
  }
  
  new Chart(ctx, {
    type: type,
    data: data,
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Hours'
          }
        }
      }
    }
  });
}

// Initialize timesheets if on the timesheets page
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on the timesheets page
  if (window.location.href.includes('timesheets.html')) {
    // Check if Chart.js is available, if not, load it
    if (typeof Chart === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
      script.integrity = 'sha512-ElRFoEQdI5Ht6kZvyzXhYG9NqjtkmlkfYk0wr6wHxU9JEHakS7UJZNeml5ALk+8IKlU6jDgMabC3vkumRokgJA==';
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';
      script.onload = fetchTimesheets;
      document.head.appendChild(script);
    } else {
      fetchTimesheets();
    }
  }
});
