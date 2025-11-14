// Clase principal del algoritmo ACO
class ACO {
    constructor(cities, params) {
        this.cities = cities;
        this.numCities = cities.length;
        this.params = params;
        
        // Valores mínimo y máximo de feromona para evitar estancamiento
        this.tauMin = 0.01;
        this.tauMax = 10.0;
        
        // Inicializar matrices
        this.distances = this.calculateDistances();
        this.pheromones = this.initializePheromones();
        this.visibility = this.calculateVisibility();
        
        // Estado del algoritmo
        this.iteration = 1;
        this.bestTour = null;
        this.bestDistance = Infinity;
        this.bestIteration = 0;
        this.convergenceData = [];
        
        // Hormigas
        this.ants = [];
        this.currentAnt = 0;
        this.initialized = false;
    }
    
    // Calcular matriz de distancias
    calculateDistances() {
        const n = this.numCities;
        const dist = Array(n).fill().map(() => Array(n).fill(0));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    const dx = this.cities[i].x - this.cities[j].x;
                    const dy = this.cities[i].y - this.cities[j].y;
                    dist[i][j] = Math.sqrt(dx * dx + dy * dy);
                }
            }
        }
        return dist;
    }
    
    // Inicializar feromonas con valores pequeños aleatorios
    initializePheromones() {
        const n = this.numCities;
        const pheromones = Array(n).fill().map(() => Array(n).fill(0));
        
        // Inicializar con un valor inicial moderado
        const initialPheromone = 1.0;
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    pheromones[i][j] = initialPheromone;
                }
            }
        }
        return pheromones;
    }
    
    // Calcular visibilidad (η = 1/distancia)
    calculateVisibility() {
        const n = this.numCities;
        const visibility = Array(n).fill().map(() => Array(n).fill(0));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i !== j && this.distances[i][j] > 0) {
                    visibility[i][j] = 1.0 / this.distances[i][j];
                }
            }
        }
        return visibility;
    }
    
    // Crear hormigas en posiciones aleatorias
    createAnts() {
        this.ants = [];
        for (let k = 0; k < this.params.numAnts; k++) {
            const startNode = Math.floor(Math.random() * this.numCities);
            this.ants.push({
                id: k,
                tour: [startNode],
                visited: new Set([startNode]),
                currentNode: startNode,
                distance: 0,
                completed: false
            });
        }
        this.currentAnt = 0;
    }
    
    // Calcular probabilidades de transición desde el nodo i
    calculateProbabilities(ant) {
        const i = ant.currentNode;
        const { alpha, beta } = this.params;
        const probabilities = [];
        let sum = 0;
        
        // Calcular probabilidades para cada nodo no visitado
        for (let j = 0; j < this.numCities; j++) {
            if (!ant.visited.has(j)) {
                const tau = Math.pow(this.pheromones[i][j], alpha);
                const eta = Math.pow(this.visibility[i][j], beta);
                const prob = tau * eta;
                probabilities.push({ node: j, probability: prob });
                sum += prob;
            }
        }
        
        // Normalizar probabilidades
        if (sum > 0) {
            probabilities.forEach(p => p.probability /= sum);
        }
        
        return probabilities;
    }
    
    // Selección de nodo usando ruleta
    selectNextNode(probabilities) {
        const r = Math.random();
        let accumulated = 0;
        
        for (const p of probabilities) {
            accumulated += p.probability;
            if (r <= accumulated) {
                return p.node;
            }
        }
        
        // Fallback: retornar el último nodo
        return probabilities[probabilities.length - 1].node;
    }
    
    // Mover una hormiga al siguiente nodo
    moveAnt(ant) {
        if (ant.completed) return;
        
        // Si ya visitó todos los nodos, completar el tour
        if (ant.visited.size === this.numCities) {
            // Volver al nodo inicial
            const lastNode = ant.currentNode;
            const firstNode = ant.tour[0];
            ant.distance += this.distances[lastNode][firstNode];
            ant.tour.push(firstNode);
            ant.completed = true;
            return;
        }
        
        // Calcular probabilidades y seleccionar siguiente nodo
        const probabilities = this.calculateProbabilities(ant);
        
        if (probabilities.length === 0) {
            ant.completed = true;
            return;
        }
        
        const nextNode = this.selectNextNode(probabilities);
        
        // Actualizar distancia y tour
        ant.distance += this.distances[ant.currentNode][nextNode];
        ant.tour.push(nextNode);
        ant.visited.add(nextNode);
        ant.currentNode = nextNode;
    }
    
    // Actualizar feromonas después de que todas las hormigas completen el recorrido
    updatePheromones() {
        const { rho, Q } = this.params;
        const n = this.numCities;
        
        // Evaporación
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                this.pheromones[i][j] *= rho;
            }
        }
        
        // Depositar feromonas de cada hormiga
        for (const ant of this.ants) {
            if (ant.completed && ant.distance > 0) {
                const delta = Q / ant.distance;
                
                for (let i = 0; i < ant.tour.length - 1; i++) {
                    const from = ant.tour[i];
                    const to = ant.tour[i + 1];
                    this.pheromones[from][to] += delta;
                    this.pheromones[to][from] += delta; // Grafo no dirigido
                }
            }
        }
        
        // Aplicar límites mínimo y máximo para evitar estancamiento
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (this.pheromones[i][j] < this.tauMin) {
                    this.pheromones[i][j] = this.tauMin;
                }
                if (this.pheromones[i][j] > this.tauMax) {
                    this.pheromones[i][j] = this.tauMax;
                }
            }
        }
    }
    
    // Actualizar mejor solución
    updateBestSolution() {
        for (const ant of this.ants) {
            if (ant.completed && ant.distance < this.bestDistance) {
                this.bestDistance = ant.distance;
                this.bestTour = [...ant.tour];
                this.bestIteration = this.iteration;
            }
        }
    }
    
    // Verificar si todas las hormigas completaron el recorrido
    allAntsCompleted() {
        return this.ants.every(ant => ant.completed);
    }
    
    // Iniciar nueva iteración
    newIteration() {
        this.iteration++;
        this.createAnts();
        this.currentAnt = 0;
    }
    
    // Ejecutar un paso del algoritmo (mover una hormiga)
    step() {
        // Inicializar hormigas en la primera llamada
        if (!this.initialized) {
            this.createAnts();
            this.initialized = true;
        }
        
        // Si todas las hormigas terminaron, actualizar feromonas y empezar nueva iteración
        if (this.allAntsCompleted()) {
            this.updatePheromones();
            this.updateBestSolution();
            this.convergenceData.push({
                iteration: this.iteration,
                bestDistance: this.bestDistance,
                avgDistance: this.getAverageDistance()
            });
            
            if (this.iteration < this.params.maxIterations) {
                this.newIteration();
            } else {
                return false; // Algoritmo terminado
            }
        }
        
        // Buscar una hormiga que no haya completado y moverla
        let attempts = 0;
        while (attempts < this.params.numAnts) {
            const ant = this.ants[this.currentAnt];
            
            if (!ant.completed) {
                this.moveAnt(ant);
                
                // Si completó con este movimiento, pasar a la siguiente
                if (ant.completed) {
                    this.currentAnt = (this.currentAnt + 1) % this.params.numAnts;
                }
                break;
            } else {
                // Esta hormiga ya completó, pasar a la siguiente
                this.currentAnt = (this.currentAnt + 1) % this.params.numAnts;
                attempts++;
            }
        }
        
        return true; // Continuar
    }
    
    // Obtener distancia promedio de todas las hormigas
    getAverageDistance() {
        const completed = this.ants.filter(ant => ant.completed);
        if (completed.length === 0) return 0;
        const sum = completed.reduce((acc, ant) => acc + ant.distance, 0);
        return sum / completed.length;
    }
    
    // Obtener estado actual
    getState() {
        return {
            iteration: this.iteration,
            ants: this.ants,
            currentAnt: this.currentAnt,
            pheromones: this.pheromones,
            bestTour: this.bestTour,
            bestDistance: this.bestDistance,
            bestIteration: this.bestIteration,
            convergenceData: this.convergenceData
        };
    }
}
