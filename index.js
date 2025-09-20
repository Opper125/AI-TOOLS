// Mafia Gaming Platform - User Dashboard JavaScript
// Supabase Configuration
const SUPABASE_URL = 'https://spurpwnaeacgwojfpaem.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdXJwd25hZWFjZ3dvamZwYWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMjU2MDYsImV4cCI6MjA3MzkwMTYwNn0.VTKl3ZU6xVKcn3Ry1XTtY-Fpvm0cVqZiQcloJc33O-Y';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variables
let currentUser = null;
let currentPage = 'home';
let currentCategory = null;
let currentSubcategory = null;
let allProducts = [];
let allVouchers = [];
let allPayments = [];
let userOrders = [];
let newsItems = [];
let socialMedias = [];
let aboutInfo = null;

// DOM Elements
const elements = {
    loadingOverlay: document.getElementById('loadingOverlay'),
    messagePopup: document.getElementById('messagePopup'),
    banOverlay: document.getElementById('banOverlay'),
    authSection: document.getElementById('authSection'),
    dashboardSection: document.getElementById('dashboardSection'),
    navMenu: document.getElementById('navMenu'),
    
    // Auth elements
    signupForm: document.getElementById('signupForm'),
    loginForm: document.getElementById('loginForm'),
    signupEmail: document.getElementById('signupEmail'),
    signupUsername: document.getElementById('signupUsername'),
    signupPin: document.getElementById('signupPin'),
    signupRePin: document.getElementById('signupRePin'),
    signupSubmit: document.getElementById('signupSubmit'),
    loginEmailUsername: document.getElementById('loginEmailUsername'),
    loginPin: document.getElementById('loginPin'),
    loginSubmit: document.getElementById('loginSubmit'),
    
    // Pages
    homePage: document.getElementById('homePage'),
    newsPage: document.getElementById('newsPage'),
    historyPage: document.getElementById('historyPage'),
    socialPage: document.getElementById('socialPage'),
    profilePage: document.getElementById('profilePage'),
    
    // Category pages
    pubgPage: document.getElementById('pubgPage'),
    mlbbPage: document.getElementById('mlbbPage'),
    telegramPage: document.getElementById('telegramPage'),
    allPage: document.getElementById('allPage'),
    
    // Profile elements
    profilePicture: document.getElementById('profilePicture'),
    profilePictureInput: document.getElementById('profilePictureInput'),
    profileEmail: document.getElementById('profileEmail'),
    profileUsername: document.getElementById('profileUsername'),
    profilePin: document.getElementById('profilePin'),
    updateProfileBtn: document.getElementById('updateProfileBtn'),
    aboutToggle: document.getElementById('aboutToggle'),
    aboutContent: document.getElementById('aboutContent'),
    
    // Modal
    purchaseModal: document.getElementById('purchaseModal'),
    modalTitle: document.getElementById('modalTitle'),
    purchaseDetails: document.getElementById('purchaseDetails')
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

function showBanOverlay(banInfo) {
    const overlay = elements.banOverlay;
    const banReason = document.getElementById('banReason');
    const banTime = document.getElementById('banTime');
    const banTelegramLink = document.getElementById('banTelegramLink');
    
    banReason.textContent = banInfo.ban_reason || 'Your account has been banned.';
    
    if (banInfo.unban_time) {
        const unbanDate = new Date(banInfo.unban_time);
        banTime.textContent = `Ban Duration: Until ${unbanDate.toLocaleDateString()}`;
    } else {
        banTime.textContent = 'Ban Duration: Permanent';
    }
    
    // Set admin contact link (you can get this from admin settings)
    banTelegramLink.href = 'https://t.me/mafiaplatform';
    
    overlay.classList.add('show');
}

function hideBanOverlay() {
    elements.banOverlay.classList.remove('show');
}

// Animation helper
function animateElement(element, animation) {
    element.style.animation = animation;
    element.addEventListener('animationend', () => {
        element.style.animation = '';
    }, { once: true });
}

// Font cycling animation
function cycleFont(element) {
    const fonts = [
        'Inter, sans-serif',
        'Orbitron, monospace',
        '"Courier New", monospace',
        '"Arial Black", sans-serif'
    ];
    
    let currentFont = 0;
    setInterval(() => {
        currentFont = (currentFont + 1) % fonts.length;
        element.style.fontFamily = fonts[currentFont];
    }, 3000);
}

// Initialize font cycling for headers
function initFontCycling() {
    const headers = document.querySelectorAll('.page-header h1, .auth-form h2, .category-nav h2');
    headers.forEach(header => {
        cycleFont(header);
    });
}

// Authentication Functions
async function validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
        return 'Please enter a valid Gmail address';
    }
    
    // Check if email exists
    const { data } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .eq('deleted', false)
        .single();
        
    if (data) {
        return 'Email already exists';
    }
    
    return null;
}

