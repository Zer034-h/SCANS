/**
 * AUTH GUARD
 * Middleware untuk protect pages - require login
 */

// Pages yang tidak require login (public pages)
const PUBLIC_PAGES = [
    '/login.html',
    '/register.html',
    '/forgot-password.html'
];

// Pages untuk role tertentu
const ROLE_PAGES = {
    'admin': ['/admin-dashboard.html', '/queue-dashboard.html'],
    'store_manager': ['/manager-dashboard.html', '/queue-dashboard.html'],
    'user': ['/home.html', '/index.html', '/stores.html', '/payment.html', '/success.html', '/customer-queue.html']
};

/**
 * Check authentication on page load
 */
function checkAuthOnLoad() {
    try {
        const currentPage = window.location.pathname;
        const pageName = currentPage.split('/').pop();
        const isPublicPage = PUBLIC_PAGES.some(page => pageName === page.split('/').pop() || currentPage.endsWith(page));
        
        // If public page (login/register), allow access
        if (isPublicPage) {
            // But redirect if already logged in (after a delay to let scripts load)
            setTimeout(() => {
                if (typeof isAuthenticated === 'function' && isAuthenticated()) {
                    const user = getCurrentUser();
                    if (user && typeof redirectByRole === 'function') {
                        redirectByRole(user.role_name || 'user');
                    }
                }
            }, 500);
            return;
        }
        
        // For protected pages, require authentication
        // Wait a bit for auth functions to load
        setTimeout(() => {
            if (typeof isAuthenticated !== 'function' || !isAuthenticated()) {
                console.log('⚠️ Not authenticated. Redirecting to login...');
                
                // Save intended destination
                sessionStorage.setItem('intended_url', window.location.href);
                
                // Show message and redirect
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 100);
                
                return;
            }
            
            // Check role-based access
            const user = getCurrentUser();
            if (!user || !user.role_name) {
                console.log('⚠️ Invalid user data. Redirecting to login...');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 100);
                return;
            }
            
            // Check if user has access to current page
            const allowedPages = ROLE_PAGES[user.role_name] || [];
            const hasAccess = allowedPages.some(page => currentPage.endsWith(page)) || 
                              currentPage.endsWith('/home.html') ||
                              currentPage.endsWith('home.html') ||
                              currentPage.endsWith('customer-queue.html') ||
                              currentPage.endsWith('queue-dashboard.html');
            
            // Allow access to queue pages if user is authenticated
            if (pageName === 'customer-queue.html' || pageName === 'queue-dashboard.html') {
                console.log('✅ Access granted to queue/dashboard page');
                return; // Allow access
            }
            
            if (!hasAccess && pageName !== 'home.html') {
                console.log('⚠️ Access denied. Redirecting to proper dashboard...');
                if (typeof redirectByRole === 'function') {
                    redirectByRole(user.role_name);
                } else {
                    window.location.href = 'home.html';
                }
                return;
            }
        }, 300);
        
    } catch (error) {
        console.error('Auth guard error:', error);
        // Don't block page if there's an error
    }
}

/**
 * Auto-redirect setelah login berhasil
 */
function redirectAfterLogin() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Check for intended URL
    const intendedUrl = sessionStorage.getItem('intended_url');
    sessionStorage.removeItem('intended_url');
    
    if (intendedUrl && !intendedUrl.includes('login.html')) {
        window.location.href = intendedUrl;
        return;
    }
    
    // Redirect based on role
    redirectByRole(user.role_name);
}

/**
 * Initialize auth guard on page load
 * BUT: Don't run on login/register pages
 */
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;
    const pageName = currentPage.split('/').pop();
    
    // Don't run auth guard on public pages
    if (pageName === 'login.html' || pageName === 'register.html' || pageName === 'forgot-password.html') {
        console.log('Auth guard skipped for public page:', pageName);
        return;
    }
    
    // Don't run auth guard on queue pages - they handle their own auth
    if (pageName === 'customer-queue.html' || pageName === 'queue-dashboard.html') {
        console.log('Auth guard skipped for queue page:', pageName);
        return;
    }
    
    // Run auth guard for protected pages
    checkAuthOnLoad();
});

// Export
window.authGuard = {
    checkAuthOnLoad,
    redirectAfterLogin
};

console.log('🔒 Auth Guard loaded');

