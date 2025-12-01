/**
 * FIREBASE REALTIME DATABASE HELPERS
 * Additional helpers for Realtime Database (optional alternative to Firestore)
 */

/**
 * Get reference to Realtime Database path
 */
function getRealtimeRef(path) {
    const rtdb = firebaseApp.getRealtimeDb();
    if (!rtdb) {
        console.error('Realtime Database not initialized');
        return null;
    }
    return rtdb.ref(path);
}

/**
 * Set data in Realtime Database
 */
async function realtimeSet(path, data) {
    try {
        const ref = getRealtimeRef(path);
        if (!ref) return { success: false, error: 'Database not initialized' };
        
        await ref.set(data);
        return { success: true };
    } catch (error) {
        console.error('Realtime set error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update data in Realtime Database
 */
async function realtimeUpdate(path, data) {
    try {
        const ref = getRealtimeRef(path);
        if (!ref) return { success: false, error: 'Database not initialized' };
        
        await ref.update(data);
        return { success: true };
    } catch (error) {
        console.error('Realtime update error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Push data to Realtime Database (auto-generate key)
 */
async function realtimePush(path, data) {
    try {
        const ref = getRealtimeRef(path);
        if (!ref) return { success: false, error: 'Database not initialized' };
        
        const newRef = await ref.push(data);
        return { success: true, key: newRef.key };
    } catch (error) {
        console.error('Realtime push error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get data from Realtime Database (once)
 */
async function realtimeGet(path) {
    try {
        const ref = getRealtimeRef(path);
        if (!ref) return { success: false, error: 'Database not initialized' };
        
        const snapshot = await ref.once('value');
        return { 
            success: true, 
            data: snapshot.val(),
            exists: snapshot.exists()
        };
    } catch (error) {
        console.error('Realtime get error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete data from Realtime Database
 */
async function realtimeDelete(path) {
    try {
        const ref = getRealtimeRef(path);
        if (!ref) return { success: false, error: 'Database not initialized' };
        
        await ref.remove();
        return { success: true };
    } catch (error) {
        console.error('Realtime delete error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Listen to Realtime Database changes
 */
function realtimeListen(path, callback, eventType = 'value') {
    const ref = getRealtimeRef(path);
    if (!ref) return null;
    
    const listener = ref.on(eventType, (snapshot) => {
        callback({
            data: snapshot.val(),
            key: snapshot.key,
            exists: snapshot.exists()
        });
    }, (error) => {
        console.error('Realtime listener error:', error);
    });
    
    // Return function to unsubscribe
    return () => ref.off(eventType, listener);
}

/**
 * Query Realtime Database
 */
async function realtimeQuery(path, options = {}) {
    try {
        let ref = getRealtimeRef(path);
        if (!ref) return { success: false, error: 'Database not initialized' };
        
        // Apply query options
        if (options.orderBy) {
            ref = ref.orderByChild(options.orderBy);
        }
        
        if (options.equalTo !== undefined) {
            ref = ref.equalTo(options.equalTo);
        }
        
        if (options.startAt !== undefined) {
            ref = ref.startAt(options.startAt);
        }
        
        if (options.endAt !== undefined) {
            ref = ref.endAt(options.endAt);
        }
        
        if (options.limitToFirst) {
            ref = ref.limitToFirst(options.limitToFirst);
        }
        
        if (options.limitToLast) {
            ref = ref.limitToLast(options.limitToLast);
        }
        
        const snapshot = await ref.once('value');
        const results = [];
        
        snapshot.forEach((child) => {
            results.push({
                key: child.key,
                ...child.val()
            });
        });
        
        return { success: true, data: results, count: results.length };
    } catch (error) {
        console.error('Realtime query error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Transaction in Realtime Database
 */
async function realtimeTransaction(path, updateFunction) {
    try {
        const ref = getRealtimeRef(path);
        if (!ref) return { success: false, error: 'Database not initialized' };
        
        const result = await ref.transaction(updateFunction);
        
        return {
            success: result.committed,
            data: result.snapshot.val()
        };
    } catch (error) {
        console.error('Realtime transaction error:', error);
        return { success: false, error: error.message };
    }
}

// Export helpers
window.realtimeHelpers = {
    getRef: getRealtimeRef,
    set: realtimeSet,
    update: realtimeUpdate,
    push: realtimePush,
    get: realtimeGet,
    delete: realtimeDelete,
    listen: realtimeListen,
    query: realtimeQuery,
    transaction: realtimeTransaction
};

/**
 * EXAMPLE USAGE:
 * 
 * // Set data
 * await realtimeHelpers.set('users/user1', { name: 'John', age: 30 });
 * 
 * // Update data
 * await realtimeHelpers.update('users/user1', { age: 31 });
 * 
 * // Push data (auto-generate key)
 * const result = await realtimeHelpers.push('messages', { text: 'Hello' });
 * console.log('New key:', result.key);
 * 
 * // Get data
 * const data = await realtimeHelpers.get('users/user1');
 * console.log(data.data);
 * 
 * // Listen to changes
 * const unsubscribe = realtimeHelpers.listen('users/user1', (data) => {
 *     console.log('Data changed:', data);
 * });
 * // Stop listening
 * unsubscribe();
 * 
 * // Query data
 * const results = await realtimeHelpers.query('products', {
 *     orderBy: 'price',
 *     startAt: 10000,
 *     endAt: 50000,
 *     limitToFirst: 10
 * });
 * 
 * // Transaction (for concurrent updates)
 * await realtimeHelpers.transaction('products/prod1/stock', (currentStock) => {
 *     return (currentStock || 0) - 1; // Decrement stock
 * });
 */