async function validateUsername(username) {
    const usernameRegex = /^[A-Z][a-zA-Z0-9]*\d+[a-zA-Z0-9]*$/;
    if (!usernameRegex.test(username)) {
        return 'Username must start with uppercase letter and contain at least one number';
    }
    
    if (username.length < 6) {
        return 'Username must be at least 6 characters';
    }
    
    // Check if username exists
    const { data } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .eq('deleted', false)
        .single();
        
    if (data) {
        return 'Username already taken';
    }
    
    return null;
}

function validatePin(pin) {
    if (pin.length < 6) {
        return 'PIN must be at least 6 digits';
    }
    
    if (!/^\d+$/.test(pin)) {
        return 'PIN must contain only numbers';
    }
    
    return null;
}

function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + 'Error');
    if (errorElement) {
        errorElement.textContent = message || '';
        errorElement.classList.toggle('show', !!message);
    }
}

// Real-time validation
function setupFormValidation() {
    let validationTimeout;
    
    // Email validation
    elements.signupEmail.addEventListener('input', () => {
        clearTimeout(validationTimeout);
        validationTimeout = setTimeout(async () => {
            const error = await validateEmail(elements.signupEmail.value);
            showFieldError('email', error);
            checkFormValidity();
        }, 500);
    });
    
    // Username validation
    elements.signupUsername.addEventListener('input', () => {
        clearTimeout(validationTimeout);
        validationTimeout = setTimeout(async () => {
            const error = await validateUsername(elements.signupUsername.value);
            showFieldError('username', error);
            checkFormValidity();
        }, 500);
    });
    
    // PIN validation
    elements.signupPin.addEventListener('input', () => {
        const error = validatePin(elements.signupPin.value);
        showFieldError('pin', error);
        
        // Check PIN match
        if (elements.signupRePin.value) {
            const matchError = elements.signupPin.value !== elements.signupRePin.value ? 'PINs do not match' : null;
            showFieldError('repin', matchError);
        }
        
        checkFormValidity();
    });
    
    // Re-PIN validation
    elements.signupRePin.addEventListener('input', () => {
        const error = elements.signupPin.value !== elements.signupRePin.value ? 'PINs do not match' : null;
        showFieldError('repin', error);
        checkFormValidity();
    });
}

async function checkFormValidity() {
    const email = elements.signupEmail.value;
    const username = elements.signupUsername.value;
    const pin = elements.signupPin.value;
    const rePin = elements.signupRePin.value;
    
    if (!email || !username || !pin || !rePin) {
        elements.signupSubmit.disabled = true;
        return;
    }
    
    const emailError = await validateEmail(email);
    const usernameError = await validateUsername(username);
    const pinError = validatePin(pin);
    const rePinError = pin !== rePin ? 'PINs do not match' : null;
    
    const isValid = !emailError && !usernameError && !pinError && !rePinError;
    elements.signupSubmit.disabled = !isValid;
}

// Auth toggle
document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const authType = btn.dataset.auth;
        
        // Update toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Switch forms
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        document.getElementById(authType + 'Form').classList.add('active');
        
        // Clear form data
        document.querySelectorAll('.auth-form input').forEach(input => input.value = '');
        document.querySelectorAll('.error-message').forEach(error => {
            error.classList.remove('show');
            error.textContent = '';
        });
        
        if (authType === 'signup') {
            elements.signupSubmit.disabled = true;
        }
    });
});

