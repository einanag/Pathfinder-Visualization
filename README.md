# Pathfinder Visualization


University project developed for the Artificial Intelligence and empirical systems course in my Master's program. This interactive tool visualizes pathfinding algorithms with dynamic empathy-based cost adjustments.

<p align="left">
  <img src="assets/demo.gif" alt="Pathfinding Visualization Demo" width="600"/>
</p>

---

## Features

### Pathfinding Algorithms
- **Depth-First Search (DFS)**
- **Best-First Search (BFS)**
- **A* Algorithm**

All algorithms support two modes:
- Standard terrain costs
- Empathy-adjusted costs (attraction/repulsion)

---

### Interactive elements
- Adjustable grid size (5x5 to 30x30)
- Multiple terrain types with custom costs:
  - Road (cost: 11)
  - Grass (12)
  - Forest (13)
  - Lake (15)
  - Mountain (17)
  - Obstacles (∞)
- Empathy nodes:
  - **Repulsion**:
    - Wolves (+10 cost within 3-cell radius)
    - Fear zones (+8 cost within 3-cell radius)
  - **Attraction**:
    - Monuments (-8 cost within 3-cell radius)
    - Temples (-10 cost within 3-cell radius)

---

### Visualization tools
- Animated path exploration
- Side-by-side algorithm comparison
- Detailed statistics panel showing:
  - Path found status
  - Path length
  - Total cost
  - Nodes explored

---

## How to Use

1. **Set Up the Grid**
   - Adjust rows and columns (5-30)
   - Click on "Generate Map"

2. **Place Nodes**
   - Set start and end points
   - Add terrain using the dropdown menu
   - Place empathy nodes (wolves, temples, etc.)

3. **Run Algorithms**
   - Click "Run Algorithms" for all three methods
   - Or use individual algorithm buttons
   - Toggle "Show Empathy Map" to compare results

4. **Interpret results**
   - Paths are color-coded by algorithm
   - Statistics update in real-time
   - Hover over cells to see detailed costs

---
## Technical Implementation

- JavaScript 
- CSS
- HTML
---
### Algorithm details
- All algorithms use 4-directional movement (N/S/E/W)
- Heuristics based on Manhattan distance
- Empathy effects calculated using radial decay:
  ```javascript
  effect = base_value * (1 - distance/radius)
