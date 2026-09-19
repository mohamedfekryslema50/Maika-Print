// --- إعدادات Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDMCNDytrgWwHc5n4eINVEBJjYCX00QCY",
  authDomain: "maika-print-39bbb.firebaseapp.com",
  projectId: "maika-print-39bbb",
  storageBucket: "maika-print-39bbb.firebasestorage.app",
  messagingSenderId: "555824333502",
  appId: "1:555824333502:web:69a13f4161288b2f2e54ef",
  measurementId: "G-6J7C5PBFMN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 1. إدارة تسجيل الدخول والأدمن ---
window.openAdminModal = function() {
  document.getElementById("adminModal").style.display = "flex";
  document.getElementById("adminPassInput").value = "";
  document.getElementById("errorMsg").innerText = "";
}

window.closeAdminModal = function() {
  document.getElementById("adminModal").style.display = "none";
}

window.submitAdminPass = function() {
  const input = document.getElementById("adminPassInput").value.trim();
  if (input === "28380") {
    localStorage.setItem("adminAuth", "true");
    window.location.href = "admin.html";
  } else {
    document.getElementById("errorMsg").innerText = "كلمة السر غير صحيحة!";
  }
}

window.checkAdminAuth = function() {
  if (localStorage.getItem("adminAuth") !== "true") {
    alert("يرجى إدخال كلمة السر أولاً!");
    window.location.href = "index.html";
  }
}

window.logoutAdmin = function() {
  localStorage.removeItem("adminAuth");
  window.location.href = "index.html";
}


// --- 2. إدارة الأقسام (من فايربيس) ---

window.getCategories = async function() {
  try {
    const querySnapshot = await getDocs(collection(db, "categories"));
    let cats = [];
    querySnapshot.forEach((docSnap) => {
      cats.push({ id: docSnap.id, name: docSnap.data().name });
    });
    if (cats.length === 0) {
      return ["طباعة ديجيتال", "ملابس وهدايا", "بوسترات وكروت"];
    }
    return cats.map(c => c.name);
  } catch (e) {
    return ["طباعة ديجيتال", "ملابس وهدايا", "بوسترات وكروت"];
  }
}

window.renderPortalTags = async function() {
  const tagsContainer = document.getElementById("portalTags");
  if (!tagsContainer) return;
  const categories = await getCategories();
  tagsContainer.innerHTML = "";
  categories.forEach(cat => {
    tagsContainer.innerHTML += `<span>${cat}</span>`;
  });
}

window.addCategory = async function() {
  const categoryInput = document.getElementById("newCategoryName");
  const categoryName = categoryInput.value.trim();

  if (!categoryName) {
    alert("برجاء كتابة اسم القسم أولاً!");
    return;
  }

  try {
    await addDoc(collection(db, "categories"), { name: categoryName });
    categoryInput.value = "";
    renderCategories();
    loadCategoriesDropdown();
    alert("تمت إضافة القسم بنجاح على السحابة!");
  } catch (e) {
    alert("حدث خطأ أثناء الإضافة: " + e.message);
  }
}

window.renderCategories = async function() {
  const list = document.getElementById("categoriesList");
  if (!list) return;

  try {
    const querySnapshot = await getDocs(collection(db, "categories"));
    list.innerHTML = "";
    querySnapshot.forEach((docSnap) => {
      const cat = docSnap.data().name;
      list.innerHTML += `
        <li>
          <span>${cat}</span>
          <button onclick="deleteCategory('${docSnap.id}')" class="delete-btn">حذف القسم</button>
        </li>
      `;
    });
  } catch (e) {
    list.innerHTML = "<p>فشل تحميل الأقسام</p>";
  }
}

window.deleteCategory = async function(docId) {
  if (confirm("هل أنت تأكد من حذف هذا القسم؟")) {
    try {
      await deleteDoc(doc(db, "categories", docId));
      renderCategories();
      loadCategoriesDropdown();
    } catch (e) {
      alert("خطأ أثناء الحذف");
    }
  }
}

