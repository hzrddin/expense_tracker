// ─── Storage helpers ────────────────────────────────────────────────────────

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

// ─── ID generators ──────────────────────────────────────────────────────────

// Uses a dedicated counter so IDs never collide after deletions
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

// ─── Activity log writer ─────────────────────────────────────────────────────

function writeLog(action, relatedExpenseId) {
  const logs = getLogs();
  const now = new Date();
  logs.push({
    id: nextLogId(),
    datetime: now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    action: action,
    relatedId: relatedExpenseId || '—'
  });
  saveLogs(logs);
}

// ─── new.html — form save ────────────────────────────────────────────────────

function initNewExpensePage() {
  // Set today's date as default
  const dateInput = document.getElementById('expenseDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }

  // "Today" button
  const todayBtn = document.querySelector('button[type="button"]');
  if (todayBtn && todayBtn.textContent.trim() === 'Today') {
    todayBtn.addEventListener('click', function () {
      document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    });
  }

  // Intercept the form's submit event — this is the correct way to work
  // alongside Bootstrap's needs-validation, not onclick on the button
  const form = document.querySelector('form.needs-validation');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault(); // always stop default page reload

    // Trigger Bootstrap visual validation
    form.classList.add('was-validated');

    // If the form is not valid, stop here — Bootstrap shows the red outlines
    if (!form.checkValidity()) return;

    const amount      = parseFloat(document.getElementById('expenseAmount').value);
    const date        = document.getElementById('expenseDate').value;
    const category    = document.getElementById('expenseCategory').value;
    const description = document.getElementById('expenseDescription').value.trim();

    // Extra guard: amount must be a positive number
    if (isNaN(amount) || amount <= 0) {
      document.getElementById('expenseAmount').setCustomValidity('Enter a valid positive number');
      form.classList.add('was-validated');
      return;
    } else {
      document.getElementById('expenseAmount').setCustomValidity('');
    }

    const now = new Date();
    const newRecord = {
      id:          nextExpenseId(),
      amount:      amount.toFixed(2),
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

    // Reset form and validation state
    form.reset();
    form.classList.remove('was-validated');

    showToast('Expense saved successfully!', 'success');
  });
}

// ─── transaction.html — render & actions ─────────────────────────────────────

function renderTransactions() {
  const logBody = document.getElementById('expenseTableBody');
  if (!logBody) return;

  const records = getRecords();

  if (records.length === 0) {
    logBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted py-4">No expenses recorded yet.</td>
      </tr>`;
    return;
  }

  logBody.innerHTML = records.map(record => {
    const updateDisplay = record.dateUpdated
      ? `${record.dateUpdated}<br><span class="text-muted small">${record.timeUpdated}</span>`
      : '<span class="text-muted small">—</span>';

    return `
      <tr id="row-${record.id}">
        <th scope="row" class="text-nowrap px-3 border-light">${record.id}</th>
        <td class="text-nowrap border-light">${record.date}</td>
        <td class="border-light">RM ${record.amount}</td>
        <td class="border-light">${record.category}</td>
        <td class="border-light">${record.description || '<span class="text-muted">—</span>'}</td>
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

function deleteRecord(idToDelete) {
  if (!confirm('Are you sure you want to delete this expense?\n\nThis action cannot be undone.')) return;

  let records = getRecords();
  records = records.filter(r => r.id !== idToDelete);
  saveRecords(records);

  writeLog('Deleted expense', idToDelete);
  renderTransactions();
  showToast('Expense deleted.', 'danger');
}

// ─── Edit modal (injected dynamically — no extra HTML needed in template) ────

function ensureEditModal() {
  if (document.getElementById('editExpenseModal')) return; // already exists

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
                <input type="number" class="form-control" id="editAmount" min="0.01" step="0.01" required>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label small text-dark mb-1">Date</label>
              <input type="date" class="form-control" id="editDate" required>
            </div>
            <div class="mb-3">
              <label class="form-label small text-dark mb-1">Category</label>
              <select class="form-select" id="editCategory" required>
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Education">Education</option>
                <option value="Shopping">Shopping</option>
                <option value="Health">Health</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label small text-dark mb-1">Description</label>
              <textarea class="form-control resize-none" id="editDescription" rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-success" onclick="saveEdit()">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  `);
}

function openEditModal(id) {
  ensureEditModal();

  const records = getRecords();
  const record = records.find(r => r.id === id);
  if (!record) return;

  document.getElementById('editId').value          = record.id;
  document.getElementById('editAmount').value       = record.amount;
  document.getElementById('editDate').value         = record.date;
  document.getElementById('editCategory').value     = record.category;
  document.getElementById('editDescription').value  = record.description;

  const modal = new bootstrap.Modal(document.getElementById('editExpenseModal'));
  modal.show();
}

function saveEdit() {
  const id          = document.getElementById('editId').value;
  const amount      = parseFloat(document.getElementById('editAmount').value);
  const date        = document.getElementById('editDate').value;
  const category    = document.getElementById('editCategory').value;
  const description = document.getElementById('editDescription').value.trim();

  if (!amount || isNaN(amount) || amount <= 0 || !date || !category) {
    showToast('Please fill in all required fields correctly.', 'warning');
    return;
  }

  const records = getRecords();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return;

  const now = new Date();
  records[idx].amount      = amount.toFixed(2);
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

// ─── log.html — render activity log ──────────────────────────────────────────

function renderActivityLog() {
  const logBody = document.getElementById('activityLogBody');
  if (!logBody) return;

  const logs = getLogs();

  if (logs.length === 0) {
    logBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted py-4">No activity recorded yet.</td>
      </tr>`;
    return;
  }

  // Show most recent first
  logBody.innerHTML = [...logs].reverse().map(log => `
    <tr>
      <th scope="row" class="text-nowrap px-3 border-light">${log.id}</th>
      <td class="text-nowrap border-light">${log.datetime}</td>
      <td class="border-light">${log.action}</td>
      <td class="border-light">${log.relatedId}</td>
    </tr>
  `).join('');
}

// ─── settings / clear all ────────────────────────────────────────────────────

function clearAllData() {
  if (!confirm('Are you sure you want to clear ALL transaction records?\n\nThis action cannot be undone.')) return;
  localStorage.removeItem('history');
  localStorage.removeItem('activityLog');
  localStorage.removeItem('expenseCounter');
  localStorage.removeItem('logCounter');
  writeLog('Cleared all data', '—');
  renderTransactions();
  showToast('All records cleared.', 'warning');
}

// ─── Toast utility (no extra HTML needed) ────────────────────────────────────

function showToast(message, type = 'success') {
  // Ensure container exists
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }

  const id = 'toast-' + Date.now();
  const colorMap = { success: 'text-bg-success', danger: 'text-bg-danger', warning: 'text-bg-warning' };
  const bgClass = colorMap[type] || 'text-bg-secondary';

  container.insertAdjacentHTML('beforeend', `
    <div id="${id}" class="toast align-items-center ${bgClass} border-0" role="alert" aria-live="assertive">
      <div class="d-flex">
        <div class="toast-body fw-semibold">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `);

  const toastEl = document.getElementById(id);
  const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
  toast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// ─── Boot ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
  initNewExpensePage();   // runs safely; checks for elements before acting
  renderTransactions();   // runs safely; checks for #expenseTableBody
  renderActivityLog();    // runs safely; checks for #activityLogBody
});