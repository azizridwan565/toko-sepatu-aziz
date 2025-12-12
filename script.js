/*
  Versi animasi kaya:
  - Persist keranjang ke localStorage
  - Toast notifikasi dengan animasi
  - Kontrol jumlah (+ / -) dan tombol hapus
  - Product-card tilt & parallax
  - Button ripple effect
  - Fly-to-cart animation saat menambah item
  - Pulse cart badge & little bounce
  - Confetti celebration saat checkout
*/

let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];

// Utility: format rupiah
function formatRp(number) {
    return `Rp ${Number(number).toLocaleString('id-ID')}`;
}

// UI: toast singkat dengan entry/exit anim
function showToast(text, timeout = 1600) {
    const t = document.createElement('div');
    t.className = 'mini-toast';
    t.textContent = text;
    Object.assign(t.style, {
        position: 'fixed',
        right: '18px',
        bottom: '18px',
        background: '#0b0b0b',
        color: '#fff',
        padding: '10px 14px',
        borderRadius: '10px',
        boxShadow: '0 8px 24px rgba(2,6,23,0.6)',
        zIndex: 9999,
        fontSize: '13px',
        opacity: '0',
        transform: 'translateY(14px) scale(.98)'
    });
    document.body.appendChild(t);
    requestAnimationFrame(() => {
        t.style.transition = 'opacity .28s cubic-bezier(.2,.9,.2,1), transform .36s cubic-bezier(.2,.9,.2,1)';
        t.style.opacity = '1';
        t.style.transform = 'translateY(0) scale(1)';
    });
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateY(14px) scale(.98)';
        setTimeout(() => t.remove(), 360);
    }, timeout);
}

// ripple effect for buttons
function bindRipples() {
    document.body.addEventListener('click', (ev) => {
        const btn = ev.target.closest('.btn, .mini');
        if (!btn) return;
        const r = document.createElement('span');
        r.className = 'ripple';
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.2;
        Object.assign(r.style, {
            position: 'absolute',
            width: `${size}px`,
            height: `${size}px`,
            left: `${ev.clientX - rect.left - size/2}px`,
            top: `${ev.clientY - rect.top - size/2}px`,
            background: 'rgba(255,255,255,0.18)',
            borderRadius: '50%',
            transform: 'scale(0)',
            pointerEvents: 'none',
            transition: 'transform .48s cubic-bezier(.2,.9,.2,1), opacity .48s',
            opacity: '0.9',
            zIndex: 2
        });
        btn.style.position = btn.style.position || 'relative';
        btn.appendChild(r);
        requestAnimationFrame(()=> r.style.transform = 'scale(1)');
        setTimeout(()=> { r.style.opacity = '0'; }, 240);
        setTimeout(()=> r.remove(), 700);
    });
}

// Update cart count badge
function updateCartCount(n) {
    const el = document.getElementById('cartCount');
    if (el) {
        el.textContent = n;
        // subtle pulse
        el.animate([
            { transform: 'scale(1)', boxShadow: '0 6px 14px rgba(139,0,0,0.18)' },
            { transform: 'scale(1.18)', boxShadow: '0 14px 30px rgba(139,0,0,0.22)' },
            { transform: 'scale(1)' }
        ], { duration: 420, easing: 'cubic-bezier(.2,.9,.2,1)' });
    }
    window.updateCartCount = updateCartCount;
}

// Persist ke localStorage
function simpanStorage() {
    localStorage.setItem('keranjang', JSON.stringify(keranjang));
}

// Fly-to-cart animation helper: clone element and animate to cart badge
function flyToCart(fromEl) {
    const cartBtn = document.querySelector('.btn.icon');
    if (!cartBtn || !fromEl) return;
    const img = fromEl.cloneNode(true);
    const fRect = fromEl.getBoundingClientRect();
    const cRect = cartBtn.getBoundingClientRect();
    Object.assign(img.style, {
        position: 'fixed',
        left: `${fRect.left}px`,
        top: `${fRect.top}px`,
        width: `${fRect.width}px`,
        height: `${fRect.height}px`,
        zIndex: 9998,
        borderRadius: '8px',
        opacity: '0.95',
        transformOrigin: 'center center',
        pointerEvents: 'none'
    });
    document.body.appendChild(img);
    const dx = cRect.left + cRect.width/2 - (fRect.left + fRect.width/2);
    const dy = cRect.top + cRect.height/2 - (fRect.top + fRect.height/2);
    img.animate([
        { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx*0.55}px, ${dy*0.55}px) scale(.85) rotate(12deg)`, opacity: .9, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(.25) rotate(30deg)`, opacity: 0.0 }
    ], { duration: 750, easing: 'cubic-bezier(.2,.9,.2,1)' });
    setTimeout(()=> img.remove(), 820);
}

