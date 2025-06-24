// charts.js - Gestión de gráficos y visualizaciones

class ChartManager {
    constructor() {
        this.categoryChart = null;
        this.trendChart = null;
        this.chartColors = {
            income: '#4CAF50',
            expense: '#f44336',
            categories: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40',
                '#FF6384',
                '#C9CBCF'
            ]
        };
    }

    // Inicializar gráficos
    initCharts() {
        this.initCategoryChart();
        this.initTrendChart();
    }

    // Gráfico de categorías (circular)
    initCategoryChart() {
        const ctx = document.getElementById('category-chart');
        if (!ctx) return;

        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: this.chartColors.categories,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Gráfico de tendencias (líneas)
    initTrendChart() {
        const ctx = document.getElementById('trend-chart');
        if (!ctx) return;

        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Ingresos',
                        data: [],
                        borderColor: this.chartColors.income,
                        backgroundColor: this.chartColors.income + '20',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Gastos',
                        data: [],
                        borderColor: this.chartColors.expense,
                        backgroundColor: this.chartColors.expense + '20',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += '$' + context.parsed.y.toFixed(2);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }

    // Actualizar gráfico de categorías
    updateCategoryChart(month = 'all') {
        if (!this.categoryChart) return;

        const categoryStats = storage.getCategoryStats('expense', month);
        const labels = [];
        const data = [];

        Object.entries(categoryStats).forEach(([categoryId, amount]) => {
            const categoryInfo = storage.getCategoryInfo(categoryId);
            if (categoryInfo) {
                labels.push(categoryInfo.name);
                data.push(amount);
            }
        });

        this.categoryChart.data.labels = labels;
        this.categoryChart.data.datasets[0].data = data;
        this.categoryChart.update();
    }

    // Actualizar gráfico de tendencias
    updateTrendChart() {
        if (!this.trendChart) return;

        const currentYear = new Date().getFullYear();
        const monthlyStats = storage.getMonthlyStats(currentYear);
        const months = [];
        const incomeData = [];
        const expenseData = [];

        // Nombres de meses en español
        const monthNames = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];

        Object.entries(monthlyStats).forEach(([month, stats]) => {
            const monthIndex = parseInt(month.split('-')[1]) - 1;
            months.push(monthNames[monthIndex]);
            incomeData.push(stats.income);
            expenseData.push(stats.expense);
        });

        this.trendChart.data.labels = months;
        this.trendChart.data.datasets[0].data = incomeData;
        this.trendChart.data.datasets[1].data = expenseData;
        this.trendChart.update();
    }

    // Actualizar resumen mensual
    updateMonthlySummary() {
        const summaryContainer = document.getElementById('monthly-summary');
        if (!summaryContainer) return;

        const currentMonth = new Date().toISOString().slice(0, 7);
        const transactions = storage.getFilteredTransactions('all', currentMonth);
        
        // Calcular estadísticas del mes
        let monthIncome = 0;
        let monthExpense = 0;
        const categorySums = {};

        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                monthIncome += parseFloat(transaction.amount);
            } else {
                monthExpense += parseFloat(transaction.amount);
                if (!categorySums[transaction.category]) {
                    categorySums[transaction.category] = 0;
                }
                categorySums[transaction.category] += parseFloat(transaction.amount);
            }
        });

        // Encontrar la categoría con más gastos
        let topCategory = null;
        let topCategoryAmount = 0;
        Object.entries(categorySums).forEach(([category, amount]) => {
            if (amount > topCategoryAmount) {
                topCategory = category;
                topCategoryAmount = amount;
            }
        });

        const topCategoryInfo = topCategory ? storage.getCategoryInfo(topCategory) : null;

        // Generar HTML del resumen
        summaryContainer.innerHTML = `
            <div class="summary-item">
                <span class="summary-label">Ingresos del mes</span>
                <span class="summary-value" style="color: var(--income-color)">$${monthIncome.toFixed(2)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Gastos del mes</span>
                <span class="summary-value" style="color: var(--expense-color)">$${monthExpense.toFixed(2)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Balance del mes</span>
                <span class="summary-value" style="color: ${monthIncome - monthExpense >= 0 ? 'var(--income-color)' : 'var(--expense-color)'}">
                    $${(monthIncome - monthExpense).toFixed(2)}
                </span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Transacciones</span>
                <span class="summary-value">${transactions.length}</span>
            </div>
            ${topCategoryInfo ? `
                <div class="summary-item">
                    <span class="summary-label">Mayor gasto</span>
                    <span class="summary-value">${topCategoryInfo.icon} ${topCategoryInfo.name} ($${topCategoryAmount.toFixed(2)})</span>
                </div>
            ` : ''}
        `;
    }

    // Actualizar todos los gráficos
    updateAllCharts() {
        this.updateCategoryChart();
        this.updateTrendChart();
        this.updateMonthlySummary();
    }

    // Destruir gráficos (para reinicialización)
    destroyCharts() {
        if (this.categoryChart) {
            this.categoryChart.destroy();
            this.categoryChart = null;
        }
        if (this.trendChart) {
            this.trendChart.destroy();
            this.trendChart = null;
        }
    }
}

// Crear instancia global
const chartManager = new ChartManager();