// Sign up
elements.signupSubmit.addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (elements.signupSubmit.disabled) return;
    
    showLoading();
    
    try {
        const userData = {
            email: elements.signupEmail.value,
            username: elements.signupUsername.value,
            pin: elements.signupPin.value
        };
        
        const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select()
            .single();
            
        if (error) throw error;
        
        currentUser = data;
        showMessage('Account created successfully! Welcome to Mafia Platform! 🎉', 'success');
        
        setTimeout(() => {
            showDashboard();
        }, 1500);
        
    } catch (error) {
        console.error('Signup error:', error);
        showMessage('Failed to create account. Please try again.', 'error');
    } finally {
        hideLoading();
    }
});

// Login
elements.loginSubmit.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const emailOrUsername = elements.loginEmailUsername.value;
    const pin = elements.loginPin.value;
    
    if (!emailOrUsername || !pin) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    showLoading();
    
    try {
        // Try to find user by email or username
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
            .eq('pin', pin)
            .eq('deleted', false);
            
        if (error) throw error;
        
        if (!users || users.length === 0) {
            showFieldError('loginEmail', 'Invalid credentials');
            return;
        }
        
        const user = users[0];
        
        // Check if user is banned
        if (user.banned) {
            showBanOverlay(user);
            return;
        }
        
        currentUser = user;
        showMessage('Login successful! Welcome back! 🎮', 'success');
        
        setTimeout(() => {
            showDashboard();
        }, 1500);
        
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Login failed. Please check your credentials.', 'error');
    } finally {
        hideLoading();
    }
});

// Dashboard Functions
function showDashboard() {
    elements.authSection.style.display = 'none';
    elements.dashboardSection.style.display = 'block';
    elements.navMenu.style.display = 'flex';
    hideBanOverlay();
    
    // Load dashboard data
    loadDashboardData();
    initializeNavigation();
    setupProfilePicture();
}

function showAuth() {
    elements.authSection.style.display = 'flex';
    elements.dashboardSection.style.display = 'none';
    elements.navMenu.style.display = 'none';
    currentUser = null;
}

async function loadDashboardData() {
    try {
        showLoading();
        
        // Load all data in parallel
        const [productsRes, vouchersRes, paymentsRes, ordersRes, newsRes, socialRes, aboutRes] = await Promise.all([
            supabase.from('products').select('*').order('created_at', { ascending: false }),
            supabase.from('vouchers').select('*, products(*)').order('created_at', { ascending: false }),
            supabase.from('payments').select('*').order('created_at', { ascending: false }),
            supabase.from('orders').select('*, products(*), vouchers(*)').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
            supabase.from('news').select('*').order('created_at', { ascending: false }),
            supabase.from('social_media').select('*').order('created_at', { ascending: false }),
            supabase.from('about').select('*').single()
        ]);
        
        allProducts = productsRes.data || [];
        allVouchers = vouchersRes.data || [];
        allPayments = paymentsRes.data || [];
        userOrders = ordersRes.data || [];
        newsItems = newsRes.data || [];
        socialMedias = socialRes.data || [];
        aboutInfo = aboutRes.data;
        
        // Render initial pages
        renderHomePage();
        renderNewsPage();
        renderHistoryPage();
        renderSocialPage();
        renderProfilePage();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showMessage('Failed to load data. Please refresh the page.', 'error');
    } finally {
        hideLoading();
    }
}

// Navigation
function initializeNavigation() {
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            showPage(page);
        });
    });
    
    // Category cards
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            showCategory(category);
        });
    });
    
    // Back buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const backTo = btn.dataset.back;
            if (backTo === 'home') {
                showHomePage();
            }
        });
    });
    
    // Subcategory cards
    document.querySelectorAll('.subcategory-card').forEach(card => {
        card.addEventListener('click', () => {
            const subcategory = card.dataset.subcategory;
            showSubcategory(subcategory);
        });
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            showAuth();
            showMessage('Logged out successfully', 'success');
        }
    });
}

function showPage(page) {
    currentPage = page;
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.category-page').forEach(p => p.classList.remove('active'));
    
    // Show selected page
    const pageElement = document.getElementById(page + 'Page');
    if (pageElement) {
        pageElement.classList.add('active');
        animateElement(pageElement, 'fadeInUp 0.4s ease-out');
    }
}

