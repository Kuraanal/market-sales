// State
let products = [];
let history = [];
let currentEditingProduct = null;
let currentDeletingProduct = null;

// DOM Elements
const productList = document.getElementById('product-list');
const historyList = document.getElementById('history-list');

// Modals
const editModal = document.getElementById('edit-product-modal');
const deleteModal = document.getElementById('confirm-delete-modal');
const resetModal = document.getElementById('confirm-reset-modal');
const clearHistoryModal = document.getElementById('confirm-clear-history-modal');

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupTabs();
    setupEventListeners();
    renderProducts();
    renderHistory();
});

function loadData() {
    // Load products
    const storedProducts = localStorage.getItem('kst_products');
    if (storedProducts) {
        products = JSON.parse(storedProducts);
    }

    // Load history
    const storedHistory = localStorage.getItem('kst_history');
    if (storedHistory) {
        history = JSON.parse(storedHistory);
    }
}

function saveProducts() {
    localStorage.setItem('kst_products', JSON.stringify(products));
}

// Tab Switching
function setupTabs() {
    const tabs = document.querySelectorAll('.settings__tab');
    const sections = document.querySelectorAll('.settings__section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            // Update active tab
            tabs.forEach(t => t.classList.remove('settings__tab--active'));
            tab.classList.add('settings__tab--active');

            // Update active section
            sections.forEach(section => {
                if (section.dataset.section === targetTab) {
                    section.classList.add('settings__section--active');
                } else {
                    section.classList.remove('settings__section--active');
                }
            });
        });
    });
}

// Event Listeners
function setupEventListeners() {
    // Edit modal
    document.getElementById('edit-cancel-btn').addEventListener('click', () => toggleModal(editModal));
    document.getElementById('edit-save-btn').addEventListener('click', saveProductEdit);

    // Delete modal
    document.getElementById('delete-cancel-btn').addEventListener('click', () => toggleModal(deleteModal));
    document.getElementById('delete-confirm-btn').addEventListener('click', confirmDelete);

    // Reset modal
    document.getElementById('reset-all-btn').addEventListener('click', () => toggleModal(resetModal));
    document.getElementById('reset-cancel-btn').addEventListener('click', () => toggleModal(resetModal));
    document.getElementById('reset-confirm-btn').addEventListener('click', resetAllData);

    // Clear history modal
    document.getElementById('clear-history-btn').addEventListener('click', () => toggleModal(clearHistoryModal));
    document.getElementById('clear-history-cancel-btn').addEventListener('click', () => toggleModal(clearHistoryModal));
    document.getElementById('clear-history-confirm-btn').addEventListener('click', clearHistory);
}

function toggleModal(modal) {
    modal.classList.toggle('hidden');
}

// Product Management
function renderProducts() {
    productList.innerHTML = '';

    if (products.length === 0) {
        productList.innerHTML = '<p class="product-list__empty">No products yet. Add products from the main POS page.</p>';
        return;
    }

    products.forEach((product, index) => {
        const item = document.createElement('div');
        item.className = 'product-list__item';
        item.innerHTML = `
            <div class="product-list__icon">${product.icon || '✨'}</div>
            <div class="product-list__info">
                <div class="product-list__name">${product.name}</div>
                <div class="product-list__price">$ ${product.price}</div>
            </div>
            <div class="product-list__actions">
                <button class="product-list__button product-list__button--edit" data-index="${index}">Edit</button>
                <button class="product-list__button product-list__button--delete" data-index="${index}">Delete</button>
            </div>
        `;

        // Add event listeners
        item.querySelector('.product-list__button--edit').addEventListener('click', () => editProduct(index));
        item.querySelector('.product-list__button--delete').addEventListener('click', () => deleteProduct(index));

        productList.appendChild(item);
    });
}

function editProduct(index) {
    currentEditingProduct = index;
    const product = products[index];

    document.getElementById('edit-product-name').value = product.name;
    document.getElementById('edit-product-icon').value = product.icon || '✨';
    document.getElementById('edit-product-price').value = product.price;

    toggleModal(editModal);
}

