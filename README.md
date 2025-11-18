# ACO Visualization - Optimización por Colonia de Hormigas

Visualización interactiva del algoritmo ACO (Ant Colony Optimization) para dos problemas de optimización combinatoria:
- 🗺️ **Traveling Salesman Problem (TSP)** - Problema del Viajante
- 🎒 **0/1 Knapsack Problem** - Problema de la Mochila

## 📑 Tabla de Contenidos

- [Características](#características)
- [Uso](#uso)
  - [Selector de Problemas](#selector-de-problemas)
  - [Problema del Viajante (TSP)](#problema-del-viajante-tsp)
  - [Problema de la Mochila (Knapsack)](#problema-de-la-mochila-knapsack)
- [Algoritmo ACO](#algoritmo-aco)
  - [ACO para TSP](#aco-para-tsp)
  - [ACO para Knapsack](#aco-para-knapsack)
- [Cargar Instancias](#cargar-instancias)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Tecnologías](#tecnologías)
- [Referencias](#referencias)

## Características

- ✅ Implementación del algoritmo ACO siguiendo las diapositivas del curso
- 🗺️ **TSP**: Problema del Viajante con visualización de grafo y feromonas
- 🎒 **Knapsack**: Problema de la Mochila 0/1 con visualización de items y selección
- 🎨 Visualización paso a paso del proceso de construcción de soluciones
- 📊 Gráfico de convergencia en tiempo real
- 🔧 Configuración completa de parámetros del algoritmo
- 👁️ Dos modos de visualización:
  - **Vista General**: Muestra el estado global del algoritmo
  - **Vista Individual**: Sigue el proceso de una hormiga específica
- 📁 Carga de instancias desde archivo (cualquier formato)
- 💾 Descarga de instancias de ejemplo con el formato correcto
- 🐜 Visualización de feromonas en tiempo real

## Uso

### Selector de Problemas

![Selector de problemas](./docs/images/selector.png)
*[PLACEHOLDER: Añadir captura del selector de problemas]*

Al abrir `index.html` verás un selector con dos opciones:
- **TSP (Traveling Salesman Problem)**: Para resolver el problema del viajante
- **Knapsack (0/1 Knapsack)**: Para resolver el problema de la mochila

### Problema del Viajante (TSP)

![TSP Visualization](./docs/images/tsp.png)
*[PLACEHOLDER: Añadir captura de la visualización TSP]*

#### Configurar parámetros

- **Instancia TSP**: Selecciona el ejemplo o carga un archivo
  - Botón **💾 Formato ejemplo**: Descarga un archivo de ejemplo con el formato correcto
- **Número de hormigas**: Cantidad de hormigas en la colonia (1-50)
- **Iteraciones máximas**: Número de iteraciones del algoritmo (1-500)
- **ρ (rho)**: Coeficiente de persistencia de feromona (0-1)
  - Evaporación = (1-ρ) × 100%
- **α (alpha)**: Influencia de la feromona (0-5)
- **β (beta)**: Influencia de la distancia/heurística (0-5)
- **Q**: Constante para cálculo de feromona (>0)

#### Modos de visualización

**Vista General**
- Todas las aristas del grafo con intensidad según la feromona
- El mejor tour encontrado (en rojo)
- Valores de feromona opcionales

**Vista Individual**
- Recorrido de una hormiga específica
- Nodos visitados (resaltados)
- Información detallada de su estado

### Problema de la Mochila (Knapsack)

![Knapsack Visualization](./docs/images/knapsack.png)
*[PLACEHOLDER: Añadir captura de la visualización Knapsack]*

#### Configurar parámetros

- **Instancia de Mochila**: Selecciona el ejemplo o carga un archivo
  - Botón **💾 Formato ejemplo**: Descarga un archivo de ejemplo con el formato correcto
  - Formato: Primera línea `numItems capacidad`, luego líneas `valor peso`
- **Número de hormigas**: Cantidad de hormigas (1-50)
- **Iteraciones máximas**: Número de iteraciones (1-500)
- **ρ (rho)**: Coeficiente de persistencia de feromona (0-1)
- **α (alpha)**: Influencia de la feromona (0-5)
- **β (beta)**: Influencia de la heurística (valor/peso) (0-5)
  - Recomendado: β = 3.0 para dar más peso a la heurística
- **Q**: Constante para cálculo de feromona (>0)

#### Visualización de items

- **Grid adaptativo**: 4 o 5 columnas según el número de items
- **Código de colores**: 
  - Gris oscuro: Item no seleccionado, poca feromona
  - Gris claro: Item no seleccionado, alta feromona
  - Verde: Item seleccionado por la hormiga
- **Canvas scrollable**: Permite visualizar instancias con 100+ items
- **Información por item**: Valor, Peso, Ratio (valor/peso), Feromona

#### Modos de visualización

**Vista General**
- Todos los items con su estado de feromona
- Capacidad de la mochila (barra de uso)
- Mejor solución encontrada con items seleccionados

**Vista Individual**
- Items seleccionados por una hormiga específica
- Peso acumulado y capacidad disponible
- Valor total de la solución

## Algoritmo ACO

### ACO para TSP

El algoritmo implementa las siguientes características según las diapositivas:

#### Probabilidad de transición
```
p_ij^k = (τ_ij^α * η_ij^β) / Σ(τ_il^α * η_il^β)
```
Donde:
- τ_ij: Feromona en la arista (i,j)
- η_ij: Visibilidad = 1/distancia_ij
- α, β: Parámetros de control

#### Actualización de feromonas
```
τ_ij = ρ * τ_ij + Σ(Δτ_ij^k)
```
Donde:
- ρ: Coeficiente de persistencia (evaporación = 1-ρ)
- Δτ_ij^k = Q / L_k (L_k = longitud del tour de la hormiga k)

#### Selección de nodo
Se usa el algoritmo de la ruleta para seleccionar el siguiente nodo según las probabilidades calculadas.

### ACO para Knapsack

El algoritmo para el problema de la mochila 0/1 implementa:

#### Matriz de feromonas
Cada item i tiene dos valores de feromona:
- τ_i[0]: Feromona para **NO seleccionar** el item
- τ_i[1]: Feromona para **seleccionar** el item

#### Probabilidad de selección
```
p_i = (τ_i[1]^α * η_i^β) / (τ_i[1]^α * η_i^β + τ_i[0]^α)
```
Donde:
- τ_i[1]: Feromona para seleccionar el item i
- τ_i[0]: Feromona para no seleccionar el item i
- η_i: Heurística = valor_i / peso_i (ratio valor/peso)
- α, β: Parámetros de control

#### Construcción de soluciones
- Los items se **recorren en orden aleatorio** (Fisher-Yates shuffle) para evitar sesgo
- Cada hormiga decide probabilísticamente si incluir cada item
- Se verifica la restricción de capacidad antes de cada selección

#### Actualización de feromonas
```
τ_i[j] = ρ * τ_i[j] + Σ(Δτ_i[j]^k)
```
Donde:
- Δτ_i[j]^k = Q / (1 + capacidad - peso_usado) si el item fue seleccionado
- Se aplica refuerzo elitista (×2) a la mejor solución global

## Cargar Instancias

### Formato TSP (TSPLIB)

Puedes cargar archivos en formato TSPLIB estándar:

```
NAME: ejemplo_10_nodos
TYPE: TSP
DIMENSION: 10
EDGE_WEIGHT_TYPE: EUC_2D
NODE_COORD_SECTION
1 100 200
2 300 150
...
EOF
```

**Instancias disponibles:**
- `instances-tsp/ejemplo15.tsp`: Ejemplo pequeño de 15 nodos
- `instances-tsp/small/`: Instancias pequeñas (48-100 nodos)
- `instances-tsp/large/`: Instancias grandes (100-575 nodos)

### Formato Knapsack

Formato simple de texto:

```
10 269
54 10
95 20
36 30
...
```

- **Primera línea**: `numItems capacidad`
- **Siguientes líneas**: `valor peso` (uno por item)

**Instancias disponibles:**
- `instances-01-KP/low-dimensional/`: Instancias pequeñas (4-23 items)
- `instances-01-KP/large_scale/`: Instancias grandes (100-10000 items)

### Descarga de ejemplos

Ambas páginas incluyen un botón **💾 Formato ejemplo** que descarga un archivo de ejemplo con el formato correcto para que puedas usarlo como plantilla.

## Estructura del Proyecto

```
ACO-Visualization/
├── index.html                    # Selector de problemas
├── tsp.html                      # Página TSP
├── knapsack.html                 # Página Knapsack
├── tsp-aco-full.js              # Algoritmo ACO para TSP
├── tsp-visualization-full.js    # Visualización TSP
├── tsp-main-full.js             # Controlador TSP
├── tsp-style-full.css           # Estilos TSP
├── aco-knapsack.js              # Algoritmo ACO para Knapsack
├── visualization-knapsack.js    # Visualización Knapsack
├── main-knapsack.js             # Controlador Knapsack
├── knapsack-style.css           # Estilos Knapsack
├── instances-tsp/               # Instancias TSP
│   ├── ejemplo15.tsp           
│   ├── small/                   # 48-100 nodos
│   └── large/                   # 100-575 nodos
├── instances-01-KP/             # Instancias Knapsack
│   ├── low-dimensional/         # 4-23 items
│   └── large_scale/             # 100-10000 items
└── README.md                    # Este archivo
```

## Tecnologías

- HTML5 Canvas para visualización
- JavaScript vanilla (sin dependencias)
- CSS3 para estilos


## Referencias

- Dorigo, M. (1992). Optimization, learning and natural algorithms. PhD thesis, Politecnico di Milano, Italy.
- Dorigo, M., Maniezzo, V., & Colorni, A. (1996). Ant system: optimization by a colony of cooperating agents. IEEE transactions on systems, man, and cybernetics, part b (cybernetics), 26(1), 29-41.
- Implementación basada en: Tema 10: Optimización por Colonia de Hormigas. Algoritmos de Búsqueda II - J.M. Colmenar
- Instancias Knapsack de: Pisinger, D. (2005). Where are the hard knapsack problems? Computers & Operations Research, 32(9), 2271-2284.

---

**Desarrollado por Sergio Cavero para la asignatura Algoritmos de Búsqueda II (Grado en Inteligencia Artificial - URJC)**
