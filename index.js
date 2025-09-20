// Enhanced Gaming Platform JavaScript
// Supabase Configuration
const SUPABASE_URL = 'https://spurpwnaeacgwojfpaem.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdXJwd25hZWFjZ3dvamZwYWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMjU2MDYsImV4cCI6MjA3MzkwMTYwNn0.VTKl3ZU6xVKcn3Ry1XTtY-Fpvm0cVqZiQcloJc33O-Y';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global Variables
let currentCarousels = {};
let currentProduct = null;
let currentVoucherMenus = [];
let selectedVoucherMenu = null;
let orderData = {};

// DOM Elements
const categoryGrid = document.querySelector('.category-grid');
const productGrid = document.querySelector('.product-grid');
const voucherOptionsContainer = document.querySelector('.voucher-options');
const gameIdModal = document.getElementById('gameIdModal');
const paymentModal = document.getElementById('paymentModal');
const confirmModal = document.getElementById('confirmModal');
const imageViewerModal = document.getElementById('imageViewerModal');
const voucherSelectModal = document.getElementById('voucherSelectModal');

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadCategories();
    loadWebsiteLogo();
    startRealTimeUpdates();
});

// Application Initialization
async function initializeApp() {
    try {
        // Initialize Swiper for any existing carousels
        initializeCarousels();

        // Load initial data
        await Promise.all([
            loadCategories(),
            loadWebsiteLogo(),
            loadStyleSettings()
        ]);

        console.log('Gaming platform initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Error initializing application', 'error');
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Category selection
    document.addEventListener('click', handleCategoryClick);

    // Product selection
    document.addEventListener('click', handleProductClick);

    // Voucher option selection
    document.addEventListener('click', handleVoucherOptionClick);

    // Modal interactions
    setupModalListeners();

    // Form submissions
    setupFormListeners();

    // Image viewer
    setupImageViewerListeners();

    // Navigation
    setupNavigationListeners();
}

// Category Management
async function loadCategories() {
    try {
        const { data: categories, error } = await supabase
            .from('page_icons')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;

        displayCategories(categories);
    } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback to default categories
        displayDefaultCategories();
    }
}

function displayCategories(categories) {
    categoryGrid.innerHTML = '';

    categories.forEach(category => {
        const categoryCard = createCategoryCard(category);
        categoryGrid.appendChild(categoryCard);
    });
}

function createCategoryCard(category) {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.dataset.category = category.page_name;

    card.innerHTML = `
        <div class="category-icon">
            <img src="${category.icon_url || '/assets/icons/default.png'}" alt="${category.display_name}">
        </div>
        <div class="category-title">${category.display_name}</div>
    `;

    return card;
}

function displayDefaultCategories() {
    const defaultCategories = [
        { page_name: 'pubg', display_name: 'PUBG Mobile', icon: 'pubg-icon.png' },
        { page_name: 'ml', display_name: 'Mobile Legends', icon: 'ml-icon.png' },
        { page_name: 'telegram', display_name: 'Telegram Premium', icon: 'telegram-icon.png' },
        { page_name: 'all', display_name: 'All Products', icon: 'all-icon.png' }
    ];

    displayCategories(defaultCategories);
}

// Product Management
async function loadProducts(category) {
    try {
        showLoading(true);

        let query = supabase
            .from('products')
            .select('*')
            .eq('status', 'active');

        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        const { data: products, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error loading products', 'error');
    } finally {
        showLoading(false);
    }
}

function displayProducts(products) {
    productGrid.innerHTML = '';

    if (products.length === 0) {
        productGrid.innerHTML = '<div class="no-products">No products available</div>';
        return;
    }

    products.forEach(product => {
        const productCard = createProductCard(product);
        productGrid.appendChild(productCard);
    });

    // Initialize carousels for new products
    setTimeout(() => initializeCarousels(), 100);
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;

    const images = product.images || [];
    const carouselId = `carousel-${product.id}`;

    card.innerHTML = `
        <div class="product-image">
            ${createCarouselHTML(images, carouselId)}
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-price">${formatPrice(product.price)} MMK</div>
            <button class="btn-primary select-product" data-product-id="${product.id}">
                Select Product
            </button>
        </div>
    `;

    return card;
}

function createCarouselHTML(images, carouselId) {
    if (!images || images.length === 0) {
        return '<img src="/assets/images/placeholder.png" alt="Product" class="single-image">';
    }

    if (images.length === 1) {
        return `<img src="${images[0]}" alt="Product" class="single-image clickable-image" data-images='${JSON.stringify(images)}' data-index="0">`;
    }

    return `
        <div class="swiper product-carousel" id="${carouselId}">
            <div class="swiper-wrapper">
                ${images.map((image, index) => `
                    <div class="swiper-slide">
                        <img src="${image}" alt="Product ${index + 1}" class="clickable-image" 
                             data-images='${JSON.stringify(images)}' data-index="${index}">
                    </div>
                `).join('')}
            </div>
            <div class="swiper-pagination"></div>
            <div class="swiper-button-next"></div>
            <div class="swiper-button-prev"></div>
        </div>
    `;
}

// Carousel Management
function initializeCarousels() {
    const carousels = document.querySelectorAll('.product-carousel');

    carousels.forEach(carousel => {
        const carouselId = carousel.id;

        if (currentCarousels[carouselId]) {
            currentCarousels[carouselId].destroy(true, true);
        }

        currentCarousels[carouselId] = new Swiper(`#${carouselId}`, {
            loop: true,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            }
        });
    });
}

