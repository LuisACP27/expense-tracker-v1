// settings.js - Lógica de la página de ajustes

class SettingsPage {
    constructor() {
        this.themes = {
            green: {
                '--primary-color': '#4CAF50',
                '--secondary-color': '#2196F3',
                '--background-color': '#f5f5f5',
                '--card-background': '#ffffff',
                '--border-color': '#e0e0e0',
                '--income-color': '#4CAF50',
                '--expense-color': '#f44336'
            },
            blue: {
                '--primary-color': '#2196F3',
                '--secondary-color': '#4CAF50',
                '--background-color': '#e3f2fd',
                '--card-background': '#ffffff',
                '--border-color': '#90caf9',
                '--income-color': '#2196F3',
                '--expense-color': '#f44336'
            },
            dark: {
                '--primary-color': '#212121',
                '--secondary-color': '#424242',
                '--background-color': '#121212',
                '--card-background': '#1e1e1e',
                '--border-color': '#424242',
                '--income-color': '#81c784',
                '--expense-color': '#e57373'
            },
            red: {
                '--primary-color': '#e53935',
                '--secondary-color': '#ff7043',
                '--background-color': '#fff5f5',
                '--card-background': '#fff',
                '--border-color': '#ffcdd2',
                '--income-color': '#e53935',
                '--expense-color': '#b71c1c'
            },
            purple: {
                '--primary-color': '#8e24aa',
                '--secondary-color': '#7c43bd',
                '--background-color': '#f3e5f5',
                '--card-background': '#fff',
                '--border-color': '#ce93d8',
                '--income-color': '#8e24aa',
                '--expense-color': '#d500f9'
            },
            orange: {
                '--primary-color': '#fb8c00',
                '--secondary-color': '#ffb300',
                '--background-color': '#fff3e0',
                '--card-background': '#fff',
                '--border-color': '#ffe0b2',
                '--income-color': '#fb8c00',
                '--expense-color': '#e65100'
            },
            gray: {
                '--primary-color': '#757575',
                '--secondary-color': '#bdbdbd',
                '--background-color': '#f5f5f5',
                '--card-background': '#fff',
                '--border-color': '#e0e0e0',
                '--income-color': '#757575',
                '--expense-color': '#bdbdbd'
            }
        };
        // Fijar los colores de texto para todos los temas
        document.documentElement.style.setProperty('--text-primary', '#212121');
        document.documentElement.style.setProperty('--text-secondary', '#666666');
        this.init();
    }

    init() {
        this.loadTheme();
        this.loadNightMode();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Selector de tema
        document.getElementById('theme-select').addEventListener('change', (e) => {
            this.changeTheme(e.target.value, true);
        });

        // Switch de modo nocturno
        document.getElementById('night-mode-toggle').addEventListener('change', (e) => {
            this.toggleNightMode(e.target.checked);
        });

        // Botones de acciones
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('import-data').addEventListener('click', () => {
            this.importData();
        });

        document.getElementById('clear-data').addEventListener('click', () => {
            this.clearData();
        });
    }

    // Cargar modo nocturno guardado
    loadNightMode() {
        const night = localStorage.getItem('night_mode') === 'true';
        document.getElementById('night-mode-toggle').checked = night;
        this.toggleNightMode(night);
    }

    // Activar/desactivar modo nocturno
    toggleNightMode(enabled) {
        if (enabled) {
            document.body.classList.add('night-mode');
        } else {
            document.body.classList.remove('night-mode');
        }
        localStorage.setItem('night_mode', enabled);
    }

    // Cargar tema guardado
    loadTheme() {
        const savedTheme = localStorage.getItem('selected_theme') || 'green';
        const themeSelect = document.getElementById('theme-select');
        themeSelect.value = savedTheme;
        this.changeTheme(savedTheme);
    }

    // Cambiar tema
    changeTheme(themeName, showNotification = false) {
        const theme = this.themes[themeName];
        if (!theme) return;

        Object.entries(theme).forEach(([property, value]) => {
            document.documentElement.style.setProperty(property, value);
        });

        // Fijar los colores de texto para todos los temas (excepto si night-mode está activo)
        if (!document.body.classList.contains('night-mode')) {
            document.documentElement.style.setProperty('--text-primary', '#212121');
            document.documentElement.style.setProperty('--text-secondary', '#666666');
        }

        localStorage.setItem('selected_theme', themeName);
        
        // Solo mostrar notificación si el usuario realmente cambió el tema
        if (showNotification) {
            this.showNotification('Tema cambiado correctamente', 'success');
        }
    }

    // Exportar datos
    exportData() {
        try {
            const data = storage.getData();
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showNotification('Datos exportados correctamente', 'success');
        } catch (error) {
            this.showNotification('Error al exportar datos', 'error');
            console.error('Error exporting data:', error);
        }
    }

    // Importar datos
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    storage.saveData(data);
                    this.showNotification('Datos importados correctamente', 'success');
                } catch (error) {
                    this.showNotification('Error al importar datos. Verifica el formato del archivo.', 'error');
                    console.error('Error importing data:', error);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    // Limpiar datos
    clearData() {
        const message = '¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.';
        
        if (confirm(message)) {
            try {
                storage.clearAllData();
                this.showNotification('Todos los datos han sido eliminados', 'success');
            } catch (error) {
                this.showNotification('Error al limpiar datos', 'error');
                console.error('Error clearing data:', error);
            }
        }
    }

    // Mostrar notificación
    showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Agregar al contenedor principal en lugar del body
        const container = document.querySelector('.container');
        container.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Inicializar la página de ajustes cuando se cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    new SettingsPage();
}); 