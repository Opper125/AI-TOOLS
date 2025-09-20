// Enhanced Gaming Platform Admin JavaScript
// Supabase Configuration
const SUPABASE_URL = 'https://spurpwnaeacgwojfpaem.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdXJwd25hZWFjZ3dvamZwYWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMjU2MDYsImV4cCI6MjA3MzkwMTYwNn0.VTKl3ZU6xVKcn3Ry1XTtY-Fpvm0cVqZiQcloJc33O-Y';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global Variables
let currentOrderId = null;
let productImages = [];
let newsImages = [];
let currentVoucherProductId = null;

// DOM Elements
const loader = document.getElementById('loader');
const notificationContainer = document.getElementById('notificationContainer');

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
    setupEventListeners();
    loadInitialData();
});

// Application Initialization
async function initializeAdmin() {
    try {
        console.log('Initializing admin panel...');

        // Load all initial data
        await Promise.all([
            loadAdminStats(),
            loadProducts(),
            loadOrders(),
            loadNews(),
            loadPageIcons(),
            loadWebsiteSettings(),
            loadPaymentSettings()
        ]);

        console.log('Admin panel initialized successfully');
    } catch (error) {
        console.error('Error initializing admin:', error);
        showNotification('Error initializing admin panel', 'error');
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Tab switching
    setupTabListeners();

    // Modal listeners
    setupModalListeners();

    // Form listeners
    setupFormListeners();

    // Filter listeners
    setupFilterListeners();

    // Real-time updates
    startRealTimeUpdates();
}

function setupTabListeners() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });
}

function setupModalListeners() {
    // Modal close functionality
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(element => {
        element.addEventListener('click', function(e) {
            const modal = e.target.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });

    // Prevent modal close when clicking modal content
    document.querySelectorAll('.modal-content').forEach(content => {
        content.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
}

function setupFormListeners() {
    // Product form
    const productForm = document.getElementById('productForm');
    productForm?.addEventListener('submit', handleProductSubmit);

    // Voucher menu form
    const voucherMenuForm = document.getElementById('voucherMenuForm');
    voucherMenuForm?.addEventListener('submit', handleVoucherMenuSubmit);

    // News form
    const newsForm = document.getElementById('newsForm');
    newsForm?.addEventListener('submit', handleNewsSubmit);

    // Page icon form
    const pageIconForm = document.getElementById('pageIconForm');
    pageIconForm?.addEventListener('submit', handlePageIconSubmit);
}

function setupFilterListeners() {
    // Product filters
    document.getElementById('productCategoryFilter')?.addEventListener('change', filterProducts);
    document.getElementById('productStatusFilter')?.addEventListener('change', filterProducts);
    document.getElementById('productSearchInput')?.addEventListener('input', filterProducts);

    // Order filters
    document.getElementById('orderStatusFilter')?.addEventListener('change', filterOrders);
    document.getElementById('orderDateFilter')?.addEventListener('change', filterOrders);
    document.getElementById('orderSearchInput')?.addEventListener('input', filterOrders);

    // Voucher product filter
    document.getElementById('voucherProductFilter')?.addEventListener('change', function(e) {
        currentVoucherProductId = e.target.value;
        if (currentVoucherProductId) {
            loadVoucherMenus(currentVoucherProductId);
        } else {
            document.getElementById('voucherMenusGrid').innerHTML = '<p class="no-data">Select a product to view voucher menus</p>';
        }
    });
}

// Tab Management
function switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update active content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');

    // Load tab-specific data if needed
    switch(tabName) {
        case 'products':
            loadProducts();
            break;
        case 'vouchers':
            loadProductsForVouchers();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'news':
            loadNews();
            break;
        case 'icons':
            loadPageIcons();
            break;
        case 'settings':
            loadWebsiteSettings();
            break;
    }
}

// Data Loading Functions
async function loadInitialData() {
    try {
        showLoading(true);

        await Promise.all([
            loadAdminStats(),
            loadProducts()
        ]);

    } catch (error) {
        console.error('Error loading initial data:', error);
        showNotification('Error loading data', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadAdminStats() {
    try {
        // Load order stats
        const { data: orders, error: orderError } = await supabase
            .from('orders')
            .select('status, total_price');

        if (orderError) throw orderError;

        // Load product count
        const { data: products, error: productError } = await supabase
            .from('products')
            .select('id');

        if (productError) throw productError;

        // Calculate stats
        const totalOrders = orders.length;
        const totalProducts = products.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total_price || 0), 0);

        const pendingCount = orders.filter(o => o.status === 'pending').length;
        const approvedCount = orders.filter(o => o.status === 'approved').length;
        const rejectedCount = orders.filter(o => o.status === 'rejected').length;

        // Update UI
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('totalRevenue').textContent = formatPrice(totalRevenue);

        document.getElementById('pendingCount').textContent = pendingCount;
        document.getElementById('approvedCount').textContent = approvedCount;
        document.getElementById('rejectedCount').textContent = rejectedCount;

    } catch (error) {
        console.error('Error loading admin stats:', error);
    }
}

async function loadProducts() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error loading products', 'error');
    }
}

async function loadProductsForVouchers() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, category')
            .eq('status', 'active')
            .order('name');

        if (error) throw error;

        // Populate product filter dropdown
        const productFilter = document.getElementById('voucherProductFilter');
        const voucherMenuProduct = document.getElementById('voucherMenuProduct');

        // Clear existing options
        productFilter.innerHTML = '<option value="">Select Product</option>';
        voucherMenuProduct.innerHTML = '<option value="">Select Product</option>';

        products.forEach(product => {
            const option1 = document.createElement('option');
            option1.value = product.id;
            option1.textContent = `${product.name} (${product.category})`;
            productFilter.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = product.id;
            option2.textContent = `${product.name} (${product.category})`;
            voucherMenuProduct.appendChild(option2);
        });

    } catch (error) {
        console.error('Error loading products for vouchers:', error);
        showNotification('Error loading products', 'error');
    }
}