// Voucher System
async function loadVoucherMenus(productId) {
    try {
        const { data: menus, error } = await supabase
            .from('voucher_menus')
            .select('*')
            .eq('product_id', productId)
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;

        currentVoucherMenus = menus;
        displayVoucherOptions(menus);

        return menus;
    } catch (error) {
        console.error('Error loading voucher menus:', error);
        showNotification('Error loading voucher options', 'error');
        return [];
    }
}

function displayVoucherOptions(menus) {
    voucherOptionsContainer.innerHTML = '';

    if (menus.length === 0) {
        voucherOptionsContainer.innerHTML = '<div class="no-vouchers">No voucher options available</div>';
        return;
    }

    menus.forEach(menu => {
        const optionCard = createVoucherOptionCard(menu);
        voucherOptionsContainer.appendChild(optionCard);
    });
}

function createVoucherOptionCard(menu) {
    const card = document.createElement('div');
    card.className = 'voucher-option-card';
    card.dataset.menuId = menu.id;

    card.innerHTML = `
        <div class="voucher-icon">
            <img src="${menu.icon_url || '/assets/icons/voucher-default.png'}" alt="${menu.name}">
        </div>
        <div class="voucher-info">
            <h4 class="voucher-name">${menu.name}</h4>
            <div class="voucher-price">${formatPrice(menu.price)} MMK</div>
        </div>
        <div class="voucher-select">
            <button class="btn-voucher select-voucher" data-menu-id="${menu.id}">
                Select
            </button>
        </div>
    `;

    return card;
}

// Event Handlers
function handleCategoryClick(event) {
    const categoryCard = event.target.closest('.category-card');
    if (!categoryCard) return;

    const category = categoryCard.dataset.category;

    // Update active state
    document.querySelectorAll('.category-card').forEach(card => {
        card.classList.remove('active');
    });
    categoryCard.classList.add('active');

    // Load products for selected category
    loadProducts(category);
}

function handleProductClick(event) {
    const selectButton = event.target.closest('.select-product');
    if (!selectButton) return;

    const productId = selectButton.dataset.productId;
    selectProduct(productId);
}

function handleVoucherOptionClick(event) {
    const selectButton = event.target.closest('.select-voucher');
    if (!selectButton) return;

    const menuId = selectButton.dataset.menuId;
    selectVoucherMenu(menuId);
}

async function selectProduct(productId) {
    try {
        showLoading(true);

        // Load product details
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error) throw error;

        currentProduct = product;
        orderData.product_id = productId;
        orderData.product_name = product.name;
        orderData.base_price = product.price;

        // Check if product has voucher menus
        const menus = await loadVoucherMenus(productId);

        if (menus.length > 0) {
            // Show voucher selection modal
            showVoucherSelectModal();
        } else {
            // Direct to game ID verification
            orderData.total_price = product.price;
            showGameIdModal();
        }

    } catch (error) {
        console.error('Error selecting product:', error);
        showNotification('Error selecting product', 'error');
    } finally {
        showLoading(false);
    }
}

