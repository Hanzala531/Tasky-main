// Add all notification-related code here

// Set up notification functionality when document is ready
document.addEventListener('DOMContentLoaded', function() {
  setupNotifications();
});

// Function to handle notifications
function setupNotifications() {
  const notificationIcon = document.getElementById('notify');
  const notifDropdown = document.querySelector('.notif-dropdown');
  
  if (!notificationIcon) {
    console.error("Notification icon element not found");
    return;
  }
  
  // Toggle notification dropdown on click
  notificationIcon.addEventListener('click', function(e) {
    e.stopPropagation();
    console.log("Notification icon clicked");
    
    // Toggle the visibility of notification dropdown
    if (notifDropdown.style.display === 'block') {
      notifDropdown.style.display = 'none';
    } else {
      fetchNotifications();
      notifDropdown.style.display = 'block';
    }
  });
  
  // Show notifications on hover
  notificationIcon.addEventListener('mouseenter', function() {
    console.log("Mouse entered #notify. Fetching notifications...");
    fetchNotifications();
  });
  
  // Close notification dropdown when clicking elsewhere
  document.addEventListener('click', function(e) {
    if (notifDropdown && notifDropdown.style.display === 'block' && !notifDropdown.contains(e.target) && e.target !== notificationIcon) {
      notifDropdown.style.display = 'none';
    }
  });
}

// Function to fetch notifications from the server
async function fetchNotifications() {
  const token = localStorage.getItem('token');
  const notifDropdown = document.querySelector('.notif-dropdown');
  
  if (!notifDropdown) return;
  
  // Show loading state
  notifDropdown.innerHTML = '<p>Loading notifications...</p>';
  
  try {
    const response = await fetch("http://localhost:4000/api/v1/notifications/", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log('Notifications data:', data);

    notifDropdown.innerHTML = ""; // Clear previous notifications

    if (data.success && data.message && data.message.length > 0) {
      // Add styles for notifications
      addNotificationStyles();
      
      data.message.forEach(notification => {
        const notifItem = document.createElement("div");
        notifItem.className = notification.read ? 'notification-item read' : 'notification-item unread';
    
        // Create notification content
        const notifContent = document.createElement('div');
        notifContent.className = 'notification-content';
        
        // Add message
        const messagePara = document.createElement('p');
        messagePara.textContent = notification.message || 'New notification';
        notifContent.appendChild(messagePara);
        
        // Add timestamp if available
        const timestamp = document.createElement('small');
        timestamp.textContent = formatNotificationTime(notification.createdAt || new Date());
        notifContent.appendChild(timestamp);
        
        // Add actions if it's an invitation
        if (notification.teamId) {
          // Create action buttons container
          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'notification-actions';
          actionsDiv.setAttribute('data-notification-id', notification._id);
          
          // Accept button - Add data-id attribute for both the notification and team ID
          const acceptBtn = document.createElement('button');
          acceptBtn.className = 'accept-btn';
          acceptBtn.textContent = '✓ Accept';
          acceptBtn.setAttribute('data-id', notification.teamId._id);
          acceptBtn.setAttribute('data-notification-id', notification._id);
          acceptBtn.onclick = () => handleInvitation(notification.teamId._id, "accept", notification._id);
          
          // Decline button - Add data-id attribute for both the notification and team ID
          const declineBtn = document.createElement('button');
          declineBtn.className = 'decline-btn';
          declineBtn.textContent = '✕ Decline';
          declineBtn.setAttribute('data-id', notification.teamId._id);
          declineBtn.setAttribute('data-notification-id', notification._id);
          declineBtn.onclick = () => handleInvitation(notification.teamId._id, "decline", notification._id);
          
          // Add buttons to actions container
          actionsDiv.appendChild(acceptBtn);
          actionsDiv.appendChild(declineBtn);
          notifContent.appendChild(actionsDiv);
        }
        
        // Add content to notification item
        notifItem.appendChild(notifContent);
        notifDropdown.appendChild(notifItem);
      });
    } else {
      // No notifications
      const noNotifMsg = document.createElement("p");
      noNotifMsg.textContent = "No notifications available";
      noNotifMsg.className = "text-muted text-center p-2";
      notifDropdown.appendChild(noNotifMsg);
    }

    // Display the dropdown
    notifDropdown.style.display = "block";

  } catch (error) {
    console.error('Error fetching notifications:', error);
    notifDropdown.innerHTML = '<p>Failed to load notifications</p>';
  }
}

// Function to handle invitation acceptance or decline
async function handleInvitation(teamId, action, notificationId) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error("No authentication token found.");
    return;
  }
  
  // Find the notification item by notification ID
  const actionsDiv = document.querySelector(`.notification-actions[data-notification-id="${notificationId}"]`);
  const notificationItem = actionsDiv ? actionsDiv.closest('.notification-item') : null;
  
  if (actionsDiv) {
    // Replace buttons with loading indicator
    const originalContent = actionsDiv.innerHTML;
    actionsDiv.innerHTML = `
      <div class="text-center w-100">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <span class="ms-2">${action === 'accept' ? 'Accepting' : 'Declining'}...</span>
      </div>
    `;
  }
  
  // Show feedback to user (using custom alert if available)
  if (typeof showAlert === 'function') {
    showAlert('Processing', `${action === 'accept' ? 'Accepting' : 'Declining'} invitation...`, 'info');
  } else if (typeof showCustomAlert === 'function') {
    showCustomAlert('Processing', `${action === 'accept' ? 'Accepting' : 'Declining'} invitation...`, 'info');
  }
  
  // Convert action to correct format ("accept" → "accepted", "decline" → "declined")
  const status = action === "accept" ? "accepted" : "declined";
  
  try {
    const response = await fetch(`http://localhost:4000/api/v1/teams/${teamId}/respond`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Show success message using available alert function
      if (typeof showAlert === 'function') {
        showAlert('Success', `Invitation ${status} successfully!`, 'success');
      } else if (typeof showCustomAlert === 'function') {
        showCustomAlert('Success', `Invitation ${status} successfully!`, 'success');
      }
      
      // Update UI to show action was taken
      if (actionsDiv) {
        // Replace buttons with status message
        actionsDiv.innerHTML = `
          <div class="action-status ${status}">
            <span>${status === "accepted" ? "✓ Accepted" : "✕ Declined"}</span>
          </div>
        `;
        
        // Add styling to the notification to show it's been acted upon
        if (notificationItem) {
          notificationItem.classList.add('acted');
          notificationItem.classList.add(status);
        }
      }
      
      // If accepting team invite, refresh team list after a delay
      if (action === 'accept') {
        setTimeout(() => {
          if (typeof loadTeams === 'function') {
            loadTeams();
          }
        }, 1500);
      }
    } else {
      // Show error message
      if (typeof showAlert === 'function') {
        showAlert('Error', "Failed to process the invitation.", 'error');
      } else if (typeof showCustomAlert === 'function') {
        showCustomAlert('Error', "Failed to process the invitation.", 'error');
      }
      
      // Restore original buttons if action failed
      if (actionsDiv && originalContent) {
        actionsDiv.innerHTML = originalContent;
      }
    }
  } catch (error) {
    console.error(`Error ${action}ing invitation:`, error);
    
    // Show error message
    if (typeof showAlert === 'function') {
      showAlert('Error', `Failed to ${action} invitation. Please try again.`, 'error');
    } else if (typeof showCustomAlert === 'function') {
      showCustomAlert('Error', `Failed to ${action} invitation. Please try again.`, 'error');
    }
    
    // Restore original buttons if action failed
    if (actionsDiv && originalContent) {
      actionsDiv.innerHTML = originalContent;
    }
  }
}

