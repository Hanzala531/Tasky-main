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

// Add event listener for logout functionality
document.addEventListener('DOMContentLoaded', function() {
  
    

  // Fetch todos from API
  fetchTodos();
});

// Function to fetch todos from API
function fetchTodos() {
  const token = localStorage.getItem('token');
  const todoList = document.getElementById('todoList');
  
  fetch('http://localhost:3000/api/v1/todos', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to fetch todos');
    }
    
    return response.json();
  })
  .then(data => {
    // Clear loading message
    console.log('Todos fetched successfully:', data);
    
    todoList.innerHTML = '';
    
    // Check if we have todos in the expected format based on your response
    if (data && data.success && Array.isArray(data.todos)) {
      if (data.todos.length === 0) {
        todoList.innerHTML = '<p>No todos available</p>';
      } else {
        // Create a list element
        const ul = document.createElement('ul');
        ul.className = 'todo-items';
        
        // Show 5 todos if there are more than 5 available
        const MIN_TODOS_TO_SHOW = 5;
        // If there are more than 5 todos, show exactly 5, otherwise show all
        const todosToShow = data.todos.length > 5 ? data.todos.slice(0, MIN_TODOS_TO_SHOW) : data.todos;
        
        // Add each todo to the list
        todosToShow.forEach(todo => {
          const li = document.createElement('li');
          li.style.display = 'flex';
          li.style.alignItems = 'center';
          li.style.gap = '10px';
          li.style.fontSize = '19px';
          // Create checkbox for todo
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.checked = todo.status === 'checked';
          checkbox.setAttribute('data-id', todo._id); // Using _id from response
          checkbox.className = 'todo-checkbox';
          
          // Create todo text
          const span = document.createElement('span');
          span.textContent = todo.title || 'Untitled Todo';
          if (todo.status === 'checked') {
            span.style.textDecoration = 'line-through';
            span.style.color = '#888';
          }
          
          // Append elements to list item
          li.appendChild(checkbox);
          li.appendChild(span);
          ul.appendChild(li);
          
          // Add event listener to checkbox
          checkbox.addEventListener('change', function() {
            const newStatus = this.checked ? 'checked' : 'unchecked';
            updateTodoStatus(todo._id, newStatus);
            if (this.checked) {
              span.style.textDecoration = 'line-through';
              span.style.color = '#888';
            } else {
              span.style.textDecoration = 'none';
              span.style.color = '';
            }
          });
        });
        
        todoList.appendChild(ul);
        
        // Add count if there are more than 5 todos
        if (data.todos.length > 5) {
          const moreInfo = document.createElement('p');
          moreInfo.textContent = `+ ${data.todos.length - MIN_TODOS_TO_SHOW} more todos`;
          moreInfo.className = 'more-todos-info';
          moreInfo.style.fontSize = '14px';
          moreInfo.style.fontStyle = 'italic';
          moreInfo.style.color = '#666';
          moreInfo.style.marginTop = '8px';
          todoList.appendChild(moreInfo);
        }
      }
    } else {
      todoList.innerHTML = '<p>Error: Invalid data format</p>';
    }
  })
  .catch(error => {
    console.error('Error fetching todos:', error);
    todoList.innerHTML = '<p>Failed to load todos</p>';
  });
}

// Function to update todo status
function updateTodoStatus(todoId, status) {
  const token = localStorage.getItem('token');
  
  fetch(`http://localhost:3000/api/v1/todos/${todoId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status: status })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to update todo');
    }
    return response.json();
  })
  .then(data => {
    console.log('Todo updated successfully:', data);
  })
  .catch(error => {
    console.error('Error updating todo:', error);
    showCustomAlert('Error', 'Failed to update todo status', 'error');
  });
}

// Custom alert function
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

async function fetchProjects() {
try {
const response = await fetch("http://localhost:3000/api/v1/projects", {
headers: {
    "Authorization": `Bearer ${localStorage.getItem('token')}`
}
});
const data = await response.json();
if (data.success) {
console.log(data.projects);
if (data.projects.length < 10) {
document.getElementById('projectsWorked').textContent = `0${data.projects.length}`;
} 
else {
document.getElementById('projectsWorked').textContent = `0${data.projects.length}`;

}
// document.querySelector('.projectsWorked').innerHTML = data.projects.length;
// const projectList = document.querySelector('.projects-list ');

} else {
showAlert("Error fetching projects", "danger");
}
} catch (error) {
console.error("Error fetching projects:", error);
showAlert("Failed to load projects", "danger");
}
}
fetchProjects();

async function fetchTeams() {
try {
const response = await fetch("http://localhost:3000/api/v1/teams", {
headers: {
  "Authorization": `Bearer ${localStorage.getItem('token')}`
}
});

const data = await response.json();
console.log("Teams data received:", data);

// Handle the specific response format from the API
let teams = [];
if (data.success && Array.isArray(data.message)) {
teams = data.message;
} else {
console.log("Unexpected API response format");
return;
}

if (teams.length > 0) {
// Get the first team
const team = teams[0];

// Reference to the team box
const teamBox = document.querySelector('.teamBox');
if (teamBox) {
  // Only update the team name element
  const teamNameElement = teamBox.querySelector('.teamName');
  if (teamNameElement) {
    teamNameElement.textContent = team.name;
  }
  
  // Update the content with appropriate headings and team admin info
  const teamContent = teamBox.querySelector('div');
  if (teamContent) {
    // Keep the heading
    teamContent.innerHTML = `
      <h4 class="teamName">${team.name}</h4>
      <p><strong>Description:</strong> ${team.description || "No description available"}</p>
      <p><strong>Team Admin:</strong> ${team.teamAdmin && team.teamAdmin.email ? team.teamAdmin.email : "Unknown"}</p>
      <p><strong>Members:</strong> ${team.members ? team.members.length : 0} team members</p>
    `;
  }
}
} else {
console.log("No teams data available");
}
} catch (error) {
console.error("Error fetching teams:", error);
// Don't show an alert, just log the error
}
}

fetchTeams();
