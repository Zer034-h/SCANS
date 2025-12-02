/**
 * QUEUE SYSTEM - Simplified Order Queue
 * Struktur: orderQueue/ { count, items[] }
 * items[] berisi array pesanan dengan data: customerName, customerEmail, customerPhone, quantity, createdAt
 */

const QUEUE_DB_PATH = 'orderQueue';

/**
 * Add order to queue
 * Menambahkan semua item dalam order ke queue
 */
async function addToQueue(orderData) {
    try {
        const rtdb = firebaseApp.getRealtimeDb();
        if (!rtdb) {
            console.error('Realtime Database not initialized');
            return { success: false, error: 'Database not available' };
        }
        
        const queueRef = rtdb.ref(QUEUE_DB_PATH);
        
        // Get current queue data
        const snapshot = await queueRef.once('value');
        const currentData = snapshot.val() || { count: 0, items: [] };
        const currentItems = currentData.items || [];
        
        // Process each item in the order
        const newItems = [];
        const storeId = orderData.storeId || null; // Get storeId from orderData
        
        for (const item of orderData.items) {
            // Create order entry for each item
            const orderEntry = {
                customerName: orderData.customerName,
                customerEmail: orderData.customerEmail || '',
                customerPhone: orderData.customerPhone || '',
                quantity: item.quantity,
                productName: item.name,
                productId: item.id,
                storeId: storeId, // Store ID untuk filter per toko
                status: 'waiting', // Default status
                createdAt: Date.now()
            };
            
            newItems.push(orderEntry);
        }
        
        // Add all new items to existing items
        const updatedItems = [...currentItems, ...newItems];
        const updatedCount = updatedItems.length;
        
        // Update queue
        await queueRef.set({
            count: updatedCount,
            items: updatedItems
        });
        
        console.log(`✅ Added ${newItems.length} items to queue. Total count: ${updatedCount}`);
        
        return {
            success: true,
            count: updatedCount,
            addedItems: newItems.length
        };
        
    } catch (error) {
        console.error('Error adding to queue:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update order status by index
 * Mengubah status pesanan tertentu
 */
async function updateOrderStatus(orderIndex, newStatus) {
    try {
        const rtdb = firebaseApp.getRealtimeDb();
        if (!rtdb) {
            return { success: false, error: 'Database not available' };
        }
        
        const queueRef = rtdb.ref(QUEUE_DB_PATH);
        
        // Get current queue data
        const snapshot = await queueRef.once('value');
        const currentData = snapshot.val();
        
        if (!currentData || !currentData.items || currentData.items.length === 0) {
            return { success: false, error: 'No orders in queue' };
        }
        
        if (orderIndex < 0 || orderIndex >= currentData.items.length) {
            return { success: false, error: 'Invalid order index' };
        }
        
        // Update status of specific order
        const updatedItems = [...currentData.items];
        updatedItems[orderIndex] = {
            ...updatedItems[orderIndex],
            status: newStatus,
            statusUpdatedAt: Date.now()
        };
        
        // Update queue
        await queueRef.set({
            count: updatedItems.length,
            items: updatedItems
        });
        
        console.log(`✅ Updated order ${orderIndex} status to ${newStatus}`);
        
        return {
            success: true,
            orderIndex: orderIndex,
            newStatus: newStatus
        };
        
    } catch (error) {
        console.error('Error updating order status:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Complete one order (remove order by index from queue)
 * Manager clicks "Pesanan Selesai" → remove order from queue
 */
async function completeOrder(orderIndex) {
    try {
        const rtdb = firebaseApp.getRealtimeDb();
        if (!rtdb) {
            return { success: false, error: 'Database not available' };
        }
        
        const queueRef = rtdb.ref(QUEUE_DB_PATH);
        
        // Get current queue data
        const snapshot = await queueRef.once('value');
        const currentData = snapshot.val();
        
        if (!currentData || !currentData.items || currentData.items.length === 0) {
            return { success: false, error: 'No orders in queue' };
        }
        
        // If orderIndex is provided, remove that specific order
        // Otherwise, remove first item (backward compatibility)
        let updatedItems;
        if (orderIndex !== undefined && orderIndex !== null) {
            if (orderIndex < 0 || orderIndex >= currentData.items.length) {
                return { success: false, error: 'Invalid order index' };
            }
            updatedItems = currentData.items.filter((_, index) => index !== orderIndex);
        } else {
            // Remove first item (old behavior)
            updatedItems = currentData.items.slice(1);
        }
        
        const updatedCount = updatedItems.length;
        
        if (updatedCount === 0) {
            // If no more items, set to empty structure
            await queueRef.set({
                count: 0,
                items: []
            });
            console.log(`✅ Completed order. Queue is now empty.`);
        } else {
            // Update with remaining items
            await queueRef.set({
                count: updatedCount,
                items: updatedItems
            });
            console.log(`✅ Completed order. Remaining: ${updatedCount}`);
        }
        
        return {
            success: true,
            remainingCount: updatedCount
        };
        
    } catch (error) {
        console.error('Error completing order:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all queue data
 */
async function getQueue() {
    try {
        const rtdb = firebaseApp.getRealtimeDb();
        if (!rtdb) {
            return { success: false, error: 'Database not available' };
        }
        
        const queueRef = rtdb.ref(QUEUE_DB_PATH);
        const snapshot = await queueRef.once('value');
        const data = snapshot.val();
        
        if (!data) {
            return {
                success: true,
                count: 0,
                items: []
            };
        }
        
        return {
            success: true,
            count: data.count || 0,
            items: data.items || []
        };
        
    } catch (error) {
        console.error('Error getting queue:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Listen to queue changes (real-time)
 */
function listenToQueue(callback) {
    try {
        const rtdb = firebaseApp.getRealtimeDb();
        if (!rtdb) {
            console.error('Realtime Database not initialized');
            return null;
        }
        
        const queueRef = rtdb.ref(QUEUE_DB_PATH);
        
        const unsubscribe = queueRef.on('value', (snapshot) => {
            const data = snapshot.val();
            
            if (!data) {
                callback({
                    count: 0,
                    items: []
                });
                return;
            }
            
            callback({
                count: data.count || 0,
                items: data.items || []
            });
        }, (error) => {
            console.error('Error listening to queue:', error);
        });
        
        return unsubscribe;
        
    } catch (error) {
        console.error('Error setting up queue listener:', error);
        return null;
    }
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
    try {
        const result = await getQueue();
        
        if (!result.success) {
            return { success: false, error: result.error };
        }
        
        return {
            success: true,
            count: result.count || 0,
            items: result.items || []
        };
        
    } catch (error) {
        console.error('Error getting queue stats:', error);
        return { success: false, error: error.message };
    }
}


// Export
window.QueueSystem = {
    addToQueue,
    updateOrderStatus,
    completeOrder,
    getQueue,
    listenToQueue,
    getQueueStats
};

console.log('✅ Queue System loaded (Simplified queue structure)');
