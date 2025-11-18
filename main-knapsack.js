// Controlador principal para el problema de la mochila
let visualization;
let animationInterval;
let startTime;
let isPaused = false;

// Instancia de ejemplo
const exampleInstance = {
    capacity: 269,
    items: [
        { id: 0, value: 55, weight: 95 },
        { id: 1, value: 10, weight: 4 },
        { id: 2, value: 47, weight: 60 },
        { id: 3, value: 5, weight: 32 },
        { id: 4, value: 4, weight: 23 },
        { id: 5, value: 50, weight: 72 },
        { id: 6, value: 8, weight: 80 },
        { id: 7, value: 61, weight: 62 },
        { id: 8, value: 85, weight: 65 },
        { id: 9, value: 87, weight: 46 }
    ]
};

let currentInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    visualization = new KnapsackVisualization('mainCanvas', 'chartCanvas');
    
    // Cargar instancia de ejemplo por defecto
    loadInstance(exampleInstance);
    
    setupEventListeners();
    resetFilters();
});

function setupEventListeners() {
    // Selector de instancia
    document.getElementById('instanceSelect').addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            document.getElementById('fileInput').click();
        } else {
            loadInstance(exampleInstance);
        }
    });
    
    // Carga de archivo
    document.getElementById('fileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const instance = parseKnapsackFile(event.target.result);
                if (instance) {
                    loadInstance(instance);
                } else {
                    alert('Error al leer el archivo. Formato incorrecto.');
                }
            };
            reader.readAsText(file);
        }
    });
    
    // Botones de control
    document.getElementById('btnStart').addEventListener('click', startACO);
    document.getElementById('btnPause').addEventListener('click', togglePause);
    document.getElementById('btnReset').addEventListener('click', resetACO);
    
    // Slider de velocidad
    document.getElementById('speedSlider').addEventListener('input', (e) => {
        const speed = parseInt(e.target.value);
        updateSpeedLabel(speed);
    });
    
    // Actualizar hint de evaporación
    document.getElementById('rho').addEventListener('input', (e) => {
        const rho = parseFloat(e.target.value);
        const evaporation = ((1 - rho) * 100).toFixed(0);
        e.target.nextElementSibling.textContent = `Evaporación: ${evaporation}%`;
    });
    
    // Checkbox de mostrar valores de feromonas
    document.getElementById('showPheromoneValues').addEventListener('change', () => {
        if (visualization.aco) {
            visualization.setShowPheromoneValues(document.getElementById('showPheromoneValues').checked);
        }
    });
    
    // Modo de visualización
    document.querySelectorAll('input[name="viewMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const mode = e.target.value;
            visualization.setViewMode(mode);
            
            if (mode === 'individual') {
                document.getElementById('antSelector').style.display = 'block';
                populateAntSelector();
            } else {
                document.getElementById('antSelector').style.display = 'none';
            }
        });
    });
    
    // Selector de hormiga individual
    document.getElementById('antSelect').addEventListener('change', (e) => {
        visualization.setSelectedAnt(parseInt(e.target.value));
    });
}

function loadInstance(instance) {
    currentInstance = instance;
    
    // Mostrar información
    const info = document.getElementById('instanceInfo');
    info.style.display = 'block';
    info.innerHTML = `
        <strong>Items:</strong> ${instance.items.length}<br>
        <strong>Capacidad:</strong> ${instance.capacity}
    `;
    
    // Reiniciar ACO si existe
    if (visualization.aco) {
        resetACO();
    }
}

function parseKnapsackFile(content) {
    try {
        const lines = content.trim().split('\n');
        const [numItems, capacity] = lines[0].trim().split(/\s+/).map(Number);
        
        const items = [];
        for (let i = 1; i <= numItems; i++) {
            const [value, weight] = lines[i].trim().split(/\s+/).map(Number);
            items.push({ id: i - 1, value, weight });
        }
        
        return { capacity, items };
    } catch (error) {
        console.error('Error parsing file:', error);
        return null;
    }
}

function startACO() {
    if (!currentInstance) {
        alert('Por favor, carga una instancia primero.');
        return;
    }
    
    // Leer parámetros
    const params = {
        numAnts: parseInt(document.getElementById('numAnts').value),
        maxIterations: parseInt(document.getElementById('maxIterations').value),
        rho: parseFloat(document.getElementById('rho').value),
        alpha: parseFloat(document.getElementById('alpha').value),
        beta: parseFloat(document.getElementById('beta').value),
        Q: parseFloat(document.getElementById('Q').value)
    };
    
    // Crear instancia ACO
    const aco = new ACOKnapsack(currentInstance.items, currentInstance.capacity, params);
    visualization.setACO(aco);
    
    // Actualizar UI
    document.getElementById('btnStart').disabled = true;
    document.getElementById('btnPause').disabled = false;
    document.getElementById('btnReset').disabled = false;
    
    // Iniciar animación
    startTime = Date.now();
    isPaused = false;
    animate();
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('btnPause').textContent = isPaused ? 'Reanudar' : 'Pausar';
    
    if (!isPaused) {
        animate();
    }
}

