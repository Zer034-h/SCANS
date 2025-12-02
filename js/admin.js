/**
 * ADMIN DASHBOARD FUNCTIONALITY
 * CRUD operations for products, stores, users, etc.
 */

// Global variables
let allProducts = [];
let allStores = [];
let currentEditingProduct = null;

// Store names mapping
const storeNames = {
    1: 'Kantin Bu Ani',
    2: 'Warung Mas Budi',
    3: 'Kedai Kopi & Snack'
};

// Category names mapping
const categoryNames = {
    1: 'Makanan Berat',
    2: 'Makanan Ringan',
    3: 'Minuman Dingin',
    4: 'Minuman Panas'
};

/**
 * Initialize admin dashboard
 */
async function initAdminDashboard() {
    console.log('Initializing admin dashboard...');
    
    // Load all products
    await loadAllProducts();
    
    // Load all stores
    await loadAllStores();
    
    // Render products table
    renderAllProducts();
    
    // Update stats
    updateAdminStats();
}

/**
 * Load all products from all stores
 */
async function loadAllProducts() {
    try {
        // Try Firebase first
        if (typeof firebaseData !== 'undefined' && firebaseData.getProductsFromFirebase) {
            const result = await firebaseData.getProductsFromFirebase();
            if (result.success && result.data.length > 0) {
                allProducts = result.data;
                console.log('✅ Loaded products from Firebase:', allProducts.length);
                return;
            }
        }
        
        // Fallback to local menuItems
        if (typeof menuItems !== 'undefined' && menuItems.length > 0) {
            allProducts = menuItems.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image || 'asset/img/default.png',
                description: item.description || '',
                store_id: item.store_id,
                category_id: item.category_id || 1,
                stock: item.stock || 999,
                is_featured: item.is_featured || false,
                sales_count: item.sales_count || 0
            }));
            console.log('✅ Loaded products from local data:', allProducts.length);
        } else {
            console.warn('No products found');
            allProducts = [];
        }
        
        // Update global reference
        window.allProducts = allProducts;
    } catch (error) {
        console.error('Error loading products:', error);
        allProducts = [];
    }
}

/**
 * Load all stores
 */
async function loadAllStores() {
    allStores = [
        { id: 1, name: 'Kantin Bu Ani' },
        { id: 2, name: 'Warung Mas Budi' },
        { id: 3, name: 'Kedai Kopi & Snack' }
    ];
}

/**
 * Render all products in admin table
 */
