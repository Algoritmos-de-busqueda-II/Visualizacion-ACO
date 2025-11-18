// Visualización del problema de la mochila
class KnapsackVisualization {
    constructor(canvasId, chartCanvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chartCanvas = document.getElementById(chartCanvasId);
        this.chartCtx = this.chartCanvas.getContext('2d');
        
        this.aco = null;
        this.viewMode = 'general';
        this.selectedAnt = 0;
        this.showPheromoneValues = false;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        // Calcular altura necesaria según número de items
        if (this.aco) {
            const numItems = this.aco.numItems;
            let cols = 5;
            if (numItems % 4 === 0 || numItems % 4 < numItems % 5) {
                cols = 4;
            }
            const rows = Math.ceil(numItems / cols);
            const itemHeight = 80;
            const itemSpacing = 10;
            const padding = 40;
            const topSection = 120; // mochila + espacios
            
            const neededHeight = topSection + rows * (itemHeight + itemSpacing) + padding;
            this.canvas.height = Math.max(600, neededHeight);
        } else {
            this.canvas.height = 600;
        }
        
        this.canvas.width = this.canvas.clientWidth;
        this.chartCanvas.width = this.chartCanvas.clientWidth;
        this.chartCanvas.height = this.chartCanvas.clientHeight;
        
        if (this.aco) this.draw();
    }
    
    setACO(aco) {
        this.aco = aco;
        this.resizeCanvas(); // Recalcular altura
        this.draw();
    }
    
    draw() {
        if (!this.aco) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.viewMode === 'general') {
            this.drawGeneral();
        } else {
            this.drawIndividual();
        }
        
