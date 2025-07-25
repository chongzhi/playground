document.addEventListener('DOMContentLoaded', () => {
    const views = {
        holdings: document.getElementById('holdings-view'),
        transaction: document.getElementById('transaction-view'),
        history: document.getElementById('history-view'),
    };

    const navButtons = {
        holdings: document.getElementById('nav-holdings'),
        add: document.getElementById('nav-add'),
        history: document.getElementById('nav-history'),
    };

    const headerTitle = document.getElementById('header-title');
    const transactionForm = document.getElementById('transaction-form');
    const holdingsList = document.getElementById('holdings-list');
    const historyList = document.getElementById('history-list');
    const cancelBtn = document.getElementById('cancel-btn');

    const holdingsEmptyState = document.getElementById('holdings-empty-state');
    const historyEmptyState = document.getElementById('history-empty-state');

    // --- 数据管理 ---
    const storageKey = 'stockTransactions';

    function getTransactions() {
        return JSON.parse(localStorage.getItem(storageKey)) || [];
    }

    function saveTransactions(transactions) {
        localStorage.setItem(storageKey, JSON.stringify(transactions));
    }

    // --- 视图切换 ---
    function switchView(viewName) {
        Object.values(views).forEach(view => view.classList.remove('active'));
        views[viewName].classList.add('active');

        Object.values(navButtons).forEach(btn => btn.classList.remove('active'));
        if (navButtons[viewName]) {
            navButtons[viewName].classList.add('active');
        }

        switch (viewName) {
            case 'holdings':
                headerTitle.textContent = '我的持仓';
                renderHoldings();
                break;
            case 'transaction':
                headerTitle.textContent = '添加交易';
                break;
            case 'history':
                headerTitle.textContent = '历史记录';
                renderHistory();
                break;
        }
    }

    // --- 渲染逻辑 ---
    function renderHoldings() {
        const transactions = getTransactions();
        const holdings = calculateHoldings(transactions);

        holdingsList.innerHTML = '';
        if (Object.keys(holdings).length === 0) {
            holdingsEmptyState.style.display = 'block';
            return;
        }

        holdingsEmptyState.style.display = 'none';
        Object.values(holdings).forEach(stock => {
            const item = document.createElement('li');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="item-main-info">
                    <div class="stock-name">${stock.name}</div>
                    <div class="stock-code">${stock.code}</div>
                </div>
                <div class="item-details">
                    <div class="item-col-1"><span>持仓</span><span class="value-quantity">${stock.quantity.toLocaleString('en-US')}</span></div>
                    <div class="item-col-2"><span>成本</span><span class="value-price">${stock.avgCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span></div>
                    <div class="item-col-3"><span>总市值</span><span class="value-total">${(stock.quantity * stock.avgCost).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span></div>
                </div>
            `;
            holdingsList.appendChild(item);
        });
    }

    function renderHistory() {
        const transactions = getTransactions().sort((a, b) => new Date(b.date) - new Date(a.date));

        historyList.innerHTML = '';
        if (transactions.length === 0) {
            historyEmptyState.style.display = 'block';
            return;
        }

        historyEmptyState.style.display = 'none';
        transactions.forEach(tx => {
            const item = document.createElement('li');
            item.className = `list-item transaction-type-${tx.type}`;
            item.innerHTML = `
                <div class="item-main-info">
                    <div class="stock-name">${tx.name} (${tx.code})</div>
                    <div class="stock-code">${new Date(tx.date).toLocaleDateString()}</div>
                </div>
                <div class="item-details">
                    <div class="item-col-1"><span>类型</span><span>${tx.type === 'buy' ? '买入' : '卖出'}</span></div>
                    <div class="item-col-2"><span>价格</span><span class="value-price">${tx.price.toLocaleString('en-US')}</span></div>
                    <div class="item-col-3"><span>数量</span><span class="value-quantity">${tx.quantity.toLocaleString('en-US')}</span></div>
                    <div class="item-col-4"><span>总值</span><span class="value-total">${(tx.price * tx.quantity).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span></div>
                </div>
            `;
            historyList.appendChild(item);
        });
    }

    // --- 计算逻辑 ---
    function calculateHoldings(transactions) {
        const holdings = {};
        transactions.forEach(tx => {
            if (!holdings[tx.code]) {
                holdings[tx.code] = { code: tx.code, name: tx.name, quantity: 0, totalCost: 0, avgCost: 0 };
            }
            const stock = holdings[tx.code];
            if (tx.type === 'buy') {
                stock.totalCost += tx.price * tx.quantity;
                stock.quantity += tx.quantity;
            } else { // sell
                const costOfSoldShares = stock.avgCost * tx.quantity;
                stock.totalCost -= costOfSoldShares;
                stock.quantity -= tx.quantity;
            }
            stock.avgCost = stock.quantity > 0 ? stock.totalCost / stock.quantity : 0;
        });

        // 过滤掉数量为0的持仓
        return Object.fromEntries(Object.entries(holdings).filter(([_, stock]) => stock.quantity > 0));
    }

    // --- 事件监听 ---
    navButtons.holdings.addEventListener('click', () => switchView('holdings'));
    navButtons.add.addEventListener('click', () => {
        transactionForm.reset();
        document.getElementById('transaction-id').value = '';
        // 设置默认交易日期为今天
        document.getElementById('transaction-date').valueAsDate = new Date();
        switchView('transaction');
    });
    navButtons.history.addEventListener('click', () => switchView('history'));

    cancelBtn.addEventListener('click', () => switchView('holdings'));

    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newTransaction = {
            id: Date.now().toString(), // Simple unique ID
            code: document.getElementById('stock-code').value.toUpperCase(),
            name: document.getElementById('stock-name').value,
            type: document.getElementById('transaction-type').value,
            price: parseFloat(document.getElementById('transaction-price').value),
            quantity: parseInt(document.getElementById('transaction-quantity').value, 10),
            date: document.getElementById('transaction-date').value,
        };

        const transactions = getTransactions();
        transactions.push(newTransaction);
        saveTransactions(transactions);

        transactionForm.reset();
        switchView('holdings');
    });

    // --- 初始化 ---
    switchView('holdings');
});