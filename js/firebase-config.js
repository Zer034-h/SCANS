/**
 * FIREBASE CONFIGURATION & INITIALIZATION
 * SCANS - Firebase Firestore Database Integration
 */

// Import Firebase modules (using CDN in HTML, so this is for reference)
// In HTML, we'll use: <script type="module">

const firebaseConfig = {
    apiKey: "AIzaSyBgehBWZylWkYYC9C5edXCDV8db0Nx4iEo",
    authDomain: "kantinku-85387.firebaseapp.com",
    databaseURL: "https://kantinku-85387-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "kantinku-85387",
    storageBucket: "kantinku-85387.firebasestorage.app",
    messagingSenderId: "653630330870",
    appId: "1:653630330870:web:da176ab4e7da6a5a5319d7",
    measurementId: "G-6Y1P0Q9JYB"
};

// Initialize Firebase
let app, auth, db, realtimeDb, analytics;

/**
 * Initialize Firebase services
 */
async function initializeFirebase() {
    try {
        // Wait for Firebase SDK to load (max 5 seconds)
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds (50 * 100ms)
        
        while (typeof firebase === 'undefined' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        // Firebase modules are loaded via CDN
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK not loaded. Make sure to include Firebase scripts in HTML.');
            console.error('Required scripts:');
            console.error('  - firebase-app-compat.js');
            console.error('  - firebase-auth-compat.js');
            console.error('  - firebase-firestore-compat.js');
            console.error('  - firebase-database-compat.js');
            return false;
        }

        // Check if already initialized
        try {
            app = firebase.app();
            console.log('✅ Firebase already initialized');
        } catch (e) {
            // Not initialized, initialize now
            app = firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase App initialized');
        }
        
        // Initialize services
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Initialize Realtime Database (if available)
        if (firebaseConfig.databaseURL) {
            try {
                realtimeDb = firebase.database();
                console.log('✅ Realtime Database initialized');
                console.log('📡 Database URL:', firebaseConfig.databaseURL);
            } catch (error) {
                console.warn('⚠️ Realtime Database initialization failed:', error);
            }
        } else {
            console.warn('⚠️ databaseURL not configured');
        }
        
        // Enable offline persistence for Firestore
        if (db) {
            db.enablePersistence()
                .catch((err) => {
                    if (err.code === 'failed-precondition') {
                        console.warn('⚠️ Persistence failed: Multiple tabs open');
                    } else if (err.code === 'unimplemented') {
                        console.warn('⚠️ Persistence not available in this browser');
                    } else {
                        console.warn('⚠️ Persistence error:', err);
                    }
                });
        }
        
        // Initialize Analytics (optional)
        if (typeof firebase.analytics !== 'undefined') {
            try {
                analytics = firebase.analytics();
                console.log('✅ Analytics initialized');
            } catch (error) {
                console.warn('⚠️ Analytics initialization failed:', error);
            }
        }
        
        console.log('✅ Firebase initialized successfully');
        console.log('📊 Firestore:', db ? 'Ready' : 'Not available');
        console.log('📡 Realtime DB:', realtimeDb ? 'Ready' : 'Not available');
        console.log('🔐 Auth:', auth ? 'Ready' : 'Not available');
        
        return true;
        
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        return false;
    }
}

// Export for use in other scripts
window.firebaseApp = {
    config: firebaseConfig,
    init: initializeFirebase,
    getAuth: () => auth,
    getDb: () => db,
    getRealtimeDb: () => realtimeDb,
    getAnalytics: () => analytics
};

