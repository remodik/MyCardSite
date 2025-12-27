// Modal Component

let currentModal = null;

// Show a modal
export function showModal(content, options = {}) {
    // Close existing modal
    hideModal();

    const modal = document.createElement('div');
    modal.id = 'modal-overlay';
    modal.className = 'modal-backdrop animate-fade-in';
    modal.innerHTML = `
        <div class="surface-card p-8 max-w-${options.size || 'md'} w-full modal-content animate-fade-in ${options.className || ''}">
            ${options.title ? `
                <h2 class="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    ${options.icon ? `<i class="${options.icon} text-[#7289DA]"></i>` : ''}
                    ${options.title}
                </h2>
            ` : ''}
            <div id="modal-body">${content}</div>
        </div>
    `;

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', handleEscape);

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    currentModal = modal;

    return modal;
}

// Hide the current modal
export function hideModal() {
    if (currentModal) {
        document.body.removeChild(currentModal);
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscape);
        currentModal = null;
    }
}

// Handle Escape key
function handleEscape(e) {
    if (e.key === 'Escape') {
        hideModal();
    }
}

// Confirm dialog
export function showConfirm(message, onConfirm) {
    const content = `
        <p class="text-slate-200 mb-6">${message}</p>
        <div class="flex justify-end gap-3">
            <button id="confirm-cancel" class="muted-button">Отмена</button>
            <button id="confirm-ok" class="primary-button">Подтвердить</button>
        </div>
    `;

    showModal(content, { title: 'Подтверждение', icon: 'fas fa-question-circle' });

    document.getElementById('confirm-cancel').addEventListener('click', hideModal);
    document.getElementById('confirm-ok').addEventListener('click', () => {
        hideModal();
        onConfirm();
    });
}

// Alert dialog
export function showAlert(message, type = 'info') {
    const icons = {
        info: 'fas fa-info-circle text-blue-400',
        success: 'fas fa-check-circle text-green-400',
        warning: 'fas fa-exclamation-triangle text-yellow-400',
        error: 'fas fa-times-circle text-red-400'
    };

    const content = `
        <div class="flex items-center gap-4 mb-6">
            <i class="${icons[type]} text-3xl"></i>
            <p class="text-slate-200">${message}</p>
        </div>
        <div class="flex justify-end">
            <button id="alert-ok" class="primary-button">OK</button>
        </div>
    `;

    showModal(content);

    document.getElementById('alert-ok').addEventListener('click', hideModal);
}
