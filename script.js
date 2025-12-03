// State
let products = [];
let sales = [];
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
        sales = JSON.parse(storedSales);
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
        const btn = document.createElement('button');
        btn.className = 'product-card';
        btn.onclick = () => addToCart(product);
        btn.innerHTML = `
            <div class="icon">${product.icon || '✨'}</div>
            <div class="name">${product.name}</div>
            <div class="price">NT$ ${product.price}</div>
        `;
        ProductsGrid.appendChild(btn);
    });
}

function addToCart(product) {
    const sale = {
        ...product,
        timestamp: new Date().toISOString()
    };
    sales.push(sale);
    saveSales();
    updateTotalDisplay();
    console.log(`Added ${product.name} - $${product.price}`);
}

function updateTotalDisplay() {
    const total = sales.reduce((sum, sale) => sum + sale.price, 0);
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

    const summary = {};
    sales.forEach(sale => {
        if (!summary[sale.name]) {
            summary[sale.name] = { count: 0, total: 0 };
        }
        summary[sale.name].count++;
        summary[sale.name].total += sale.price;
    });

    for (const [name, data] of Object.entries(summary)) {
        const row = document.createElement('div');
        row.className = 'summary-row';
        row.innerHTML = `
            <span class="summary-name">${name} <span class="summary-count">x${data.count}</span></span>
            <span class="summary-price">NT$ ${data.total.toLocaleString()}</span>
        `;
        summaryList.appendChild(row);
    }

    const total = sales.reduce((sum, sale) => sum + sale.price, 0);
    summaryGrandTotal.innerText = `NT$ ${total.toLocaleString()}`;
}

function endDay() {
    toggleModal(confirmModal);
}

function processEndDay() {
    const total = sales.reduce((sum, sale) => sum + sale.price, 0);
    const summary = {};
    sales.forEach(sale => {
        if (!summary[sale.name]) {
            summary[sale.name] = { count: 0, total: 0 };
        }
        summary[sale.name].count++;
        summary[sale.name].total += sale.price;
    });

    const historyEntry = {
        date: new Date().toISOString(),
        total: total,
        items: summary
    };

    history.push(historyEntry);
    saveHistory();

    sales = [];
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