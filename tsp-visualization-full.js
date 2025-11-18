// Clase de visualización
class Visualization {
    constructor(canvasId, chartCanvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chartCanvas = document.getElementById(chartCanvasId);
        this.chartCtx = this.chartCanvas.getContext('2d');
        
        this.cities = [];
        this.aco = null;
        this.viewMode = 'general';
        this.selectedAnt = 0;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        const chartRect = this.chartCanvas.getBoundingClientRect();
        this.chartCanvas.width = chartRect.width;
        this.chartCanvas.height = chartRect.height;
    }
    
    setCities(cities) {
        this.cities = cities;
        this.normalizedCities = this.normalizeCities(cities);
    }
    
    setACO(aco) {
        this.aco = aco;
    }
    
    setViewMode(mode) {
        this.viewMode = mode;
    }
    
    setSelectedAnt(antId) {
        this.selectedAnt = antId;
    }
    
    // Normalizar coordenadas de ciudades al tamaño del canvas
    normalizeCities(cities) {
        const padding = 50;
        const width = this.canvas.width - 2 * padding;
        const height = this.canvas.height - 2 * padding;
        
        // Encontrar límites
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        cities.forEach(city => {
            minX = Math.min(minX, city.x);
            maxX = Math.max(maxX, city.x);
            minY = Math.min(minY, city.y);
            maxY = Math.max(maxY, city.y);
        });
        
        const rangeX = maxX - minX || 1;
        const rangeY = maxY - minY || 1;
        
        // Normalizar
        return cities.map((city, i) => ({
            id: i,
            x: padding + ((city.x - minX) / rangeX) * width,
            y: padding + ((city.y - minY) / rangeY) * height,
            originalX: city.x,
            originalY: city.y,
            name: city.name || `${i + 1}`
        }));
    }
    
