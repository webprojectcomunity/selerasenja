const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwBLIlk6lbANUmDwdUkMtldg0AB5aDD-9_7bAQJ6UAbcTHZeHwlnLluwyXIG2jWRxNX/exec";

let currentCartData = [];
let totalBayar = 0;

// Format Rupiah
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
}

// Handling pergantian UI Metode Pembayaran
function handlePaymentChange(value) {
    const qrisBox = document.getElementById('qris-container');
    const tunaiBox = document.getElementById('tunai-container');
    
    document.getElementById('label-qris').classList.toggle('active', value === 'QRIS');
    document.getElementById('label-tunai').classList.toggle('active', value === 'Tunai');

    if (value === 'QRIS') {
        qrisBox.style.display = 'block';
        tunaiBox.style.display = 'none';
    } else {
        qrisBox.style.display = 'none';
        tunaiBox.style.display = 'block';
    }
}

// Inisialisasi Halaman
document.addEventListener('DOMContentLoaded', () => {
    const activeUser = localStorage.getItem('namaUser') || localStorage.getItem('currentUser');
    
    if (!activeUser) {
        alert("Sesi berakhir, silakan login kembali.");
        window.location.replace('index.html');
        return;
    }

    document.getElementById('user-name').innerText = activeUser;

    // Ambil data keranjang dari localStorage
    const rawCart = localStorage.getItem('cart') || localStorage.getItem('keranjang') || localStorage.getItem('cartItems');
    
    try {
        currentCartData = rawCart ? JSON.parse(rawCart) : [];
    } catch (e) {
        currentCartData = [];
    }

    if (!Array.isArray(currentCartData) || currentCartData.length === 0) {
        alert("Keranjang Anda kosong!");
        window.location.href = 'chart.html';
        return;
    }

    renderOrderSummary();
});

// Render Item Pesanan ke UI
function renderOrderSummary() {
    const container = document.getElementById('order-items-list');
    container.innerHTML = '';
    
    totalBayar = 0;

    currentCartData.forEach(item => {
        const nama = item.nama_produk || item.nama || 'Produk';
        const jumlah = parseInt(item.jumlah || item.qty || 1, 10);
        const harga = parseFloat(item.harga_satuan || item.harga || 0);
        const totalHargaItem = harga * jumlah;

        totalBayar += totalHargaItem;

        const rowHTML = `
            <div class="order-item">
                <div>
                    <strong>${nama}</strong>
                    <br><small style="color: #a0a0a0;">${jumlah}x @ ${formatRupiah(harga)}</small>
                </div>
                <span>${formatRupiah(totalHargaItem)}</span>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', rowHTML);
    });

    document.getElementById('subtotal-price').innerText = formatRupiah(totalBayar);
    document.getElementById('total-price').innerText = formatRupiah(totalBayar);
}

// Eksekusi Kirim Transaksi ke Google Apps Script
async function prosesEksekusiPesanan() {
    const btnSubmit = document.getElementById('btn-submit-order');
    const namaUser = localStorage.getItem('namaUser') || localStorage.getItem('currentUser');
    const idUser = localStorage.getItem('idUser') || '';
    const metodePembayaran = document.querySelector('input[name="payment_method"]:checked').value;
    const catatan = document.getElementById('order-notes').value.trim();

    if (!confirm(`Konfirmasi pemesanan sebesar ${formatRupiah(totalBayar)} dengan metode ${metodePembayaran}?`)) {
        return;
    }

    btnSubmit.disabled = true;
    btnSubmit.innerText = "Memproses Pesanan...";

    const payload = {
        action: "createTransaction",
        user: namaUser,
        id_user: idUser,
        total_bayar: totalBayar,
        metode_pembayaran: metodePembayaran,
        catatan: catatan,
        items: currentCartData
    };

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            alert("Pesanan berhasil dibuat! Silakan lakukan pembayaran.");
            
            // Bersihkan keranjang lokal
            localStorage.removeItem('cart');
            localStorage.removeItem('keranjang');
            localStorage.removeItem('cartItems');

            // Perbarui badge jika fungsi global tersedia
            if (window.updateCartBadge) window.updateCartBadge();

            // Redirect ke halaman utama / detail pesanan
            window.location.replace('landing_page.html');
        } else {
            alert("Gagal memproses pesanan: " + (result.message || "Terjadi kesalahan server."));
            btnSubmit.disabled = false;
            btnSubmit.innerText = "Konfirmasi & Proses Pesanan";
        }
    } catch (error) {
        console.error("Error Transaksi:", error);
        alert("Terjadi kesalahan koneksi server.");
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Konfirmasi & Proses Pesanan";
    }
}