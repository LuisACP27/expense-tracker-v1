// app.js - Lógica principal de la aplicación

class ExpenseTracker {
    constructor() {
        this.currentTab = 'add';
        this.init();
        this.themes = {
            green: {
                '--primary-color': '#4CAF50',
                '--secondary-color': '#2196F3',
                '--background-color': '#f5f5f5',
                '--card-background': '#ffffff',
                '--text-primary': '#333333',
                '--text-secondary': '#666666',
                '--border-color': '#e0e0e0',
                '--income-color': '#4CAF50',
                '--expense-color': '#f44336'
            },
            blue: {
                '--primary-color': '#2196F3',
                '--secondary-color': '#4CAF50',
                '--background-color': '#e3f2fd',
                '--card-background': '#ffffff',
                '--text-primary': '#0d47a1',
                '--text-secondary': '#1976d2',
                '--border-color': '#90caf9',
                '--income-color': '#2196F3',
                '--expense-color': '#f44336'
            },
            dark: {
                '--primary-color': '#212121',
                '--secondary-color': '#424242',
                '--background-color': '#121212',
                '--card-background': '#1e1e1e',
                '--text-primary': '#e0e0e0',
                '--text-secondary': '#bdbdbd',
                '--border-color': '#424242',
                '--income-color': '#81c784',
                '--expense-color': '#e57373'
            }
        };
    }

    init() {
        // Establecer fecha actual en el formulario
        this.setCurrentDate();
        
        // Cargar datos iniciales
        this.updateBalance();
        this.loadTransactions();
        this.loadMonthFilter();

        // Renderizar categorías dinámicamente
        this.renderCategories();

        // Configurar event listeners
        this.setupEventListeners();
        
        // Inicializar gráficos cuando se abra la pestaña de estadísticas
        this.initChartsOnFirstView = true;

        // Cargar tema guardado o por defecto
        this.loadTheme();
    }

