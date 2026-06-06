// Initialize array from localStorage, or empty array if none exists
let fincRec = JSON.parse(localStorage.getItem('history')) || [];

// Render immediately on page load
renderLogs();

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
    description: description, // Don't forget to save the description!
    dateCreated: new Date().toLocaleDateString(),
    timeCreated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  // Update array & local storage
  fincRec.push(newRecord);
  localStorage.setItem('history', JSON.stringify(fincRec));
  
  // Re-render the table and clear the form (optional but good practice)
  renderLogs();
}

// Render table rows
function renderLogs() {
  const logBody = document.getElementById('expenseTableBody');
  
  // Loop each row and build the string
  let rows = ""; // Create an empty bucket

  fincRec.forEach((record) => {
    // Add each row to the bucket
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
        <td class="border-light">
          <div class="d-flex align-items-center justify-content-center gap-2">
            <button class="btn btn-light border-0 p-2" title="Edit">
              <img src="components/images/pencil-square.svg" width="16" alt="Edit">
            </button>
            <button class="btn btn-danger p-2" title="Delete">
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

function clearLogs() {
  // Changed studRecord to fincRec
  fincRec = []; 
  localStorage.removeItem('history');
  renderLogs();
}