// app.js - Lógica principal de la aplicación

class ExpenseTracker {
    constructor() {
        this.currentTab = 'add';
        this.init();
        this.themes = {
            green: {
                '--primary-color': '#4CAF50',
                '--primary-color-rgb': '76, 175, 80',
                '--secondary-color': '#53C5A8',
                '--background-color': '#f5f5f5',
                '--card-background': '#ffffff',
                '--border-color': '#e0e0e0',
                '--income-color': '#4CAF50',
                '--expense-color': '#f44336'
            },
            blue: {
                '--primary-color': '#2196F3',
                '--primary-color-rgb': '33, 150, 243',
                '--secondary-color': '#10d1c2',
                '--background-color': '#e3f2fd',
                '--card-background': '#ffffff',
                '--border-color': '#90caf9',
                '--income-color': '#2196F3',
                '--expense-color': '#f44336'
            },
            dark: {
                '--primary-color': '#212121',
                '--primary-color-rgb': '33, 33, 33',
                '--secondary-color': '#424242',
                '--background-color': '#121212',
                '--card-background': '#1e1e1e',
                '--border-color': '#424242',
                '--income-color': '#81c784',
                '--expense-color': '#e57373'
            },
            red: {
                '--primary-color': '#e53935',
                '--primary-color-rgb': '229, 57, 53',
                '--secondary-color': '#ff7043',
                '--background-color': '#fff5f5',
                '--card-background': '#fff',
                '--border-color': '#ffcdd2',
                '--income-color': '#e53935',
                '--expense-color': '#b71c1c'
            },
            purple: {
                '--primary-color': '#8e24aa',
                '--primary-color-rgb': '142, 36, 170',
                '--secondary-color': '#d82ccd',
                '--background-color': '#f3e5f5',
                '--card-background': '#fff',
                '--border-color': '#ce93d8',
                '--income-color': '#8e24aa',
                '--expense-color': '#d500f9'
            },
            orange: {
                '--primary-color': '#fb8c00',
                '--primary-color-rgb': '251, 140, 0',
                '--secondary-color': '#ffb300',
                '--background-color': '#fff3e0',
                '--card-background': '#fff',
                '--border-color': '#ffe0b2',
                '--income-color': '#fb8c00',
                '--expense-color': '#e65100'
            },
            gray: {
                '--primary-color': '#757575',
                '--primary-color-rgb': '117, 117, 117',
                '--secondary-color': '#bdbdbd',
                '--background-color': '#f5f5f5',
                '--card-background': '#fff',
                '--border-color': '#e0e0e0',
                '--income-color': '#757575',
                '--expense-color': '#bdbdbd'
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

        this.setupSwipeGestures();
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

        // Selector de categoría personalizado
        document.getElementById('category').addEventListener('focus', (e) => {
            e.preventDefault();
            this.openCategoryPicker();
        });
        document.getElementById('category').addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.openCategoryPicker();
        });
        // Cerrar picker
        document.getElementById('close-category-picker').addEventListener('click', () => this.closeCategoryPicker());
        document.getElementById('category-picker-modal').addEventListener('mousedown', (e) => {
            if (e.target === e.currentTarget) this.closeCategoryPicker();
        });

        // Pull to refresh
        this.setupPullToRefresh();
    }

    setupSwipeGestures() {
        const container = document.querySelector('.container');
        let touchStartX = 0;
        let touchEndX = 0;
        const minSwipeDistance = 50; // Mínima distancia para considerar un swipe

        container.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);