/**
 * FIRESTORE DATA STRUCTURE
 * 
 * Collections:
 * 
 * 1. users/
 *    - {userId}: {
 *        username, email, fullName, phone, 
 *        role: 'admin' | 'store_manager' | 'user',
 *        storeId: null | storeId,
 *        isActive, isVerified,
 *        createdAt, updatedAt, lastLogin
 *      }
 * 
 * 2. stores/
 *    - {storeId}: {
 *        name, slug, description, tagline,
 *        banner, logo, rating, location,
 *        openingHours, phone, isActive,
 *        managerId, createdAt, updatedAt
 *      }
 * 
 * 3. products/
 *    - {productId}: {
 *        storeId, categoryId, name, slug, description,
 *        price, image, stock, isAvailable, isFeatured,
 *        salesCount, views, createdAt, updatedAt
 *      }
 * 
 * 4. categories/
 *    - {categoryId}: {
 *        name, slug, description, icon,
 *        displayOrder, isActive, createdAt
 *      }
 * 
 * 5. orders/
 *    - {orderId}: {
 *        orderNumber, storeId, userId,
 *        customerName, customerEmail, customerPhone,
 *        items: [{productId, name, price, quantity}],
 *        subtotal, adminFee, totalAmount,
 *        status: 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled',
 *        paymentStatus, paymentMethod,
 *        createdAt, updatedAt, paidAt
 *      }
 * 
 * 6. sessions/
 *    - {sessionId}: {
 *        userId, token, ipAddress, userAgent,
 *        expiresAt, createdAt
 *      }
 * 
 * 7. activityLogs/
 *    - {logId}: {
 *        userId, action, module, description,
 *        ipAddress, userAgent, createdAt
 *      }
 * 
 * 8. roles/
 *    - admin: { name, displayName, description, permissions: [] }
 *    - store_manager: { name, displayName, description, permissions: [] }
 *    - user: { name, displayName, description, permissions: [] }
 */

/**
 * Firestore Helper Functions
 */

// Get collection reference
function getCollection(collectionName) {
    return db.collection(collectionName);
}

// Get document reference
function getDoc(collectionName, docId) {
    return db.collection(collectionName).doc(docId);
}

// Add document with auto-generated ID
async function addDocument(collectionName, data) {
    try {
        const docRef = await getCollection(collectionName).add({
            ...data,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error adding document:', error);
        return { success: false, error: error.message };
    }
}

// Set document with specific ID
async function setDocument(collectionName, docId, data, merge = false) {
    try {
        await getDoc(collectionName, docId).set({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge });
        return { success: true };
    } catch (error) {
        console.error('Error setting document:', error);
        return { success: false, error: error.message };
    }
}

// Update document
async function updateDocument(collectionName, docId, data) {
    try {
        await getDoc(collectionName, docId).update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating document:', error);
        return { success: false, error: error.message };
    }
}

// Delete document
async function deleteDocument(collectionName, docId) {
    try {
        await getDoc(collectionName, docId).delete();
        return { success: true };
    } catch (error) {
        console.error('Error deleting document:', error);
        return { success: false, error: error.message };
    }
}

// Get document by ID
async function getDocumentById(collectionName, docId) {
    try {
        const doc = await getDoc(collectionName, docId).get();
        if (doc.exists) {
            return { success: true, data: { id: doc.id, ...doc.data() } };
        } else {
            return { success: false, error: 'Document not found' };
        }
    } catch (error) {
        console.error('Error getting document:', error);
        return { success: false, error: error.message };
    }
}

// Query documents
async function queryDocuments(collectionName, conditions = [], orderBy = null, limit = null) {
    try {
        let query = getCollection(collectionName);
        
        // Apply conditions
        conditions.forEach(condition => {
            query = query.where(condition.field, condition.operator, condition.value);
        });
        
        // Apply ordering
        if (orderBy) {
            query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
        }
        
        // Apply limit
        if (limit) {
            query = query.limit(limit);
        }
        
        const snapshot = await query.get();
        const documents = [];
        
        snapshot.forEach(doc => {
            documents.push({ id: doc.id, ...doc.data() });
        });
        
        return { success: true, data: documents, count: documents.length };
    } catch (error) {
        console.error('Error querying documents:', error);
        return { success: false, error: error.message };
    }
}

// Real-time listener
function listenToCollection(collectionName, callback, conditions = []) {
    let query = getCollection(collectionName);
    
    conditions.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value);
    });
    
    return query.onSnapshot(snapshot => {
        const documents = [];
        snapshot.forEach(doc => {
            documents.push({ id: doc.id, ...doc.data() });
        });
        callback(documents);
    }, error => {
        console.error('Error in listener:', error);
    });
}

// Export helper functions
window.firestoreHelpers = {
    getCollection,
    getDoc,
    addDocument,
    setDocument,
    updateDocument,
    deleteDocument,
    getDocumentById,
    queryDocuments,
    listenToCollection
};

/**
 * Initialize on page load
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeFirebase, 100);
    });
} else {
    setTimeout(initializeFirebase, 100);
}

// Also try to initialize immediately if firebase is already loaded
if (typeof firebase !== 'undefined') {
    setTimeout(initializeFirebase, 100);
}