function showCategory(category) {
    currentCategory = category;
    
    // Hide home page elements
    document.querySelector('.game-categories').style.display = 'none';
    
    // Show category page
    document.querySelectorAll('.category-page').forEach(p => p.classList.remove('active'));
    const categoryPage = document.getElementById(category + 'Page');
    if (categoryPage) {
        categoryPage.classList.add('active');
        animateElement(categoryPage, 'slideInLeft 0.4s ease-out');
    }
    
    // Load category-specific data
    if (category === 'telegram') {
        renderTelegramProducts();
    } else if (category === 'all') {
        renderAllProducts();
    }
}

function showSubcategory(subcategory) {
    currentSubcategory = subcategory;
    
    // Hide category navigation
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';
    container.style.display = 'block';
    
    // Render products based on subcategory
    if (subcategory.includes('account')) {
        const category = subcategory.replace('-account', '_account');
        renderProducts(category, 'Accounts');
    } else if (subcategory.includes('voucher') || subcategory.includes('diamond')) {
        const category = subcategory.replace('-voucher', '_voucher').replace('-diamond', '_diamond');
        renderVouchers(category, subcategory.includes('diamond') ? 'Diamonds' : 'Vouchers');
    }
}

function showHomePage() {
    currentCategory = null;
    currentSubcategory = null;
    
    // Show home elements
    document.querySelector('.game-categories').style.display = 'grid';
    document.querySelectorAll('.category-page').forEach(p => p.classList.remove('active'));
    document.getElementById('productsContainer').style.display = 'none';
}

// Rendering Functions
function renderHomePage() {
    // Home page is mostly static, just ensure it's visible
    showPage('home');
}