    setupEventListeners() {
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Formulario de transacción
        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        // Cambio de tipo de transacción
        document.querySelectorAll('input[name="type"]').forEach(radio => {
            radio.addEventListener('change', () => this.updateCategoryOptions());
        });

        // Botón para abrir modal de gestión de categorías
        document.getElementById('manage-categories-btn').addEventListener('click', () => this.openCategoryModal());

        // Botón para cerrar modal de gestión de categorías
        document.getElementById('close-category-modal').addEventListener('click', () => this.closeCategoryModal());

        // Botones para agregar categorías
        document.getElementById('add-income-category-btn').addEventListener('click', () => this.addCategory('income'));
        document.getElementById('add-expense-category-btn').addEventListener('click', () => this.addCategory('expense'));

        // Delegación de eventos para eliminar categorías
        document.getElementById('income-category-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-category-btn')) {
                const categoryId = e.target.dataset.id;
                this.deleteCategory('income', categoryId);
            }
        });
        document.getElementById('expense-category-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-category-btn')) {
                const categoryId = e.target.dataset.id;
                this.deleteCategory('expense', categoryId);
            }
        });

        // Filtros
        document.getElementById('filter-type').addEventListener('change', () => this.loadTransactions());
        document.getElementById('filter-month').addEventListener('change', () => this.loadTransactions());

        // Delegación de eventos para botones de eliminar transacciones
        document.getElementById('transactions-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const transactionId = e.target.dataset.id;
                this.deleteTransaction(transactionId);
            }
        });
    }

    // Cambiar pestaña
    switchTab(tabName) {
        // Actualizar botones de pestañas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Actualizar contenido de pestañas
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabName}-tab`);
        });

        this.currentTab = tabName;

        // Inicializar gráficos la primera vez que se abre la pestaña de estadísticas
        if (tabName === 'stats' && this.initChartsOnFirstView) {
            setTimeout(() => {
                chartManager.initCharts();
                chartManager.updateAllCharts();
                this.initChartsOnFirstView = false;
            }, 100);
        } else if (tabName === 'stats') {
            chartManager.updateAllCharts();
        }
    }

    // Establecer fecha actual
    setCurrentDate() {
        const dateInput = document.getElementById('date');
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        dateInput.max = today;
    }

    // Actualizar opciones de categoría según el tipo
    updateCategoryOptions() {
        const type = document.querySelector('input[name="type"]:checked').value;
        this.renderCategories(type);
    }

    // Renderizar categorías dinámicamente en el select
    renderCategories(type = null) {
        const categorySelect = document.getElementById('category');
        const data = storage.getData();
        if (!data || !data.categories) return;

        // Limpiar opciones excepto la primera
        categorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';

        // Si no se especifica tipo, mostrar todas
        const typesToShow = type ? [type] : ['income', 'expense'];

        typesToShow.forEach(t => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = t === 'income' ? 'Ingresos' : 'Gastos';

            data.categories[t].forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = `${cat.icon} ${cat.name}`;
                optgroup.appendChild(option);
            });

            categorySelect.appendChild(optgroup);
        });

        // Resetear selección
        categorySelect.selectedIndex = 0;
    }

    // Abrir modal de gestión de categorías
    openCategoryModal() {
        const type = document.querySelector('input[name="type"]:checked').value;
        document.getElementById('category-modal').classList.remove('hidden');
        this.renderCategoryLists(type);
    }

    // Cerrar modal de gestión de categorías
    closeCategoryModal() {
        document.getElementById('category-modal').classList.add('hidden');
        // Limpiar inputs
        document.getElementById('new-income-category-name').value = '';
        document.getElementById('new-income-category-icon').value = '';
        document.getElementById('new-expense-category-name').value = '';
        document.getElementById('new-expense-category-icon').value = '';
    }

    // Renderizar listas de categorías en el modal
    renderCategoryLists(type) {
        const incomeListContainer = document.querySelector('#income-category-list').parentElement;
        const expenseListContainer = document.querySelector('#expense-category-list').parentElement;
        const incomeList = document.getElementById('income-category-list');
        const expenseList = document.getElementById('expense-category-list');
        const data = storage.getData();
        if (!data || !data.categories) return;

        incomeList.innerHTML = '';
        expenseList.innerHTML = '';

        if (type === 'income') {
            incomeListContainer.style.display = 'block';
            expenseListContainer.style.display = 'none';

            data.categories.income.forEach(cat => {
                const li = document.createElement('li');
                li.textContent = `${cat.icon} ${cat.name}`;
                const delBtn = document.createElement('button');
                delBtn.textContent = 'Eliminar';
                delBtn.className = 'delete-category-btn';
                delBtn.dataset.id = cat.id;
                li.appendChild(delBtn);
                incomeList.appendChild(li);
            });
        } else if (type === 'expense') {
            incomeListContainer.style.display = 'none';
            expenseListContainer.style.display = 'block';

            data.categories.expense.forEach(cat => {
                const li = document.createElement('li');
                li.textContent = `${cat.icon} ${cat.name}`;
                const delBtn = document.createElement('button');
                delBtn.textContent = 'Eliminar';
                delBtn.className = 'delete-category-btn';
                delBtn.dataset.id = cat.id;
                li.appendChild(delBtn);
                expenseList.appendChild(li);
            });
        } else {
            // Show both if no type specified
            incomeListContainer.style.display = 'block';
            expenseListContainer.style.display = 'block';

            data.categories.income.forEach(cat => {
                const li = document.createElement('li');
                li.textContent = `${cat.icon} ${cat.name}`;
                const delBtn = document.createElement('button');
                delBtn.textContent = 'Eliminar';
                delBtn.className = 'delete-category-btn';
                delBtn.dataset.id = cat.id;
                li.appendChild(delBtn);
                incomeList.appendChild(li);
            });

            data.categories.expense.forEach(cat => {
                const li = document.createElement('li');
                li.textContent = `${cat.icon} ${cat.name}`;
                const delBtn = document.createElement('button');
                delBtn.textContent = 'Eliminar';
                delBtn.className = 'delete-category-btn';
                delBtn.dataset.id = cat.id;
                li.appendChild(delBtn);
                expenseList.appendChild(li);
            });
        }
    }

    // Añadir categoría nueva
    addCategory(type) {
        const nameInput = document.getElementById(`new-${type}-category-name`);
        const iconInput = document.getElementById(`new-${type}-category-icon`);
        const name = nameInput.value.trim();
        // Icono es opcional, si no se ingresa se usa un icono por defecto
        const icon = iconInput.value.trim() || '🏷️';

        if (!name) {
            alert('Por favor ingresa un nombre para la categoría');
            return;
        }

        // Generar id simple a partir del nombre
        const id = name.toLowerCase().replace(/\s+/g, '-');

        const newCategory = { id, name, icon };

        if (storage.addCategory(type, newCategory)) {
            this.renderCategoryLists(type);
            this.renderCategories(type);
            nameInput.value = '';
            iconInput.value = '';
            this.showNotification(`Categoría "${name}" agregada`, 'success');
        } else {
            alert('La categoría ya existe');
        }
    }

    // Eliminar categoría
    deleteCategory(type, categoryId) {
        this.showConfirmDialog('¿Estás seguro de que quieres eliminar esta categoría?')
            .then(confirmed => {
                if (confirmed) {
                    if (storage.deleteCategory(type, categoryId)) {
                        this.renderCategoryLists(type);
                        this.renderCategories(type);
                        this.showNotification('Categoría eliminada', 'info');
                    } else {
                        alert('No se pudo eliminar la categoría');
                    }
                }
            });
    }

    // Mostrar diálogo de confirmación personalizado
    showConfirmDialog(message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirm-modal');
            const messageElem = document.getElementById('confirm-message');
            const yesBtn = document.getElementById('confirm-yes');
            const noBtn = document.getElementById('confirm-no');

            messageElem.textContent = message;
            modal.classList.remove('hidden');

            const cleanUp = () => {
                yesBtn.removeEventListener('click', onYes);
                noBtn.removeEventListener('click', onNo);
                modal.classList.add('hidden');
            };

            const onYes = () => {
                cleanUp();
                resolve(true);
            };

            const onNo = () => {
                cleanUp();
                resolve(false);
            };

            yesBtn.addEventListener('click', onYes);
            noBtn.addEventListener('click', onNo);
        });
    }

    // Agregar transacción
    addTransaction() {
        const formData = {
            type: document.querySelector('input[name="type"]:checked').value,
            amount: parseFloat(document.getElementById('amount').value),
            category: document.getElementById('category').value,
            description: document.getElementById('description').value.trim(),
            date: document.getElementById('date').value
        };

        // Validar datos
        if (!formData.category) {
            alert('Por favor selecciona una categoría');
            return;
        }

        if (isNaN(formData.amount) || formData.amount <= 0) {
            alert('Por favor ingresa una cantidad válida mayor que cero');
            return;
        }

        // Guardar transacción
        storage.addTransaction(formData);

        // Actualizar UI
        this.updateBalance();
        this.loadTransactions();
        
        // Limpiar formulario
        document.getElementById('transaction-form').reset();
        this.setCurrentDate();
        this.updateCategoryOptions();

        // Mostrar mensaje de éxito
        this.showNotification('Transacción agregada exitosamente', 'success');

        // Cambiar a la pestaña de transacciones
        this.switchTab('list');
    }

    // Eliminar transacción
    deleteTransaction(id) {
        this.showConfirmDialog('¿Estás seguro de que quieres eliminar esta transacción?')
            .then(confirmed => {
                if (confirmed) {
                    storage.deleteTransaction(id);
                    this.updateBalance();
                    this.loadTransactions();
                    this.showNotification('Transacción eliminada', 'info');
                }
            });
    }

    // Actualizar balance
    updateBalance() {
        const totals = storage.calculateTotals();
        
        document.getElementById('balance').textContent = `$${totals.balance.toFixed(2)}`;
        document.getElementById('total-income').textContent = `$${totals.income.toFixed(2)}`;
        document.getElementById('total-expense').textContent = `$${totals.expense.toFixed(2)}`;
        
        // Cambiar color del balance según sea positivo o negativo
        const balanceElement = document.getElementById('balance');
        if (totals.balance >= 0) {
            balanceElement.style.color = '#00e676';
            balanceElement.style.textShadow = '0 1px 2px rgba(0, 230, 118, 0.3)';
        } else {
            balanceElement.style.color = '#ff1744';
            balanceElement.style.textShadow = '0 1px 2px rgba(255, 23, 68, 0.3)';
        }
    }

    // Cargar transacciones
    loadTransactions() {
        const type = document.getElementById('filter-type').value;
        const month = document.getElementById('filter-month').value;
        const transactions = storage.getFilteredTransactions(type, month);
        const listContainer = document.getElementById('transactions-list');

        if (transactions.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <p>No hay transacciones para mostrar</p>
                    <p style="font-size: 14px;">Agrega tu primera transacción para comenzar</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = transactions.map(transaction => {
            const categoryInfo = storage.getCategoryInfo(transaction.category);
            const date = new Date(transaction.date);
            const formattedDate = date.toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
            });

            return `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-category">
                            ${categoryInfo ? categoryInfo.icon : ''} ${categoryInfo ? categoryInfo.name : transaction.category}
                        </div>
                        ${transaction.description ? `<div class="transaction-description">${transaction.description}</div>` : ''}
                        <div class="transaction-date">${formattedDate}</div>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <span class="transaction-amount ${transaction.type}">
                            ${transaction.type === 'income' ? '+' : '-'}$${parseFloat(transaction.amount).toFixed(2)}
                        </span>
                        <button class="delete-btn" data-id="${transaction.id}">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Cargar filtro de meses
    loadMonthFilter() {
        const monthFilter = document.getElementById('filter-month');
        const availableMonths = storage.getAvailableMonths();
        
        // Nombres de meses en español
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        monthFilter.innerHTML = '<option value="all">Todos los meses</option>';
        
        availableMonths.forEach(month => {
            const [year, monthNum] = month.split('-');
            const monthIndex = parseInt(monthNum) - 1;
            const monthName = monthNames[monthIndex];
            
            monthFilter.innerHTML += `
                <option value="${month}">${monthName} ${year}</option>
            `;
        });
    }

    // Mostrar notificación
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Agregar al contenedor principal en lugar del body
        const container = document.querySelector('.container');
        container.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const app = new ExpenseTracker();
    
    // Actualizar filtro de meses cuando cambie el filtro de tipo
    document.getElementById('filter-type').addEventListener('change', () => {
        app.loadMonthFilter();
    });
});

// PWA - Instalar aplicación
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Mostrar botón de instalación
    const installBtn = document.createElement('button');
    installBtn.className = 'install-btn';
    installBtn.textContent = '📱 Instalar App';
    installBtn.style.display = 'block';
    document.body.appendChild(installBtn);
    
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('Usuario aceptó instalar la app');
            }
            
            deferredPrompt = null;
            installBtn.style.display = 'none';
        }
    });
});
