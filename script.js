// State
let products = [];
let sales = [];
let history = [];

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderProducts();
    updateTotalDisplay();
});

function loadData() {
    // Load Products
    const storedProducts = localStorage.getItem('pos_products');
    if (storedProducts) {
        products = JSON.parse(storedProducts);
    } else {
        products = [];
    }

    // Load Sales
    const storedSales = localStorage.getItem('pos_sales');
    if (storedSales) {
        sales = JSON.parse(storedSales);
    }

    // Load History
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
    const grid = document.getElementById('product-grid');
    grid.innerHTML = ''; // Clear existing

    products.forEach(product => {
        const btn = document.createElement('button');
        btn.className = 'product-card';
        btn.onclick = () => addToCart(product);
        btn.innerHTML = `
            <div class="icon">${product.icon || '✨'}</div>
            <div class="name">${product.name}</div>
            <div class="price">NT$ ${product.price}</div>
        `;
        grid.appendChild(btn);
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
    const totalEl = document.getElementById('total-sales');
    totalEl.innerText = total.toLocaleString();
}

function toggleModal() {
    const modal = document.getElementById('add-item-modal');
    modal.classList.toggle('hidden');

    // Focus on item name input when opening modal
    if (!modal.classList.contains('hidden')) {
        setTimeout(() => {
            document.getElementById('new-item-name').focus();
        }, 100);
    }
}

function toggleSummary() {
    const modal = document.getElementById('summary-modal');
    modal.classList.toggle('hidden');
}

function showSummary() {
    renderSummary();
    toggleSummary();
}

function renderSummary() {
    const summaryList = document.getElementById('summary-list');
    summaryList.innerHTML = '';

    // Group sales by name
    const summary = {};
    sales.forEach(sale => {
        if (!summary[sale.name]) {
            summary[sale.name] = { count: 0, total: 0 };
        }
        summary[sale.name].count++;
        summary[sale.name].total += sale.price;
    });

    // Render list
    for (const [name, data] of Object.entries(summary)) {
        const row = document.createElement('div');
        row.className = 'summary-row';
        row.innerHTML = `
            <span class="summary-name">${name} <span class="summary-count">x${data.count}</span></span>
            <span class="summary-price">NT$ ${data.total.toLocaleString()}</span>
        `;
        summaryList.appendChild(row);
    }

    // Update Grand Total
    const total = sales.reduce((sum, sale) => sum + sale.price, 0);
    document.getElementById('summary-grand-total').innerText = `NT$ ${total.toLocaleString()}`;
}

function toggleConfirm() {
    const modal = document.getElementById('confirm-modal');
    modal.classList.toggle('hidden');
}

function endDay() {
    toggleConfirm();
}

function processEndDay() {
    // Calculate summary for history
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

    // Clear current sales
    sales = [];
    saveSales();
    updateTotalDisplay();

    // Close modals
    toggleConfirm();
    toggleSummary();
}

function addNewItem() {
    const name = document.getElementById('new-item-name').value;
    const price = parseInt(document.getElementById('new-item-price').value);

    if (name && price) {
        const newProduct = { name, price, icon: '✨' };
        products.push(newProduct);
        saveProducts();
        renderProducts();

        toggleModal();
        // Clear inputs
        document.getElementById('new-item-name').value = '';
        document.getElementById('new-item-price').value = '';
    }
}
