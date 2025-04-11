
let grid = []
let rows = 15
let cols = 15
let startCell = null
let endCell = null
let currentTool = "start"
let showEmpathyMap = false
let algorithmResults = {
  "depth-first": { normal: null, empathy: null },
  "best-first": { normal: null, empathy: null },
  "a-star": { normal: null, empathy: null },
}

// all terrain costs
const terrainCosts = {
  road: 11,
  grass: 12,
  forest: 13,
  lake: 15,
  mountain: 17,
  obstacle: Number.POSITIVE_INFINITY,
  start: 0,
  end: 0,
  wolf: 0,
  fear: 0,
  monument: 0,
  temple: 0,
}

// empathy values for repulsion & attraction
const empathyValues = {
  wolf: { type: "repulsion", value: 10, radius: 3 },
  fear: { type: "repulsion", value: 8, radius: 3 },
  monument: { type: "attraction", value: -8, radius: 3 },
  temple: { type: "attraction", value: -10, radius: 3 },
}

// initilizing the application
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded")

  document.getElementById("generate-map").addEventListener("click", generateMap)
  document.getElementById("clear-map").addEventListener("click", clearMap)
  document.getElementById("run-algorithms").addEventListener("click", runAlgorithms)
  document.getElementById("toggle-empathy").addEventListener("click", toggleEmpathyMap)
  document.getElementById("tool-selector").addEventListener("change", (e) => {
    currentTool = e.target.value
    console.log("Tool changed to:", currentTool)
  })

  
  document.getElementById("run-depth-first").addEventListener("click", () => runSingleAlgorithm("depth-first"))
  document.getElementById("run-best-first").addEventListener("click", () => runSingleAlgorithm("best-first"))
  document.getElementById("run-a-star").addEventListener("click", () => runSingleAlgorithm("a-star"))

 
  document.getElementById("clear-paths").addEventListener("click", clearPaths)
  document.getElementById("animate-paths").addEventListener("click", animateAllPaths)

  // gen initial map
  generateMap()
})

// gen grid
function generateMap() {
  console.log("Generating map")
  rows = Number.parseInt(document.getElementById("rows").value)
  cols = Number.parseInt(document.getElementById("cols").value)

 
  if (rows < 5 || rows > 30 || cols < 5 || cols > 30) {
    alert("Rows and columns must be between 5 and 30")
    return
  }

  // rst global variables
  grid = []
  startCell = null
  endCell = null

 
  const gridElement = document.getElementById("grid")
  gridElement.innerHTML = ""
  gridElement.style.gridTemplateColumns = `repeat(${cols}, 40px)`
  gridElement.style.gridTemplateRows = `repeat(${rows}, 40px)`

  
  for (let i = 0; i < rows; i++) {
    grid[i] = []
    for (let j = 0; j < cols; j++) {
      const cell = document.createElement("div")
      cell.className = "cell grass"
      cell.dataset.row = i
      cell.dataset.col = j

      
      grid[i][j] = {
        element: cell,
        row: i,
        col: j,
        terrain: "grass",
        cost: terrainCosts["grass"],
        empathyCost: 0,
        totalCost: terrainCosts["grass"],
        isStart: false,
        isEnd: false,
        isObstacle: false,
      }

      
      const costElement = document.createElement("div")
      costElement.className = "cell-cost"
      costElement.textContent = terrainCosts["grass"]
      cell.appendChild(costElement)

     
      cell.addEventListener("click", () => {
        handleCellClick(i, j)
      })

      
      gridElement.appendChild(cell)
    }
  }

  
  clearResults()
}


