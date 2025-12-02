/**
 * HOME PAGE - Global Search Functionality
 * Cari menu dari semua toko
 */

// Global variables
let allProducts = [];
let currentFilter = 'all';
let currentSearchQuery = '';

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for cart.js to load menuItems (no database needed)
    // Check if menuItems is already available
    if (typeof window.menuItems !== 'undefined' || typeof menuItems !== 'undefined') {
        await loadAllProducts();
        // Ensure DOM elements are ready before initializing
        await waitForElements();
        initializeSearch();
        initializeFilters();
    } else {
        // Wait a bit more if not ready
        setTimeout(async () => {
            await loadAllProducts();
            await waitForElements();
            initializeSearch();
            initializeFilters();
        }, 500);
    }
});

/**
 * Wait for required DOM elements to be available
 */
async function waitForElements() {
    const maxAttempts = 10;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        const searchInput = document.getElementById('globalSearchInput');
        const searchClear = document.getElementById('globalSearchClear');
        const suggestions = document.getElementById('searchSuggestions');
        
        if (searchInput && searchClear && suggestions) {
            console.log('✅ All search elements found');
            return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    console.warn('⚠️ Some search elements not found after waiting');
}

/**
 * Load all products from all stores (local data only, no database)
 */
async function loadAllProducts() {
    try {
        const menuGrid = document.getElementById('globalMenuGrid');
        
        if (!menuGrid) {
            console.error('globalMenuGrid element not found');
            return;
        }
        
        // Show loading
        menuGrid.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Memuat menu dari semua toko...</p>
            </div>
        `;
        
        // Wait for cart.js to load menuItems (retry up to 10 times = 2 seconds max)
        let localMenuItems = null;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts && !localMenuItems) {
            // Check both window.menuItems and menuItems for compatibility
            if (typeof window.menuItems !== 'undefined' && Array.isArray(window.menuItems) && window.menuItems.length > 0) {
                localMenuItems = window.menuItems;
                break;
            } else if (typeof menuItems !== 'undefined' && Array.isArray(menuItems) && menuItems.length > 0) {
                localMenuItems = menuItems;
                break;
            }
            
            // Wait 200ms before next attempt
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }
        
        if (localMenuItems && localMenuItems.length > 0) {
            console.log(`✅ Loaded ${localMenuItems.length} products from local data`);
            allProducts = localMenuItems;
            renderProducts(allProducts);
        } else {
            console.error('menuItems not available after', maxAttempts, 'attempts');
            console.log('window.menuItems:', typeof window.menuItems, window.menuItems);
            console.log('menuItems:', typeof menuItems, menuItems);
            showError('Tidak ada menu tersedia. Pastikan file cart.js sudah dimuat. Silakan refresh halaman.');
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Gagal memuat menu. Silakan refresh halaman.');
    }
}

/**
 * Render products to grid
 */
function renderProducts(products, isSearchResult = false) {
    const menuGrid = document.getElementById('globalMenuGrid');
    const resultsHeader = document.getElementById('searchResultsHeader');
    const resultsTitle = document.getElementById('searchResultsTitle');
    const resultsCount = document.getElementById('searchResultsCount');
    const sectionHeader = document.querySelector('.section-header');
    
    // Show/hide search results header
    if (isSearchResult) {
        resultsHeader.style.display = 'block';
        sectionHeader.style.display = 'none';
        
        if (currentSearchQuery) {
            resultsTitle.textContent = `Hasil untuk "${currentSearchQuery}"`;
        } else {
            resultsTitle.textContent = 'Hasil Filter';
        }
        
        resultsCount.textContent = `${products.length} menu ditemukan`;
    } else {
        resultsHeader.style.display = 'none';
        sectionHeader.style.display = 'block';
    }
    
    // Check if empty
    if (products.length === 0) {
        menuGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Tidak Ada Menu Ditemukan</h3>
                <p>Coba kata kunci lain atau ubah filter</p>
            </div>
        `;
        return;
    }
    
    // Render product cards
    menuGrid.innerHTML = products.map(product => `
        <div class="menu-card" data-menu-id="${product.id}" data-store-id="${product.store_id}">
            <div class="menu-card-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                ${product.is_featured ? '<span class="menu-badge popular">🔥 Populer</span>' : ''}
                <span class="store-badge-mini">${getStoreName(product.store_id)}</span>
            </div>
            <div class="menu-card-body">
                <h3>${product.name}</h3>
                <p class="menu-description">${product.description}</p>
                <div class="menu-meta">
                    <span class="menu-store">
                        <i class="fas fa-store"></i>
                        ${getStoreName(product.store_id)}
                    </span>
                    ${product.sales_count ? `
                        <span class="menu-sales">
                            <i class="fas fa-shopping-bag"></i>
                            ${product.sales_count} terjual
                        </span>
                    ` : ''}
                </div>
                <div class="menu-footer">
                    <span class="price">Rp ${product.price.toLocaleString('id-ID')}</span>
                    <button class="btn-add-cart" onclick="addToCartGlobal(${product.id}, ${product.store_id})">
                        <i class="fas fa-cart-plus"></i> Tambah
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Get store name by ID
 */
function getStoreName(storeId) {
    const storeNames = {
        1: 'Kantin Bu Ani',
        2: 'Warung Mas Budi',
        3: 'Kedai Kopi & Snack'
    };
    return storeNames[storeId] || 'Toko';
}

/**
 * Initialize search functionality
 */
function initializeSearch() {
    const searchInput = document.getElementById('globalSearchInput');
    const searchClear = document.getElementById('globalSearchClear');
    const suggestions = document.getElementById('searchSuggestions');
    
    // Check if elements exist
    if (!searchInput || !searchClear || !suggestions) {
        console.error('Search elements not found:', {
            searchInput: !!searchInput,
            searchClear: !!searchClear,
            suggestions: !!suggestions
        });
        return;
    }
    
    let searchTimeout;
    
    // Search input handler
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        currentSearchQuery = query;
        
        // Show/hide clear button
        if (searchClear) {
            searchClear.style.display = query ? 'block' : 'none';
        }
        
        // Hide suggestions if query too short
        if (query.length < 2) {
            if (suggestions) {
                suggestions.style.display = 'none';
            }
            
            // If empty, show all products
            if (query.length === 0) {
                applyFilter(currentFilter);
            }
            return;
        }
        
        // Debounce search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(query);
            showSuggestions(query);
        }, 300);
    });
    
    // Clear button handler
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            currentSearchQuery = '';
            if (searchClear) {
                searchClear.style.display = 'none';
            }
            if (suggestions) {
                suggestions.style.display = 'none';
            }
            applyFilter(currentFilter);
        });
    }
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.global-search-container')) {
            if (suggestions) {
                suggestions.style.display = 'none';
            }
        }
    });
    
    // Focus search on page load (optional, don't force focus)
    // searchInput.focus();
}

/**
 * Perform search across all products
 */
function performSearch(query) {
    if (!query || typeof query !== 'string') {
        console.error('Invalid search query:', query);
        return;
    }
    
    if (!allProducts || allProducts.length === 0) {
        console.warn('No products available for search');
        renderProducts([], true);
        return;
    }
    
    const searchLower = query.toLowerCase();
    
    let filtered = allProducts.filter(product => {
        if (!product) return false;
        
        const nameMatch = product.name && product.name.toLowerCase().includes(searchLower);
        const descMatch = product.description && product.description.toLowerCase().includes(searchLower);
        const storeMatch = getStoreName(product.store_id).toLowerCase().includes(searchLower);
        
        return nameMatch || descMatch || storeMatch;
    });
    
    // Apply current filter to search results
    filtered = applySortToProducts(filtered, currentFilter);
    
    renderProducts(filtered, true);
}

/**
 * Show search suggestions
 */
function showSuggestions(query) {
    const suggestions = document.getElementById('searchSuggestions');
    
    if (!suggestions) {
        console.error('Search suggestions element not found');
        return;
    }
    
    if (!allProducts || allProducts.length === 0) {
        suggestions.style.display = 'none';
        return;
    }
    
    const searchLower = query.toLowerCase();
    
    // Get unique product names that match
    const matches = allProducts
        .filter(p => p.name && p.name.toLowerCase().includes(searchLower))
        .map(p => ({ name: p.name, store: getStoreName(p.store_id) }))
        .slice(0, 5);
    
    if (matches.length === 0) {
        suggestions.style.display = 'none';
        return;
    }
    
    suggestions.innerHTML = matches.map((item, index) => {
        // Escape HTML and use data attribute instead of inline onclick
        const escapedName = item.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        return `
            <div class="suggestion-item" data-suggestion-index="${index}" data-suggestion-name="${escapedName}">
                <i class="fas fa-search"></i>
                <div class="suggestion-text">
                    <span class="suggestion-name">${item.name}</span>
                    <span class="suggestion-store">${item.store}</span>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners to suggestion items
    suggestions.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const name = item.dataset.suggestionName;
            selectSuggestion(name);
        });
    });
    
    suggestions.style.display = 'block';
}