function resetACO() {
    // Detener animación
    if (animationInterval) {
        clearTimeout(animationInterval);
        animationInterval = null;
    }
    
    // Resetear ACO
    if (visualization.aco) {
        visualization.aco.reset();
        visualization.draw();
    }
    
    // Resetear UI
    document.getElementById('btnStart').disabled = false;
    document.getElementById('btnPause').disabled = true;
    document.getElementById('btnPause').textContent = 'Pausar';
    document.getElementById('btnReset').disabled = true;
    isPaused = false;
    
    // Resetear estadísticas
    updateStats();
}

function animate() {
    if (isPaused || !visualization.aco) return;
    
    const speed = parseInt(document.getElementById('speedSlider').value);
    const delay = 1000 / speed; // Convertir a ms
    
    const continueRunning = visualization.aco.step();
    
    visualization.draw();
    updateStats();
    updateCurrentState();
    
    if (continueRunning) {
        animationInterval = setTimeout(animate, delay);
    } else {
        // Algoritmo terminado
        document.getElementById('btnPause').disabled = true;
        document.getElementById('btnPause').textContent = 'Pausar';
    }
}

function updateStats() {
    const aco = visualization.aco;
    if (!aco) {
        document.getElementById('statIteration').textContent = '0';
        document.getElementById('statBestValue').textContent = '-';
        document.getElementById('statBestWeight').textContent = '-';
        document.getElementById('statBestIter').textContent = '-';
        document.getElementById('statTime').textContent = '0s';
        return;
    }
    
    document.getElementById('statIteration').textContent = aco.currentIteration;
    document.getElementById('statBestValue').textContent = aco.bestValue.toFixed(0);
    
    // Calcular peso de la mejor solución
    let bestWeight = 0;
    if (aco.bestSolution) {
        for (let i = 0; i < aco.numItems; i++) {
            if (aco.bestSolution[i]) {
                bestWeight += aco.items[i].weight;
            }
        }
    }
    document.getElementById('statBestWeight').textContent = `${bestWeight}/${aco.capacity}`;
    document.getElementById('statBestIter').textContent = aco.bestIteration;
    
    if (startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        document.getElementById('statTime').textContent = `${elapsed}s`;
    }
}

function updateCurrentState() {
    const aco = visualization.aco;
    if (!aco) {
        document.getElementById('currentState').innerHTML = '<p>Esperando inicio...</p>';
        return;
    }
    
    const ant = aco.ants[aco.currentAnt] || aco.ants[aco.currentAnt - 1];
    if (!ant) {
        document.getElementById('currentState').innerHTML = '<p>Esperando inicio...</p>';
        return;
    }
    
    // Obtener items seleccionados de la hormiga actual
    const selectedItems = [];
    for (let i = 0; i < aco.numItems; i++) {
        if (ant.solution[i]) {
            selectedItems.push(i + 1);
        }
    }
    
    // Obtener items de la mejor solución global
    let bestSolutionItems = [];
    if (aco.bestSolution) {
        for (let i = 0; i < aco.numItems; i++) {
            if (aco.bestSolution[i]) {
                bestSolutionItems.push(i + 1);
            }
        }
    }
    
    const html = `
        <p><strong>Iteración:</strong> ${aco.currentIteration + 1}</p>
        <p><strong>Hormiga:</strong> ${ant.id + 1}/${aco.numAnts}</p>
        <p><strong>Valor actual:</strong> ${ant.value}</p>
        <p><strong>Peso actual:</strong> ${ant.weight}/${aco.capacity}</p>
        <p><strong>Items seleccionados:</strong> ${selectedItems.length > 0 ? selectedItems.join(', ') : 'Ninguno'}</p>
        ${aco.bestSolution ? `<p><strong>Mejor valor global:</strong> ${aco.bestValue} (Iteración ${aco.bestIteration}): {${bestSolutionItems.join(', ')}}</p>` : ''}
    `;
    
    document.getElementById('currentState').innerHTML = html;
}

function populateAntSelector() {
    const aco = visualization.aco;
    if (!aco) return;
    
    const select = document.getElementById('antSelect');
    select.innerHTML = '';
    
    for (let i = 0; i < aco.numAnts; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Hormiga ${i + 1}`;
        select.appendChild(option);
    }
}

function updateSpeedLabel(speed) {
    let label = 'Media';
    if (speed < 33) label = 'Lenta';
    else if (speed > 66) label = 'Rápida';
    document.getElementById('speedLabel').textContent = label;
}

function resetFilters() {
    document.getElementById('showPheromoneValues').checked = false;
    document.querySelectorAll('input[name="viewMode"]')[0].checked = true;
    document.getElementById('antSelector').style.display = 'none';
}