function renderAllProducts() {
    const tableBody = document.getElementById('adminProductsTableBody');
    
    if (!tableBody) {
        console.warn('Products table body not found');
        return;
    }
    
    if (allProducts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Belum ada produk</td></tr>';
        return;
    }
    
    tableBody.innerHTML = allProducts.map(product => `
        <tr>
            <td>
                <img src="${product.image}" alt="${product.name}" class="table-img" 
                     onerror="this.src='asset/img/default.png'">
            </td>
            <td><strong>${product.name}</strong></td>
            <td>${storeNames[product.store_id] || 'Toko ' + product.store_id}</td>
            <td>Rp ${product.price.toLocaleString('id-ID')}</td>
            <td>${product.stock || 0}</td>
            <td>
                <span class="badge ${product.is_featured ? 'badge-success' : 'badge-secondary'}">
                    ${product.is_featured ? 'Aktif' : 'Tidak Aktif'}
                </span>
            </td>
            <td>
                <button class="btn-icon" title="Edit" onclick="openEditProductModal(${product.id})">
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
 * Update admin statistics
 */
function updateAdminStats() {
    const totalProducts = allProducts.length;
    const totalStores = allStores.length;
    
    // Update stats if elements exist
    const statsElements = document.querySelectorAll('.stat-value');
    if (statsElements.length >= 2) {
        // Total Toko
        if (statsElements[0]) {
            statsElements[0].textContent = totalStores;
        }
        // Total Produk
        if (statsElements[1]) {
            statsElements[1].textContent = totalProducts;
        }
    }
}

/**
 * Open add product modal
 */
function openAddProductModal() {
    currentEditingProduct = null;
    
    // Create modal if doesn't exist
    if (!document.getElementById('productModal')) {
        createProductModal();
    }
    
    // Reset form
    const form = document.getElementById('productForm');
    if (form) {
        form.reset();
        form.dataset.mode = 'add';
    }
    
    // Update modal title
    const modalTitle = document.getElementById('productModalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Tambah Produk Baru';
    }
    
    // Show modal
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Open edit product modal
 */
function openEditProductModal(productId) {
    const product = allProducts.find(p => p.id == productId);
    
    if (!product) {
        showAlert('error', 'Produk tidak ditemukan');
        return;
    }
    
    currentEditingProduct = product;
    
    // Create modal if doesn't exist
    if (!document.getElementById('productModal')) {
        createProductModal();
    }
    
    // Fill form with product data
    const form = document.getElementById('productForm');
    if (form) {
        form.dataset.mode = 'edit';
        form.dataset.productId = productId;
        
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productImage').value = product.image || '';
        document.getElementById('productStoreId').value = product.store_id || '';
        document.getElementById('productCategoryId').value = product.category_id || '1';
        document.getElementById('productStock').value = product.stock || 0;
        document.getElementById('productIsFeatured').checked = product.is_featured || false;
    }
    
    // Update modal title
    const modalTitle = document.getElementById('productModalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Edit Produk';
    }
    
    // Show modal
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Create product modal HTML
 */
function createProductModal() {
    const modalHTML = `
        <div id="productModal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="productModalTitle">Tambah Produk Baru</h2>
                    <button class="modal-close" onclick="closeProductModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="productForm">
                        <div class="form-group">
                            <label for="productName">Nama Produk *</label>
                            <input type="text" id="productName" name="name" required 
                                   placeholder="Contoh: Nasi Goreng">
                        </div>
                        
                        <div class="form-group">
                            <label for="productStoreId">Toko *</label>
                            <select id="productStoreId" name="store_id" required>
                                <option value="">Pilih Toko</option>
                                <option value="1">Kantin Bu Ani</option>
                                <option value="2">Warung Mas Budi</option>
                                <option value="3">Kedai Kopi & Snack</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="productCategoryId">Kategori *</label>
                            <select id="productCategoryId" name="category_id" required>
                                <option value="1">Makanan Berat</option>
                                <option value="2">Makanan Ringan</option>
                                <option value="3">Minuman Dingin</option>
                                <option value="4">Minuman Panas</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="productPrice">Harga (Rp) *</label>
                            <input type="number" id="productPrice" name="price" required 
                                   min="0" placeholder="15000">
                        </div>
                        
                        <div class="form-group">
                            <label for="productStock">Stok *</label>
                            <input type="number" id="productStock" name="stock" required 
                                   min="0" placeholder="50">
                        </div>
                        
                        <div class="form-group">
                            <label for="productImage">URL Gambar</label>
                            <input type="text" id="productImage" name="image" 
                                   placeholder="asset/img/nasgor.png">
                        </div>
                        
                        <div class="form-group">
                            <label for="productDescription">Deskripsi</label>
                            <textarea id="productDescription" name="description" rows="3" 
                                      placeholder="Deskripsi produk..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="productIsFeatured" name="is_featured">
                                <span>Produk Unggulan (Featured)</span>
                            </label>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="closeProductModal()">
                                Batal
                            </button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save"></i> Simpan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add form submit handler
    const form = document.getElementById('productForm');
    if (form) {
        form.addEventListener('submit', handleProductFormSubmit);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeProductModal();
            }
        });
    }
}

/**
 * Close product modal
 */
function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentEditingProduct = null;
}

/**
 * Handle product form submit
 */
async function handleProductFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const mode = form.dataset.mode || 'add';
    const formData = new FormData(form);
    
    const productData = {
        name: formData.get('name'),
        store_id: parseInt(formData.get('store_id')),
        category_id: parseInt(formData.get('category_id')),
        price: parseInt(formData.get('price')),
        stock: parseInt(formData.get('stock')),
        image: formData.get('image') || 'asset/img/default.png',
        description: formData.get('description') || '',
        is_featured: formData.get('is_featured') === 'on'
    };
    
    // Validation
    if (!productData.name || !productData.store_id || !productData.price) {
        showAlert('error', 'Mohon lengkapi semua field yang wajib diisi');
        return;
    }
    
    try {
        if (mode === 'edit') {
            const productId = parseInt(form.dataset.productId);
            await updateProduct(productId, productData);
        } else {
            await createProduct(productData);
        }
        
        closeProductModal();
        
        // Reload products
        await loadAllProducts();
        renderAllProducts();
        updateAdminStats();
        
    } catch (error) {
        console.error('Error saving product:', error);
        showAlert('error', 'Gagal menyimpan produk: ' + error.message);
    }
}

