// State
let products = [];
let productIcons = {}; // New state for icons
let sales = {};
let history = [];

// DOM Elements
const ProductsGrid = document.getElementById("product-grid");

const summaryList = document.getElementById("summary-list");
const summaryGrandTotal = document.getElementById("summary-grand-total");

const summary_Modal = document.getElementById("summary_Modal");
const addItem_Modal = document.getElementById("additem_Modal");
const confirm_Modal = document.getElementById("confirm_Modal");

const additem_cancel = addItem_Modal.querySelector(".modal__button--cancel");
const additem_validate = addItem_Modal.querySelector(
  ".modal__button--validate",
);
const summary_cancel = summary_Modal.querySelector(".modal__button--cancel");
const summary_validate = summary_Modal.querySelector(
  ".modal__button--validate",
);
const confirm_cancel = confirm_Modal.querySelector(".modal__button--cancel");
const confirm_validate = confirm_Modal.querySelector(
  ".modal__button--validate",
);
const export_json = document.querySelector('.export__button[data-type="json"]');
const export_csv = document.querySelector('.export__button[data-type="csv"]');

// Event Listeners
additem_cancel.addEventListener("click", () => toggleModal(addItem_Modal));
additem_validate.addEventListener("click", addNewItem);

summary_cancel.addEventListener("click", () => toggleModal(summary_Modal));
summary_validate.addEventListener("click", endDay);

confirm_cancel.addEventListener("click", () => toggleModal(confirm_Modal));
confirm_validate.addEventListener("click", processEndDay);

export_json.addEventListener("click", () => downloadFile("json"));
export_csv.addEventListener("click", () => downloadFile("csv"));

// Initialization
window.addEventListener("DOMContentLoaded", () => {
  loadData();
  renderProducts();
});

function loadData() {
  const storedProducts = localStorage.getItem("kst_products");
  if (storedProducts) {
    products = JSON.parse(storedProducts);
  } else {
    products = [];
  }

  const storedIcons = localStorage.getItem("kst_product_icons");
  if (storedIcons) {
      try {
          productIcons = JSON.parse(storedIcons);
      } catch (e) {
          console.error("Error parsing icons:", e);
          productIcons = {};
      }
  }

  const storedSales = localStorage.getItem("kst_sales");
  if (storedSales) {
    try {
      const parsed = JSON.parse(storedSales);
      if (Array.isArray(parsed)) {
        sales = {};
      } else {
        sales = parsed;
      }
    } catch (e) {
      console.error("Error parsing sales data:", e);
      sales = {};
    }
  }

  const storedHistory = localStorage.getItem("kst_history");
  if (storedHistory) {
    history = JSON.parse(storedHistory);
  }
}

function saveProducts() {
  localStorage.setItem("kst_products", JSON.stringify(products));
}

function saveIcons() {
    localStorage.setItem("kst_product_icons", JSON.stringify(productIcons));
}

function saveSales() {
  localStorage.setItem("kst_sales", JSON.stringify(sales));
}

function saveHistory() {
  localStorage.setItem("kst_history", JSON.stringify(history));
}

function renderProducts() {
  ProductsGrid.innerHTML = ""; // Clear existing

  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product";

    let iconContent;
    // Check separate storage first AND ensure it has content
    if (productIcons[product.name]) {
        iconContent = `<img src="${productIcons[product.name]}" alt="${product.name}" class="product__icon-img" style="max-width: 100%; max-height: 100%; object-fit: contain;" onerror="this.outerHTML='✨'" />`;
    } else {
        // Fallback to emoji in product definition or default
        // If product.icon is '✨' (which we set for SVGs), and we don't have an SVG in storage, we should still show '✨'.
        // If product.icon has an old emoji, use it.
        iconContent = product.icon || "✨";
    }

    card.innerHTML = `
            <div class="product__info">
                <div class="product__icon">${iconContent}</div>
                <div class="product__name">${product.name}</div>
                <div class="product__price">$ ${product.price}</div>
            </div>
            <div class="product__actions"></div>
        `;

    const incrementBtn = document.createElement("button");
    incrementBtn.className = "product__button product__button--increment";
    incrementBtn.dataset.name = product.name;
    incrementBtn.dataset.price = product.price;
    // Removed icon dataset as it's not strictly needed for logic and might be large
    incrementBtn.textContent = "+";

    const counterBadge = document.createElement("div");
    counterBadge.className = "product__counter";
    counterBadge.dataset.name = product.name;
    const count = sales[product.name] || 0;
    counterBadge.textContent = count;
    if (count === 0) counterBadge.classList.add("product__counter--hidden");

    const decrementBtn = document.createElement("button");
    decrementBtn.className = "product__button product__button--decrement";
    decrementBtn.dataset.name = product.name;
    decrementBtn.textContent = "−";

    incrementBtn.addEventListener("click", () => addToCart(product));
    decrementBtn.addEventListener("click", () => removeSale(product.name));

    cardActions = card.querySelector(".product__actions");
    cardActions.appendChild(incrementBtn);
    cardActions.appendChild(counterBadge);
    cardActions.appendChild(decrementBtn);

    ProductsGrid.appendChild(card);
  });
}

