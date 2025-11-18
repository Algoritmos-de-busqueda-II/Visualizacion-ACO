// ACO para el problema de la mochila 0/1
class ACOKnapsack {
    constructor(items, capacity, params) {
        this.items = items; // Array de {value, weight, id}
        this.capacity = capacity;
        this.numItems = items.length;
        
        // Parámetros ACO
        this.numAnts = params.numAnts || 10;
        this.maxIterations = params.maxIterations || 100;
        this.rho = params.rho || 0.5; // evaporación
        this.alpha = params.alpha || 1.0; // influencia feromona
        this.beta = params.beta || 3.0; // influencia heurística
        this.Q = params.Q || 100;
        
        // Límites de feromona
        this.tauMin = 0.01;
        this.tauMax = 10.0;
        
        // Matriz de feromonas (para cada item: [seleccionar, no_seleccionar])
        this.pheromones = Array(this.numItems).fill(null).map(() => [1.0, 1.0]);
        
        // Información heurística (ratio valor/peso)
        this.heuristic = items.map(item => item.value / item.weight);
        
        // Hormigas y soluciones
        this.ants = [];
        this.bestSolution = null;
        this.bestValue = 0;
        this.bestIteration = 0;
        
        // Control de iteraciones
        this.currentIteration = 0;
        this.currentAnt = 0;
        this.currentStep = 0;
        
        // Historial
        this.history = {
            bestValues: [],
            avgValues: []
        };
        
        this.initializeAnts();
    }
    
    initializeAnts() {
        this.ants = Array(this.numAnts).fill(null).map((_, id) => ({
            id: id,
            solution: Array(this.numItems).fill(false),
            value: 0,
            weight: 0,
            currentItem: 0,
            completed: false
        }));
    }
    
    reset() {
        this.pheromones = Array(this.numItems).fill(null).map(() => [1.0, 1.0]);
        this.bestSolution = null;
        this.bestValue = 0;
        this.bestIteration = 0;
        this.currentIteration = 0;
        this.currentAnt = 0;
        this.currentStep = 0;
        this.history = {
            bestValues: [],
            avgValues: []
        };
        this.initializeAnts();
    }
    
    // Construir solución para una hormiga
    constructSolution(ant) {
        ant.solution = Array(this.numItems).fill(false);
        ant.value = 0;
        ant.weight = 0;
        
        // Crear array de índices y barajarlo (shuffle) para recorrer items en orden aleatorio
        const itemIndices = Array(this.numItems).fill(0).map((_, i) => i);
        // Fisher-Yates shuffle
        for (let i = itemIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [itemIndices[i], itemIndices[j]] = [itemIndices[j], itemIndices[i]];
        }
        
        for (let idx = 0; idx < this.numItems; idx++) {
            const i = itemIndices[idx]; // Usar índice aleatorio
            ant.currentItem = i;
            
            const item = this.items[i];
            
            // Verificar si el item cabe en la mochila
            if (ant.weight + item.weight <= this.capacity) {
                // Calcular probabilidad de selección
                const prob = this.calculateSelectionProbability(i, ant);
                
                // Decidir si incluir el item
                if (Math.random() < prob) {
                    ant.solution[i] = true;
                    ant.value += item.value;
                    ant.weight += item.weight;
                }
            }
        }
        
        ant.completed = true;
        return ant;
    }
    
    // Calcular probabilidad de seleccionar un item
    calculateSelectionProbability(itemIndex, ant) {
        const item = this.items[itemIndex];
        
        // Si no cabe, probabilidad 0
        if (ant.weight + item.weight > this.capacity) {
            return 0;
        }
        
        // Feromona para seleccionar el item
        const tau = this.pheromones[itemIndex][1]; // seleccionar
        const tauNot = this.pheromones[itemIndex][0]; // no seleccionar
        
        // Información heurística (ratio valor/peso)
        const eta = this.heuristic[itemIndex];
        
        // Probabilidad según fórmula ACO
        const numerator = Math.pow(tau, this.alpha) * Math.pow(eta, this.beta);
        const denominator = numerator + Math.pow(tauNot, this.alpha);
        
        return denominator > 0 ? numerator / denominator : 0.5;
    }
    
