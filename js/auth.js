/**
 * AUTHENTICATION SYSTEM
 * Handles login, register, logout, and session management
 */

const API_URL = 'http://localhost:3000/api';
const AUTH_KEY = 'scans_auth';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Handle user login
 */
async function handleLogin(username, password, remember = false) {
    try {
        showLoading(true);
        
        // Try API first
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, remember })
            });
            
            const data = await response.json();
            
            if (data.success) {
                await saveAuthData(data.user, data.token);
                
                showAlert('success', 'Login berhasil! Redirecting...');
                
                setTimeout(() => {
                    redirectByRole(data.user.role_name);
                }, 1000);
                return;
            } else {
                throw new Error(data.error || 'Login gagal');
            }
        } catch (apiError) {
            console.log('API not available, using demo mode');
            // Demo mode fallback
            await handleDemoLogin(username, password, remember);
        }
        
    } catch (error) {
        showAlert('error', error.message);
    } finally {
        showLoading(false);
    }
}

/**
 * Demo login (when API not available)
 */
async function handleDemoLogin(username, password, remember) {
    const demoUsers = {
        'admin': {
            id: 1,
            username: 'admin',
            email: 'admin@scans.com',
            full_name: 'System Administrator',
            role_id: 1,
            role_name: 'admin',
            role_display_name: 'Administrator',
            password: 'admin123'
        },
        'manager_buani': {
            id: 2,
            username: 'manager_buani',
            email: 'manager@buani.com',
            full_name: 'Manager Bu Ani',
            role_id: 2,
            role_name: 'store_manager',
            role_display_name: 'Pengelola Toko',
            store_id: 1,
            store_name: 'Kantin Bu Ani',
            password: 'manager123'
        },
        'manager_budi': {
            id: 3,
            username: 'manager_budi',
            email: 'manager@budi.com',
            full_name: 'Manager Mas Budi',
            role_id: 2,
            role_name: 'store_manager',
            role_display_name: 'Pengelola Toko',
            store_id: 2,
            store_name: 'Warung Mas Budi',
            password: 'manager123'
        },
        'manager_kopi': {
            id: 4,
            username: 'manager_kopi',
            email: 'manager@kopi.com',
            full_name: 'Manager Kedai Kopi',
            role_id: 2,
            role_name: 'store_manager',
            role_display_name: 'Pengelola Toko',
            store_id: 3,
            store_name: 'Kedai Kopi & Snack',
            password: 'manager123'
        },
        'user_test': {
            id: 5,
            username: 'user_test',
            email: 'user@test.com',
            full_name: 'Test User',
            role_id: 3,
            role_name: 'user',
            role_display_name: 'Pembeli',
            password: 'user123'
        }
    };
    
    const user = demoUsers[username] || demoUsers[Object.keys(demoUsers).find(key => demoUsers[key].email === username)];
    
    if (!user) {
        throw new Error('Username atau email tidak ditemukan');
    }
    
    if (user.password !== password) {
        throw new Error('Password salah');
    }
    
    // Generate demo token
    const token = 'demo_token_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    
    // Save auth data
    const userData = { ...user };
    delete userData.password;
    
    await saveAuthData(userData, token);
    
    showAlert('success', 'Login berhasil! (Demo Mode)');
    
    setTimeout(() => {
        redirectByRole(user.role_name);
    }, 1000);
}

/**
 * Handle user registration
 */
async function handleRegister(formData) {
    try {
        showLoading(true);
        
        // Try API first
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                showAlert('success', 'Registrasi berhasil! Silakan login.');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            } else {
                throw new Error(data.error || 'Registrasi gagal');
            }
        } catch (apiError) {
            console.log('API not available, using demo mode');
            // Demo mode fallback
            showAlert('success', 'Registrasi berhasil! (Demo Mode) Silakan login.');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
        
    } catch (error) {
        showAlert('error', error.message);
    } finally {
        showLoading(false);
    }
}

/**
 * Handle logout
 */