function selectVoucherMenu(menuId) {
    const menu = currentVoucherMenus.find(m => m.id === menuId);
    if (!menu) return;

    selectedVoucherMenu = menu;
    orderData.voucher_menu_id = menuId;
    orderData.voucher_name = menu.name;
    orderData.voucher_price = menu.price;
    orderData.total_price = menu.price;

    // Update UI to show selection
    document.querySelectorAll('.voucher-option-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-menu-id="${menuId}"]`).closest('.voucher-option-card').classList.add('selected');

    // Hide voucher modal and show game ID modal
    hideVoucherSelectModal();
    showGameIdModal();
}

// Modal Management
function setupModalListeners() {
    // Game ID Modal
    const gameIdForm = document.getElementById('gameIdForm');
    gameIdForm?.addEventListener('submit', handleGameIdSubmit);

    // Payment Modal
    const paymentForm = document.getElementById('paymentForm');
    paymentForm?.addEventListener('submit', handlePaymentSubmit);

    // Modal close buttons
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(element => {
        element.addEventListener('click', closeModals);
    });

    // Payment method selection
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', handlePaymentMethodChange);
    });
}

function showVoucherSelectModal() {
    voucherSelectModal.classList.add('show');
    document.body.classList.add('modal-open');
}

function hideVoucherSelectModal() {
    voucherSelectModal.classList.remove('show');
    document.body.classList.remove('modal-open');
}

function showGameIdModal() {
    // Update modal content based on product category
    updateGameIdModalContent();
    gameIdModal.classList.add('show');
    document.body.classList.add('modal-open');
}

function updateGameIdModalContent() {
    const category = currentProduct.category;
    const gameIdInput = document.getElementById('gameId');
    const serverIdGroup = document.getElementById('serverIdGroup');
    const zoneIdGroup = document.getElementById('zoneIdGroup');
    const telegramLinkGroup = document.getElementById('telegramLinkGroup');

    // Reset visibility
    serverIdGroup.style.display = 'none';
    zoneIdGroup.style.display = 'none';
    telegramLinkGroup.style.display = 'none';

    switch(category) {
        case 'ml':
            gameIdInput.placeholder = 'Enter Mobile Legends Game ID';
            serverIdGroup.style.display = 'block';
            zoneIdGroup.style.display = 'block';
            break;
        case 'telegram':
            gameIdInput.placeholder = 'Enter Telegram Username';
            telegramLinkGroup.style.display = 'block';
            break;
        default:
            gameIdInput.placeholder = 'Enter Game ID';
    }
}

function showPaymentModal() {
    paymentModal.classList.add('show');
    updateOrderSummary();
}

function showConfirmModal() {
    confirmModal.classList.add('show');
    updateConfirmationDetails();
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
    document.body.classList.remove('modal-open');
}

// Form Handlers
async function handleGameIdSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const gameId = formData.get('gameId');
    const serverId = formData.get('serverId');
    const zoneId = formData.get('zoneId');
    const telegramLink = formData.get('telegramLink');

    // Validate based on product category
    if (!validateGameIdInput(gameId, currentProduct.category)) {
        return;
    }

    // Store game information
    orderData.game_id = gameId;
    if (serverId) orderData.server_id = serverId;
    if (zoneId) orderData.zone_id = zoneId;
    if (telegramLink) orderData.telegram_link = telegramLink;

    // Close game ID modal and show payment modal
    closeModals();
    showPaymentModal();
}

function validateGameIdInput(gameId, category) {
    if (!gameId.trim()) {
        showNotification('Please enter a valid Game ID', 'error');
        return false;
    }

    switch(category) {
        case 'ml':
            // Mobile Legends ID validation (numeric, 6-12 digits)
            if (!/^\d{6,12}$/.test(gameId)) {
                showNotification('Mobile Legends Game ID should be 6-12 digits', 'error');
                return false;
            }
            break;
        case 'pubg':
            // PUBG ID validation (numeric, 8-12 digits)
            if (!/^\d{8,12}$/.test(gameId)) {
                showNotification('PUBG Game ID should be 8-12 digits', 'error');
                return false;
            }
            break;
    }

    return true;
}

async function handlePaymentSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const paymentMethod = formData.get('paymentMethod');

    if (!paymentMethod) {
        showNotification('Please select a payment method', 'error');
        return;
    }

    orderData.payment_method = paymentMethod;

    // Create order
    try {
        showLoading(true);
        await createOrder();

        // Close payment modal and show confirmation
        closeModals();
        showConfirmModal();

    } catch (error) {
        console.error('Error creating order:', error);
        showNotification('Error creating order', 'error');
    } finally {
        showLoading(false);
    }
}

