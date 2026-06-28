// --- KONFIGURASI API ---
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzMaKB9zAWbxHQnOwUJdhACpgaJyF38_hzN8UUhM0jUrvtyQThvBmYF05ZlqH8lbmd1/exec';

let currentProduct = null;
let qty = 1;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Ambil ID dari URL
    const params = new URLSearchParams(window.location.search);
    const idProduk = params.get('id');

    if (!idProduk) {
        alert("Produk tidak ditemukan!");
        window.location.href = 'landing_page.html';
        return;
    }

    // 2. Ambil data menu untuk mencari detail produk berdasarkan ID
    try {
        const response = await fetch(APPS_SCRIPT_URL + '?action=getProducts');
        const result = await response.json();
        
        // Cari produk yang sesuai dengan ID
        currentProduct = result.data.find(item => 
            (item.id_produk || item.id || '') === idProduk
        );

        if (currentProduct) {
            renderProduct(currentProduct);
        } else {
            document.getElementById('nama-produk').innerText = "Produk tidak ditemukan";
        }
    } catch (error) {
        console.error(error);
        alert("Gagal memuat detail produk.");
    }
});

// --- FUNGSI TAMPILAN ---
function renderProduct(item) {
    document.getElementById('nama-produk').innerText = item.nama || item.Nama || 'Tanpa Nama';
    document.getElementById('img-produk').src = item.gambar || item.Gambar || '';
    document.getElementById('harga-produk').innerText = 'Harga: ' + (item.harga || item.Harga || '0');
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

    const catatan = document.getElementById('catatan').value;
    const orderData = {
        id: currentProduct.id_produk || currentProduct.id,
        nama: currentProduct.nama || currentProduct.Nama,
        harga: currentProduct.harga || currentProduct.Harga,
        jumlah: qty,
        catatan: catatan
    };

    // Simpan ke localStorage agar bisa diakses di halaman Cart
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(orderData);
    localStorage.setItem('cart', JSON.stringify(cart));

    alert("Berhasil ditambahkan ke keranjang!");
    window.location.href = 'landing_page.html'; // Kembali ke menu
}