window.loadCategoriesDropdown = async function() {
  const select = document.getElementById("prodCategorySelect");
  if (!select) return;
  const categories = await getCategories();
  select.innerHTML = '<option value="">اختر القسم...</option>';
  categories.forEach(cat => {
    select.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
}


// --- 3. إدارة المنتجات (من فايربيس) ---

window.saveProduct = async function(event) {
  event.preventDefault();
  const category = document.getElementById("prodCategorySelect").value;
  const name = document.getElementById("prodName").value;
  const desc = document.getElementById("prodDesc").value;
  const price = document.getElementById("prodPrice").value;
  const fileInput = document.getElementById("prodImageFile");
  const file = fileInput.files[0];

  if (!category) {
    alert("يرجى اختيار القسم أولاً!");
    return;
  }

  if (file) {
    const reader = new FileReader();
    reader.onload = async function (e) {
      try {
        const img = new Image();
        img.src = e.target.result;
        img.onload = async function() {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);

          await addDoc(collection(db, "products"), {
            category,
            name,
            desc,
            price: Number(price),
            image: compressedDataUrl,
            createdAt: Date.now()
          });

          alert("تمت إضافة المنتج بنجاح على السحابة!");
          document.getElementById("addProductForm").reset();
          renderAdminProducts();
        }
      } catch (err) {
        alert("حدث خطأ أثناء رفع الصورة: " + err.message);
      }
    };
    reader.readAsDataURL(file);
  }
}

window.renderAdminProducts = async function() {
  const container = document.getElementById("adminProductsList");
  if (!container) return;

  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    if (querySnapshot.empty) {
      container.innerHTML = "<p style='color: #a88b7d; font-size: 13px;'>لا توجد منتجات مضافة حالياً.</p>";
      return;
    }

    container.innerHTML = "";
    querySnapshot.forEach((docSnap) => {
      const p = docSnap.data();
      const id = docSnap.id;
      container.innerHTML += `
        <div class="prod-row">
          <img src="${p.image}" alt="${p.name}">
          <div class="prod-info">
            <strong>${p.name} (${p.category})</strong>
            <input type="text" id="desc-${id}" value="${p.desc}" placeholder="الوصف">
            <input type="number" id="price-${id}" value="${p.price}" placeholder="السعر">
          </div>
          <button onclick="updateProduct('${id}')" class="action-btn">تحديث</button>
          <button onclick="deleteProduct('${id}')" class="delete-btn">حذف</button>
        </div>
      `;
    });
  } catch (e) {
    container.innerHTML = "<p>خطأ في جلب المنتجات</p>";
  }
}

window.updateProduct = async function(id) {
  try {
    const newDesc = document.getElementById(`desc-${id}`).value;
    const newPrice = Number(document.getElementById(`price-${id}`).value);
    
    const prodRef = doc(db, "products", id);
    await updateDoc(prodRef, {
      desc: newDesc,
      price: newPrice
    });

    alert("تم تعديل المنتج بنجاح!");
    renderAdminProducts();
  } catch (e) {
    alert("خطأ أثناء التحديث");
  }
}

window.deleteProduct = async function(id) {
  if (confirm("هل أنت تأكد من حذف هذا المنتج؟")) {
    try {
      await deleteDoc(doc(db, "products", id));
      renderAdminProducts();
    } catch (e) {
      alert("خطأ أثناء الحذف");
    }
  }
}


// --- 4. المتجر والسلة ---

let currentActiveCategory = "";

window.displayStoreTabs = async function() {
  const tabsContainer = document.getElementById("categoriesTabs");
  if (!tabsContainer) return;

  const categories = await getCategories();
  if (categories.length === 0) return;

  if (!currentActiveCategory || !categories.includes(currentActiveCategory)) {
    currentActiveCategory = categories[0];
  }

  tabsContainer.innerHTML = "";
  categories.forEach(cat => {
    const isActive = cat === currentActiveCategory ? "active" : "";
    tabsContainer.innerHTML += `
      <button class="tab-btn ${isActive}" onclick="selectCategory('${cat}')">
        ${cat}
      </button>
    `;
  });

  renderProductsForCategory(currentActiveCategory);
}

window.selectCategory = function(categoryName) {
  currentActiveCategory = categoryName;
  displayStoreTabs();
}

window.renderProductsForCategory = async function(categoryName) {
  const displayArea = document.getElementById("productsDisplayArea");
  if (!displayArea) return;

  try {
    const querySnapshot = await getDocs(collection(db, "products"));
    let products = [];
    querySnapshot.forEach(docSnap => {
      products.push({ id: docSnap.id, ...docSnap.data() });
    });

    const filteredProducts = products.filter(p => p.category === categoryName);

    if (filteredProducts.length === 0) {
      displayArea.innerHTML = `<div class="no-products-msg">لا توجد منتجات في قسم (${categoryName}) حالياً.</div>`;
      return;
    }

    displayArea.innerHTML = "";
    filteredProducts.forEach(p => {
      displayArea.innerHTML += `
        <div class="product-card" data-name="${p.name}">
          <img src="${p.image}" alt="${p.name}">
          <h3>${p.name}</h3>
          <p>${p.desc}</p>
          <div style="font-weight: bold; color: #d4a373; margin-bottom: 10px;">${p.price} EGP</div>
          
          <div style="display: flex; gap: 8px; justify-content: center; align-items: center; margin-bottom: 12px;">
            <label style="font-size: 12px; color: #a88b7d;">الكمية:</label>
            <input type="number" id="qty-${p.id}" value="1" min="1" style="width: 50px; text-align: center; padding: 4px; border-radius: 6px; border: 1px solid #5a3d35; background: #1a100c; color: #fff;">
          </div>

          <button class="action-btn" style="width: 100%;" onclick="addToCartFirebase('${p.id}', '${p.name}', ${p.price}, '${p.category}')">
            🛒 إضافة للسلة
          </button>
        </div>
      `;
    });
  } catch (e) {
    displayArea.innerHTML = "<div class='no-products-msg'>خطأ في جلب المنتجات من السحابة.</div>";
  }
}

