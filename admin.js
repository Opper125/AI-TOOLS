// Mafia Gaming Platform - Admin Dashboard JavaScript
// Supabase Configuration
const SUPABASE_URL = 'https://spurpwnaeacgwojfpaem.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdXJwd25hZWFjZ3dvamZwYWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMjU2MDYsImV4cCI6MjA3MzkwMTYwNn0.VTKl3ZU6xVKcn3Ry1XTtY-Fpvm0cVqZiQcloJc33O-Y';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdXJwd25hZWFjZ3dvamZwYWVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODMyNTYwNiwiZXhwIjoyMDczOTAxNjA2fQ.qh776GiajyHVQECbhBAYLrQASVBx21K7dzAvsiL8Fy8';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variables
let currentAdmin = null;
let currentPage = 'dashboard';
let allUsers = [];
let allProducts = [];
let allVouchers = [];
let allOrders = [];
let allPayments = [];
let allNews = [];
let allSocial = [];
let aboutInfo = null;
let statsData = {};
let userChart = null;

// DOM Elements
const elements = {
    loadingOverlay: document.getElementById('loadingOverlay'),
    messagePopup: document.getElementById('messagePopup'),
    adminLogin: document.getElementById('adminLogin'),
    adminDashboard: document.getElementById('adminDashboard'),
    adminPin: document.getElementById('adminPin'),
    adminLoginBtn: document.getElementById('adminLoginBtn'),
    adminLogoutBtn: document.getElementById('adminLogoutBtn'),
    
    // Modal elements
    adminModal: document.getElementById('adminModal'),
    userModal: document.getElementById('userModal'),
    orderModal: document.getElementById('orderModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalBody: document.getElementById('modalBody'),
    userModalBody: document.getElementById('userModalBody'),
    orderModalBody: document.getElementById('orderModalBody'),
    
    // Page elements
    dashboardPage: document.getElementById('dashboardPage'),
    usersPage: document.getElementById('usersPage'),
    productsPage: document.getElementById('productsPage'),
    ordersPage: document.getElementById('ordersPage'),
    paymentsPage: document.getElementById('paymentsPage'),
    newsPage: document.getElementById('newsPage'),
    socialPage: document.getElementById('socialPage'),
    aboutPage: document.getElementById('aboutPage')
};

// Utility Functions
function showLoading() {
    elements.loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    elements.loadingOverlay.style.display = 'none';
}

function showMessage(message, type = 'info', duration = 5000) {
    const popup = elements.messagePopup;
    const messageText = popup.querySelector('.message-text');
    const messageTimer = popup.querySelector('.message-timer');
    const closeBtn = popup.querySelector('.message-close');
    
    messageText.textContent = message;
    popup.className = `message-popup show ${type}`;
    
    let timeLeft = duration / 1000;
    messageTimer.textContent = timeLeft;
    
    const timer = setInterval(() => {
        timeLeft--;
        messageTimer.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            hideMessage();
        }
    }, 1000);
    
    closeBtn.onclick = () => {
        clearInterval(timer);
        hideMessage();
    };
    
    function hideMessage() {
        popup.classList.remove('show');
        setTimeout(() => {
            popup.className = 'message-popup';
        }, 400);
    }
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

function formatPrice(price, currency = 'MMK') {
    return `${parseInt(price).toLocaleString()} ${currency}`;
}

function renderCustomEmojis(text) {
    // Placeholder for custom emoji rendering
    return text || '';
}

// Authentication Functions
elements.adminLoginBtn.addEventListener('click', async () => {
    const pin = elements.adminPin.value;
    
    if (!pin) {
        showMessage('Please enter admin PIN', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const { data, error } = await supabase
            .from('admin')
            .select('*')
            .eq('pin', pin)
            .single();
            
        if (error || !data) {
            showMessage('Invalid admin PIN', 'error');
            return;
        }
        
        currentAdmin = data;
        showAdminDashboard();
        showMessage('Admin login successful! 👑', 'success');
        
    } catch (error) {
        console.error('Admin login error:', error);
        showMessage('Login failed. Please try again.', 'error');
    } finally {
        hideLoading();
    }
});

elements.adminLogoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        showAdminLogin();
        showMessage('Logged out successfully', 'success');
    }
});

function showAdminDashboard() {
    elements.adminLogin.style.display = 'none';
    elements.adminDashboard.style.display = 'block';
    
    // Load dashboard data
    loadDashboardData();
    initializeNavigation();
}

function showAdminLogin() {
    elements.adminLogin.style.display = 'flex';
    elements.adminDashboard.style.display = 'none';
    elements.adminPin.value = '';
    currentAdmin = null;
}

// Navigation
function initializeNavigation() {
    document.querySelectorAll('.admin-nav .nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            showPage(page);
        });
    });
    
    // Show dashboard initially
    showPage('dashboard');
}