function renderProducts(category, title) {
    const container = document.getElementById('productsContainer');
    const products = allProducts.filter(p => p.category === category);
    
    container.innerHTML = `
        <div class="category-nav">
            <button class="back-btn" onclick="showCategory('${currentCategory}')">
                <i class="fas fa-arrow-left"></i> Back
            </button>
            <h2>${title}</h2>
        </div>
        <div class="products-grid">
            ${products.map(product => `
                <div class="product-card" onclick="openPurchaseModal('product', '${product.id}')">
                    <img src="${product.images_urls && product.images_urls[0] ? product.images_urls[0] : '/api/placeholder/300/200'}" 
                         alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description">${renderCustomEmojis(product.description || '')}</p>
                        <div class="product-price">${formatPrice(product.price, product.currency)}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderVouchers(category, title) {
    const container = document.getElementById('productsContainer');
    const vouchers = allVouchers.filter(v => v.products && v.products.category === category);
    
    container.innerHTML = `
        <div class="category-nav">
            <button class="back-btn" onclick="showCategory('${currentCategory}')">
                <i class="fas fa-arrow-left"></i> Back
            </button>
            <h2>${title}</h2>
        </div>
        ${category.includes('voucher') ? `
            <div class="voucher-form">
                <div class="form-group">
                    <label>User ID (UID)</label>
                    <input type="text" id="userGameId" placeholder="Enter your User ID" required>
                </div>
            </div>
        ` : category.includes('diamond') ? `
            <div class="voucher-form">
                <div class="form-group">
                    <label>User ID</label>
                    <input type="text" id="userGameId" placeholder="Enter your User ID" required>
                </div>
                <div class="form-group">
                    <label>Server ID</label>
                    <input type="text" id="serverGameId" placeholder="Enter your Server ID" required>
                </div>
            </div>
        ` : ''}
        <div class="products-grid">
            ${vouchers.map(voucher => `
                <div class="product-card" onclick="openPurchaseModal('voucher', '${voucher.id}')">
                    <div class="voucher-icon">💎</div>
                    <div class="product-info">
                        <h3 class="product-name">${voucher.amount}</h3>
                        <div class="product-price">${formatPrice(voucher.price, voucher.currency)}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderTelegramProducts() {
    const container = document.getElementById('telegramProducts');
    const telegramProducts = allProducts.filter(p => p.category === 'telegram_premium');
    
    container.innerHTML = telegramProducts.map(product => `
        <div class="product-card" onclick="openPurchaseModal('product', '${product.id}')">
            <div class="product-icon">📱</div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${renderCustomEmojis(product.description || '')}</p>
                <div class="product-price">${formatPrice(product.price, product.currency)}</div>
            </div>
        </div>
    `).join('');
}

function renderAllProducts() {
    const container = document.getElementById('allProducts');
    
    container.innerHTML = allProducts.map(product => `
        <div class="product-card" onclick="openPurchaseModal('product', '${product.id}')">
            <img src="${product.images_urls && product.images_urls[0] ? product.images_urls[0] : '/api/placeholder/300/200'}" 
                 alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${renderCustomEmojis(product.description || '')}</p>
                <div class="product-price">${formatPrice(product.price, product.currency)}</div>
            </div>
        </div>
    `).join('');
}

function renderNewsPage() {
    const newsList = document.getElementById('newsList');
    
    newsList.innerHTML = newsItems.map(news => `
        <div class="news-item">
            ${news.images_urls && news.images_urls.length > 0 ? `
                <div class="news-images">
                    ${news.images_urls.map(img => `
                        <img src="${img}" alt="News Image" class="news-image">
                    `).join('')}
                </div>
            ` : ''}
            ${news.video_url ? `
                <video controls class="news-video">
                    <source src="${news.video_url}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            ` : ''}
            <div class="news-content">
                <h3 class="news-title">${news.title}</h3>
                <p class="news-description">${renderCustomEmojis(news.description || '')}</p>
                ${news.telegram_link ? `
                    <a href="${news.telegram_link}" target="_blank" class="news-telegram">
                        <i class="fab fa-telegram"></i> Join Telegram
                    </a>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function renderHistoryPage() {
    const ordersList = document.getElementById('ordersList');
    
    if (userOrders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>No Orders Yet</h3>
                <p>Start shopping to see your order history here!</p>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = userOrders.map(order => {
        const product = order.products;
        const voucher = order.vouchers;
        const item = product || voucher;
        
        return `
            <div class="order-item">
                <div class="order-header">
                    <div class="order-id">${order.order_id}</div>
                    <div class="order-status ${order.status}">${order.status.toUpperCase()}</div>
                </div>
                <div class="order-details">
                    ${item && item.images_urls && item.images_urls[0] ? `
                        <img src="${item.images_urls[0]}" alt="Order Item" class="order-image">
                    ` : `
                        <div class="order-icon">${voucher ? '💎' : '🎮'}</div>
                    `}
                    <div class="order-info">
                        <div class="order-product">
                            ${product ? product.name : voucher ? voucher.amount : 'Unknown Item'}
                        </div>
                        <div class="order-price">
                            ${formatPrice(product ? product.price : voucher ? voucher.price : 0, 'MMK')}
                        </div>
                        <div class="order-date">
                            ${new Date(order.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
                ${order.approval_note ? `
                    <div class="order-note">
                        <strong>Note:</strong> ${order.approval_note}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function renderSocialPage() {
    const socialList = document.getElementById('socialList');
    
    socialList.innerHTML = socialMedias.map(social => {
        let embedCode = '';
        
        if (social.platform.toLowerCase() === 'youtube') {
            const videoId = extractYouTubeId(social.link);
            if (videoId) {
                embedCode = `<iframe class="social-embed" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
            }
        } else if (social.platform.toLowerCase() === 'facebook') {
            embedCode = `<iframe class="social-embed" src="https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(social.link)}&tabs=timeline&width=340&height=200&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId" frameborder="0"></iframe>`;
        }
        
        return `
            <div class="social-item">
                ${embedCode}
                <div class="social-content">
                    <div class="social-platform">${social.platform}</div>
                    <a href="${social.link}" target="_blank" class="social-link">${social.link}</a>
                </div>
            </div>
        `;
    }).join('');
}

function renderProfilePage() {
    if (!currentUser) return;
    
    // Set profile data
    elements.profileEmail.value = currentUser.email;
    elements.profileUsername.value = currentUser.username;
    elements.profilePin.value = currentUser.pin;
    
    // Set profile picture
    if (currentUser.profile_picture_url) {
        elements.profilePicture.src = currentUser.profile_picture_url;
    } else {
        elements.profilePicture.src = 'https://via.placeholder.com/120x120/00b4ff/ffffff?text=' + currentUser.username.charAt(0).toUpperCase();
    }
    
    // Render about section
    if (aboutInfo) {
        const aboutContent = document.getElementById('aboutContent');
        aboutContent.innerHTML = `
            <div class="about-info">
                ${aboutInfo.developer_icon_url ? `
                    <img src="${aboutInfo.developer_icon_url}" alt="Developer" class="developer-icon">
                ` : ''}
                <div class="about-text">
                    <h3>${aboutInfo.name}</h3>
                    <p>${renderCustomEmojis(aboutInfo.description || '')}</p>
                </div>
            </div>
            <div class="social-links">
                ${aboutInfo.social_links ? aboutInfo.social_links.map(link => `
                    <a href="${link.link}" target="_blank" class="social-link">
                        <i class="fas fa-external-link-alt"></i> ${link.name}
                    </a>
                `).join('') : ''}
            </div>
        `;
    }
}

// Profile picture upload
function setupProfilePicture() {
    const changePictureBtn = document.querySelector('.change-picture-btn');
    
    changePictureBtn.addEventListener('click', () => {
        elements.profilePictureInput.click();
    });
    
    elements.profilePictureInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file
        if (!file.type.startsWith('image/')) {
            showMessage('Please select an image file', 'error');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showMessage('Image size must be less than 5MB', 'error');
            return;
        }
        
        try {
            showLoading();
            
            // Upload to Supabase storage
            const fileName = `profile-${currentUser.id}-${Date.now()}.${file.name.split('.').pop()}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(fileName, file);
                
            if (uploadError) throw uploadError;
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('uploads')
                .getPublicUrl(fileName);
            
            // Update user profile
            const { error: updateError } = await supabase
                .from('users')
                .update({ profile_picture_url: publicUrl })
                .eq('id', currentUser.id);
                
            if (updateError) throw updateError;
            
            // Update current user and UI
            currentUser.profile_picture_url = publicUrl;
            elements.profilePicture.src = publicUrl;
            
            showMessage('Profile picture updated successfully! 📸', 'success');
            
        } catch (error) {
            console.error('Profile picture upload error:', error);
            showMessage('Failed to upload profile picture', 'error');
        } finally {
            hideLoading();
        }
    });
}

// Profile update
elements.updateProfileBtn.addEventListener('click', async () => {
    const newUsername = elements.profileUsername.value;
    const newPin = elements.profilePin.value;
    
    // Validate new data
    if (newUsername !== currentUser.username) {
        const usernameError = await validateUsername(newUsername);
        if (usernameError) {
            showMessage(usernameError, 'error');
            return;
        }
    }
    
    const pinError = validatePin(newPin);
    if (pinError) {
        showMessage(pinError, 'error');
        return;
    }
    
    try {
        showLoading();
        
        const { error } = await supabase
            .from('users')
            .update({
                username: newUsername,
                pin: newPin
            })
            .eq('id', currentUser.id);
            
        if (error) throw error;
        
        currentUser.username = newUsername;
        currentUser.pin = newPin;
        
        showMessage('Profile updated successfully! ✨', 'success');
        
    } catch (error) {
        console.error('Profile update error:', error);
        showMessage('Failed to update profile', 'error');
    } finally {
        hideLoading();
    }
});

// About section toggle
elements.aboutToggle.addEventListener('click', () => {
    const content = elements.aboutContent;
    const isActive = elements.aboutToggle.classList.contains('active');
    
    elements.aboutToggle.classList.toggle('active');
    content.classList.toggle('active');
});

// Purchase Modal Functions
function openPurchaseModal(type, id) {
    let item;
    
    if (type === 'product') {
        item = allProducts.find(p => p.id === id);
    } else if (type === 'voucher') {
        item = allVouchers.find(v => v.id === id);
    }
    
    if (!item) return;
    
    const modal = elements.purchaseModal;
    const title = elements.modalTitle;
    const details = elements.purchaseDetails;
    
    title.textContent = `Purchase ${item.name || item.amount}`;
    
    // Get game ID from form if it exists
    let gameIdFields = '';
    if (currentSubcategory && currentSubcategory.includes('voucher')) {
        const gameId = document.getElementById('userGameId')?.value;
        if (!gameId) {
            showMessage('Please enter your User ID first', 'error');
            return;
        }
        gameIdFields = `<input type="hidden" id="purchaseGameId" value="${gameId}">`;
    } else if (currentSubcategory && currentSubcategory.includes('diamond')) {
        const userId = document.getElementById('userGameId')?.value;
        const serverId = document.getElementById('serverGameId')?.value;
        if (!userId || !serverId) {
            showMessage('Please enter both User ID and Server ID first', 'error');
            return;
        }
        gameIdFields = `<input type="hidden" id="purchaseGameId" value="${userId}/${serverId}">`;
    }
    
    details.innerHTML = `
        <div class="purchase-item">
            ${item.images_urls && item.images_urls[0] ? `
                <img src="${item.images_urls[0]}" alt="${item.name}" class="purchase-image">
            ` : ''}
            <div class="purchase-info">
                <h3>${item.name || item.amount}</h3>
                <p>${renderCustomEmojis(item.description || '')}</p>
                <div class="purchase-price">${formatPrice(item.price, item.currency || 'MMK')}</div>
            </div>
        </div>
        
        ${gameIdFields}
        
        <div class="purchase-form">
            <div class="form-group">
                <label>Payment Method</label>
                <select id="purchasePayment" required>
                    <option value="">Select Payment Method</option>
                    ${allPayments.map(payment => `
                        <option value="${payment.id}">${payment.name}</option>
                    `).join('')}
                </select>
            </div>
            
            ${currentCategory === 'telegram' ? `
                <div class="form-group">
                    <label>Telegram Username</label>
                    <input type="text" id="purchaseTelegramUsername" placeholder="@username" required>
                </div>
            ` : ''}
            
            <div class="form-group">
                <label>Transaction Reference</label>
                <input type="text" id="purchaseTransactionRef" placeholder="Enter transaction ID" required>
            </div>
            
            <div class="form-group">
                <label>Buyer Name</label>
                <input type="text" id="purchaseBuyerName" placeholder="Your full name" required>
            </div>
            
            <div class="form-group">
                <label>Contact Platform</label>
                <select id="purchaseContactPlatform" required>
                    <option value="">Select Platform</option>
                    <option value="Telegram">Telegram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Phone">Phone</option>
                    <option value="Email">Email</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Contact Address</label>
                <input type="text" id="purchaseContactAddress" placeholder="Your contact info" required>
            </div>
            
            <div class="purchase-actions">
                <button type="button" class="cancel-btn" onclick="closePurchaseModal()">Cancel</button>
                <button type="button" class="confirm-btn" onclick="confirmPurchase('${type}', '${id}')">Confirm Purchase</button>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
}

function closePurchaseModal() {
    elements.purchaseModal.classList.remove('show');
}

async function confirmPurchase(type, id) {
    const paymentMethod = document.getElementById('purchasePayment').value;
    const transactionRef = document.getElementById('purchaseTransactionRef').value;
    const buyerName = document.getElementById('purchaseBuyerName').value;
    const contactPlatform = document.getElementById('purchaseContactPlatform').value;
    const contactAddress = document.getElementById('purchaseContactAddress').value;
    
    // Validate required fields
    if (!paymentMethod || !transactionRef || !buyerName || !contactPlatform || !contactAddress) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    let gameId = '';
    const gameIdElement = document.getElementById('purchaseGameId');
    if (gameIdElement) {
        gameId = gameIdElement.value;
    }
    
    let telegramUsername = '';
    const telegramElement = document.getElementById('purchaseTelegramUsername');
    if (telegramElement) {
        telegramUsername = telegramElement.value;
        if (currentCategory === 'telegram' && !telegramUsername) {
            showMessage('Please enter your Telegram username', 'error');
            return;
        }
    }
    
    try {
        showLoading();
        
        const orderData = {
            user_id: currentUser.id,
            payment_method: allPayments.find(p => p.id === paymentMethod)?.name,
            transaction_ref: transactionRef,
            buyer_name: buyerName,
            contact_platform: contactPlatform,
            contact_address: contactAddress,
            game_id: gameId || telegramUsername,
            status: 'pending'
        };
        
        if (type === 'product') {
            orderData.product_id = id;
        } else if (type === 'voucher') {
            orderData.voucher_id = id;
        }
        
        const { data, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select('*, products(*), vouchers(*)')
            .single();
            
        if (error) throw error;
        
        // Add to local orders
        userOrders.unshift(data);
        
        closePurchaseModal();
        showMessage(`Order placed successfully! Order ID: ${data.order_id} 🎉`, 'success');
        
        // Refresh history page
        renderHistoryPage();
        
        // Show history page
        showPage('history');
        
    } catch (error) {
        console.error('Purchase error:', error);
        showMessage('Failed to place order. Please try again.', 'error');
    } finally {
        hideLoading();
    }
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

// Utility Functions
function formatPrice(price, currency) {
    return `${parseInt(price).toLocaleString()} ${currency}`;
}

function renderCustomEmojis(text) {
    // This is a placeholder for custom emoji rendering
    // In a real implementation, you would replace custom emoji codes with actual emoji images
    return text;
}

function extractYouTubeId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Real-time updates
function setupRealTimeUpdates() {
    // Listen for order updates
    const orderChannel = supabase
        .channel('orders')
        .on('postgres_changes', 
            { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'orders',
                filter: `user_id=eq.${currentUser.id}`
            }, 
            (payload) => {
                // Update local order
                const orderIndex = userOrders.findIndex(o => o.id === payload.new.id);
                if (orderIndex !== -1) {
                    userOrders[orderIndex] = { ...userOrders[orderIndex], ...payload.new };
                    renderHistoryPage();
                    
                    // Show notification
                    const status = payload.new.status;
                    if (status === 'approved') {
                        showMessage('🎉 Your order has been approved!', 'success');
                    } else if (status === 'rejected') {
                        showMessage('❌ Your order has been rejected. Check order details.', 'error');
                    }
                }
            }
        )
        .subscribe();
    
    // Listen for user updates (ban/unban)
    const userChannel = supabase
        .channel('users')
        .on('postgres_changes', 
            { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'users',
                filter: `id=eq.${currentUser.id}`
            }, 
            (payload) => {
                const updatedUser = payload.new;
                
                if (updatedUser.banned && !currentUser.banned) {
                    // User was banned
                    currentUser = updatedUser;
                    showBanOverlay(updatedUser);
                } else if (!updatedUser.banned && currentUser.banned) {
                    // User was unbanned
                    currentUser = updatedUser;
                    hideBanOverlay();
                    showMessage('🎉 Your account has been unbanned! Welcome back!', 'success');
                } else if (updatedUser.deleted) {
                    // User was deleted
                    showMessage('Your account has been deleted. You will be logged out.', 'error');
                    setTimeout(() => {
                        showAuth();
                    }, 3000);
                }
                
                currentUser = updatedUser;
            }
        )
        .subscribe();
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // Hide loading initially
    hideLoading();
    
    // Initialize font cycling
    initFontCycling();
    
    // Setup form validation
    setupFormValidation();
    
    // Show auth section initially
    showAuth();
    
    console.log('Mafia Gaming Platform initialized! 🎮');
});

// Setup real-time updates after login
function initRealTimeAfterLogin() {
    if (currentUser && currentUser.id) {
        setupRealTimeUpdates();
    }
}

// Call real-time setup after successful login/signup
function enhanceShowDashboard() {
    const originalShowDashboard = showDashboard;
    showDashboard = function() {
        originalShowDashboard();
        initRealTimeAfterLogin();
    };
}

// Global function for onclick handlers
window.showCategory = showCategory;
window.showSubcategory = showSubcategory;
window.openPurchaseModal = openPurchaseModal;
window.closePurchaseModal = closePurchaseModal;
window.confirmPurchase = confirmPurchase;