// --- KONFIGURASI ---
const _0x4f1a = ['\x68\x74\x74\x70\x73\x3a\x2f\x2f\x73\x63\x72\x69\x70\x74\x2e\x67\x6f\x6f\x67\x6c\x65\x2e\x63\x6f\x6d', '\x2f\x6d\x61\x63\x72\x6f\x73\x2f\x73\x2f', '\x41\x4b\x66\x79\x63\x62\x7a\x4d\x61\x4b\x42\x39\x7a\x41\x57\x62\x78\x48\x51\x6e\x4f\x77\x55\x4a\x64\x68\x41\x43\x70\x67\x61\x4a\x79\x46\x33\x38\x5f\x68\x7a\x4e\x38\x55\x55\x68\x4d\x30\x6a\x55\x72\x76\x74\x79\x51\x54\x68\x76\x42\x6d\x59\x46\x30\x35\x5a\x6c\x71\x48\x38\x6c\x62\x6d\x64\x31', '\x2f\x65\x78\x65\x63'];
const APPS_SCRIPT_URL = _0x4f1a.join('');
let cachedData = []; // Untuk optimasi kecepatan

function convertDriveUrl(url) {
    if (!url) return 'https://via.placeholder.com/300x200?text=No+Image';
    try {
        const match = url.match(/id=([^&]+)/);
        return match && match[1] ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000` : url;
    } catch (e) { return url; }
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
    // Mengubah objek menjadi array nilai agar kita bisa mengakses berdasarkan indeks
    // Kolom 0=id_produk, 1=tanggal, 2=nama, 3=deskripsi, 4=harga, 5=gambar
    const values = Object.values(item);
    
    const idProduk = values[0] || ''; // Mengambil kolom pertama
    const nama     = values[2] || 'Tanpa Nama'; // Mengambil kolom ketiga
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

// --- INISIALISASI & EVENT LISTENER ---
document.addEventListener('DOMContentLoaded', () => {
    const namaLogIn = localStorage.getItem('namaUser');
    if (!namaLogIn) {
        window.location.replace('index.html');
        return;
    }

    document.getElementById('user-greeting').innerText = `Hallo ${namaLogIn} !`;
    loadMenu();

    // --- PERBAIKAN: Event Delegation di tingkat Document ---
    document.addEventListener('click', function(e) {
        // Mengecek apakah yang diklik adalah tombol dengan class 'add-btn'
        if (e.target && e.target.classList.contains('add-btn')) {
            const idProduk = e.target.getAttribute('data-id');
            
            if (idProduk) {
                console.log("Navigasi ke:", idProduk); // Debugging
                window.location.href = `detail_pesanan.html?id=${idProduk}`;
            } else {
                alert("ID produk tidak ditemukan!");
            }
        }
    });
});

async function jalankanPencarian() {
    await loadMenu(document.getElementById('search-food').value);
}

function logout() {
    if (confirm('Keluar dari aplikasi?')) {
        localStorage.removeItem('namaUser');
        window.location.replace('index.html');
    }
}

history.pushState(null, null, location.href);
window.onpopstate = () => history.go(1);
