// settings.js - Lógica de la página de ajustes

class SettingsPage {
    constructor() {
        this.themes = {
            green: {
                '--primary-color': '#4CAF50',
                '--secondary-color': '#53C5A8',
                '--background-color': '#f5f5f5',
                '--card-background': '#ffffff',
                '--border-color': '#e0e0e0',
                '--income-color': '#4CAF50',
                '--expense-color': '#f44336'
            },
            blue: {
                '--primary-color': '#2196F3',
                '--secondary-color': '#10d1c2',
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
                '--secondary-color': '#d82ccd',
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
        this.loadLanguage();
        this.loadPinSettings();
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

        // Selector de idioma
        document.getElementById('language-select').addEventListener('change', (e) => {
            this.changeLanguage(e.target.value, true);
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

        document.getElementById('change-pin').addEventListener('click', () => {
            document.getElementById('change-pin-modal').classList.remove('hidden');
            document.getElementById('change-pin-error').style.display = 'none';
            document.getElementById('change-pin-form').reset();
        });
        document.getElementById('cancel-change-pin').addEventListener('click', () => {
            document.getElementById('change-pin-modal').classList.add('hidden');
        });
        document.getElementById('change-pin-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleChangePinModal();
        });

        // Nuevas opciones de PIN
        document.getElementById('pin-enabled-toggle').addEventListener('change', (e) => {
            this.togglePinRequirement(e.target.checked);
        });

        document.getElementById('disable-pin').addEventListener('click', () => {
            this.disablePin();
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
        // Aplica el atributo data-theme al body para los estilos CSS específicos
        document.body.setAttribute('data-theme', themeName);

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

    // Cargar idioma guardado
    loadLanguage() {
        const lang = localStorage.getItem('app_language') || 'es';
        document.getElementById('language-select').value = lang;
        this.changeLanguage(lang, false);
    }

    // Cambiar idioma
    changeLanguage(lang, showNotification = false) {
        localStorage.setItem('app_language', lang);
        this.applyTranslations(lang);
        if (showNotification) {
            this.showNotification(lang === 'en' ? 'Language changed!' : 'Idioma cambiado!', 'success');
        }
    }

    // Aplicar traducciones
    applyTranslations(lang) {
        const translations = {
            es: {
                'settings-title': 'Configuración de la Aplicación',
                'appearance-title': 'Apariencia',
                'theme-label': 'Selecciona un tema:',
                'night-mode-label': 'Modo nocturno',
                'language-label': 'Idioma:',
                'info-title': 'Información de la Aplicación',
                'actions-title': 'Acciones',
                'export-btn': 'Exportar Datos',
                'import-btn': 'Importar Datos',
                'clear-btn': 'Limpiar Todos los Datos',
                'version-label': 'Versión:',
                'storage-label': 'Almacenamiento:',
            },
            en: {
                'settings-title': 'App Settings',
                'appearance-title': 'Appearance',
                'theme-label': 'Select a theme:',
                'night-mode-label': 'Night mode',
                'language-label': 'Language:',
                'info-title': 'App Information',
                'actions-title': 'Actions',
                'export-btn': 'Export Data',
                'import-btn': 'Import Data',
                'clear-btn': 'Clear All Data',
                'version-label': 'Version:',
                'storage-label': 'Storage:',
            },
            pt: {
                'settings-title': 'Configurações do Aplicativo',
                'appearance-title': 'Aparência',
                'theme-label': 'Selecione um tema:',
                'night-mode-label': 'Modo noturno',
                'language-label': 'Idioma:',
                'info-title': 'Informações do Aplicativo',
                'actions-title': 'Ações',
                'export-btn': 'Exportar Dados',
                'import-btn': 'Importar Dados',
                'clear-btn': 'Limpar Todos os Dados',
                'version-label': 'Versão:',
                'storage-label': 'Armazenamento:',
            },
            fr: {
                'settings-title': "Paramètres de l'Application",
                'appearance-title': 'Apparence',
                'theme-label': 'Sélectionnez un thème :',
                'night-mode-label': 'Mode nuit',
                'language-label': 'Langue :',
                'info-title': "Informations sur l'Application",
                'actions-title': 'Actions',
                'export-btn': 'Exporter les Données',
                'import-btn': 'Importer des Données',
                'clear-btn': 'Effacer Toutes les Données',
                'version-label': 'Version :',
                'storage-label': 'Stockage :',
            }
        };
        const t = translations[lang];
        // Títulos y etiquetas principales
        document.querySelector('.settings-page h2').textContent = t['settings-title'];
        document.querySelectorAll('.settings-section')[0].querySelector('h3').textContent = t['appearance-title'];
        document.querySelector('label[for="theme-select"]').textContent = t['theme-label'];
        document.querySelector('.night-mode-label').textContent = t['night-mode-label'];
        document.querySelector('label[for="language-select"]').textContent = t['language-label'];
        document.querySelectorAll('.settings-section')[1].querySelector('h3').textContent = t['info-title'];
        document.querySelectorAll('.settings-section')[2].querySelector('h3').textContent = t['actions-title'];
        // Botones
        document.getElementById('export-data').textContent = t['export-btn'];
        document.getElementById('import-data').textContent = t['import-btn'];
        document.getElementById('clear-data').textContent = t['clear-btn'];
        // Info app
        const appInfoPs = document.querySelectorAll('.app-info p');
        if (appInfoPs.length > 0) {
            // Versión
            appInfoPs[0].innerHTML = `<strong>${t['version-label']}</strong> 1.0.0`;
        }
        if (appInfoPs.length > 1) {
            // Almacenamiento
            appInfoPs[1].innerHTML = `<strong>${t['storage-label']}</strong> Local`;
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

    handleChangePinModal() {
        const PIN_KEY = 'security_pin';
        const currentPin = localStorage.getItem(PIN_KEY);
        const oldPin = document.getElementById('current-pin').value.trim();
        const newPin = document.getElementById('new-pin').value.trim();
        const confirmPin = document.getElementById('confirm-pin').value.trim();
        const errorDiv = document.getElementById('change-pin-error');
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
        if (!currentPin) {
            errorDiv.textContent = 'No hay PIN guardado. Usa la pantalla de PIN para crearlo.';
            errorDiv.style.display = 'block';
            return;
        }
        if (oldPin !== currentPin) {
            errorDiv.textContent = 'El PIN actual es incorrecto.';
            errorDiv.style.display = 'block';
            return;
        }
        if (!/^\d{4}$/.test(newPin)) {
            errorDiv.textContent = 'El nuevo PIN debe tener exactamente 4 dígitos.';
            errorDiv.style.display = 'block';
            return;
        }
        if (newPin !== confirmPin) {
            errorDiv.textContent = 'Los PIN no coinciden.';
            errorDiv.style.display = 'block';
            return;
        }
        localStorage.setItem(PIN_KEY, newPin);
        document.getElementById('change-pin-modal').classList.add('hidden');
        this.showNotification('PIN cambiado correctamente.', 'success');
    }

    // Cargar configuración de PIN
    loadPinSettings() {
        const pinEnabled = localStorage.getItem('pin_enabled') !== 'false'; // Por defecto habilitado
        const hasPin = localStorage.getItem('security_pin') !== null;
        
        const pinToggle = document.getElementById('pin-enabled-toggle');
        const disablePinBtn = document.getElementById('disable-pin');
        
        // Configurar el toggle
        pinToggle.checked = pinEnabled && hasPin;
        
        // Mostrar/ocultar botón de desactivar
        disablePinBtn.style.display = hasPin ? 'block' : 'none';
        
        // Deshabilitar toggle si no hay PIN
        pinToggle.disabled = !hasPin;
    }

    // Habilitar/deshabilitar requerimiento de PIN
    togglePinRequirement(enabled) {
        if (!enabled) {
            // Deshabilitar PIN
            localStorage.setItem('pin_enabled', 'false');
            sessionStorage.setItem('pin_ok', '1'); // Permitir acceso inmediato
            this.showNotification('PIN deshabilitado. Acceso directo habilitado.', 'success');
        } else {
            // Habilitar PIN
            localStorage.setItem('pin_enabled', 'true');
            sessionStorage.removeItem('pin_ok'); // Requerir PIN en siguiente acceso
            this.showNotification('PIN habilitado. Se requerirá en el próximo acceso.', 'success');
        }
        
        this.loadPinSettings(); // Actualizar UI
    }

    // Desactivar PIN completamente
    disablePin() {
        if (confirm('¿Estás seguro de que quieres desactivar el PIN? Esto eliminará el PIN actual y permitirá acceso directo a la aplicación.')) {
            // Eliminar PIN
            localStorage.removeItem('security_pin');
            localStorage.setItem('pin_enabled', 'false');
            sessionStorage.setItem('pin_ok', '1'); // Permitir acceso inmediato
            
            // Actualizar UI
            this.loadPinSettings();
            
            this.showNotification('PIN desactivado. Acceso directo habilitado.', 'success');
        }
    }
}

// Inicializar la página de ajustes cuando se cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    new SettingsPage();
}); 