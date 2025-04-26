/**
 * Toast notification system for Tasky application
 */

// Show a toast notification
function showToast(title, message, type = 'info') {
  const toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    console.error('Toast container not found. Create a div with class toast-container');
    return;
  }

  const toastId = `toast-${Date.now()}`;
  
  const toastHTML = `
    <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header bg-${type} text-white">
        <strong class="me-auto">${title}</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    </div>
  `;
  
  toastContainer.insertAdjacentHTML('beforeend', toastHTML);
  const toastElement = document.getElementById(toastId);
  
  // Bootstrap 5 toast initialization
  const toast = new bootstrap.Toast(toastElement, { 
    autohide: true, 
    delay: 3000 
  });
  
  toast.show();
  
  // Remove toast from DOM after it's hidden
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}

// For compatibility with the existing alert function
function showAlert(message, type) {
  // Map alert types to toast types
  const typeMap = {
    'success': 'success',
    'error': 'danger',
    'info': 'info',
    'warning': 'warning'
  };
  
  showToast('Notification', message, typeMap[type] || 'info');
}