async function loadVoucherMenus(productId) {
    try {
        const { data: menus, error } = await supabase
            .from('voucher_menus')
            .select(`
                *,
                products (name, category)
            `)
            .eq('product_id', productId)
            .order('display_order');

        if (error) throw error;

        displayVoucherMenus(menus);
    } catch (error) {
        console.error('Error loading voucher menus:', error);
        showNotification('Error loading voucher menus', 'error');
    }
}

async function loadOrders() {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                *,
                products (name),
                voucher_menus (name)
            `)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        displayOrders(orders);
        await loadAdminStats(); // Refresh stats
    } catch (error) {
        console.error('Error loading orders:', error);
        showNotification('Error loading orders', 'error');
    }
}

async function loadNews() {
    try {
        const { data: news, error } = await supabase
            .from('news')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        displayNews(news);
    } catch (error) {
        console.error('Error loading news:', error);
        showNotification('Error loading news', 'error');
    }
}

async function loadPageIcons() {
    try {
        const { data: icons, error } = await supabase
            .from('page_icons')
            .select('*')
            .order('display_order');

        if (error) throw error;

        displayPageIcons(icons);
    } catch (error) {
        console.error('Error loading page icons:', error);
        showNotification('Error loading page icons', 'error');
    }
}

async function loadWebsiteSettings() {
    try {
        // Load website logo
        const { data: logoSettings, error: logoError } = await supabase
            .from('website_settings')
            .select('*')
            .eq('key', 'site_logo')
            .single();

        if (logoSettings && logoSettings.logo_url) {
            document.getElementById('currentLogo').src = logoSettings.logo_url;
        }

        // Load database stats
        await loadDatabaseStats();

    } catch (error) {
        console.log('Using default settings');
    }
}

async function loadPaymentSettings() {
    try {
        const { data: settings, error } = await supabase
            .from('website_settings')
            .select('*')
            .in('key', ['kbz_pay', 'wave_pay', 'aya_pay']);

        if (error) throw error;

        settings.forEach(setting => {
            const inputId = setting.key.replace('_', '') + 'Number';
            const input = document.getElementById(inputId);
            if (input) {
                input.value = setting.value || '';
            }
        });

    } catch (error) {
        console.log('Using default payment settings');
    }
}

async function loadDatabaseStats() {
    try {
        const statsContainer = document.getElementById('databaseStats');
        statsContainer.innerHTML = '<p>Loading database statistics...</p>';

        // Get table row counts
        const tables = ['products', 'orders', 'news', 'page_icons', 'voucher_menus'];
        const stats = {};

        for (const table of tables) {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (!error) {
                stats[table] = count;
            }
        }

        // Display stats
        let statsHTML = '<div class="db-stats-grid">';
        for (const [table, count] of Object.entries(stats)) {
            statsHTML += `
                <div class="db-stat-item">
                    <div class="stat-number">${count}</div>
                    <div class="stat-label">${table.replace('_', ' ').toUpperCase()}</div>
                </div>
            `;
        }
        statsHTML += '</div>';

        statsContainer.innerHTML = statsHTML;

    } catch (error) {
        console.error('Error loading database stats:', error);
        document.getElementById('databaseStats').innerHTML = '<p class="error">Error loading statistics</p>';
    }
}

// Display Functions
function displayProducts(products) {
    const grid = document.getElementById('productsGrid');

    if (products.length === 0) {
        grid.innerHTML = '<div class="no-data">No products found</div>';
        return;
    }

    grid.innerHTML = products.map(product => createProductCard(product)).join('');
}

function createProductCard(product) {
    const images = product.images || [];
    const primaryImage = images.length > 0 ? images[0] : '/assets/images/placeholder.png';

    return `
        <div class="admin-product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${primaryImage}" alt="${product.name}">
                ${images.length > 1 ? `<div class="image-count">+${images.length - 1}</div>` : ''}
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-category">${product.category}</p>
                <p class="product-price">${formatPrice(product.price)} MMK</p>
                <div class="product-status status-${product.status}">${product.status}</div>
            </div>
            <div class="product-actions">
                <button class="btn-sm btn-secondary" onclick="editProduct('${product.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-sm btn-danger" onclick="deleteProduct('${product.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
}

