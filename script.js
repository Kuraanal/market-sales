// State
let products = [];
let sales = {};
let history = [];

// DOM Elements
const ProductsGrid = document.getElementById('product-grid');
const totalEl = document.getElementById('total-sales');

const summaryList = document.getElementById('summary-list');
const summaryGrandTotal = document.getElementById('summary-grand-total');

const summary_Modal = document.getElementById('summary_Modal');
const addItem_Modal = document.getElementById('additem_Modal');
const confirm_Modal = document.getElementById('confirm_Modal');

const additem_cancel = addItem_Modal.querySelector('.modal__button--cancel');
const additem_validate = addItem_Modal.querySelector('.modal__button--validate');
const summary_cancel = summary_Modal.querySelector('.modal__button--cancel');
const summary_validate = summary_Modal.querySelector('.modal__button--validate');
const confirm_cancel = confirm_Modal.querySelector('.modal__button--cancel');
const confirm_validate = confirm_Modal.querySelector('.modal__button--validate');
const export_json = document.querySelector('.export__button[data-type="json"]');
const export_csv = document.querySelector('.export__button[data-type="csv"]');

// Event Listeners
additem_cancel.addEventListener('click', () => toggleModal(addItem_Modal));
additem_validate.addEventListener('click', addNewItem);

summary_cancel.addEventListener('click', () => toggleModal(summary_Modal));
summary_validate.addEventListener('click', endDay);

confirm_cancel.addEventListener('click', () => toggleModal(confirm_Modal));
confirm_validate.addEventListener('click', processEndDay);

export_json.addEventListener('click', () => downloadFile('json'));
export_csv.addEventListener('click', () => downloadFile('csv'));

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderProducts();
    updateTotalDisplay();
});

function loadData() {
    const storedProducts = localStorage.getItem('kst_products');
    if (storedProducts) {
        products = JSON.parse(storedProducts);
    } else {
        products = [];
    }

    const storedSales = localStorage.getItem('kst_sales');
    if (storedSales) {
        try {
            const parsed = JSON.parse(storedSales);
            if (Array.isArray(parsed)) {
                sales = {};
            } else {
                sales = parsed;
            }
        } catch (e) {
            console.error('Error parsing sales data:', e);
            sales = {};
        }
    }

    const storedHistory = localStorage.getItem('kst_history');
    if (storedHistory) {
        history = JSON.parse(storedHistory);
    }
}

function saveProducts() {
    localStorage.setItem('kst_products', JSON.stringify(products));
}

function saveSales() {
    localStorage.setItem('kst_sales', JSON.stringify(sales));
}

function saveHistory() {
    localStorage.setItem('kst_history', JSON.stringify(history));
}

function renderProducts() {
    ProductsGrid.innerHTML = ''; // Clear existing

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product';

        card.innerHTML = `
            <div class="product__info">
                <div class="product__icon">${product.icon || '✨'}</div>
                <div class="product__name">${product.name}</div>
                <div class="product__price">$ ${product.price}</div>
            </div>
            <div class="product__actions"></div>
        `;

        const incrementBtn = document.createElement('button');
        incrementBtn.className = 'product__button product__button--increment';
        incrementBtn.dataset.name = product.name;
        incrementBtn.dataset.price = product.price;
        incrementBtn.dataset.icon = product.icon || '✨';
        incrementBtn.textContent = '+';

        const decrementBtn = document.createElement('button');
        decrementBtn.className = 'product__button product__button--decrement';
        decrementBtn.dataset.name = product.name;
        decrementBtn.textContent = '−';

        incrementBtn.addEventListener('click', () => addToCart(product));
        decrementBtn.addEventListener('click', () => removeSale(product.name));

        cardActions = card.querySelector('.product__actions');
        cardActions.appendChild(incrementBtn);
        cardActions.appendChild(decrementBtn);

        ProductsGrid.appendChild(card);
    });
}

function addToCart(product) {
    const buttons = document.querySelectorAll('.product__button--increment, .product__button--decrement');
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
    const buttons = document.querySelectorAll('.product__button--increment, .product__button--decrement');
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
    toggleModal(summary_Modal);
}

function renderSummary() {
    summaryList.innerHTML = '';
    let total = 0;

    for (const [name, count] of Object.entries(sales)) {
        const price = getProductPrice(name);
        const itemTotal = price * count;
        total += itemTotal;

        const row = document.createElement('div');
        row.className = 'summary__item';
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

    toggleModal(confirm_Modal);
    toggleModal(summary_Modal);
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

        toggleModal(addItem_Modal);
    }

    document.getElementById('new-item-name').value = '';
    document.getElementById('new-item-price').value = '';
    document.getElementById('selected-icon').value = '✨';
}

function downloadFile(fileType) {
    if (history.length === 0) {
        console.info('No history to export. End a day first to create history.');
        return;
    }

    let dataBlob;

    if (fileType === 'json') {
        dataBlob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    }
    else if (fileType === 'csv') {
        let csv = 'Date,Item,Quantity,Subtotal,Daily Total\n';

        history.forEach(day => {
            csv += `${day.date}, , , , ${day.total}\n`;
            for (const [itemName, itemData] of Object.entries(day.items)) {
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