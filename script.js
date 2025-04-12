// global variables
const grid = [];
let rows = 15;
let cols = 15;
let startCell = null;
let endCell = null;
let currentTool = "start";
let showEmpathyMap = false;
let algorithmResults = {
  "depth-first": { normal: null, empathy: null },
  "best-first": { normal: null, empathy: null },
  "a-star": { normal: null, empathy: null },
};

// constants
const terrainCosts = {
  road: 11,
  grass: 12,
  forest: 13,
  lake: 15,
  mountain: 17,
  obstacle: Infinity,
  start: 0,
  end: 0,
  wolf: 0,
  fear: 0,
  monument: 0,
  temple: 0,
};

const empathyValues = {
  wolf: { type: "repulsion", value: 10, radius: 3 },
  fear: { type: "repulsion", value: 8, radius: 3 },
  monument: { type: "attraction", value: -8, radius: 3 },
  temple: { type: "attraction", value: -10, radius: 3 },
};

// initializing the application
document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  setupEventListeners();
  generateMap();
}

function setupEventListeners() {
  document
    .getElementById("generate-map")
    .addEventListener("click", generateMap);
  document.getElementById("clear-map").addEventListener("click", clearMap);
  document
    .getElementById("run-algorithms")
    .addEventListener("click", runAlgorithms);
  document
    .getElementById("toggle-empathy")
    .addEventListener("click", toggleEmpathyMap);
  document.getElementById("tool-selector").addEventListener("change", (e) => {
    currentTool = e.target.value;
  });

  document
    .getElementById("run-depth-first")
    .addEventListener("click", () => runSingleAlgorithm("depth-first"));
  document
    .getElementById("run-best-first")
    .addEventListener("click", () => runSingleAlgorithm("best-first"));
  document
    .getElementById("run-a-star")
    .addEventListener("click", () => runSingleAlgorithm("a-star"));
  document.getElementById("clear-paths").addEventListener("click", clearPaths);
  document
    .getElementById("animate-paths")
    .addEventListener("click", animateAllPaths);
}

// grid and map functions
function generateMap() {
  rows = parseInt(document.getElementById("rows").value);
  cols = parseInt(document.getElementById("cols").value);

  if (rows < 5 || rows > 30 || cols < 5 || cols > 30) {
    alert("Rows and columns must be between 5 and 30");
    return;
  }

  grid.length = 0;
  startCell = null;
  endCell = null;

  const gridElement = document.getElementById("grid");
  gridElement.innerHTML = "";
  gridElement.style.gridTemplateColumns = `repeat(${cols}, 40px)`;
  gridElement.style.gridTemplateRows = `repeat(${rows}, 40px)`;

  for (let i = 0; i < rows; i++) {
    grid[i] = [];
    for (let j = 0; j < cols; j++) {
      const cell = createCell(i, j);
      grid[i][j] = cell;
      gridElement.appendChild(cell.element);
    }
  }

  clearResults();
}

/**
 * Creates a new cell element with the specified row and column.
 *
 * @param {number} row - The row index of the cell.
 * @param {number} col - The column index of the cell.
 * @return {object} An object representing the cell, containing its element, row, column, terrain, cost, empathy cost, total cost, and start/end/obstacle status.
 */
function createCell(row, col) {
  const cellElement = document.createElement("div");
  cellElement.className = "cell grass";
  cellElement.dataset.row = row;
  cellElement.dataset.col = col;

  const costElement = document.createElement("div");
  costElement.className = "cell-cost";
  costElement.textContent = terrainCosts.grass;
  cellElement.appendChild(costElement);

  cellElement.addEventListener("click", () => handleCellClick(row, col));

  return {
    element: cellElement,
    row,
    col,
    terrain: "grass",
    cost: terrainCosts.grass,
    empathyCost: 0,
    totalCost: terrainCosts.grass,
    isStart: false,
    isEnd: false,
    isObstacle: false,
  };
}

// cell and path functions
function handleCellClick(row, col) {
  const cell = grid[row][col];

  if (currentTool === "start") return setStartCell(cell);
  if (currentTool === "end") return setEndCell(cell);
  if (cell.isStart || cell.isEnd) return;

  updateCellTerrain(cell);
  clearResults();
}

function setStartCell(cell) {
  if (startCell) resetCellToGrass(startCell);

  cell.element.className = "cell start";
  cell.isStart = true;
  cell.terrain = "start";
  cell.cost = 0;
  cell.totalCost = 0;
  startCell = cell;
  updateCellDisplay(cell);
}

