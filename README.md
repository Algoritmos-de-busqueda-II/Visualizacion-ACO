# ACO Visualization - Optimización por Colonia de Hormigas

Visualización interactiva del algoritmo ACO (Ant Colony Optimization) para el problema del viajante (TSP).

## Características

- ✅ Implementación del algoritmo ACO siguiendo las diapositivas del curso
- 🎨 Visualización paso a paso del recorrido de las hormigas
- 📊 Gráfico de convergencia en tiempo real
- 🔧 Configuración completa de parámetros del algoritmo
- 👁️ Dos modos de visualización:
  - **Vista General**: Muestra todas las hormigas y el estado global de feromonas
  - **Vista Individual**: Sigue el recorrido de una hormiga específica
- 📁 Carga de instancias TSP desde archivo
- 🐜 Visualización de feromonas en tiempo real

## Uso

### 1. Abrir la visualización

Simplemente abre el archivo `index.html` en tu navegador web.

### 2. Configurar parámetros

En el panel izquierdo puedes configurar:

- **Instancia TSP**: Selecciona el ejemplo o carga un archivo .tsp
- **Número de hormigas**: Cantidad de hormigas en la colonia (recomendado: 10-20)
- **Iteraciones máximas**: Número de iteraciones del algoritmo (recomendado: 50-200)
- **ρ (rho)**: Coeficiente de evaporación (0-1). Valor recomendado: 0.9
  - (1-ρ) indica el % de evaporación
- **α (alpha)**: Influencia de la feromona (0-5). Valor recomendado: 0.5
  - Mayor α = más peso a caminos con feromona
- **β (beta)**: Influencia de la distancia (0-5). Valor recomendado: 1.0
  - Mayor β = más peso a caminos cortos
- **Q**: Constante para cálculo de feromona. Valor recomendado: 1

### 3. Ejecutar el algoritmo

- **Iniciar ACO**: Comienza la ejecución automática
- **Pausar**: Pausa la ejecución
- **Paso a Paso**: Ejecuta el algoritmo paso por paso
- **Reiniciar**: Reinicia todo el proceso

### 4. Modos de visualización

#### Vista General
Muestra:
- Todas las aristas del grafo con intensidad según la feromona
- El mejor tour encontrado (en rojo)
- Todas las hormigas activas

#### Vista Individual
Permite seguir una hormiga específica y ver:
- Su recorrido actual
- Nodos visitados (resaltados en verde)
- Información detallada de su estado

## Algoritmo ACO

El algoritmo implementa las siguientes características según las diapositivas:

### Probabilidad de transición
```
p_ij^k = (τ_ij^α * η_ij^β) / Σ(τ_il^α * η_il^β)
```
Donde:
- τ_ij: Feromona en la arista (i,j)
- η_ij: Visibilidad = 1/distancia_ij
- α, β: Parámetros de control

### Actualización de feromonas
```
τ_ij = ρ * τ_ij + Σ(Δτ_ij^k)
```
Donde:
- ρ: Coeficiente de evaporación
- Δτ_ij^k = Q / L_k (L_k = longitud del tour de la hormiga k)

### Algoritmo de la ruleta
Se usa para seleccionar el siguiente nodo según las probabilidades calculadas.

## Cargar instancias TSP

Puedes cargar archivos en formato TSPLIB:
- Selecciona "Cargar archivo TSP" en el selector
- El archivo debe tener formato estándar con sección NODE_COORD_SECTION
- Están disponibles instancias en:
  - `instances/small/`: Instancias pequeñas (48-100 nodos)
  - `instances/large/`: Instancias grandes (280+ nodos)
  - `instances/ejemplo15.tsp`: Ejemplo pequeño de 15 nodos

## Estadísticas

El panel muestra en tiempo real:
- Iteración actual
- Mejor distancia encontrada
- Iteración donde se encontró la mejor solución
- Tiempo transcurrido
- Estado actual del algoritmo
- Gráfico de convergencia

## Configuraciones recomendadas

### Configuración básica (rápida)
- Hormigas: 10
- Iteraciones: 50
- ρ = 0.9, α = 0.5, β = 1.0, Q = 1

### Configuración exploratoria
- Hormigas: 20
- Iteraciones: 100
- ρ = 0.8 (más evaporación = más exploración)
- α = 0.3, β = 1.5 (más peso a distancia)

### Configuración intensiva
- Hormigas: 15
- Iteraciones: 200
- ρ = 0.95 (menos evaporación = más explotación)
- α = 1.0, β = 0.5 (más peso a feromona)

## Estructura del proyecto

```
ACO-Visualization/
├── index.html              # Página principal
├── style.css              # Estilos
├── aco.js                 # Implementación del algoritmo ACO
├── visualization.js       # Visualización del grafo
├── main.js                # Controlador principal
├── instances/             # Instancias TSP
│   ├── ejemplo15.tsp     # Ejemplo 15 nodos
│   ├── small/            # Instancias pequeñas
│   └── large/            # Instancias grandes
└── README.md             # Este archivo
```

## Tecnologías

- HTML5 Canvas para visualización
- JavaScript vanilla (sin dependencias)
- CSS3 para estilos


## Referencias

- Dorigo, M. (1992). Optimization, learning and natural algorithms. PhD thesis, Politecnico di Milano, Italy.
- Dorigo, M., Maniezzo, V., & Colorni, A. (1996). Ant system: optimization by a colony of cooperating agents. IEEE transactions on systems, man, and cybernetics, part b (cybernetics), 26(1), 29-41.
-  Implementación basada en: Tema 10: Optimización por Colonia de Hormigas. Algoritmos de Búsqueda II J.M. Colmenar