/**
 * Select suggestion
 */
function selectSuggestion(name) {
    const searchInput = document.getElementById('globalSearchInput');
    const suggestions = document.getElementById('searchSuggestions');
    
    if (!searchInput) {
        console.error('Search input element not found');
        return;
    }
    
    searchInput.value = name;
    currentSearchQuery = name;
    
    if (suggestions) {
        suggestions.style.display = 'none';
    }
    
    // Show/hide clear button
    const searchClear = document.getElementById('globalSearchClear');
    if (searchClear) {
        searchClear.style.display = name ? 'block' : 'none';
    }
    
    performSearch(name);
}

/**
 * Initialize filter buttons
 */
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.quick-filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Apply filter
            const filter = button.dataset.filter;
            currentFilter = filter;
            applyFilter(filter);
        });
    });
}

/**
 * Apply filter
 */
function applyFilter(filter) {
    let filtered = [...allProducts];
    
    // If there's a search query, filter by search first
    if (currentSearchQuery) {
        const searchLower = currentSearchQuery.toLowerCase();
        filtered = filtered.filter(product => {
            const nameMatch = product.name.toLowerCase().includes(searchLower);
            const descMatch = product.description.toLowerCase().includes(searchLower);
            const storeMatch = getStoreName(product.store_id).toLowerCase().includes(searchLower);
            return nameMatch || descMatch || storeMatch;
        });
    }
    
    // Apply category filter
    if (filter === 'food') {
        filtered = filtered.filter(p => p.category_id === 1 || p.category_id === 2);
    } else if (filter === 'drink') {
        filtered = filtered.filter(p => p.category_id === 3 || p.category_id === 4);
    }
    
    // Apply sort
    filtered = applySortToProducts(filtered, filter);
    
    renderProducts(filtered, currentSearchQuery.length > 0);
}