function setEndCell(cell) {
  if (endCell) resetCellToGrass(endCell);

  cell.element.className = "cell end";
  cell.isEnd = true;
  cell.terrain = "end";
  cell.cost = 0;
  cell.totalCost = 0;
  endCell = cell;
  updateCellDisplay(cell);
}

function updateCellTerrain(cell) {
  cell.element.classList.remove(cell.terrain);
  cell.terrain = currentTool;
  cell.element.classList.add(currentTool);
  cell.cost = terrainCosts[currentTool];
  cell.isObstacle = currentTool === "obstacle";

  if (["wolf", "fear", "monument", "temple"].includes(currentTool)) {
    calculateEmpathyAuras();
  }

  updateCellDisplay(cell);
}

function resetCellToGrass(cell) {
  cell.element.classList.remove(cell.terrain, "start", "end");
  cell.terrain = "grass";
  cell.cost = terrainCosts.grass;
  cell.totalCost = cell.cost + cell.empathyCost;
  cell.isStart = false;
  cell.isEnd = false;
  updateCellDisplay(cell);
}

// empathy functions
function calculateEmpathyAuras() {
  // Reset all empathy costs
  grid.forEach((row) =>
    row.forEach((cell) => {
      cell.empathyCost = 0;
    })
  );

  // calculate new empathy effects
  grid.forEach((row, i) =>
    row.forEach((cell, j) => {
      if (["wolf", "fear", "monument", "temple"].includes(cell.terrain)) {
        applyEmpathyEffect(i, j, cell.terrain);
      }
    })
  );

  // updating total costs
  grid.forEach((row) =>
    row.forEach((cell) => {
      cell.totalCost = Math.max(1, cell.cost + cell.empathyCost);
      updateCellDisplay(cell);
    })
  );
}

function applyEmpathyEffect(row, col, terrain) {
  const empathyInfo = empathyValues[terrain];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const distance = Math.sqrt(Math.pow(r - row, 2) + Math.pow(c - col, 2));
      if (distance <= empathyInfo.radius) {
        const effect = Math.round(
          empathyInfo.value * (1 - distance / (empathyInfo.radius + 1))
        );
        grid[r][c].empathyCost += effect;
      }
    }
  }
}

function toggleEmpathyMap() {
  showEmpathyMap = !showEmpathyMap;
  grid.forEach((row) => row.forEach(updateCellDisplay));

  const button = document.getElementById("toggle-empathy");
  button.textContent = showEmpathyMap ? "Hide Empathy Map" : "Show Empathy Map";
}

// Display Functions
function updateCellDisplay(cell) {
  const costElement = cell.element.querySelector(".cell-cost");

  if (cell.isObstacle) costElement.textContent = "∞";
  else if (cell.isStart || cell.isEnd) costElement.textContent = "0";
  else costElement.textContent = showEmpathyMap ? cell.totalCost : cell.cost;

  updateAuraClasses(cell);
}

function updateAuraClasses(cell) {
  const auraClasses = [
    "repulsion-aura-1",
    "repulsion-aura-2",
    "repulsion-aura-3",
    "attraction-aura-1",
    "attraction-aura-2",
    "attraction-aura-3",
  ];

  cell.element.classList.remove(...auraClasses);

  if (showEmpathyMap) {
    if (cell.empathyCost > 0) {
      if (cell.empathyCost >= 7) cell.element.classList.add("repulsion-aura-3");
      else if (cell.empathyCost >= 4)
        cell.element.classList.add("repulsion-aura-2");
      else if (cell.empathyCost >= 1)
        cell.element.classList.add("repulsion-aura-1");
    } else if (cell.empathyCost < 0) {
      if (cell.empathyCost <= -7)
        cell.element.classList.add("attraction-aura-3");
      else if (cell.empathyCost <= -4)
        cell.element.classList.add("attraction-aura-2");
      else if (cell.empathyCost <= -1)
        cell.element.classList.add("attraction-aura-1");
    }
  }
}

