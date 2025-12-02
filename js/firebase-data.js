/**
 * FIREBASE DATA INTEGRATION
 * Connect all app data to Firebase Firestore & Realtime Database
 */

/**
 * PRODUCTS - Get products from Firestore
 */
async function getProductsFromFirebase(storeId = null) {
    try {
        const db = firebaseApp.getDb();
        if (!db) {
            console.warn('Firestore not available, using local data');
            return { success: false, data: [] };
        }
        
        let query = db.collection('products');
        
        // Filter by store if provided
        if (storeId) {
            query = query.where('storeId', '==', storeId);
        }
        
        // Only get available products
        query = query.where('isAvailable', '==', true);
        
        const snapshot = await query.get();
        const products = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            products.push({
                id: doc.id,
                name: data.name,
                price: data.price || 0,
                image: data.image || 'asset/img/nasgor.png',
                description: data.description || '',
                category: data.categoryId || '',
                category_id: data.categoryId || null,
                store_id: data.storeId || null,
                sales_count: data.salesCount || 0,
                is_featured: data.isFeatured || false,
                stock: data.stock || 0
            });
        });
        
        return { success: true, data: products };
        
    } catch (error) {
        console.error('Error getting products from Firebase:', error);
        return { success: false, data: [], error: error.message };
    }
}

/**
 * STORES - Get stores from Firestore
 */
async function getStoresFromFirebase() {
    try {
        const db = firebaseApp.getDb();
        if (!db) {
            console.warn('Firestore not available, using local data');
            return { success: false, data: [] };
        }
        
        const snapshot = await db.collection('stores')
            .where('isActive', '==', true)
            .get();
        
        const stores = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            stores.push({
                id: doc.id,
                name: data.name,
                tagline: data.tagline || '',
                banner: data.banner || 'asset/img/store-banner.png',
                logo: data.logo || 'asset/img/store-logo.png',
                rating: data.rating || 4.5,
                location: data.location || '',
                openingHours: data.openingHours || '08:00 - 20:00',
                phone: data.phone || '',
                description: data.description || ''
            });
        });
        
        return { success: true, data: stores };
        
    } catch (error) {
        console.error('Error getting stores from Firebase:', error);
        return { success: false, data: [], error: error.message };
    }
}

/**
 * CATEGORIES - Get categories from Firestore
 */
async function getCategoriesFromFirebase() {
    try {
        const db = firebaseApp.getDb();
        if (!db) {
            return { success: false, data: [] };
        }
        
        const snapshot = await db.collection('categories')
            .where('isActive', '==', true)
            .orderBy('displayOrder', 'asc')
            .get();
        
        const categories = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            categories.push({
                id: doc.id,
                name: data.name,
                icon: data.icon || 'fa-utensils',
                description: data.description || ''
            });
        });
        
        return { success: true, data: categories };
        
    } catch (error) {
        console.error('Error getting categories from Firebase:', error);
        return { success: false, data: [] };
    }
}

/**
 * ORDERS - Save order to Firestore
 */
