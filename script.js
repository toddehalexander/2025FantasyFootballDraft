const draftedPlayers = new Set();
let playersData = [];
let currentSort = { column: 'adp', direction: 'asc' };

function toggleDrafted(playerName) {
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
    if (row.style.display === "none" || row.querySelector('.loading')) {
      continue;
    }

    const playerName = row.cells[2].textContent;
    const adpText = row.cells[0].textContent;
    const adp = parseFloat(adpText);

    if (draftedPlayers.has(playerName)) {
      row.classList.add('drafted');
      row.classList.remove('best-available');
      row.style.cursor = 'default';
    } else {
      row.classList.remove('drafted');
      row.style.cursor = 'pointer';

      if (!isNaN(adp) && adp < bestPlayerADP) {
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
    if (row.querySelector('.loading')) continue;
    
    row.onclick = () => {
      const playerName = row.cells[2].textContent;
      toggleDrafted(playerName);
    };
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] === ',')) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function sortTable(column) {
  // Update sort direction
  if (currentSort.column === column) {
    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort.column = column;
    currentSort.direction = 'asc';
  }

  // Update header indicators
  const headers = document.querySelectorAll('th.sortable');
  headers.forEach(header => {
    header.classList.remove('sort-asc', 'sort-desc');
    if (header.dataset.sort === column) {
      header.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });

  // Sort data
  playersData.sort((a, b) => {
    let aVal = a[column];
    let bVal = b[column];

    // Handle numeric columns
    if (column === 'adp' || column === 'underdog' || column === 'cbs' || column === 'espn' || column === 'ffpc' || column === 'bb10s' || column === 'yahoo') {
      aVal = parseFloat(aVal) || 999;
      bVal = parseFloat(bVal) || 999;
    } else {
      // String comparison
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    }

    if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  renderTable();
}

function renderTable() {
  const tbody = document.querySelector('#playersTable tbody');
  tbody.innerHTML = '';

  playersData.forEach(player => {
    const tr = document.createElement('tr');

    // Add average ADP
    const tdADP = document.createElement('td');
    tdADP.className = 'adp-col';
    tdADP.textContent = player.adp === 999 ? '' : player.adp.toFixed(2);
    tr.appendChild(tdADP);

    // Add position
    const tdPos = document.createElement('td');
    tdPos.className = 'position-col';
    tdPos.textContent = player.position;
    tr.appendChild(tdPos);

    // Add player name
    const tdPlayer = document.createElement('td');
    tdPlayer.className = 'player-col';
    tdPlayer.textContent = player.player;
    tr.appendChild(tdPlayer);

    // Add team
    const tdTeam = document.createElement('td');
    tdTeam.className = 'team-col';
    tdTeam.textContent = player.team;
    tr.appendChild(tdTeam);

    // Add ranking columns
    ['underdog', 'cbs', 'espn', 'ffpc', 'bb10s', 'yahoo'].forEach(key => {
      const td = document.createElement('td');
      td.className = 'ranking-col';
      td.textContent = player[key] || '-';
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  addRowClickListeners();
  filterTable();
}

async function loadCSV() {
  try {
    // Load CSV from file
    const response = await fetch('data/adp.csv');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    playersData = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);

      // Extract rankings to compute average ADP
      const rankingColumns = [14, 4, 5, 7, 12, 11]; // Underdog, CBS, ESPN, FFPC, BB10s, Y!
      const ranks = rankingColumns.map(idx => {
        const val = cols[idx];
        return val && val !== '-' && val !== '' ? parseFloat(val) : null;
      }).filter(v => v !== null && !isNaN(v));

      const averageADP = ranks.length > 0 
        ? (ranks.reduce((a,b) => a + b, 0) / ranks.length)
        : 999;

      const playerData = {
        adp: averageADP,
        position: cols[1] || '',
        player: cols[2] || '',
        team: cols[3] || '',
        underdog: cols[14] || '',
        cbs: cols[4] || '',
        espn: cols[5] || '',
        ffpc: cols[7] || '',
        bb10s: cols[12] || '',
        yahoo: cols[11] || ''
      };

      playersData.push(playerData);
    }

    // Set initial sort state and sort by ADP (ascending - lowest first)
    currentSort = { column: 'adp', direction: 'descending' };

    // Update header to show initial sort
    const adpHeader = document.querySelector('th[data-sort="adp"]');
    adpHeader.classList.add('sort-asc');
    
    // Sort by ADP initially
    sortTable('adp');
    
  } catch (error) {
    console.error('Error loading CSV:', error);
    const tbody = document.querySelector('#playersTable tbody');
    tbody.innerHTML = '<tr><td colspan="10" class="loading">Error loading data. Please check that data/adp.csv exists.</td></tr>';
  }
}

function filterTable() {
  const filter = document.getElementById("positionFilter").value.toUpperCase();
  const table = document.getElementById("playersTable");
  const trs = table.tBodies[0].getElementsByTagName("tr");

  for (let i = 0; i < trs.length; i++) {
    if (trs[i].querySelector('.loading')) continue;
    
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

// Add click listeners to table headers
document.addEventListener('DOMContentLoaded', function() {
  const headers = document.querySelectorAll('th.sortable');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset.sort;
      sortTable(column);
    });
  });
});

window.onload = loadCSV;