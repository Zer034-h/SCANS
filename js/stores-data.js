// Data Toko/Kantin
const storesData = [
    {
        id: 1,
        name: 'Kantin Bu Ani',
        slug: 'kantin-bu-ani',
        tagline: 'Legendaris sejak 1995! 👑',
        description: 'Kantin legendaris dengan menu nasi goreng terenak! Masakan rumahan yang lezat dengan harga terjangkau.',
        logo: 'asset/img/6.png',
        banner: 'asset/img/1.png',
        rating: 4.8,
        reviews: 342,
        location: 'Gedung A, Lantai 1',
        hours: '07:00 - 16:00',
        days: 'Senin - Sabtu',
        speciality: 'Makanan Berat'
    },
    {
        id: 2,
        name: 'Warung Mas Budi',
        slug: 'warung-mas-budi',
        tagline: 'Spesialis Mie & Bakso! 🍜',
        description: 'Warung favorit mahasiswa dengan porsi jumbo dan harga ramah kantong. Menu andalan: Mie Ayam Jumbo!',
        logo: 'asset/img/7.png',
        banner: 'asset/img/2.png',
        rating: 4.6,
        reviews: 218,
        location: 'Gedung B, Lantai 2',
        hours: '08:00 - 17:00',
        days: 'Senin - Jumat',
        speciality: 'Mie & Pasta'
    },
    {
        id: 3,
        name: 'Kedai Kopi & Snack',
        slug: 'kedai-kopi-snack',
        tagline: 'Coffee & Hangout Spot! ☕',
        description: 'Coffee shop modern dengan berbagai pilihan kopi, minuman segar, dan snack. WiFi gratis & colokan listrik!',
        logo: 'asset/img/8.png',
        banner: 'asset/img/3.png',
        rating: 4.7,
        reviews: 156,
        location: 'Gedung C, Lantai 1',
        hours: '07:30 - 18:00',
        days: 'Senin - Sabtu',
        speciality: 'Kopi & Snack'
    }
];

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { storesData };
}

