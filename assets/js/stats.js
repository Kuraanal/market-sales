// State
let products = [];
let productIcons = {};
let history = [];

// DOM Elements
const productChart = document.getElementById('product-chart');
const chartContainer = document.getElementById('chart-container');
const chartEmpty = document.getElementById('chart-empty');
const breakdownSection = document.getElementById('breakdown-section');
const breakdownList = document.getElementById('breakdown-list');
const totalItemsEl = document.getElementById('total-items');
const totalDaysEl = document.getElementById('total-days');
const yMaxLabel = document.getElementById('y-max');
const yMidLabel = document.getElementById('y-mid');

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderStats();
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

    // Load icons
    const storedIcons = localStorage.getItem('kst_product_icons');
    if (storedIcons) {
        try {
            productIcons = JSON.parse(storedIcons);
        } catch(e) { console.error(e); productIcons = {}; }
    }
}

function getProductIcon(productName) {
    if (productIcons[productName]) {
        return `<img src="${productIcons[productName]}" alt="${productName}" class="stats-icon-img" onerror="this.outerHTML='✨'" />`;
    }
    const product = products.find(p => p.name === productName);
    return product ? (product.icon || '✨') : '✨';
}

function renderStats() {
    // Calculate date range (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Filter history entries within the last 30 days
    const recentHistory = history.filter(entry => {
        let entryDate;
        if (entry.date.includes('T')) {
             entryDate = new Date(entry.date);
        } else {
             const [y, m, d] = entry.date.split('-').map(Number);
             entryDate = new Date(y, m - 1, d);
        }
        return entryDate >= thirtyDaysAgo && entryDate <= now;
    });
    
    // Aggregate product sales
    const productSales = {};
    let totalItemsSold = 0;
    
    recentHistory.forEach(day => {
        if (day.items) {
            for (const [productName, itemData] of Object.entries(day.items)) {
                if (!productSales[productName]) {
                    productSales[productName] = 0;
                }
                productSales[productName] += itemData.count;
                totalItemsSold += itemData.count;
            }
        }
    });
    
    // Update summary cards
    totalItemsEl.textContent = totalItemsSold.toLocaleString();
    totalDaysEl.textContent = recentHistory.length;
    
    // Check if we have data
    if (Object.keys(productSales).length === 0) {
        chartContainer.classList.add('hidden');
        chartEmpty.classList.remove('hidden');
        breakdownSection.classList.add('hidden');
        return;
    }
    
    chartContainer.classList.remove('hidden');
    chartEmpty.classList.add('hidden');
    breakdownSection.classList.remove('hidden');
    
    // Sort products by sales count (descending)
    const sortedProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1]);
    
    // Render chart
    renderChart(sortedProducts, totalItemsSold);
    
    // Render breakdown
    renderBreakdown(sortedProducts, totalItemsSold);
}

function renderChart(sortedProducts, maxTotal) {
    productChart.innerHTML = '';
    
    // Update Y-axis labels
    yMaxLabel.textContent = maxTotal.toLocaleString();
    yMidLabel.textContent = Math.round(maxTotal / 2).toLocaleString();
    
    sortedProducts.forEach(([productName, count]) => {
        const icon = getProductIcon(productName);
        const heightPercentage = Math.max((count / maxTotal) * 100, 2);
        
        const barWrapper = document.createElement('div');
        barWrapper.className = 'bar-wrapper';
        
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${heightPercentage}%`;
        bar.dataset.count = `${count} sold`;
        bar.title = `${productName}: ${count} items sold`;
        
        const labelContainer = document.createElement('div');
        labelContainer.className = 'bar-label';
        labelContainer.innerHTML = `<span class="bar-icon">${icon}</span>`;
        labelContainer.title = productName;
        
        barWrapper.appendChild(bar);
        barWrapper.appendChild(labelContainer);
        
        productChart.appendChild(barWrapper);
    });
}

function renderBreakdown(sortedProducts, totalItemsSold) {
    breakdownList.innerHTML = '';
    
    sortedProducts.forEach(([productName, count], index) => {
        const icon = getProductIcon(productName);
        const percentage = (count / totalItemsSold) * 100;
        
        const item = document.createElement('div');
        item.className = 'breakdown-item';
        
        // Rank styling
        let rankClass = '';
        if (index === 0) rankClass = 'breakdown-item__rank--gold';
        else if (index === 1) rankClass = 'breakdown-item__rank--silver';
        else if (index === 2) rankClass = 'breakdown-item__rank--bronze';
        
        item.innerHTML = `
            <div class="breakdown-item__rank ${rankClass}">#${index + 1}</div>
            <div class="breakdown-item__icon">${icon}</div>
            <div class="breakdown-item__info">
                <div class="breakdown-item__name">${productName}</div>
                <div class="breakdown-item__bar-container">
                    <div class="breakdown-item__bar" style="width: ${percentage}%"></div>
                </div>
            </div>
            <div class="breakdown-item__count">${count}</div>
        `;
        
        breakdownList.appendChild(item);
    });
}