// pathfinding algorithms
function depthFirstSearch(useEmpathy) {
  const visited = Array(rows)
    .fill()
    .map(() => Array(cols).fill(false));
  const path = [];
  let pathFound = false;
  let nodesExplored = 0;
  let totalCost = 0;

  /**
   * Performs a depth-first search on the grid, exploring neighboring cells in all four directions.
   *
   * @param {number} row - The current row index.
   * @param {number} col - The current column index.
   * @param {array} currentPath - The current path being explored.
   * @param {number} currentCost - The current total cost of the path.
   * @return {boolean} True if the end cell is found, false otherwise.
   */
  function dfs(row, col, currentPath, currentCost) {
    if (
      row < 0 ||
      row >= rows ||
      col < 0 ||
      col >= cols ||
      visited[row][col] ||
      grid[row][col].isObstacle
    )
      return false;

    visited[row][col] = true;
    nodesExplored++;
    currentPath.push({ row, col });

    const cell = grid[row][col];
    const cellCost = useEmpathy ? cell.totalCost : cell.cost;
    currentCost += cellCost;

    if (cell.isEnd) {
      pathFound = true;
      path.push(...currentPath);
      totalCost = currentCost;
      return true;
    }

    const directions = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ];
    for (const [dr, dc] of directions) {
      if (dfs(row + dr, col + dc, [...currentPath], currentCost)) return true;
    }

    return false;
  }

  dfs(startCell.row, startCell.col, [], 0);
  return { pathFound, path, cost: totalCost, nodesExplored };
}

/**
 * Performs a best-first search on the grid to find the shortest path from the start cell to the end cell.
 *
 * @param {boolean} useEmpathy - Whether to use empathy costs or regular costs for the search.
 * @return {object} An object containing the result of the search, including whether a path was found, the path itself, the total cost of the path, and the number of nodes explored.
 */
function bestFirstSearch(useEmpathy) {
  const visited = Array(rows)
    .fill()
    .map(() => Array(cols).fill(false));
  const path = [];
  let pathFound = false;
  let nodesExplored = 0;
  let totalCost = 0;
  const queue = [];

  /**
   * Calculates the Manhattan distance heuristic for a given cell.
   *
   * @param {number} row - The row index of the cell.
   * @param {number} col - The column index of the cell.
   * @return {number} The Manhattan distance from the cell to the end cell.
   */
  function heuristic(row, col) {
    return Math.abs(row - endCell.row) + Math.abs(col - endCell.col);
  }

  queue.push({
    row: startCell.row,
    col: startCell.col,
    priority: heuristic(startCell.row, startCell.col),
    path: [],
    cost: 0,
  });

  while (queue.length > 0) {
    queue.sort((a, b) => a.priority - b.priority);
    const current = queue.shift();

    if (
      visited[current.row][current.col] ||
      grid[current.row][current.col].isObstacle
    )
      continue;

    visited[current.row][current.col] = true;
    nodesExplored++;
    const newPath = [...current.path, { row: current.row, col: current.col }];

    const cell = grid[current.row][current.col];
    const cellCost = useEmpathy ? cell.totalCost : cell.cost;
    const newCost = current.cost + cellCost;

    if (cell.isEnd) {
      pathFound = true;
      path.push(...newPath);
      totalCost = newCost;
      break;
    }

    const directions = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ];
    for (const [dr, dc] of directions) {
      const newRow = current.row + dr;
      const newCol = current.col + dc;

      if (
        newRow >= 0 &&
        newRow < rows &&
        newCol >= 0 &&
        newCol < cols &&
        !visited[newRow][newCol] &&
        !grid[newRow][newCol].isObstacle
      ) {
        queue.push({
          row: newRow,
          col: newCol,
          priority: heuristic(newRow, newCol),
          path: newPath,
          cost: newCost,
        });
      }
    }
  }

  return { pathFound, path, cost: totalCost, nodesExplored };
}

/**
 * Performs an A* search on the grid to find the shortest path from the start cell to the end cell.
 *
 * @param {boolean} useEmpathy - Whether to use empathy costs or regular costs for the search.
 * @return {object} An object containing the result of the search, including whether a path was found, the path itself, the total cost of the path, and the number of nodes explored.
 */
