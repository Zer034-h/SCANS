/**
 * FIREBASE AUTHENTICATION
 * Replace MySQL auth with Firebase Auth
 */

const AUTH_KEY = 'scans_auth';

/**
 * Initialize Firebase Auth state listener
 */
function initAuthStateListener() {
    const auth = firebaseApp.getAuth();
    
    auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
            // User is signed in
            console.log('User signed in:', firebaseUser.uid);
            
            // Get user data from Firestore
            const userData = await getUserData(firebaseUser.uid);
            
            if (userData) {
                // Save to localStorage
                saveAuthData(userData, firebaseUser);
                updateUserUI();
            }
        } else {
            // User is signed out
            console.log('User signed out');
            clearAuthData();
        }
    });
}

/**
 * Register new user
 */
async function handleFirebaseRegister(formData) {
    try {
        const auth = firebaseApp.getAuth();
        const db = firebaseApp.getDb();
        
        // Create auth user
        const userCredential = await auth.createUserWithEmailAndPassword(
            formData.email,
            formData.password
        );
        
        const user = userCredential.user;
        
        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            username: formData.username,
            email: formData.email,
            fullName: formData.full_name,
            phone: formData.phone || null,
            role: 'user', // Default role
            storeId: null,
            isActive: true,
            isVerified: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Send email verification
        await user.sendEmailVerification();
        
        // Log activity
        await logActivity(user.uid, 'user_registered', 'auth', 'User registered successfully');
        
        return { success: true, user };
        
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Login user
 */
async function handleFirebaseLogin(emailOrUsername, password) {
    try {
        // Check if Firebase is initialized
        if (typeof firebaseApp === 'undefined' || !firebaseApp.getAuth) {
            throw new Error('Firebase not initialized');
        }
        
        const auth = firebaseApp.getAuth();
        const db = firebaseApp.getDb();
        
        if (!auth || !db) {
            throw new Error('Firebase services not available');
        }
        
        // Try to find user by email or username
        let email = emailOrUsername;
        let userDoc = null;
        
        // If it looks like an email, try direct login
        if (emailOrUsername.includes('@')) {
            email = emailOrUsername;
        } else {
            // Search by username in Firestore
            const usersSnapshot = await db.collection('users')
                .where('username', '==', emailOrUsername)
                .limit(1)
                .get();
            
            if (!usersSnapshot.empty) {
                userDoc = usersSnapshot.docs[0];
                email = userDoc.data().email;
            } else {
                // Try as email anyway
                email = emailOrUsername;
            }
        }
        
        // Sign in with Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Get user data from Firestore (if not already fetched)
        if (!userDoc) {
            userDoc = await db.collection('users').doc(user.uid).get();
        }
        
        if (!userDoc.exists) {
            // Try to find by email
            const emailSnapshot = await db.collection('users')
                .where('email', '==', email)
                .limit(1)
                .get();
            
            if (!emailSnapshot.empty) {
                userDoc = emailSnapshot.docs[0];
            } else {
                throw new Error('User data not found in Firestore');
            }
        }
        
        const userData = userDoc.data();
        
        // Check if user is active
        if (userData.isActive === false) {
            await auth.signOut();
            throw new Error('Account is deactivated');
        }
        
        // Update last login
        try {
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (updateError) {
            console.warn('Failed to update last login:', updateError);
        }
        
        // Log activity
        try {
            await logActivity(user.uid, 'user_login', 'auth', 'User logged in');
        } catch (logError) {
            console.warn('Failed to log activity:', logError);
        }
        
        // Map role_name for compatibility
        const roleName = userData.role || 'user';
        const roleDisplayName = userData.role === 'admin' ? 'Administrator' :
                               userData.role === 'store_manager' ? 'Pengelola Toko' :
                               'Pembeli';
        
        return {
            success: true,
            user: {
                id: user.uid,
                username: userData.username || email.split('@')[0],
                email: userData.email || email,
                full_name: userData.fullName || userData.full_name || userData.username || email.split('@')[0],
                phone: userData.phone || null,
                role_name: roleName,
                role_display_name: roleDisplayName,
                role_id: userData.role === 'admin' ? 1 : userData.role === 'store_manager' ? 2 : 3,
                store_id: userData.storeId || null,
                store_name: userData.storeName || null,
                is_active: userData.isActive !== false,
                is_verified: userData.isVerified || false
            }
        };
        
    } catch (error) {
        console.error('Firebase login error:', error);
        
        let errorMessage = 'Login failed';
        
        if (error.code) {
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'User tidak ditemukan';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Password salah';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email tidak valid';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Terlalu banyak percobaan. Coba lagi nanti';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Akun telah dinonaktifkan';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Koneksi gagal. Periksa internet Anda';
                    break;
                default:
                    errorMessage = error.message || 'Login gagal';
            }
        } else {
            errorMessage = error.message || 'Login gagal';
        }
        
        return { success: false, error: errorMessage };
    }
}

/**
 * Logout user
 */
async function handleFirebaseLogout() {
    try {
        const auth = firebaseApp.getAuth();
        const user = auth.currentUser;
        
        if (user) {
            // Log activity before logout
            await logActivity(user.uid, 'user_logout', 'auth', 'User logged out');
        }
        
        // Sign out from Firebase
        await auth.signOut();
        
        // Clear local storage
        clearAuthData();
        
        return { success: true };
        
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get user data from Firestore
 */
async function getUserData(userId) {
    try {
        const db = firebaseApp.getDb();
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Get role details
            let roleData = {};
            if (userData.role) {
                const roleDoc = await db.collection('roles').doc(userData.role).get();
                if (roleDoc.exists) {
                    roleData = roleDoc.data();
                }
            }
            
            // Get store details if manager
            let storeData = null;
            if (userData.storeId) {
                const storeDoc = await db.collection('stores').doc(userData.storeId).get();
                if (storeDoc.exists) {
                    storeData = storeDoc.data();
                }
            }
            
            return {
                id: userId,
                username: userData.username,
                email: userData.email,
                full_name: userData.fullName,
                phone: userData.phone,
                role_name: userData.role,
                role_display_name: roleData.displayName || userData.role,
                store_id: userData.storeId,
                store_name: storeData ? storeData.name : null,
                is_active: userData.isActive,
                is_verified: userData.isVerified
            };
        }
        
        return null;
        
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

/**
 * Save auth data to localStorage
 */
function saveAuthData(userData, firebaseUser) {
    const authData = {
        user: userData,
        token: firebaseUser ? firebaseUser.uid : null,
        timestamp: Date.now(),
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(authData));
}

/**
 * Get current auth data
 */
function getAuthData() {
    try {
        let authData = localStorage.getItem(AUTH_KEY);
        
        if (!authData) {
            authData = sessionStorage.getItem(AUTH_KEY);
        }
        
        if (!authData) return null;
        
        const parsed = JSON.parse(authData);
        
        // Check if expired
        if (parsed.expires && parsed.expires < Date.now()) {
            clearAuthData();
            return null;
        }
        
        return parsed;
    } catch (error) {
        console.error('Error getting auth data:', error);
        return null;
    }
}

/**
 * Clear auth data
 */
function clearAuthData() {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
}

/**
 * Get current user
 */
function getCurrentUser() {
    const auth = getAuthData();
    return auth ? auth.user : null;
}

/**
 * Check if authenticated
 */
function isAuthenticated() {
    try {
        // First check localStorage/sessionStorage
        const authData = getAuthData();
        if (authData && authData.user && authData.token) {
            return true;
        }
        
        // Then check Firebase Auth
        if (typeof firebaseApp !== 'undefined' && firebaseApp.getAuth) {
            const auth = firebaseApp.getAuth();
            return auth && auth.currentUser !== null;
        }
        
        return false;
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
}

/**
 * Log activity to Firestore
 */
async function logActivity(userId, action, module, description) {
    try {
        const db = firebaseApp.getDb();
        
        await db.collection('activityLogs').add({
            userId,
            action,
            module,
            description,
            ipAddress: await getClientIP(),
            userAgent: navigator.userAgent,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

/**
 * Get client IP (placeholder)
 */
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown';
    }
}

/**
 * Reset password
 */
async function sendPasswordResetEmail(email) {
    try {
        const auth = firebaseApp.getAuth();
        await auth.sendPasswordResetEmail(email);
        return { success: true };
    } catch (error) {
        console.error('Password reset error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update user profile
 */
async function updateUserProfile(userId, updates) {
    try {
        const db = firebaseApp.getDb();
        
        await db.collection('users').doc(userId).update({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await logActivity(userId, 'profile_updated', 'users', 'User profile updated');
        
        return { success: true };
    } catch (error) {
        console.error('Profile update error:', error);
        return { success: false, error: error.message };
    }
}

// Export functions
window.firebaseAuth = {
    initAuthStateListener,
    handleFirebaseRegister,
    handleFirebaseLogin,
    handleFirebaseLogout,
    getUserData,
    getCurrentUser,
    isAuthenticated,
    getAuthData,
    clearAuthData,
    logActivity,
    sendPasswordResetEmail,
    updateUserProfile
};

// Initialize auth state listener on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initAuthStateListener, 1000); // Wait for Firebase init
    });
} else {
    setTimeout(initAuthStateListener, 1000);
}