function displayVoucherMenus(menus) {
    const grid = document.getElementById('voucherMenusGrid');

    if (menus.length === 0) {
        grid.innerHTML = '<div class="no-data">No voucher menus found for this product</div>';
        return;
    }

    grid.innerHTML = menus.map(menu => createVoucherMenuCard(menu)).join('');
}

function createVoucherMenuCard(menu) {
    return `
        <div class="voucher-menu-card" data-menu-id="${menu.id}">
            <div class="voucher-icon">
                <img src="${menu.icon_url || '/assets/icons/voucher-default.png'}" alt="${menu.name}">
            </div>
            <div class="voucher-info">
                <h4>${menu.name}</h4>
                <p class="voucher-price">${formatPrice(menu.price)} MMK</p>
                <p class="voucher-order">Order: ${menu.display_order}</p>
                <div class="voucher-status ${menu.is_active ? 'active' : 'inactive'}">
                    ${menu.is_active ? 'Active' : 'Inactive'}
                </div>
            </div>
            <div class="voucher-actions">
                <button class="btn-sm btn-secondary" onclick="editVoucherMenu('${menu.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-sm btn-danger" onclick="deleteVoucherMenu('${menu.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
}

function displayOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No orders found</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => createOrderRow(order)).join('');
}

function createOrderRow(order) {
    const productName = order.products ? order.products.name : 'Unknown';
    const voucherName = order.voucher_menus ? order.voucher_menus.name : '';

    return `
        <tr data-order-id="${order.id}">
            <td class="order-id">${order.order_id}</td>
            <td>
                ${productName}
                ${voucherName ? `<br><small>${voucherName}</small>` : ''}
            </td>
            <td>${order.game_id}</td>
            <td class="order-amount">${formatPrice(order.total_price)} MMK</td>
            <td class="payment-method">${order.payment_method.toUpperCase()}</td>
            <td>
                <span class="status-badge status-${order.status}">
                    ${order.status.toUpperCase()}
                </span>
            </td>
            <td class="order-date">${formatDate(order.created_at)}</td>
            <td class="order-actions">
                <button class="btn-sm btn-primary" onclick="viewOrder('${order.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `;
}

function displayNews(newsItems) {
    const grid = document.getElementById('newsGrid');

    if (newsItems.length === 0) {
        grid.innerHTML = '<div class="no-data">No news found</div>';
        return;
    }

    grid.innerHTML = newsItems.map(news => createNewsCard(news)).join('');
}

function createNewsCard(news) {
    const images = news.images || [];
    const primaryImage = images.length > 0 ? images[0] : '/assets/images/placeholder.png';

    return `
        <div class="admin-news-card" data-news-id="${news.id}">
            <div class="news-image">
                <img src="${primaryImage}" alt="${news.title}">
                ${images.length > 1 ? `<div class="image-count">+${images.length - 1}</div>` : ''}
            </div>
            <div class="news-content">
                <h3>${news.title}</h3>
                <p class="news-excerpt">${truncateText(news.content, 100)}</p>
                <div class="news-meta">
                    <span class="news-date">${formatDate(news.created_at)}</span>
                    <span class="news-status status-${news.status}">${news.status}</span>
                </div>
            </div>
            <div class="news-actions">
                <button class="btn-sm btn-secondary" onclick="editNews('${news.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-sm btn-danger" onclick="deleteNews('${news.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
}

function displayPageIcons(icons) {
    const grid = document.getElementById('pageIconsGrid');

    if (icons.length === 0) {
        grid.innerHTML = '<div class="no-data">No page icons found</div>';
        return;
    }

    grid.innerHTML = icons.map(icon => createPageIconCard(icon)).join('');
}

function createPageIconCard(icon) {
    return `
        <div class="page-icon-card" data-icon-id="${icon.id}">
            <div class="icon-preview">
                <img src="${icon.icon_url || '/assets/icons/default.png'}" alt="${icon.display_name}">
            </div>
            <div class="icon-info">
                <h4>${icon.display_name}</h4>
                <p class="icon-page-name">${icon.page_name}</p>
                <p class="icon-order">Order: ${icon.display_order}</p>
                <div class="icon-status ${icon.is_active ? 'active' : 'inactive'}">
                    ${icon.is_active ? 'Active' : 'Inactive'}
                </div>
            </div>
            <div class="icon-actions">
                <button class="btn-sm btn-secondary" onclick="editPageIcon('${icon.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-sm btn-danger" onclick="deletePageIcon('${icon.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
}

