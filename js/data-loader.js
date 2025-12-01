/**
 * DATA LOADER - Hybrid Firebase + Local Data
 * Load data from Firebase with fallback to local data
 */

/**
 * Load products with Firebase integration
 */
async function loadProducts(storeId = null) {
    try {
        // Try Firebase first
        if (typeof firebaseData !== 'undefined' && firebaseData.getProductsFromFirebase) {
            const result = await firebaseData.getProductsFromFirebase(storeId);
            
            if (result.success && result.data.length > 0) {
                console.log(`✅ Loaded ${result.data.length} products from Firebase`);
                return result.data;
            }
        }
        
        // Fallback to local data
        console.log('Using local products data');
        if (typeof menuItems !== 'undefined') {
            if (storeId) {
                return menuItems.filter(item => item.store_id == storeId);
            }
            return menuItems;
        }
        
        return [];
        
    } catch (error) {
        console.error('Error loading products:', error);
        // Fallback to local
        if (typeof menuItems !== 'undefined') {
            if (storeId) {
                return menuItems.filter(item => item.store_id == storeId);
            }
            return menuItems;
        }
        return [];
    }
}

/**
 * Load stores with Firebase integration
 */
async function loadStores() {
    try {
        // Try Firebase first
        if (typeof firebaseData !== 'undefined' && firebaseData.getStoresFromFirebase) {
            const result = await firebaseData.getStoresFromFirebase();
            
            if (result.success && result.data.length > 0) {
                console.log(`✅ Loaded ${result.data.length} stores from Firebase`);
                return result.data;
            }
        }
        
        // Fallback to local data
        console.log('Using local stores data');
        if (typeof storesData !== 'undefined') {
            return storesData;
        }
        
        return [];
        
    } catch (error) {
        console.error('Error loading stores:', error);
        // Fallback to local
        if (typeof storesData !== 'undefined') {
            return storesData;
        }
        return [];
    }
}

/**
 * Load categories with Firebase integration
 */
async function loadCategories() {
    try {
        // Try Firebase first
        if (typeof firebaseData !== 'undefined' && firebaseData.getCategoriesFromFirebase) {
            const result = await firebaseData.getCategoriesFromFirebase();
            
            if (result.success && result.data.length > 0) {
                return result.data;
            }
        }
        
        // Fallback to default categories
        return [
            { id: 1, name: 'Makanan', icon: 'fa-utensils' },
            { id: 2, name: 'Minuman', icon: 'fa-glass' },
            { id: 3, name: 'Snack', icon: 'fa-cookie' }
        ];
        
    } catch (error) {
        console.error('Error loading categories:', error);
        return [];
    }
}

// Export
window.dataLoader = {
    loadProducts,
    loadStores,
    loadCategories
};

console.log('📦 Data Loader loaded');