window.filterProducts = function() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const cards = document.querySelectorAll(".product-card");

  cards.forEach(card => {
    const name = card.getAttribute("data-name").toLowerCase();
    card.style.display = name.includes(input) ? "block" : "none";
  });
}

window.getCart = function() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

window.saveCart = function(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartUI();
}

window.addToCartFirebase = function(productId, name, price, category) {
  const qtyInput = document.getElementById(`qty-${productId}`);
  const quantity = parseInt(qtyInput ? qtyInput.value : 1) || 1;

  let cart = getCart();
  const existingItemIndex = cart.findIndex(item => item.id === productId);

  if (existingItemIndex !== -1) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({ id: productId, name, price, category, quantity });
  }

  saveCart(cart);
  alert(`تمت إضافة (${quantity}) من "${name}" إلى السلة!`);
}

const promoCodes = {
  "MAIKA10": 0.10,
  "WELCOME20": 0.20
};

let activeDiscount = 0;

window.applyPromoCode = function() {
  const codeInput = document.getElementById("promoCodeInput");
  if (!codeInput) return;

  const code = codeInput.value.trim().toUpperCase();

  if (promoCodes[code]) {
    activeDiscount = promoCodes[code];
    alert(`تم تطبيق خصم بقيمة ${(activeDiscount * 100)}% بنجاح!`);
    updateCartUI();
  } else {
    alert("كود الخصم غير صحيح أو منتهي الصلاحية!");
  }
}

window.updateCartUI = function() {
  const cart = getCart();
  const cartCountEl = document.getElementById("cartCount");
  const cartItemsListEl = document.getElementById("cartItemsList");
  const cartTotalPriceEl = document.getElementById("cartTotalPrice");

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  let totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (activeDiscount > 0) {
    totalPrice = totalPrice - (totalPrice * activeDiscount);
  }

  if (cartCountEl) cartCountEl.innerText = totalCount;
  if (cartTotalPriceEl) cartTotalPriceEl.innerText = totalPrice.toFixed(2);

  if (!cartItemsListEl) return;

  if (cart.length === 0) {
    cartItemsListEl.innerHTML = "<p style='color: #a88b7d; font-size: 13px;'>السلة فارغة حالياً.</p>";
    return;
  }

  cartItemsListEl.innerHTML = "";
  cart.forEach((item, index) => {
    cartItemsListEl.innerHTML += `
      <div style="display: flex; justify-content: space-between; align-items: center; background: #1a100c; padding: 10px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #3d2822;">
        <div style="text-align: right;">
          <strong style="color: #fff; font-size: 13px;">${item.name}</strong>
          <div style="font-size: 11px; color: #a88b7d;">العدد: ${item.quantity} × ${item.price} = ${item.quantity * item.price} EGP</div>
        </div>
        <button onclick="removeFromCart(${index})" class="delete-btn" style="padding: 4px 8px; font-size: 11px;">حذف</button>
      </div>
    `;
  });
}

window.removeFromCart = function(index) {
  let cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

window.toggleCartModal = function() {
  const modal = document.getElementById("cartModal");
  if (!modal) return;
  modal.style.display = modal.style.display === "flex" ? "none" : "flex";
}

window.sendCartToWhatsApp = function() {
  const cart = getCart();
  if (cart.length === 0) {
    alert("السلة فارغة!");
    return;
  }

  const phoneNumber = "201025386551";
  let message = "مرحباً MAIKA PRINT، أود طلب الطلبية التالية:\n\n";
  let total = 0;

  cart.forEach((item, i) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    message += `${i + 1}. *${item.name}* (العدد: ${item.quantity}) - السعر: ${itemTotal} EGP\n`;
  });

  if (activeDiscount > 0) {
    total = total - (total * activeDiscount);
    message += `\n*تم تطبيق خصم بنسبة (${activeDiscount * 100)}%*`;
  }

  message += `\n*الإجمالي النهائي: ${total.toFixed(2)} EGP*`;

  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

// --- تشغيل الدوال تلقائياً عند فتح الصفحة ---
window.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  loadCategoriesDropdown();
  renderAdminProducts();
  displayStoreTabs();
  updateCartUI();
});
