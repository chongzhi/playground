// 主应用逻辑
class StockApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.isLoading = false;
        this.currentFilters = {};
        this.init();
    }

    // 初始化应用
    init() {
        this.bindEvents();
        this.loadDashboard();
        this.checkFirstTime();
    }

    // 绑定事件
    bindEvents() {
        // 导航事件
        document.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-nav')) {
                e.preventDefault();
                const page = e.target.getAttribute('data-nav');
                this.navigateTo(page);
            }

            // 返回按钮
            if (e.target.classList.contains('back-btn')) {
                e.preventDefault();
                this.goBack();
            }

            // 删除按钮
            if (e.target.classList.contains('delete-btn')) {
                e.preventDefault();
                this.handleDelete(e.target);
            }

            // 编辑按钮
            if (e.target.classList.contains('edit-btn')) {
                e.preventDefault();
                this.handleEdit(e.target);
            }
        });

        // 表单提交事件
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('transaction-form')) {
                e.preventDefault();
                this.handleTransactionSubmit(e.target);
            }
        });

        // 搜索事件
        document.addEventListener('input', Utils.debounce((e) => {
            if (e.target.classList.contains('search-input')) {
                this.handleSearch(e.target.value);
            }
        }, 300));

        // 筛选事件
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('filter-select')) {
                this.handleFilter();
            }
        });
    }

    // 页面导航
    navigateTo(page) {
        if (this.isLoading) return;
        
        this.currentPage = page;
        this.updateActiveNav();
        
        switch(page) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'transactions':
                this.loadTransactions();
                break;
            case 'add-transaction':
                this.loadAddTransaction();
                break;
            case 'holdings':
                this.loadHoldings();
                break;
            case 'statistics':
                this.loadStatistics();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    // 更新导航状态
    updateActiveNav() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNav = document.querySelector(`[data-nav="${this.currentPage}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
    }

    // 返回上一页
    goBack() {
        if (this.currentPage === 'add-transaction') {
            this.navigateTo('transactions');
        } else {
            this.navigateTo('dashboard');
        }
    }

    // 加载仪表板
    loadDashboard() {
        const main = document.querySelector('.main-content');
        const stats = window.transactionManager.getTransactionStats();
        const holdingsSummary = window.holdingsManager.getHoldingsSummary();
        
        main.innerHTML = `
            <div class="dashboard">
                <div class="dashboard-header">
                    <h1>股票记录</h1>
                    <div class="quick-actions">
                        <button class="btn btn-primary" data-nav="add-transaction">
                            <span class="icon">+</span>
                            添加交易
                        </button>
                    </div>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">¥${Utils.formatMoney(holdingsSummary.totalValue)}</div>
                        <div class="stat-label">总市值</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value ${Utils.getProfitColorClass(holdingsSummary.totalProfit)}">
                            ¥${Utils.formatMoney(holdingsSummary.totalProfit)}
                        </div>
                        <div class="stat-label">总盈亏</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${holdingsSummary.holdingsCount}</div>
                        <div class="stat-label">持仓股票</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalTransactions}</div>
                        <div class="stat-label">交易次数</div>
                    </div>
                </div>
                
                <div class="dashboard-sections">
                    <section class="recent-transactions">
                        <h2>最近交易</h2>
                        <div class="transaction-list" id="recent-transactions-list">
                            ${this.renderRecentTransactions()}
                        </div>
                        <div class="section-footer">
                            <button class="btn btn-secondary" data-nav="transactions">查看全部</button>
                        </div>
                    </section>
                    
                    <section class="top-holdings">
                        <h2>主要持仓</h2>
                        <div class="holdings-list" id="top-holdings-list">
                            ${this.renderTopHoldings()}
                        </div>
                        <div class="section-footer">
                            <button class="btn btn-secondary" data-nav="holdings">查看全部</button>
                        </div>
                    </section>
                </div>
            </div>
        `;
    }

    // 加载添加交易页面
    loadAddTransaction() {
        const main = document.querySelector('.main-content');
        
        main.innerHTML = `
            <div class="add-transaction-page">
                <div class="page-header">
                    <button class="back-btn">返回</button>
                    <h1>添加交易记录</h1>
                </div>
                
                <form class="transaction-form card">
                    <div class="card-body">
                        <div class="form-group">
                            <label class="form-label" for="symbol">股票代码 *</label>
                            <input type="text" class="form-control" id="symbol" name="symbol" 
                                   placeholder="如：000001" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="name">股票名称 *</label>
                            <input type="text" class="form-control" id="name" name="name" 
                                   placeholder="如：平安银行" required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label" for="type">交易类型 *</label>
                                <select class="form-control" id="type" name="type" required>
                                    <option value="">请选择</option>
                                    <option value="buy">买入</option>
                                    <option value="sell">卖出</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="date">交易日期 *</label>
                                <input type="date" class="form-control" id="date" name="date" 
                                       value="${Utils.getTodayString()}" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label" for="quantity">数量 *</label>
                                <input type="number" class="form-control" id="quantity" name="quantity" 
                                       placeholder="100" step="1" min="1" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="price">价格 *</label>
                                <input type="number" class="form-control" id="price" name="price" 
                                       placeholder="10.50" step="0.01" min="0.01" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="fee">手续费</label>
                            <input type="number" class="form-control" id="fee" name="fee" 
                                   placeholder="5.00" step="0.01" min="0" value="0">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="note">备注</label>
                            <textarea class="form-control" id="note" name="note" rows="3" 
                                      placeholder="可选的备注信息..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <div class="transaction-summary" id="transaction-summary">
                                <!-- 交易摘要会在这里显示 -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="card-footer">
                        <button type="submit" class="btn btn-primary" style="width: 100%;">
                            保存交易记录
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        this.bindAddTransactionEvents();
    }

    // 渲染最近交易
    renderRecentTransactions() {
        const result = window.transactionManager.getTransactionsPaged(1, 5);
        
        if (result.data.length === 0) {
            return '<div class="empty-state">暂无交易记录</div>';
        }
        
        return result.data.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-stock">
                        <span class="symbol">${transaction.symbol}</span>
                        <span class="name">${transaction.name}</span>
                    </div>
                    <div class="transaction-details">
                        <span class="type ${transaction.type}">${transaction.type === 'buy' ? '买入' : '卖出'}</span>
                        <span class="quantity">${transaction.quantity}股</span>
                        <span class="price">¥${Utils.formatMoney(transaction.price)}</span>
                    </div>
                </div>
                <div class="transaction-meta">
                    <div class="amount">¥${Utils.formatMoney(transaction.totalAmount)}</div>
                    <div class="date">${Utils.formatDate(transaction.date, 'MM-DD')}</div>
                </div>
            </div>
        `).join('');
    }

    // 渲染主要持仓
    renderTopHoldings() {
        const holdings = window.holdingsManager.getHoldingsList('totalCost', 'desc').slice(0, 5);
        
        if (holdings.length === 0) {
            return '<div class="empty-state">暂无持仓</div>';
        }
        
        return holdings.map(holding => `
            <div class="holding-item">
                <div class="holding-info">
                    <div class="holding-stock">
                        <span class="symbol">${holding.symbol}</span>
                        <span class="name">${holding.name}</span>
                    </div>
                    <div class="holding-quantity">${holding.quantity}股</div>
                </div>
                <div class="holding-values">
                    <div class="cost">成本¥${Utils.formatMoney(holding.avgCost)}</div>
                    <div class="profit ${Utils.getProfitColorClass(holding.unrealizedProfit)}">
                        ${holding.unrealizedProfit >= 0 ? '+' : ''}¥${Utils.formatMoney(holding.unrealizedProfit)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 加载持仓页面
    loadHoldings() {
        const main = document.querySelector('.main-content');
        const holdings = window.holdingsManager.getHoldingsList();
        const summary = window.holdingsManager.getHoldingsSummary();
        
        main.innerHTML = `
            <div class="holdings-page">
                <div class="page-header">
                    <h1>我的持仓</h1>
                    <button class="btn btn-primary" data-nav="add-transaction">添加交易</button>
                </div>
                
                <div class="holdings-summary card">
                    <div class="card-body">
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-value">¥${Utils.formatMoney(summary.totalValue)}</div>
                                <div class="stat-label">总市值</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">¥${Utils.formatMoney(summary.totalCost)}</div>
                                <div class="stat-label">总成本</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value ${Utils.getProfitColorClass(summary.totalProfit)}">
                                    ¥${Utils.formatMoney(summary.totalProfit)}
                                </div>
                                <div class="stat-label">总盈亏</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value ${Utils.getProfitColorClass(summary.profitRate)}">
                                    ${Utils.formatPercent(summary.profitRate)}
                                </div>
                                <div class="stat-label">盈亏比例</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="filters">
                    <input type="text" class="search-input" placeholder="搜索股票代码或名称...">
                    <select class="filter-select" id="sort-select">
                        <option value="symbol">按代码排序</option>
                        <option value="totalCost">按成本排序</option>
                        <option value="currentValue">按市值排序</option>
                        <option value="unrealizedProfit">按盈亏排序</option>
                    </select>
                </div>
                
                <div class="holdings-list" id="holdings-list">
                    ${this.renderHoldingsList(holdings)}
                </div>
            </div>
        `;
    }

    // 加载统计页面
    loadStatistics() {
        const main = document.querySelector('.main-content');
        const stats = window.statisticsManager.getOverallStatistics();
        const profitDist = window.statisticsManager.getProfitDistribution();
        
        main.innerHTML = `
            <div class="statistics-page">
                <div class="page-header">
                    <h1>统计分析</h1>
                </div>
                
                <div class="stats-overview card">
                    <div class="card-header">
                        <h3>总体统计</h3>
                    </div>
                    <div class="card-body">
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-value">${stats.totalTransactions}</div>
                                <div class="stat-label">总交易次数</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">¥${Utils.formatMoney(stats.totalBuyAmount)}</div>
                                <div class="stat-label">总买入金额</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">¥${Utils.formatMoney(stats.totalSellAmount)}</div>
                                <div class="stat-label">总卖出金额</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">¥${Utils.formatMoney(stats.totalFees)}</div>
                                <div class="stat-label">总手续费</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="profit-distribution card">
                    <div class="card-header">
                        <h3>盈亏分布</h3>
                    </div>
                    <div class="card-body">
                        <div class="distribution-stats">
                            <div class="distribution-item">
                                <span class="label">盈利股票:</span>
                                <span class="value profit-positive">${profitDist.summary.profitableCount}只 (${Utils.formatPercent(profitDist.summary.profitableRate)})</span>
                            </div>
                            <div class="distribution-item">
                                <span class="label">亏损股票:</span>
                                <span class="value profit-negative">${profitDist.summary.losingCount}只</span>
                            </div>
                            <div class="distribution-item">
                                <span class="label">盈利总额:</span>
                                <span class="value profit-positive">¥${Utils.formatMoney(profitDist.summary.totalProfitFromWinners)}</span>
                            </div>
                            <div class="distribution-item">
                                <span class="label">亏损总额:</span>
                                <span class="value profit-negative">¥${Utils.formatMoney(Math.abs(profitDist.summary.totalLossFromLosers))}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="trading-activity card">
                    <div class="card-header">
                        <h3>交易活动</h3>
                    </div>
                    <div class="card-body">
                        <div class="activity-stats">
                            <div class="activity-item">
                                <span class="label">首次交易:</span>
                                <span class="value">${stats.firstTransactionDate || '无'}</span>
                            </div>
                            <div class="activity-item">
                                <span class="label">最近交易:</span>
                                <span class="value">${stats.lastTransactionDate || '无'}</span>
                            </div>
                            <div class="activity-item">
                                <span class="label">交易天数:</span>
                                <span class="value">${stats.tradingDays}天</span>
                            </div>
                            <div class="activity-item">
                                <span class="label">买入次数:</span>
                                <span class="value">${stats.buyCount}次</span>
                            </div>
                            <div class="activity-item">
                                <span class="label">卖出次数:</span>
                                <span class="value">${stats.sellCount}次</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 渲染持仓列表
    renderHoldingsList(holdings) {
        if (holdings.length === 0) {
            return '<div class="empty-state">暂无持仓数据</div>';
        }
        
        return holdings.map(holding => `
            <div class="holding-card card">
                <div class="card-body">
                    <div class="holding-header">
                        <div class="stock-info">
                            <span class="symbol">${holding.symbol}</span>
                            <span class="name">${holding.name}</span>
                        </div>
                        <div class="profit ${Utils.getProfitColorClass(holding.unrealizedProfit)}">
                            ${holding.unrealizedProfit >= 0 ? '+' : ''}¥${Utils.formatMoney(holding.unrealizedProfit)}
                        </div>
                    </div>
                    <div class="holding-details">
                        <div class="detail-row">
                            <span class="label">持仓数量:</span>
                            <span class="value">${holding.quantity}股</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">平均成本:</span>
                            <span class="value">¥${Utils.formatMoney(holding.avgCost)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">总成本:</span>
                            <span class="value">¥${Utils.formatMoney(holding.totalCost)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">市值:</span>
                            <span class="value">¥${Utils.formatMoney(holding.currentValue)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">盈亏比例:</span>
                            <span class="value ${Utils.getProfitColorClass(holding.unrealizedProfitRate)}">
                                ${Utils.formatPercent(holding.unrealizedProfitRate)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 加载交易记录页面
    loadTransactions() {
        const main = document.querySelector('.main-content');
        
        main.innerHTML = `
            <div class="transactions-page">
                <div class="page-header">
                    <h1>交易记录</h1>
                    <button class="btn btn-primary" data-nav="add-transaction">添加交易</button>
                </div>
                
                <div class="filters">
                    <input type="text" class="search-input" placeholder="搜索股票代码或名称...">
                    <select class="filter-select" id="type-filter">
                        <option value="">全部类型</option>
                        <option value="buy">买入</option>
                        <option value="sell">卖出</option>
                    </select>
                    <input type="date" class="filter-select" id="date-from">
                    <input type="date" class="filter-select" id="date-to">
                </div>
                
                <div class="transaction-list" id="transactions-list">
                    ${this.renderTransactionsList()}
                </div>
            </div>
        `;
        
        this.bindTransactionEvents();
    }

    // 渲染交易列表
    renderTransactionsList(page = 1, filters = {}) {
        const result = window.transactionManager.getTransactionsPaged(page, 20, filters);
        
        if (result.data.length === 0) {
            return '<div class="empty-state">暂无交易记录</div>';
        }
        
        let html = result.data.map(transaction => `
            <div class="transaction-card" data-id="${transaction.id}">
                <div class="transaction-header">
                    <div class="stock-info">
                        <span class="symbol">${transaction.symbol}</span>
                        <span class="name">${transaction.name}</span>
                    </div>
                    <div class="transaction-actions">
                        <button class="btn-icon edit-btn" data-id="${transaction.id}">编辑</button>
                        <button class="btn-icon delete-btn" data-id="${transaction.id}">删除</button>
                    </div>
                </div>
                <div class="transaction-body">
                    <div class="transaction-row">
                        <span class="label">类型:</span>
                        <span class="value type ${transaction.type}">
                            ${transaction.type === 'buy' ? '买入' : '卖出'}
                        </span>
                    </div>
                    <div class="transaction-row">
                        <span class="label">数量:</span>
                        <span class="value">${transaction.quantity}股</span>
                    </div>
                    <div class="transaction-row">
                        <span class="label">价格:</span>
                        <span class="value">¥${Utils.formatMoney(transaction.price)}</span>
                    </div>
                    <div class="transaction-row">
                        <span class="label">总额:</span>
                        <span class="value">¥${Utils.formatMoney(transaction.totalAmount)}</span>
                    </div>
                    <div class="transaction-row">
                        <span class="label">手续费:</span>
                        <span class="value">¥${Utils.formatMoney(transaction.fee)}</span>
                    </div>
                    <div class="transaction-row">
                        <span class="label">日期:</span>
                        <span class="value">${Utils.formatDate(transaction.date)}</span>
                    </div>
                    ${transaction.note ? `
                    <div class="transaction-row">
                        <span class="label">备注:</span>
                        <span class="value">${transaction.note}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
        // 添加分页
        if (result.pagination.totalPages > 1) {
            html += this.renderPagination(result.pagination);
        }
        
        return html;
    }

    // 渲染分页
    renderPagination(pagination) {
        const { page, totalPages } = pagination;
        let html = '<div class="pagination">';
        
        if (page > 1) {
            html += `<button class="btn btn-secondary" onclick="app.loadTransactionPage(${page - 1})">上一页</button>`;
        }
        
        html += `<span class="page-info">${page} / ${totalPages}</span>`;
        
        if (page < totalPages) {
            html += `<button class="btn btn-secondary" onclick="app.loadTransactionPage(${page + 1})">下一页</button>`;
        }
        
        html += '</div>';
        return html;
    }

    // 绑定添加交易页面事件
    bindAddTransactionEvents() {
        const form = document.querySelector('.transaction-form');
        const quantityInput = document.getElementById('quantity');
        const priceInput = document.getElementById('price');
        const feeInput = document.getElementById('fee');
        const typeSelect = document.getElementById('type');
        
        // 实时计算交易摘要
        const updateSummary = () => {
            const quantity = parseFloat(quantityInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            const fee = parseFloat(feeInput.value) || 0;
            const type = typeSelect.value;
            
            if (quantity > 0 && price > 0) {
                const amount = quantity * price;
                const totalAmount = type === 'buy' ? amount + fee : amount - fee;
                
                document.getElementById('transaction-summary').innerHTML = `
                    <div class="summary-card">
                        <div class="summary-row">
                            <span>成交金额:</span>
                            <span>¥${Utils.formatMoney(amount)}</span>
                        </div>
                        <div class="summary-row">
                            <span>手续费:</span>
                            <span>¥${Utils.formatMoney(fee)}</span>
                        </div>
                        <div class="summary-row total">
                            <span>总计:</span>
                            <span>¥${Utils.formatMoney(totalAmount)}</span>
                        </div>
                    </div>
                `;
            } else {
                document.getElementById('transaction-summary').innerHTML = '';
            }
        };
        
        [quantityInput, priceInput, feeInput, typeSelect].forEach(input => {
            input.addEventListener('input', updateSummary);
            input.addEventListener('change', updateSummary);
        });
    }

    // 检查是否首次使用
    checkFirstTime() {
        const transactions = window.transactionManager.getAllTransactions();
        if (transactions.length === 0) {
            Utils.showMessage('欢迎使用股票记录应用！点击添加按钮记录您的第一笔交易。', 'info');
        }
    }

    // 处理交易表单提交
    handleTransactionSubmit(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // 验证必填字段
        if (!data.symbol || !data.name || !data.type || !data.quantity || !data.price || !data.date) {
            Utils.showMessage('请填写所有必填字段', 'error');
            return;
        }
        
        const result = window.transactionManager.addTransaction(data);
        
        if (result.success) {
            Utils.showMessage(result.message, 'success');
            this.navigateTo('transactions');
        } else {
            Utils.showMessage(result.message, 'error');
        }
    }

    // 处理删除
    async handleDelete(button) {
        const id = button.getAttribute('data-id');
        const confirmed = await Utils.confirm('确定要删除这条交易记录吗？');
        
        if (confirmed) {
            const result = window.transactionManager.deleteTransaction(id);
            if (result.success) {
                Utils.showMessage(result.message, 'success');
                this.refreshCurrentPage();
            } else {
                Utils.showMessage(result.message, 'error');
            }
        }
    }

    // 处理编辑
    handleEdit(button) {
        const id = button.getAttribute('data-id');
        Utils.showMessage('编辑功能待实现', 'info');
    }

    // 处理搜索
    handleSearch(keyword) {
        this.currentFilters.symbol = keyword;
        if (this.currentPage === 'transactions') {
            this.updateTransactionList();
        }
    }

    // 处理筛选
    handleFilter() {
        const typeFilter = document.getElementById('type-filter');
        const dateFromFilter = document.getElementById('date-from');
        const dateToFilter = document.getElementById('date-to');
        
        this.currentFilters = {};
        
        if (typeFilter && typeFilter.value) {
            this.currentFilters.type = typeFilter.value;
        }
        if (dateFromFilter && dateFromFilter.value) {
            this.currentFilters.dateFrom = dateFromFilter.value;
        }
        if (dateToFilter && dateToFilter.value) {
            this.currentFilters.dateTo = dateToFilter.value;
        }
        
        if (this.currentPage === 'transactions') {
            this.updateTransactionList();
        }
    }

    // 更新交易列表
    updateTransactionList() {
        const listContainer = document.getElementById('transactions-list');
        if (listContainer) {
            listContainer.innerHTML = this.renderTransactionsList(1, this.currentFilters);
        }
    }

    // 刷新当前页面
    refreshCurrentPage() {
        this.navigateTo(this.currentPage);
    }

    // 绑定交易页面事件
    bindTransactionEvents() {
        // 可以在这里添加特定页面的事件绑定
    }

    // 加载交易页面
    loadTransactionPage(page) {
        const listContainer = document.getElementById('transactions-list');
        if (listContainer) {
            listContainer.innerHTML = this.renderTransactionsList(page, this.currentFilters);
        }
    }

    // 加载设置页面
    loadSettings() {
        const main = document.querySelector('.main-content');
        
        main.innerHTML = `
            <div class="settings-page">
                <div class="page-header">
                    <h1>设置</h1>
                </div>
                
                <div class="settings-section card">
                    <div class="card-header">
                        <h3>数据管理</h3>
                    </div>
                    <div class="card-body">
                        <div class="setting-item">
                            <button class="btn btn-secondary" onclick="app.exportData()">
                                导出数据
                            </button>
                            <p class="setting-desc">将所有数据导出为JSON文件</p>
                        </div>
                        
                        <div class="setting-item">
                            <input type="file" id="import-file" accept=".json" style="display: none;">
                            <button class="btn btn-secondary" onclick="document.getElementById('import-file').click()">
                                导入数据
                            </button>
                            <p class="setting-desc">从JSON文件导入数据</p>
                        </div>
                        
                        <div class="setting-item">
                            <button class="btn btn-danger" onclick="app.clearAllData()">
                                清空所有数据
                            </button>
                            <p class="setting-desc">删除所有交易记录和持仓信息</p>
                        </div>
                    </div>
                </div>
                
                <div class="app-info card">
                    <div class="card-header">
                        <h3>应用信息</h3>
                    </div>
                    <div class="card-body">
                        <div class="info-item">
                            <span class="label">版本:</span>
                            <span class="value">1.0.0</span>
                        </div>
                        <div class="info-item">
                            <span class="label">存储大小:</span>
                            <span class="value">${(window.storage.getStorageSize() / 1024).toFixed(2)} KB</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.bindSettingsEvents();
    }

    // 绑定设置页面事件
    bindSettingsEvents() {
        const importFile = document.getElementById('import-file');
        if (importFile) {
            importFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.importData(file);
                }
            });
        }
    }

    // 导出数据
    exportData() {
        const data = window.storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock-records-${Utils.formatDate(new Date()).replace(/-/g, '')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Utils.showMessage('数据导出成功', 'success');
    }

    // 导入数据
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const success = window.storage.importData(e.target.result);
                if (success) {
                    Utils.showMessage('数据导入成功', 'success');
                    this.refreshCurrentPage();
                } else {
                    Utils.showMessage('数据导入失败，请检查文件格式', 'error');
                }
            } catch (error) {
                Utils.showMessage('文件读取失败', 'error');
            }
        };
        reader.readAsText(file);
    }

    // 清空所有数据
    async clearAllData() {
        const confirmed = await Utils.confirm('确定要清空所有数据吗？此操作不可撤销！');
        if (confirmed) {
            window.storage.clearAllData();
            Utils.showMessage('所有数据已清空', 'success');
            this.refreshCurrentPage();
        }
    }
}

// 创建全局应用实例
window.app = new StockApp();