    // Dibujar el estado actual
    draw() {
        this.clear();
        
        if (!this.aco) {
            // Solo dibujar las ciudades si no hay ACO activo
            this.drawCities();
            return;
        }
        
        const state = this.aco.getState();
        
        if (this.viewMode === 'general') {
            this.drawGeneralView(state);
        } else {
            this.drawIndividualView(state);
        }
        
        this.drawChart(state.convergenceData);
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Vista general: mostrar todas las feromonas y hormigas
    drawGeneralView(state) {
        // Dibujar todas las aristas con intensidad de feromona
        this.drawPheromones(state.pheromones);
        
        // Dibujar mejor tour si existe
        if (state.bestTour) {
            this.drawTour(state.bestTour, '#ff0000', 3);
        }
        
        // Dibujar ciudades
        this.drawCities();
        
        // Dibujar todas las hormigas
        state.ants.forEach((ant, i) => {
            if (!ant.completed && ant.tour.length > 0) {
                const color = `hsl(${(i * 360) / state.ants.length}, 70%, 50%)`;
                this.drawAnt(ant.currentNode, color, i === state.currentAnt);
            }
        });
    }
    
    // Vista individual: mostrar una hormiga específica
    drawIndividualView(state) {
        const ant = state.ants[this.selectedAnt];
        if (!ant) return;
        
        // Dibujar aristas con feromona (atenuadas)
        this.drawPheromones(state.pheromones, 0.3);
        
        // Dibujar ciudades
        this.drawCities();
        
        // Resaltar ciudades visitadas
        ant.visited.forEach(cityId => {
            const city = this.normalizedCities[cityId];
            this.ctx.beginPath();
            this.ctx.arc(city.x, city.y, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(100, 200, 100, 0.5)';
            this.ctx.fill();
        });
        
        // Dibujar tour de la hormiga
        if (ant.tour.length > 1) {
            this.ctx.strokeStyle = '#ff6b6b';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            
            for (let i = 0; i < ant.tour.length; i++) {
                const city = this.normalizedCities[ant.tour[i]];
                if (i === 0) {
                    this.ctx.moveTo(city.x, city.y);
                } else {
                    this.ctx.lineTo(city.x, city.y);
                }
            }
            this.ctx.stroke();
        }
        
        // Dibujar hormiga actual
        this.drawAnt(ant.currentNode, '#ff6b6b', true);
        
        // Mostrar información de la hormiga
        this.drawAntInfo(ant);
    }
    
    // Dibujar feromonas
    drawPheromones(pheromones, opacity = 1.0) {
        const n = this.normalizedCities.length;
        const showValues = document.getElementById('showPheromoneValues')?.checked || false;
        
        // Encontrar max feromona para normalizar
        let maxPheromone = 0;
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                maxPheromone = Math.max(maxPheromone, pheromones[i][j]);
            }
        }
        
        // Dibujar aristas
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const intensity = pheromones[i][j] / maxPheromone;
                const alpha = Math.max(0.1, intensity) * opacity;
                const width = 1 + intensity * 3;
                
                const cityA = this.normalizedCities[i];
                const cityB = this.normalizedCities[j];
                
                // Color: de gris a verde según intensidad
                const r = Math.floor(100 * (1 - intensity));
                const g = Math.floor(100 + 155 * intensity);
                const b = 50;
                
                this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                this.ctx.lineWidth = width;
                this.ctx.beginPath();
                this.ctx.moveTo(cityA.x, cityA.y);
                this.ctx.lineTo(cityB.x, cityB.y);
                this.ctx.stroke();
                
                // Mostrar valor de feromona si está activado
                if (showValues) {
                    const midX = (cityA.x + cityB.x) / 2;
                    const midY = (cityA.y + cityB.y) / 2;
                    const pheromoneValue = pheromones[i][j].toFixed(2);
                    
                    // Fondo para el texto
                    this.ctx.font = '10px Arial';
                    const textWidth = this.ctx.measureText(pheromoneValue).width;
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    this.ctx.fillRect(midX - textWidth/2 - 2, midY - 7, textWidth + 4, 12);
                    
                    // Texto del valor
                    this.ctx.fillStyle = '#333';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(pheromoneValue, midX, midY);
                }
            }
        }
    }
    
    // Dibujar un tour específico
    drawTour(tour, color, lineWidth) {
        if (tour.length < 2) return;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        
        for (let i = 0; i < tour.length; i++) {
            const city = this.normalizedCities[tour[i]];
            if (i === 0) {
                this.ctx.moveTo(city.x, city.y);
            } else {
                this.ctx.lineTo(city.x, city.y);
            }
        }
        this.ctx.stroke();
    }
    
    // Dibujar ciudades
    drawCities() {
        this.normalizedCities.forEach((city, i) => {
            // Círculo de la ciudad
            this.ctx.beginPath();
            this.ctx.arc(city.x, city.y, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = '#333';
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Etiqueta
            this.ctx.fillStyle = '#333';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(city.name, city.x, city.y - 12);
        });
    }
    
    // Dibujar una hormiga
    drawAnt(nodeId, color, isCurrent) {
        const city = this.normalizedCities[nodeId];
        
        // Efecto pulsante para la hormiga actual
        const radius = isCurrent ? 10 : 8;
        
        this.ctx.beginPath();
        this.ctx.arc(city.x, city.y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        
        if (isCurrent) {
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Halo
            this.ctx.beginPath();
            this.ctx.arc(city.x, city.y, radius + 5, 0, Math.PI * 2);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.5;
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }
    }
    
    // Dibujar información de hormiga en vista individual
    drawAntInfo(ant) {
        const padding = 10;
        const boxHeight = 80;
        const boxWidth = 250;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.fillRect(padding, padding, boxWidth, boxHeight);
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(padding, padding, boxWidth, boxHeight);
        
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Hormiga ${ant.id + 1}`, padding + 10, padding + 20);
        
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Nodos visitados: ${ant.visited.size}/${this.cities.length}`, padding + 10, padding + 40);
        this.ctx.fillText(`Distancia actual: ${ant.distance.toFixed(2)}`, padding + 10, padding + 55);
        this.ctx.fillText(`Estado: ${ant.completed ? 'Completado' : 'En curso'}`, padding + 10, padding + 70);
    }
    
    // Dibujar gráfico de convergencia
    drawChart(convergenceData) {
        if (convergenceData.length === 0) return;
        
        const ctx = this.chartCtx;
        const width = this.chartCanvas.width;
        const height = this.chartCanvas.height;
        const paddingLeft = 60;
        const paddingRight = 20;
        const paddingTop = 40;
        const paddingBottom = 35;
        
        ctx.clearRect(0, 0, width, height);
        
        // Encontrar rangos (considerando tanto bestDistance como avgDistance)
        const maxIter = Math.max(...convergenceData.map(d => d.iteration));
        let minDist = Infinity;
        let maxDist = -Infinity;
        
        convergenceData.forEach(d => {
            minDist = Math.min(minDist, d.bestDistance, d.avgDistance);
            maxDist = Math.max(maxDist, d.bestDistance, d.avgDistance);
        });
        
        // Añadir un pequeño margen al rango para que los valores no toquen los bordes
        const margin = (maxDist - minDist) * 0.05 || 1;
        minDist -= margin;
        maxDist += margin;
        const range = maxDist - minDist;
        
        // Dibujar ejes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, paddingTop);
        ctx.lineTo(paddingLeft, height - paddingBottom);
        ctx.lineTo(width - paddingRight, height - paddingBottom);
        ctx.stroke();
        
        // Dibujar distancia promedio primero (para que quede detrás)
        ctx.strokeStyle = '#0066cc';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        
        convergenceData.forEach((data, i) => {
            const x = paddingLeft + ((data.iteration / maxIter) * (width - paddingLeft - paddingRight));
            const y = height - paddingBottom - (((data.avgDistance - minDist) / range) * (height - paddingTop - paddingBottom));
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Dibujar mejor distancia (encima)
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        convergenceData.forEach((data, i) => {
            const x = paddingLeft + ((data.iteration / maxIter) * (width - paddingLeft - paddingRight));
            const y = height - paddingBottom - (((data.bestDistance - minDist) / range) * (height - paddingTop - paddingBottom));
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // Valores en el eje Y (Calidad/Distancia)
        ctx.fillStyle = '#333';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        const numYLabels = 5;
        for (let i = 0; i <= numYLabels; i++) {
            const value = minDist + (range * i / numYLabels);
            const y = height - paddingBottom - ((i / numYLabels) * (height - paddingTop - paddingBottom));
            ctx.fillText(value.toFixed(0), paddingLeft - 5, y);
        }
        
        // Valores en el eje X (Iteraciones)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const numXLabels = Math.min(10, maxIter);
        for (let i = 0; i <= numXLabels; i++) {
            const value = Math.round((maxIter * i / numXLabels));
            const x = paddingLeft + ((i / numXLabels) * (width - paddingLeft - paddingRight));
            ctx.fillText(value, x, height - paddingBottom + 5);
        }
        
        // Etiquetas de ejes
        ctx.font = 'bold 11px Arial';
        ctx.fillText('Iteración', width / 2, height - 5);
        
        ctx.save();
        ctx.translate(12, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Calidad (distancia)', 0, 0);
        ctx.restore();
        
        // Leyenda (movida más arriba y a la derecha)
        ctx.textAlign = 'left';
        ctx.font = '11px Arial';
        ctx.fillStyle = '#ff0000';
        ctx.fillText('— Mejor', width - 100, paddingTop - 20);
        ctx.fillStyle = '#0066cc';
        ctx.fillText('- - Promedio', width - 100, paddingTop - 5);
    }
}
