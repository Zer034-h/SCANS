/**
 * DASHBOARD FUNCTIONALITY
 * Common functions for admin and manager dashboards
 */

// ============================================
// SECTION MANAGEMENT
// ============================================

/**
 * Show specific section
 */
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(`section-${sectionName}`);
    if (section) {
        section.classList.add('active');
    }
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${sectionName}`) {
            item.classList.add('active');
        }
    });
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'stores': 'Kelola Toko',
        'products': 'Kelola Produk',
        'orders': 'Pesanan',
        'users': 'Kelola User',
        'reports': 'Laporan',
        'settings': 'Pengaturan'
    };
    
    const titleElement = document.getElementById('pageTitle');
    if (titleElement) {
        titleElement.textContent = titles[sectionName] || 'Dashboard';
    }
}

/**
 * Toggle sidebar (mobile)
 */
function toggleSidebar() {
    const sidebar = document.querySelector('.dashboard-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

// ============================================
// MANAGER DASHBOARD SPECIFIC
// ============================================

/**
 * Load manager dashboard data
 */
async function loadManagerDashboard() {
    const user = getCurrentUser();
    
    if (!user || !user.store_id) {
        showAlert('error', 'Data toko tidak ditemukan');
        return;
    }
    
    // Update store info in sidebar
    const storeNameEl = document.getElementById('storeName');
    const storeLocationEl = document.getElementById('storeLocation');
    
    if (storeNameEl && user.store_name) {
        storeNameEl.textContent = user.store_name;
    }
    
    // Load products for this store
    await loadStoreProducts(user.store_id);
    
    // Load orders for this store
    await loadStoreOrders(user.store_id);
    
    // Load stats
    await loadStoreStats(user.store_id);
}

/**
 * Load products for a specific store
 */
async function loadStoreProducts(storeId) {
    try {
        // Try API first
        try {
            const response = await fetchWithAuth(`${API_URL}/stores/${storeId}/products`);
            const data = await response.json();
            
            if (data.success) {
                renderProducts(data.data);
                return;
            }
        } catch (error) {
            console.log('API not available, using demo data');
        }
        
        // Fallback to demo data
        const demoProducts = getStoreProductsDemo(storeId);
        renderProducts(demoProducts);
        
    } catch (error) {
        console.error('Error loading products:', error);
        showAlert('error', 'Gagal memuat produk');
    }
}

/**
 * Render products in table
 */
function renderProducts(products) {
    const tableBody = document.getElementById('productsTable');
    
    if (!tableBody) return;
    
    if (products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Belum ada produk</td></tr>';
        return;
    }
    
    tableBody.innerHTML = products.map(product => `
        <tr>
            <td><img src="${product.image}" alt="${product.name}" class="table-img"></td>
            <td>${product.name}</td>
            <td>Rp ${product.price.toLocaleString('id-ID')}</td>
            <td>${product.stock || 0}</td>
            <td><span class="badge badge-success">Aktif</span></td>
            <td>
                <button class="btn-icon" title="Edit" onclick="editProduct(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" title="Hapus" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Load orders for a specific store
 */
async function loadStoreOrders(storeId) {
    try {
        // Demo data for now
        const demoOrders = getStoreOrdersDemo(storeId);
        renderOrders(demoOrders);
        
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

/**
 * Render orders in table
 */
function renderOrders(orders) {
    const tableBody = document.getElementById('ordersTable');
    
    if (!tableBody) return;
    
    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Belum ada pesanan</td></tr>';
        return;
    }
    
    tableBody.innerHTML = orders.map(order => `
        <tr>
            <td>${order.order_number}</td>
            <td>${order.date}</td>
            <td>${order.customer_name}</td>
            <td>Rp ${order.total.toLocaleString('id-ID')}</td>
            <td><span class="badge badge-${order.status_color}">${order.status_text}</span></td>
            <td>
                <button class="btn-icon" title="Detail" onclick="viewOrderDetail('${order.order_number}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Load store statistics
 */
async function loadStoreStats(storeId) {
    // Demo stats
    const stats = {
        totalProducts: 25,
        totalOrders: 150,
        totalRevenue: 4500000,
        rating: 4.8
    };
    
    // Update UI
    const totalProductsEl = document.getElementById('totalProducts');
    const totalOrdersEl = document.getElementById('totalOrders');
    const totalRevenueEl = document.getElementById('totalRevenue');
    const storeRatingEl = document.getElementById('storeRating');
    
    if (totalProductsEl) totalProductsEl.textContent = stats.totalProducts;
    if (totalOrdersEl) totalOrdersEl.textContent = stats.totalOrders;
    if (totalRevenueEl) totalRevenueEl.textContent = 'Rp ' + stats.totalRevenue.toLocaleString('id-ID');
    if (storeRatingEl) storeRatingEl.textContent = stats.rating.toFixed(1);
}

// ============================================
// DEMO DATA HELPERS
// ============================================

/**
 * Get demo products for a store
 */
function getStoreProductsDemo(storeId) {
    // Return subset from menuItems based on store_id
    if (typeof menuItems !== 'undefined') {
        return menuItems.filter(item => item.store_id == storeId);
    }
    
    // Fallback demo data
    return [
        {
            id: 1,
            name: 'Nasi Goreng',
            image: 'asset/img/nasgor.png',
            price: 15000,
            stock: 50
        },
        {
            id: 2,
            name: 'Mie Ayam',
            image: 'asset/img/mieayam.png',
            price: 12000,
            stock: 30
        }
    ];
}

/**
 * Get demo orders for a store
 */
function getStoreOrdersDemo(storeId) {
    return [
        {
            order_number: '#ORD-001',
            date: '27 Nov 2025',
            customer_name: 'John Doe',
            total: 45000,
            status_text: 'Selesai',
            status_color: 'success'
        },
        {
            order_number: '#ORD-002',
            date: '27 Nov 2025',
            customer_name: 'Jane Smith',
            total: 30000,
            status_text: 'Proses',
            status_color: 'warning'
        }
    ];
}

// ============================================
// CRUD ACTIONS
// ============================================

/**
 * Edit product
 */
function editProduct(productId) {
    showAlert('info', 'Fitur edit produk akan segera hadir!');
}

/**
 * Delete product
 */
function deleteProduct(productId) {
    if (confirm('Yakin ingin menghapus produk ini?')) {
        showAlert('success', 'Produk berhasil dihapus! (Demo)');
        // Actual delete would call API
    }
}

/**
 * View order detail
 */
function viewOrderDetail(orderNumber) {
    showAlert('info', `Detail pesanan ${orderNumber} akan segera tersedia!`);
}

// ============================================
// INITIALIZE
// ============================================

// Close sidebar when clicking outside (mobile)
document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.dashboard-sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (sidebar && sidebar.classList.contains('active')) {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    }
});

// Handle section navigation from URL hash
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1);
    if (hash) {
        showSection(hash);
    }
});

// Load initial section from hash
if (window.location.hash) {
    const initialSection = window.location.hash.substring(1);
    showSection(initialSection);
}

