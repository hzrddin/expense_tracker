// Initialize array from localStorage, or empty array if none exists
let fincRec = JSON.parse(localStorage.getItem('history')) || [];

// Notice: Removed the raw renderLogs() call from here!

function saveRecord() {
  // Get values from the form
  let amount = document.getElementById("expenseAmount").value;
  let date = document.getElementById("expenseDate").value;
  let category = document.getElementById("expenseCategory").value;
  let description = document.getElementById("expenseDescription").value;

  // Generate ID based on array length
  const nextId = "EP-" + (fincRec.length + 1).toString().padStart(4, '0');

  // Record expense
  const newRecord = {
    id: nextId,
    amount: amount,
    date: date,
    category: category,
    description: description,
    dateCreated: new Date().toLocaleDateString(),
    timeCreated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  alert("Expense Succcessfully Saved!");

  // Update array & local storage
  fincRec.push(newRecord);
  localStorage.setItem('history', JSON.stringify(fincRec));
  renderLogs();
}

// Render table rows
function renderLogs() {
  const logBody = document.getElementById('expenseTableBody');

  // Extra safety net: If logBody doesn't exist on this page, stop running the function
  if (!logBody) return;

  // Loop each row and build the string
  let rows = "";

  fincRec.forEach((record) => {
    // Logic for the Date Updated column
    const updateDisplay = (record.dateUpdated && record.dateUpdated !== "")
      ? `${record.dateUpdated}<br><span class="text-muted small">${record.timeUpdated}</span>`
      : "N/A";

    // Build the row (Now with 8 columns!)
    rows += `
      <tr>
        <th scope="row" class="text-nowrap px-3 border-light">${record.id}</th>
        <td class="text-nowrap border-light">${record.date}</td>
        <td class="border-light">${record.amount}</td>
        <td class="border-light">${record.category}</td>
        <td class="border-light">${record.description}</td>
        <td class="text-nowrap border-light">
          ${record.dateCreated}<br><span class="text-muted small">${record.timeCreated}</span>
        </td>
        <td class="text-nowrap border-light">
          ${updateDisplay}
        </td>
        <td class="border-light">
          <div class="d-flex align-items-center justify-content-center gap-2">
            <button class="btn btn-light border-0 p-2" title="Edit">
              <img src="components/images/pencil-square.svg" width="16" alt="Edit">
            </button>
            <button class="btn btn-danger p-2" onclick="deleteRecord('${record.id}')" title="Delete">
              <img src="components/images/trash.svg" width="16" alt="Delete">
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  // Update the DOM exactly ONE time after the loop finishes
  logBody.innerHTML = rows;
}


// Clear record
function clearLogs() {

  if (confirm("Are you sure to clear all transactions record?\nThis action can not be undone")) {

    fincRec = [];
    localStorage.removeItem('history');
    renderLogs();
  }
}

function deleteRecord(idToDelete) {
  // 1. Ask the user to confirm so they don't delete by accident
  if (confirm("Are you sure you want to delete this expense?")) {

    // 2. Filter the array: Keep everything EXCEPT the one with the matching ID
    fincRec = fincRec.filter(record => record.id !== idToDelete);

    // 3. Save the new, smaller array back to localStorage
    localStorage.setItem('history', JSON.stringify(fincRec));

    // 4. Update the screen
    renderLogs();
  }
}

// Wait for the HTML structure to fully load
document.addEventListener('DOMContentLoaded', function () {
  const logBody = document.getElementById('expenseTableBody');

  // If the table body exists, we are currently on transaction.html
  if (logBody) {
    renderLogs();
  }
});