    // Paso de construcción para animación
    step() {
        if (this.currentIteration >= this.maxIterations) {
            return false; // Terminado
        }
        
        // Si todas las hormigas completaron su solución
        if (this.currentAnt >= this.numAnts) {
            this.updatePheromones();
            this.currentIteration++;
            this.currentAnt = 0;
            this.currentStep = 0;
            
            // Registrar estadísticas
            const avgValue = this.ants.reduce((sum, ant) => sum + ant.value, 0) / this.numAnts;
            this.history.bestValues.push(this.bestValue);
            this.history.avgValues.push(avgValue);
            
            // Reiniciar hormigas para siguiente iteración
            if (this.currentIteration < this.maxIterations) {
                this.initializeAnts();
            }
            
            return true;
        }
        
        const ant = this.ants[this.currentAnt];
        
        // Si la hormiga actual no ha terminado
        if (!ant.completed) {
            if (this.currentStep < this.numItems) {
                const item = this.items[this.currentStep];
                
                // Verificar si el item cabe
                if (ant.weight + item.weight <= this.capacity) {
                    const prob = this.calculateSelectionProbability(this.currentStep, ant);
                    
                    if (Math.random() < prob) {
                        ant.solution[this.currentStep] = true;
                        ant.value += item.value;
                        ant.weight += item.weight;
                    }
                }
                
                this.currentStep++;
            } else {
                // Hormiga completó su solución
                ant.completed = true;
                
                // Verificar si es mejor solución
                if (ant.value > this.bestValue) {
                    this.bestValue = ant.value;
                    this.bestSolution = [...ant.solution];
                    this.bestIteration = this.currentIteration;
                }
                
                this.currentAnt++;
                this.currentStep = 0;
            }
        } else {
            this.currentAnt++;
            this.currentStep = 0;
        }
        
        return true;
    }
    
    // Actualizar feromonas
    updatePheromones() {
        // Evaporación
        for (let i = 0; i < this.numItems; i++) {
            this.pheromones[i][0] *= this.rho; // no seleccionar
            this.pheromones[i][1] *= this.rho; // seleccionar
        }
        
        // Depositar feromona de cada hormiga
        for (const ant of this.ants) {
            const delta = this.Q / (1 + (this.capacity - ant.weight)); // Penalizar soluciones con mucho espacio sin usar
            
            for (let i = 0; i < this.numItems; i++) {
                if (ant.solution[i]) {
                    this.pheromones[i][1] += delta;
                } else {
                    this.pheromones[i][0] += delta * 0.1; // Menor depósito en no seleccionar
                }
            }
        }
        
        // Refuerzo elitista: mejor solución deposita más feromona
        if (this.bestSolution) {
            const eliteDelta = this.Q * 2;
            for (let i = 0; i < this.numItems; i++) {
                if (this.bestSolution[i]) {
                    this.pheromones[i][1] += eliteDelta;
                }
            }
        }
        
        // Aplicar límites
        for (let i = 0; i < this.numItems; i++) {
            this.pheromones[i][0] = Math.max(this.tauMin, Math.min(this.tauMax, this.pheromones[i][0]));
            this.pheromones[i][1] = Math.max(this.tauMin, Math.min(this.tauMax, this.pheromones[i][1]));
        }
    }
    
    // Ejecutar algoritmo completo (sin animación)
    run() {
        for (let iter = 0; iter < this.maxIterations; iter++) {
            this.currentIteration = iter;
            
            // Construir soluciones
            for (let a = 0; a < this.numAnts; a++) {
                this.constructSolution(this.ants[a]);
                
                // Actualizar mejor solución
                if (this.ants[a].value > this.bestValue) {
                    this.bestValue = this.ants[a].value;
                    this.bestSolution = [...this.ants[a].solution];
                    this.bestIteration = iter;
                }
            }
            
            // Actualizar feromonas
            this.updatePheromones();
            
            // Estadísticas
            const avgValue = this.ants.reduce((sum, ant) => sum + ant.value, 0) / this.numAnts;
            this.history.bestValues.push(this.bestValue);
            this.history.avgValues.push(avgValue);
            
            // Reiniciar hormigas
            if (iter < this.maxIterations - 1) {
                this.initializeAnts();
            }
        }
        
        return {
            solution: this.bestSolution,
            value: this.bestValue,
            iteration: this.bestIteration
        };
    }
}
