//  Initiate the projects dashboard
const apiBaseUrl = 'https://taskybackend-sepia.vercel.app/api/v1/'; // Replace with your actual API base URL
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





document.addEventListener("DOMContentLoaded", async function () {
const contentBox = document.querySelector(".content-box");

// Define all available project statuses
const projectStatuses = ["Pending", "In Progress", "Completed", "On Hold", "Cancelled"];

contentBox.innerHTML = `
  <div class="header d-flex justify-content-between align-items-center w-100 mb-4">
      <h2 class="fs-1">Projects Dashboard</h2>
      <button class="btn btn-primary ms-auto createProjectBtn">Create Project</button>
  </div>
  <div class="filter-buttons mb-4">
      <button class="btn btn-primary filter-btn me-2" data-filter="All">All</button>
      <button class="btn btn-outline-warning filter-btn me-2" data-filter="Pending">Pending</button>
      <button class="btn btn-outline-primary filter-btn me-2" data-filter="In Progress">In Progress</button>
      <button class="btn btn-outline-success filter-btn me-2" data-filter="Completed">Completed</button>
      <button class="btn btn-outline-secondary filter-btn me-2" data-filter="On Hold">On Hold</button>
      <button class="btn btn-outline-danger filter-btn" data-filter="Cancelled">Cancelled</button>
  </div>
  <div class="projects-container">
      <!-- Projects will be displayed here -->
  </div>

  <!-- Project Details Modal -->
  <div class="modal fade" id="projectDetailsModal" tabindex="-1" aria-labelledby="projectDetailsModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
          <div class="modal-content">
              <div class="modal-header">
                  <h5 class="modal-title" id="projectDetailsModalLabel">Project Details</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body" id="projectDetailsContent">
                  <!-- Project details will be loaded here -->
              </div>
              <div class="modal-footer d-flex justify-content-between">
                  <div class="status-update-container d-flex align-items-center">
                      <select id="projectStatusSelect" class="form-select me-2" style="width: 150px;">
                          <!-- Status options will be added dynamically -->
                      </select>
                      <button id="updateStatusBtn" class="btn btn-primary">
                          Update Status
                      </button>
                  </div>
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              </div>
          </div>
      </div>
  </div>
`;


let currentFilter = "All";

// Add event listeners to filter buttons
document.querySelectorAll('.filter-btn').forEach(button => {
  button.addEventListener('click', function() {
      const filter = this.getAttribute('data-filter');
      currentFilter = filter;
      
      // Update button styles - reset all buttons to outline version first
      document.querySelectorAll('.filter-btn').forEach(btn => {
          const btnFilter = btn.getAttribute('data-filter');
          let baseClass = 'btn filter-btn me-2 ';
          
          if (btnFilter === filter) {
              // Selected button gets solid color
              switch(btnFilter) {
                  case 'All': btn.className = baseClass + 'btn-primary'; break;
                  case 'Pending': btn.className = baseClass + 'btn-warning'; break;
                  case 'In Progress': btn.className = baseClass + 'btn-primary'; break;
                  case 'Completed': btn.className = baseClass + 'btn-success'; break;
                  case 'On Hold': btn.className = baseClass + 'btn-secondary'; break;
                  case 'Cancelled': btn.className = baseClass + 'btn-danger'; break;
                  default: btn.className = baseClass + 'btn-primary';
              }
          } else {
              // Non-selected buttons get outline version
              switch(btnFilter) {
                  case 'All': btn.className = baseClass + 'btn-outline-primary'; break;
                  case 'Pending': btn.className = baseClass + 'btn-outline-warning'; break;
                  case 'In Progress': btn.className = baseClass + 'btn-outline-primary'; break;
                  case 'Completed': btn.className = baseClass + 'btn-outline-success'; break;
                  case 'On Hold': btn.className = baseClass + 'btn-outline-secondary'; break;
                  case 'Cancelled': btn.className = baseClass + 'btn-outline-danger'; break;
                  default: btn.className = baseClass + 'btn-outline-primary';
              }
          }
      });
      
      // Refresh projects with new filter
      fetchProjects();
  });
});


async function fetchProjects() {
try {
  const response = await fetch(`${apiBaseUrl}projects`
    , {
      headers: {
          "Authorization": `Bearer ${localStorage.getItem('token')}`
      }
  });
  const data = await response.json();
  if (data.success) {
    // console.log();    
      displayProjects(data.projects);
  } else {
      showAlert("Error fetching projects", "danger");
  }
} catch (error) {
  console.error("Error fetching projects:", error);
  showAlert("Failed to load projects", "danger");
}
}
function displayProjects(projects) {
  // Filter projects based on current filter
  const filteredProjects = currentFilter === "All" 
      ? projects 
      : projects.filter(project => project.status === currentFilter);
  
  const projectsContainer = document.querySelector('.projects-container');
  projectsContainer.innerHTML = '';
  
  if (filteredProjects.length === 0) {
      projectsContainer.innerHTML = `
          <div class="alert alert-info w-100 text-center">
              No projects found with status: ${currentFilter}
          </div>
      `;
      return;
  }
  
  filteredProjects.forEach(project => {
      // Format dates
      const startDate = new Date(project.startDate).toLocaleDateString();
      const deadline = new Date(project.deadline).toLocaleDateString();
      const endDate = project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing';
      
      // Get status class for styling
      const statusClass = getStatusBadgeClass(project.status);
      
      // Create status options for this project
      const statusOptions = projectStatuses.map(status => 
          `<option value="${status}" ${status === project.status ? 'selected' : ''}>${status}</option>`
      ).join('');
      
      const projectCard = document.createElement('div');
      projectCard.className = 'card mb-4 shadow-sm';
      projectCard.innerHTML = `
          <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                  <h3 class="card-title fs-3 fw-bold">${project.name}</h3>
                  <span class="badge ${statusClass} project-status-badge">${project.status}</span>
              </div>
              
              <p class="card-text text-muted mb-4">${project.description}</p>
              
              <div class="row mb-3">
                  <div class="col-md-3 mb-3">
                      <p class="text-muted mb-1">Start Date</p>
                      <p class="fw-medium fs-5">${startDate}</p>
                  </div>
                  <div class="col-md-3 mb-3">
                      <p class="text-muted mb-1">End Date</p>
                      <p class="fw-medium fs-5">${endDate}</p>
                  </div>
                  <div class="col-md-3 mb-3">
                      <p class="text-muted mb-1">Deadline</p>
                      <p class="fw-medium fs-5">${deadline}</p>
                  </div>
                  <div class="col-md-3 mb-3">
                      <p class="text-muted mb-1">Team Size</p>
                      <p class="fw-medium fs-5">${project.members.length} members</p>
                  </div>
              </div>
              
              <div class="border-top pt-3">
                  <div class="row align-items-center">
                      <div class="col-md-6">
                          <p class="text-muted small mb-md-0">Project ID: ${project._id}</p>
                      </div>
                      <div class="col-md-6">
                          <div class="d-flex justify-content-md-end align-items-center flex-wrap">
                              <div class="status-update-container d-flex align-items-center me-2 mb-2 mb-md-0">
                                  <select class="form-select form-select-sm project-status-select me-2" data-id="${project._id}" style="width: 130px;">
                                      ${statusOptions}
                                  </select>
                                  <button class="btn btn-sm btn-primary update-status-btn" data-id="${project._id}">
                                      Update
                                  </button>
                              </div>
                              <div class="action-buttons">
                                  
                                  <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${project._id}">
                                      Delete
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      `;
      
      projectsContainer.appendChild(projectCard);
  });
  
  // Add event listeners for buttons
  addButtonEventListeners();
}


function getStatusBadgeClass(status) {
  switch(status) {
      case 'Completed': return 'bg-success';
      case 'In Progress': return 'bg-primary';
      case 'Pending': return 'bg-warning';
      case 'On Hold': return 'bg-secondary';
      case 'Cancelled': return 'bg-danger';
      default: return 'bg-info';
  }
}

function addButtonEventListeners() {
  // Delete button event listeners
  document.querySelectorAll(".delete-btn").forEach(button => {
      button.addEventListener("click", function() {
          const projectId = this.getAttribute("data-id");
          if (confirm("Are you sure you want to delete this project?")) {
              deleteProject(projectId);
          }
      });
  });
  
  // View details button event listeners
  document.querySelectorAll(".view-btn").forEach(button => {
      button.addEventListener("click", function() {
          const projectId = this.getAttribute("data-id");
          viewProjectDetails(projectId);
      });
  });
  
  // Update status button event listeners
  document.querySelectorAll(".update-status-btn").forEach(button => {
      button.addEventListener("click", function() {
          const projectId = this.getAttribute("data-id");
          const selectElement = document.querySelector(`.project-status-select[data-id="${projectId}"]`);
          const newStatus = selectElement.value;
          updateProjectStatusInCard(projectId, newStatus, button);
      });
  });
}

async function deleteProject(projectId) {
  try {
      const response = await fetch(`http://localhost:3000/api/v1/projects/${projectId}`, {
          method: "DELETE",
          headers: {
              "Authorization": `Bearer ${localStorage.getItem('token')}`
          }
      });
      const data = await response.json();
      
      if (data.success) {
          showAlert("Project deleted successfully", "success");
          setTimeout(() => fetchProjects(), 1000);
      } else {
          showAlert(data.message || "Failed to delete project", "danger");
      }
  } catch (error) {
      console.error("Error deleting project:", error);
      showAlert("Error deleting project", "danger");
  }
}


async function viewProjectDetails(projectId) {
try {
  // Fetch project details
  const response = await fetch(`http://localhost:3000/api/v1/projects/${projectId}`, {
      headers: {
          "Authorization": `Bearer ${localStorage.getItem('token')}`
      }
  });
  const data = await response.json();
  
  if (!data.success) {
      showAlert("Failed to load project details", "danger");
      return;
  }
  
  const project = data.project;
  const detailsModal = new bootstrap.Modal(document.getElementById('projectDetailsModal'));
  const modalContent = document.getElementById('projectDetailsContent');
  const statusSelect = document.getElementById('projectStatusSelect');
  
  // Format dates
  const startDate = new Date(project.startDate).toLocaleDateString();
  const deadline = new Date(project.deadline).toLocaleDateString();
  const endDate = project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing';
  
  // Populate status dropdown
  statusSelect.innerHTML = '';
  projectStatuses.forEach(status => {
      const option = document.createElement('option');
      option.value = status;
      option.textContent = status;
      if (status === project.status) {
          option.selected = true;
      }
      statusSelect.appendChild(option);
  });
  
  // Set the project ID as a data attribute on the update button
  const updateBtn = document.getElementById('updateStatusBtn');
  updateBtn.setAttribute('data-id', project._id);
  
  // Create member list
  let membersList = '<p>No team members assigned to this project.</p>';
  if (project.members && project.members.length > 0) {
      membersList = `
          <div class="table-responsive">
              <table class="table table-striped">
                  <thead>
                      <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${project.members.map(member => `
                          <tr>
                              <td>${member.name || 'Unknown'}</td>
                              <td>${member.email || 'No email'}</td>
                              <td>${member.role || 'Not specified'}</td>
                              <td>
                                  <button class="btn btn-sm btn-outline-primary view-member-btn" 
                                          data-member-id="${member._id}" 
                                          data-member-name="${member.name || 'Unknown'}"
                                          data-member-email="${member.email || 'No email'}"
                                          data-member-role="${member.role || 'Not specified'}">
                                      View
                                  </button>
                              </td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
          </div>
      `;
  }
  
  // Build modal content
  modalContent.innerHTML = `
      <div class="mb-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
              <h3>${project.name}</h3>
              <span class="badge ${getStatusBadgeClass(project.status)} fs-6">${project.status}</span>
          </div>
          <p class="text-muted">${project.description}</p>
      </div>
      
      <div class="card mb-4">
          <div class="card-header bg-light">
              <h5 class="mb-0">Project Timeline</h5>
          </div>
          <div class="card-body">
              <div class="row">
                  <div class="col-md-4">
                      <p class="text-muted mb-1">Start Date</p>
                      <p class="fw-medium">${startDate}</p>
                  </div>
                  <div class="col-md-4">
                      <p class="text-muted mb-1">End Date</p>
                      <p class="fw-medium">${endDate}</p>
                  </div>
                  <div class="col-md-4">
                      <p class="text-muted mb-1">Deadline</p>
                      <p class="fw-medium">${deadline}</p>
                  </div>
              </div>
          </div>
      </div>
      
      <div class="card mb-4">
          <div class="card-header bg-light">
              <h5 class="mb-0">Project Details</h5>
          </div>
          <div class="card-body">
              <div class="row">
                  <div class="col-md-6">
                      <p class="text-muted mb-1">Project ID</p>
                      <p class="fw-medium">${project._id}</p>
                  </div>
                  <div class="col-md-6">
                      <p class="text-muted mb-1">Current Status</p>
                      <p class="fw-medium">
                          <span class="badge ${getStatusBadgeClass(project.status)}">${project.status}</span>
                      </p>
                  </div>
              </div>
          </div>
      </div>
      
      <div class="card">
          <div class="card-header bg-light d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Team Members (${project.members ? project.members.length : 0})</h5>
              <button id="manageMembersBtn" class="btn btn-sm btn-outline-primary" data-project-id="${project._id}">
                  Manage Members
              </button>
          </div>
          <div class="card-body">
              ${membersList}
          </div>
      </div>
  `;
  
  // Show modal
  detailsModal.show();
  
  // Add event listener for status update button
  updateBtn.addEventListener('click', function() {
      const projectId = this.getAttribute('data-id');
      const newStatus = statusSelect.value;
      updateProjectStatus(projectId, newStatus);
  });
  
  // Add event listener for update project details button
  const updateProjectBtn = document.createElement('button');
  updateProjectBtn.className = 'btn btn-primary me-2';
  updateProjectBtn.textContent = 'Update Project Details';
  updateProjectBtn.setAttribute('data-id', project._id);
  updateProjectBtn.addEventListener('click', function() {
      openUpdateProjectModal(project);
  });
  
  // Add the update button to the modal footer
  const modalFooter = document.querySelector('#projectDetailsModal .modal-footer');
  modalFooter.prepend(updateProjectBtn);
  
  // Add event listeners for member view buttons
  document.querySelectorAll('.view-member-btn').forEach(button => {
      button.addEventListener('click', function() {
          const memberId = this.getAttribute('data-member-id');
          const memberName = this.getAttribute('data-member-name');
          const memberEmail = this.getAttribute('data-member-email');
          const memberRole = this.getAttribute('data-member-role');
          
          viewMemberDetails(memberId, memberName, memberEmail, memberRole);
      });
  });
  
  // Add event listener for manage members button
  document.getElementById('manageMembersBtn').addEventListener('click', function() {
      const projectId = this.getAttribute('data-project-id');
      openManageMembersModal(projectId, project.members);
  });
  
} catch (error) {
  console.error("Error fetching project details:", error);
  showAlert("Error loading project details", "danger");
}
}

// Function to open member details modal
function viewMemberDetails(memberId, memberName, memberEmail, memberRole) {
// Create modal if it doesn't exist
if (!document.getElementById('memberDetailsModal')) {
  const modalHTML = `
      <div class="modal fade" id="memberDetailsModal" tabindex="-1" aria-labelledby="memberDetailsModalLabel" aria-hidden="true">
          <div class="modal-dialog">
              <div class="modal-content">
                  <div class="modal-header">
                      <h5 class="modal-title" id="memberDetailsModalLabel">Member Details</h5>
                      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body" id="memberDetailsContent">
                      <!-- Member details will be loaded here -->
                  </div>
                  <div class="modal-footer">
                      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                  </div>
              </div>
          </div>
      </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Populate member details
const memberContent = document.getElementById('memberDetailsContent');
memberContent.innerHTML = `
  <div class="card">
      <div class="card-body">
          <div class="mb-3">
              <h5 class="card-title">${memberName}</h5>
              <p class="card-text"><strong>Member ID:</strong> ${memberId}</p>
          </div>
          <div class="mb-3">
              <p class="card-text"><strong>Email:</strong> ${memberEmail}</p>
              <p class="card-text"><strong>Role:</strong> ${memberRole}</p>
          </div>
      </div>
  </div>
`;

// Show modal
const memberModal = new bootstrap.Modal(document.getElementById('memberDetailsModal'));
memberModal.show();
}

// Function to open update project modal
function openUpdateProjectModal(project) {
// Create modal if it doesn't exist
if (!document.getElementById('updateProjectModal')) {
  const modalHTML = `
      <div class="modal fade" id="updateProjectModal" tabindex="-1" aria-labelledby="updateProjectModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg">
              <div class="modal-content">
                  <div class="modal-header">
                      <h5 class="modal-title" id="updateProjectModalLabel">Update Project</h5>
                      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">
                      <form id="updateProjectForm">
                          <div class="mb-3">
                              <label for="projectName" class="form-label">Project Name</label>
                              <input type="text" class="form-control" id="projectName" required>
                          </div>
                          <div class="mb-3">
                              <label for="projectDescription" class="form-label">Description</label>
                              <textarea class="form-control" id="projectDescription" rows="3"></textarea>
                          </div>
                          <div class="row">
                              <div class="col-md-4 mb-3">
                                  <label for="projectStartDate" class="form-label">Start Date</label>
                                  <input type="date" class="form-control" id="projectStartDate" required>
                              </div>
                              <div class="col-md-4 mb-3">
                                  <label for="projectEndDate" class="form-label">End Date (Optional)</label>
                                  <input type="date" class="form-control" id="projectEndDate">
                              </div>
                              <div class="col-md-4 mb-3">
                                  <label for="projectDeadline" class="form-label">Deadline</label>
                                  <input type="date" class="form-control" id="projectDeadline" required>
                              </div>
                          </div>
                          <div class="mb-3">
                              <label for="projectStatus" class="form-label">Status</label>
                              <select class="form-select" id="projectStatus" required>
                                  <!-- Status options will be added dynamically -->
                              </select>
                          </div>
                          <input type="hidden" id="projectId">
                      </form>
                  </div>
                  <div class="modal-footer">
                      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                      <button type="button" class="btn btn-primary" id="saveProjectBtn">Save Changes</button>
                  </div>
              </div>
          </div>
      </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Add event listener for save button
  document.getElementById('saveProjectBtn').addEventListener('click', saveProjectChanges);
}

// Populate form with project data
document.getElementById('projectId').value = project._id;
document.getElementById('projectName').value = project.name;
document.getElementById('projectDescription').value = project.description;
document.getElementById('projectStartDate').value = formatDateForInput(project.startDate);
document.getElementById('projectEndDate').value = project.endDate ? formatDateForInput(project.endDate) : '';
document.getElementById('projectDeadline').value = formatDateForInput(project.deadline);

// Populate status dropdown
const statusSelect = document.getElementById('projectStatus');
statusSelect.innerHTML = '';
projectStatuses.forEach(status => {
  const option = document.createElement('option');
  option.value = status;
  option.textContent = status;
  if (status === project.status) {
      option.selected = true;
  }
  statusSelect.appendChild(option);
});

// Show modal
const updateModal = new bootstrap.Modal(document.getElementById('updateProjectModal'));
updateModal.show();
}

// Function to open manage members modal
function openManageMembersModal(projectId, members) {
// Create modal if it doesn't exist
if (!document.getElementById('manageMembersModal')) {
  const modalHTML = `
      <div class="modal fade" id="manageMembersModal" tabindex="-1" aria-labelledby="manageMembersModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg">
              <div class="modal-content">
                  <div class="modal-header">
                      <h5 class="modal-title" id="manageMembersModalLabel">Manage Team Members</h5>
                      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">
                      <div class="mb-4">
                          <h6>Current Team Members</h6>
                          <div id="currentMembersList" class="table-responsive">
                              <!-- Current members will be loaded here -->
                          </div>
                      </div>
                      <div class="mb-3">
                          <h6>Add New Member</h6>
                          <form id="addMemberForm" class="row g-3">
                              <div class="col-md-4">
                                  <input type="text" class="form-control" id="memberName" placeholder="Name" required>
                              </div>
                              <div class="col-md-4">
                                  <input type="email" class="form-control" id="memberEmail" placeholder="Email" required>
                              </div>
                              <div class="col-md-3">
                                  <input type="text" class="form-control" id="memberRole" placeholder="Role" required>
                              </div>
                              <div class="col-md-1">
                                  <button type="submit" class="btn btn-primary">Add</button>
                              </div>
                          </form>
                      </div>
                  </div>
                  <div class="modal-footer">
                      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                  </div>
              </div>
          </div>
      </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Add event listener for add member form
  document.getElementById('addMemberForm').addEventListener('submit', function(e) {
      e.preventDefault();
      addMemberToProject();
  });
}

// Update modal title with project ID
document.getElementById('manageMembersModalLabel').textContent = `Manage Team Members - Project ID: ${projectId}`;

// Set project ID as data attribute
document.getElementById('addMemberForm').setAttribute('data-project-id', projectId);

// Populate current members list
const currentMembersList = document.getElementById('currentMembersList');
if (members && members.length > 0) {
  currentMembersList.innerHTML = `
      <table class="table table-striped">
          <thead>
              <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
              </tr>
          </thead>
          <tbody>
              ${members.map(member => `
                  <tr>
                      <td>${member.name || 'Unknown'}</td>
                      <td>${member.email || 'No email'}</td>
                      <td>${member.role || 'Not specified'}</td>
                      <td>
                          <button class="btn btn-sm btn-outline-danger remove-member-btn" 
                                  data-project-id="${projectId}" 
                                  data-member-id="${member._id}">
                              Remove
                          </button>
                      </td>
                  </tr>
              `).join('')}
          </tbody>
      </table>
  `;
  
  // Add event listeners for remove member buttons
  document.querySelectorAll('.remove-member-btn').forEach(button => {
      button.addEventListener('click', function() {
          const projectId = this.getAttribute('data-project-id');
          const memberId = this.getAttribute('data-member-id');
          
          if (confirm('Are you sure you want to remove this member from the project?')) {
              removeMemberFromProject(projectId, memberId);
          }
      });
  });
} else {
  currentMembersList.innerHTML = '<p>No team members assigned to this project.</p>';
}

// Show modal
const membersModal = new bootstrap.Modal(document.getElementById('manageMembersModal'));
membersModal.show();
}

// Helper function to format date for input fields (YYYY-MM-DD)
function formatDateForInput(dateString) {
const date = new Date(dateString);
return date.toISOString().split('T')[0];
}

// Function to save project changes
async function saveProjectChanges() {
const projectId = document.getElementById('projectId').value;
const name = document.getElementById('projectName').value;
const description = document.getElementById('projectDescription').value;
const startDate = document.getElementById('projectStartDate').value;
const endDate = document.getElementById('projectEndDate').value;
const deadline = document.getElementById('projectDeadline').value;
const status = document.getElementById('projectStatus').value;

if (!name || !startDate || !deadline) {
  showAlert("Please fill all required fields", "warning");
  return;
}

try {
  const response = await fetch(`http://localhost:3000/api/v1/projects/${projectId}`, {
      method: "PUT",
      headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
          name,
          description,
          startDate,
          endDate: endDate || null,
          deadline,
          status
      })
  });
  
  const data = await response.json();
  
  if (data.success) {
      showAlert("Project updated successfully", "success");
      
      // Close the update modal
      const updateModal = bootstrap.Modal.getInstance(document.getElementById('updateProjectModal'));
      updateModal.hide();
      
      // Close the details modal
      const detailsModal = bootstrap.Modal.getInstance(document.getElementById('projectDetailsModal'));
      detailsModal.hide();
      
      // Refresh projects list
      fetchProjects();
  } else {
      showAlert(data.message || "Failed to update project", "danger");
  }
} catch (error) {
  console.error("Error updating project:", error);
  showAlert("Error updating project", "danger");
}
}

// Function to add a member to project
async function addMemberToProject() {
const projectId = document.getElementById('addMemberForm').getAttribute('data-project-id');
const name = document.getElementById('memberName').value;
const email = document.getElementById('memberEmail').value;
const role = document.getElementById('memberRole').value;

if (!name || !email || !role) {
  showAlert("Please fill all required fields", "warning");
  return;
}

try {
  const response = await fetch(`http://localhost:3000/api/v1/projects/${projectId}/members`, {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
          name,
          email,
          role
      })
  });
  
  const data = await response.json();
  
  if (data.success) {
      showAlert("Member added successfully", "success");
      
      // Clear form
      document.getElementById('memberName').value = '';
      document.getElementById('memberEmail').value = '';
      document.getElementById('memberRole').value = '';
      
      // Refresh the members modal
      viewProjectDetails(projectId);
      
      // Close the members modal
      const membersModal = bootstrap.Modal.getInstance(document.getElementById('manageMembersModal'));
      membersModal.hide();
  } else {
      showAlert(data.message || "Failed to add member", "danger");
  }
} catch (error) {
  console.error("Error adding member:", error);
  showAlert("Error adding member", "danger");
}
}

