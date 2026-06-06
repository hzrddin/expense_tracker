// Storage 

function getRecords() {
  return JSON.parse(localStorage.getItem('history')) || [];
}

function saveRecords(arr) {
  localStorage.setItem('history', JSON.stringify(arr));
}

function getLogs() {
  return JSON.parse(localStorage.getItem('activityLog')) || [];
}

function saveLogs(arr) {
  localStorage.setItem('activityLog', JSON.stringify(arr));
}

// ID generators

function nextExpenseId() {
  let counter = parseInt(localStorage.getItem('expenseCounter') || '0', 10) + 1;
  localStorage.setItem('expenseCounter', counter);
  return 'EP-' + counter.toString().padStart(4, '0');
}

function nextLogId() {
  let counter = parseInt(localStorage.getItem('logCounter') || '0', 10) + 1;
  localStorage.setItem('logCounter', counter);
  return 'L-' + counter.toString().padStart(4, '0');
}

// Log 

function writeLog(action, relatedExpenseId) {
  const logs = getLogs();
  const now  = new Date();
  logs.push({
    id:        nextLogId(),
    date:      now.toLocaleDateString(),
    time:      now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    action:    action,
    relatedId: relatedExpenseId || '—'
  });
  saveLogs(logs);
}

// Validation helper 

function setFieldError(fieldId, message) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.classList.add('is-invalid');
  el.classList.remove('is-valid');
  // Update or create the sibling feedback div
  let fb = el.parentElement.querySelector('.invalid-feedback');
  if (!fb) {
    fb = document.createElement('div');
    fb.className = 'invalid-feedback';
    el.after(fb);
  }
  fb.textContent = message;
}

function clearFieldError(fieldId) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.classList.remove('is-invalid');
  el.classList.add('is-valid');
}

function resetFieldStates() {
  ['expenseAmount', 'expenseDate', 'expenseCategory', 'expenseDescription'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('is-invalid', 'is-valid');
  });
}

// New Expense

function saveRecord() {
  const amountRaw  = document.getElementById('expenseAmount').value.trim();
  const date       = document.getElementById('expenseDate').value.trim();
  const category   = document.getElementById('expenseCategory').value;
  const description= document.getElementById('expenseDescription').value.trim();

  // Reset previous states before re-validating
  resetFieldStates();

  let valid = true;

  if (!amountRaw) {
    setFieldError('expenseAmount', 'Amount is required.');
    valid = false;
  } else if (isNaN(parseFloat(amountRaw)) || parseFloat(amountRaw) <= 0) {
    setFieldError('expenseAmount', 'Enter a valid amount greater than 0.');
    valid = false;
  } else {
    clearFieldError('expenseAmount');
  }

  if (!date) {
    setFieldError('expenseDate', 'Please select a date.');
    valid = false;
  } else {
    clearFieldError('expenseDate');
  }

  if (!category) {
    setFieldError('expenseCategory', 'Please choose a category.');
    valid = false;
  } else {
    clearFieldError('expenseCategory');
  }

  if (!description) {
    setFieldError('expenseDescription', 'Please enter a description.');
    valid = false;
  } else {
    clearFieldError('expenseDescription');
  }

  // Stop here if anything is invalid
  if (!valid) return;

  const now = new Date();
  const newRecord = {
    id:          nextExpenseId(),
    amount:      parseFloat(amountRaw).toFixed(2),
    date:        date,
    category:    category,
    description: description,
    dateCreated: now.toLocaleDateString(),
    timeCreated: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    dateUpdated: '',
    timeUpdated: ''
  };

  const records = getRecords();
  records.push(newRecord);
  saveRecords(records);

  writeLog('Added expense', newRecord.id);

  // Reset form and clear all validation states
  document.getElementById('expenseAmount').value    = '';
  document.getElementById('expenseDate').value      = getTodayISO();
  document.getElementById('expenseCategory').value  = '';
  document.getElementById('expenseDescription').value = '';
  resetFieldStates();

  showToast('Expense saved successfully!', 'success');
}

