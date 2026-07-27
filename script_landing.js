// --- KONFIGURASI ---
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwBLIlk6lbANUmDwdUkMtldg0AB5aDD-9_7bAQJ6UAbcTHZeHwlnLluwyXIG2jWRxNX/exec";
let cachedData = []; // Untuk optimasi kecepatan

function convertDriveUrl(url) {
    if (!url) return 'https://via.placeholder.com/300x200?text=No+Image';
    try {
        const match = url.match(/id=([^&]+)/);
        return match && match[1] ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000` : url;
    } catch (e) { return url; }
}

/**
 * FUNGSI BADGE: Memperbarui angka indikator pada ikon Cart dari localStorage
 */
/**
 * FUNGSI BADGE: Memperbarui angka indikator pada ikon Cart dari localStorage
 */
function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;

    // Tambahkan key penyimpanan Anda ke daftar pencarian (contoh: 'cartItems', 'pesanan', dll)
    const rawCart = localStorage.getItem('cart') || 
                    localStorage.getItem('keranjang') || 
                    localStorage.getItem('cartItems') || 
                    localStorage.getItem('pesanan');
                    
    const cartData = JSON.parse(rawCart) || [];
    
    // Akumulasi total kuantitas (memeriksa properti qty, jumlah, quantity, atau count)
    const totalItems = Array.isArray(cartData) 
        ? cartData.reduce((sum, item) => sum + Number(item.qty || item.jumlah || item.quantity || item.count || 1), 0)
        : 0;

    if (totalItems > 0) {
        badge.innerText = totalItems > 99 ? '99+' : totalItems;
        badge.style.display = 'flex'; // Menggunakan flex agar posisi angka presisi di tengah
    } else {
        badge.style.display = 'none';
    }
}

/**
 * FUNGSI UTAMA: Load Menu dengan Caching & Filtering
 */
async function loadMenu(searchQuery = '') {
    const grid = document.getElementById('product-grid');
    
    // Ambil data dari server hanya jika cache kosong
    if (cachedData.length === 0) {
        grid.innerHTML = '<p style="grid-column: span 2; text-align:center;">Memuat menu...</p>';
        try {
            const response = await fetch(APPS_SCRIPT_URL + '?action=getProducts');
            const result = await response.json();
            if (!result.success) throw new Error("Gagal mengambil data");
            cachedData = result.data;
        } catch (error) {
            grid.innerHTML = '<p style="grid-column: span 2; text-align:center; color:red;">Gagal memuat data.</p>';
            return;
        }
    }

    // Proses Filtering
    let data = cachedData;
    if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        data = data.filter(item => 
            (item.nama || item.Nama || '').toLowerCase().includes(query) || 
            (item.deskripsi || item.Deskripsi || '').toLowerCase().includes(query)
        );
    }

    grid.innerHTML = '';
    if (data.length === 0) {
        grid.innerHTML = '<p style="grid-column: span 2; text-align:center;">Makanan tidak ditemukan</p>';
        return;
    }

    // Render ke UI
    data.forEach(item => {
        const values = Object.values(item);
        
        const idProduk = values[0] || ''; 
        const nama     = values[2] || 'Tanpa Nama'; 
        const deskripsi= values[3] || '-';
        const harga    = values[4] || '0';
        const img      = convertDriveUrl(values[5] || '');

        const card = `
        <div class="food-card">
            <div class="food-image-wrapper">
                <img src="${img}" alt="${nama}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=Error'">
            </div>
            <div class="glass-content">
                <h3>${nama}</h3>
                <p>${deskripsi}</p>
                <div class="card-footer">
                    <span class="price">${harga}</span>
                    <button class="add-btn" data-id="${idProduk}">+</button>
                </div>
            </div>
        </div>`;
        grid.insertAdjacentHTML('beforeend', card);
    });
}

// --- INISIALISASI & EVENT LISTENER (LOGIKAL GABUNGAN QR & MANUAL) ---
document.addEventListener('DOMContentLoaded', async () => {
    // 0. Update badge angka di Cart saat halaman pertama kali dibuka
    updateCartBadge();

    const greetingElement = document.getElementById('user-greeting');
    
    // 1. CEK JALUR QR CODE TERLEBIH DAHULU
    const urlParams = new URLSearchParams(window.location.search);
    const qrUserId = urlParams.get('userId');

    if (qrUserId) {
        if (greetingElement) greetingElement.innerText = "Mengautentikasi...";
        
        try {
            // Request ke Apps Script untuk mencocokkan data login_qr
            const response = await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "login_qr",
                    userId: qrUserId
                })
            });
            const data = await response.json();

            if (data.success) {
                localStorage.setItem('namaUser', data.user.nama);
                localStorage.setItem('idUser', data.user.id_user);
                
                if (greetingElement) greetingElement.innerText = `Hallo ${data.user.nama} !`;
                
                window.history.replaceState({}, document.title, window.location.pathname);
                
                loadMenu();
                initEventDelegation();
                return;
            } else {
                alert("Gagal Login QR: " + data.message);
                window.location.replace('index.html');
                return;
            }
        } catch (error) {
            console.error("Error Login QR:", error);
            alert("Terjadi masalah koneksi server saat memproses QR Code.");
            window.location.replace('index.html');
            return;
        }
    }

    // 2. CEK JALUR LOGIN MANUAL (Jika tidak ada parameter QR di URL)
    const namaLogIn = localStorage.getItem('namaUser');
    if (!namaLogIn) {
        window.location.replace('index.html');
        return;
    }

    if (greetingElement) greetingElement.innerText = `Hallo ${namaLogIn} !`;
    loadMenu();
    initEventDelegation();
});

// Event Delegation untuk tombol tambah (+)
function initEventDelegation() {
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('add-btn')) {
            const idProduk = e.target.getAttribute('data-id');
            if (idProduk) {
                window.location.href = `detail_pesanan.html?id=${idProduk}`;
            } else {
                alert("ID produk tidak ditemukan!");
            }
        }
    });
}

async function jalankanPencarian() {
    await loadMenu(document.getElementById('search-food').value);
}

function logout() {
    if (confirm('Keluar dari aplikasi?')) {
        localStorage.removeItem('namaUser');
        localStorage.removeItem('idUser');
        window.location.replace('index.html');
    }
}

history.pushState(null, null, location.href);
window.onpopstate = () => history.go(1);