/**
 * Apply sort to products
 */
function applySortToProducts(products, sortType) {
    let sorted = [...products];
    
    switch(sortType) {
        case 'popular':
            sorted.sort((a, b) => {
                const scoreA = (a.is_featured ? 1000 : 0) + (a.sales_count || 0);
                const scoreB = (b.is_featured ? 1000 : 0) + (b.sales_count || 0);
                return scoreB - scoreA;
            });
            break;
        case 'cheapest':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'expensive':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'az':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default:
            // Keep original order
            break;
    }
    
    return sorted;
}

/**
 * Add to cart from global search
 * Make it globally accessible
 */
window.addToCartGlobal = function(productId, storeId) {
    const product = allProducts.find(p => p.id === productId);
    
    if (!product) {
        showNotification('❌ Produk tidak ditemukan', 'error');
        return;
    }
    
    // Check if cart has items from different store
    const cart = new ShoppingCart();
    const cartItems = cart.getCart();
    
    if (cartItems.length > 0) {
        const existingStoreId = cartItems[0].store_id;
        
        if (existingStoreId && existingStoreId != storeId) {
            if (!confirm(`Keranjang Anda berisi item dari toko lain. Ingin mengganti ke ${getStoreName(storeId)}? (Keranjang akan dikosongkan)`)) {
                return;
            }
            cart.clearCart();
        }
    }
    
    // Add to cart
    cart.addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        store_id: storeId
    });
    
    // Save store info
    localStorage.setItem('selectedStoreId', storeId);
    localStorage.setItem('selectedStoreName', getStoreName(storeId));
    
    // Show notification
    showNotification(`✅ ${product.name} ditambahkan ke keranjang!`, 'success');
};

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Show error
 */
function showError(message) {
    const menuGrid = document.getElementById('globalMenuGrid');
    menuGrid.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Terjadi Kesalahan</h3>
            <p>${message}</p>
            <button onclick="location.reload()" class="btn-retry">
                <i class="fas fa-redo"></i> Coba Lagi
            </button>
        </div>
    `;
}

// Animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