// Modal Functions
function showAddProductModal() {
    resetProductForm();
    document.getElementById('productModalTitle').textContent = 'Add Product';
    showModal('productModal');
}

function showAddVoucherMenuModal() {
    resetVoucherMenuForm();
    document.getElementById('voucherMenuModalTitle').textContent = 'Add Voucher Menu';
    loadProductsForVouchers(); // Ensure products are loaded
    showModal('voucherMenuModal');
}

function showAddNewsModal() {
    resetNewsForm();
    document.getElementById('newsModalTitle').textContent = 'Add News';
    showModal('newsModal');
}

function showAddPageIconModal() {
    resetPageIconForm();
    document.getElementById('pageIconModalTitle').textContent = 'Add Page Icon';
    showModal('pageIconModal');
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
    document.body.classList.add('modal-open');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
}

// Form Handlers
async function handleProductSubmit(event) {
    event.preventDefault();

    try {
        showLoading(true);

        const formData = new FormData(event.target);
        const productData = {
            name: formData.get('productName'),
            description: formData.get('productDescription'),
            category: formData.get('productCategory'),
            price: parseInt(formData.get('productPrice')),
            status: formData.get('productStatus'),
            images: productImages
        };

        const productId = document.getElementById('productId').value;

        if (productId) {
            // Update existing product
            const { error } = await supabase
                .from('products')
                .update(productData)
                .eq('id', productId);

            if (error) throw error;
            showNotification('Product updated successfully', 'success');
        } else {
            // Create new product
            const { error } = await supabase
                .from('products')
                .insert([productData]);

            if (error) throw error;
            showNotification('Product created successfully', 'success');
        }

        closeModal('productModal');
        loadProducts();

    } catch (error) {
        console.error('Error saving product:', error);
        showNotification('Error saving product', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleVoucherMenuSubmit(event) {
    event.preventDefault();

    try {
        showLoading(true);

        const formData = new FormData(event.target);
        const voucherData = {
            product_id: formData.get('voucherMenuProduct'),
            name: formData.get('voucherMenuName'),
            price: parseInt(formData.get('voucherMenuPrice')),
            display_order: parseInt(formData.get('voucherMenuOrder')),
            is_active: formData.get('voucherMenuActive') === 'true'
        };

        // Handle icon upload if present
        const iconFile = document.getElementById('voucherMenuIcon').files[0];
        if (iconFile) {
            const iconUrl = await uploadFile(iconFile, 'voucher-icons');
            voucherData.icon_url = iconUrl;
        }

        const voucherMenuId = document.getElementById('voucherMenuId').value;

        if (voucherMenuId) {
            // Update existing voucher menu
            const { error } = await supabase
                .from('voucher_menus')
                .update(voucherData)
                .eq('id', voucherMenuId);

            if (error) throw error;
            showNotification('Voucher menu updated successfully', 'success');
        } else {
            // Create new voucher menu
            const { error } = await supabase
                .from('voucher_menus')
                .insert([voucherData]);

            if (error) throw error;
            showNotification('Voucher menu created successfully', 'success');
        }

        closeModal('voucherMenuModal');
        if (currentVoucherProductId) {
            loadVoucherMenus(currentVoucherProductId);
        }

    } catch (error) {
        console.error('Error saving voucher menu:', error);
        showNotification('Error saving voucher menu', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleNewsSubmit(event) {
    event.preventDefault();

    try {
        showLoading(true);

        const formData = new FormData(event.target);
        const newsData = {
            title: formData.get('newsTitle'),
            content: formData.get('newsContent'),
            status: formData.get('newsStatus'),
            images: newsImages
        };

        const newsId = document.getElementById('newsId').value;

        if (newsId) {
            // Update existing news
            const { error } = await supabase
                .from('news')
                .update(newsData)
                .eq('id', newsId);

            if (error) throw error;
            showNotification('News updated successfully', 'success');
        } else {
            // Create new news
            const { error } = await supabase
                .from('news')
                .insert([newsData]);

            if (error) throw error;
            showNotification('News created successfully', 'success');
        }

        closeModal('newsModal');
        loadNews();

    } catch (error) {
        console.error('Error saving news:', error);
        showNotification('Error saving news', 'error');
    } finally {
        showLoading(false);
    }
}

async function handlePageIconSubmit(event) {
    event.preventDefault();

    try {
        showLoading(true);

        const formData = new FormData(event.target);
        const iconData = {
            page_name: formData.get('pageIconName'),
            display_name: formData.get('pageIconDisplayName'),
            display_order: parseInt(formData.get('pageIconOrder')),
            is_active: formData.get('pageIconActive') === 'true'
        };

        // Handle icon upload if present
        const iconFile = document.getElementById('pageIconFile').files[0];
        if (iconFile) {
            const iconUrl = await uploadFile(iconFile, 'page-icons');
            iconData.icon_url = iconUrl;
        }

        const pageIconId = document.getElementById('pageIconId').value;

        if (pageIconId) {
            // Update existing page icon
            const { error } = await supabase
                .from('page_icons')
                .update(iconData)
                .eq('id', pageIconId);

            if (error) throw error;
            showNotification('Page icon updated successfully', 'success');
        } else {
            // Create new page icon
            const { error } = await supabase
                .from('page_icons')
                .insert([iconData]);

            if (error) throw error;
            showNotification('Page icon created successfully', 'success');
        }

        closeModal('pageIconModal');
        loadPageIcons();

    } catch (error) {
        console.error('Error saving page icon:', error);
        showNotification('Error saving page icon', 'error');
    } finally {
        showLoading(false);
    }
}

// File Upload Functions
async function uploadFile(file, folder) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('gaming-platform')
            .upload(filePath, file);

        if (error) throw error;

        const { data: publicURL } = supabase.storage
            .from('gaming-platform')
            .getPublicUrl(filePath);

        return publicURL.publicUrl;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

async function uploadMultipleFiles(files, folder) {
    const urls = [];

    for (const file of files) {
        try {
            const url = await uploadFile(file, folder);
            urls.push(url);
        } catch (error) {
            console.error('Error uploading file:', file.name, error);
        }
    }

    return urls;
}

// Image Preview Functions
function triggerImageUpload() {
    document.getElementById('productImages').click();
}

async function previewProductImages(event) {
    const files = Array.from(event.target.files);
    const container = document.getElementById('imagePreviewsContainer');

    if (files.length === 0) return;

    try {
        showLoading(true);

        // Upload files
        const imageUrls = await uploadMultipleFiles(files, 'product-images');
        productImages = [...productImages, ...imageUrls];

        // Display previews
        displayImagePreviews(container, productImages, 'product');

    } catch (error) {
        console.error('Error handling product images:', error);
        showNotification('Error uploading images', 'error');
    } finally {
        showLoading(false);
    }
}

function triggerNewsImageUpload() {
    document.getElementById('newsImages').click();
}

async function previewNewsImages(event) {
    const files = Array.from(event.target.files);
    const container = document.getElementById('newsImagePreviewsContainer');

    if (files.length === 0) return;

    try {
        showLoading(true);

        // Upload files
        const imageUrls = await uploadMultipleFiles(files, 'news-images');
        newsImages = [...newsImages, ...imageUrls];

        // Display previews
        displayImagePreviews(container, newsImages, 'news');

    } catch (error) {
        console.error('Error handling news images:', error);
        showNotification('Error uploading images', 'error');
    } finally {
        showLoading(false);
    }
}

function displayImagePreviews(container, images, type) {
    container.innerHTML = images.map((url, index) => `
        <div class="image-preview">
            <img src="${url}" alt="Preview ${index + 1}">
            <button type="button" class="remove-image" onclick="removeImage('${type}', ${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function removeImage(type, index) {
    if (type === 'product') {
        productImages.splice(index, 1);
        displayImagePreviews(document.getElementById('imagePreviewsContainer'), productImages, 'product');
    } else if (type === 'news') {
        newsImages.splice(index, 1);
        displayImagePreviews(document.getElementById('newsImagePreviewsContainer'), newsImages, 'news');
    }
}

async function previewVoucherIcon(event) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById('voucherIconImg');
    const reader = new FileReader();

    reader.onload = function(e) {
        preview.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

async function previewPageIcon(event) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById('pageIconImg');
    const reader = new FileReader();

    reader.onload = function(e) {
        preview.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

async function previewLogo(event) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById('currentLogo');
    const reader = new FileReader();

    reader.onload = function(e) {
        preview.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

// Edit Functions
async function editProduct(productId) {
    try {
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error) throw error;

        // Populate form
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStatus').value = product.status;

        // Set existing images
        productImages = product.images || [];
        displayImagePreviews(document.getElementById('imagePreviewsContainer'), productImages, 'product');

        document.getElementById('productModalTitle').textContent = 'Edit Product';
        showModal('productModal');

    } catch (error) {
        console.error('Error loading product:', error);
        showNotification('Error loading product', 'error');
    }
}

async function editVoucherMenu(menuId) {
    try {
        const { data: menu, error } = await supabase
            .from('voucher_menus')
            .select('*')
            .eq('id', menuId)
            .single();

        if (error) throw error;

        // Populate form
        document.getElementById('voucherMenuId').value = menu.id;
        document.getElementById('voucherMenuProduct').value = menu.product_id;
        document.getElementById('voucherMenuName').value = menu.name;
        document.getElementById('voucherMenuPrice').value = menu.price;
        document.getElementById('voucherMenuOrder').value = menu.display_order;
        document.getElementById('voucherMenuActive').value = menu.is_active.toString();

        // Set icon preview
        if (menu.icon_url) {
            document.getElementById('voucherIconImg').src = menu.icon_url;
        }

        document.getElementById('voucherMenuModalTitle').textContent = 'Edit Voucher Menu';
        showModal('voucherMenuModal');

    } catch (error) {
        console.error('Error loading voucher menu:', error);
        showNotification('Error loading voucher menu', 'error');
    }
}

async function editNews(newsId) {
    try {
        const { data: news, error } = await supabase
            .from('news')
            .select('*')
            .eq('id', newsId)
            .single();

        if (error) throw error;

        // Populate form
        document.getElementById('newsId').value = news.id;
        document.getElementById('newsTitle').value = news.title;
        document.getElementById('newsContent').value = news.content;
        document.getElementById('newsStatus').value = news.status;

        // Set existing images
        newsImages = news.images || [];
        displayImagePreviews(document.getElementById('newsImagePreviewsContainer'), newsImages, 'news');

        document.getElementById('newsModalTitle').textContent = 'Edit News';
        showModal('newsModal');

    } catch (error) {
        console.error('Error loading news:', error);
        showNotification('Error loading news', 'error');
    }
}

async function editPageIcon(iconId) {
    try {
        const { data: icon, error } = await supabase
            .from('page_icons')
            .select('*')
            .eq('id', iconId)
            .single();

        if (error) throw error;

        // Populate form
        document.getElementById('pageIconId').value = icon.id;
        document.getElementById('pageIconName').value = icon.page_name;
        document.getElementById('pageIconDisplayName').value = icon.display_name;
        document.getElementById('pageIconOrder').value = icon.display_order;
        document.getElementById('pageIconActive').value = icon.is_active.toString();

        // Set icon preview
        if (icon.icon_url) {
            document.getElementById('pageIconImg').src = icon.icon_url;
        }

        document.getElementById('pageIconModalTitle').textContent = 'Edit Page Icon';
        showModal('pageIconModal');

    } catch (error) {
        console.error('Error loading page icon:', error);
        showNotification('Error loading page icon', 'error');
    }
}

// Delete Functions
function deleteProduct(productId) {
    showConfirmation(
        'Delete Product',
        'Are you sure you want to delete this product? This action cannot be undone.',
        async () => {
            try {
                const { error } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', productId);

                if (error) throw error;

                showNotification('Product deleted successfully', 'success');
                loadProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
                showNotification('Error deleting product', 'error');
            }
        }
    );
}

function deleteVoucherMenu(menuId) {
    showConfirmation(
        'Delete Voucher Menu',
        'Are you sure you want to delete this voucher menu? This action cannot be undone.',
        async () => {
            try {
                const { error } = await supabase
                    .from('voucher_menus')
                    .delete()
                    .eq('id', menuId);

                if (error) throw error;

                showNotification('Voucher menu deleted successfully', 'success');
                if (currentVoucherProductId) {
                    loadVoucherMenus(currentVoucherProductId);
                }
            } catch (error) {
                console.error('Error deleting voucher menu:', error);
                showNotification('Error deleting voucher menu', 'error');
            }
        }
    );
}

function deleteNews(newsId) {
    showConfirmation(
        'Delete News',
        'Are you sure you want to delete this news item? This action cannot be undone.',
        async () => {
            try {
                const { error } = await supabase
                    .from('news')
                    .delete()
                    .eq('id', newsId);

                if (error) throw error;

                showNotification('News deleted successfully', 'success');
                loadNews();
            } catch (error) {
                console.error('Error deleting news:', error);
                showNotification('Error deleting news', 'error');
            }
        }
    );
}

function deletePageIcon(iconId) {
    showConfirmation(
        'Delete Page Icon',
        'Are you sure you want to delete this page icon? This action cannot be undone.',
        async () => {
            try {
                const { error } = await supabase
                    .from('page_icons')
                    .delete()
                    .eq('id', iconId);

                if (error) throw error;

                showNotification('Page icon deleted successfully', 'success');
                loadPageIcons();
            } catch (error) {
                console.error('Error deleting page icon:', error);
                showNotification('Error deleting page icon', 'error');
            }
        }
    );
}

// Order Management
async function viewOrder(orderId) {
    try {
        const { data: order, error } = await supabase
            .from('orders')
            .select(`
                *,
                products (name, category),
                voucher_menus (name)
            `)
            .eq('id', orderId)
            .single();

        if (error) throw error;

        currentOrderId = orderId;
        displayOrderDetails(order);
        showModal('orderModal');

    } catch (error) {
        console.error('Error loading order:', error);
        showNotification('Error loading order', 'error');
    }
}

function displayOrderDetails(order) {
    const container = document.getElementById('orderDetailsContent');

    container.innerHTML = `
        <div class="order-details">
            <div class="detail-row">
                <label>Order ID:</label>
                <span>${order.order_id}</span>
            </div>
            <div class="detail-row">
                <label>Product:</label>
                <span>${order.products ? order.products.name : 'Unknown'}</span>
            </div>
            ${order.voucher_menus ? `
                <div class="detail-row">
                    <label>Voucher:</label>
                    <span>${order.voucher_menus.name}</span>
                </div>
            ` : ''}
            <div class="detail-row">
                <label>Game ID:</label>
                <span>${order.game_id}</span>
            </div>
            ${order.server_id ? `
                <div class="detail-row">
                    <label>Server ID:</label>
                    <span>${order.server_id}</span>
                </div>
            ` : ''}
            ${order.zone_id ? `
                <div class="detail-row">
                    <label>Zone ID:</label>
                    <span>${order.zone_id}</span>
                </div>
            ` : ''}
            ${order.telegram_link ? `
                <div class="detail-row">
                    <label>Telegram:</label>
                    <span>${order.telegram_link}</span>
                </div>
            ` : ''}
            <div class="detail-row">
                <label>Amount:</label>
                <span>${formatPrice(order.total_price)} MMK</span>
            </div>
            <div class="detail-row">
                <label>Payment Method:</label>
                <span>${order.payment_method.toUpperCase()}</span>
            </div>
            <div class="detail-row">
                <label>Status:</label>
                <span class="status-badge status-${order.status}">${order.status.toUpperCase()}</span>
            </div>
            <div class="detail-row">
                <label>Created:</label>
                <span>${formatDate(order.created_at)}</span>
            </div>
            ${order.admin_notes ? `
                <div class="detail-row">
                    <label>Previous Notes:</label>
                    <span>${order.admin_notes}</span>
                </div>
            ` : ''}
        </div>
    `;

    // Set current admin notes
    document.getElementById('adminNotes').value = order.admin_notes || '';
}

async function approveOrder() {
    await updateOrderStatus('approved');
}

async function rejectOrder() {
    await updateOrderStatus('rejected');
}

async function updateOrderStatus(status) {
    try {
        const adminNotes = document.getElementById('adminNotes').value;

        const { error } = await supabase
            .from('orders')
            .update({
                status: status,
                admin_notes: adminNotes,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentOrderId);

        if (error) throw error;

        showNotification(`Order ${status} successfully`, 'success');
        closeModal('orderModal');
        loadOrders();

    } catch (error) {
        console.error('Error updating order:', error);
        showNotification('Error updating order', 'error');
    }
}

// Settings Functions
async function updateWebsiteLogo() {
    try {
        const logoFile = document.getElementById('logoUpload').files[0];
        if (!logoFile) {
            showNotification('Please select a logo file', 'error');
            return;
        }

        showLoading(true);

        // Upload new logo
        const logoUrl = await uploadFile(logoFile, 'website');

        // Update database
        const { error } = await supabase
            .from('website_settings')
            .upsert({
                key: 'site_logo',
                logo_url: logoUrl,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;

        showNotification('Website logo updated successfully', 'success');

    } catch (error) {
        console.error('Error updating logo:', error);
        showNotification('Error updating logo', 'error');
    } finally {
        showLoading(false);
    }
}

async function updatePaymentSettings() {
    try {
        showLoading(true);

        const settings = [
            {
                key: 'kbz_pay',
                value: document.getElementById('kbzPayNumber').value
            },
            {
                key: 'wave_pay',
                value: document.getElementById('wavePayNumber').value
            },
            {
                key: 'aya_pay',
                value: document.getElementById('ayaPayNumber').value
            }
        ];

        for (const setting of settings) {
            const { error } = await supabase
                .from('website_settings')
                .upsert({
                    ...setting,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
        }

        showNotification('Payment settings updated successfully', 'success');

    } catch (error) {
        console.error('Error updating payment settings:', error);
        showNotification('Error updating payment settings', 'error');
    } finally {
        showLoading(false);
    }
}

async function refreshDatabaseStats() {
    await loadDatabaseStats();
    showNotification('Database statistics refreshed', 'success');
}

function refreshVoucherMenus() {
    if (currentVoucherProductId) {
        loadVoucherMenus(currentVoucherProductId);
        showNotification('Voucher menus refreshed', 'success');
    } else {
        showNotification('Please select a product first', 'error');
    }
}

// Filter Functions
function filterProducts() {
    const category = document.getElementById('productCategoryFilter').value;
    const status = document.getElementById('productStatusFilter').value;
    const search = document.getElementById('productSearchInput').value.toLowerCase();

    const products = document.querySelectorAll('.admin-product-card');

    products.forEach(product => {
        const productCategory = product.querySelector('.product-category').textContent;
        const productStatus = product.querySelector('.product-status').textContent;
        const productName = product.querySelector('h3').textContent.toLowerCase();

        const categoryMatch = !category || productCategory === category;
        const statusMatch = !status || productStatus === status;
        const searchMatch = !search || productName.includes(search);

        product.style.display = categoryMatch && statusMatch && searchMatch ? 'block' : 'none';
    });
}

function filterOrders() {
    const status = document.getElementById('orderStatusFilter').value;
    const date = document.getElementById('orderDateFilter').value;
    const search = document.getElementById('orderSearchInput').value.toLowerCase();

    const orders = document.querySelectorAll('#ordersTableBody tr');

    orders.forEach(order => {
        if (order.querySelector('.no-data')) return;

        const orderStatus = order.querySelector('.status-badge').textContent.toLowerCase();
        const orderDate = order.querySelector('.order-date').textContent;
        const orderId = order.querySelector('.order-id').textContent.toLowerCase();
        const gameId = order.cells[2].textContent.toLowerCase();

        const statusMatch = !status || orderStatus.includes(status);
        const dateMatch = !date || orderDate.includes(date);
        const searchMatch = !search || orderId.includes(search) || gameId.includes(search);

        order.style.display = statusMatch && dateMatch && searchMatch ? '' : 'none';
    });
}

// Form Reset Functions
function resetProductForm() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    productImages = [];
    document.getElementById('imagePreviewsContainer').innerHTML = '';
}

function resetVoucherMenuForm() {
    document.getElementById('voucherMenuForm').reset();
    document.getElementById('voucherMenuId').value = '';
    document.getElementById('voucherIconImg').src = '/assets/icons/voucher-default.png';
}

function resetNewsForm() {
    document.getElementById('newsForm').reset();
    document.getElementById('newsId').value = '';
    newsImages = [];
    document.getElementById('newsImagePreviewsContainer').innerHTML = '';
}

function resetPageIconForm() {
    document.getElementById('pageIconForm').reset();
    document.getElementById('pageIconId').value = '';
    document.getElementById('pageIconImg').src = '/assets/icons/default.png';
}

// Real-time Updates
function startRealTimeUpdates() {
    // Subscribe to order changes
    supabase
        .channel('orders')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'orders' }, 
            () => {
                loadOrders();
                loadAdminStats();
            }
        )
        .subscribe();

    // Subscribe to product changes
    supabase
        .channel('products')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'products' }, 
            () => {
                loadProducts();
                loadProductsForVouchers();
                loadAdminStats();
            }
        )
        .subscribe();
}

// Utility Functions
function formatPrice(price) {
    return new Intl.NumberFormat('en-US').format(price);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function showLoading(show) {
    loader.style.display = show ? 'flex' : 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    notificationContainer.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => hideNotification(notification), 5000);

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

function showConfirmation(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;

    const confirmBtn = document.getElementById('confirmActionBtn');
    confirmBtn.onclick = function() {
        callback();
        closeModal('confirmModal');
    };

    showModal('confirmModal');
}

// Export for global access
window.AdminPanel = {
    loadProducts,
    loadOrders,
    loadNews,
    loadPageIcons,
    showNotification,
    formatPrice,
    formatDate
};