// Order Management
async function createOrder() {
    const orderPayload = {
        product_id: orderData.product_id,
        voucher_menu_id: orderData.voucher_menu_id || null,
        game_id: orderData.game_id,
        server_id: orderData.server_id || null,
        zone_id: orderData.zone_id || null,
        telegram_link: orderData.telegram_link || null,
        total_price: orderData.total_price,
        payment_method: orderData.payment_method,
        status: 'pending'
    };

    const { data: order, error } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

    if (error) throw error;

    orderData.order_id = order.order_id;
    orderData.created_at = order.created_at;

    return order;
}

// Image Viewer
function setupImageViewerListeners() {
    let currentImageIndex = 0;
    let currentImages = [];

    // Click to expand images
    document.addEventListener('click', function(event) {
        const clickableImage = event.target.closest('.clickable-image');
        if (!clickableImage) return;

        currentImages = JSON.parse(clickableImage.dataset.images);
        currentImageIndex = parseInt(clickableImage.dataset.index);

        showImageViewer();
    });

    // Image navigation
    document.getElementById('prevImage')?.addEventListener('click', function() {
        currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
        updateImageViewer();
    });

    document.getElementById('nextImage')?.addEventListener('click', function() {
        currentImageIndex = (currentImageIndex + 1) % currentImages.length;
        updateImageViewer();
    });

    function showImageViewer() {
        updateImageViewer();
        imageViewerModal.classList.add('show');
        document.body.classList.add('modal-open');
    }

    function updateImageViewer() {
        const viewerImage = document.getElementById('viewerImage');
        const imageCounter = document.getElementById('imageCounter');

        viewerImage.src = currentImages[currentImageIndex];
        imageCounter.textContent = `${currentImageIndex + 1} / ${currentImages.length}`;

        // Hide navigation if only one image
        const prevBtn = document.getElementById('prevImage');
        const nextBtn = document.getElementById('nextImage');

        if (currentImages.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'block';
            nextBtn.style.display = 'block';
        }
    }
}

// Website Settings
async function loadWebsiteLogo() {
    try {
        const { data: settings, error } = await supabase
            .from('website_settings')
            .select('logo_url')
            .eq('key', 'site_logo')
            .single();

        if (settings && settings.logo_url) {
            const logoElements = document.querySelectorAll('.site-logo img');
            logoElements.forEach(img => {
                img.src = settings.logo_url;
            });
        }
    } catch (error) {
        console.log('Using default logo');
    }
}

async function loadStyleSettings() {
    try {
        const { data: settings, error } = await supabase
            .from('style_settings')
            .select('*');

        if (error) throw error;

        applyStyleSettings(settings);
    } catch (error) {
        console.log('Using default styles');
    }
}

function applyStyleSettings(settings) {
    const root = document.documentElement;

    settings.forEach(setting => {
        if (setting.property_name && setting.property_value) {
            root.style.setProperty(setting.property_name, setting.property_value);
        }
    });
}

// Real-time Updates
function startRealTimeUpdates() {
    // Subscribe to product changes
    supabase
        .channel('products')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'products' }, 
            () => {
                // Reload current products
                const activeCategory = document.querySelector('.category-card.active');
                if (activeCategory) {
                    loadProducts(activeCategory.dataset.category);
                }
            }
        )
        .subscribe();

    // Subscribe to style changes
    supabase
        .channel('styles')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'style_settings' }, 
            () => {
                loadStyleSettings();
            }
        )
        .subscribe();

    // Subscribe to website settings
    supabase
        .channel('website')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'website_settings' }, 
            () => {
                loadWebsiteLogo();
            }
        )
        .subscribe();
}

// Utility Functions
function formatPrice(price) {
    return new Intl.NumberFormat('en-US').format(price);
}

function showLoading(show) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto-hide after 5 seconds
    setTimeout(() => hideNotification(notification), 5000);

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        hideNotification(notification);
    });
}

function hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function updateOrderSummary() {
    const summaryProduct = document.getElementById('summaryProduct');
    const summaryVoucher = document.getElementById('summaryVoucher');
    const summaryGameId = document.getElementById('summaryGameId');
    const summaryTotal = document.getElementById('summaryTotal');

    summaryProduct.textContent = orderData.product_name;
    summaryVoucher.textContent = orderData.voucher_name || 'Base Product';
    summaryGameId.textContent = orderData.game_id;
    summaryTotal.textContent = `${formatPrice(orderData.total_price)} MMK`;
}