// Helper function to format notification time
function formatNotificationTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  
  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays === 0) {
    return `Today at ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
}

// Add notification styles to the document
function addNotificationStyles() {
  // Check if styles are already added
  if (document.getElementById('notification-styles')) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = 'notification-styles';
  styleElement.textContent = `
    .notif-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      width: 300px;
      max-height: 400px;
      overflow-y: auto;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      z-index: 1000;
      padding: 8px 0;
      margin-top: 5px;
    }
    
    .notification-item {
      padding: 10px 15px;
      border-bottom: 1px solid #eee;
      position: relative;
      cursor: default;
    }
    
    .notification-item.unread {
      background-color: rgba(13, 110, 253, 0.05);
      border-left: 4px solid #0d6efd;
    }
    
    .notification-item.read {
      opacity: 0.75;
    }
    
    .notification-content p {
      margin: 0 0 6px 0;
      color: #333;
      font-size: 14px;
    }
    
    .notification-content small {
      color: #888;
      font-size: 11px;
      display: block;
      margin-bottom: 8px;
    }
    
    .notification-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    
    .accept-btn, .decline-btn, .mark-read-btn {
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      border: none;
      font-weight: 500;
    }
    
    .accept-btn {
      background-color: #28a745;
      color: white;
    }
    
    .accept-btn:hover {
      background-color: #218838;
    }
    
    .decline-btn {
      background-color: #dc3545;
      color: white;
    }
    
    .decline-btn:hover {
      background-color: #c82333;
    }
    
    .mark-read-btn {
      background-color: #6c757d;
      color: white;
    }
    
    .mark-read-btn:hover {
      background-color: #5a6268;
    }

    /* Styles for action status after accept/decline */
    .notification-item.acted {
      opacity: 0.8;
      background-color: #f9f9f9;
    }
    
    .notification-item.accepted {
      border-left: 4px solid #28a745;
    }
    
    .notification-item.declined {
      border-left: 4px solid #dc3545;
    }
    
    .action-status {
      width: 100%;
      text-align: center;
      padding: 6px;
      border-radius: 4px;
      font-size: 13px;
      font-style: italic;
      color: #6c757d;
    }
    
    .action-status.accepted {
      background-color: rgba(40, 167, 69, 0.1);
    }
    
    .action-status.declined {
      background-color: rgba(220, 53, 69, 0.1);
    }
  `;
  
  document.head.appendChild(styleElement);
}

// Function for mock notifications (for testing)
function getMockNotifications() {
  return [
    {
      id: 'mock1',
      type: 'team_invite',
      message: 'You have been invited to join Team Alpha',
      read: false,
      createdAt: new Date(Date.now() - 30 * 60000) // 30 minutes ago
    },
    {
      id: 'mock2',
      type: 'notification',
      message: 'Your project "Website Redesign" status has been updated',
      read: false,
      createdAt: new Date(Date.now() - 120 * 60000) // 2 hours ago
    },
    {
      id: 'mock3',
      type: 'team_invite',
      message: 'John Smith invited you to join Team Beta',
      read: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60000) // 1 day ago
    }
  ];
}
