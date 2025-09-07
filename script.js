const ROWS = 3;
const COLS = 9;
const NUMBERS_PER_TICKET = 15;
const NUMBERS_PER_ROW = 5;
const COLUMN_RANGES = [
  [1, 9],
  [10, 19],
  [20, 29],
  [30, 39],
  [40, 49],
  [50, 59],
  [60, 69],
  [70, 79],
  [80, 90]
];

const WINNING_PATTERNS = [
  { name: "Early Five", description: "First 5 numbers marked anywhere on the ticket" },
  { name: "Top Line", description: "All 5 numbers in the top row marked" },
  { name: "Middle Line", description: "All 5 numbers in the middle row marked" },
  { name: "Bottom Line", description: "All 5 numbers in the bottom row marked" },
  { name: "Four Corners", description: "First and last numbers of top and bottom rows marked" },
  { name: "Full House", description: "All 15 numbers on the ticket marked" },
  { name: "First Half", description: "All numbers from 1 to 45 marked" },
  { name: "Second Half", description: "All numbers from 46 to 90 marked" },
  { name: "Couples", description: "Any two horizontally adjacent pairs marked" }
];

let tickets = [];

function generateTicket() {
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const columns = [];
    for (let i = 0; i < COLS; i++) {
      const [start, end] = COLUMN_RANGES[i];
      const nums = [];
      for (let n = start; n <= end; n++) nums.push(n);
      columns.push(nums);
    }

    const counts = new Array(COLS).fill(1);
    let total = COLS;
    while (total < NUMBERS_PER_TICKET) {
      const idx = Math.floor(Math.random() * COLS);
      if (counts[idx] < 3) {
        counts[idx]++;
        total++;
      }
    }

    const ticket = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

    for (let col = 0; col < COLS; col++) {
      const shuffled = columns[col].sort(() => 0.5 - Math.random());
      const chosen = shuffled.slice(0, counts[col]).sort((a,b) => a-b);

      for (const num of chosen) {
        let placed = false;
        const rowOrder = [0, 1, 2].sort(() => 0.5 - Math.random());
        for (const r of rowOrder) {
          if (ticket[r].filter(x => x !== null).length < 5) {
            ticket[r][col] = num;
            placed = true;
            break;
          }
        }
        if (!placed) ticket[0][col] = num;
      }
    }

    let valid = true;
    for (let r = 0; r < ROWS; r++) {
      if (ticket[r].filter(x => x !== null).length !== 5) {
        valid = false;
        break;
      }
    }
    if (valid) return ticket;
  }
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function renderTickets() {
  const container = document.getElementById("ticketsContainer");
  container.innerHTML = "";
  tickets.forEach((ticket, idx) => {
    const ticketDiv = document.createElement("div");
    ticketDiv.className = "ticket";
    ticketDiv.dataset.ticketIndex = idx;

    const header = document.createElement("div");
    header.className = "ticket-header";
    header.textContent = `Ticket #${idx + 1}`;

    const table = document.createElement("table");

    ticket.forEach(row => {
      const tr = document.createElement("tr");
      row.forEach(num => {
        const td = document.createElement("td");
        if (num === null) {
          td.classList.add("empty");
          td.textContent = "";
        } else {
          td.textContent = num;
          td.dataset.number = num;
        }
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });

    ticketDiv.appendChild(header);
    ticketDiv.appendChild(table);
    container.appendChild(ticketDiv);

    ticketDiv.querySelectorAll("td:not(.empty)").forEach(td => {
      td.addEventListener("click", () => {
        td.classList.toggle("marked");
        checkPatterns(idx);
      });
    });
  });
  updatePatternsStatus();
}

function findAdjacentNumber(ticket, row, startCol, direction) {
  let col = startCol;
  while (col >= 0 && col < COLS) {
    if (ticket[row][col] !== null) return ticket[row][col];
    col += direction;
  }
  return null;
}

function checkPatterns(ticketIndex) {
  const ticket = tickets[ticketIndex];
  const ticketDiv = document.querySelector(`.ticket[data-ticket-index='${ticketIndex}']`);
  const tdCells = Array.from(ticketDiv.querySelectorAll("td"));

  function cellIndex(row, col) {
    return row * COLS + col;
  }

  const patternResults = {};

  patternResults["Early Five"] = tdCells.filter(td => td.classList.contains("marked")).length >= 5;

  let topLineMarked = true;
  let topLineCount = 0;
  for (let c = 0; c < COLS; c++) {
    if (ticket[0][c] !== null) {
      const td = tdCells[cellIndex(0, c)];
      if (!td.classList.contains("marked")) topLineMarked = false;
      else topLineCount++;
    }
  }
  patternResults["Top Line"] = topLineMarked && topLineCount === NUMBERS_PER_ROW;

  let middleLineMarked = true;
  let middleLineCount = 0;
  for (let c = 0; c < COLS; c++) {
    if (ticket[1][c] !== null) {
      const td = tdCells[cellIndex(1, c)];
      if (!td.classList.contains("marked")) middleLineMarked = false;
      else middleLineCount++;
    }
  }
  patternResults["Middle Line"] = middleLineMarked && middleLineCount === NUMBERS_PER_ROW;

  let bottomLineMarked = true;
  let bottomLineCount = 0;
  for (let c = 0; c < COLS; c++) {
    if (ticket[2][c] !== null) {
      const td = tdCells[cellIndex(2, c)];
      if (!td.classList.contains("marked")) bottomLineMarked = false;
      else bottomLineCount++;
    }
  }
  patternResults["Bottom Line"] = bottomLineMarked && bottomLineCount === NUMBERS_PER_ROW;

  // Four Corners with adjacent check
  const corners = [
    { row: 0, col: 0, dir: 1 },
    { row: 0, col: COLS - 1, dir: -1 },
    { row: ROWS - 1, col: 0, dir: 1 },
    { row: ROWS - 1, col: COLS - 1, dir: -1 }
  ];

  patternResults["Four Corners"] = corners.every(({row, col, dir}) => {
    let num = ticket[row][col];
    if (num === null) num = findAdjacentNumber(ticket, row, col, dir);
    if (num === null) return true;
    const td = tdCells.find(tdEl => tdEl.innerText == num.toString());
    return td && td.classList.contains("marked");
  });

  patternResults["Full House"] = tdCells.filter(td => !td.classList.contains("empty")).length === tdCells.filter(td => td.classList.contains("marked")).length;

  // First Half: numbers 1-45 all marked
  const firstHalfNumbers = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let num = ticket[r][c];
      if (num !== null && num <= 45) firstHalfNumbers.push(num);
    }
  }
  patternResults["First Half"] = firstHalfNumbers.length > 0 && firstHalfNumbers.every(num => {
    const td = tdCells.find(tdEl => tdEl.innerText == num.toString());
    return td && td.classList.contains("marked");
  });

  // Second Half: numbers 46-90 all marked
  const secondHalfNumbers = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let num = ticket[r][c];
      if (num !== null && num >= 46) secondHalfNumbers.push(num);
    }
  }
  patternResults["Second Half"] = secondHalfNumbers.length > 0 && secondHalfNumbers.every(num => {
    const td = tdCells.find(tdEl => tdEl.innerText == num.toString());
    return td && td.classList.contains("marked");
  });

  // Couples: at least two horizontally adjacent pairs marked
  let couplesCount = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 1; c++) {
      const num1 = ticket[r][c];
      const num2 = ticket[r][c + 1];
      if (num1 !== null && num2 !== null) {
        const td1 = tdCells.find(tdEl => tdEl.innerText == num1.toString());
        const td2 = tdCells.find(tdEl => tdEl.innerText == num2.toString());
        if (td1 && td2 && td1.classList.contains("marked") && td2.classList.contains("marked")) {
          couplesCount++;
        }
      }
      if (couplesCount >= 2) break;
    }
    if (couplesCount >= 2) break;
  }
  patternResults["Couples"] = couplesCount >= 2;

  updatePatternsStatus(patternResults, ticketIndex);
}

