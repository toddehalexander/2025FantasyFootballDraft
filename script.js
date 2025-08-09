const draftedPlayers = new Set();

function toggleDrafted(row) {
  const playerName = row.cells[2].textContent;
  if (draftedPlayers.has(playerName)) {
    draftedPlayers.delete(playerName);
  } else {
    draftedPlayers.add(playerName);
  }
  updateRowHighlights();
}

function updateRowHighlights() {
  const table = document.getElementById("playersTable");
  const rows = table.tBodies[0].rows;

  let bestPlayerRow = null;
  let bestPlayerADP = Infinity;

  for (const row of rows) {
    if (row.style.display === "none") {
      row.classList.remove('drafted', 'best-available');
      row.style.cursor = '';
      continue;
    }

    const playerName = row.cells[2].textContent;
    const adp = parseFloat(row.cells[0].textContent);

    if (draftedPlayers.has(playerName)) {
      row.classList.add('drafted');
      row.classList.remove('best-available');
      row.style.cursor = 'default';
    } else {
      row.classList.remove('drafted');
      row.style.cursor = 'pointer';

      if (adp < bestPlayerADP) {
        bestPlayerADP = adp;
        bestPlayerRow = row;
      }
    }
  }

  // Clear all best-available highlights first
  for (const row of rows) {
    row.classList.remove('best-available');
  }
  // Highlight best available player
  if (bestPlayerRow) {
    bestPlayerRow.classList.add('best-available');
  }
}

function addRowClickListeners() {
  const table = document.getElementById("playersTable");
  const rows = table.tBodies[0].rows;

  for (const row of rows) {
    row.onclick = () => toggleDrafted(row);
  }
}

async function loadCSV() {
  try {
    const response = await fetch('data/adp.csv');
    if (!response.ok) throw new Error('Failed to load CSV');

    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    const tbody = document.querySelector('#playersTable tbody');
    tbody.innerHTML = '';

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));

      // Extract rankings to compute average ADP (columns: 4,5,6,7,8,10)
      const ranks = [4,5,6,7,8,10].map(idx => {
        const val = cols[idx];
        return val && val !== '-' ? parseFloat(val) : null;
      }).filter(v => v !== null);

      const averageADP = ranks.length > 0 
        ? (ranks.reduce((a,b) => a + b, 0) / ranks.length).toFixed(2)
        : '';

      const tr = document.createElement('tr');

      // Add average ADP first
      const tdADP = document.createElement('td');
      tdADP.textContent = averageADP;
      tr.appendChild(tdADP);

      // Add Position, Player, Team (columns 1,2,3)
      [1,2,3].forEach(idx => {
        const td = document.createElement('td');
        td.textContent = cols[idx] || '';
        tr.appendChild(td);
      });

      // Add Underdog, CBS, ESPN, FFPC, BB10s, Y! (columns 4,5,6,7,8,10)
      [4,5,6,7,8,10].forEach(idx => {
        const td = document.createElement('td');
        td.textContent = cols[idx] || '';
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    }

    filterTable();
    addRowClickListeners();
    updateRowHighlights();
  } catch (error) {
    console.error('Error loading CSV:', error);
  }
}

function filterTable() {
  const filter = document.getElementById("positionFilter").value.toUpperCase();
  const table = document.getElementById("playersTable");
  const trs = table.tBodies[0].getElementsByTagName("tr");

  for (let i = 0; i < trs.length; i++) {
    const pos = trs[i].cells[1].textContent || trs[i].cells[1].innerText;
    const posPrefix = pos.split('-')[0].toUpperCase();

    if (filter === "ALL" || posPrefix === filter) {
      trs[i].style.display = "";
    } else {
      trs[i].style.display = "none";
    }
  }
  updateRowHighlights();
}

window.onload = loadCSV;
