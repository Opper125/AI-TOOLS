// Style Management System JavaScript
// Comprehensive functionality for live preview and style management

// Initialize Supabase client
const supabaseUrl = 'https://spurpwnaeacgwojfpaem.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdXJwd25hZWFjZ3dvamZwYWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMjU2MDYsImV4cCI6MjA3MzkwMTYwNn0.VTKl3ZU6xVKcn3Ry1XTtY-Fpvm0cVqZiQcloJc33O-Y';
const supabase = window.supabase?.createClient(supabaseUrl, supabaseAnonKey);

// Global state management
const StyleManager = {
    currentStyles: {},
    originalStyles: {},
    previewMode: false,
    currentSection: 'global',
    isDirty: false,

    // Initialize the style manager
    init() {
        this.loadOriginalStyles();
        this.setupEventListeners();
        this.loadSavedStyles();
        this.updateRangeValues();
        this.initializeThemePresets();
        console.log('✅ Style Manager initialized');
    },

    // Load original/default styles
    loadOriginalStyles() {
        this.originalStyles = {
            // Global Variables
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            accentColor: '#28a745',
            bgType: 'solid',
            bgColor: '#ffffff',
            gradientStart: '#007bff',
            gradientEnd: '#0056b3',
            bgImage: '',
            primaryFont: 'Inter, sans-serif',
            baseFontSize: 14,

            // Layout Controls
            maxWidth: 1200,
            containerPadding: 20,
            navHeight: 70,
            navPosition: 'static',
            gridGap: 20,
            cardColumns: 3,
            sectionPadding: 40,
            elementMargin: 15,

            // Components
            buttonRadius: 8,
            buttonPadding: 12,
            buttonShadow: true,
            buttonHover: 'scale',
            cardRadius: 12,
            cardShadow: 3,
            cardPadding: 20,
            inputRadius: 6,
            inputHeight: 40,
            inputBorder: 'solid',
            modalRadius: 12,
            modalBackdrop: 80,

            // Typography
            h1Size: 32,
            h2Size: 28,
            h3Size: 24,
            headingWeight: 600,
            bodySize: 14,
            lineHeight: 1.5,
            letterSpacing: 0,
            textPrimary: '#333333',
            textSecondary: '#666666',
            textMuted: '#999999',

            // Colors & Status
            successColor: '#28a745',
            warningColor: '#ffc107',
            dangerColor: '#dc3545',
            infoColor: '#17a2b8',
            borderLight: '#e9ecef',
            borderMedium: '#dee2e6',
            borderDark: '#adb5bd',

            // Animations
            transitionDuration: 300,
            transitionEasing: 'ease-in-out',
            cardHoverScale: 1.02,
            buttonHoverScale: 1.05,
            hoverShadow: 10,
            loadingStyle: 'spinner',
            loadingSpeed: 1,
            pageTransition: 'none',
            modalAnimation: 'fadeIn',

            // Advanced
            customCSS: '',
            mobileBreakpoint: 576,
            tabletBreakpoint: 768,
            desktopBreakpoint: 992,
            enableTransitions: true,
            enableAnimations: true,
            enableShadows: true,
            highContrast: false,
            reducedMotion: false,
            focusIndicators: false
        };

        this.currentStyles = { ...this.originalStyles };
    },

    // Setup all event listeners
    setupEventListeners() {
        // Navigation events
        document.getElementById('previewToggle')?.addEventListener('click', this.togglePreview.bind(this));
        document.getElementById('saveStyles')?.addEventListener('click', this.saveStyles.bind(this));
        document.getElementById('resetStyles')?.addEventListener('click', this.showResetModal.bind(this));

        // Modal events
        document.getElementById('closeResetModal')?.addEventListener('click', this.hideResetModal.bind(this));
        document.getElementById('cancelReset')?.addEventListener('click', this.hideResetModal.bind(this));
        document.getElementById('confirmReset')?.addEventListener('click', this.resetStyles.bind(this));

        // Export/Import events
        document.getElementById('exportStyles')?.addEventListener('click', this.showExportModal.bind(this));
        document.getElementById('importStyles')?.addEventListener('click', this.importStyles.bind(this));
        document.getElementById('duplicateTheme')?.addEventListener('click', this.duplicateTheme.bind(this));

        document.getElementById('closeExportModal')?.addEventListener('click', this.hideExportModal.bind(this));
        document.getElementById('cancelExport')?.addEventListener('click', this.hideExportModal.bind(this));
        document.getElementById('copyExport')?.addEventListener('click', this.copyExportCode.bind(this));
        document.getElementById('downloadExport')?.addEventListener('click', this.downloadExportCode.bind(this));

        // Sidebar navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });

        // Preview controls
        document.getElementById('closePreview')?.addEventListener('click', this.closePreview.bind(this));
        document.querySelectorAll('.preview-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const device = btn.dataset.device;
                this.switchPreviewDevice(device);
            });
        });

        // Theme presets
        document.querySelectorAll('.theme-preset').forEach(preset => {
            preset.addEventListener('click', (e) => {
                const theme = preset.dataset.theme;
                this.applyThemePreset(theme);
            });
        });

        // CSS editor actions
        document.getElementById('formatCSS')?.addEventListener('click', this.formatCustomCSS.bind(this));
        document.getElementById('validateCSS')?.addEventListener('click', this.validateCustomCSS.bind(this));

        // Form controls
        this.setupFormListeners();

        // Background type change
        document.getElementById('bgType')?.addEventListener('change', this.handleBgTypeChange.bind(this));

        // File import
        document.getElementById('importFile')?.addEventListener('change', this.handleFileImport.bind(this));

        console.log('✅ Event listeners setup complete');
    },

    // Setup form control listeners
    setupFormListeners() {
        // Get all form inputs
        const inputs = document.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            const eventType = input.type === 'range' ? 'input' : 'change';

            input.addEventListener(eventType, (e) => {
                const name = input.name || input.id;
                let value = input.value;

                // Handle different input types
                if (input.type === 'checkbox') {
                    value = input.checked;
                } else if (input.type === 'range' || input.type === 'number') {
                    value = parseFloat(value);
                }

                // Update current styles
                if (name && name !== 'undefined') {
                    this.currentStyles[name] = value;
                    this.updateStylePreview();
                    this.updateRangeValue(input);
                    this.markAsDirty();
                }
            });

            // Sync color inputs with text inputs
            if (input.type === 'color') {
                const textInput = input.parentElement.querySelector('.color-input');
                if (textInput) {
                    input.addEventListener('input', () => {
                        textInput.value = input.value;
                    });
                    textInput.addEventListener('input', () => {
                        if (this.isValidColor(textInput.value)) {
                            input.value = textInput.value;
                            const name = input.name || input.id;
                            if (name) {
                                this.currentStyles[name] = textInput.value;
                                this.updateStylePreview();
                                this.markAsDirty();
                            }
                        }
                    });
                }
            }
        });
    },

    // Update range value displays
    updateRangeValues() {
        document.querySelectorAll('input[type="range"]').forEach(range => {
            this.updateRangeValue(range);
        });
    },

    // Update single range value
    updateRangeValue(range) {
        const valueSpan = range.parentElement.querySelector('.range-value');
        if (valueSpan) {
            let value = range.value;
            let unit = '';

            // Add appropriate units
            if (range.name?.includes('Size') || range.name?.includes('Width') || 
                range.name?.includes('Height') || range.name?.includes('Padding') || 
                range.name?.includes('Margin') || range.name?.includes('Gap') || 
                range.name?.includes('Radius')) {
                unit = 'px';
            } else if (range.name?.includes('Duration')) {
                unit = 'ms';
            } else if (range.name === 'modalBackdrop') {
                unit = '%';
            } else if (range.name?.includes('Scale')) {
                // No unit for scale
            } else if (range.name?.includes('Speed')) {
                unit = 'x';
            } else if (range.name === 'letterSpacing') {
                unit = 'em';
            }

            valueSpan.textContent = value + unit;
        }
    },

    // Switch between sections
    switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');

        // Update content
        document.querySelectorAll('.style-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-section`)?.classList.add('active');

        this.currentSection = sectionName;
        console.log(`📄 Switched to section: ${sectionName}`);
    },

    // Handle background type change
    handleBgTypeChange(e) {
        const type = e.target.value;
        const colorRow = document.getElementById('bgColorRow');
        const gradientRow = document.getElementById('bgGradientRow');
        const imageRow = document.getElementById('bgImageRow');

        // Hide all rows first
        [colorRow, gradientRow, imageRow].forEach(row => {
            row?.classList.add('hidden');
        });

        // Show appropriate row
        switch(type) {
            case 'solid':
                colorRow?.classList.remove('hidden');
                break;
            case 'gradient':
                gradientRow?.classList.remove('hidden');
                break;
            case 'image':
                imageRow?.classList.remove('hidden');
                break;
        }

        this.updateStylePreview();
    },

    // Initialize theme presets
    initializeThemePresets() {
        const presets = {
            default: {
                primaryColor: '#007bff',
                secondaryColor: '#6c757d',
                accentColor: '#28a745'
            },
            gaming: {
                primaryColor: '#ff6b35',
                secondaryColor: '#f7931e',
                accentColor: '#ffd23f'
            },
            purple: {
                primaryColor: '#6f42c1',
                secondaryColor: '#e83e8c',
                accentColor: '#fd7e14'
            },
            green: {
                primaryColor: '#28a745',
                secondaryColor: '#20c997',
                accentColor: '#17a2b8'
            },
            dark: {
                primaryColor: '#343a40',
                secondaryColor: '#495057',
                accentColor: '#6c757d'
            }
        };

        this.themePresets = presets;
    },

    // Apply theme preset
    applyThemePreset(themeName) {
        const preset = this.themePresets[themeName];
        if (!preset) return;

        // Update active theme
        document.querySelectorAll('.theme-preset').forEach(p => {
            p.classList.remove('active');
        });
        document.querySelector(`[data-theme="${themeName}"]`)?.classList.add('active');

        // Apply colors
        Object.entries(preset).forEach(([key, value]) => {
            this.currentStyles[key] = value;

            // Update form inputs
            const input = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = value;

                // Update color input text
                const textInput = input.parentElement.querySelector('.color-input');
                if (textInput) {
                    textInput.value = value;
                }
            }
        });

        this.updateStylePreview();
        this.markAsDirty();
        this.showMessage('Theme applied successfully!', 'success');

        console.log(`🎨 Applied theme: ${themeName}`);
    },

    // Generate CSS from current styles
    generateCSS() {
        const styles = this.currentStyles;
        let css = ':root {\n';

        // CSS Variables
        css += `  --primary-color: ${styles.primaryColor};\n`;
        css += `  --secondary-color: ${styles.secondaryColor};\n`;
        css += `  --accent-color: ${styles.accentColor};\n`;
        css += `  --success-color: ${styles.successColor};\n`;
        css += `  --warning-color: ${styles.warningColor};\n`;
        css += `  --danger-color: ${styles.dangerColor};\n`;
        css += `  --info-color: ${styles.infoColor};\n`;

        // Background
        if (styles.bgType === 'solid') {
            css += `  --bg-color: ${styles.bgColor};\n`;
        } else if (styles.bgType === 'gradient') {
            css += `  --bg-gradient: linear-gradient(135deg, ${styles.gradientStart}, ${styles.gradientEnd});\n`;
        } else if (styles.bgType === 'image') {
            css += `  --bg-image: url('${styles.bgImage}');\n`;
        }

        // Typography
        css += `  --font-primary: ${styles.primaryFont};\n`;
        css += `  --font-size-base: ${styles.baseFontSize}px;\n`;
        css += `  --font-size-h1: ${styles.h1Size}px;\n`;
        css += `  --font-size-h2: ${styles.h2Size}px;\n`;
        css += `  --font-size-h3: ${styles.h3Size}px;\n`;
        css += `  --font-weight-heading: ${styles.headingWeight};\n`;
        css += `  --line-height: ${styles.lineHeight};\n`;
        css += `  --letter-spacing: ${styles.letterSpacing}em;\n`;

        // Text Colors
        css += `  --text-primary: ${styles.textPrimary};\n`;
        css += `  --text-secondary: ${styles.textSecondary};\n`;
        css += `  --text-muted: ${styles.textMuted};\n`;

        // Layout
        css += `  --container-max-width: ${styles.maxWidth}px;\n`;
        css += `  --container-padding: ${styles.containerPadding}px;\n`;
        css += `  --nav-height: ${styles.navHeight}px;\n`;
        css += `  --grid-gap: ${styles.gridGap}px;\n`;
        css += `  --section-padding: ${styles.sectionPadding}px;\n`;
        css += `  --element-margin: ${styles.elementMargin}px;\n`;

        // Components
        css += `  --button-radius: ${styles.buttonRadius}px;\n`;
        css += `  --button-padding: ${styles.buttonPadding}px;\n`;
        css += `  --card-radius: ${styles.cardRadius}px;\n`;
        css += `  --card-padding: ${styles.cardPadding}px;\n`;
        css += `  --input-radius: ${styles.inputRadius}px;\n`;
        css += `  --input-height: ${styles.inputHeight}px;\n`;
        css += `  --modal-radius: ${styles.modalRadius}px;\n`;

        // Shadows
        if (styles.enableShadows) {
            css += `  --card-shadow: 0 ${styles.cardShadow * 2}px ${styles.cardShadow * 4}px rgba(0,0,0,0.1);\n`;
            if (styles.buttonShadow) {
                css += `  --button-shadow: 0 2px 4px rgba(0,0,0,0.1);\n`;
            }
        }

        // Animations
        if (styles.enableTransitions) {
            css += `  --transition-duration: ${styles.transitionDuration}ms;\n`;
            css += `  --transition-easing: ${styles.transitionEasing};\n`;
        }

        // Border Colors
        css += `  --border-light: ${styles.borderLight};\n`;
        css += `  --border-medium: ${styles.borderMedium};\n`;
        css += `  --border-dark: ${styles.borderDark};\n`;

        // Breakpoints
        css += `  --mobile-breakpoint: ${styles.mobileBreakpoint}px;\n`;
        css += `  --tablet-breakpoint: ${styles.tabletBreakpoint}px;\n`;
        css += `  --desktop-breakpoint: ${styles.desktopBreakpoint}px;\n`;

        css += '}\n\n';

        // Component Styles
        css += `body {\n`;
        css += `  font-family: var(--font-primary);\n`;
        css += `  font-size: var(--font-size-base);\n`;
        css += `  line-height: var(--line-height);\n`;
        css += `  color: var(--text-primary);\n`;

        if (styles.bgType === 'solid') {
            css += `  background-color: var(--bg-color);\n`;
        } else if (styles.bgType === 'gradient') {
            css += `  background: var(--bg-gradient);\n`;
        } else if (styles.bgType === 'image') {
            css += `  background-image: var(--bg-image);\n`;
            css += `  background-size: cover;\n`;
            css += `  background-position: center;\n`;
        }

        css += `}\n\n`;

        // Navigation
        css += `.nav {\n`;
        css += `  height: var(--nav-height);\n`;
        css += `  position: ${styles.navPosition};\n`;
        if (styles.navPosition === 'fixed') {
            css += `  top: 0;\n  left: 0;\n  right: 0;\n  z-index: 1000;\n`;
        }
        css += `}\n\n`;

        // Container
        css += `.container {\n`;
        css += `  max-width: var(--container-max-width);\n`;
        css += `  padding: 0 var(--container-padding);\n`;
        css += `  margin: 0 auto;\n`;
        css += `}\n\n`;

        // Grid
        css += `.card-grid {\n`;
        css += `  display: grid;\n`;
        css += `  grid-template-columns: repeat(${styles.cardColumns}, 1fr);\n`;
        css += `  gap: var(--grid-gap);\n`;
        css += `}\n\n`;

        // Typography
        css += `h1 { font-size: var(--font-size-h1); font-weight: var(--font-weight-heading); }\n`;
        css += `h2 { font-size: var(--font-size-h2); font-weight: var(--font-weight-heading); }\n`;
        css += `h3 { font-size: var(--font-size-h3); font-weight: var(--font-weight-heading); }\n\n`;

        // Buttons
        css += `.btn {\n`;
        css += `  border-radius: var(--button-radius);\n`;
        css += `  padding: var(--button-padding);\n`;
        if (styles.buttonShadow && styles.enableShadows) {
            css += `  box-shadow: var(--button-shadow);\n`;
        }
        if (styles.enableTransitions) {
            css += `  transition: all var(--transition-duration) var(--transition-easing);\n`;
        }
        css += `}\n\n`;

        // Button hover effects
        if (styles.buttonHover === 'scale' && styles.enableAnimations) {
            css += `.btn:hover { transform: scale(${styles.buttonHoverScale}); }\n`;
        } else if (styles.buttonHover === 'shadow' && styles.enableShadows) {
            css += `.btn:hover { box-shadow: 0 ${styles.hoverShadow}px ${styles.hoverShadow * 2}px rgba(0,0,0,0.2); }\n`;
        }
        css += '\n';

        // Cards
        css += `.card {\n`;
        css += `  border-radius: var(--card-radius);\n`;
        css += `  padding: var(--card-padding);\n`;
        if (styles.enableShadows) {
            css += `  box-shadow: var(--card-shadow);\n`;
        }
        if (styles.enableTransitions) {
            css += `  transition: all var(--transition-duration) var(--transition-easing);\n`;
        }
        css += `}\n\n`;

        // Card hover
        if (styles.enableAnimations) {
            css += `.card:hover { transform: scale(${styles.cardHoverScale}); }\n\n`;
        }

        // Inputs
        css += `.form-control {\n`;
        css += `  border-radius: var(--input-radius);\n`;
        css += `  height: var(--input-height);\n`;
        css += `  border-style: ${styles.inputBorder};\n`;
        css += `}\n\n`;

        // Modal
        css += `.modal-content {\n`;
        css += `  border-radius: var(--modal-radius);\n`;
        css += `}\n\n`;

        css += `.modal-backdrop {\n`;
        css += `  opacity: ${styles.modalBackdrop / 100};\n`;
        css += `}\n\n`;

        // Responsive
        css += `@media (max-width: var(--mobile-breakpoint)) {\n`;
        css += `  .card-grid { grid-template-columns: 1fr; }\n`;
        css += `}\n\n`;

        css += `@media (max-width: var(--tablet-breakpoint)) {\n`;
        css += `  .card-grid { grid-template-columns: repeat(2, 1fr); }\n`;
        css += `}\n\n`;

        // Accessibility
        if (styles.reducedMotion) {
            css += `@media (prefers-reduced-motion: reduce) {\n`;
            css += `  *, *::before, *::after {\n`;
            css += `    animation-duration: 0.01ms !important;\n`;
            css += `    animation-iteration-count: 1 !important;\n`;
            css += `    transition-duration: 0.01ms !important;\n`;
            css += `  }\n`;
            css += `}\n\n`;
        }

        if (styles.focusIndicators) {
            css += `*:focus {\n`;
            css += `  outline: 3px solid var(--primary-color);\n`;
            css += `  outline-offset: 2px;\n`;
            css += `}\n\n`;
        }

        // Custom CSS
        if (styles.customCSS) {
            css += '/* Custom CSS */\n';
            css += styles.customCSS + '\n';
        }

        return css;
    },

    // Update live preview
    updateStylePreview() {
        if (!this.previewMode) return;

        const iframe = document.getElementById('previewFrame');
        if (!iframe || !iframe.contentDocument) return;

        const css = this.generateCSS();

        // Remove existing custom styles
        const existingStyle = iframe.contentDocument.getElementById('custom-preview-styles');
        if (existingStyle) {
            existingStyle.remove();
        }

        // Add new styles
        const styleElement = iframe.contentDocument.createElement('style');
        styleElement.id = 'custom-preview-styles';
        styleElement.textContent = css;
        iframe.contentDocument.head.appendChild(styleElement);
    },

    // Toggle preview panel
    togglePreview() {
        this.previewMode = !this.previewMode;
        const panel = document.getElementById('previewPanel');
        const button = document.getElementById('previewToggle');

        if (this.previewMode) {
            panel?.classList.add('active');
            button?.classList.add('active');
            this.updateStylePreview();
            console.log('👁️ Preview mode enabled');
        } else {
            panel?.classList.remove('active');
            button?.classList.remove('active');
            console.log('👁️ Preview mode disabled');
        }
    },

    // Close preview panel
    closePreview() {
        this.previewMode = false;
        document.getElementById('previewPanel')?.classList.remove('active');
        document.getElementById('previewToggle')?.classList.remove('active');
    },

    // Switch preview device
    switchPreviewDevice(device) {
        document.querySelectorAll('.preview-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-device="${device}"]`)?.classList.add('active');

        const iframe = document.getElementById('previewFrame');
        if (!iframe) return;

        // Set iframe size based on device
        switch(device) {
            case 'mobile':
                iframe.style.width = '375px';
                iframe.style.height = '667px';
                break;
            case 'tablet':
                iframe.style.width = '768px';
                iframe.style.height = '1024px';
                break;
            case 'desktop':
            default:
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                break;
        }

        console.log(`📱 Preview device switched to: ${device}`);
    },

    // Save styles to database
    async saveStyles() {
        if (!supabase) {
            console.warn('⚠️ Supabase not configured, saving to localStorage');
            localStorage.setItem('websiteStyles', JSON.stringify(this.currentStyles));
            this.showMessage('Styles saved locally!', 'success');
            this.isDirty = false;
            return;
        }

        try {
            const button = document.getElementById('saveStyles');
            button?.classList.add('loading');

            const { data, error } = await supabase
                .from('website_styles')
                .upsert({
                    id: 1,
                    styles: this.currentStyles,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            this.showMessage('Styles saved successfully!', 'success');
            this.isDirty = false;
            console.log('💾 Styles saved to database');
        } catch (error) {
            console.error('❌ Error saving styles:', error);
            this.showMessage('Error saving styles: ' + error.message, 'error');
        } finally {
            document.getElementById('saveStyles')?.classList.remove('loading');
        }
    },

    // Load saved styles from database
    async loadSavedStyles() {
        if (!supabase) {
            const saved = localStorage.getItem('websiteStyles');
            if (saved) {
                try {
                    this.currentStyles = { ...this.originalStyles, ...JSON.parse(saved) };
                    this.populateFormInputs();
                    console.log('📂 Styles loaded from localStorage');
                } catch (error) {
                    console.error('❌ Error loading styles from localStorage:', error);
                }
            }
            return;
        }

        try {
            const { data, error } = await supabase
                .from('website_styles')
                .select('styles')
                .eq('id', 1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data?.styles) {
                this.currentStyles = { ...this.originalStyles, ...data.styles };
                this.populateFormInputs();
                console.log('📂 Styles loaded from database');
            }
        } catch (error) {
            console.error('❌ Error loading styles:', error);
        }
    },

    // Populate form inputs with current values
    populateFormInputs() {
        Object.entries(this.currentStyles).forEach(([key, value]) => {
            const input = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
            if (!input) return;

            if (input.type === 'checkbox') {
                input.checked = value;
            } else {
                input.value = value;

                // Update color input text
                const textInput = input.parentElement?.querySelector('.color-input');
                if (textInput && input.type === 'color') {
                    textInput.value = value;
                }
            }
        });

        this.updateRangeValues();
        this.handleBgTypeChange({ target: { value: this.currentStyles.bgType } });
    },

    // Show reset confirmation modal
    showResetModal() {
        document.getElementById('resetModal')?.classList.add('active');
    },

    // Hide reset confirmation modal
    hideResetModal() {
        document.getElementById('resetModal')?.classList.remove('active');
    },

    // Reset styles to original
    resetStyles() {
        this.currentStyles = { ...this.originalStyles };
        this.populateFormInputs();
        this.updateStylePreview();
        this.hideResetModal();
        this.markAsDirty();
        this.showMessage('Styles reset to original values!', 'info');
        console.log('🔄 Styles reset to original');
    },

    // Show export modal
    showExportModal() {
        const css = this.generateCSS();
        document.getElementById('exportCode').value = css;
        document.getElementById('exportModal')?.classList.add('active');
    },

    // Hide export modal
    hideExportModal() {
        document.getElementById('exportModal')?.classList.remove('active');
    },

    // Copy export code to clipboard
    async copyExportCode() {
        const code = document.getElementById('exportCode').value;
        try {
            await navigator.clipboard.writeText(code);
            this.showMessage('CSS copied to clipboard!', 'success');
        } catch (error) {
            console.error('❌ Error copying to clipboard:', error);
            this.showMessage('Error copying to clipboard', 'error');
        }
    },

    // Download export code as file
    downloadExportCode() {
        const code = document.getElementById('exportCode').value;
        const blob = new Blob([code], { type: 'text/css' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'website-styles.css';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showMessage('CSS file downloaded!', 'success');
    },

    // Import styles
    importStyles() {
        document.getElementById('importFile')?.click();
    },

    // Handle file import
    handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let data;

                if (file.type === 'application/json') {
                    data = JSON.parse(e.target.result);
                } else if (file.type === 'text/css') {
                    // Parse CSS variables (basic implementation)
                    data = this.parseCSSVariables(e.target.result);
                } else {
                    throw new Error('Unsupported file type');
                }

                this.currentStyles = { ...this.originalStyles, ...data };
                this.populateFormInputs();
                this.updateStylePreview();
                this.markAsDirty();
                this.showMessage('Styles imported successfully!', 'success');
                console.log('📥 Styles imported');
            } catch (error) {
                console.error('❌ Error importing styles:', error);
                this.showMessage('Error importing file: ' + error.message, 'error');
            }
        };

        reader.readAsText(file);
        e.target.value = ''; // Reset input
    },

    // Parse CSS variables from CSS text
    parseCSSVariables(css) {
        const variables = {};
        const rootMatch = css.match(/:root\s*{([^}]*)}/);

        if (rootMatch) {
            const variableMatches = rootMatch[1].match(/--[\w-]+:\s*[^;]+/g);
            if (variableMatches) {
                variableMatches.forEach(match => {
                    const [name, value] = match.split(':');
                    const cleanName = name.replace('--', '').trim();
                    const cleanValue = value.replace(/;$/, '').trim();

                    // Map CSS variables back to our property names
                    const mappings = {
                        'primary-color': 'primaryColor',
                        'secondary-color': 'secondaryColor',
                        'accent-color': 'accentColor',
                        // Add more mappings as needed
                    };

                    const propName = mappings[cleanName] || cleanName;
                    variables[propName] = cleanValue;
                });
            }
        }

        return variables;
    },

    // Duplicate current theme
    duplicateTheme() {
        const timestamp = new Date().toLocaleString();
        const themeName = `Custom Theme ${timestamp}`;
        const themeData = { ...this.currentStyles };

        // Save to localStorage for simplicity
        const savedThemes = JSON.parse(localStorage.getItem('customThemes') || '{}');
        savedThemes[themeName] = themeData;
        localStorage.setItem('customThemes', JSON.stringify(savedThemes));

        this.showMessage(`Theme "${themeName}" saved!`, 'success');
        console.log(`💾 Theme duplicated: ${themeName}`);
    },

    // Format custom CSS
    formatCustomCSS() {
        const textarea = document.getElementById('customCSS');
        if (!textarea) return;

        let css = textarea.value;

        // Basic CSS formatting
        css = css
            .replace(/\{/g, ' {\n  ')
            .replace(/;/g, ';\n  ')
            .replace(/\}/g, '\n}\n')
            .replace(/\n\s*\n/g, '\n')
            .trim();

        textarea.value = css;
        this.currentStyles.customCSS = css;
        this.updateStylePreview();
        this.showMessage('CSS formatted!', 'info');
    },

    // Validate custom CSS
    validateCustomCSS() {
        const css = document.getElementById('customCSS')?.value || '';

        // Basic validation - check for unclosed braces
        const openBraces = (css.match(/\{/g) || []).length;
        const closeBraces = (css.match(/\}/g) || []).length;

        if (openBraces !== closeBraces) {
            this.showMessage('CSS validation failed: Unmatched braces', 'error');
            return;
        }

        // Check for basic syntax errors
        const lines = css.split('\n');
        const errors = [];

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.match(/^[\w\s\-#.,():>~+*\[\]="']+[{};]?$/)) {
                errors.push(`Line ${index + 1}: Possible syntax error`);
            }
        });

        if (errors.length > 0) {
            this.showMessage(`CSS validation warnings: ${errors.length} issues found`, 'warning');
            console.log('⚠️ CSS validation warnings:', errors);
        } else {
            this.showMessage('CSS validation passed!', 'success');
        }
    },

    // Mark styles as dirty (unsaved changes)
    markAsDirty() {
        this.isDirty = true;
        const saveButton = document.getElementById('saveStyles');
        if (saveButton) {
            saveButton.style.background = 'var(--warning-color)';
            saveButton.title = 'You have unsaved changes';
        }
    },

    // Utility: Check if color is valid
    isValidColor(color) {
        const style = new Option().style;
        style.color = color;
        return style.color !== '';
    },

    // Show message to user
    showMessage(text, type = 'info') {
        const container = document.getElementById('messageContainer');
        if (!container) return;

        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;

        container.appendChild(message);

        // Auto remove after 3 seconds
        setTimeout(() => {
            message.remove();
        }, 3000);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    StyleManager.init();
});

// Warn before leaving with unsaved changes
window.addEventListener('beforeunload', (e) => {
    if (StyleManager.isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
});

// Export for global access
window.StyleManager = StyleManager;