function saveProductEdit() {
    if (currentEditingProduct === null) return;

    const name = document.getElementById('edit-product-name').value.trim();
    const icon = document.getElementById('edit-product-icon').value.trim();
    const price = parseInt(document.getElementById('edit-product-price').value);

    if (!name || !price) {
        alert('Please fill in all fields');
        return;
    }

    products[currentEditingProduct] = {
        name,
        icon: icon || '✨',
        price
    };

    saveProducts();
    renderProducts();
    toggleModal(editModal);
    currentEditingProduct = null;
}

function deleteProduct(index) {
    currentDeletingProduct = index;
    toggleModal(deleteModal);
}

function confirmDelete() {
    if (currentDeletingProduct === null) return;

    products.splice(currentDeletingProduct, 1);
    saveProducts();
    renderProducts();
    toggleModal(deleteModal);
    currentDeletingProduct = null;
}

// History Display
function renderHistory() {
    const historyList = document.getElementById('history-list');
    const chartContainer = document.getElementById('history-chart-container');
    const chart = document.getElementById('history-chart');

    historyList.innerHTML = '';
    chart.innerHTML = '';

    if (history.length === 0) {
        historyList.innerHTML = '<p class="history__empty">No sales history yet. Complete a day to see history here.</p>';
        chartContainer.classList.add('hidden');
        return;
    }

    chartContainer.classList.remove('hidden');

    // --- Chart Logic (Last 7 stored days) ---
    // Take the last 7 items from the history array (which is ordered chronologically by default)
    const chartData = history.slice(-7);
    
    // Find max value for scaling
    const maxTotal = Math.max(...chartData.map(day => day.total), 1); // Avoid division by zero

    chartData.forEach(day => {
        // Robust parsing for "YYYY-MM-DD" or ISO strings
        let date;
        if (day.date.includes('T')) {
             // Legacy ISO support
             date = new Date(day.date);
        } else {
             // "YYYY-MM-DD" - parse as local date
             const [y, m, d] = day.date.split('-').map(Number);
             date = new Date(y, m - 1, d);
        }

        // Format: "12/10"
        const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`;
        const heightPercentage = Math.max((day.total / maxTotal) * 100, 2); // Min 2% height

        const barWrapper = document.createElement('div');
        barWrapper.className = 'bar-wrapper';
        
        barWrapper.innerHTML = `
            <div class="bar-value">${day.total.toLocaleString()}</div>
            <div class="bar" style="height: ${heightPercentage}%"></div>
            <div class="bar-label">${dateLabel}</div>
        `;
        
        chart.appendChild(barWrapper);
    });

    // --- History List Logic (Last 3 stored days) ---
    // Reverse to show newest first, then take top 3
    const reversedHistory = [...history].reverse();
    const listData = reversedHistory.slice(0, 3);

    listData.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'history__day';

        // Robust parsing for "YYYY-MM-DD" or ISO strings
        let date;
        if (day.date.includes('T')) {
             date = new Date(day.date);
        } else {
             const [y, m, d] = day.date.split('-').map(Number);
             date = new Date(y, m - 1, d);
        }

        // Format date only (no time) as requested
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const dateStr = date.toLocaleDateString('en-US', dateOptions);

        let itemsHTML = '';
        for (const [itemName, itemData] of Object.entries(day.items)) {
            itemsHTML += `
                <div class="history__item">
                    <span class="history__item-name">
                        ${itemName}
                        <span class="history__item-count">x${itemData.count}</span>
                    </span>
                    <span class="history__item-price">NT$ ${itemData.total.toLocaleString()}</span>
                </div>
            `;
        }

        dayDiv.innerHTML = `
            <div class="history__date">${dateStr}</div>
            <div class="history__items">
                ${itemsHTML}
            </div>
            <div class="history__total">
                <span>Total:</span>
                <span>NT$ ${day.total.toLocaleString()}</span>
            </div>
        `;

        historyList.appendChild(dayDiv);
    });
}

// Reset All Data
function resetAllData() {
    localStorage.removeItem('kst_products');
    localStorage.removeItem('kst_sales');
    localStorage.removeItem('kst_history');

    products = [];
    history = [];

    renderProducts();
    renderHistory();
    toggleModal(resetModal);

    alert('All data has been reset successfully!');
}

// Clear History Only
function clearHistory() {
    localStorage.removeItem('kst_history');
    history = [];
    renderHistory();
    toggleModal(clearHistoryModal);
    alert('History has been cleared successfully!');
}