function handleCellClick(row, col) {
  console.log("Cell clicked:", row, col)
  const cell = grid[row][col]

  
  if (currentTool === "start") {
    if (startCell) {
      startCell.element.classList.remove("start")
      startCell.isStart = false
      startCell.terrain = "grass"
      startCell.cost = terrainCosts["grass"]
      startCell.totalCost = startCell.cost + startCell.empathyCost
      updateCellDisplay(startCell)
    }

    cell.element.className = "cell start"
    cell.isStart = true
    cell.terrain = "start"
    cell.cost = 0
    cell.totalCost = 0
    startCell = cell
    updateCellDisplay(cell)
    return
  }

  if (currentTool === "end") {
    if (endCell) {
      endCell.element.classList.remove("end")
      endCell.isEnd = false
      endCell.terrain = "grass"
      endCell.cost = terrainCosts["grass"]
      endCell.totalCost = endCell.cost + endCell.empathyCost
      updateCellDisplay(endCell)
    }

    cell.element.className = "cell end"
    cell.isEnd = true
    cell.terrain = "end"
    cell.cost = 0
    cell.totalCost = 0
    endCell = cell
    updateCellDisplay(cell)
    return
  }


  if (cell.isStart || cell.isEnd) {
    return 
  }


  cell.element.classList.remove(cell.terrain)

  //  new terrain
  cell.terrain = currentTool
  cell.element.classList.add(currentTool)


  cell.cost = terrainCosts[currentTool]
  cell.isObstacle = currentTool === "obstacle"

  
  if (["wolf", "fear", "monument", "temple"].includes(currentTool)) {
    calculateEmpathyAuras()
  }

  updateCellDisplay(cell)

  
  clearResults()
}


function updateCellDisplay(cell) {
  
  const costElement = cell.element.querySelector(".cell-cost")

  if (cell.isObstacle) {
    costElement.textContent = "∞"
  } else if (cell.isStart || cell.isEnd) {
    costElement.textContent = "0"
  } else {
    if (showEmpathyMap) {
      costElement.textContent = cell.totalCost
    } else {
      costElement.textContent = cell.cost
    }
  }

  
  if (showEmpathyMap) {
   
    cell.element.classList.remove(
      "repulsion-aura-1",
      "repulsion-aura-2",
      "repulsion-aura-3",
      "attraction-aura-1",
      "attraction-aura-2",
      "attraction-aura-3",
    )

    
    if (cell.empathyCost > 0) {
      if (cell.empathyCost >= 7) {
        cell.element.classList.add("repulsion-aura-3")
      } else if (cell.empathyCost >= 4) {
        cell.element.classList.add("repulsion-aura-2")
      } else if (cell.empathyCost >= 1) {
        cell.element.classList.add("repulsion-aura-1")
      }
    } else if (cell.empathyCost < 0) {
      if (cell.empathyCost <= -7) {
        cell.element.classList.add("attraction-aura-3")
      } else if (cell.empathyCost <= -4) {
        cell.element.classList.add("attraction-aura-2")
      } else if (cell.empathyCost <= -1) {
        cell.element.classList.add("attraction-aura-1")
      }
    }
  } else {
    
    cell.element.classList.remove(
      "repulsion-aura-1",
      "repulsion-aura-2",
      "repulsion-aura-3",
      "attraction-aura-1",
      "attraction-aura-2",
      "attraction-aura-3",
    )
  }
}


function calculateEmpathyAuras() {
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      grid[i][j].empathyCost = 0
    }
  }

  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = grid[i][j]
      if (["wolf", "fear", "monument", "temple"].includes(cell.terrain)) {
        const empathyInfo = empathyValues[cell.terrain]

        
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const targetCell = grid[r][c]
            const distance = Math.sqrt(Math.pow(r - i, 2) + Math.pow(c - j, 2))

            if (distance <= empathyInfo.radius) {
              
              const effect = Math.round(empathyInfo.value * (1 - distance / (empathyInfo.radius + 1)))

              if (empathyInfo.type === "repulsion") {
                targetCell.empathyCost += effect
              } else {
                targetCell.empathyCost += effect 
              }
            }
          }
        }
      }
    }
  }

  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = grid[i][j]
      cell.totalCost = cell.cost + cell.empathyCost

     
      if (cell.totalCost < 1 && !cell.isStart && !cell.isEnd && !cell.isObstacle) {
        cell.totalCost = 1
      }

      updateCellDisplay(cell)
    }
  }
}