async function saveOrderToFirebase(orderData) {
    try {
        const db = firebaseApp.getDb();
        if (!db) {
            console.warn('Firestore not available');
            return { success: false };
        }
        
        // Format data sederhana: nama, makanan yang dipesan, jumlah
        const orderDoc = {
            nama: orderData.customerName, // Nama pemesan
            makanan: orderData.items.map(item => ({
                nama: item.name, // Nama makanan
                jumlah: item.quantity // Jumlah makanan
            })),
            storeId: orderData.storeId || null, // ID toko (opsional)
            totalAmount: orderData.totalAmount || 0, // Total harga (opsional)
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection('orders').add(orderDoc);
        
        console.log('✅ Data pemesan disimpan ke Firebase:', {
            nama: orderDoc.nama,
            makanan: orderDoc.makanan,
            orderId: docRef.id
        });
        
        return { success: true, orderId: docRef.id };
        
    } catch (error) {
        console.error('Error saving order to Firebase:', error);
        return { success: false, error: error.message };
    }
}

/**
 * UPDATE ORDER STATUS - Update order in Firestore
 */
async function updateOrderStatusInFirebase(orderId, status, paymentStatus = null) {
    try {
        const db = firebaseApp.getDb();
        if (!db) return { success: false };
        
        const updateData = {
            status: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (paymentStatus) {
            updateData.paymentStatus = paymentStatus;
            if (paymentStatus === 'paid') {
                updateData.paidAt = firebase.firestore.FieldValue.serverTimestamp();
            }
        }
        
        await db.collection('orders').doc(orderId).update(updateData);
        
        return { success: true };
        
    } catch (error) {
        console.error('Error updating order status:', error);
        return { success: false, error: error.message };
    }
}

/**
 * DELETE ORDER - Delete order from Firestore
 */
async function deleteOrderFromFirebase(orderId) {
    try {
        const db = firebaseApp.getDb();
        if (!db) return { success: false, error: 'Firestore not available' };
        
        await db.collection('orders').doc(orderId).delete();
        
        console.log('✅ Order deleted from Firestore:', orderId);
        return { success: true };
        
    } catch (error) {
        console.error('Error deleting order:', error);
        return { success: false, error: error.message };
    }
}

/**
 * GET USER ORDERS - Get orders for a user
 */
async function getUserOrdersFromFirebase(userId) {
    try {
        const db = firebaseApp.getDb();
        if (!db) return { success: false, data: [] };
        
        const snapshot = await db.collection('orders')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        
        const orders = [];
        snapshot.forEach(doc => {
            orders.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return { success: true, data: orders };
        
    } catch (error) {
        console.error('Error getting user orders:', error);
        return { success: false, data: [] };
    }
}

/**
 * GET STORE ORDERS - Get orders for a store (for manager)
 */
async function getStoreOrdersFromFirebase(storeId, status = null) {
    try {
        const db = firebaseApp.getDb();
        if (!db) return { success: false, data: [] };
        
        let query = db.collection('orders')
            .where('storeId', '==', storeId);
        
        if (status) {
            query = query.where('status', '==', status);
        }
        
        // Try to order by createdAt, but catch error if index doesn't exist
        let snapshot;
        try {
            snapshot = await query
                .orderBy('createdAt', 'desc')
                .limit(100)
                .get();
        } catch (error) {
            // If orderBy fails (no index), just get without ordering
            console.warn('OrderBy failed, getting without order:', error);
            snapshot = await query.limit(100).get();
        }
        
        const orders = [];
        snapshot.forEach(doc => {
            orders.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Sort manually by createdAt if available
        orders.sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
            return bTime - aTime; // Descending
        });
        
        return { success: true, data: orders };
        
    } catch (error) {
        console.error('Error getting store orders:', error);
        return { success: false, data: [], error: error.message };
    }
}

/**
 * UPDATE PRODUCT - Update product in Firestore (for manager/admin)
 */
async function updateProductInFirebase(productId, updateData) {
    try {
        const db = firebaseApp.getDb();
        if (!db) return { success: false };
        
        await db.collection('products').doc(productId).update({
            ...updateData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return { success: true };
        
    } catch (error) {
        console.error('Error updating product:', error);
        return { success: false, error: error.message };
    }
}

/**
 * CREATE PRODUCT - Create new product in Firestore (for manager/admin)
 */
async function createProductInFirebase(productData) {
    try {
        const db = firebaseApp.getDb();
        if (!db) return { success: false };
        
        const docRef = await db.collection('products').add({
            ...productData,
            isAvailable: true,
            salesCount: 0,
            views: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return { success: true, productId: docRef.id };
        
    } catch (error) {
        console.error('Error creating product:', error);
        return { success: false, error: error.message };
    }
}

/**
 * DELETE PRODUCT - Delete product from Firestore (for manager/admin)
 */
async function deleteProductFromFirebase(productId) {
    try {
        const db = firebaseApp.getDb();
        if (!db) return { success: false };
        
        // Soft delete: set isAvailable to false
        await db.collection('products').doc(productId).update({
            isAvailable: false,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return { success: true };
        
    } catch (error) {
        console.error('Error deleting product:', error);
        return { success: false, error: error.message };
    }
}

// Export functions
window.firebaseData = {
    getProductsFromFirebase,
    getStoresFromFirebase,
    getCategoriesFromFirebase,
    saveOrderToFirebase,
    updateOrderStatusInFirebase,
    deleteOrderFromFirebase,
    getUserOrdersFromFirebase,
    getStoreOrdersFromFirebase,
    updateProductInFirebase,
    createProductInFirebase,
    deleteProductFromFirebase
};

console.log('📦 Firebase Data integration loaded');