        this.drawChart();
    }
    
    drawGeneral() {
        const padding = 40;
        const canvasWidth = this.canvas.width - 2 * padding;
        const canvasHeight = this.canvas.height - 2 * padding;
        
        // Dibujar mochila (capacidad)
        this.drawKnapsackBar(padding, padding, canvasWidth, 40);
        
        // Dibujar items en formato de grilla (determinar columnas según número de items)
        const numItems = this.aco.numItems;
        let cols = 5;
        if (numItems % 4 === 0 || numItems % 4 < numItems % 5) {
            cols = 4;
        }
        
        const itemWidth = (canvasWidth - (cols - 1) * 10) / cols;
        const itemHeight = 80;
        const itemSpacing = 10;
        const startY = padding + 60;
        
        for (let i = 0; i < this.aco.numItems; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = padding + col * (itemWidth + itemSpacing);
            const y = startY + row * (itemHeight + itemSpacing);
            
            // Permitir dibujar fuera del canvas (se hará scroll)
            this.drawItem(i, x, y, itemWidth, itemHeight);
        }
    }
    
    drawIndividual() {
        const ant = this.aco.ants[this.selectedAnt];
        if (!ant) return;
        
        const padding = 40;
        const canvasWidth = this.canvas.width - 2 * padding;
        const canvasHeight = this.canvas.height - 2 * padding;
        
        // Título
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText(`Hormiga ${ant.id + 1}`, padding, padding - 10);
        
        // Dibujar mochila
        this.drawKnapsackBar(padding, padding, canvasWidth, 40, ant);
        
        // Dibujar items en formato de grilla (determinar columnas según número de items)
        const numItems = this.aco.numItems;
        let cols = 5;
        if (numItems % 4 === 0 || numItems % 4 < numItems % 5) {
            cols = 4;
        }
        
        const itemWidth = (canvasWidth - (cols - 1) * 10) / cols;
        const itemHeight = 80;
        const itemSpacing = 10;
        const startY = padding + 60;
        
        for (let i = 0; i < this.aco.numItems; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = padding + col * (itemWidth + itemSpacing);
            const y = startY + row * (itemHeight + itemSpacing);
            
            // Permitir dibujar fuera del canvas (se hará scroll)
            this.drawItem(i, x, y, itemWidth, itemHeight, ant);
        }
    }
    
    drawKnapsackBar(x, y, width, height, ant = null) {
        const capacity = this.aco.capacity;
        let usedWeight = 0;
        let usedValue = 0;
        
        if (ant) {
            usedWeight = ant.weight;
            usedValue = ant.value;
        } else if (this.aco.bestSolution) {
            for (let i = 0; i < this.aco.numItems; i++) {
                if (this.aco.bestSolution[i]) {
                    usedWeight += this.aco.items[i].weight;
                    usedValue += this.aco.items[i].value;
                }
            }
        }
        
        // Fondo
        this.ctx.fillStyle = '#e0e0e0';
        this.ctx.fillRect(x, y, width, height);
        
        // Capacidad usada
        const usedWidth = (usedWeight / capacity) * width;
        const gradient = this.ctx.createLinearGradient(x, y, x + usedWidth, y);
        gradient.addColorStop(0, '#4CAF50');
        gradient.addColorStop(1, '#45a049');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, usedWidth, height);
        
        // Borde
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Texto
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `Peso: ${usedWeight}/${capacity} | Valor: ${usedValue}`,
            x + width / 2,
            y + height / 2 + 5
        );
        this.ctx.textAlign = 'left';
    }
    
    drawItem(index, x, y, width, height, ant = null) {
        const item = this.aco.items[index];
        const isSelected = ant ? ant.solution[index] : 
                          (this.aco.bestSolution && this.aco.bestSolution[index]);
        const pheromone = this.aco.pheromones[index][1]; // feromona para seleccionar
        
        // Determinar color
        let color = '#ccc';
        if (isSelected) {
            if (ant) {
                color = '#4CAF50'; // Verde para hormiga actual
            } else {
                color = '#ff9800'; // Naranja para mejor solución
            }
        } else if (!ant) {
            // Intensidad según feromona
            const intensity = Math.min(255, Math.floor((pheromone / this.aco.tauMax) * 200 + 55));
            color = `rgb(${intensity}, ${intensity}, ${intensity})`;
        }
        
        // Dibujar rectángulo del item
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
        
        // Borde
        this.ctx.strokeStyle = isSelected ? '#333' : '#999';
        this.ctx.lineWidth = isSelected ? 3 : 1;
        this.ctx.strokeRect(x, y, width, height);
        
        // Determinar color del texto según el brillo del fondo
        // Si el fondo es oscuro (poca feromona), usar texto blanco
        const textColor = (!isSelected && !ant && pheromone < 2.0) ? '#fff' : '#333';
        
        // Información del item (centrada)
        this.ctx.fillStyle = textColor;
        this.ctx.font = 'bold 13px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Item ${item.id + 1}`, x + width / 2, y + 18);
        
        this.ctx.font = '11px Arial';
        this.ctx.fillText(`V: ${item.value}`, x + width / 2, y + 35);
        this.ctx.fillText(`P: ${item.weight}`, x + width / 2, y + 50);
        
        // Ratio valor/peso
        const ratio = (item.value / item.weight).toFixed(2);
        this.ctx.fillText(`R: ${ratio}`, x + width / 2, y + 65);
        
        // Mostrar feromona si está activado
        if (this.showPheromoneValues && !ant) {
            this.ctx.fillStyle = pheromone < 2.0 ? '#FFD700' : '#8B4513';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.fillText(`τ:${pheromone.toFixed(2)}`, x + width / 2, y + height - 5);
        }
        
        this.ctx.textAlign = 'left';
    }
    
    drawBestSolution(x, y) {
        if (!this.aco.bestSolution) {
            // Mostrar mensaje si aún no hay solución
            this.ctx.fillStyle = '#999';
            this.ctx.font = 'italic 14px Arial';
            this.ctx.fillText('Esperando mejor solución...', x, y + 20);
            return;
        }
        
        // Título
        this.ctx.fillStyle = '#8B4513';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText('Mejor Solución', x, y + 20);
        
        // Calcular totales
        let totalValue = 0;
        let totalWeight = 0;
        const selectedItems = [];
        
        for (let i = 0; i < this.aco.numItems; i++) {
            if (this.aco.bestSolution[i]) {
                totalValue += this.aco.items[i].value;
                totalWeight += this.aco.items[i].weight;
                selectedItems.push(i);
            }
        }
        
        // Mostrar estadísticas
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(`Valor Total: ${totalValue}`, x, y + 50);
        this.ctx.fillText(`Peso Total: ${totalWeight}/${this.aco.capacity}`, x, y + 70);
        this.ctx.fillText(`Items: ${selectedItems.length}`, x, y + 90);
        
        // Dibujar items seleccionados
        this.ctx.font = '12px Arial';
        let offsetY = 120;
        
        for (const i of selectedItems) {
            // Cuadrado de color
            this.ctx.fillStyle = '#ff9800';
            this.ctx.fillRect(x, y + offsetY - 10, 15, 15);
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, y + offsetY - 10, 15, 15);
            
            // Información del item
            this.ctx.fillStyle = '#333';
            const text = `#${i + 1}: v=${this.aco.items[i].value}, w=${this.aco.items[i].weight}`;
            this.ctx.fillText(text, x + 20, y + offsetY);
            
            offsetY += 20;
            
            // Evitar salirse del canvas
            if (y + offsetY > this.canvas.height - 50) {
                this.ctx.fillStyle = '#999';
                this.ctx.font = 'italic 11px Arial';
                this.ctx.fillText('...', x + 20, y + offsetY);
                break;
            }
        }
    }
    
    drawChart() {
        if (!this.aco || this.aco.history.bestValues.length === 0) return;
        
        const ctx = this.chartCtx;
        const width = this.chartCanvas.width;
        const height = this.chartCanvas.height;
        const padding = { left: 60, right: 20, top: 40, bottom: 35 };
        
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        ctx.clearRect(0, 0, width, height);
        
        // Fondo
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, width, height);
        
        const bestValues = this.aco.history.bestValues;
        const avgValues = this.aco.history.avgValues;
        
        if (bestValues.length === 0) return;
        
        // Calcular rango
        const allValues = [...bestValues, ...avgValues];
        const maxValue = Math.max(...allValues);
        const minValue = Math.min(...allValues);
        const range = maxValue - minValue;
        const yMin = minValue - range * 0.05;
        const yMax = maxValue + range * 0.05;
        
        // Dibujar ejes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, height - padding.bottom);
        ctx.lineTo(width - padding.right, height - padding.bottom);
        ctx.stroke();
        
        // Etiquetas
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Iteraciones', width / 2, height - 5);
        
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Valor Total', 0, 0);
        ctx.restore();
        
        // Dibujar líneas
        this.drawLine(ctx, bestValues, padding, chartWidth, chartHeight, yMin, yMax, '#ff9800', 'Mejor');
        this.drawLine(ctx, avgValues, padding, chartWidth, chartHeight, yMin, yMax, '#4CAF50', 'Promedio');
        
        // Leyenda
        this.drawLegend(ctx, padding, ['Mejor', 'Promedio'], ['#ff9800', '#4CAF50']);
    }
    
    drawLine(ctx, data, padding, chartWidth, chartHeight, yMin, yMax, color, label) {
        if (data.length === 0) return;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < data.length; i++) {
            const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
            const y = padding.top + chartHeight - ((data[i] - yMin) / (yMax - yMin || 1)) * chartHeight;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    }
    
    drawLegend(ctx, padding, labels, colors) {
        const x = padding.left + 20;
        const y = padding.top + 10;
        
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        
        for (let i = 0; i < labels.length; i++) {
            const offsetY = i * 20;
            
            ctx.fillStyle = colors[i];
            ctx.fillRect(x, y + offsetY, 20, 2);
            
            ctx.fillStyle = '#333';
            ctx.fillText(labels[i], x + 25, y + offsetY + 5);
        }
    }
    
    setViewMode(mode) {
        this.viewMode = mode;
        this.draw();
    }
    
    setSelectedAnt(antId) {
        this.selectedAnt = antId;
        this.draw();
    }
    
    setShowPheromoneValues(show) {
        this.showPheromoneValues = show;
        this.draw();
    }
}
