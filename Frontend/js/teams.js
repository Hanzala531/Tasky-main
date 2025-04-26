// Token validation
      function isTokenExpired(token) {
        if (!token) return true;
        const payloadBase64 = token.split('.')[1];
        try {
          const decodedPayload = JSON.parse(atob(payloadBase64));
          const currentTime = Math.floor(Date.now() / 1000);
          return decodedPayload.exp < currentTime;
        } catch (error) {
          console.error('Error decoding token:', error);
          return true;
        }
      }
  
      const token = localStorage.getItem('token');
      if (isTokenExpired(token)) {
        console.log('Token is expired');
        window.location.href = './loginSignup.html';
        localStorage.removeItem('token');
      } else {
        console.log('Token is valid');
        loadTeams();
      }
  
    
    // Show loading spinner
    function showSpinner() {
        document.getElementById('loadingSpinner').style.display = 'flex';
      }
  
      // Hide loading spinner
      function hideSpinner() {
        document.getElementById('loadingSpinner').style.display = 'none';
      }
    
    // Clear all alerts (both side and center)
    function clearAllAlerts() {
      // Clear right-side alerts
      const sideAlertContainer = document.getElementById('custom-alert-container');
      if (sideAlertContainer) {
        sideAlertContainer.innerHTML = '';
      }
      
      // Clear center alerts
      const centerAlertContainer = document.getElementById('center-alert-container');
      if (centerAlertContainer) {
        centerAlertContainer.innerHTML = '';
      }
    }
    
    // Show custom alert/toast notification
    function showToast(title, message, type = 'info') {
      // Clear all existing alerts first
      clearAllAlerts();
      
      // Create a new custom alert
      const alertContainer = document.getElementById('custom-alert-container');
      if (!alertContainer) {
        console.error('Alert container not found!');
        return;
      }
      
      // Create alert element
      const alertId = `alert-${Date.now()}`;
      const alert = document.createElement('div');
      alert.id = alertId;
      alert.className = `custom-alert custom-alert-${type}`;
      
      // Create content
      alert.innerHTML = `
        <div class="custom-alert-content">
          <strong>${title}</strong> ${message}
        </div>
        <button class="custom-alert-close">&times;</button>
      `;
      
      // Add to container
      alertContainer.appendChild(alert);
      
      // Add close handler
      const closeBtn = alert.querySelector('.custom-alert-close');
      closeBtn.addEventListener('click', () => {
        removeAlert(alertId);
      });
      
      // Make visible after a small delay (for animation)
      setTimeout(() => {
        alert.classList.add('show');
      }, 10);
      
      // Auto remove after 3 seconds
      setTimeout(() => {
        removeAlert(alertId);
      }, 3000);
    }
    
    // Remove alert function
    function removeAlert(alertId) {
      const alert = document.getElementById(alertId);
      if (alert) {
        alert.classList.remove('show');
        
        // Wait for transition to complete before removing from DOM
        setTimeout(() => {
          if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
          }
        }, 300);
      }
    }

    // Show center alert notification
    function showCenterAlert(title, message, type = 'info') {
      // Clear all existing alerts first
      clearAllAlerts();
      
      // Create a new center alert
      const alertContainer = document.getElementById('center-alert-container');
      if (!alertContainer) {
        console.error('Center alert container not found!');
        return;
      }
      
      // Create alert element
      const alertId = `center-alert-${Date.now()}`;
      const alert = document.createElement('div');
      alert.id = alertId;
      alert.className = `center-alert center-alert-${type}`;
      
      // Create content
      alert.innerHTML = `
        <div class="center-alert-content">
          <strong>${title}:</strong> ${message}
        </div>
        <button class="center-alert-close">&times;</button>
      `;
      
      // Add to container
      alertContainer.appendChild(alert);
      
      // Add close handler
      const closeBtn = alert.querySelector('.center-alert-close');
      closeBtn.addEventListener('click', () => {
        removeCenterAlert(alertId);
      });
      
      // Make visible after a small delay (for animation)
      setTimeout(() => {
        alert.classList.add('show');
      }, 10);
      
      // Auto remove after 4 seconds
      setTimeout(() => {
        removeCenterAlert(alertId);
      }, 4000);
    }
    
    // Remove center alert function
    function removeCenterAlert(alertId) {
      const alert = document.getElementById(alertId);
      if (alert) {
        alert.classList.remove('show');
        
        // Wait for transition to complete before removing from DOM
        setTimeout(() => {
          if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
          }
        }, 300);
      }
    }
  
    // Show alert (unified function to show only one alert)
    function showAlert(title, message, type = 'info', position = 'center') {
      // Clear all previous alerts
      clearAllAlerts();
      
      // Use the appropriate alert function based on position
      if (position === 'center') {
        showCenterAlert(title, message, type);
      } else {
        showToast(title, message, type);
      }
    }
  