// toggle empathy map display
function toggleEmpathyMap() {
  showEmpathyMap = !showEmpathyMap

  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      updateCellDisplay(grid[i][j])
    }
  }

  const button = document.getElementById("toggle-empathy")
  button.textContent = showEmpathyMap ? "Hide Empathy Map" : "Show Empathy Map"
}


function clearMap() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = grid[i][j]

   
      cell.element.className = "cell grass"
      cell.terrain = "grass"
      cell.cost = terrainCosts["grass"]
      cell.empathyCost = 0
      cell.totalCost = cell.cost
      cell.isStart = false
      cell.isEnd = false
      cell.isObstacle = false

      updateCellDisplay(cell)
    }
  }

  
  startCell = null
  endCell = null

  
  clearResults()
}


function clearResults() {
  
  algorithmResults = {
    "depth-first": { normal: null, empathy: null },
    "best-first": { normal: null, empathy: null },
    "a-star": { normal: null, empathy: null },
  }

  
  clearPaths()

  
  document.getElementById("depth-first-stats").innerHTML = ""
  document.getElementById("best-first-stats").innerHTML = ""
  document.getElementById("a-star-stats").innerHTML = ""
}


function clearPaths() {
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i] && grid[i][j] && grid[i][j].element) {
        grid[i][j].element.classList.remove(
          "depth-first",
          "depth-first-empathy",
          "best-first",
          "best-first-empathy",
          "a-star",
          "a-star-empathy",
          "path",
        )
      }
    }
  }
}


function runAlgorithms() {
  
  if (!startCell || !endCell) {
    alert("Please set start and end points first")
    return
  }

  
  clearResults()

  //  algorithms without empathy
  algorithmResults["depth-first"].normal = depthFirstSearch(false)
  algorithmResults["best-first"].normal = bestFirstSearch(false)
  algorithmResults["a-star"].normal = aStarSearch(false)

  //  algorithms with empathy
  algorithmResults["depth-first"].empathy = depthFirstSearch(true)
  algorithmResults["best-first"].empathy = bestFirstSearch(true)
  algorithmResults["a-star"].empathy = aStarSearch(true)

  //  results
  displayResults("depth-first", algorithmResults["depth-first"].normal, algorithmResults["depth-first"].empathy)
  displayResults("best-first", algorithmResults["best-first"].normal, algorithmResults["best-first"].empathy)
  displayResults("a-star", algorithmResults["a-star"].normal, algorithmResults["a-star"].empathy)

  // visualize paths (without animation)
  visualizePaths()
}


function runSingleAlgorithm(algorithm) {
  
  if (!startCell || !endCell) {
    alert("Please set start and end points first")
    return
  }

  
  clearPaths()

 
  if (algorithm === "depth-first") {
    algorithmResults["depth-first"].normal = depthFirstSearch(false)
    algorithmResults["depth-first"].empathy = depthFirstSearch(true)
    displayResults("depth-first", algorithmResults["depth-first"].normal, algorithmResults["depth-first"].empathy)
  } else if (algorithm === "best-first") {
    algorithmResults["best-first"].normal = bestFirstSearch(false)
    algorithmResults["best-first"].empathy = bestFirstSearch(true)
    displayResults("best-first", algorithmResults["best-first"].normal, algorithmResults["best-first"].empathy)
  } else if (algorithm === "a-star") {
    algorithmResults["a-star"].normal = aStarSearch(false)
    algorithmResults["a-star"].empathy = aStarSearch(true)
    displayResults("a-star", algorithmResults["a-star"].normal, algorithmResults["a-star"].empathy)
  }

  // animating algorithm paths
  if (algorithm === "depth-first") {
    animatePath(algorithmResults["depth-first"].normal.path, "depth-first", false)
    setTimeout(() => {
      animatePath(algorithmResults["depth-first"].empathy.path, "depth-first", true)
    }, 500)
  } else if (algorithm === "best-first") {
    animatePath(algorithmResults["best-first"].normal.path, "best-first", false)
    setTimeout(() => {
      animatePath(algorithmResults["best-first"].empathy.path, "best-first", true)
    }, 500)
  } else if (algorithm === "a-star") {
    animatePath(algorithmResults["a-star"].normal.path, "a-star", false)
    setTimeout(() => {
      animatePath(algorithmResults["a-star"].empathy.path, "a-star", true)
    }, 500)
  }
}