function aStarSearch(useEmpathy) {
  const visited = Array(rows)
    .fill()
    .map(() => Array(cols).fill(false));
  const path = [];
  let pathFound = false;
  let nodesExplored = 0;
  let totalCost = 0;
  const queue = [];

  /**
   * Calculates the Manhattan distance heuristic for a given cell.
   *
   * @param {number} row - The row index of the cell.
   * @param {number} col - The column index of the cell.
   * @return {number} The Manhattan distance from the cell to the end cell.
   */
  function heuristic(row, col) {
    return Math.abs(row - endCell.row) + Math.abs(col - endCell.col);
  }

  queue.push({
    row: startCell.row,
    col: startCell.col,
    f: heuristic(startCell.row, startCell.col),
    g: 0,
    path: [],
  });

  while (queue.length > 0) {
    queue.sort((a, b) => a.f - b.f);
    const current = queue.shift();

    if (
      visited[current.row][current.col] ||
      grid[current.row][current.col].isObstacle
    )
      continue;

    visited[current.row][current.col] = true;
    nodesExplored++;
    const newPath = [...current.path, { row: current.row, col: current.col }];

    if (grid[current.row][current.col].isEnd) {
      pathFound = true;
      path.push(...newPath);
      totalCost = current.g;
      break;
    }

    const directions = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ];
    for (const [dr, dc] of directions) {
      const newRow = current.row + dr;
      const newCol = current.col + dc;

      if (
        newRow >= 0 &&
        newRow < rows &&
        newCol >= 0 &&
        newCol < cols &&
        !visited[newRow][newCol] &&
        !grid[newRow][newCol].isObstacle
      ) {
        const cell = grid[newRow][newCol];
        const cellCost = useEmpathy ? cell.totalCost : cell.cost;
        const g = current.g + cellCost;
        const h = heuristic(newRow, newCol);

        queue.push({
          row: newRow,
          col: newCol,
          f: g + h,
          g: g,
          path: newPath,
        });
      }
    }
  }

  return { pathFound, path, cost: totalCost, nodesExplored };
}

// Results and Visualization
function runAlgorithms() {
  if (!startCell || !endCell) {
    alert("Please set start and end points first");
    return;
  }

  clearResults();

  algorithmResults["depth-first"].normal = depthFirstSearch(false);
  algorithmResults["best-first"].normal = bestFirstSearch(false);
  algorithmResults["a-star"].normal = aStarSearch(false);

  algorithmResults["depth-first"].empathy = depthFirstSearch(true);
  algorithmResults["best-first"].empathy = bestFirstSearch(true);
  algorithmResults["a-star"].empathy = aStarSearch(true);

  displayResults();
  visualizePaths();
}

/**
 * Runs a single pathfinding algorithm on the grid, clearing previous paths and displaying the results.
 *
 * @param {string} algorithm - The name of the algorithm to run (depth-first, best-first, or a-star)
 * @return {void}
 */
function runSingleAlgorithm(algorithm) {
  if (!startCell || !endCell) {
    alert("Please set start and end points first");
    return;
  }

  clearPaths();

  if (algorithm === "depth-first") {
    algorithmResults["depth-first"].normal = depthFirstSearch(false);
    algorithmResults["depth-first"].empathy = depthFirstSearch(true);
  } else if (algorithm === "best-first") {
    algorithmResults["best-first"].normal = bestFirstSearch(false);
    algorithmResults["best-first"].empathy = bestFirstSearch(true);
  } else if (algorithm === "a-star") {
    algorithmResults["a-star"].normal = aStarSearch(false);
    algorithmResults["a-star"].empathy = aStarSearch(true);
  }

  displayResults();
  animateAlgorithmPaths(algorithm);
}

/**
 * Displays the results of the pathfinding algorithms, including path found, path length, path cost, and nodes explored, for both normal and empathy modes.
 *
 * @return {void}
 */
function displayResults() {
  for (const algorithm in algorithmResults) {
    const statsElement = document.getElementById(`${algorithm}-stats`);
    const { normal, empathy } = algorithmResults[algorithm];

    statsElement.innerHTML = `
      <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
        <tr>
          <th style="text-align:left; padding: 5px; border-bottom: 1px solid #ddd;"></th>
          <th style="text-align:right; padding: 5px; border-bottom: 1px solid #ddd;">Without Empathy</th>
          <th style="text-align:right; padding: 5px; border-bottom: 1px solid #ddd;">With Empathy</th>
        </tr>
        <tr>
          <td style="padding: 5px;">Path Found</td>
          <td style="text-align:right; padding: 5px;">${
            normal.pathFound ? "Yes" : "No"
          }</td>
          <td style="text-align:right; padding: 5px;">${
            empathy.pathFound ? "Yes" : "No"
          }</td>
        </tr>
        <tr>
          <td style="padding: 5px;">Path Length</td>
          <td style="text-align:right; padding: 5px;">${
            normal.pathFound ? normal.path.length : "N/A"
          }</td>
          <td style="text-align:right; padding: 5px;">${
            empathy.pathFound ? empathy.path.length : "N/A"
          }</td>
        </tr>
        <tr>
          <td style="padding: 5px;">Path Cost</td>
          <td style="text-align:right; padding: 5px;">${
            normal.pathFound ? normal.cost : "N/A"
          }</td>
          <td style="text-align:right; padding: 5px;">${
            empathy.pathFound ? empathy.cost : "N/A"
          }</td>
        </tr>
        <tr>
          <td style="padding: 5px;">Nodes Explored</td>
          <td style="text-align:right; padding: 5px;">${
            normal.nodesExplored
          }</td>
          <td style="text-align:right; padding: 5px;">${
            empathy.nodesExplored
          }</td>
        </tr>
      </table>
    `;
  }
}

