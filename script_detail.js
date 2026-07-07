// --- KONFIGURASI API ---
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBLIlk6lbANUmDwdUkMtldg0AB5aDD-9_7bAQJ6UAbcTHZeHwlnLluwyXIG2jWRxNX/exec';

let currentProduct = null;
let qty = 1;

document.addEventListener('DOMContentLoaded', async () => {
    // --- LOGIKA PROTEKSI SESI ---
    // Jika tidak ada user yang login, tendang ke halaman login/index
    const namaLogIn = localStorage.getItem('namaUser');
    if (!namaLogIn) {
        alert("Sesi berakhir, silakan login kembali.");
        window.location.replace('index.html');
        return;
    }

    // 1. Ambil ID dari URL
    const params = new URLSearchParams(window.location.search);
    const idProduk = params.get('id');

    if (!idProduk) {
        alert("Produk tidak ditemukan!");
        window.location.href = 'landing_page.html';
        return;
    }

    // 2. Ambil data dari API
    try {
        const response = await fetch(APPS_SCRIPT_URL + '?action=getProducts');
        const result = await response.json();
        
        if (!result.data || !Array.isArray(result.data)) {
            throw new Error("Format data tidak valid");
        }
        
        // --- LOGIKA PENCARIAN YANG DIPERBAIKI ---
        currentProduct = result.data.find(item => {
            const keys = Object.keys(item);
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
// --- FUNGSI SUBMIT KE KERANJANG SPREADSHEET ---
async function submitOrder() {
    if (!currentProduct) {
        alert("Data produk belum termuat sempurna.");
        return;
    }

    // Mengunci tombol agar user tidak melakukan double-click saat proses upload berjalan
    const btnSubmit = document.getElementById('btn-submit-order');
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerText = "Menambahkan...";
    }

    // Helper untuk membaca nilai properti object secara case-insensitive
    const getVal = (key) => {
        const keys = Object.keys(currentProduct);
        const foundKey = keys.find(k => k.trim().toLowerCase() === key.toLowerCase());
        return foundKey ? currentProduct[foundKey] : '';
    };

    const catatan = document.getElementById('catatan').value;
    const namaLogIn = localStorage.getItem('namaUser') || 'Guest';

    // Susun objek data sesuai struktur penangkap di Apps Script
    const payload = {
        action: 'addToCart',
        data: {
            user: namaLogIn,
            id_produk: getVal('id_produk') || getVal('id') || getVal('idproduk'),
            nama_produk: getVal('nama') || getVal('nama_produk'),
            harga: getVal('harga'),
            jumlah: qty,
            catatan: catatan
        }
    };

    try {
        // Kirim data ke Google Apps Script menggunakan POST
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain' // text/plain menghindari preflight CORS issues di Apps Script
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            alert("Berhasil ditambahkan ke keranjang!");
            window.location.href = 'landing_page.html'; 
        } else {
            throw new Error(result.message || "Terjadi kesalahan di sistem server.");
        }

    } catch (error) {
        console.error("Error submit order:", error);
        alert("Gagal menyimpan pesanan: " + error.message);
    } finally {
        // Kembalikan kondisi tombol jika proses selesai/gagal
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerText = "Tambah ke Keranjang";
        }
    }
}

// --- FUNGSI LOGOUT ---
// Anda bisa memanggil fungsi ini saat tombol logout diklik
function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        localStorage.removeItem('namaUser');
        window.location.replace('index.html');
    }
}
