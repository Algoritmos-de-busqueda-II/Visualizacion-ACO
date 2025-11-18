// Controlador principal
let visualization;
let aco;
let running = false;
let paused = false;
let stepByStep = false;
let animationSpeed = 50;
let animationTimer = null;
let startTime = null;

// Instancia de ejemplo con 10 nodos
const exampleInstance = {
    name: 'Ejemplo 10 nodos',
    cities: [
        { x: 100, y: 100 },
        { x: 300, y: 150 },
        { x: 500, y: 100 },
        { x: 600, y: 300 },
        { x: 500, y: 500 },
        { x: 300, y: 550 },
        { x: 100, y: 450 },
        { x: 50, y: 300 },
        { x: 250, y: 300 },
        { x: 400, y: 350 }
    ]
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    visualization = new Visualization('mainCanvas', 'chartCanvas');
    
    // Resetear filtros al cargar
    document.getElementById('showPheromoneValues').checked = false;
    document.querySelector('input[name="viewMode"][value="general"]').checked = true;
    document.getElementById('antSelector').style.display = 'none';
    
    setupEventListeners();
    loadExampleInstance();
    updateUI();
});

// Configurar event listeners
function setupEventListeners() {
    // Selector de instancia
    document.getElementById('instanceSelect').addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            document.getElementById('fileInput').click();
            // Resetear el select para que no quede en "Cargar archivo"
            setTimeout(() => {
                if (currentInstance) {
                    e.target.value = 'example';
                }
            }, 100);
        } else {
            loadExampleInstance();
        }
    });
    
    document.getElementById('fileInput').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            loadTSPFile(e.target.files[0]);
        }
    });
    
    // Botones de control
    document.getElementById('btnStart').addEventListener('click', startACO);
    document.getElementById('btnPause').addEventListener('click', togglePause);
    document.getElementById('btnReset').addEventListener('click', resetACO);
    
    // Botón de descarga de ejemplo
    document.getElementById('btnDownloadExample').addEventListener('click', () => {
        const exampleContent = `NAME: ejemplo_10_nodos
TYPE: TSP
COMMENT: Instancia de ejemplo con 10 nodos
DIMENSION: 10
EDGE_WEIGHT_TYPE: EUC_2D
NODE_COORD_SECTION
1 100 200
2 300 150
3 500 250
4 450 400
5 200 450
6 350 300
7 150 350
8 400 100
9 250 250
10 300 400
EOF`;
        const blob = new Blob([exampleContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ejemplo_tsp.txt';
        a.click();
        URL.revokeObjectURL(url);
    });
    
    // Slider de velocidad
    document.getElementById('speedSlider').addEventListener('input', (e) => {
        animationSpeed = parseInt(e.target.value);
        updateSpeedLabel();
    });
    
    // Modo de visualización
    document.querySelectorAll('input[name="viewMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const mode = e.target.value;
            visualization.setViewMode(mode);
            document.getElementById('antSelector').style.display = 
                mode === 'individual' ? 'block' : 'none';
            if (visualization.aco) {
                visualization.draw();
            }
        });
    });
    
    // Selector de hormiga
    document.getElementById('antSelect').addEventListener('change', (e) => {
        visualization.setSelectedAnt(parseInt(e.target.value));
        if (visualization.aco) {
            visualization.draw();
        }
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
            visualization.draw();
        }
    });
}

// Cargar instancia de ejemplo
function loadExampleInstance() {
    visualization.setCities(exampleInstance.cities);
    visualization.draw();
    
    document.getElementById('instanceInfo').innerHTML = 
        `<strong>${exampleInstance.name}</strong><br>Nodos: ${exampleInstance.cities.length}`;
}

// Cargar archivo TSP
function loadTSPFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const cities = parseTSPFile(e.target.result);
            visualization.setCities(cities);
            visualization.draw();
            
            document.getElementById('instanceInfo').innerHTML = 
                `<strong>${file.name}</strong><br>Nodos: ${cities.length}`;
        } catch (error) {
            alert('Error al cargar el archivo TSP: ' + error.message);
            document.getElementById('instanceSelect').value = 'example';
            loadExampleInstance();
        }
    };
    reader.readAsText(file);
}

// Parser de archivos TSP
function parseTSPFile(content) {
    const lines = content.split('\n');
    const cities = [];
    let inCoordSection = false;
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed === 'NODE_COORD_SECTION') {
            inCoordSection = true;
            continue;
        }
        
        if (trimmed === 'EOF' || trimmed === '') {
            continue;
        }
        
        if (inCoordSection) {
            const parts = trimmed.split(/\s+/);
            if (parts.length >= 3) {
                const id = parseInt(parts[0]);
                const x = parseFloat(parts[1]);
                const y = parseFloat(parts[2]);
                cities.push({ x, y, name: id.toString() });
            }
        }
    }
    
    if (cities.length === 0) {
        throw new Error('No se encontraron coordenadas en el archivo');
    }
    
    return cities;
}

// Obtener parámetros de la UI
function getParameters() {
    return {
        numAnts: parseInt(document.getElementById('numAnts').value),
        maxIterations: parseInt(document.getElementById('maxIterations').value),
        rho: parseFloat(document.getElementById('rho').value),
        alpha: parseFloat(document.getElementById('alpha').value),
        beta: parseFloat(document.getElementById('beta').value),
        Q: parseFloat(document.getElementById('Q').value)
    };
}