function visualizePaths() {
  
  if (algorithmResults["depth-first"].normal.pathFound) {
    for (const { row, col } of algorithmResults["depth-first"].normal.path) {
      if (!grid[row][col].isStart && !grid[row][col].isEnd) {
        grid[row][col].element.classList.add("depth-first")
      }
    }
  }

  if (algorithmResults["depth-first"].empathy.pathFound) {
    for (const { row, col } of algorithmResults["depth-first"].empathy.path) {
      if (!grid[row][col].isStart && !grid[row][col].isEnd) {
        grid[row][col].element.classList.add("depth-first-empathy")
      }
    }
  }

  if (algorithmResults["best-first"].normal.pathFound) {
    for (const { row, col } of algorithmResults["best-first"].normal.path) {
      if (!grid[row][col].isStart && !grid[row][col].isEnd) {
        grid[row][col].element.classList.add("best-first")
      }
    }
  }

  if (algorithmResults["best-first"].empathy.pathFound) {
    for (const { row, col } of algorithmResults["best-first"].empathy.path) {
      if (!grid[row][col].isStart && !grid[row][col].isEnd) {
        grid[row][col].element.classList.add("best-first-empathy")
      }
    }
  }

  if (algorithmResults["a-star"].normal.pathFound) {
    for (const { row, col } of algorithmResults["a-star"].normal.path) {
      if (!grid[row][col].isStart && !grid[row][col].isEnd) {
        grid[row][col].element.classList.add("a-star")
      }
    }
  }

  if (algorithmResults["a-star"].empathy.pathFound) {
    for (const { row, col } of algorithmResults["a-star"].empathy.path) {
      if (!grid[row][col].isStart && !grid[row][col].isEnd) {
        grid[row][col].element.classList.add("a-star-empathy")
      }
    }
  }
}


function animateAllPaths() {

  if (
    !algorithmResults["depth-first"].normal ||
    !algorithmResults["best-first"].normal ||
    !algorithmResults["a-star"].normal
  ) {
    
    if (!startCell || !endCell) {
      alert("Please set start and end points first")
      return
    }

    //  algorithms without empathy
    algorithmResults["depth-first"].normal = depthFirstSearch(false)
    algorithmResults["best-first"].normal = bestFirstSearch(false)
    algorithmResults["a-star"].normal = aStarSearch(false)

    // algorithms with empathy
    algorithmResults["depth-first"].empathy = depthFirstSearch(true)
    algorithmResults["best-first"].empathy = bestFirstSearch(true)
    algorithmResults["a-star"].empathy = aStarSearch(true)

    //  results
    displayResults("depth-first", algorithmResults["depth-first"].normal, algorithmResults["depth-first"].empathy)
    displayResults("best-first", algorithmResults["best-first"].normal, algorithmResults["best-first"].empathy)
    displayResults("a-star", algorithmResults["a-star"].normal, algorithmResults["a-star"].empathy)
  }

  
  clearPaths()

 
  setTimeout(() => {
    if (algorithmResults["depth-first"].normal.pathFound) {
      animatePath(algorithmResults["depth-first"].normal.path, "depth-first", false)
    }
  }, 0)

  setTimeout(() => {
    if (algorithmResults["depth-first"].empathy.pathFound) {
      animatePath(algorithmResults["depth-first"].empathy.path, "depth-first", true)
    }
  }, 500)

  setTimeout(() => {
    if (algorithmResults["best-first"].normal.pathFound) {
      animatePath(algorithmResults["best-first"].normal.path, "best-first", false)
    }
  }, 1000)

  setTimeout(() => {
    if (algorithmResults["best-first"].empathy.pathFound) {
      animatePath(algorithmResults["best-first"].empathy.path, "best-first", true)
    }
  }, 1500)

  setTimeout(() => {
    if (algorithmResults["a-star"].normal.pathFound) {
      animatePath(algorithmResults["a-star"].normal.path, "a-star", false)
    }
  }, 2000)

  setTimeout(() => {
    if (algorithmResults["a-star"].empathy.pathFound) {
      animatePath(algorithmResults["a-star"].empathy.path, "a-star", true)
    }
  }, 2500)
}


