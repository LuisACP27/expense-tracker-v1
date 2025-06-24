// storage.js - Gestión del almacenamiento local

class Storage {
    constructor() {
        this.STORAGE_KEY = 'expense_tracker_data';
        this.initializeStorage();
    }

    // Inicializar almacenamiento si no existe
    initializeStorage() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            const initialData = {
                transactions: [],
                categories: {
                    income: [
                        { id: 'salary', name: 'Salario', icon: '💰' },
                        { id: 'freelance', name: 'Trabajo Freelance', icon: '💻' },
                        { id: 'investment', name: 'Inversiones', icon: '📈' },
                        { id: 'other-income', name: 'Otros Ingresos', icon: '💵' }
                    ],
                    expense: [
                        { id: 'food', name: 'Comida', icon: '🍔' },
                        { id: 'transport', name: 'Transporte', icon: '🚗' },
                        { id: 'utilities', name: 'Servicios', icon: '💡' },
                        { id: 'entertainment', name: 'Entretenimiento', icon: '🎮' },
                        { id: 'shopping', name: 'Compras', icon: '🛍️' },
                        { id: 'health', name: 'Salud', icon: '🏥' },
                        { id: 'education', name: 'Educación', icon: '📚' },
                        { id: 'other-expense', name: 'Otros Gastos', icon: '📌' }
                    ]
                }
            };
            this.saveData(initialData);
        }
    }

    // Agregar una categoría
    addCategory(type, category) {
        const data = this.getData();
        if (!data.categories[type]) {
            data.categories[type] = [];
        }
        // Evitar duplicados por id
        if (!data.categories[type].some(cat => cat.id === category.id)) {
            data.categories[type].push(category);
            this.saveData(data);
            return true;
        }
        return false;
    }

    // Eliminar una categoría
    deleteCategory(type, categoryId) {
        const data = this.getData();
        if (!data.categories[type]) return false;
        const originalLength = data.categories[type].length;
        data.categories[type] = data.categories[type].filter(cat => cat.id !== categoryId);
        if (data.categories[type].length < originalLength) {
            this.saveData(data);
            return true;
        }
        return false;
    }

    // Obtener todos los datos
    getData() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    }

    // Guardar datos
    saveData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }

    // Obtener todas las transacciones
    getTransactions() {
        const data = this.getData();
        return data ? data.transactions : [];
    }

    // Agregar una transacción
    addTransaction(transaction) {
        const data = this.getData();
        transaction.id = Date.now().toString();
        transaction.createdAt = new Date().toISOString();
        data.transactions.push(transaction);
        this.saveData(data);
        return transaction;
    }

    // Eliminar una transacción
    deleteTransaction(id) {
        const data = this.getData();
        data.transactions = data.transactions.filter(t => t.id !== id);
        this.saveData(data);
    }

    // Obtener transacciones filtradas
    getFilteredTransactions(type = 'all', month = 'all') {
        let transactions = this.getTransactions();
        
        // Filtrar por tipo
        if (type !== 'all') {
            transactions = transactions.filter(t => t.type === type);
        }
        
        // Filtrar por mes
        if (month !== 'all') {
            transactions = transactions.filter(t => {
                const transactionMonth = new Date(t.date).toISOString().slice(0, 7);
                return transactionMonth === month;
            });
        }
        
        // Ordenar por fecha (más reciente primero)
        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Calcular totales
    calculateTotals() {
        const transactions = this.getTransactions();
        const totals = {
            income: 0,
            expense: 0,
            balance: 0
        };
        
        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totals.income += parseFloat(transaction.amount);
            } else {
                totals.expense += parseFloat(transaction.amount);
            }
        });
        
        totals.balance = totals.income - totals.expense;
        return totals;
    }

    // Obtener estadísticas por categoría
    getCategoryStats(type = 'expense', month = 'all') {
        let transactions = this.getFilteredTransactions(type, month);
        const categoryStats = {};
        
        transactions.forEach(transaction => {
            if (!categoryStats[transaction.category]) {
                categoryStats[transaction.category] = 0;
            }
            categoryStats[transaction.category] += parseFloat(transaction.amount);
        });
        
        return categoryStats;
    }

    // Obtener estadísticas mensuales
    getMonthlyStats(year) {
        const transactions = this.getTransactions();
        const monthlyStats = {};
        
        // Inicializar todos los meses
        for (let i = 1; i <= 12; i++) {
            const month = i.toString().padStart(2, '0');
            monthlyStats[`${year}-${month}`] = {
                income: 0,
                expense: 0
            };
        }
        
        // Calcular totales por mes
        transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            const transactionYear = transactionDate.getFullYear();
            
            if (transactionYear === year) {
                const month = transactionDate.toISOString().slice(0, 7);
                if (transaction.type === 'income') {
                    monthlyStats[month].income += parseFloat(transaction.amount);
                } else {
                    monthlyStats[month].expense += parseFloat(transaction.amount);
                }
            }
        });
        
        return monthlyStats;
    }

    // Obtener meses disponibles
    getAvailableMonths() {
        const transactions = this.getTransactions();
        const months = new Set();
        
        transactions.forEach(transaction => {
            const month = new Date(transaction.date).toISOString().slice(0, 7);
            months.add(month);
        });
        
        return Array.from(months).sort().reverse();
    }

    // Obtener información de categoría
    getCategoryInfo(categoryId) {
        const data = this.getData();
        const allCategories = [...data.categories.income, ...data.categories.expense];
        return allCategories.find(cat => cat.id === categoryId);
    }

    // Exportar datos
    exportData() {
        const data = this.getData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `gastos_ingresos_${new Date().toISOString().slice(0, 10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    // Importar datos
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    // Validar estructura básica
                    if (data.transactions && Array.isArray(data.transactions)) {
                        this.saveData(data);
                        resolve(true);
                    } else {
                        reject('Formato de archivo inválido');
                    }
                } catch (error) {
                    reject('Error al leer el archivo');
                }
            };
            
            reader.readAsText(file);
        });
    }

    // Limpiar todos los datos
    clearAllData() {
        if (confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
            this.initializeStorage();
            return true;
        }
        return false;
    }
}

// Crear instancia global
const storage = new Storage();
