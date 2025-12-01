/**
 * QUEUE MANAGER - Manager Dashboard untuk Kelola Antrian
 * Menampilkan data dari Realtime Database dan menghapus saat selesai
 */

let unsubscribeOrders = null;
let currentStoreId = null;

/**
 * Initialize queue manager
 */
async function initQueueManager(storeId) {
    currentStoreId = storeId;
    
    console.log('Initializing queue manager for store:', storeId);
    
    // Load orders from Realtime Database
    await loadOrdersFromRealtimeDB();
    
    // Listen to real-time updates from Realtime Database
    if (unsubscribeOrders) {
        unsubscribeOrders();
    }
    
    // Set up real-time listener for orders
    setupRealtimeDBListener();
}

/**
 * Load orders from Realtime Database
 */
async function loadOrdersFromRealtimeDB() {
    if (typeof QueueSystem === 'undefined' || !QueueSystem.getQueue) {
        console.error('QueueSystem not available');
        return;
    }
    
    const result = await QueueSystem.getQueue();
    
    if (result.success) {
        const items = result.items || [];
        // Convert items array to orders format
        const orders = items.map((item, index) => ({
            index: index,
            customerName: item.customerName || 'Tidak ada nama',
            customerEmail: item.customerEmail || '',
            customerPhone: item.customerPhone || '',
            quantity: item.quantity || 1,
            productName: item.productName || 'Tidak ada nama produk',
            productId: item.productId || '',
            createdAt: item.createdAt || Date.now()
        }));
        
        renderOrders(orders);
        updateQueueStats(orders);
    } else {
        console.error('Failed to load orders:', result.error);
        showToast('Gagal memuat data pesanan', 'error');
    }
}

/**
 * Setup Realtime Database listener
 */
function setupRealtimeDBListener() {
    if (typeof QueueSystem === 'undefined' || !QueueSystem.listenToQueue) {
        console.error('QueueSystem not available');
        return;
    }
    
    unsubscribeOrders = QueueSystem.listenToQueue((data) => {
        const items = data.items || [];
        // Convert items array to orders format
        const orders = items.map((item, index) => ({
            index: index,
            customerName: item.customerName || 'Tidak ada nama',
            customerEmail: item.customerEmail || '',
            customerPhone: item.customerPhone || '',
            quantity: item.quantity || 1,
            productName: item.productName || 'Tidak ada nama produk',
            productId: item.productId || '',
            createdAt: item.createdAt || Date.now()
        }));
        
        renderOrders(orders);
        updateQueueStats(orders);
    });
}

/**
 * Update queue statistics
 */
function updateQueueStats(orders) {
    const totalOrders = orders.length;
    
    // Update stats cards
    if (document.getElementById('queueWaiting')) {
        document.getElementById('queueWaiting').textContent = totalOrders;
    }
    if (document.getElementById('queuePreparing')) {
        document.getElementById('queuePreparing').textContent = 0;
    }
    if (document.getElementById('queueReady')) {
        document.getElementById('queueReady').textContent = 0;
    }
    if (document.getElementById('queueTotal')) {
        document.getElementById('queueTotal').textContent = totalOrders;
    }
    
    // Update tab counts
    if (document.getElementById('tabWaitingCount')) {
        document.getElementById('tabWaitingCount').textContent = ` (${totalOrders})`;
    }
    if (document.getElementById('tabPreparingCount')) {
        document.getElementById('tabPreparingCount').textContent = ' (0)';
    }
    if (document.getElementById('tabReadyCount')) {
        document.getElementById('tabReadyCount').textContent = ' (0)';
    }
}

/**
 * Render orders from Realtime Database
 */
function renderOrders(orders) {
    // Render all orders in waiting tab
    renderOrderSection('waitingQueue', orders);
}

/**
 * Render order section
 */
function renderOrderSection(containerId, orders) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-queue">
                <i class="fas fa-inbox"></i>
                <p>Tidak ada pesanan dalam antrian</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => renderOrderCard(order)).join('');
}

/**
 * Render single order card
 */
function renderOrderCard(order) {
    const nama = order.customerName || 'Tidak ada nama';
    const productName = order.productName || 'Tidak ada nama produk';
    const quantity = order.quantity || 1;
    const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
    const timeString = createdAt.toLocaleString('id-ID', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    return `
        <div class="queue-card" data-order-index="${order.index}">
            <div class="queue-card-header">
                <div>
                    <div style="font-size: 14px; color: #999; margin-bottom: 5px;">Pesanan</div>
                    <div style="font-size: 12px; color: #666;">${timeString}</div>
                </div>
                <div class="queue-badge waiting">Menunggu</div>
            </div>
            
            <div class="queue-card-body">
                <div class="customer-info">
                    <i class="fas fa-user"></i>
                    <div>
                        <div class="customer-name">${nama}</div>
                        ${order.customerPhone ? `<div class="customer-phone">📞 ${order.customerPhone}</div>` : ''}
                        ${order.customerEmail ? `<div class="customer-phone">📧 ${order.customerEmail}</div>` : ''}
                    </div>
                </div>
                
                <div class="order-items">
                    <h4 style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Makanan yang dipesan:</h4>
                    <div class="item-row">
                        <span>${productName}</span>
                        <span style="font-weight: 600; color: #667eea;">${quantity}x</span>
                    </div>
                </div>
                
                <div class="order-meta">
                    <span><i class="fas fa-clock"></i> ${timeString}</span>
                </div>
            </div>
            
            <div class="queue-card-footer">
                <button class="btn btn-success" onclick="completeOrder()" style="flex: 1;">
                    <i class="fas fa-check"></i> Pesanan Selesai
                </button>
            </div>
        </div>
    `;
}

/**
 * Complete order - Remove first item from Realtime Database queue
 */
async function completeOrder() {
    if (!confirm('Pesanan selesai? Data akan dihapus dari antrian.')) return;
    
    if (typeof QueueSystem === 'undefined' || !QueueSystem.completeOrder) {
        showToast('❌ Fungsi hapus tidak tersedia', 'error');
        return;
    }
    
    const result = await QueueSystem.completeOrder();
    
    if (result.success) {
        const remaining = result.remainingCount || 0;
        if (remaining === 0) {
            showToast('✅ Pesanan selesai! Antrian kosong.', 'success');
        } else {
            showToast(`✅ Pesanan selesai! Sisa antrian: ${remaining}`, 'success');
        }
    } else {
        showToast('❌ Gagal menghapus data: ' + (result.error || 'Unknown error'), 'error');
    }
}

/**
 * Switch queue tab
 */
function switchQueueTab(tab) {
    // Update active tab button
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.tab-button').classList.add('active');
    
    // Show/hide tab content
    document.querySelectorAll('.queue-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // In simplified system, all orders are in waiting tab
    document.getElementById('waitingTab').classList.add('active');
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

/**
 * Format Rupiah
 */
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Export
window.QueueManager = {
    initQueueManager,
    completeOrder,
    switchQueueTab
};

// Make functions globally accessible
window.completeOrder = completeOrder;
window.switchQueueTab = switchQueueTab;

console.log('✅ Queue Manager loaded (Simplified per-product system)');
