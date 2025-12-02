// Inisialisasi cart
const cart = new ShoppingCart();
const ADMIN_FEE = 1000;

// Check authentication
if (typeof isAuthenticated !== 'undefined' && !isAuthenticated()) {
    sessionStorage.setItem('intended_url', window.location.href);
    window.location.href = 'login.html';
}

// Render cart items
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCartDiv = document.getElementById('emptyCart');
    const checkoutForm = document.getElementById('checkoutForm');
    
    if (cart.items.length === 0) {
        cartItemsContainer.style.display = 'none';
        emptyCartDiv.style.display = 'block';
        checkoutForm.style.display = 'none';
        document.querySelector('.order-summary').style.display = 'none';
        return;
    }
    
    cartItemsContainer.style.display = 'block';
    emptyCartDiv.style.display = 'none';
    checkoutForm.style.display = 'block';
    document.querySelector('.order-summary').style.display = 'block';
    
    cartItemsContainer.innerHTML = cart.items.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p class="item-price">${formatRupiah(item.price)}</p>
            </div>
            <div class="cart-item-quantity">
                <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})" class="qty-btn">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="quantity">${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})" class="qty-btn">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <div class="cart-item-total">
                <p>${formatRupiah(item.price * item.quantity)}</p>
                <button onclick="removeFromCart(${item.id})" class="btn-remove">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    updateOrderSummary();
}

// Update quantity
function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) {
        if (confirm('Hapus item ini dari keranjang?')) {
            cart.removeItem(itemId);
            renderCartItems();
        }
        return;
    }
    cart.updateQuantity(itemId, newQuantity);
    renderCartItems();
}

// Remove from cart
function removeFromCart(itemId) {
    if (confirm('Hapus item ini dari keranjang?')) {
        cart.removeItem(itemId);
        renderCartItems();
    }
}

// Update order summary
function updateOrderSummary() {
    const subtotal = cart.getTotal();
    const total = subtotal + ADMIN_FEE;
    
    document.getElementById('subtotal').textContent = formatRupiah(subtotal);
    document.getElementById('adminFee').textContent = formatRupiah(ADMIN_FEE);
    document.getElementById('total').textContent = formatRupiah(total);
    cart.updateCartBadge();
}

// Handle form submission
document.getElementById('orderForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const customerName = document.getElementById('customerName').value;
    const customerEmail = document.getElementById('customerEmail').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const customerNote = document.getElementById('customerNote').value;
    
    const orderData = {
        customer: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            note: customerNote
        },
        items: cart.items,
        subtotal: cart.getTotal(),
        adminFee: ADMIN_FEE,
        total: cart.getTotal() + ADMIN_FEE
    };
    
    // Simpan data order ke localStorage
    localStorage.setItem('currentOrder', JSON.stringify(orderData));
    
    // Process payment with Midtrans
    processPayment(orderData);
});