function updatePatternsStatus(patternResults = null, ticketIndex = null) {
  const statusDiv = document.getElementById("patternsStatus");
  statusDiv.innerHTML = "";

  function formatStatus(name, result) {
    return `<b>${name}:</b> ${result ? '<span style="color:green">Achieved</span>' : '<span style="color:red">Pending</span>'}`;
  }

  if (patternResults && ticketIndex !== null) {
    let html = `<h2>Ticket #${ticketIndex + 1} Patterns Status</h2>`;
    WINNING_PATTERNS.forEach(p => {
      html += `<div>${formatStatus(p.name, patternResults[p.name])}</div>`;
    });
    statusDiv.innerHTML = html;
  } else {
    tickets.forEach((_, idx) => {
      const ticketDiv = document.querySelector(`.ticket[data-ticket-index='${idx}']`);
      if (!ticketDiv) return;
      const tdCells = Array.from(ticketDiv.querySelectorAll("td"));
      const countMarked = tdCells.filter(td => td.classList.contains("marked")).length;
      statusDiv.innerHTML += `<div>Ticket #${idx + 1}: <b>${countMarked}</b> numbers marked</div>`;
    });
  }
}

function generateTickets(count) {
  tickets = [];
  for(let i = 0; i < count; i++) {
    tickets.push(generateTicket());
  }
  renderTickets();
  updatePatternsStatus();
}

function resetTickets() {
  tickets = [];
  document.getElementById("ticketsContainer").innerHTML = "";
  document.getElementById("patternsStatus").innerHTML = "";
}

document.getElementById("generateTicketsBtn").addEventListener("click", () => {
  const count = parseInt(document.getElementById("ticketCount").value);
  generateTickets(count);
});

document.getElementById("resetTicketsBtn").addEventListener("click", () => {
  resetTickets();
});

generateTickets(1);
