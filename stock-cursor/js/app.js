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