// Process payment dengan Midtrans Snap
async function processPayment(orderData) {
    const btnCheckout = document.getElementById('btnCheckout');
    btnCheckout.disabled = true;
    btnCheckout.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    
    // Generate order ID
    const orderId = 'ORDER-' + Date.now();
    
    // Get user info
    const user = getCurrentUser ? getCurrentUser() : null;
    
    // Get store info from cart
    const storeId = cart.items.length > 0 ? cart.items[0].store_id : null;
    
    if (!storeId) {
        alert('Error: Store ID tidak ditemukan');
        btnCheckout.disabled = false;
        btnCheckout.innerHTML = '<i class="fas fa-lock"></i> Bayar Sekarang';
        return;
    }
    
    // Prepare queue data (simplified - per product)
    const queueData = {
        orderId: orderId,
        orderNumber: orderId,
        storeId: storeId,
        customerId: user ? user.id : 'guest',
        customerName: orderData.customer.name,
        customerEmail: orderData.customer.email || '',
        customerPhone: orderData.customer.phone || '',
        items: cart.items,
        totalAmount: orderData.total
    };
    
    // Save order to Firebase Firestore FIRST
    let firebaseOrderId = null;
    if (typeof firebaseData !== 'undefined' && firebaseData.saveOrderToFirebase) {
        const firebaseOrderResult = await firebaseData.saveOrderToFirebase({
            orderNumber: orderId,
            storeId: storeId,
            customerId: user ? user.id : 'guest',
            customerName: orderData.customer.name,
            customerEmail: orderData.customer.email,
            customerPhone: orderData.customer.phone,
            items: cart.items,
            subtotal: orderData.subtotal,
            adminFee: orderData.adminFee,
            totalAmount: orderData.total,
            paymentMethod: 'midtrans'
        });
        
        if (firebaseOrderResult.success) {
            firebaseOrderId = firebaseOrderResult.orderId;
            console.log('✅ Order saved to Firestore:', firebaseOrderId);
            
            // Save order ID for later reference
            sessionStorage.setItem('lastFirebaseOrderId', firebaseOrderId);
        } else {
            console.error('Failed to save order to Firestore:', firebaseOrderResult.error);
        }
    }
    
    // Add order to queue (Realtime Database)
    if (window.QueueSystem) {
        const queueResult = await QueueSystem.addToQueue(queueData);
        
        if (queueResult.success) {
            console.log('✅ Order added to queue:', queueResult);
            
            // Save queue info (simplified - no queue key/number needed)
            sessionStorage.setItem('lastStoreId', storeId);
            sessionStorage.setItem('lastOrderId', orderId);
            
            // Show success message with queue info
            console.log('📊 Queue status: Total items in queue:', queueResult.count || 0);
            
            // Update Firestore order with queue info
            if (firebaseOrderId && typeof firebaseData !== 'undefined' && firebaseData.updateOrderStatusInFirebase) {
                await firebaseData.updateOrderStatusInFirebase(firebaseOrderId, 'pending', 'pending');
            }
        } else {
            console.error('Failed to add to queue:', queueResult.error);
        }
    }
    
    // Dalam production, Anda perlu memanggil backend server untuk mendapatkan snap token
    // Contoh ini menggunakan Midtrans Snap untuk demo
    
    // DEMO MODE - Simulasi pembayaran
    // Untuk production, ganti dengan call ke backend server Anda
    const snapToken = generateDemoSnapToken(orderId, orderData);
    
    if (snapToken === 'DEMO_MODE') {
        // Jika dalam demo mode, redirect ke success page
        alert('DEMO MODE: Dalam production, ini akan membuka Midtrans Snap Payment.\n\nUntuk mengaktifkan pembayaran real:\n1. Daftar di Midtrans.com\n2. Dapatkan Server Key & Client Key\n3. Buat backend API untuk generate snap token\n4. Update payment.html dengan Client Key Anda');
        
        // Simulasi pembayaran sukses
        setTimeout(async () => {
            // Pastikan data sudah disimpan ke Firebase
            if (!firebaseOrderId && typeof firebaseData !== 'undefined' && firebaseData.saveOrderToFirebase) {
                const firebaseOrderResult = await firebaseData.saveOrderToFirebase({
                    storeId: storeId,
                    customerName: orderData.customer.name,
                    customerEmail: orderData.customer.email,
                    customerPhone: orderData.customer.phone,
                    items: cart.items,
                    totalAmount: orderData.total
                });
                
                if (firebaseOrderResult.success) {
                    console.log('✅ Data pemesan berhasil disimpan ke Firebase (DEMO MODE)');
                }
            }
            
            localStorage.setItem('lastOrderId', orderId);
            
            // Show queue number
            const queueNum = sessionStorage.getItem('lastQueueNumber') || '-';
            alert(`Pesanan berhasil! Data telah disimpan ke database.\nNomor antrian Anda: ${queueNum}`);
            
            cart.clearCart();
            window.location.href = 'success.html';
        }, 1000);
    } else {
        // Production mode dengan Midtrans Snap
        window.snap.pay(snapToken, {
            onSuccess: async function(result) {
                console.log('Payment success:', result);
                
                // Pastikan data sudah disimpan ke Firebase
                if (!firebaseOrderId && typeof firebaseData !== 'undefined' && firebaseData.saveOrderToFirebase) {
                    const firebaseOrderResult = await firebaseData.saveOrderToFirebase({
                        storeId: storeId,
                        customerName: orderData.customer.name,
                        customerEmail: orderData.customer.email,
                        customerPhone: orderData.customer.phone,
                        items: cart.items,
                        totalAmount: orderData.total
                    });
                    
                    if (firebaseOrderResult.success) {
                        console.log('✅ Data pemesan berhasil disimpan ke Firebase setelah pembayaran');
                    }
                }
                
                localStorage.setItem('lastOrderId', orderId);
                localStorage.setItem('paymentResult', JSON.stringify(result));
                cart.clearCart();
                window.location.href = 'success.html';
            },
            onPending: function(result) {
                console.log('Payment pending:', result);
                alert('Menunggu pembayaran Anda');
                btnCheckout.disabled = false;
                btnCheckout.innerHTML = '<i class="fas fa-lock"></i> Bayar Sekarang';
            },
            onError: function(result) {
                console.log('Payment error:', result);
                alert('Pembayaran gagal. Silakan coba lagi.');
                btnCheckout.disabled = false;
                btnCheckout.innerHTML = '<i class="fas fa-lock"></i> Bayar Sekarang';
            },
            onClose: function() {
                console.log('Payment popup closed');
                btnCheckout.disabled = false;
                btnCheckout.innerHTML = '<i class="fas fa-lock"></i> Bayar Sekarang';
            }
        });
    }
}

// Generate demo snap token (untuk demo saja)
function generateDemoSnapToken(orderId, orderData) {
    // Ini adalah mode DEMO
    // Dalam production, Anda perlu backend server untuk generate snap token
    
    // Cek apakah Midtrans Client Key sudah di-set
    const scriptTag = document.querySelector('script[data-client-key]');
    const clientKey = scriptTag ? scriptTag.getAttribute('data-client-key') : null;
    
    if (!clientKey || clientKey === 'YOUR-CLIENT-KEY-HERE') {
        return 'DEMO_MODE';
    }
    
    // Jika client key sudah di-set, kembalikan null agar memanggil backend
    return null;
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    renderCartItems();
    cart.updateCartBadge();
});