function updateConfirmationDetails() {
    const confirmOrderId = document.getElementById('confirmOrderId');
    const confirmProduct = document.getElementById('confirmProduct');
    const confirmTotal = document.getElementById('confirmTotal');
    const confirmGameId = document.getElementById('confirmGameId');

    confirmOrderId.textContent = orderData.order_id;
    confirmProduct.textContent = orderData.product_name;
    confirmTotal.textContent = `${formatPrice(orderData.total_price)} MMK`;
    confirmGameId.textContent = orderData.game_id;
}

function handlePaymentMethodChange(event) {
    const method = event.target.value;
    const paymentInfo = document.getElementById('paymentInfo');

    let infoHTML = '';

    switch(method) {
        case 'kpay':
            infoHTML = `
                <div class="payment-details">
                    <h4>KBZ Pay Instructions</h4>
                    <p>1. Open your KBZ Pay app</p>
                    <p>2. Scan the QR code or send money to: <strong>09xxxxxxxx</strong></p>
                    <p>3. Enter the exact amount: <strong>${formatPrice(orderData.total_price)} MMK</strong></p>
                    <p>4. Complete the payment and submit this form</p>
                </div>
            `;
            break;
        case 'wavepay':
            infoHTML = `
                <div class="payment-details">
                    <h4>Wave Pay Instructions</h4>
                    <p>1. Open your Wave Pay app</p>
                    <p>2. Send money to: <strong>09xxxxxxxx</strong></p>
                    <p>3. Enter the exact amount: <strong>${formatPrice(orderData.total_price)} MMK</strong></p>
                    <p>4. Complete the payment and submit this form</p>
                </div>
            `;
            break;
        case 'ayapay':
            infoHTML = `
                <div class="payment-details">
                    <h4>AYA Pay Instructions</h4>
                    <p>1. Open your AYA Pay app</p>
                    <p>2. Send money to: <strong>09xxxxxxxx</strong></p>
                    <p>3. Enter the exact amount: <strong>${formatPrice(orderData.total_price)} MMK</strong></p>
                    <p>4. Complete the payment and submit this form</p>
                </div>
            `;
            break;
    }

    paymentInfo.innerHTML = infoHTML;
}

// Navigation
function setupNavigationListeners() {
    // Back to categories
    document.getElementById('backToCategories')?.addEventListener('click', function() {
        document.querySelector('.categories-section').style.display = 'block';
        document.querySelector('.products-section').style.display = 'none';

        // Clear active category
        document.querySelectorAll('.category-card').forEach(card => {
            card.classList.remove('active');
        });
    });

    // Order tracking
    document.getElementById('trackOrderBtn')?.addEventListener('click', function() {
        const orderId = prompt('Enter your Order ID:');
        if (orderId) {
            trackOrder(orderId);
        }
    });
}

async function trackOrder(orderId) {
    try {
        showLoading(true);

        const { data: order, error } = await supabase
            .from('orders')
            .select(`
                *,
                products (name),
                voucher_menus (name)
            `)
            .eq('order_id', orderId)
            .single();

        if (error) throw error;

        if (!order) {
            showNotification('Order not found', 'error');
            return;
        }

        displayOrderStatus(order);

    } catch (error) {
        console.error('Error tracking order:', error);
        showNotification('Error tracking order', 'error');
    } finally {
        showLoading(false);
    }
}

function displayOrderStatus(order) {
    const statusModal = document.createElement('div');
    statusModal.className = 'modal show';
    statusModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Order Status</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="order-status-card">
                    <div class="status-badge status-${order.status}">
                        ${order.status.toUpperCase()}
                    </div>
                    <div class="order-details">
                        <p><strong>Order ID:</strong> ${order.order_id}</p>
                        <p><strong>Product:</strong> ${order.products.name}</p>
                        ${order.voucher_menus ? `<p><strong>Voucher:</strong> ${order.voucher_menus.name}</p>` : ''}
                        <p><strong>Game ID:</strong> ${order.game_id}</p>
                        <p><strong>Amount:</strong> ${formatPrice(order.total_price)} MMK</p>
                        <p><strong>Payment Method:</strong> ${order.payment_method.toUpperCase()}</p>
                        <p><strong>Created:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                        ${order.admin_notes ? `<p><strong>Notes:</strong> ${order.admin_notes}</p>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(statusModal);
    document.body.classList.add('modal-open');

    statusModal.querySelector('.modal-close').addEventListener('click', function() {
        document.body.removeChild(statusModal);
        document.body.classList.remove('modal-open');
    });
}

// Export for global access
window.GamingPlatform = {
    loadCategories,
    loadProducts,
    selectProduct,
    trackOrder,
    showNotification
};