/**
 * Create new product
 */
async function createProduct(productData) {
    try {
        // Try Firebase first
        if (typeof firebaseData !== 'undefined' && firebaseData.createProductInFirebase) {
            const result = await firebaseData.createProductInFirebase(productData);
            if (result.success) {
                showAlert('success', 'Produk berhasil ditambahkan!');
                return;
            }
        }
        
        // Fallback: Add to local array
        const newId = allProducts.length > 0 
            ? Math.max(...allProducts.map(p => p.id)) + 1 
            : 1;
        
        const newProduct = {
            id: newId,
            ...productData,
            sales_count: 0
        };
        
        allProducts.push(newProduct);
        
        // Update menuItems if exists
        if (typeof menuItems !== 'undefined') {
            menuItems.push(newProduct);
        }
        
        showAlert('success', 'Produk berhasil ditambahkan! (Local)');
        
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
}

/**
 * Update existing product
 */
async function updateProduct(productId, productData) {
    try {
        // Try Firebase first
        if (typeof firebaseData !== 'undefined' && firebaseData.updateProductInFirebase) {
            const result = await firebaseData.updateProductInFirebase(productId, productData);
            if (result.success) {
                showAlert('success', 'Produk berhasil diperbarui!');
                return;
            }
        }
        
        // Fallback: Update local array
        const index = allProducts.findIndex(p => p.id == productId);
        if (index !== -1) {
            allProducts[index] = {
                ...allProducts[index],
                ...productData
            };
            
            // Update menuItems if exists
            if (typeof menuItems !== 'undefined') {
                const menuIndex = menuItems.findIndex(p => p.id == productId);
                if (menuIndex !== -1) {
                    menuItems[menuIndex] = {
                        ...menuItems[menuIndex],
                        ...productData
                    };
                }
            }
            
            showAlert('success', 'Produk berhasil diperbarui! (Local)');
        } else {
            throw new Error('Produk tidak ditemukan');
        }
        
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
}

/**
 * Delete product
 */
async function deleteProduct(productId) {
    const product = allProducts.find(p => p.id == productId);
    
    if (!product) {
        showAlert('error', 'Produk tidak ditemukan');
        return;
    }
    
    if (!confirm(`Yakin ingin menghapus produk "${product.name}"?`)) {
        return;
    }
    
    try {
        // Try Firebase first
        if (typeof firebaseData !== 'undefined' && firebaseData.deleteProductFromFirebase) {
            const result = await firebaseData.deleteProductFromFirebase(productId);
            if (result.success) {
                showAlert('success', 'Produk berhasil dihapus!');
                await loadAllProducts();
                renderAllProducts();
                updateAdminStats();
                return;
            }
        }
        
        // Fallback: Remove from local array
        allProducts = allProducts.filter(p => p.id != productId);
        
        // Update menuItems if exists
        if (typeof menuItems !== 'undefined') {
            const menuIndex = menuItems.findIndex(p => p.id == productId);
            if (menuIndex !== -1) {
                menuItems.splice(menuIndex, 1);
            }
        }
        
        showAlert('success', 'Produk berhasil dihapus! (Local)');
        
        // Reload products
        renderAllProducts();
        updateAdminStats();
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showAlert('error', 'Gagal menghapus produk: ' + error.message);
    }
}

// Export functions
window.AdminDashboard = {
    initAdminDashboard,
    loadAllProducts,
    renderAllProducts,
    openAddProductModal,
    openEditProductModal,
    deleteProduct
};

// Make functions globally accessible
window.openAddProductModal = openAddProductModal;
window.openEditProductModal = openEditProductModal;
window.deleteProduct = deleteProduct;
window.closeProductModal = closeProductModal;

console.log('✅ Admin Dashboard functions loaded');