function visualizePaths() {
  for (const algorithm in algorithmResults) {
    const { normal, empathy } = algorithmResults[algorithm];

    if (normal.pathFound) addPathClasses(normal.path, algorithm, false);
    if (empathy.pathFound) addPathClasses(empathy.path, algorithm, true);
  }
}

/**
 * Adds CSS classes to the elements in the grid that represent the path found by a pathfinding algorithm.
 *
 * @param {array} path - The path found by the algorithm, represented as an array of objects with row and col properties.
 * @param {string} algorithm - The name of the algorithm that found the path.
 * @param {boolean} useEmpathy - Whether to use empathy costs or regular costs for the algorithm.
 * @return {void}
 */
function addPathClasses(path, algorithm, useEmpathy) {
  path.forEach(({ row, col }) => {
    if (!grid[row][col].isStart && !grid[row][col].isEnd) {
      grid[row][col].element.classList.add(
        useEmpathy ? `${algorithm}-empathy` : algorithm
      );
    }
  });
}

function animateAllPaths() {
  if (
    !algorithmResults["depth-first"].normal ||
    !algorithmResults["best-first"].normal ||
    !algorithmResults["a-star"].normal
  ) {
    if (!startCell || !endCell) {
      alert("Please set start and end points first");
      return;
    }
    runAlgorithms();
  }

  clearPaths();

  const algorithms = ["depth-first", "best-first", "a-star"];
  algorithms.forEach((algorithm, index) => {
    const { normal, empathy } = algorithmResults[algorithm];

    setTimeout(() => {
      if (normal.pathFound) animatePath(normal.path, algorithm, false);
    }, index * 500);

    setTimeout(() => {
      if (empathy.pathFound) animatePath(empathy.path, algorithm, true);
    }, index * 500 + 250);
  });
}

function animateAlgorithmPaths(algorithm) {
  const { normal, empathy } = algorithmResults[algorithm];

  if (normal.pathFound) animatePath(normal.path, algorithm, false);
  setTimeout(() => {
    if (empathy.pathFound) animatePath(empathy.path, algorithm, true);
  }, 500);
}

function animatePath(path, algorithm, useEmpathy) {
  if (!path || path.length === 0) return;

  const className = useEmpathy ? `${algorithm}-empathy` : algorithm;
  let index = 0;

  function animateStep() {
    if (index < path.length) {
      const { row, col } = path[index];
      if (!grid[row][col].isStart && !grid[row][col].isEnd) {
        grid[row][col].element.classList.add(className, "path");
      }
      index++;
      setTimeout(animateStep, 50);
    }
  }

  animateStep();
}

// Utility Functions
function clearMap() {
  grid.forEach((row) =>
    row.forEach((cell) => {
      cell.element.className = "cell grass";
      cell.terrain = "grass";
      cell.cost = terrainCosts.grass;
      cell.empathyCost = 0;
      cell.totalCost = cell.cost;
      cell.isStart = false;
      cell.isEnd = false;
      cell.isObstacle = false;
      updateCellDisplay(cell);
    })
  );

  startCell = null;
  endCell = null;
  clearResults();
}

function clearResults() {
  algorithmResults = {
    "depth-first": { normal: null, empathy: null },
    "best-first": { normal: null, empathy: null },
    "a-star": { normal: null, empathy: null },
  };

  clearPaths();

  document.getElementById("depth-first-stats").innerHTML = "";
  document.getElementById("best-first-stats").innerHTML = "";
  document.getElementById("a-star-stats").innerHTML = "";
}

function clearPaths() {
  grid.forEach((row) =>
    row.forEach((cell) => {
      if (cell.element) {
        cell.element.classList.remove(
          "depth-first",
          "depth-first-empathy",
          "best-first",
          "best-first-empathy",
          "a-star",
          "a-star-empathy",
          "path"
        );
      }
    })
  );
}
