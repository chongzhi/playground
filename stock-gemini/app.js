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

    // --- 页面状态管理 ---
    let previousView = 'holdings'; // 记录上一个页面

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
        // 记录上一个页面（排除transaction页面）
        if (viewName !== 'transaction') {
            previousView = viewName;
        }
        
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
                const transactionId = document.getElementById('transaction-id').value;
                headerTitle.textContent = transactionId ? '修改交易' : '添加交易';
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
                    <div class="item-col-2"><span>成本</span><span class="value-price">$${stock.avgCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span></div>
                    <div class="item-col-3"><span>总市值</span><span class="value-total">$${(stock.quantity * stock.avgCost).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span></div>
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
                <div class="item-header">
                    <div class="item-main-info">
                        <div class="stock-name">${tx.name} (${tx.code})</div>
                        <div class="stock-code">${tx.date}</div>
                    </div>
                    <div class="action-buttons">
                        <button class="edit-btn" data-id="${tx.id}">修改</button>
                        <button class="delete-btn" data-id="${tx.id}">删除</button>
                    </div>
                </div>
                <div class="item-details">
                    <div class="item-col-1"><span>类型</span><span>${tx.type === 'buy' ? '买入' : '卖出'}</span></div>
                    <div class="item-col-2"><span>价格</span><span class="value-price">$${tx.price.toLocaleString('en-US')}</span></div>
                    <div class="item-col-3"><span>数量</span><span class="value-quantity">${tx.quantity.toLocaleString('en-US')}</span></div>
                    <div class="item-col-4"><span>总值</span><span class="value-total">$${(tx.price * tx.quantity).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span></div>
                </div>
            `;
            
            // 添加删除按钮事件监听
            const deleteBtn = item.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteTransaction(tx.id));
            
            // 添加修改按钮事件监听
            const editBtn = item.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => editTransaction(tx.id));
            
            historyList.appendChild(item);
        });
    }

    // --- 删除功能 ---
    function deleteTransaction(transactionId) {
        if (confirm('确定要删除这条交易记录吗？')) {
            const transactions = getTransactions();
            const updatedTransactions = transactions.filter(tx => tx.id !== transactionId);
            saveTransactions(updatedTransactions);
            renderHistory();
            renderHoldings(); // 重新计算持仓
        }
    }

    // --- 修改功能 ---
    function editTransaction(transactionId) {
        const transactions = getTransactions();
        const transaction = transactions.find(tx => tx.id === transactionId);
        
        if (transaction) {
            // 填充表单
            document.getElementById('transaction-id').value = transaction.id;
            document.getElementById('stock-code').value = transaction.code;
            document.getElementById('stock-name').value = transaction.name;
            document.getElementById('transaction-type').value = transaction.type;
            document.getElementById('transaction-price').value = transaction.price;
            document.getElementById('transaction-quantity').value = transaction.quantity;
            document.getElementById('transaction-date').value = transaction.date;
            
            // 切换到交易表单视图
            switchView('transaction');
        }
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
        // 设置默认交易日期为今天，格式为 YYYY-MM-DD
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        document.getElementById('transaction-date').value = `${year}-${month}-${day}`;
        switchView('transaction');
    });
    navButtons.history.addEventListener('click', () => switchView('history'));

    cancelBtn.addEventListener('click', () => {
        transactionForm.reset();
        switchView(previousView);
    });

    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const transactionId = document.getElementById('transaction-id').value;
        
        const transactionData = {
            id: transactionId || Date.now().toString(), // 如果是修改，使用原ID；如果是新增，生成新ID
            code: document.getElementById('stock-code').value.toUpperCase(),
            name: document.getElementById('stock-name').value,
            type: document.getElementById('transaction-type').value,
            price: parseFloat(document.getElementById('transaction-price').value),
            quantity: parseInt(document.getElementById('transaction-quantity').value, 10),
            date: document.getElementById('transaction-date').value,
        };

        const transactions = getTransactions();
        
        if (transactionId) {
            // 修改现有记录
            const index = transactions.findIndex(tx => tx.id === transactionId);
            if (index !== -1) {
                transactions[index] = transactionData;
            }
        } else {
            // 添加新记录
            transactions.push(transactionData);
        }
        
        saveTransactions(transactions);
        transactionForm.reset();
        switchView(previousView);
    });

    // --- 初始化 ---
    switchView('holdings');
});