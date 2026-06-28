// --- KONFIGURASI API ---
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzMaKB9zAWbxHQnOwUJdhACpgaJyF38_hzN8UUhM0jUrvtyQThvBmYF05ZlqH8lbmd1/exec';

let currentProduct = null;
let qty = 1;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const idProduk = params.get('id');

    if (!idProduk) {
        alert("Produk tidak ditemukan!");
        window.location.href = 'landing_page.html';
        return;
    }

    try {
        const response = await fetch(APPS_SCRIPT_URL + '?action=getProducts');
        const result = await response.json();
        
        if (!result.data || !Array.isArray(result.data)) {
            throw new Error("Format data tidak valid");
        }
        
        // --- LOGIKA PENCARIAN YANG DIPERBAIKI ---
        // Kita cari kunci yang mengandung kata 'produk' agar fleksibel (d_produk atau id_produk)
        currentProduct = result.data.find(item => {
            const keys = Object.keys(item);
            // Mencari key yang mengandung kata 'produk'
            const idKey = keys.find(k => k.toLowerCase().includes('produk'));
            
            const idDariSheet = idKey ? String(item[idKey]).trim() : '';
            return idDariSheet === idProduk.trim();
        });

        if (currentProduct) {
            renderProduct(currentProduct);
        } else {
            console.error("Gagal menemukan produk dengan ID:", idProduk);
            document.getElementById('nama-produk').innerText = "Produk tidak ditemukan";
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Gagal memuat detail produk.");
    }
});

// --- FUNGSI TAMPILAN ---
function renderProduct(item) {
    const getVal = (key) => {
        const keys = Object.keys(item);
        // Mencari kunci yang mendekati nama field (misal: 'nama', 'gambar', 'harga')
        const foundKey = keys.find(k => k.trim().toLowerCase() === key.toLowerCase());
        return foundKey ? item[foundKey] : '';
    };

    document.getElementById('nama-produk').innerText = getVal('nama') || 'Tanpa Nama';
    document.getElementById('img-produk').src = getVal('gambar') || '';
    document.getElementById('harga-produk').innerText = 'Harga: ' + (getVal('harga') || '0');
}

// --- LOGIKA KUANTITAS ---
function updateQty(change) {
    qty += change;
    if (qty < 1) qty = 1;
    document.getElementById('qty').innerText = qty;
}

// --- FUNGSI SUBMIT KE KERANJANG ---
function submitOrder() {
    if (!currentProduct) return;

    const getVal = (key) => {
        const keys = Object.keys(currentProduct);
        const foundKey = keys.find(k => k.trim().toLowerCase() === key.toLowerCase());
        return foundKey ? currentProduct[foundKey] : '';
    };

    const catatan = document.getElementById('catatan').value;
    const orderData = {
        id: getVal('d_produk') || getVal('id_produk'),
        nama: getVal('nama'),
        harga: getVal('harga'),
        jumlah: qty,
        catatan: catatan
    };

    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(orderData);
    localStorage.setItem('cart', JSON.stringify(cart));

    alert("Berhasil ditambahkan ke keranjang!");
    window.location.href = 'landing_page.html'; 
}