function animatePath(path, algorithm, useEmpathy) {
  if (!path || path.length === 0) return

  const className = useEmpathy ? `${algorithm}-empathy` : algorithm
  let index = 0

  function animateStep() {
    if (index < path.length) {
      const { row, col } = path[index]
      if (!grid[row][col].isStart && !grid[row][col].isEnd) {
        grid[row][col].element.classList.add(className)
        grid[row][col].element.classList.add("path") 
      }
      index++
      setTimeout(animateStep, 50) 
    }
  }

  animateStep()
}


function displayResults(algorithm, normalResult, empathyResult) {
  const statsElement = document.getElementById(`${algorithm}-stats`)

  
  let html = '<table style="width:100%; border-collapse: collapse; margin-top: 10px;">'
  html +=
    '<tr><th style="text-align:left; padding: 5px; border-bottom: 1px solid #ddd;"></th><th style="text-align:right; padding: 5px; border-bottom: 1px solid #ddd;">Without Empathy</th><th style="text-align:right; padding: 5px; border-bottom: 1px solid #ddd;">With Empathy</th></tr>'

  
  html += `<tr><td style="padding: 5px;">Path Found</td><td style="text-align:right; padding: 5px;">${normalResult.pathFound ? "Yes" : "No"}</td><td style="text-align:right; padding: 5px;">${empathyResult.pathFound ? "Yes" : "No"}</td></tr>`

  
  html += `<tr><td style="padding: 5px;">Path Length</td><td style="text-align:right; padding: 5px;">${normalResult.pathFound ? normalResult.path.length : "N/A"}</td><td style="text-align:right; padding: 5px;">${empathyResult.pathFound ? empathyResult.path.length : "N/A"}</td></tr>`

  
  html += `<tr><td style="padding: 5px;">Path Cost</td><td style="text-align:right; padding: 5px;">${normalResult.pathFound ? normalResult.cost : "N/A"}</td><td style="text-align:right; padding: 5px;">${empathyResult.pathFound ? empathyResult.cost : "N/A"}</td></tr>`

  
  html += `<tr><td style="padding: 5px;">Nodes Explored</td><td style="text-align:right; padding: 5px;">${normalResult.nodesExplored}</td><td style="text-align:right; padding: 5px;">${empathyResult.nodesExplored}</td></tr>`

  html += "</table>"

  
  statsElement.innerHTML = html
}


function depthFirstSearch(useEmpathy) {
  
  const visited = Array(rows)
    .fill()
    .map(() => Array(cols).fill(false))
  const path = []
  let pathFound = false
  let nodesExplored = 0
  let totalCost = 0

  // DFS function
  function dfs(row, col, currentPath, currentCost) {
    
    if (row < 0 || row >= rows || col < 0 || col >= cols || visited[row][col] || grid[row][col].isObstacle) {
      return false
    }

    
    visited[row][col] = true
    nodesExplored++

    
    currentPath.push({ row, col })

   
    const cell = grid[row][col]
    const cellCost = useEmpathy ? cell.totalCost : cell.cost
    currentCost += cellCost

    if (cell.isEnd) {
      pathFound = true
      path.push(...currentPath)
      totalCost = currentCost
      return true
    }

    //  all four directions (up, right, down, left)
    const directions = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ]

    for (const [dr, dc] of directions) {
      if (dfs(row + dr, col + dc, [...currentPath], currentCost)) {
        return true
      }
    }

    return false
  }

  //  DFS from start cell
  dfs(startCell.row, startCell.col, [], 0)

  
  return {
    pathFound,
    path,
    cost: totalCost,
    nodesExplored,
  }
}