// Fetch teams from API
async function loadTeams() {
  showSpinner();
  try {
    const response = await fetch('http://localhost:3000/api/v1/teams', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      // Unauthorized, token might be invalid
      localStorage.removeItem('token');
      window.location.href = './loginSignup.html';
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API response:', data); // Log the structure of the response
    
    // Handle different response structures
    let teamsArray = [];
    if (Array.isArray(data)) {
      teamsArray = data;
    } else if (data.teams && Array.isArray(data.teams)) {
      teamsArray = data.teams;
    } else if (data.data && Array.isArray(data.data)) {
      teamsArray = data.data;
    } else if (typeof data === 'object' && data !== null) {
      // If it's an object but not what we expected, try to extract any array
      const possibleArrays = Object.values(data).filter(val => Array.isArray(val));
      if (possibleArrays.length > 0) {
        teamsArray = possibleArrays[0];
      } else {
        console.warn('Could not find teams array in response:', data);
      }
    }
    
    // Filter teams to only show those where the user is a member with accepted status
    const userId = getUserIdFromToken(token);
    console.log('Current user ID:', userId);
    
    const filteredTeams = teamsArray.filter(team => {
      // Check if the team has members property and it's an array
      if (!team.members || !Array.isArray(team.members)) {
        console.log(`Team ${team.name} has no valid members array`);
        return false;
      }
      
      // Find the current user in the members array
      const userMembership = team.members.find(member => {
        // Check based on direct userId if available
        if (member.userId && member.userId === userId) {
          return true;
        }
        
        // Check based on nested user object if available
        if (member.user && member.user._id === userId) {
          return true;
        }
        
        // Check if the member is the current user and has accepted status
        return false;
      });
      
      // Check if the user is a member and has accepted status
      if (userMembership) {
        const status = userMembership.status || (userMembership.user && userMembership.user.status);
        console.log(`User's status in team ${team.name}: ${status}`);
        return status === 'accepted';
      }
      
      return false;
    });
    
    console.log(`Filtered teams: ${filteredTeams.length} out of ${teamsArray.length}`);
    displayTeams(filteredTeams);
    
    // Show appropriate message based on number of teams
    if (filteredTeams.length === 0) {
      showAlert('No Teams Found', 'You are not a member of any teams yet. You can create a team or wait for invitations.', 'info', 'center');
    } else {
      showAlert('Teams Loaded', `${filteredTeams.length} team${filteredTeams.length === 1 ? '' : 's'} loaded successfully`, 'success', 'center');
    }
    
  } catch (error) {
    console.error('Error fetching teams:', error);
    document.getElementById('teamsContainer').innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="alert alert-danger">
          <p>Error loading teams: ${error.message}</p>
          <button class="btn btn-outline-danger mt-2" onclick="loadTeams()">Retry</button>
        </div>
      </div>
    `;
    // Show only error alert
    showAlert('Error', `Failed to load teams: ${error.message}`, 'danger', 'center');
  } finally {
    hideSpinner();
  }
}

// Helper function to extract user ID from JWT token
function getUserIdFromToken(token) {
  if (!token) return null;
  
  try {
    // Get the payload part of the token (second part)
    const payload = token.split('.')[1];
    // Decode the Base64URL-encoded payload
    const decodedPayload = JSON.parse(atob(payload));
    // Return the user ID (usually in the 'id' or '_id' or 'sub' field)
    return decodedPayload.id || decodedPayload._id || decodedPayload.sub;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
}

// Function to invite a user to a team
async function inviteToTeam(teamId, userData) {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/teams/${teamId}/invite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    
    // Return the response with the email for tracking which invitation failed if needed
    return { 
      ok: result.success, 
      status: response.status, 
      message: result.message || 'Invitation sent',
      email: userData.email 
    };
  } catch (error) {
    console.error(`Error inviting user: ${userData.email}`, error);
    return { 
      ok: false, 
      status: 500, 
      message: error.message,
      email: userData.email 
    };
  }
}

// Display teams in the UI
function displayTeams(teams) {
  const teamsContainer = document.getElementById('teamsContainer');
  
  if (!teams || teams.length === 0) {
    teamsContainer.innerHTML = `
      <div class="col-12 text-center py-5">
        <p>No teams found. Create your first team!</p>
        <button class="btn btn-primary mt-3" data-bs-toggle="modal" data-bs-target="#createTeamModal">
          Create Team
        </button>
      </div>
    `;
    return;
  }

  let teamsHTML = '';
  teams.forEach(team => {
    // Extract team members' information
    const members = team.members
      .filter(member => member.user && member.status === 'accepted')
      .map(member => member.user)
      .filter(member => member);

    // Calculate the number of members to display
    const maxDisplayedMembers = Math.min(4, members.length);

    teamsHTML += `
      <div class="col-md-4 mb-4">
        <div class="card shadow-sm team-card" data-team-id="${team._id || team.id}" data-team-name="${team.name}">
          <button class="delete-team-btn" title="Delete Team" data-team-id="${team._id || team.id}" data-team-name="${team.name}">
            <i class="fas fa-trash-alt"></i>
          </button>
          <button class="btn btn-outline-primary btn-sm invite-btn" title="Invite Members" data-team-id="${team._id || team.id}" data-team-name="${team.name}">
            <i class="fas fa-user-plus"></i> Invite
          </button>
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="card-title">${team.name}</h5>
              <span class="badge rounded-pill" style="background-color: ${team.color || '#0d6efd'}">Team</span>
            </div>
            <p class="card-text">${team.description || 'No description available'}</p>
            <div class="d-flex justify-content-between align-items-center mt-3">
              <div class="d-flex">
                <!-- Display team members -->
                ${members.slice(0, maxDisplayedMembers).map(member => `
                  <img src="${member.avatar || '../Images/default-avatar.png'}" class="team-member-avatar" alt="${member.name}">
                `).join('')}
                ${members.length > maxDisplayedMembers ? `
                  <div class="team-member-count">+${members.length - maxDisplayedMembers}</div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  teamsContainer.innerHTML = teamsHTML;

  // Add event listeners to team cards for viewing details
  document.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent the card click event from firing
      const teamId = e.target.closest('.team-card').getAttribute('data-team-id');
      showTeamDetails(teamId);
    });
  });

  // Add event listeners for card click (same as view details)
  document.querySelectorAll('.team-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Only proceed if the delete button wasn't clicked
      if (!e.target.closest('.delete-team-btn') && !e.target.closest('.invite-btn')) {
        const teamId = card.getAttribute('data-team-id');
        showTeamDetails(teamId);
      }
    });
  });

  // Add event listeners to delete buttons
  document.querySelectorAll('.delete-team-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent the card click event
      const teamId = btn.getAttribute('data-team-id');
      const teamName = btn.getAttribute('data-team-name');
      showDeleteConfirmation(teamId, teamName);
    });
  });

  // Add event listeners to invite buttons
  document.querySelectorAll('.invite-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent the card click event
      const teamId = btn.getAttribute('data-team-id');
      const teamName = btn.getAttribute('data-team-name');
      showInviteMembersModal(teamId, teamName);
    });
  });
}

// Show team details
async function showTeamDetails(teamId) {
  // Clear previous content
  const detailsContent = document.getElementById('teamDetailsContent');
  detailsContent.innerHTML = `
    <div class="text-center py-3">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading team details...</p>
    </div>
  `;
  
  // Show the modal
  const modal = new bootstrap.Modal(document.getElementById('teamDetailsModal'));
  modal.show();
  
  // Set the teamId for invite button
  document.getElementById('inviteTeamMembersBtn').setAttribute('data-team-id', teamId);
  
  try {
    const response = await fetch(`http://localhost:3000/api/v1/teams/${teamId}`, { 
      method: 'GET', 
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      } 
    });
    
    if (!response.ok) { 
      throw new Error(`HTTP error! status: ${response.status}`); 
    }
    
    const teamData = await response.json();
    
    // Log the response for debugging
    console.log('Team details response:', teamData.message || teamData); ;
    
    // Handle the specific structure of your API response
    // The team data is directly in the response, not nested under 'message'
    const team = teamData.message;
    
    // Generate members HTML
    let membersHTML = '<p>No team members available.</p>';
    if (team.members && Array.isArray(team.members) && team.members.length > 0) {
      membersHTML = team.members.map(member => {
        const userId = member.userId || 'unknown';
        const memberName = member.name || 'Unnamed User';
        const memberEmail = member.email || 'No email';
        const shortId = userId.substring(0, 8);
        
        return `
          <div class="card p-2" style="width: 150px;">
            <div class="text-center mt-2">
              <p class="mb-0 fw-bold">${memberName}</p>
              <small class="text-muted">${memberEmail}</small>
            </div>
          </div>
        `;
      }).join('');
    }
    
    // Generate projects HTML
    let projectsHTML = '<p>No projects available for this team.</p>';
    const projectsArray = team.projectWorked || [];
    const projectsCount = Array.isArray(projectsArray) ? projectsArray.length : 0;
    
    if (projectsCount > 0) {
      projectsHTML = `
        <div class="list-group">
          ${projectsArray.map(project => {
            const projectName = project.name || 'Unnamed Project';
            return `
              <a href="#" class="list-group-item list-group-item-action">
                ${projectName}
              </a>
            `;
          }).join('')}
        </div>
      `;
    }
    
    // Update the details content with actual team data
    detailsContent.innerHTML = `
      <div class="row">
        <div class="col-md-12">
          <h4>Team: ${team.name || 'Unnamed Team'}</h4>
          <hr>
          <h5>Team Members (${team.members ? team.members.length : 0})</h5>
          <div class="d-flex flex-wrap gap-2 mt-3">
            ${membersHTML}
          </div>
          <hr>
          <h5>Projects</h5>
          <p>${projectsCount} project${projectsCount === 1 ? '' : 's'} found</p>
          ${projectsHTML}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error fetching team details:', error);
    detailsContent.innerHTML = `
      <div class="alert alert-danger">
        <p>Error loading team details: ${error.message}</p>
        <button class="btn btn-outline-danger mt-2" onclick="showTeamDetails('${teamId}')">Retry</button>
      </div>
    `;
  }
}
      // Show delete confirmation modal
      function showDeleteConfirmation(teamId, teamName) {
        // Set the team name in the modal
        document.getElementById('deleteTeamName').textContent = teamName;
        
        // Set the team ID for the confirm button
        document.getElementById('confirmDeleteBtn').setAttribute('data-team-id', teamId);
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        modal.show();
      }
  
      // Show invite members modal
      function showInviteMembersModal(teamId, teamName) {
        // Reset the form
        document.getElementById('inviteForm').reset();
        document.getElementById('emailList').innerHTML = '<p class="text-muted" id="noEmailsMsg">No emails added yet</p>';
        document.getElementById('sendInvitesBtn').disabled = true;
        
        // Set the team details
        document.getElementById('inviteMembersModalLabel').textContent = `Invite Members to ${teamName}`;
        document.getElementById('sendInvitesBtn').setAttribute('data-team-id', teamId);
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('inviteMembersModal'));
        modal.show();
      }
  
      // Delete team event handler
      document.getElementById('confirmDeleteBtn').addEventListener('click', async function() {
        const teamId = this.getAttribute('data-team-id');
        const teamName = document.getElementById('deleteTeamName').textContent;
        
        // Hide the confirmation modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        modal.hide();
        
        // Show loading spinner
        showSpinner();
        
        try {
          const response = await fetch(`http://localhost:3000/api/v1/teams/${teamId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          // Show success message
          const result = await response.json();
          console.log('Team deleted:', result);
          
          // Show only one alert for deletion
          showAlert('Team Deleted', `Team "${teamName}" has been successfully deleted`, 'success', 'center');
          
          // Reload teams
          loadTeams();
          
        } catch (error) {
          console.error('Error deleting team:', error);
          // Show only error alert
          showAlert('Deletion Failed', `Could not delete team "${teamName}": ${error.message}`, 'danger', 'center');
        } finally {
          hideSpinner();
        }
      });
  
      // Create new team
      document.getElementById('createTeamBtn').addEventListener('click', async () => {
        const teamName = document.getElementById('teamName').value.trim();
        const teamDescription = document.getElementById('teamDescription').value.trim();
        const teamColor = document.getElementById('teamColor').value;
        
        if (!teamName) {
          showAlert('Warning', 'Please enter a team name', 'warning', 'center');
          return;
        }
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createTeamModal'));
        modal.hide();
        
        // Show loading spinner
        showSpinner();
        
        try {
          const response = await fetch('http://localhost:3000/api/v1/teams/create', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: teamName,
              description: teamDescription,
              color: teamColor
            })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const result = await response.json();
          console.log('Team created:', result);
          
          // Show only one success message
          showAlert('Success', `Team "${teamName}" created successfully!`, 'success', 'center');
          
          // Reload teams
          loadTeams();
          
          // Reset form
          document.getElementById('createTeamForm').reset();
          
        } catch (error) {
          console.error('Error creating team:', error);
          // Show only error alert
          showAlert('Error', `Failed to create team: ${error.message}`, 'danger', 'center');
        } finally {
          hideSpinner();
        }
      });
  
      // Add email to the invitation list
      document.getElementById('addEmailBtn').addEventListener('click', addEmail);
      
      // Allow pressing Enter to add email
      document.getElementById('memberEmail').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addEmail();
        }
      });
      
      // Function to add email to the list
      function addEmail() {
        const emailInput = document.getElementById('memberEmail');
        const email = emailInput.value.trim();
        
        if (!email) return;
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          showAlert('Invalid Email', 'Please enter a valid email address', 'warning', 'center');
          return;
        }
        
        // Check if email already exists in the list
        const existingEmails = Array.from(document.querySelectorAll('.email-chip')).map(chip => 
          chip.getAttribute('data-email')
        );
        
        if (existingEmails.includes(email)) {
          showAlert('Duplicate Email', 'This email is already in the list', 'warning', 'center');
          emailInput.value = '';
          return;
        }
        
        // Remove "no emails" message if it exists
        const noEmailsMsg = document.getElementById('noEmailsMsg');
        if (noEmailsMsg) {
          noEmailsMsg.remove();
        }
        
        // Create email chip
        const emailList = document.getElementById('emailList');
        const emailChip = document.createElement('div');
        emailChip.className = 'email-chip';
        emailChip.setAttribute('data-email', email);
        emailChip.innerHTML = `
          ${email}
          <span class="remove-email"><i class="fas fa-times"></i></span>
        `;
        
        // Add event listener to remove button
        emailChip.querySelector('.remove-email').addEventListener('click', function() {
          emailChip.remove();
          
          // If no emails left, show the message again
          if (document.querySelectorAll('.email-chip').length === 0) {
            document.getElementById('emailList').innerHTML = '<p class="text-muted" id="noEmailsMsg">No emails added yet</p>';
            document.getElementById('sendInvitesBtn').disabled = true;
          }
        });
        
        // Add to the list
        emailList.appendChild(emailChip);
        
        // Clear input
        emailInput.value = '';
        
        // Enable send button
        document.getElementById('sendInvitesBtn').disabled = false;
      }
      
      // Handle invites from team details modal
      document.getElementById('inviteTeamMembersBtn').addEventListener('click', function() {
        const teamId = this.getAttribute('data-team-id');
        const teamName = document.getElementById('teamDetailsModalLabel').textContent.replace('Team Details', '').trim();
        
        // Hide the details modal
        const detailsModal = bootstrap.Modal.getInstance(document.getElementById('teamDetailsModal'));
        detailsModal.hide();
        
        // Show the invite modal
        setTimeout(() => {
          showInviteMembersModal(teamId, teamName);
        }, 500);
      });
      
      // Send invites
      document.getElementById('sendInvitesBtn').addEventListener('click', async function() {
        const teamId = this.getAttribute('data-team-id');
        
        // Get all emails
        const emailChips = document.querySelectorAll('.email-chip');
        if (emailChips.length === 0) {
          showAlert('No Emails', 'Please add at least one email', 'warning', 'center');
          return;
        }
        
        const emails = Array.from(emailChips).map(chip => chip.getAttribute('data-email'));
        
        // Hide the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('inviteMembersModal'));
        modal.hide();
        
        // Show loading spinner
        showSpinner();
        
        try {
          // Send invites to all emails
          const responses = await Promise.all(emails.map(email => {
            return inviteToTeam(teamId, { email });
          }));
          
          // Check for any errors in responses
          const failedInvitations = responses.filter(response => !response.ok);
          
          if (failedInvitations.length > 0) {
            const failedEmails = failedInvitations.map(response => response.email).join(', ');
            throw new Error(`Failed to send invitations to: ${failedEmails}`);
          }
          
          // Show only one success message
          showAlert('Invitations Sent', 'All invitations were sent successfully!', 'success', 'center');
          
          // Reset the invite form
          document.getElementById('inviteForm').reset();
          document.getElementById('emailList').innerHTML = '<p class="text-muted" id="noEmailsMsg">No emails added yet</p>';
          document.getElementById('sendInvitesBtn').disabled = true;
          
        } catch (error) {
          console.error('Error sending invites:', error);
          // Show only error alert
          showAlert('Failed to Send Invites', error.message, 'danger', 'center');
        } finally {
          hideSpinner();
        }
      });
  
      // Initialize the page
      async function initializePage() {
        setupCharacterCounter('teamName', 'teamNameCount', 50);
        setupCharacterCounter('teamDescription', 'teamDescriptionCount', 200);
        setupCharacterCounter('editTeamName', 'editTeamNameCount', 50);
        setupCharacterCounter('editTeamDescription', 'editTeamDescriptionCount', 200);
        
        await fetchTeams();
        initializeEventListeners();
      }
  
      // Run initialization
      initializePage();

    // Function to handle search
    document.addEventListener('DOMContentLoaded', function() {
      const searchInput = document.getElementById('teamSearch');
      if (searchInput) {
        searchInput.addEventListener('input', function() {
          const searchTerm = this.value.toLowerCase().trim();
          filterTeams(searchTerm);
        });
      }
    });
    



    
    // Filter teams based on search term
    function filterTeams(searchTerm) {
      const teamCards = document.querySelectorAll('.team-card');
      
      if (!teamCards.length) return;
      
      let matchCount = 0;
      
      teamCards.forEach(card => {
        const teamName = card.getAttribute('data-team-name').toLowerCase();
        const teamDescription = card.querySelector('.card-text')?.textContent.toLowerCase();
        
        if (teamName.includes(searchTerm) || (teamDescription && teamDescription.includes(searchTerm))) {
          card.closest('.col-md-4').style.display = '';
          matchCount++;
        } else {
          card.closest('.col-md-4').style.display = 'none';
        }
      });
      
      // Show a message if no teams match
      const teamsContainer = document.getElementById('teamsContainer');
      const noResultsEl = document.getElementById('no-search-results');
      
      if (matchCount === 0 && searchTerm !== '') {
        if (!noResultsEl) {
          const noResults = document.createElement('div');
          noResults.id = 'no-search-results';
          noResults.className = 'col-12 text-center py-3';
          noResults.innerHTML = `<p>No teams match "${searchTerm}"</p>`;
          teamsContainer.appendChild(noResults);
        }
      } else if (noResultsEl) {
        noResultsEl.remove();
      }
    }






    // Function that checks if it's the first visit to the teams page
    function checkFirstVisit() {
      const visitedBefore = sessionStorage.getItem('teamsPageVisited');
      
      if (!visitedBefore) {
        // First visit in this session
        sessionStorage.setItem('teamsPageVisited', 'true');
        showAlert('Welcome', 'Welcome to Teams management page', 'info', 'center');
      }
    }
    
    // Run when page loads
    document.addEventListener('DOMContentLoaded', function() {
      // Check if first visit
      checkFirstVisit();
      
      // Other existing initialization code
      const searchInput = document.getElementById('teamSearch');
      if (searchInput) {
        searchInput.addEventListener('input', function() {
          const searchTerm = this.value.toLowerCase().trim();
          filterTeams(searchTerm);
        });
      }
    });







    // Setup character counter for text inputs
    function setupCharacterCounter(inputId, counterId, maxLength) {
      const input = document.getElementById(inputId);
      const counter = document.getElementById(counterId);
      
      if (!input || !counter) return;
      
      // Initialize counter
      counter.textContent = input.value.length;
      
      // Update counter on input
      input.addEventListener('input', function() {
        counter.textContent = this.value.length;
      });
    }
    
    // Initialize event listeners
    function initializeEventListeners() {
      console.log('Initializing event listeners');
    }
    
    // Helper function to fetch teams that works with loadTeams
    async function fetchTeams() {
      await loadTeams();
    }