// Function to remove a member from project
async function removeMemberFromProject(projectId, memberId) {
try {
  const response = await fetch(`http://localhost:3000/api/v1/projects/${projectId}/members/${memberId}`, {
      method: "DELETE",
      headers: {
          "Authorization": `Bearer ${localStorage.getItem('token')}`
      }
  });
  
  const data = await response.json();
  
  if (data.success) {
      showAlert("Member removed successfully", "success");
      
      // Refresh the members modal
      viewProjectDetails(projectId);
      
      // Close the members modal
      const membersModal = bootstrap.Modal.getInstance(document.getElementById('manageMembersModal'));
      membersModal.hide();
  } else {
      showAlert(data.message || "Failed to remove member", "danger");
  }
} catch (error) {
  console.error("Error removing member:", error);
  showAlert("Error removing member", "danger");
}
}
async function updateProjectStatus(projectId, newStatus) {
  try {
      const response = await fetch(`http://localhost:3000/api/v1/projects/${projectId}/updateStatus`, {
          method: "PUT",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
          showAlert("Project status updated successfully", "success");
          
          // Update the status badge in the modal
          const statusBadge = document.querySelector('.modal-body .badge');
          if (statusBadge) {
              statusBadge.className = `badge ${getStatusBadgeClass(newStatus)} fs-6`;
              statusBadge.textContent = newStatus;
          }
          
          // Refresh the projects list
          setTimeout(() => fetchProjects(), 1000);
      } else {
          showAlert(data.message || "Failed to update project status", "danger");
      }
  } catch (error) {
      console.error("Error updating project status:", error);
      showAlert("Error updating project status", "danger");
  }
}

async function updateProjectStatusInCard(projectId, newStatus, buttonElement) {
  // Show loading state
  const originalButtonText = buttonElement.innerHTML;
  buttonElement.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
  buttonElement.disabled = true;
  
  try {
      const response = await fetch(`http://localhost:3000/api/v1/projects/${projectId}/updateStatus`, {
          method: "PUT",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
          // Find and update the status badge in the card
          const cardElement = buttonElement.closest('.card');
          const statusBadge = cardElement.querySelector('.project-status-badge');
          
          if (statusBadge) {
              statusBadge.className = `badge ${getStatusBadgeClass(newStatus)} project-status-badge`;
              statusBadge.textContent = newStatus;
          }
          
          showAlert("Project status updated successfully", "success");
          
          // If the current filter is not "All" and the status has changed,
          // we might need to refresh the entire list
          if (currentFilter !== "All" && currentFilter !== newStatus) {
              setTimeout(() => fetchProjects(), 1000);
          }
      } else {
          showAlert(data.message || "Failed to update project status", "danger");
      }
  } catch (error) {
      console.error("Error updating project status:", error);
      showAlert("Error updating project status", "danger");
  } finally {
      // Restore button state
      buttonElement.innerHTML = originalButtonText;
      buttonElement.disabled = false;
  }
}

function showAlert(message, type) {
  const alertBox = document.createElement("div");
  alertBox.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-2`;
  alertBox.style.zIndex = "1050";
  alertBox.textContent = message;
  document.body.appendChild(alertBox);
  setTimeout(() => alertBox.remove(), 3000);
}

// Initial fetch
fetchProjects();

// Add event listener to Create Project button
document.querySelector(".createProjectBtn").addEventListener("click", function() {
  // Open the create project modal
  const createProjectModal = new bootstrap.Modal(document.getElementById('createProjectModal'));
  createProjectModal.show();
  
  // Set default start date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('startDate').value = today;
  
  // Set default deadline to 2 weeks from today
  const twoWeeksLater = new Date();
  twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
  document.getElementById('deadline').value = twoWeeksLater.toISOString().split('T')[0];
  
  // Clear any previously added team members
  if (document.getElementById("teamMembersList")) {
    document.getElementById("teamMembersList").innerHTML = "";
  }
  
  // Add event listener for the add team member button - use once to prevent duplicates
  const addTeamMemberBtn = document.getElementById("addTeamMemberBtn");
  if (addTeamMemberBtn) {
    // Remove existing listeners to prevent duplicates
    const newBtn = addTeamMemberBtn.cloneNode(true);
    addTeamMemberBtn.parentNode.replaceChild(newBtn, addTeamMemberBtn);
    newBtn.addEventListener("click", addTeamMember);
  }
  
  // Allow pressing Enter to add a team member - use once to prevent duplicates
  const teamMembersInput = document.getElementById("teamMembers");
  if (teamMembersInput) {
    // Remove existing listeners to prevent duplicates
    const newInput = teamMembersInput.cloneNode(true);
    teamMembersInput.parentNode.replaceChild(newInput, teamMembersInput);
    newInput.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        addTeamMember();
      }
    });
  }
});

// Make sure the submit button is properly connected to the createNewProject function
document.addEventListener("DOMContentLoaded", function() {
  // Add event listener to submit button when DOM is fully loaded
  const submitBtn = document.getElementById("submitProject");
  if (submitBtn) {
    // Clear any existing event listeners by cloning the node
    const newSubmitBtn = submitBtn.cloneNode(true);
    if (submitBtn.parentNode) {
      submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
    }
    
    // Add the click event listener to the new button
    newSubmitBtn.addEventListener("click", function(e) {
      e.preventDefault(); // Prevent form submission
      console.log("Submit button clicked, calling createNewProject()");
      createNewProject();
    });
  }
});

// Function to create a new project
async function createNewProject() {
  console.log('createNewProject function called');
  
  // Get form values
  const projectName = document.getElementById("projectName").value.trim();
  const projectDescription = document.getElementById("projectDescription").value.trim();
  const startDate = document.getElementById("startDate").value;
  const deadline = document.getElementById("deadline").value;
  
  console.log('Form values:', { projectName, projectDescription, startDate, deadline });
  
  // Get team members from chips
  const teamMemberElements = document.querySelectorAll('.team-member-email');
  const teamMembers = Array.from(teamMemberElements).map(el => el.dataset.email);
  console.log('Team members:', teamMembers);
  
  // Basic validation
  if (!projectName || !projectDescription || !startDate || !deadline) {
    showAlert("Please fill in all required fields", "error");
    return;
  }
  
  // Validate dates
  if (new Date(startDate) > new Date(deadline)) {
    showAlert("Start date cannot be after deadline", "error");
    return;
  }
  
  // Show loading message
  showAlert("Creating project...", "info");
  
  try {
    // Important: Use the correct endpoint URL
    const apiUrl = `http://localhost:3000/api/v1/projects/`;
    console.log(`Sending request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        name: projectName,
        description: projectDescription,
        startDate: startDate,
        deadline: deadline,
        members: teamMembers
      })
    });
    
    console.log("Response status:", response.status);
    const data = await response.json();
    console.log("Server response:", data);
    
    if (data.success) {
      // Show success message
      showAlert("Project created successfully!", "success");
      
      try {
        // Close the modal
        const modalElement = document.getElementById('createProjectModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        }
      } catch (modalError) {
        console.error("Error closing modal:", modalError);
      }
      
      // Reset the form
      document.getElementById("createProjectForm").reset();
      document.getElementById("teamMembersList").innerHTML = "";
      
      // Refresh projects list
      location.reload();
      
    } else {
      // Show error message with details
      const errorMsg = data.message || "Failed to create project";
      showAlert(errorMsg, "error");
      console.error("Project creation failed:", data);
    }
  } catch (error) {
    console.error("Error creating project:", error);
    showAlert("Error creating project. Please try again.", "error");
  }
}
// Add the missing addTeamMember function here - this needs to be defined before it's used
function addTeamMember() {
  console.log('addTeamMember function called');
  const emailInput = document.getElementById("teamMembers");
  const email = emailInput.value.trim();
  const teamMembersList = document.getElementById("teamMembersList");
  
  // Validate email
  if (!email) {
    console.log('No email entered');
    return;
  }
  
  // Simple email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log('Invalid email format');
    showAlert("Please enter a valid email address", "error");
    return;
  }
  
  console.log(`Adding email: ${email}`);
  
  // Check for duplicates
  const existingEmails = Array.from(document.querySelectorAll('.team-member-email')).map(el => el.dataset.email);
  if (existingEmails.includes(email)) {
    showAlert("This email is already added", "error");
    emailInput.value = "";
    return;
  }
  
  // Create the email chip
  const memberChip = document.createElement("div");
  memberChip.className = "team-member-email badge bg-light text-dark d-flex align-items-center p-2";
  memberChip.dataset.email = email;
  memberChip.innerHTML = `
    ${email}
    <button type="button" class="btn-close ms-2" aria-label="Remove"></button>
  `;
  
  // Add click event to remove the email
  memberChip.querySelector('.btn-close').addEventListener('click', function() {
    teamMembersList.removeChild(memberChip);
  });
  
  // Add to the list
  teamMembersList.appendChild(memberChip);
  console.log('Email chip added successfully');
  
  // Clear the input
  emailInput.value = "";
  emailInput.focus();
}

// Replace the event listener for the button with this improved version
document.querySelector(".createProjectBtn").addEventListener("click", function() {
  console.log("Create project button clicked");
  
  // Open the create project modal
  try {
    const createProjectModal = new bootstrap.Modal(document.getElementById('createProjectModal'));
    createProjectModal.show();
    
    // Set default start date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
    
    // Set default deadline to 2 weeks from today
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    document.getElementById('deadline').value = twoWeeksLater.toISOString().split('T')[0];
    
    // Clear any previously added team members
    if (document.getElementById("teamMembersList")) {
      document.getElementById("teamMembersList").innerHTML = "";
    }
    
    // Setup event handlers for the modal form components
    setupModalEventHandlers();
    
  } catch (error) {
    console.error("Error opening modal:", error);
    showAlert("Error opening project form", "error");
  }
});



// New function to set up event handlers for modal components
function setupModalEventHandlers() {
  console.log("Setting up modal event handlers");
  
  // Set up add team member button
  const addTeamMemberBtn = document.getElementById("addTeamMemberBtn");
  if (addTeamMemberBtn) {
    console.log("Found Add Team Member button");
    
    // Remove old listeners
    const newBtn = addTeamMemberBtn.cloneNode(true);
    addTeamMemberBtn.parentNode.replaceChild(newBtn, addTeamMemberBtn);
    
    // Add new listener
    newBtn.addEventListener("click", function(e) {
      e.preventDefault();
      console.log("Add team member button clicked");
      addTeamMember();
    });
  } else {
    console.error("Add Team Member button not found");
  }
  
  // Set up enter key for team members input
  const teamMembersInput = document.getElementById("teamMembers");
  if (teamMembersInput) {
    console.log("Found team members input");
    
    // Remove old listeners
    const newInput = teamMembersInput.cloneNode(true);
    teamMembersInput.parentNode.replaceChild(newInput, teamMembersInput);
    
    // Add new listener
    newInput.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        console.log("Enter key pressed in team members input");
        addTeamMember();
      }
    });
  } else {
    console.error("Team members input not found");
  }
  
  // Set up submit button
  const submitBtn = document.getElementById("submitProject");
  if (submitBtn) {
    console.log("Found submit button");
    
    // Remove old listeners
    const newSubmitBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
    
    // Add new listener
    newSubmitBtn.addEventListener("click", function(e) {
      e.preventDefault();
      console.log("Submit button clicked");
      createNewProject();
    });
  } else {
    console.error("Submit button not found");
  }
}
})