async function handleLogout() {
    try {
        const auth = getAuthData();
        
        if (auth && auth.token) {
            // Try to call API logout
            try {
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${auth.token}`
                    }
                });
            } catch (error) {
                console.log('API logout failed, continuing...');
            }
        }
        
        // Clear local storage
        localStorage.removeItem(AUTH_KEY);
        sessionStorage.removeItem(AUTH_KEY);
        
        // Clear cart
        localStorage.removeItem('cart');
        localStorage.removeItem('selectedStoreId');
        localStorage.removeItem('selectedStoreName');
        
        showAlert('success', 'Logout berhasil!');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        
    } catch (error) {
        console.error('Logout error:', error);
        // Force redirect anyway
        window.location.href = 'login.html';
    }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Save authentication data
 */
function saveAuthData(user, token) {
    const authData = {
        user: user,
        token: token,
        timestamp: Date.now(),
        expires: Date.now() + SESSION_DURATION
    };
    
    // Save to localStorage
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    
    // Also save to sessionStorage for backup
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(authData));
}

/**
 * Get authentication data
 */
function getAuthData() {
    try {
        // Try localStorage first
        let authData = localStorage.getItem(AUTH_KEY);
        
        // Fallback to sessionStorage
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
 * Clear authentication data
 */
function clearAuthData() {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    try {
        // Check localStorage/sessionStorage first
        const auth = getAuthData();
        if (auth && auth.user && auth.token) {
            return true;
        }
        
        // Check Firebase Auth if available
        if (typeof firebaseApp !== 'undefined' && firebaseApp.getAuth) {
            const firebaseAuth = firebaseApp.getAuth();
            if (firebaseAuth && firebaseAuth.currentUser) {
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
}

/**
 * Get current user
 */
function getCurrentUser() {
    const auth = getAuthData();
    return auth ? auth.user : null;
}

/**
 * Get auth token
 */
function getAuthToken() {
    const auth = getAuthData();
    return auth ? auth.token : null;
}

/**
 * Check if user has role
 */
function hasRole(roleName) {
    const user = getCurrentUser();
    return user && user.role_name === roleName;
}

/**
 * Check if user has any of the roles
 */
function hasAnyRole(roleNames) {
    const user = getCurrentUser();
    return user && roleNames.includes(user.role_name);
}

// ============================================
// ROUTE PROTECTION
// ============================================

/**
 * Protect page - require authentication
 */
function requireAuth() {
    if (!isAuthenticated()) {
        showAlert('warning', 'Silakan login terlebih dahulu');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        return false;
    }
    return true;
}

/**
 * Require specific role
 */
function requireRole(roleName) {
    if (!requireAuth()) return false;
    
    if (!hasRole(roleName)) {
        showAlert('error', 'Anda tidak memiliki akses ke halaman ini');
        setTimeout(() => {
            redirectByRole(getCurrentUser().role_name);
        }, 1500);
        return false;
    }
    
    return true;
}

/**
 * Require any of the roles
 */
function requireAnyRole(roleNames) {
    if (!requireAuth()) return false;
    
    if (!hasAnyRole(roleNames)) {
        showAlert('error', 'Anda tidak memiliki akses ke halaman ini');
        setTimeout(() => {
            redirectByRole(getCurrentUser().role_name);
        }, 1500);
        return false;
    }
    
    return true;
}

/**
 * Redirect by user role
 */
function redirectByRole(roleName) {
    switch(roleName) {
        case 'admin':
            window.location.href = 'admin-dashboard.html';
            break;
        case 'store_manager':
            window.location.href = 'manager-dashboard.html';
            break;
        case 'user':
        default:
            window.location.href = 'home.html';
            break;
    }
}

/**
 * Redirect if already authenticated
 */
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        const user = getCurrentUser();
        redirectByRole(user.role_name);
        return true;
    }
    return false;
}

// ============================================
// UI HELPERS
// ============================================

/**
 * Show alert message
 */
function showAlert(type, message) {
    const container = document.getElementById('alertContainer') || document.body;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    alert.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(alert);
    
    // Trigger animation
    setTimeout(() => alert.classList.add('show'), 10);
    
    // Auto remove
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

/**
 * Show loading state
 */
function showLoading(show = true) {
    const submitBtn = document.querySelector('.btn-auth[type="submit"]');
    if (!submitBtn) return;
    
    if (show) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalHtml = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Loading...</span>';
    } else {
        submitBtn.disabled = false;
        if (submitBtn.dataset.originalHtml) {
            submitBtn.innerHTML = submitBtn.dataset.originalHtml;
        }
    }
}

/**
 * Update user info in UI
 */
function updateUserUI() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Update user name displays
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
        el.textContent = user.full_name;
    });
    
    // Update user email displays
    const userEmailElements = document.querySelectorAll('.user-email');
    userEmailElements.forEach(el => {
        el.textContent = user.email;
    });
    
    // Update user role displays
    const userRoleElements = document.querySelectorAll('.user-role');
    userRoleElements.forEach(el => {
        el.textContent = user.role_display_name;
    });
}

// ============================================
// FETCH WITH AUTH
// ============================================

/**
 * Fetch with authentication
 */
async function fetchWithAuth(url, options = {}) {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('Not authenticated');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    // Check for 401 Unauthorized
    if (response.status === 401) {
        clearAuthData();
        showAlert('warning', 'Sesi Anda telah berakhir. Silakan login kembali.');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        throw new Error('Session expired');
    }
    
    return response;
}

// ============================================
// INITIALIZE
// ============================================

// Check for auth data on page load
document.addEventListener('DOMContentLoaded', () => {
    // Update UI if authenticated
    if (isAuthenticated()) {
        updateUserUI();
    }
    
    // Auto-redirect if on login/register page and already authenticated
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'login.html' || currentPage === 'register.html') {
        redirectIfAuthenticated();
    }
});

// Export for use in other scripts
window.auth = {
    handleLogin,
    handleRegister,
    handleLogout,
    isAuthenticated,
    getCurrentUser,
    getAuthToken,
    hasRole,
    hasAnyRole,
    requireAuth,
    requireRole,
    requireAnyRole,
    redirectByRole,
    fetchWithAuth,
    showAlert,
    updateUserUI
};

