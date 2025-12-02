// Data Menu Kantin (dengan store_id)
// Make it globally accessible for home.js
const menuItems = [
    // Kantin Bu Ani (Store ID: 1) - Makanan Berat
    {
        id: 1,
        store_id: 1,
        name: 'Nasi Goreng',
        price: 15000,
        image: 'asset/img/nasgor.png',
        description: 'Nasi Goreng Resep Arin — wangi, berbumbu pas, dan dimasak dengan api besar untuk rasa yang lebih mantap!',
        is_featured: true,
        sales_count: 150
    },
    {
        id: 2,
        store_id: 1,
        name: 'Nasi Ayam Geprek',
        price: 18000,
        image: 'asset/img/ayamgeprek.png',
        description: 'Ayam goreng crispy dengan sambal geprek pedas mantap!',
        is_featured: true,
        sales_count: 120
    },
    {
        id: 3,
        store_id: 1,
        name: 'Nasi Rendang',
        price: 22000,
        image: 'asset/img/rendang.png',
        description: 'Rendang daging empuk dengan bumbu rempah khas Padang',
        is_featured: false,
        sales_count: 80
    },
    
    // Warung Mas Budi (Store ID: 2) - Mie & Pasta
    {
        id: 4,
        store_id: 2,
        name: 'Mie Baso',
        price: 15000,
        image: 'asset/img/baso.png',
        description: 'Mie Baso Resep Arin — mie kenyal, kuah gurih, dan baso lembut yang bikin ketagihan!',
        is_featured: true,
        sales_count: 200
    },
    {
        id: 5,
        store_id: 2,
        name: 'Mie Ayam',
        price: 12000,
        image: 'asset/img/mieayam.png',
        description: 'Mie Ayam spesial dengan topping ayam suwir yang lezat!',
        is_featured: true,
        sales_count: 180
    },
    {
        id: 6,
        store_id: 2,
        name: 'Mie Goreng Seafood',
        price: 20000,
        image: 'asset/img/mieseafod.png',
        description: 'Mie goreng dengan topping seafood segar',
        is_featured: false,
        sales_count: 90
    },
    {
        id: 7,
        store_id: 2,
        name: 'Spaghetti Carbonara',
        price: 25000,
        image: 'asset/img/SpaghettiCarbonara.png',
        description: 'Spaghetti dengan saus carbonara creamy',
        is_featured: false,
        sales_count: 60
    },
    
    // Kedai Kopi & Snack (Store ID: 3) - Snack & Minuman
    {
        id: 8,
        store_id: 3,
        name: 'Gorengan',
        price: 5000,
        image: 'asset/img/gorengan.png',
        description: 'Gorengan crispy aneka isi - tahu, tempe, pisang!',
        is_featured: false,
        sales_count: 250
    },
    {
        id: 9,
        store_id: 3,
        name: 'Cappuccino',
        price: 15000,
        image: 'asset/img/Cappuccino.png',
        description: 'Kopi cappuccino dengan foam susu tebal',
        is_featured: true,
        sales_count: 140
    },
    {
        id: 10,
        store_id: 3,
        name: 'Thai Tea',
        price: 12000,
        image: 'asset/img/ThaiTea.png',
        description: 'Thai tea original dengan susu',
        is_featured: true,
        sales_count: 170
    }
];

// Make menuItems globally accessible immediately
if (typeof window !== 'undefined') {
    window.menuItems = menuItems;
    console.log('✅ menuItems loaded:', menuItems.length, 'items');
}

// Cart Management
class ShoppingCart {
    constructor() {
        this.items = this.loadCart();
    }

    loadCart() {
        const saved = localStorage.getItem('kantinCart');
        return saved ? JSON.parse(saved) : [];
    }

    saveCart() {
        localStorage.setItem('kantinCart', JSON.stringify(this.items));
        this.updateCartBadge();
    }

    addItem(menuItem, quantity = 1) {
        const existingItem = this.items.find(item => item.id === menuItem.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                ...menuItem,
                quantity: quantity
            });
        }
        
        this.saveCart();
        this.showNotification(`${menuItem.name} ditambahkan ke keranjang!`);
    }

    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        this.saveCart();
    }

    updateQuantity(itemId, quantity) {
        const item = this.items.find(item => item.id === itemId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.saveCart();
        }
    }

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    clearCart() {
        this.items = [];
        this.saveCart();
    }

    updateCartBadge() {
        const badge = document.getElementById('cartBadge');
        const count = this.getItemCount();
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    showNotification(message) {
        // Cek apakah sudah ada notifikasi
        let notification = document.getElementById('cartNotification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'cartNotification';
            notification.className = 'cart-notification';
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }
}

// Format Rupiah
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ShoppingCart, menuItems, formatRupiah };
}