function showPage(page) {
    currentPage = page;
    
    // Update nav buttons
    document.querySelectorAll('.admin-nav .nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });
    
    // Hide all pages
    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    
    // Show selected page
    const pageElement = document.getElementById(page + 'Page');
    if (pageElement) {
        pageElement.classList.add('active');
        
        // Load page-specific data
        switch(page) {
            case 'dashboard':
                renderDashboardPage();
                break;
            case 'users':
                renderUsersPage();
                break;
            case 'products':
                renderProductsPage();
                break;
            case 'orders':
                renderOrdersPage();
                break;
            case 'payments':
                renderPaymentsPage();
                break;
            case 'news':
                renderNewsPage();
                break;
            case 'social':
                renderSocialPage();
                break;
            case 'about':
                renderAboutPage();
                break;
        }
    }
}

// Data Loading
async function loadDashboardData() {
    try {
        showLoading();
        
        // Load all data in parallel
        const [usersRes, productsRes, vouchersRes, ordersRes, paymentsRes, newsRes, socialRes, aboutRes, statsRes] = await Promise.all([
            supabase.from('users').select('*').order('created_at', { ascending: false }),
            supabase.from('products').select('*').order('created_at', { ascending: false }),
            supabase.from('vouchers').select('*, products(*)').order('created_at', { ascending: false }),
            supabase.from('orders').select('*, users(*), products(*), vouchers(*)').order('created_at', { ascending: false }),
            supabase.from('payments').select('*').order('created_at', { ascending: false }),
            supabase.from('news').select('*').order('created_at', { ascending: false }),
            supabase.from('social_media').select('*').order('created_at', { ascending: false }),
            supabase.from('about').select('*').single(),
            supabase.from('stats').select('*').order('date', { ascending: false }).limit(30)
        ]);
        
        allUsers = usersRes.data || [];
        allProducts = productsRes.data || [];
        allVouchers = vouchersRes.data || [];
        allOrders = ordersRes.data || [];
        allPayments = paymentsRes.data || [];
        allNews = newsRes.data || [];
        allSocial = socialRes.data || [];
        aboutInfo = aboutRes.data;
        statsData = statsRes.data || [];
        
        console.log('Dashboard data loaded successfully');
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showMessage('Failed to load dashboard data', 'error');
    } finally {
        hideLoading();
    }
}

// Dashboard Page Rendering
function renderDashboardPage() {
    // Update stats
    updateStatsCards();
    renderUserChart();
}

function updateStatsCards() {
    const today = statsData.find(s => s.date === new Date().toISOString().split('T')[0]) || {};
    const totalUsers = allUsers.filter(u => !u.deleted).length;
    const dailyUsers = today.daily_users || 0;
    const monthlyUsers = allUsers.filter(u => {
        const userDate = new Date(u.created_at);
        const now = new Date();
        return userDate.getMonth() === now.getMonth() && 
               userDate.getFullYear() === now.getFullYear() &&
               !u.deleted;
    }).length;
    const totalOrders = allOrders.length;
    
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('dailyUsers').textContent = dailyUsers;
    document.getElementById('monthlyUsers').textContent = monthlyUsers;
    document.getElementById('totalOrders').textContent = totalOrders;
}

function renderUserChart() {
    const ctx = document.getElementById('userChart').getContext('2d');
    
    if (userChart) {
        userChart.destroy();
    }
    
    const last30Days = [];
    const userCounts = [];
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayData = statsData.find(s => s.date === dateStr);
        
        last30Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        userCounts.push(dayData ? dayData.daily_users : 0);
    }
    
    userChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last30Days,
            datasets: [{
                label: 'Daily Registrations',
                data: userCounts,
                borderColor: '#00b4ff',
                backgroundColor: 'rgba(0, 180, 255, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#cccccc'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#cccccc'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Users Page
function renderUsersPage() {
    const usersList = document.getElementById('usersList');
    const searchInput = document.getElementById('userSearch');
    const refreshBtn = document.getElementById('refreshUsers');
    
    function renderUsers(users = allUsers) {
        usersList.innerHTML = users.map(user => `
            <div class="user-card ${user.banned ? 'banned' : ''}" onclick="showUserDetails('${user.id}')">
                <div class="user-header">
                    <img src="${user.profile_picture_url || `https://via.placeholder.com/50x50/00b4ff/ffffff?text=${user.username.charAt(0).toUpperCase()}`}" 
                         alt="${user.username}" class="user-avatar">
                    <div class="user-info">
                        <h3>${user.username}</h3>
                        <p>${user.email}</p>
                        <small>Joined: ${formatDate(user.created_at)}</small>
                    </div>
                </div>
                <div class="user-status">
                    ${user.banned ? 
                        `<div class="status-badge banned">Banned</div>` :
                        `<div class="status-badge active">Active</div>`
                    }
                    ${user.deleted ? `<div class="status-badge">Deleted</div>` : ''}
                </div>
                <div class="user-actions" onclick="event.stopPropagation()">
                    ${user.banned ? 
                        `<button class="action-btn unban-btn" onclick="unbanUser('${user.id}')">Unban</button>` :
                        `<button class="action-btn ban-btn" onclick="banUser('${user.id}')">Ban</button>`
                    }
                    <button class="action-btn delete-btn" onclick="deleteUser('${user.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }
    
    // Search functionality
    if (searchInput && !searchInput.hasListener) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filteredUsers = allUsers.filter(user => 
                user.username.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query)
            );
            renderUsers(filteredUsers);
        });
        searchInput.hasListener = true;
    }
    
    // Refresh functionality
    if (refreshBtn && !refreshBtn.hasListener) {
        refreshBtn.addEventListener('click', () => {
            loadDashboardData();
            showMessage('Users refreshed', 'success');
        });
        refreshBtn.hasListener = true;
    }
    
    renderUsers();
}

function showUserDetails(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    const userOrders = allOrders.filter(o => o.user_id === userId);
    
    elements.userModalBody.innerHTML = `
        <div class="user-details">
            <div class="user-header">
                <img src="${user.profile_picture_url || `https://via.placeholder.com/80x80/00b4ff/ffffff?text=${user.username.charAt(0).toUpperCase()}`}" 
                     alt="${user.username}" class="user-avatar" style="width: 80px; height: 80px;">
                <div class="user-info">
                    <h3>${user.username}</h3>
                    <p>${user.email}</p>
                    <p>PIN: ${user.pin}</p>
                    <p>Joined: ${formatDate(user.created_at)}</p>
                </div>
            </div>
            
            ${user.banned ? `
                <div class="ban-info">
                    <h4>Ban Information</h4>
                    <p><strong>Reason:</strong> ${user.ban_reason || 'No reason provided'}</p>
                    <p><strong>Ban Time:</strong> ${user.ban_time ? formatDate(user.ban_time) : 'Not specified'}</p>
                    <p><strong>Unban Time:</strong> ${user.unban_time ? formatDate(user.unban_time) : 'Permanent'}</p>
                </div>
            ` : ''}
            
            <div class="user-orders">
                <h4>Order History (${userOrders.length})</h4>
                <div class="orders-summary">
                    ${userOrders.slice(0, 5).map(order => `
                        <div class="order-item">
                            <span>${order.order_id}</span>
                            <span class="order-status ${order.status}">${order.status}</span>
                            <span>${formatDate(order.created_at)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="user-actions-modal">
                ${user.banned ? 
                    `<button class="unban-btn" onclick="unbanUser('${user.id}'); closeModal('userModal')">Unban User</button>` :
                    `<button class="ban-btn" onclick="banUser('${user.id}'); closeModal('userModal')">Ban User</button>`
                }
                <button class="delete-btn" onclick="deleteUser('${user.id}'); closeModal('userModal')">Delete User</button>
            </div>
        </div>
    `;
    
    elements.userModal.classList.add('show');
}

async function banUser(userId) {
    const reason = prompt('Enter ban reason:');
    if (!reason) return;
    
    const duration = prompt('Ban duration in days (leave empty for permanent):');
    let unbanTime = null;
    
    if (duration && !isNaN(duration)) {
        unbanTime = new Date();
        unbanTime.setDate(unbanTime.getDate() + parseInt(duration));
    }
    
    try {
        showLoading();
        
        const { error } = await supabase
            .from('users')
            .update({
                banned: true,
                ban_reason: reason,
                ban_time: new Date().toISOString(),
                unban_time: unbanTime ? unbanTime.toISOString() : null
            })
            .eq('id', userId);
            
        if (error) throw error;
        
        // Update local data
        const userIndex = allUsers.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            allUsers[userIndex].banned = true;
            allUsers[userIndex].ban_reason = reason;
            allUsers[userIndex].ban_time = new Date().toISOString();
            allUsers[userIndex].unban_time = unbanTime ? unbanTime.toISOString() : null;
        }
        
        renderUsersPage();
        showMessage('User banned successfully', 'success');
        
    } catch (error) {
        console.error('Ban user error:', error);
        showMessage('Failed to ban user', 'error');
    } finally {
        hideLoading();
    }
}

async function unbanUser(userId) {
    if (!confirm('Are you sure you want to unban this user?')) return;
    
    try {
        showLoading();
        
        const { error } = await supabase
            .from('users')
            .update({
                banned: false,
                ban_reason: null,
                ban_time: null,
                unban_time: null
            })
            .eq('id', userId);
            
        if (error) throw error;
        
        // Update local data
        const userIndex = allUsers.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            allUsers[userIndex].banned = false;
            allUsers[userIndex].ban_reason = null;
            allUsers[userIndex].ban_time = null;
            allUsers[userIndex].unban_time = null;
        }
        
        renderUsersPage();
        showMessage('User unbanned successfully', 'success');
        
    } catch (error) {
        console.error('Unban user error:', error);
        showMessage('Failed to unban user', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
        showLoading();
        
        const { error } = await supabase
            .from('users')
            .update({ deleted: true })
            .eq('id', userId);
            
        if (error) throw error;
        
        // Update local data
        const userIndex = allUsers.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            allUsers[userIndex].deleted = true;
        }
        
        renderUsersPage();
        showMessage('User deleted successfully', 'success');
        
    } catch (error) {
        console.error('Delete user error:', error);
        showMessage('Failed to delete user', 'error');
    } finally {
        hideLoading();
    }
}

// Products Page
function renderProductsPage() {
    const productsList = document.getElementById('productsList');
    const addProductBtn = document.getElementById('addProductBtn');
    
    function renderProducts() {
        productsList.innerHTML = allProducts.map(product => `
            <div class="product-card">
                ${product.images_urls && product.images_urls[0] ? 
                    `<img src="${product.images_urls[0]}" alt="${product.name}" class="product-image">` :
                    `<div class="product-placeholder">No Image</div>`
                }
                <div class="product-content">
                    <div class="product-category">${product.category.replace('_', ' ').toUpperCase()}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${renderCustomEmojis(product.description).substring(0, 100)}...</p>
                    <div class="product-price">${formatPrice(product.price, product.currency)}</div>
                    <div class="product-actions">
                        <button class="edit-btn" onclick="editProduct('${product.id}')">Edit</button>
                        <button class="remove-btn" onclick="deleteProduct('${product.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    if (addProductBtn && !addProductBtn.hasListener) {
        addProductBtn.addEventListener('click', () => openProductModal());
        addProductBtn.hasListener = true;
    }
    
    renderProducts();
}

function openProductModal(productId = null) {
    const product = productId ? allProducts.find(p => p.id === productId) : null;
    const isEdit = !!product;
    
    elements.modalTitle.textContent = isEdit ? 'Edit Product' : 'Add New Product';
    elements.modalBody.innerHTML = `
        <form id="productForm" class="product-form">
            <div class="form-group">
                <label>Category</label>
                <select id="productCategory" required>
                    <option value="">Select Category</option>
                    <option value="pubg_account" ${product?.category === 'pubg_account' ? 'selected' : ''}>PUBG Account</option>
                    <option value="pubg_voucher" ${product?.category === 'pubg_voucher' ? 'selected' : ''}>PUBG Voucher</option>
                    <option value="mlbb_account" ${product?.category === 'mlbb_account' ? 'selected' : ''}>ML Account</option>
                    <option value="mlbb_diamond" ${product?.category === 'mlbb_diamond' ? 'selected' : ''}>ML Diamond</option>
                    <option value="telegram_premium" ${product?.category === 'telegram_premium' ? 'selected' : ''}>Telegram Premium</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Name</label>
                <input type="text" id="productName" value="${product?.name || ''}" required>
            </div>
            
            <div class="form-group">
                <label>Description</label>
                <textarea id="productDescription" rows="4">${product?.description || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label>Price</label>
                <input type="number" id="productPrice" value="${product?.price || ''}" required>
            </div>
            
            <div class="form-group">
                <label>Currency</label>
                <select id="productCurrency">
                    <option value="MMK" ${product?.currency === 'MMK' ? 'selected' : ''}>MMK</option>
                    <option value="USD" ${product?.currency === 'USD' ? 'selected' : ''}>USD</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Images</label>
                <div class="file-upload" onclick="document.getElementById('productImages').click()">
                    <input type="file" id="productImages" multiple accept="image/*">
                    <p>Click to upload images</p>
                </div>
                <div id="imagePreview" class="file-preview"></div>
            </div>
            
            <div class="form-actions">
                <button type="button" onclick="closeModal('adminModal')">Cancel</button>
                <button type="submit">${isEdit ? 'Update' : 'Create'} Product</button>
            </div>
        </form>
    `;
    
    // Setup image preview
    const imageInput = document.getElementById('productImages');
    const imagePreview = document.getElementById('imagePreview');
    
    imageInput.addEventListener('change', (e) => {
        imagePreview.innerHTML = '';
        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'preview-item';
                div.innerHTML = `
                    <img src="${e.target.result}" class="preview-image">
                    <button type="button" class="remove-preview" onclick="this.parentElement.remove()">×</button>
                `;
                imagePreview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    });
    
    // Form submission
    document.getElementById('productForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveProduct(productId);
    });
    
    elements.adminModal.classList.add('show');
}

async function saveProduct(productId = null) {
    const category = document.getElementById('productCategory').value;
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const currency = document.getElementById('productCurrency').value;
    const imageFiles = document.getElementById('productImages').files;
    
    if (!category || !name || !price) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        showLoading();
        
        let imageUrls = [];
        
        // Upload images if any
        if (imageFiles.length > 0) {
            for (const file of imageFiles) {
                const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('uploads')
                    .upload(fileName, file);
                    
                if (uploadError) throw uploadError;
                
                const { data: { publicUrl } } = supabase.storage
                    .from('uploads')
                    .getPublicUrl(fileName);
                    
                imageUrls.push(publicUrl);
            }
        }
        
        const productData = {
            category,
            name,
            description,
            price,
            currency,
            images_urls: imageUrls.length > 0 ? imageUrls : (productId ? allProducts.find(p => p.id === productId)?.images_urls : [])
        };
        
        let result;
        if (productId) {
            // Update existing product
            result = await supabase
                .from('products')
                .update(productData)
                .eq('id', productId)
                .select()
                .single();
        } else {
            // Create new product
            result = await supabase
                .from('products')
                .insert([productData])
                .select()
                .single();
        }
        
        if (result.error) throw result.error;
        
        // Update local data
        if (productId) {
            const index = allProducts.findIndex(p => p.id === productId);
            if (index !== -1) {
                allProducts[index] = result.data;
            }
        } else {
            allProducts.unshift(result.data);
        }
        
        closeModal('adminModal');
        renderProductsPage();
        showMessage(`Product ${productId ? 'updated' : 'created'} successfully! 🎉`, 'success');
        
    } catch (error) {
        console.error('Save product error:', error);
        showMessage('Failed to save product', 'error');
    } finally {
        hideLoading();
    }
}

function editProduct(productId) {
    openProductModal(productId);
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        showLoading();
        
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);
            
        if (error) throw error;
        
        // Update local data
        allProducts = allProducts.filter(p => p.id !== productId);
        
        renderProductsPage();
        showMessage('Product deleted successfully', 'success');
        
    } catch (error) {
        console.error('Delete product error:', error);
        showMessage('Failed to delete product', 'error');
    } finally {
        hideLoading();
    }
}

// Orders Page
function renderOrdersPage() {
    const ordersList = document.getElementById('ordersList');
    const statusFilter = document.getElementById('orderStatusFilter');
    const refreshBtn = document.getElementById('refreshOrders');
    
    function renderOrders(orders = allOrders) {
        ordersList.innerHTML = orders.map(order => `
            <div class="order-card" onclick="showOrderDetails('${order.id}')">
                <div class="order-header">
                    <div class="order-id">${order.order_id}</div>
                    <div class="order-status ${order.status}">${order.status.toUpperCase()}</div>
                </div>
                <div class="order-info">
                    <div class="order-field">
                        <label>Customer</label>
                        <span>${order.users?.username || 'Unknown'}</span>
                    </div>
                    <div class="order-field">
                        <label>Product</label>
                        <span>${order.products?.name || order.vouchers?.amount || 'Unknown'}</span>
                    </div>
                    <div class="order-field">
                        <label>Payment</label>
                        <span>${order.payment_method}</span>
                    </div>
                    <div class="order-field">
                        <label>Date</label>
                        <span>${formatDate(order.created_at)}</span>
                    </div>
                </div>
                ${order.status === 'pending' ? `
                    <div class="order-actions" onclick="event.stopPropagation()">
                        <button class="approve-btn" onclick="approveOrder('${order.id}')">Approve</button>
                        <button class="reject-btn" onclick="rejectOrder('${order.id}')">Reject</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
    
    // Filter functionality
    if (statusFilter && !statusFilter.hasListener) {
        statusFilter.addEventListener('change', (e) => {
            const status = e.target.value;
            const filteredOrders = status ? allOrders.filter(o => o.status === status) : allOrders;
            renderOrders(filteredOrders);
        });
        statusFilter.hasListener = true;
    }
    
    // Refresh functionality
    if (refreshBtn && !refreshBtn.hasListener) {
        refreshBtn.addEventListener('click', () => {
            loadDashboardData();
            showMessage('Orders refreshed', 'success');
        });
        refreshBtn.hasListener = true;
    }
    
    renderOrders();
}

function showOrderDetails(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    elements.orderModalBody.innerHTML = `
        <div class="order-details">
            <div class="order-header">
                <h3>${order.order_id}</h3>
                <div class="order-status ${order.status}">${order.status.toUpperCase()}</div>
            </div>
            
            <div class="order-info-grid">
                <div class="info-section">
                    <h4>Customer Information</h4>
                    <p><strong>Username:</strong> ${order.users?.username || 'Unknown'}</p>
                    <p><strong>Email:</strong> ${order.users?.email || 'Unknown'}</p>
                    <p><strong>Buyer Name:</strong> ${order.buyer_name}</p>
                    <p><strong>Contact:</strong> ${order.contact_platform} - ${order.contact_address}</p>
                </div>
                
                <div class="info-section">
                    <h4>Order Information</h4>
                    <p><strong>Product:</strong> ${order.products?.name || order.vouchers?.amount || 'Unknown'}</p>
                    <p><strong>Game ID:</strong> ${order.game_id || 'N/A'}</p>
                    <p><strong>Payment Method:</strong> ${order.payment_method}</p>
                    <p><strong>Transaction Ref:</strong> ${order.transaction_ref}</p>
                    <p><strong>Order Date:</strong> ${formatDate(order.created_at)}</p>
                </div>
            </div>
            
            ${order.approval_note ? `
                <div class="info-section">
                    <h4>Admin Note</h4>
                    <p>${order.approval_note}</p>
                </div>
            ` : ''}
            
            ${order.status === 'pending' ? `
                <div class="order-actions-modal">
                    <button class="approve-btn" onclick="approveOrder('${order.id}'); closeModal('orderModal')">Approve Order</button>
                    <button class="reject-btn" onclick="rejectOrder('${order.id}'); closeModal('orderModal')">Reject Order</button>
                </div>
            ` : ''}
        </div>
    `;
    
    elements.orderModal.classList.add('show');
}

async function approveOrder(orderId) {
    const note = prompt('Enter approval note (optional):') || 'Order approved';
    
    try {
        showLoading();
        
        const { error } = await supabase
            .from('orders')
            .update({
                status: 'approved',
                approval_note: note
            })
            .eq('id', orderId);
            
        if (error) throw error;
        
        // Update local data
        const orderIndex = allOrders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            allOrders[orderIndex].status = 'approved';
            allOrders[orderIndex].approval_note = note;
        }
        
        renderOrdersPage();
        showMessage('Order approved successfully! ✅', 'success');
        
    } catch (error) {
        console.error('Approve order error:', error);
        showMessage('Failed to approve order', 'error');
    } finally {
        hideLoading();
    }
}

async function rejectOrder(orderId) {
    const note = prompt('Enter rejection reason:');
    if (!note) return;
    
    try {
        showLoading();
        
        const { error } = await supabase
            .from('orders')
            .update({
                status: 'rejected',
                approval_note: note
            })
            .eq('id', orderId);
            
        if (error) throw error;
        
        // Update local data
        const orderIndex = allOrders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            allOrders[orderIndex].status = 'rejected';
            allOrders[orderIndex].approval_note = note;
        }
        
        renderOrdersPage();
        showMessage('Order rejected', 'success');
        
    } catch (error) {
        console.error('Reject order error:', error);
        showMessage('Failed to reject order', 'error');
    } finally {
        hideLoading();
    }
}

// Payments Page
function renderPaymentsPage() {
    const paymentsList = document.getElementById('paymentsList');
    const addPaymentBtn = document.getElementById('addPaymentBtn');
    
    function renderPayments() {
        paymentsList.innerHTML = allPayments.map(payment => `
            <div class="payment-card">
                <div class="payment-header">
                    ${payment.icon_url ? 
                        `<img src="${payment.icon_url}" alt="${payment.name}" class="payment-icon">` :
                        `<div class="payment-icon" style="background: #00b4ff; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">💳</div>`
                    }
                    <div class="payment-info">
                        <h3>${payment.name}</h3>
                    </div>
                </div>
                <div class="payment-address">${payment.address}</div>
                <div class="payment-description">${renderCustomEmojis(payment.description)}</div>
                <div class="payment-actions">
                    <button class="edit-btn" onclick="editPayment('${payment.id}')">Edit</button>
                    <button class="remove-btn" onclick="deletePayment('${payment.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }
    
    if (addPaymentBtn && !addPaymentBtn.hasListener) {
        addPaymentBtn.addEventListener('click', () => openPaymentModal());
        addPaymentBtn.hasListener = true;
    }
    
    renderPayments();
}

function openPaymentModal(paymentId = null) {
    const payment = paymentId ? allPayments.find(p => p.id === paymentId) : null;
    const isEdit = !!payment;
    
    elements.modalTitle.textContent = isEdit ? 'Edit Payment Method' : 'Add Payment Method';
    elements.modalBody.innerHTML = `
        <form id="paymentForm" class="payment-form">
            <div class="form-group">
                <label>Name</label>
                <input type="text" id="paymentName" value="${payment?.name || ''}" required>
            </div>
            
            <div class="form-group">
                <label>Address/Number</label>
                <input type="text" id="paymentAddress" value="${payment?.address || ''}" required>
            </div>
            
            <div class="form-group">
                <label>Description</label>
                <textarea id="paymentDescription" rows="3">${payment?.description || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label>Icon</label>
                <div class="file-upload" onclick="document.getElementById('paymentIcon').click()">
                    <input type="file" id="paymentIcon" accept="image/*">
                    <p>Click to upload icon</p>
                </div>
                <div id="iconPreview" class="file-preview"></div>
            </div>
            
            <div class="form-actions">
                <button type="button" onclick="closeModal('adminModal')">Cancel</button>
                <button type="submit">${isEdit ? 'Update' : 'Create'} Payment Method</button>
            </div>
        </form>
    `;
    
    // Setup icon preview
    const iconInput = document.getElementById('paymentIcon');
    const iconPreview = document.getElementById('iconPreview');
    
    iconInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                iconPreview.innerHTML = `
                    <div class="preview-item">
                        <img src="${e.target.result}" class="preview-image">
                        <button type="button" class="remove-preview" onclick="this.parentElement.remove(); document.getElementById('paymentIcon').value = '';">×</button>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Form submission
    document.getElementById('paymentForm').addEventListener('submit', (e) => {
        e.preventDefault();
        savePayment(paymentId);
    });
    
    elements.adminModal.classList.add('show');
}

async function savePayment(paymentId = null) {
    const name = document.getElementById('paymentName').value;
    const address = document.getElementById('paymentAddress').value;
    const description = document.getElementById('paymentDescription').value;
    const iconFile = document.getElementById('paymentIcon').files[0];
    
    if (!name || !address) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        showLoading();
        
        let iconUrl = paymentId ? allPayments.find(p => p.id === paymentId)?.icon_url : '';
        
        // Upload icon if provided
        if (iconFile) {
            const fileName = `payment-${Date.now()}-${Math.random().toString(36).substring(7)}.${iconFile.name.split('.').pop()}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(fileName, iconFile);
                
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage
                .from('uploads')
                .getPublicUrl(fileName);
                
            iconUrl = publicUrl;
        }
        
        const paymentData = {
            name,
            address,
            description,
            icon_url: iconUrl
        };
        
        let result;
        if (paymentId) {
            // Update existing payment
            result = await supabase
                .from('payments')
                .update(paymentData)
                .eq('id', paymentId)
                .select()
                .single();
        } else {
            // Create new payment
            result = await supabase
                .from('payments')
                .insert([paymentData])
                .select()
                .single();
        }
        
        if (result.error) throw result.error;
        
        // Update local data
        if (paymentId) {
            const index = allPayments.findIndex(p => p.id === paymentId);
            if (index !== -1) {
                allPayments[index] = result.data;
            }
        } else {
            allPayments.unshift(result.data);
        }
        
        closeModal('adminModal');
        renderPaymentsPage();
        showMessage(`Payment method ${paymentId ? 'updated' : 'created'} successfully! 💳`, 'success');
        
    } catch (error) {
        console.error('Save payment error:', error);
        showMessage('Failed to save payment method', 'error');
    } finally {
        hideLoading();
    }
}

function editPayment(paymentId) {
    openPaymentModal(paymentId);
}

async function deletePayment(paymentId) {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    
    try {
        showLoading();
        
        const { error } = await supabase
            .from('payments')
            .delete()
            .eq('id', paymentId);
            
        if (error) throw error;
        
        // Update local data
        allPayments = allPayments.filter(p => p.id !== paymentId);
        
        renderPaymentsPage();
        showMessage('Payment method deleted successfully', 'success');
        
    } catch (error) {
        console.error('Delete payment error:', error);
        showMessage('Failed to delete payment method', 'error');
    } finally {
        hideLoading();
    }
}

// News Page
function renderNewsPage() {
    const newsList = document.getElementById('newsList');
    const addNewsBtn = document.getElementById('addNewsBtn');
    
    function renderNews() {
        newsList.innerHTML = allNews.map(news => `
            <div class="news-card">
                ${news.images_urls && news.images_urls.length > 0 ? `
                    <div class="news-images">
                        ${news.images_urls.slice(0, 3).map(img => `
                            <img src="${img}" alt="News Image" class="news-image">
                        `).join('')}
                    </div>
                ` : ''}
                <div class="news-content">
                    <h3 class="news-title">${news.title}</h3>
                    <p class="news-description">${renderCustomEmojis(news.description).substring(0, 150)}...</p>
                    <div class="news-actions">
                        <button class="edit-btn" onclick="editNews('${news.id}')">Edit</button>
                        <button class="remove-btn" onclick="deleteNews('${news.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    if (addNewsBtn && !addNewsBtn.hasListener) {
        addNewsBtn.addEventListener('click', () => openNewsModal());
        addNewsBtn.hasListener = true;
    }
    
    renderNews();
}

function openNewsModal(newsId = null) {
    const news = newsId ? allNews.find(n => n.id === newsId) : null;
    const isEdit = !!news;
    
    elements.modalTitle.textContent = isEdit ? 'Edit News' : 'Add News';
    elements.modalBody.innerHTML = `
        <form id="newsForm" class="news-form">
            <div class="form-group">
                <label>Title</label>
                <input type="text" id="newsTitle" value="${news?.title || ''}" required>
            </div>
            
            <div class="form-group">
                <label>Description</label>
                <textarea id="newsDescription" rows="5">${news?.description || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label>Images</label>
                <div class="file-upload" onclick="document.getElementById('newsImages').click()">
                    <input type="file" id="newsImages" multiple accept="image/*">
                    <p>Click to upload images</p>
                </div>
                <div id="newsImagePreview" class="file-preview"></div>
            </div>
            
            <div class="form-group">
                <label>Video</label>
                <div class="file-upload" onclick="document.getElementById('newsVideo').click()">
                    <input type="file" id="newsVideo" accept="video/*">
                    <p>Click to upload video</p>
                </div>
                <div id="newsVideoPreview" class="file-preview"></div>
            </div>
            
            <div class="form-group">
                <label>Telegram Link</label>
                <input type="url" id="newsTelegramLink" value="${news?.telegram_link || ''}" placeholder="https://t.me/...">
            </div>
            
            <div class="form-actions">
                <button type="button" onclick="closeModal('adminModal')">Cancel</button>
                <button type="submit">${isEdit ? 'Update' : 'Create'} News</button>
            </div>
        </form>
    `;
    
    // Setup file previews
    setupFilePreview('newsImages', 'newsImagePreview', 'image');
    setupFilePreview('newsVideo', 'newsVideoPreview', 'video');
    
    // Form submission
    document.getElementById('newsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveNews(newsId);
    });
    
    elements.adminModal.classList.add('show');
}

function setupFilePreview(inputId, previewId, type) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    input.addEventListener('change', (e) => {
        preview.innerHTML = '';
        const files = type === 'image' ? Array.from(e.target.files) : [e.target.files[0]];
        
        files.filter(Boolean).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'preview-item';
                
                if (type === 'image') {
                    div.innerHTML = `
                        <img src="${e.target.result}" class="preview-image">
                        <button type="button" class="remove-preview" onclick="this.parentElement.remove()">×</button>
                    `;
                } else {
                    div.innerHTML = `
                        <video src="${e.target.result}" class="preview-image" controls></video>
                        <button type="button" class="remove-preview" onclick="this.parentElement.remove()">×</button>
                    `;
                }
                
                preview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    });
}

async function saveNews(newsId = null) {
    const title = document.getElementById('newsTitle').value;
    const description = document.getElementById('newsDescription').value;
    const telegramLink = document.getElementById('newsTelegramLink').value;
    const imageFiles = document.getElementById('newsImages').files;
    const videoFile = document.getElementById('newsVideo').files[0];
    
    if (!title) {
        showMessage('Please enter a title', 'error');
        return;
    }
    
    try {
        showLoading();
        
        let imageUrls = [];
        let videoUrl = '';
        
        // Upload images if any
        if (imageFiles.length > 0) {
            for (const file of imageFiles) {
                const fileName = `news-${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('uploads')
                    .upload(fileName, file);
                    
                if (uploadError) throw uploadError;
                
                const { data: { publicUrl } } = supabase.storage
                    .from('uploads')
                    .getPublicUrl(fileName);
                    
                imageUrls.push(publicUrl);
            }
        }
        
        // Upload video if provided
        if (videoFile) {
            const fileName = `news-video-${Date.now()}.${videoFile.name.split('.').pop()}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(fileName, videoFile);
                
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage
                .from('uploads')
                .getPublicUrl(fileName);
                
            videoUrl = publicUrl;
        }
        
        const newsData = {
            title,
            description,
            telegram_link: telegramLink,
            images_urls: imageUrls.length > 0 ? imageUrls : (newsId ? allNews.find(n => n.id === newsId)?.images_urls : []),
            video_url: videoUrl || (newsId ? allNews.find(n => n.id === newsId)?.video_url : '')
        };
        
        let result;
        if (newsId) {
            // Update existing news
            result = await supabase
                .from('news')
                .update(newsData)
                .eq('id', newsId)
                .select()
                .single();
        } else {
            // Create new news
            result = await supabase
                .from('news')
                .insert([newsData])
                .select()
                .single();
        }
        
        if (result.error) throw result.error;
        
        // Update local data
        if (newsId) {
            const index = allNews.findIndex(n => n.id === newsId);
            if (index !== -1) {
                allNews[index] = result.data;
            }
        } else {
            allNews.unshift(result.data);
        }
        
        closeModal('adminModal');
        renderNewsPage();
        showMessage(`News ${newsId ? 'updated' : 'created'} successfully! 📰`, 'success');
        
    } catch (error) {
        console.error('Save news error:', error);
        showMessage('Failed to save news', 'error');
    } finally {
        hideLoading();
    }
}

function editNews(newsId) {
    openNewsModal(newsId);
}

async function deleteNews(newsId) {
    if (!confirm('Are you sure you want to delete this news?')) return;
    
    try {
        showLoading();
        
        const { error } = await supabase
            .from('news')
            .delete()
            .eq('id', newsId);
            
        if (error) throw error;
        
        // Update local data
        allNews = allNews.filter(n => n.id !== newsId);
        
        renderNewsPage();
        showMessage('News deleted successfully', 'success');
        
    } catch (error) {
        console.error('Delete news error:', error);
        showMessage('Failed to delete news', 'error');
    } finally {
        hideLoading();
    }
}

// Social Media Page
function renderSocialPage() {
    const socialList = document.getElementById('socialList');
    const addSocialBtn = document.getElementById('addSocialBtn');
    
    function renderSocial() {
        socialList.innerHTML = allSocial.map(social => `
            <div class="social-card">
                <div class="social-platform">${social.platform}</div>
                <div class="social-link">${social.link}</div>
                <div class="social-actions">
                    <button class="edit-btn" onclick="editSocial('${social.id}')">Edit</button>
                    <button class="remove-btn" onclick="deleteSocial('${social.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }
    
    if (addSocialBtn && !addSocialBtn.hasListener) {
        addSocialBtn.addEventListener('click', () => openSocialModal());
        addSocialBtn.hasListener = true;
    }
    
    renderSocial();
}

function openSocialModal(socialId = null) {
    const social = socialId ? allSocial.find(s => s.id === socialId) : null;
    const isEdit = !!social;
    
    elements.modalTitle.textContent = isEdit ? 'Edit Social Media' : 'Add Social Media';
    elements.modalBody.innerHTML = `
        <form id="socialForm" class="social-form">
            <div class="form-group">
                <label>Platform</label>
                <select id="socialPlatform" required>
                    <option value="">Select Platform</option>
                    <option value="YouTube" ${social?.platform === 'YouTube' ? 'selected' : ''}>YouTube</option>
                    <option value="Facebook" ${social?.platform === 'Facebook' ? 'selected' : ''}>Facebook</option>
                    <option value="TikTok" ${social?.platform === 'TikTok' ? 'selected' : ''}>TikTok</option>
                    <option value="Instagram" ${social?.platform === 'Instagram' ? 'selected' : ''}>Instagram</option>
                    <option value="Telegram" ${social?.platform === 'Telegram' ? 'selected' : ''}>Telegram</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Link</label>
                <input type="url" id="socialLink" value="${social?.link || ''}" required>
            </div>
            
            <div class="form-actions">
                <button type="button" onclick="closeModal('adminModal')">Cancel</button>
                <button type="submit">${isEdit ? 'Update' : 'Add'} Social Media</button>
            </div>
        </form>
    `;
    
    // Form submission
    document.getElementById('socialForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveSocial(socialId);
    });
    
    elements.adminModal.classList.add('show');
}

async function saveSocial(socialId = null) {
    const platform = document.getElementById('socialPlatform').value;
    const link = document.getElementById('socialLink').value;
    
    if (!platform || !link) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    try {
        showLoading();
        
        const socialData = { platform, link };
        
        let result;
        if (socialId) {
            // Update existing social
            result = await supabase
                .from('social_media')
                .update(socialData)
                .eq('id', socialId)
                .select()
                .single();
        } else {
            // Create new social
            result = await supabase
                .from('social_media')
                .insert([socialData])
                .select()
                .single();
        }
        
        if (result.error) throw result.error;
        
        // Update local data
        if (socialId) {
            const index = allSocial.findIndex(s => s.id === socialId);
            if (index !== -1) {
                allSocial[index] = result.data;
            }
        } else {
            allSocial.unshift(result.data);
        }
        
        closeModal('adminModal');
        renderSocialPage();
        showMessage(`Social media ${socialId ? 'updated' : 'added'} successfully! 📱`, 'success');
        
    } catch (error) {
        console.error('Save social error:', error);
        showMessage('Failed to save social media', 'error');
    } finally {
        hideLoading();
    }
}

function editSocial(socialId) {
    openSocialModal(socialId);
}

async function deleteSocial(socialId) {
    if (!confirm('Are you sure you want to delete this social media link?')) return;
    
    try {
        showLoading();
        
        const { error } = await supabase
            .from('social_media')
            .delete()
            .eq('id', socialId);
            
        if (error) throw error;
        
        // Update local data
        allSocial = allSocial.filter(s => s.id !== socialId);
        
        renderSocialPage();
        showMessage('Social media deleted successfully', 'success');
        
    } catch (error) {
        console.error('Delete social error:', error);
        showMessage('Failed to delete social media', 'error');
    } finally {
        hideLoading();
    }
}

// About Page
function renderAboutPage() {
    const aboutForm = document.getElementById('aboutForm');
    
    aboutForm.innerHTML = `
        <form id="aboutInfoForm" class="about-info-form">
            <div class="form-group">
                <label>Company Name</label>
                <input type="text" id="aboutName" value="${aboutInfo?.name || ''}" required>
            </div>
            
            <div class="form-group">
                <label>Description</label>
                <textarea id="aboutDescription" rows="5">${aboutInfo?.description || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label>Developer Icon</label>
                <div class="file-upload" onclick="document.getElementById('aboutIcon').click()">
                    <input type="file" id="aboutIcon" accept="image/*">
                    <p>Click to upload developer icon</p>
                </div>
                <div id="aboutIconPreview" class="file-preview"></div>
            </div>
            
            <div class="social-links-form">
                <h4>Social Links</h4>
                <div id="socialLinksContainer">
                    ${aboutInfo?.social_links ? aboutInfo.social_links.map((link, index) => `
                        <div class="social-link-item">
                            <input type="text" placeholder="Link Name" value="${link.name}" data-index="${index}" data-field="name">
                            <input type="url" placeholder="Link URL" value="${link.link}" data-index="${index}" data-field="link">
                            <button type="button" class="remove-social-btn" onclick="removeSocialLink(${index})">×</button>
                        </div>
                    `).join('') : ''}
                </div>
                <button type="button" class="add-social-btn" onclick="addSocialLink()">
                    <i class="fas fa-plus"></i> Add Social Link
                </button>
            </div>
            
            <button type="submit" class="save-btn">Save About Information</button>
        </form>
    `;
    
    // Setup icon preview
    const iconInput = document.getElementById('aboutIcon');
    const iconPreview = document.getElementById('aboutIconPreview');
    
    iconInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                iconPreview.innerHTML = `
                    <div class="preview-item">
                        <img src="${e.target.result}" class="preview-image">
                        <button type="button" class="remove-preview" onclick="this.parentElement.remove(); document.getElementById('aboutIcon').value = '';">×</button>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Form submission
    document.getElementById('aboutInfoForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveAboutInfo();
    });
}

function addSocialLink() {
    const container = document.getElementById('socialLinksContainer');
    const index = container.children.length;
    
    const div = document.createElement('div');
    div.className = 'social-link-item';
    div.innerHTML = `
        <input type="text" placeholder="Link Name" data-index="${index}" data-field="name">
        <input type="url" placeholder="Link URL" data-index="${index}" data-field="link">
        <button type="button" class="remove-social-btn" onclick="removeSocialLink(${index})">×</button>
    `;
    
    container.appendChild(div);
}

function removeSocialLink(index) {
    const container = document.getElementById('socialLinksContainer');
    const items = container.querySelectorAll('.social-link-item');
    if (items[index]) {
        items[index].remove();
    }
}

async function saveAboutInfo() {
    const name = document.getElementById('aboutName').value;
    const description = document.getElementById('aboutDescription').value;
    const iconFile = document.getElementById('aboutIcon').files[0];
    
    // Collect social links
    const socialLinks = [];
    const socialInputs = document.querySelectorAll('#socialLinksContainer .social-link-item');
    
    socialInputs.forEach(item => {
        const nameInput = item.querySelector('input[data-field="name"]');
        const linkInput = item.querySelector('input[data-field="link"]');
        
        if (nameInput.value && linkInput.value) {
            socialLinks.push({
                name: nameInput.value,
                link: linkInput.value
            });
        }
    });
    
    if (!name) {
        showMessage('Please enter company name', 'error');
        return;
    }
    
    try {
        showLoading();
        
        let iconUrl = aboutInfo?.developer_icon_url || '';
        
        // Upload icon if provided
        if (iconFile) {
            const fileName = `about-icon-${Date.now()}.${iconFile.name.split('.').pop()}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(fileName, iconFile);
                
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage
                .from('uploads')
                .getPublicUrl(fileName);
                
            iconUrl = publicUrl;
        }
        
        const aboutData = {
            name,
            description,
            developer_icon_url: iconUrl,
            social_links: socialLinks,
            updated_at: new Date().toISOString()
        };
        
        let result;
        if (aboutInfo) {
            // Update existing about info
            result = await supabase
                .from('about')
                .update(aboutData)
                .eq('id', aboutInfo.id)
                .select()
                .single();
        } else {
            // Create new about info
            result = await supabase
                .from('about')
                .insert([aboutData])
                .select()
                .single();
        }
        
        if (result.error) throw result.error;
        
        aboutInfo = result.data;
        showMessage('About information saved successfully! ℹ️', 'success');
        
    } catch (error) {
        console.error('Save about error:', error);
        showMessage('Failed to save about information', 'error');
    } finally {
        hideLoading();
    }
}

// Modal Management
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Modal close events
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.modal').classList.remove('show');
    });
});