// Iniciar ACO
function startACO() {
    if (running && !paused) return;
    
    if (!running) {
        const params = getParameters();
        aco = new ACO(visualization.cities, params);
        visualization.setACO(aco);
        
        // Inicializar selector de hormigas
        const antSelect = document.getElementById('antSelect');
        antSelect.innerHTML = '';
        for (let i = 0; i < params.numAnts; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Hormiga ${i + 1}`;
            antSelect.appendChild(option);
        }
        
        running = true;
        startTime = Date.now();
    }
    
    paused = false;
    stepByStep = false;
    updateUI();
    runAnimation();
}

// Pausar/reanudar
function togglePause() {
    paused = !paused;
    document.getElementById('btnPause').textContent = paused ? 'Reanudar' : 'Pausar';
    
    if (!paused && !stepByStep) {
        runAnimation();
    }
}

// Ejecutar paso
function executeStep() {
    if (!running) {
        startACO();
    }
    
    stepByStep = true;
    paused = false;
    
    const canContinue = aco.step();
    visualization.draw();
    updateStats();
    
    if (!canContinue) {
        stopACO();
    }
}

// Reiniciar
function resetACO() {
    stopACO();
    running = false;
    paused = false;
    stepByStep = false;
    aco = null;
    startTime = null;
    
    visualization.setACO(null);
    visualization.draw();
    updateStats();
    updateUI();
}

// Detener animación
function stopACO() {
    if (animationTimer) {
        clearTimeout(animationTimer);
        animationTimer = null;
    }
    running = false;
    paused = false;
    updateUI();
}

// Ejecutar animación
function runAnimation() {
    if (!running || paused || stepByStep) return;
    
    const canContinue = aco.step();
    visualization.draw();
    updateStats();
    
    if (canContinue) {
        const delay = Math.max(10, 1000 - animationSpeed * 10);
        animationTimer = setTimeout(runAnimation, delay);
    } else {
        stopACO();
        showCompletionMessage();
    }
}

// Actualizar UI
function updateUI() {
    document.getElementById('btnStart').disabled = running && !paused;
    document.getElementById('btnPause').disabled = !running;
    
    // Deshabilitar configuración durante ejecución
    const configInputs = document.querySelectorAll('.param input, .param select, #instanceSelect');
    configInputs.forEach(input => {
        input.disabled = running;
    });
}

// Actualizar etiqueta de velocidad
function updateSpeedLabel() {
    const label = document.getElementById('speedLabel');
    if (animationSpeed < 33) {
        label.textContent = 'Lenta';
    } else if (animationSpeed < 66) {
        label.textContent = 'Media';
    } else {
        label.textContent = 'Rápida';
    }
}

// Actualizar estadísticas
function updateStats() {
    const state = aco ? aco.getState() : null;
    
    document.getElementById('statIteration').textContent = 
        state ? state.iteration : '0';
    
    document.getElementById('statBestDist').textContent = 
        state && state.bestDistance !== Infinity ? state.bestDistance.toFixed(2) : '-';
    
    document.getElementById('statBestIter').textContent = 
        state && state.bestIteration > 0 ? state.bestIteration : '-';
    
    if (startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        document.getElementById('statTime').textContent = `${elapsed}s`;
    } else {
        document.getElementById('statTime').textContent = '0s';
    }
    
    // Actualizar estado actual
    updateCurrentState(state);
}

// Actualizar panel de estado actual
function updateCurrentState(state) {
    const stateDiv = document.getElementById('currentState');
    
    if (!state) {
        stateDiv.innerHTML = '<p>Sin datos. Inicia el algoritmo para ver el estado.</p>';
        return;
    }
    
    const viewMode = document.querySelector('input[name="viewMode"]:checked').value;
    
    if (viewMode === 'general') {
        const completed = state.ants.filter(ant => ant.completed).length;
        const inProgress = state.ants.length - completed;
        
        let bestTourText = '';
        if (state.bestTour) {
            const tourNumbers = state.bestTour.map(n => n + 1).join(' → ');
            bestTourText = `<p><strong>Mejor tour:</strong><br><span style="font-size: 0.9em; word-break: break-all;">${tourNumbers}</span></p>`;
        }
        
        stateDiv.innerHTML = `
            <p><strong>Iteración:</strong> ${state.iteration} / ${aco.params.maxIterations}</p>
            <p><strong>Hormigas completadas:</strong> ${completed} / ${state.ants.length}</p>
            <p><strong>Hormigas en progreso:</strong> ${inProgress}</p>
            <p><strong>Mejor distancia global:</strong> ${state.bestDistance !== Infinity ? state.bestDistance.toFixed(2) : 'N/A'}</p>
            ${bestTourText}
        `;
    } else {
        const ant = state.ants[visualization.selectedAnt];
        if (ant) {
            stateDiv.innerHTML = `
                <p><strong>Hormiga:</strong> ${ant.id + 1}</p>
                <p><strong>Nodo actual:</strong> ${ant.currentNode + 1}</p>
                <p><strong>Nodos visitados:</strong> ${ant.visited.size} / ${visualization.cities.length}</p>
                <p><strong>Distancia acumulada:</strong> ${ant.distance.toFixed(2)}</p>
                <p><strong>Estado:</strong> ${ant.completed ? '✓ Completado' : '⏳ En progreso'}</p>
                <p><strong>Tour:</strong> ${ant.tour.map(n => n + 1).join(' → ')}</p>
            `;
        }
    }
}

// Mostrar mensaje de finalización
function showCompletionMessage() {
    const state = aco.getState();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    const message = `
        ¡ACO Completado! 🎉
        
        Iteraciones: ${state.iteration}
        Mejor distancia: ${state.bestDistance.toFixed(2)}
        Encontrada en iteración: ${state.bestIteration}
        Tiempo total: ${elapsed}s
        
        Mejor tour: ${state.bestTour.map(n => n + 1).join(' → ')}
    `;
    
    alert(message);
}

// Actualizar estadísticas periódicamente si está corriendo
setInterval(() => {
    if (running && !paused) {
        updateStats();
    }
}, 1000);