// Tambah item ke keranjang (dipanggil dari tombol di HTML)
function tambahKeKeranjang(nama, hargaSatuan, kuantitasInput) {
    const kuantitas = parseInt(kuantitasInput) || 0;
    if (kuantitas <= 0) {
        // shake invalid input
        const el = document.activeElement;
        if (el && el.matches('input')) {
            el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 320 });
        }
        showToast('Masukkan jumlah yang valid (lebih dari 0).');
        return;
    }

    const idx = keranjang.findIndex(i => i.nama === nama);
    if (idx > -1) {
        keranjang[idx].kuantitas += kuantitas;
    } else {
        keranjang.push({ nama, hargaSatuan, kuantitas });
    }

    simpanStorage();
    tampilkanKeranjang();
    showToast(`${kuantitas}× ${nama} ditambahkan`, 1400);

    // tiny animations: fly-to-cart from product-media if possible
    const prodCards = [...document.querySelectorAll('.product-card')];
    const card = prodCards.find(c => (c.querySelector('h3') && c.querySelector('h3').textContent.trim().startsWith(nama)));
    const src = card ? card.querySelector('.product-media') : null;
    if (src) flyToCart(src);

    // pulse cart badge
    const badge = document.getElementById('cartCount');
    if (badge) badge.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.18)' },
        { transform: 'scale(1)' }
    ], { duration: 420, easing: 'cubic-bezier(.2,.9,.2,1)' });
}

