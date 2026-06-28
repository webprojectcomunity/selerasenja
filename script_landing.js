const _0x4f1a = ['\x68\x74\x74\x70\x73\x3a\x2f\x2f\x73\x63\x72\x69\x70\x74\x2e\x67\x6f\x6f\x67\x6c\x65\x2e\x63\x6f\x6d', '\x2f\x6d\x61\x63\x72\x6f\x73\x2f\x73\x2f', '\x41\x4b\x66\x79\x63\x62\x7a\x4d\x61\x4b\x42\x39\x7a\x41\x57\x62\x78\x48\x51\x6e\x4f\x77\x55\x4a\x64\x68\x41\x43\x70\x67\x61\x4a\x79\x46\x33\x38\x5f\x68\x7a\x4e\x38\x55\x55\x68\x4d\x30\x6a\x55\x72\x76\x74\x79\x51\x54\x68\x76\x42\x6d\x59\x46\x30\x35\x5a\x6c\x71\x48\x38\x6c\x62\x6d\x64\x31', '\x2f\x65\x78\x65\x63'];
const APPS_SCRIPT_URL = _0x4f1a.join('');

function convertDriveUrl(url) {
    if (!url) return 'https://via.placeholder.com/300x200?text=No+Image';
    try {
        const match = url.match(/id=([^&]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
        }
        return url;
    } catch (e) {
        return url;
    }
}

async function loadMenu() {
    const grid = document.getElementById('product-grid');
    try {
        grid.innerHTML = '<p style="grid-column: span 2; text-align:center; color:#1a0f08;">Memuat data menu...</p>';
        const response = await fetch(APPS_SCRIPT_URL + '?action=getProducts');
        const result = await response.json();
        grid.innerHTML = '';

        if (!result.success) {
            grid.innerHTML = '<p style="grid-column: span 2; text-align:center; color:red; font-weight:700;">API gagal memuat data</p>';
            return;
        }

        const data = result.data;
        if (!data || data.length === 0) {
            grid.innerHTML = '<p style="grid-column: span 2; text-align:center; color:#1a0f08;">Belum ada menu tersedia</p>';
            return;
        }

        data.forEach(item => {
            const image = convertDriveUrl(item.gambar);
            const card = `
            <div class="food-card">
                <div class="food-image-wrapper">
                   <img
    src="${image}"
    alt="${item.nama}"
    loading="lazy"
    onerror="this.onerror=null;this.src='https://via.placeholder.com/300x200?text=Image+Error';">
                </div>
                <div class="glass-content">
                    <h3>${item.nama || 'Tanpa Nama'}</h3>
                    <p>${item.deskripsi || '-'}</p>
                    <div class="card-footer">
                        <span class="price">${item.harga || '0'}</span>
                        <button class="add-btn">+</button>
                    </div>
                </div>
            </div>
            `;
            grid.insertAdjacentHTML('beforeend', card);
        });
    } catch (error) {
        console.error(error);
        grid.innerHTML = '<p style="grid-column: span 2; text-align:center; color:darkred; font-weight:700;">Gagal memuat data menu.</p>';
    }
}


/************************************************
 * MODIFIKASI: loadMenu dengan Fitur Robust Frontend Filter
 ************************************************/
async function loadMenu(searchQuery = '') {
    const grid = document.getElementById('product-grid');
    try {
        grid.innerHTML = '<p style="grid-column: span 2; text-align:center; color:#1a0f08;">Memuat data menu...</p>';
        
        // Ambil semua data dari API secara normal
        const url = APPS_SCRIPT_URL + '?action=getProducts';
        const response = await fetch(url);
        const result = await response.json();
        grid.innerHTML = '';

        if (!result.success) {
            grid.innerHTML = '<p style="grid-column: span 2; text-align:center; color:red; font-weight:700;">API gagal memuat data</p>';
            return;
        }

        let data = result.data;

        /************************************************
         * PROSES FILTER DI SISI FRONTEND (ANTI-GAGAL)
         ************************************************/
        if (searchQuery && searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase().trim();
            
            data = data.filter(item => {
                // Antisipasi jika header di spreadsheet menggunakan huruf besar/kecil (nama vs Nama)
                const nama = (item.nama || item.Nama || '').toString().toLowerCase();
                const deskripsi = (item.deskripsi || item.Deskripsi || '').toString().toLowerCase();
                
                return nama.includes(query) || deskripsi.includes(query);
            });
        }

        // Jika setelah difilter datanya kosong
        if (!data || data.length === 0) {
            grid.innerHTML = '<p style="grid-column: span 2; text-align:center; color:#1a0f08; font-weight:600;">Makanan yang Anda cari tidak ditemukan</p>';
            return;
        }

        // Tampilkan data hasil filter
        data.forEach(item => {
            // Mengambil properti secara fleksibel (huruf besar/kecil aman)
            const namaProduk = item.nama || item.Nama || 'Tanpa Nama';
            const deskripsiProduk = item.deskripsi || item.Deskripsi || '-';
            const hargaProduk = item.harga || item.Harga || '0';
            const gambarProduk = item.gambar || item.Gambar || '';

            const image = convertDriveUrl(gambarProduk);
            const card = `
            <div class="food-card">
                <div class="food-image-wrapper">
                    <img src="${image}" alt="${namaProduk}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=Image+Error'">
                </div>
                <div class="glass-content">
                    <h3>${namaProduk}</h3>
                    <p>${deskripsiProduk}</p>
                    <div class="card-footer">
                        <span class="price">${hargaProduk}</span>
                        <button class="add-btn">+</button>
                    </div>
                </div>
            </div>
            `;
            grid.insertAdjacentHTML('beforeend', card);
        });
    } catch (error) {
        console.error(error);
        grid.innerHTML = '<p style="grid-column: span 2; text-align:center; color:darkred; font-weight:700;">Gagal memuat data menu.</p>';
    }
}

/************************************************
 * JALANKAN PENCARIAN
 ************************************************/
async function jalankanPencarian() {
    const query = document.getElementById('search-food').value.trim();
    // Panggil loadMenu dengan membawa kata kunci
    await loadMenu(query);
}

/************************************************
 * FUNGSI LOGOUT KELUAR APLIKASI
 ************************************************/
function logout() {
    if (confirm('Apakah Anda yakin ingin keluar dari aplikasi?')) {
        localStorage.removeItem('namaUser');
        // UBAH DI SINI: Arahkan balik ke halaman login baru (index.html)
        window.location.replace('index.html');
    }
}

/************************************************
 * AUTO LOAD, SESSION GUARD & ANTI-BACK ALGORITHM
 ************************************************/
document.addEventListener('DOMContentLoaded', () => {
    const namaLogIn = localStorage.getItem('namaUser');
    
    // UBAH DI SINI: Jika TIDAK ada session, tendang balik ke halaman login baru (index.html)
    if (!namaLogIn) {
        window.location.replace('index.html');
        return;
    }

    document.getElementById('user-greeting').innerText = `Hallo ${namaLogIn} !`;
    loadMenu();
});

/************************************************
 * LOCK HISTORY BROWSER (MENGUNCI TOMBOL BACK)
 ************************************************/
history.pushState(null, null, location.href);
window.onpopstate = function () {
    history.go(1);
};


