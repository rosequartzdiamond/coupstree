// ==========================================
// 1. SPA NAVIGATION LOGIC
// ==========================================
function navigateTo(sectionId) {
    showSection(sectionId);
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none'; 
    });

    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
        activeSection.style.display = 'block';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// 2. AUTO-SLIDER LOGIC
// ==========================================
function startAutoSlide(sliderId, intervalTime) {
    const sliderWrapper = document.querySelector(`#${sliderId} .slider-wrapper`);
    const slides = document.querySelectorAll(`#${sliderId} .slide`);
    if (!sliderWrapper || slides.length === 0) return;

    let currentIndex = 0;
    setInterval(() => {
        currentIndex++;
        if (currentIndex >= slides.length) currentIndex = 0;
        sliderWrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
    }, intervalTime);
}

startAutoSlide('promo-slider', 3500); 
startAutoSlide('catalogue-slider', 4500); 

// ==========================================
// 3. HOME TAB (Newest/Discount)
// ==========================================
function showHomeTabs(tabId) {
    document.querySelectorAll('.product-grid').forEach(grid => grid.style.display = 'none');
    document.querySelectorAll('.recom-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    
    const targetGrid = document.getElementById(tabId);
    if(targetGrid) targetGrid.style.display = 'grid';

    if(tabId === 'newest') {
        document.querySelectorAll('.recom-tabs .tab-btn')[0].classList.add('active');
    } else {
        document.querySelectorAll('.recom-tabs .tab-btn')[1].classList.add('active');
    }
}

// ==========================================
// 4. FETCH DATA & DISPLAY
// ==========================================
async function fetchProductData(mainCategory) {
    const displayArea = document.getElementById('api-product-display');
    displayArea.innerHTML = '<p style="text-align: center; width: 100%;">Memuat koleksi Coupstree...</p>';

    try {
        const response = await fetch('data.json');
        const allProducts = await response.json();

        let filteredProducts = [];

        if (mainCategory === 'discount') {
            // Filter berdasarkan ID produk yang sedang diskon
            const discountIds = [36, 141, 135]; 
            filteredProducts = allProducts.filter(p => discountIds.includes(p.id));
        } else {
            let allowedCategories = [];
            if (mainCategory === 'base') {
                allowedCategories = ['cushion', 'powder', 'blush on']; 
            } else if (mainCategory === 'eye') {
                allowedCategories = ['eyeliner', 'eyeshadow', 'mascara', 'eyebrow'];
            } else if (mainCategory === 'lip') {
                allowedCategories = ['lipstick', 'liptint', 'lipgloss', 'lipliner'];
            } else if (mainCategory === 'others') {
                allowedCategories = ['highlighter', 'contour', 'eyelashes', 'softlens'];
            }
            filteredProducts = allProducts.filter(p => allowedCategories.includes(p.category));
        }

        displayArea.innerHTML = ''; 

        if (filteredProducts.length === 0) {
            displayArea.innerHTML = '<p style="text-align: center; width: 100%;">Produk belum tersedia.</p>';
            return;
        }

        filteredProducts.forEach(prod => {
            let finalPriceHTML = `<span>${prod.price}</span>`;

            if (mainCategory === 'discount') {
                const numericPrice = parseInt(prod.price.replace(/[^0-9]/g, ""));
                const discountedPrice = numericPrice * 0.65;
                finalPriceHTML = `
                    <span style="color: #501216; font-weight: bold; font-size: 1.1rem;">Rp ${discountedPrice.toLocaleString('id-ID')}</span>
                    <span style="text-decoration: line-through; color: #888; font-size: 0.85rem; margin-left: 8px;">${prod.price}</span>
                `;
            }

            const card = document.createElement('div');
            card.className = 'product-box'; 
            card.innerHTML = `
                <img src="${prod.image}" alt="${prod.name}" class="box-img" onerror="this.src='https://via.placeholder.com/300'">
                <div class="box-info">
                    <p class="box-title" style="font-size: 0.95rem;">${prod.brand} - ${prod.name}</p>
                    <p class="box-price">${finalPriceHTML}</p>
                    <button class="add-cart-btn" onclick="addToCart('${prod.name}', '${prod.price}', '${prod.image}')">
            Add to Cart
        </button>
    </div>
            `;
            displayArea.appendChild(card);
        });

    } catch (error) {
        console.error("Error:", error);
        displayArea.innerHTML = '<p style="text-align: center; color: red;">Gagal memuat data produk.</p>';
    }
}


// ==========================================
// 5. FIND URS (Quiz Logic - Advanced Filtering)
// ==========================================
let quizData = { skintone: '', undertone: '', style: '' };

function nextQuizStep(nextStepId, key, value) {
    quizData[key] = value;

    document.querySelectorAll('.quiz-step').forEach(step => {
        step.classList.remove('active-step');
        step.style.display = 'none';
    });

    const next = document.getElementById(nextStepId);
    if (next) {
        next.classList.add('active-step');
        next.style.display = 'block';
    }
}

async function finishQuiz(styleValue) {
    quizData.style = styleValue;

    document.querySelectorAll('.quiz-step').forEach(step => {
        step.classList.remove('active-step');
        step.style.display = 'none';
    });

    const resultSection = document.getElementById('quiz-result');
    if (resultSection) {
        resultSection.classList.add('active-step');
        resultSection.style.display = 'block';
    }
    
    const output = document.getElementById('recommendation-output');
    output.innerHTML = '<p>Menganalisis kecocokan warna untuk auramu...</p>';

    try {
        const response = await fetch('data.json');
        const allProducts = await response.json();
        let matchedProducts = [];

        // --- 1. LOGIKA CUSHION (Berdasarkan Skintone) ---
        let baseKeyword = "";
        if (quizData.skintone === 'Light') baseKeyword = "Ivory";
        else if (quizData.skintone === 'Medium') baseKeyword = "Beige";
        else if (quizData.skintone === 'Dark') baseKeyword = "Tan";

        const cushion = allProducts.find(p => 
            p.category === 'cushion' && p.name.includes(baseKeyword)
        );
        if (cushion) matchedProducts.push(cushion);

        // --- 2. LOGIKA WARNA DEKORATIF (Lipstick/Blush) ---
        let colorKeywords = [];
        
        // KATEGORI A: Light + Cool + (Douyin/Korean/Natural) -> Warna Tipis & Cerah
        if (quizData.skintone === 'Light' && quizData.undertone === 'Cool') {
            colorKeywords = ["Pink", "Lilac", "Soft", "Barely", "Sakura", "Mellow"];
        } 
        // KATEGORI B: Medium + Neutral + (Muted/Toasty/etc) -> Warna Standard/Natural
        else if (quizData.skintone === 'Medium') {
            colorKeywords = ["Peach", "Mauve", "Rose", "Natural", "Nude Beige", "Classic Beige"];
        }
        // KATEGORI C: Dark + Warm + (Gothic/Glam/etc) -> Warna Bold & Deep
        else if (quizData.skintone === 'Dark') {
            colorKeywords = ["Red", "Bold", "Deep", "Dark", "Cocoa", "Mocha", "Chocolat", "Berry"];
        }
        else {
            colorKeywords = ["Natural", "Warm"];
        }

        // Cari Lipstick & Blush yang mengandung salah satu keyword di atas
        const lipstick = allProducts.find(p => 
            p.category === 'lipstick' && colorKeywords.some(key => p.name.includes(key))
        );
        const blush = allProducts.find(p => 
            p.category === 'blush on' && colorKeywords.some(key => p.name.includes(key))
        );

        if (blush) matchedProducts.push(blush);
        if (lipstick) matchedProducts.push(lipstick);

        // --- 3. RENDER KE HTML ---
        let htmlContent = `
            <h3 style="margin-bottom:10px;">Your Perfect Match!</h3>
            <p style="margin-bottom:15px; font-size: 0.9rem;">Analisis: <b>${quizData.skintone} Skintone</b>, <b>${quizData.undertone} Undertone</b> dengan style <b>${styleValue}</b></p>
            <div class="quiz-recommendation-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
        `;

        matchedProducts.forEach(prod => {
            htmlContent += `
                <div class="rec-item" style="text-align: center; border: 1px solid #eee; padding: 10px; border-radius: 12px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <img src="${prod.image}" style="width: 100%; border-radius: 8px; height: 120px; object-fit: cover;" onerror="this.src='https://via.placeholder.com/150'">
                    <p style="font-size: 0.75rem; font-weight: bold; margin-top:8px; color: #501216; height: 35px; overflow: hidden;">${prod.name}</p>
                    <p style="font-size: 0.85rem; color: #7A0605; font-weight: bold;">${prod.price}</p>
                <button class="add-cart-btn" style="margin-top: 10px;" onclick="addToCart('${prod.name}', '${prod.price}', '${prod.image}')">
                    Add to Cart
                </button>
            </div>
            `;
        });

        htmlContent += `</div>`;
        output.innerHTML = htmlContent;

    } catch (error) {
        console.error("Quiz Error:", error);
        output.innerHTML = "<p>Gagal memuat rekomendasi produk.</p>";
    }
}

function resetQuiz() {
    quizData = { skintone: '', undertone: '', style: '' };
    document.querySelectorAll('.quiz-step').forEach(step => {
        step.classList.remove('active-step');
        step.style.display = 'none';
    });
    const firstStep = document.getElementById('quiz-step-1');
    if (firstStep) {
        firstStep.classList.add('active-step');
        firstStep.style.display = 'block';
    }
}

// ==========================================
// 6. SMART CART LOGIC (With Quantity & Badge)
// ==========================================
let cart = JSON.parse(localStorage.getItem('coupstree_cart')) || [];

function addToCart(name, price, image) {
    // Cari apakah produk sudah ada di keranjang
    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {
        // Jika ada, tambah kuantitasnya
        existingItem.quantity += 1;
    } else {
        // Jika belum ada, masukkan sebagai item baru dengan quantity 1
        cart.push({ name, price, image, quantity: 1 });
    }

    localStorage.setItem('coupstree_cart', JSON.stringify(cart));
    updateCartDisplay();
    alert(`${name} ditambahkan ke keranjang!`);
}

function updateCartDisplay() {
    const cartList = document.getElementById('cart-items-list');
    const totalPriceElement = document.getElementById('cart-total-price');
    const cartCountElement = document.getElementById('cart-count');
    
    if (!cartList) return;

    let totalAmount = 0;
    let totalItems = 0;

    if (cart.length === 0) {
        cartList.innerHTML = '<p style="text-align:center; padding: 20px;">Keranjangmu masih kosong.</p>';
    } else {
        let htmlItems = '';
        cart.forEach((item, index) => {
            const numericPrice = parseInt(item.price.replace(/[^0-9]/g, ""));
            const subtotal = numericPrice * item.quantity;
            totalAmount += subtotal;
            totalItems += item.quantity;

            htmlItems += `
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <img src="${item.image}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;">
                    <div style="flex: 1; text-align: left;">
                        <p style="font-weight: bold; margin: 0; font-size: 0.9rem;">${item.name}</p>
                        <p style="color: var(--brand-dark); margin: 0; font-size: 0.85rem;">${item.price} x ${item.quantity}</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                         <p style="font-weight: bold; font-size: 0.9rem;">Rp ${(subtotal).toLocaleString('id-ID')}</p>
                         <button onclick="removeFromCart(${index})" style="color: red; border: none; background: none; cursor: pointer; font-weight: bold; font-size: 1.2rem;">×</button>
                    </div>
                </div>
            `;
        });
        cartList.innerHTML = htmlItems;
    }

    if (totalPriceElement) totalPriceElement.innerText = `Rp ${totalAmount.toLocaleString('id-ID')}`;
    
    if (cartCountElement) {
        cartCountElement.innerText = totalItems;
        cartCountElement.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
} // Penutup updateCartDisplay yang benar

// Fungsi ini HARUS berada di luar, sejajar dengan fungsi lainnya
function removeFromCart(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
    } else {
        cart.splice(index, 1);
    }
    
    localStorage.setItem('coupstree_cart', JSON.stringify(cart));
    updateCartDisplay();
}

// Jalankan fungsi saat halaman pertama kali dibuka
updateCartDisplay();