// Render keranjang ke DOM, return subtotal
function tampilkanKeranjang() {
    const listElement = document.getElementById('keranjangList');
    listElement.innerHTML = '';

    let subtotal = 0;

    if (keranjang.length === 0) {
        const empty = document.createElement('li');
        empty.textContent = 'Keranjang kosong — tambahkan produk dulu.';
        empty.style.opacity = '0.8';
        listElement.appendChild(empty);
    } else {
        keranjang.forEach((item, index) => {
            const totalItem = item.hargaSatuan * item.kuantitas;
            subtotal += totalItem;

            const li = document.createElement('li');
            li.className = 'cart-item';
            li.innerHTML = `
                <div style="display:flex;gap:12px;align-items:center">
                    <div class="avatar" style="width:44px;height:44px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;">
                        ${item.nama.charAt(0)}
                    </div>
                    <div>
                        <div style="font-weight:600">${item.nama}</div>
                        <div style="font-size:13px;color:var(--muted)">${formatRp(item.hargaSatuan)} / pcs</div>
                    </div>
                </div>
                <div style="display:flex;gap:8px;align-items:center">
                    <div style="display:flex;align-items:center;background:rgba(0,0,0,0.02);padding:6px;border-radius:8px;">
                        <button class="mini" data-action="minus" data-index="${index}" aria-label="Kurangi">−</button>
                        <input class="small-qty" data-index="${index}" value="${item.kuantitas}" style="width:48px;text-align:center;border:none;background:transparent;color:inherit;font-weight:600" />
                        <button class="mini" data-action="plus" data-index="${index}" aria-label="Tambah">+</button>
                    </div>
                    <div style="min-width:110px;text-align:right;font-weight:700">${formatRp(totalItem)}</div>
                    <button class="btn outline del" data-index="${index}" aria-label="Hapus item">Hapus</button>
                </div>
            `;
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.style.padding = '10px';
            li.style.marginBottom = '8px';
            li.style.opacity = '0';
            listElement.appendChild(li);
            // staggered entrance
            li.animate([
                { opacity: 0, transform: 'translateY(6px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ], { duration: 380, delay: index * 60, easing: 'cubic-bezier(.2,.9,.2,1)' });
        });
    }

    document.getElementById('subTotal').textContent = `Subtotal: ${formatRp(subtotal)}`;
    updateCartCount(keranjang.reduce((s, i) => s + i.kuantitas, 0));
    simpanStorage();
    attachCartListeners();
    return subtotal;
}

// Attach listeners for +/- and delete and manual qty change
function attachCartListeners() {
    document.querySelectorAll('.mini').forEach(btn => {
        btn.onclick = () => {
            const idx = Number(btn.dataset.index);
            const action = btn.dataset.action;
            if (!Number.isInteger(idx) || !keranjang[idx]) return;
            if (action === 'plus') keranjang[idx].kuantitas += 1;
            if (action === 'minus') keranjang[idx].kuantitas = Math.max(0, keranjang[idx].kuantitas - 1);
            if (keranjang[idx] && keranjang[idx].kuantitas === 0) {
                keranjang.splice(idx, 1);
            }
            simpanStorage();
            tampilkanKeranjang();
        };
    });

    document.querySelectorAll('.del').forEach(btn => {
        btn.onclick = () => {
            const idx = Number(btn.dataset.index);
            if (!Number.isInteger(idx) || !keranjang[idx]) return;
            const nama = keranjang[idx].nama;
            keranjang.splice(idx, 1);
            simpanStorage();
            tampilkanKeranjang();
            showToast(`${nama} dihapus dari keranjang`, 1000);
        };
    });

    document.querySelectorAll('.small-qty').forEach(input => {
        input.onchange = () => {
            const idx = Number(input.dataset.index);
            let val = parseInt(input.value) || 0;
            if (!Number.isInteger(idx) || !keranjang[idx]) return;
            if (val <= 0) {
                keranjang.splice(idx, 1);
            } else {
                keranjang[idx].kuantitas = val;
            }
            simpanStorage();
            tampilkanKeranjang();
        };
        input.onkeydown = (e) => {
            if (e.key === 'Enter') input.blur();
        };
    });
}

// Reset keranjang
function resetKeranjang() {
    if (!confirm('Yakin ingin mengosongkan keranjang?')) return;
    keranjang = [];
    simpanStorage();
    tampilkanKeranjang();
    showToast('Keranjang dikosongkan', 1000);
}

// Confetti helper (simple DOM particles)
function burstConfetti(count = 24) {
    const colors = ['#ff3b30', '#8b0000', '#222', '#444', '#fff'];
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'confetti';
        const size = (Math.random() * 8 + 6) | 0;
        Object.assign(p.style, {
            position: 'fixed',
            left: `${50 + (Math.random() - 0.5) * 60}vw`,
            top: `${10 + Math.random() * 20}vh`,
            width: `${size}px`,
            height: `${size * 0.6}px`,
            background: colors[Math.floor(Math.random() * colors.length)],
            opacity: 1,
            transform: `rotate(${Math.random() * 360}deg)`,
            borderRadius: '2px',
            zIndex: 9999,
            pointerEvents: 'none'
        });
        document.body.appendChild(p);
        const dx = (Math.random() - 0.5) * 1200;
        const dy = 600 + Math.random() * 200;
        p.animate([
            { transform: p.style.transform + ' translateY(0px) translateX(0px)', opacity: 1 },
            { transform: `rotate(${Math.random() * 720}deg) translateY(${dy}px) translateX(${dx}px)`, opacity: 0 }
        ], { duration: 1600 + Math.random() * 900, easing: 'cubic-bezier(.2,.9,.2,1)' });
        setTimeout(() => p.remove(), 2200);
    }
}

// Checkout & hitung diskon
function checkout() {
    const subtotal = tampilkanKeranjang();
    if (subtotal === 0) {
        showToast('Keranjang masih kosong.', 1200);
        return;
    }

    let diskon = 0;
    const infoDiskonElement = document.getElementById('infoDiskon');

    if (subtotal >= 800000) {
        diskon = subtotal * 0.15;
        infoDiskonElement.textContent = `SELAMAT! Diskon 15% → ${formatRp(diskon)}`;
        infoDiskonElement.style.color = 'lightgreen';
    } else if (subtotal >= 500000) {
        diskon = subtotal * 0.10;
        infoDiskonElement.textContent = `Diskon 10% → ${formatRp(diskon)}`;
        infoDiskonElement.style.color = 'orange';
    } else {
        infoDiskonElement.textContent = 'Belanja minimal Rp 500.000 untuk mendapat diskon.';
        infoDiskonElement.style.color = 'var(--muted)';
    }

    const totalBayar = subtotal - diskon;
    document.getElementById('totalAkhir').textContent = formatRp(totalBayar);

    // celebration
    burstConfetti(30);
    const cartBtn = document.querySelector('.btn.icon');
    if (cartBtn) cartBtn.animate([{ transform: 'rotate(0deg) scale(1)' }, { transform: 'rotate(-12deg) scale(1.06)' }, { transform: 'rotate(0deg) scale(1)' }], { duration: 700, easing: 'cubic-bezier(.2,.9,.2,1)' });

    showToast(`Total: ${formatRp(totalBayar)} — Terima kasih!`, 2000);
}

// product-card tilt/parallax
function initProductHoverEffects() {
    document.querySelectorAll('.product-card').forEach(card => {
        const media = card.querySelector('.product-media');
        card.style.transformStyle = 'preserve-3d';
        card.addEventListener('mousemove', (e) => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            const rx = (py - 0.5) * 10; // rotateX
            const ry = (px - 0.5) * -10; // rotateY
            card.style.transition = 'transform 120ms linear';
            card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
            if (media) {
                media.style.transform = `translateZ(24px) translateY(${(0.5 - py) * 6}px) translateX(${(px - 0.5) * 6}px)`;
            }
        });
        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 420ms cubic-bezier(.2,.9,.2,1)';
            card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
            if (media) media.style.transition = 'transform 420ms cubic-bezier(.2,.9,.2,1)', media.style.transform = '';
        });
    });
}

// initial bindings
document.addEventListener('DOMContentLoaded', () => {
    bindRipples();
    initProductHoverEffects();
    tampilkanKeranjang();
});

// expose fungsi utama ke global (dipanggil oleh HTML inline onclick)
window.tambahKeKeranjang = tambahKeKeranjang;
window.tampilkanKeranjang = tampilkanKeranjang;
window.resetKeranjang = resetKeranjang;
window.checkout = checkout;
window.updateCartCount = updateCartCount;