// Today button 

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function setToday() {
  const el = document.getElementById('expenseDate');
  if (el) el.value = getTodayISO();
}

// Trans - render table

function renderTransactions() {
  const tbody = document.getElementById('expenseTableBody');
  if (!tbody) return;

  const records = getRecords();

  if (records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted py-4">No expenses recorded yet.</td>
      </tr>`;
    return;
  }

  tbody.innerHTML = records.map(record => {
    const updateDisplay = record.dateUpdated
      ? `${record.dateUpdated}<br><span class="text-muted small">${record.timeUpdated}</span>`
      : '<span class="text-muted small">—</span>';

    return `
      <tr>
        <th scope="row" class="text-nowrap px-3 border-light">${record.id}</th>
        <td class="text-nowrap border-light">${record.date}</td>
        <td class="border-light">RM ${record.amount}</td>
        <td class="border-light">${record.category}</td>
        <td class="border-light">${record.description || '<span class="text-muted small">—</span>'}</td>
        <td class="text-nowrap border-light">
          ${record.dateCreated}<br><span class="text-muted small">${record.timeCreated}</span>
        </td>
        <td class="text-nowrap border-light">${updateDisplay}</td>
        <td class="border-light">
          <div class="d-flex align-items-center justify-content-center gap-2">
            <button class="btn btn-light border-0 p-2" title="Edit" onclick="openEditModal('${record.id}')">
              <img src="components/images/pencil-square.svg" width="16" alt="Edit">
            </button>
            <button class="btn btn-danger p-2" title="Delete" onclick="deleteRecord('${record.id}')">
              <img src="components/images/trash.svg" width="16" alt="Delete">
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// Delete Transaction

function deleteRecord(idToDelete) {
  if (!confirm('Are you sure you want to delete this expense?\n\nThis action cannot be undone.')) return;

  let records = getRecords();
  records = records.filter(r => r.id !== idToDelete);
  saveRecords(records);

  writeLog('Deleted expense', idToDelete);
  renderTransactions();
  showToast('Expense deleted.', 'danger');
}

// Clear All Transactions

function clearLogs() {
  if (!confirm('Are you sure you want to clear ALL transaction records?\n\nThis action cannot be undone.')) return;

  localStorage.removeItem('history');
  localStorage.removeItem('activityLog');
  localStorage.removeItem('expenseCounter');
  localStorage.removeItem('logCounter');

  renderTransactions();
  showToast('All records cleared.', 'warning');
}

// Edit Transactions

function ensureEditModal() {
  if (document.getElementById('editExpenseModal')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal fade" id="editExpenseModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold">Edit Expense</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="editId">
            <div class="mb-3">
              <label class="form-label small text-dark mb-1">Amount (RM)</label>
              <div class="input-group">
                <span class="input-group-text">RM</span>
                <input type="number" class="form-control" id="editAmount" min="0.01" step="0.01" placeholder="0.00">
                <div class="invalid-feedback">Enter a valid amount greater than 0.</div>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label small text-dark mb-1">Date</label>
              <input type="date" class="form-control" id="editDate">
              <div class="invalid-feedback">Please select a date.</div>
            </div>
            <div class="mb-3">
              <label class="form-label small text-dark mb-1">Category</label>
              <select class="form-select" id="editCategory">
                <option disabled value="">Choose Category</option>
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Education">Education</option>
                <option value="Shopping">Shopping</option>
                <option value="Health">Health</option>
                <option value="Others">Others</option>
              </select>
              <div class="invalid-feedback">Please choose a category.</div>
            </div>
            <div class="mb-3">
              <label class="form-label small text-dark mb-1">Description</label>
              <textarea class="form-control resize-none" id="editDescription" rows="3" placeholder="Expense Description"></textarea>
            </div>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-success" onclick="saveEdit()">
              <img src="components/images/floppy.svg" width="16" alt="Save"> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  `);
}

function openEditModal(id) {
  ensureEditModal();

  const record = getRecords().find(r => r.id === id);
  if (!record) return;

  // Clear any leftover validation states from a previous open
  ['editAmount', 'editDate', 'editCategory'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) el.classList.remove('is-invalid', 'is-valid');
  });

  document.getElementById('editId').value           = record.id;
  document.getElementById('editAmount').value        = record.amount;
  document.getElementById('editDate').value          = record.date;
  document.getElementById('editCategory').value      = record.category;
  document.getElementById('editDescription').value   = record.description;

  new bootstrap.Modal(document.getElementById('editExpenseModal')).show();
}

function saveEdit() {
  const id          = document.getElementById('editId').value;
  const amountRaw   = document.getElementById('editAmount').value.trim();
  const date        = document.getElementById('editDate').value.trim();
  const category    = document.getElementById('editCategory').value;
  const description = document.getElementById('editDescription').value.trim();

  // Validate inline
  let valid = true;

  const editAmount = document.getElementById('editAmount');
  const editDate   = document.getElementById('editDate');
  const editCat    = document.getElementById('editCategory');

  if (!amountRaw || isNaN(parseFloat(amountRaw)) || parseFloat(amountRaw) <= 0) {
    editAmount.classList.add('is-invalid'); valid = false;
  } else {
    editAmount.classList.remove('is-invalid'); editAmount.classList.add('is-valid');
  }

  if (!date) {
    editDate.classList.add('is-invalid'); valid = false;
  } else {
    editDate.classList.remove('is-invalid'); editDate.classList.add('is-valid');
  }

  if (!category) {
    editCat.classList.add('is-invalid'); valid = false;
  } else {
    editCat.classList.remove('is-invalid'); editCat.classList.add('is-valid');
  }

  if (!valid) return;

  const records = getRecords();
  const idx     = records.findIndex(r => r.id === id);
  if (idx === -1) return;

  const now = new Date();
  records[idx].amount      = parseFloat(amountRaw).toFixed(2);
  records[idx].date        = date;
  records[idx].category    = category;
  records[idx].description = description;
  records[idx].dateUpdated = now.toLocaleDateString();
  records[idx].timeUpdated = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  saveRecords(records);
  writeLog('Edited expense', id);

  bootstrap.Modal.getInstance(document.getElementById('editExpenseModal')).hide();
  renderTransactions();
  showToast('Expense updated successfully!', 'success');
}

// Log - render
function renderActivityLog() {
  const tbody = document.getElementById('activityLogBody');
  if (!tbody) return;

  const logs = getLogs();

  if (logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted py-4">No activity recorded yet.</td>
      </tr>`;
    return;
  }

  // Most recent first
  tbody.innerHTML = [...logs].reverse().map(log => `
    <tr>
      <th scope="row" class="text-nowrap px-3 border-light">${log.id}</th>
      <td class="text-nowrap border-light">
        ${log.date}<br><span class="text-muted small">${log.time}</span>
      </td>
      <td class="border-light">${log.action}</td>
      <td class="border-light">${log.relatedId}</td>
    </tr>
  `).join('');
}

// Toast utility
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }

  const id = 'toast-' + Date.now();
  const bgMap = { success: 'text-bg-success', danger: 'text-bg-danger', warning: 'text-bg-warning' };
  const bgClass = bgMap[type] || 'text-bg-secondary';

  container.insertAdjacentHTML('beforeend', `
    <div id="${id}" class="toast align-items-center ${bgClass} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body fw-semibold">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `);

  const toastEl = document.getElementById(id);
  const toast   = new bootstrap.Toast(toastEl, { delay: 3000 });
  toast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// Runs on every page
document.addEventListener('DOMContentLoaded', function () {
  // Render exist table
  renderTransactions();
  renderActivityLog();
});

