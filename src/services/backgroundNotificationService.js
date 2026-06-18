function getNotificationContainer(maxWidth = '300px') {
  let notificationContainer = document.getElementById('background-update-notifications');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'background-update-notifications';
    notificationContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      max-width: ${maxWidth};
    `;
    document.body.appendChild(notificationContainer);
  } else {
    notificationContainer.style.maxWidth = maxWidth;
  }

  return notificationContainer;
}

function ensureNotificationStyles() {
  if (document.getElementById('background-update-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'background-update-styles';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateY(0); opacity: 1; }
      to { transform: translateY(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

function scheduleRemoval(notification, timeout) {
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }
  }, timeout);
}

function createCloseButton() {
  return `
    <button onclick="this.parentElement.parentElement.remove()" style="
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      padding: 0;
      margin-left: auto;
      flex-shrink: 0;
    ">×</button>
  `;
}

export function showBackgroundUpdateNotification(message, type = 'info') {
  const notificationContainer = getNotificationContainer('300px');
  ensureNotificationStyles();

  const notification = document.createElement('div');
  notification.style.cssText = `
    background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
    color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
    border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
    border-radius: 4px;
    padding: 12px 16px;
    margin-bottom: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span>${message}</span>
      ${createCloseButton()}
    </div>
  `;

  notificationContainer.appendChild(notification);
  scheduleRemoval(notification, type === 'error' ? 8000 : 5000);
}

export function showDetailedChangesNotification(added, removed) {
  if (added.length === 0 && removed.length === 0) {
    showBackgroundUpdateNotification('📋 No hay cambios disponibles', 'info');
    return;
  }

  let message = '✅ Biblioteca actualizada\n\n';

  if (added.length > 0) {
    message += `➕ Agregados (${added.length}):\n`;
    added.slice(0, 5).forEach(item => {
      message += `  • ${item.Artista} - ${item.Disco}\n`;
    });
    if (added.length > 5) {
      message += `  ... y ${added.length - 5} más\n`;
    }
    message += '\n';
  }

  if (removed.length > 0) {
    message += `➖ Eliminados (${removed.length}):\n`;
    removed.slice(0, 5).forEach(item => {
      message += `  • ${item.Artista} - ${item.Disco}\n`;
    });
    if (removed.length > 5) {
      message += `  ... y ${removed.length - 5} más\n`;
    }
  }

  const notificationContainer = getNotificationContainer('400px');
  ensureNotificationStyles();

  const notification = document.createElement('div');
  notification.style.cssText = `
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
    border-radius: 4px;
    padding: 16px;
    margin-bottom: 10px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    font-size: 14px;
    font-family: monospace;
    white-space: pre-line;
    max-height: 300px;
    overflow-y: auto;
    animation: slideIn 0.3s ease-out;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 8px;">
      <div style="flex: 1;">${message.replace(/\n/g, '<br>')}</div>
      ${createCloseButton()}
    </div>
  `;

  notificationContainer.appendChild(notification);
  scheduleRemoval(notification, 10000);
}