// Best First Search- BFS
function bestFirstSearch(useEmpathy) {
  
  const visited = Array(rows)
    .fill()
    .map(() => Array(cols).fill(false))
  const path = []
  let pathFound = false
  let nodesExplored = 0
  let totalCost = 0

  
  const queue = []

  // Heuristic function (Manhattan distance)
  function heuristic(row, col) {
    return Math.abs(row - endCell.row) + Math.abs(col - endCell.col)
  }

  
  queue.push({
    row: startCell.row,
    col: startCell.col,
    priority: heuristic(startCell.row, startCell.col),
    path: [],
    cost: 0,
  })

  
  while (queue.length > 0) {
    
    queue.sort((a, b) => a.priority - b.priority)

    
    const { row, col, path: currentPath, cost: currentCost } = queue.shift()

    
    if (visited[row][col] || grid[row][col].isObstacle) {
      continue
    }

    
    visited[row][col] = true
    nodesExplored++

    
    const newPath = [...currentPath, { row, col }]

    
    const cell = grid[row][col]
    const cellCost = useEmpathy ? cell.totalCost : cell.cost
    const newCost = currentCost + cellCost

    
    if (cell.isEnd) {
      pathFound = true
      path.push(...newPath)
      totalCost = newCost
      break
    }

    
    const directions = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ]

    for (const [dr, dc] of directions) {
      const newRow = row + dr
      const newCol = col + dc

      
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
        })
      }
    }
  }

  
  return {
    pathFound,
    path,
    cost: totalCost,
    nodesExplored,
  }
}

// A* Search 
function aStarSearch(useEmpathy) {
  
  const visited = Array(rows)
    .fill()
    .map(() => Array(cols).fill(false))
  const path = []
  let pathFound = false
  let nodesExplored = 0
  let totalCost = 0

  
  const queue = []

  // Heuristic function (Manhattan distance)
  function heuristic(row, col) {
    return Math.abs(row - endCell.row) + Math.abs(col - endCell.col)
  }

  
  queue.push({
    row: startCell.row,
    col: startCell.col,
    f: heuristic(startCell.row, startCell.col),
    g: 0,
    path: [],
  })

  
  while (queue.length > 0) {
    
    queue.sort((a, b) => a.f - b.f)

    
    const { row, col, g: currentCost, path: currentPath } = queue.shift()

    
    if (visited[row][col] || grid[row][col].isObstacle) {
      continue
    }

    
    visited[row][col] = true
    nodesExplored++

    
    const newPath = [...currentPath, { row, col }]

 
    if (grid[row][col].isEnd) {
      pathFound = true
      path.push(...newPath)
      totalCost = currentCost
      break
    }

   
    const directions = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ]

    for (const [dr, dc] of directions) {
      const newRow = row + dr
      const newCol = col + dc

      
      if (
        newRow >= 0 &&
        newRow < rows &&
        newCol >= 0 &&
        newCol < cols &&
        !visited[newRow][newCol] &&
        !grid[newRow][newCol].isObstacle
      ) {
        
		  
        const cell = grid[newRow][newCol]
        const cellCost = useEmpathy ? cell.totalCost : cell.cost
        const g = currentCost + cellCost
        const h = heuristic(newRow, newCol)
        const f = g + h

        
        queue.push({
          row: newRow,
          col: newCol,
          f: f,
          g: g,
          path: newPath,
        })
      }
    }
  }

 
  return {
    pathFound,
    path,
    cost: totalCost,
    nodesExplored,
  }
}

