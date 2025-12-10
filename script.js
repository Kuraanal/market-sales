// State
let products = [];
let sales = {}; // Changed to object: { "Item Name": count }
let history = [];

// DOM Elements
const ProductsGrid = document.getElementById('product-grid');
const totalEl = document.getElementById('total-sales');
const summaryList = document.getElementById('summary-list');
const summaryGrandTotal = document.getElementById('summary-grand-total');
const summaryModal = document.getElementById('summary-modal');
const addItemModal = document.getElementById('add-item-modal');
const confirmModal = document.getElementById('confirm-modal');

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderProducts();
    updateTotalDisplay();
});

function loadData() {
    const storedProducts = localStorage.getItem('pos_products');
    if (storedProducts) {
        products = JSON.parse(storedProducts);
    } else {
        products = [];
    }

    const storedSales = localStorage.getItem('pos_sales');
    if (storedSales) {
        try {
            const parsed = JSON.parse(storedSales);
            if (Array.isArray(parsed)) {
                sales = {};
            } else {
                sales = parsed;
            }
        } catch (e) {
            sales = {};
        }
    }

    const storedHistory = localStorage.getItem('pos_history');
    if (storedHistory) {
        history = JSON.parse(storedHistory);
    }
}

function saveProducts() {
    localStorage.setItem('pos_products', JSON.stringify(products));
}

function saveSales() {
    localStorage.setItem('pos_sales', JSON.stringify(sales));
}

function saveHistory() {
    localStorage.setItem('pos_history', JSON.stringify(history));
}

function renderProducts() {
    ProductsGrid.innerHTML = ''; // Clear existing

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-info">
                <div class="icon">${product.icon || '✨'}</div>
                <div class="name">${product.name}</div>
                <div class="price">$ ${product.price}</div>
            </div>
            <div class="product-actions">
                <button class="product__btn product__btn-increment" onclick="addToCart({name: '${product.name.replace(/'/g, "\\'")}', price: ${product.price}, icon: '${(product.icon || '✨').replace(/'/g, "\\'")}' })">+</button>
                <button class="product__btn product__btn-decrement" onclick="removeSale('${product.name.replace(/'/g, "\\'")}')">−</button>
            </div>
        `;
        ProductsGrid.appendChild(card);
    });
}

function addToCart(product) {
    const buttons = document.querySelectorAll('.product__btn-increment, .product__btn-decrement');
    buttons.forEach(btn => btn.style.pointerEvents = 'none');

    if (!sales[product.name]) {
        sales[product.name] = 0;
    }
    sales[product.name]++;

    saveSales();
    updateTotalDisplay();

    setTimeout(() => {
        buttons.forEach(btn => btn.style.pointerEvents = 'auto');
    }, 50);
}

function removeSale(itemName) {
    const buttons = document.querySelectorAll('.product__btn-increment, .product__btn-decrement');
    buttons.forEach(btn => btn.style.pointerEvents = 'none');

    if (sales[itemName]) {
        sales[itemName]--;
        if (sales[itemName] <= 0) {
            delete sales[itemName];
        }
        saveSales();
        updateTotalDisplay();
        console.log(`Removed ${itemName}`);
    }

    setTimeout(() => {
        buttons.forEach(btn => btn.style.pointerEvents = 'auto');
    }, 50);
}

function getProductPrice(name) {
    const product = products.find(p => p.name === name);
    return product ? product.price : 0;
}

function updateTotalDisplay() {
    let total = 0;
    for (const [name, count] of Object.entries(sales)) {
        total += getProductPrice(name) * count;
    }
    totalEl.innerText = total.toLocaleString();
}

function toggleModal(element) {
    element.classList.toggle('hidden');
}

function showSummary() {
    renderSummary();
    toggleModal(summaryModal);
}

function renderSummary() {
    summaryList.innerHTML = '';
    let total = 0;

    for (const [name, count] of Object.entries(sales)) {
        const price = getProductPrice(name);
        const itemTotal = price * count;
        total += itemTotal;

        const row = document.createElement('div');
        row.className = 'summary-row';
        row.innerHTML = `
            <span class="summary-name">${name} <span class="summary-count">x${count}</span></span>
            <span class="summary-price">NT$ ${itemTotal.toLocaleString()}</span>
        `;
        summaryList.appendChild(row);
    }

    summaryGrandTotal.innerText = `NT$ ${total.toLocaleString()}`;
}

function endDay() {
    toggleModal(confirmModal);
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
            total: itemTotal
        };
    }

    const historyEntry = {
        date: new Date().toISOString(),
        total: total,
        items: summary
    };

    history.push(historyEntry);
    saveHistory();

    sales = {}; // Reset to empty object
    saveSales();
    updateTotalDisplay();

    toggleModal(confirmModal);
    toggleModal(summaryModal);
}

function addNewItem() {
    const name = document.getElementById('new-item-name').value;
    const price = parseInt(document.getElementById('new-item-price').value);
    const icon = document.getElementById('selected-icon').value || '✨';

    if (name && price) {
        const newProduct = { name, price, icon };
        products.push(newProduct);
        saveProducts();
        renderProducts();

        toggleModal(addItemModal);
    }

    document.getElementById('new-item-name').value = '';
    document.getElementById('new-item-price').value = '';
    document.getElementById('selected-icon').value = '✨';
}

function downloadFile(fileType) {
    if (history.length === 0) {
        console.error('No history to export. End a day first to create history.');
        return;
    }

    let dataBlob;

    if (fileType === 'json') {
        const dataStr = JSON.stringify(history, null, 2);
        dataBlob = new Blob([dataStr], { type: 'application/json' });
    }
    else if (fileType === 'csv') {
        let csv = 'Date,Item,Quantity,Subtotal,Daily Total\n';

        history.forEach(day => {
            const date = new Date(day.date).toLocaleDateString();
            const items = day.items;

            csv += `${date}, , , , ${day.total}\n`;
            for (const [itemName, itemData] of Object.entries(items)) {
                csv += `, ${itemName},${itemData.count},${itemData.total},\n`;
            }

            csv += '\n';
        });

        dataBlob = new Blob([csv], { type: 'text/csv' });
    }
    else {
        console.error('Invalid file type');
        return;
    }

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-history-${new Date().toISOString().split('T')[0]}.${fileType}`;
    link.click();
    URL.revokeObjectURL(url);
}