function addToCart(product) {
  const buttons = document.querySelectorAll(
    ".product__button--increment, .product__button--decrement",
  );
  buttons.forEach((btn) => (btn.style.pointerEvents = "none"));

  if (!sales[product.name]) {
    sales[product.name] = 0;
  }
  sales[product.name]++;

  saveSales();
  updateCounterDisplays();

  setTimeout(() => {
    buttons.forEach((btn) => (btn.style.pointerEvents = "auto"));
  }, 50);
}

function removeSale(itemName) {
  const buttons = document.querySelectorAll(
    ".product__button--increment, .product__button--decrement",
  );
  buttons.forEach((btn) => (btn.style.pointerEvents = "none"));

  if (sales[itemName]) {
    sales[itemName]--;
    if (sales[itemName] <= 0) {
      delete sales[itemName];
    }
    saveSales();
    updateCounterDisplays();
    console.log(`Removed ${itemName}`);
  }

  setTimeout(() => {
    buttons.forEach((btn) => (btn.style.pointerEvents = "auto"));
  }, 50);
}

function getProductPrice(name) {
  const product = products.find((p) => p.name === name);
  return product ? product.price : 0;
}

function updateCounterDisplays() {
  const counters = document.querySelectorAll(".product__counter");
  counters.forEach((counter) => {
    const name = counter.dataset.name;
    const count = sales[name] || 0;
    counter.textContent = count;
    if (count === 0) {
      counter.classList.add("product__counter--hidden");
    } else {
      counter.classList.remove("product__counter--hidden");
    }
  });
}

function toggleModal(element) {
  element.classList.toggle("hidden");
}

function showSummary() {
  renderSummary();
  toggleModal(summary_Modal);
}

function renderSummary() {
  summaryList.innerHTML = "";
  let total = 0;

  for (const [name, count] of Object.entries(sales)) {
    const price = getProductPrice(name);
    const itemTotal = price * count;
    total += itemTotal;

    const row = document.createElement("div");
    row.className = "summary__item";
    row.innerHTML = `
            <span class="summary__name">${name} <span class="summary__count">x${count}</span></span>
            <span class="summary__price">NT$ ${itemTotal.toLocaleString()}</span>
        `;
    summaryList.appendChild(row);
  }

  summaryGrandTotal.innerText = `NT$ ${total.toLocaleString()}`;
}

function endDay() {
  toggleModal(confirm_Modal);
}

function processEndDay() {
  let total = 0;
  const summary = {};

  for (const [name, count] of Object.entries(sales)) {
    const price = getProductPrice(name);
    const itemTotal = price * count;
    total += itemTotal;

    summary[name] = {
      count: count,
      total: itemTotal,
    };
  }

  const now = new Date();
  // Store date as 'YYYY-MM-DD' (local system date)
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const historyEntry = {
    date: dateStr,
    total: total,
    items: summary,
  };

  history.push(historyEntry);
  saveHistory();

  sales = {}; // Reset to empty object
  saveSales();
  updateCounterDisplays(); // Refresh UI to show zero counts

  toggleModal(confirm_Modal);
  toggleModal(summary_Modal);
}

function addNewItem() {
  const name = document.getElementById("new-item-name").value;
  const price = parseInt(document.getElementById("new-item-price").value);
  const iconInput = document.getElementById("selected-icon");
  const fileInput = document.getElementById("new-item-icon-file");

  if (name && price) {
    const processItem = (iconValue, isSvg) => {
      // If scalar emoji, save to product.icon. If SVG, save to icons storage.
      const newProduct = { name, price, icon: isSvg ? "✨" : iconValue }; // Default emoji if SVG used
      
      products.push(newProduct);
      
      if (isSvg) {
          productIcons[name] = iconValue;
          saveIcons();
      }
      
      saveProducts();
      renderProducts();
      toggleModal(addItem_Modal);

      // Reset fields
      document.getElementById("new-item-name").value = "";
      document.getElementById("new-item-price").value = "";
      document.getElementById("selected-icon").value = "✨";
      if (fileInput) fileInput.value = "";
      const preview = document.getElementById("new-item-icon-preview");
      if (preview) preview.innerHTML = "";
    };

    if (fileInput && fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        processItem(e.target.result, true);
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      processItem(iconInput.value || "✨", false);
    }
  }
}

function downloadFile(fileType) {
  if (history.length === 0) {
    console.info("No history to export. End a day first to create history.");
    return;
  }

  let dataBlob;

  if (fileType === "json") {
    dataBlob = new Blob([JSON.stringify(history, null, 2)], {
      type: "application/json",
    });
  } else if (fileType === "csv") {
    let csv = "Date,Item,Quantity,Subtotal,Daily Total\n";

    history.forEach((day) => {
      csv += `${day.date}, , , , ${day.total}\n`;
      for (const [itemName, itemData] of Object.entries(day.items)) {
        csv += `, ${itemName},${itemData.count},${itemData.total},\n`;
      }

      csv += "\n";
    });

    dataBlob = new Blob([csv], { type: "text/csv" });
  } else {
    console.error("Invalid file type");
    return;
  }

  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sales-history-${new Date().toISOString().split("T")[0]}.${fileType}`;
  link.click();
  URL.revokeObjectURL(url);
}