        container.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, false);

        this.handleSwipe = () => {
            const swipeDistance = touchEndX - touchStartX;
            if (Math.abs(swipeDistance) < minSwipeDistance) return;

            const tabs = Array.from(document.querySelectorAll('.tab-btn'));
            const currentTab = document.querySelector('.tab-btn.active');
            const currentIndex = tabs.indexOf(currentTab);

            if (swipeDistance > 0 && currentIndex > 0) {
                // Swipe derecha - tab anterior
                tabs[currentIndex - 1].click();
                this.vibrateDevice('short');
            } else if (swipeDistance < 0 && currentIndex < tabs.length - 1) {
                // Swipe izquierda - siguiente tab
                tabs[currentIndex + 1].click();
                this.vibrateDevice('short');
            }
        };
    }

    vibrateDevice(pattern = 'short') {
        if (!('vibrate' in navigator)) return;
        
        const patterns = {
            short: 50,
            medium: 100,
            long: 200,
            error: [50, 100, 50],
            success: [50, 50, 50]
        };
        
        navigator.vibrate(patterns[pattern]);
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

    openCategoryPicker() {
        const type = document.querySelector('input[name="type"]:checked').value;
        const data = storage.getData();
        const categories = data.categories[type];
        const pickerList = document.getElementById('category-picker-list');
        
        // Limpiar lista
        pickerList.innerHTML = '';
        
        // Calcular altura del viewport y del item para centrado perfecto
        const viewportHeight = window.innerHeight;
        const itemHeight = 80; // Altura aproximada de cada item
        const paddingCount = Math.floor(viewportHeight / (2 * itemHeight));
        
        // Agregar elementos de padding al inicio para centrado
        for (let i = 0; i < paddingCount; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'category-picker-item empty';
            emptyDiv.style.height = `${itemHeight}px`;
            emptyDiv.style.visibility = 'hidden';
            pickerList.appendChild(emptyDiv);
        }
        
        // Renderizar categorías
        categories.forEach((cat, idx) => {
            const item = document.createElement('div');
            item.className = 'category-picker-item';
            item.dataset.index = idx;
            item.dataset.categoryId = cat.id;
            item.innerHTML = `
                <div class="cat-icon">${cat.icon}</div>
                <div class="cat-name">${cat.name}</div>
            `;
            pickerList.appendChild(item);
        });
        
        // Agregar elementos de padding al final para centrado
        for (let i = 0; i < paddingCount; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'category-picker-item empty';
            emptyDiv.style.height = `${itemHeight}px`;
            emptyDiv.style.visibility = 'hidden';
            pickerList.appendChild(emptyDiv);
        }
        
        // Mostrar modal
        document.getElementById('category-picker-modal').classList.remove('hidden');
        
        // Scroll al elemento seleccionado actual o al centro
        setTimeout(() => {
            const select = document.getElementById('category');
            const selectedValue = select.value;
            let targetIndex = Math.floor(categories.length / 2); // Por defecto al centro
            
            if (selectedValue) {
                const selectedCategoryIndex = categories.findIndex(cat => cat.id === selectedValue);
                if (selectedCategoryIndex !== -1) {
                    targetIndex = selectedCategoryIndex;
                }
            }
            
            this.scrollToPickerIndex(targetIndex);
        }, 50);
        
        // Configurar eventos de scroll
        this.setupCategoryPickerScroll();
        
        // Click en categoría
        pickerList.onclick = (e) => {
            const item = e.target.closest('.category-picker-item');
            if (item && !item.classList.contains('empty')) {
                const index = parseInt(item.dataset.index);
                this.selectCategoryFromPicker(index);
            }
        };
        
        // Teclado para navegación
        pickerList.tabIndex = 0;
        pickerList.onkeydown = (e) => {
            const currentIndex = this.getCurrentSelectedIndex();
            let newIndex = currentIndex;
            
            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    newIndex = Math.max(0, currentIndex - 1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    newIndex = Math.min(categories.length - 1, currentIndex + 1);
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (currentIndex >= 0) {
                        this.selectCategoryFromPicker(currentIndex);
                    }
                    return;
                case 'Escape':
                    e.preventDefault();
                    this.closeCategoryPicker();
                    return;
            }
            
            if (newIndex !== currentIndex) {
                this.scrollToPickerIndex(newIndex);
            }
        };
        
        // Enfocar el picker para navegación por teclado
        setTimeout(() => {
            pickerList.focus();
        }, 100);
    }

    closeCategoryPicker() {
        document.getElementById('category-picker-modal').classList.add('hidden');
    }

    updatePickerVisual() {
        const pickerList = document.getElementById('category-picker-list');
        const scrollIndicator = document.getElementById('scroll-indicator');
        const items = Array.from(pickerList.children).filter(item => !item.classList.contains('empty'));
        const rect = pickerList.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        
        // Mostrar/ocultar indicador de scroll
        if (scrollIndicator) {
            const isAtTop = pickerList.scrollTop <= 0;
            const isAtBottom = pickerList.scrollTop + pickerList.clientHeight >= pickerList.scrollHeight;
            
            if (isAtTop || isAtBottom) {
                scrollIndicator.classList.remove('visible');
            } else {
                scrollIndicator.classList.add('visible');
            }
        }
        
        items.forEach(item => {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.top + itemRect.height / 2;
            const dist = Math.abs(centerY - itemCenter);
            
            // Remover clases anteriores
            item.classList.remove('center', 'near', 'far');
            
            if (dist < 40) {
                item.classList.add('center');
            } else if (dist < 80) {
                item.classList.add('near');
            } else {
                item.classList.add('far');
            }
        });
    }

    scrollToPickerIndex(idx) {
        const pickerList = document.getElementById('category-picker-list');
        const items = Array.from(pickerList.children).filter(item => !item.classList.contains('empty'));
        
        if (items[idx]) {
            const item = items[idx];
            const listRect = pickerList.getBoundingClientRect();
            const itemRect = item.getBoundingClientRect();
            const itemHeight = itemRect.height;
            
            // Calcular la posición exacta para centrar el elemento
            const targetScrollTop = item.offsetTop - (listRect.height / 2) + (itemHeight / 2);
            
            // Scroll suave al elemento
            pickerList.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
            });
            
            // Actualizar visual después del scroll
            setTimeout(() => {
                this.updatePickerVisual();
            }, 300);
        }
    }

    getCurrentSelectedIndex() {
        const pickerList = document.getElementById('category-picker-list');
        const items = Array.from(pickerList.children).filter(item => !item.classList.contains('empty'));
        const rect = pickerList.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        
        let closestIndex = -1;
        let closestDistance = Infinity;
        
        items.forEach((item, index) => {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.top + itemRect.height / 2;
            const dist = Math.abs(centerY - itemCenter);
            
            if (dist < closestDistance) {
                closestDistance = dist;
                closestIndex = index;
            }
        });
        
        return closestIndex;
    }

    selectCategoryFromPicker(idx) {
        const type = document.querySelector('input[name="type"]:checked').value;
        const data = storage.getData();
        const categories = data.categories[type];
        const cat = categories[idx];
        if (cat) {
            // Seleccionar en el select real
            const select = document.getElementById('category');
            select.value = cat.id;
            select.dispatchEvent(new Event('change'));
            this.closeCategoryPicker();
        }
    }

    setupPullToRefresh() {
        const container = document.querySelector('.container');
        const pullToRefresh = document.querySelector('.pull-to-refresh');
        let touchStartY = 0;
        let touchEndY = 0;
        let refreshing = false;
        const minPullDistance = 100;

        container.addEventListener('touchstart', e => {
            if (container.scrollTop === 0) {
                touchStartY = e.touches[0].clientY;
                pullToRefresh.classList.add('visible');
            }
        });

        container.addEventListener('touchmove', e => {
            if (refreshing || container.scrollTop > 0) return;

            touchEndY = e.touches[0].clientY;
            const pullDistance = touchEndY - touchStartY;

            if (pullDistance > 0 && pullDistance < minPullDistance) {
                pullToRefresh.style.top = `${pullDistance - 60}px`;
                pullToRefresh.classList.remove('ready');
            } else if (pullDistance >= minPullDistance) {
                pullToRefresh.classList.add('ready');
            }
        });

        container.addEventListener('touchend', async () => {
            if (refreshing) return;

            const pullDistance = touchEndY - touchStartY;
            pullToRefresh.style.top = '';

            if (pullDistance >= minPullDistance) {
                refreshing = true;
                pullToRefresh.classList.add('refreshing');
                this.vibrateDevice('short');

                // Simular actualización de datos
                await this.refreshData();

                refreshing = false;
                pullToRefresh.classList.remove('refreshing', 'ready', 'visible');
                this.vibrateDevice('success');
            } else {
                pullToRefresh.classList.remove('visible');
            }
        });
    }

    async refreshData() {
        // Simular carga de datos
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Recargar datos
        this.loadTransactions();
        this.updateStats();
        this.showNotification('Datos actualizados', 'success');
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('selected_theme') || 'green';
        const theme = this.themes[savedTheme];
        if (theme) {
            Object.entries(theme).forEach(([property, value]) => {
                document.documentElement.style.setProperty(property, value);
            });
            // Aplica el atributo data-theme al body para los estilos CSS específicos
            document.body.setAttribute('data-theme', savedTheme);
        }
    }

    setupCategoryPickerScroll() {
        const pickerList = document.getElementById('category-picker-list');
        let isScrolling = false;
        let scrollTimeout;
        
        // Función para manejar el scroll con momentum
        const handleScroll = () => {
            if (!isScrolling) {
                isScrolling = true;
                pickerList.style.pointerEvents = 'none';
            }
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
                pickerList.style.pointerEvents = 'auto';
                this.updatePickerVisual();
            }, 150);
        };
        
        // Eventos de scroll
        pickerList.addEventListener('scroll', handleScroll, { passive: true });
        pickerList.addEventListener('touchmove', handleScroll, { passive: true });
        pickerList.addEventListener('wheel', handleScroll, { passive: true });
        
        // Snap al elemento más cercano al centro cuando termine el scroll
        pickerList.addEventListener('scrollend', () => {
            const currentIndex = this.getCurrentSelectedIndex();
            if (currentIndex >= 0) {
                this.scrollToPickerIndex(currentIndex);
            }
        });
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
