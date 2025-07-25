document.addEventListener('DOMContentLoaded', () => {
    const views = {
        holdings: document.getElementById('holdings-view'),
        transaction: document.getElementById('transaction-view'),
        history: document.getElementById('history-view'),
        profit: document.getElementById('profit-view'),
    };

    const navButtons = {
        holdings: document.getElementById('nav-holdings'),
        add: document.getElementById('nav-add'),
        history: document.getElementById('nav-history'),
        profit: document.getElementById('nav-profit'),
    };

    const headerTitle = document.getElementById('header-title');
    const transactionForm = document.getElementById('transaction-form');
    const holdingsList = document.getElementById('holdings-list');
    const historyList = document.getElementById('history-list');
    const profitList = document.getElementById('profit-list');
    const cancelBtn = document.getElementById('cancel-btn');

    const holdingsEmptyState = document.getElementById('holdings-empty-state');
    const historyEmptyState = document.getElementById('history-empty-state');
    const profitEmptyState = document.getElementById('profit-empty-state');

    // --- 页面状态管理 ---
    let previousView = 'holdings'; // 记录上一个页面

    // --- 数据管理 ---
    const storageKey = 'stockTransactions';
    const tabStateKey = 'currentTab';

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
            // 保存当前tab状态到localStorage
            localStorage.setItem(tabStateKey, viewName);
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
            case 'profit':
                headerTitle.textContent = '收益分析';
                renderPriceInputs();
                renderProfitAnalysis();
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

    // --- 用户输入的价格数据 ---
    let userPrices = {};
    const priceStorageKey = 'userStockPrices';

    // 从localStorage加载用户输入的价格
    function loadUserPrices() {
        const saved = localStorage.getItem(priceStorageKey);
        userPrices = saved ? JSON.parse(saved) : {};
    }

    // 保存用户输入的价格到localStorage
    function saveUserPrices() {
        localStorage.setItem(priceStorageKey, JSON.stringify(userPrices));
    }

    // --- 收益分析逻辑 ---
    function calculateProfitAnalysis(holdings) {
        let totalCost = 0;
        let totalValue = 0;
        const stockProfits = [];

        Object.values(holdings).forEach(stock => {
            // 使用用户输入的价格，如果没有则使用成本价
            const currentPrice = userPrices[stock.code] || stock.avgCost;
            const currentValue = stock.quantity * currentPrice;
            const profit = currentValue - stock.totalCost;
            const profitPercent = stock.totalCost > 0 ? (profit / stock.totalCost) * 100 : 0;

            totalCost += stock.totalCost;
            totalValue += currentValue;

            stockProfits.push({
                ...stock,
                currentPrice,
                currentValue,
                profit,
                profitPercent
            });
        });

        const totalProfit = totalValue - totalCost;
        const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

        return {
            totalCost,
            totalValue,
            totalProfit,
            totalProfitPercent,
            stockProfits: stockProfits.sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit)) // 按盈亏绝对值排序
        };
    }

    // 渲染价格输入界面
    function renderPriceInputs() {
        const transactions = getTransactions();
        const holdings = calculateHoldings(transactions);
        const priceInputsContainer = document.getElementById('price-inputs');
        
        priceInputsContainer.innerHTML = '';
        
        if (Object.keys(holdings).length === 0) {
            priceInputsContainer.innerHTML = '<p class="no-holdings">暂无持仓记录</p>';
            return;
        }

        Object.values(holdings).forEach(stock => {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'price-input-group';
            
            inputGroup.innerHTML = `
                <label for="price-${stock.code}">${stock.name} (${stock.code})</label>
                <div class="price-input-wrapper">
                    <span class="currency-symbol">$</span>
                    <input type="number" 
                           id="price-${stock.code}" 
                           class="price-input" 
                           step="0.01" 
                           min="0" 
                           placeholder="${stock.avgCost.toFixed(2)}"
                           value="${userPrices[stock.code] || ''}">
                </div>
            `;
            
            priceInputsContainer.appendChild(inputGroup);
        });
    }

    // 渲染收益分析
    function renderProfitAnalysis() {
        const transactions = getTransactions();
        const holdings = calculateHoldings(transactions);
        const profitData = calculateProfitAnalysis(holdings);

        // 更新总体收益概览
        document.getElementById('total-value').textContent = `$${profitData.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        document.getElementById('total-cost').textContent = `$${profitData.totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        
        const totalPnlElement = document.getElementById('total-pnl');
        const totalReturnElement = document.getElementById('total-return');
        
        // 处理总盈亏显示
        if (Math.abs(profitData.totalProfit) < 0.01) {
            totalPnlElement.textContent = '持平';
            totalPnlElement.className = 'profit-value neutral';
        } else {
            totalPnlElement.textContent = `${profitData.totalProfit > 0 ? '+' : ''}$${profitData.totalProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
            totalPnlElement.className = `profit-value ${profitData.totalProfit > 0 ? 'positive' : 'negative'}`;
        }
        
        // 处理总收益率显示
        if (Math.abs(profitData.totalProfitPercent) < 0.01) {
            totalReturnElement.textContent = '持平';
            totalReturnElement.className = 'profit-value neutral';
        } else {
            totalReturnElement.textContent = `${profitData.totalProfitPercent > 0 ? '+' : ''}${profitData.totalProfitPercent.toFixed(2)}%`;
            totalReturnElement.className = `profit-value ${profitData.totalProfitPercent > 0 ? 'positive' : 'negative'}`;
        }

        // 渲染个股收益明细
        profitList.innerHTML = '';
        if (profitData.stockProfits.length === 0) {
            profitEmptyState.style.display = 'block';
            return;
        }

        profitEmptyState.style.display = 'none';
        profitData.stockProfits.forEach(stock => {
            const item = document.createElement('li');
            item.className = 'profit-item';
            item.innerHTML = `
                <div class="profit-item-header">
                    <div class="stock-info">
                        <div class="stock-name">${stock.name}</div>
                        <div class="stock-code">${stock.code}</div>
                    </div>
                    <div class="profit-status ${stock.profit > 0.01 ? 'positive' : stock.profit < -0.01 ? 'negative' : 'neutral'}">
                        ${stock.profit > 0.01 ? '盈利' : stock.profit < -0.01 ? '亏损' : '持平'}
                    </div>
                </div>
                <div class="profit-item-details">
                    <div class="profit-col">
                        <span class="label">持仓</span>
                        <span class="value value-quantity">${stock.quantity.toLocaleString('en-US')}</span>
                    </div>
                    <div class="profit-col">
                        <span class="label">成本</span>
                        <span class="value value-cost">$${stock.avgCost.toFixed(2)}</span>
                    </div>
                    <div class="profit-col">
                        <span class="label">现价</span>
                        <span class="value value-current-price">$${stock.currentPrice.toFixed(2)}</span>
                    </div>
                    <div class="profit-col">
                        <span class="label">市值</span>
                        <span class="value value-market-value">$${stock.currentValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div class="profit-col">
                        <span class="label">盈亏</span>
                        <span class="value ${stock.profit > 0.01 ? 'positive' : stock.profit < -0.01 ? 'negative' : 'neutral'}">
                            ${stock.profit > 0.01 ? '+' : ''}${Math.abs(stock.profit) < 0.01 ? '持平' : `$${stock.profit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                        </span>
                    </div>
                    <div class="profit-col">
                        <span class="label">收益率</span>
                        <span class="value ${stock.profitPercent > 0.01 ? 'positive' : stock.profitPercent < -0.01 ? 'negative' : 'neutral'}">
                            ${stock.profitPercent > 0.01 ? '+' : ''}${Math.abs(stock.profitPercent) < 0.01 ? '持平' : `${stock.profitPercent.toFixed(2)}%`}
                        </span>
                    </div>
                </div>
            `;
            profitList.appendChild(item);
        });
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
    navButtons.profit.addEventListener('click', () => switchView('profit'));

    // 更新价格按钮事件监听
    document.getElementById('update-prices-btn').addEventListener('click', () => {
        const transactions = getTransactions();
        const holdings = calculateHoldings(transactions);
        
        // 收集用户输入的价格
        Object.values(holdings).forEach(stock => {
            const input = document.getElementById(`price-${stock.code}`);
            if (input && input.value) {
                userPrices[stock.code] = parseFloat(input.value);
            }
        });
        
        // 保存价格并重新渲染
        saveUserPrices();
        renderProfitAnalysis();
    });

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
    // 加载用户输入的价格
    loadUserPrices();
    
    // 从localStorage恢复tab状态，如果没有则默认为holdings
    const savedTab = localStorage.getItem(tabStateKey) || 'holdings';
    switchView(savedTab);
});