// Click outside modal to close
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});

// Real-time Updates
function setupRealTimeUpdates() {
    // Listen for new orders
    const orderChannel = supabase
        .channel('admin_orders')
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'orders'
            }, 
            (payload) => {
                // Add new order to local data
                allOrders.unshift(payload.new);
                
                // Show notification
                showMessage('🔔 New order received!', 'success');
                
                // Update dashboard if on orders page
                if (currentPage === 'orders') {
                    renderOrdersPage();
                } else if (currentPage === 'dashboard') {
                    updateStatsCards();
                }
            }
        )
        .subscribe();
    
    // Listen for new user registrations
    const userChannel = supabase
        .channel('admin_users')
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'users'
            }, 
            (payload) => {
                // Add new user to local data
                allUsers.unshift(payload.new);
                
                // Show notification
                showMessage('👋 New user registered!', 'success');
                
                // Update dashboard if on users page
                if (currentPage === 'users') {
                    renderUsersPage();
                } else if (currentPage === 'dashboard') {
                    updateStatsCards();
                }
            }
        )
        .subscribe();
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // Hide loading initially
    hideLoading();
    
    // Show admin login initially
    showAdminLogin();
    
    console.log('Mafia Admin Dashboard initialized! 👑');
});

// Setup real-time updates after admin login
function initRealTimeAfterLogin() {
    if (currentAdmin) {
        setupRealTimeUpdates();
    }
}

// Enhanced showAdminDashboard to include real-time setup
const originalShowAdminDashboard = showAdminDashboard;
showAdminDashboard = function() {
    originalShowAdminDashboard();
    initRealTimeAfterLogin();
};

// Global functions for onclick handlers
window.showUserDetails = showUserDetails;
window.banUser = banUser;
window.unbanUser = unbanUser;
window.deleteUser = deleteUser;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.showOrderDetails = showOrderDetails;
window.approveOrder = approveOrder;
window.rejectOrder = rejectOrder;
window.editPayment = editPayment;
window.deletePayment = deletePayment;
window.editNews = editNews;
window.deleteNews = deleteNews;
window.editSocial = editSocial;
window.deleteSocial = deleteSocial;
window.closeModal = closeModal;
window.addSocialLink = addSocialLink;
window.removeSocialLink = removeSocialLink;