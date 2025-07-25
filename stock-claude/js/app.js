/**
 * 主应用入口
 * 负责应用的初始化和UI控制
 */

class StockApp {
    constructor() {
        this.currentPage = 'portfolio';
        this.isModalOpen = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.loadInitialData();
        this.checkPWA();
        
        // 监听数据变化
        portfolioManager.addListener(() => {
            this.updateUI();
        });
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 底部导航
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                if (page && page !== 'add') {
                    this.navigateTo(page);
                } else if (page === 'add') {
                    this.showAddTransaction();
                }
            });
        });

        // 添加交易表单
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddTransaction();
        });

        // 股票代码输入监听
        document.getElementById('stockCode').addEventListener('input', (e) => {
            this.updateStockName(e.target.value);
        });

        // 交易类型切换
        document.querySelectorAll('input[name="transactionType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updateTransactionType(e.target.value);
            });
        });

        // 搜索功能
        document.getElementById('stockSearch').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // 设置功能
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.navigateTo('settings');
        });

        // 模态框关闭
        document.querySelector('.modal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        // 设置页面按钮
        document.querySelectorAll('.setting-item button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleSettingAction(e.target.textContent);
            });
        });
    }

    /**
     * 设置导航
     */
    setupNavigation() {
        // 处理浏览器返回按钮
        window.addEventListener('popstate', (e) => {
            const page = e.state?.page || 'portfolio';
            this.showPage(page);
        });
    }

    /**
     * 加载初始数据
     */
    loadInitialData() {
        this.updateUI();
        this.setDefaultDate();
    }

    /**
     * 设置默认日期
     */
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('transactionDate').value = today;
    }

    /**
     * 导航到指定页面
     * @param {string} page 页面名称
     */
    navigateTo(page) {
        this.currentPage = page;
        this.showPage(page);
        
        // 更新URL但不刷新页面
        history.pushState({ page }, '', `#/${page}`);
        
        // 更新导航状态
        this.updateNavigationState(page);
    }

    /**
     * 显示指定页面
     * @param {string} page 页面名称
     */
    showPage(page) {
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
        
        // 显示当前页面
        switch (page) {
            case 'portfolio':
                document.querySelector('.portfolio-section').style.display = 'block';
                break;
            case 'transactions':
                document.getElementById('transactionsPage').style.display = 'block';
                this.renderTransactions();
                break;
            case 'analysis':
                document.getElementById('analysisPage').style.display = 'block';
                this.renderAnalysis();
                break;
            case 'settings':
                document.getElementById('settingsPage').style.display = 'block';
                this.renderSettings();
                break;
            default:
                document.querySelector('.portfolio-section').style.display = 'block';
        }
    }

    /**
     * 更新导航状态
     * @param {string} activePage 当前页面
     */
    updateNavigationState(activePage) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === activePage) {
                item.classList.add('active');
            }
        });
    }

    /**
     * 更新UI显示
     */
    updateUI() {
        this.renderPortfolio();
        this.renderSummary();
    }

    /**
     * 渲染持仓列表
     */
    renderPortfolio() {
        const portfolio = portfolioManager.getPortfolio();
        const portfolioList = document.getElementById('portfolioList');
        
        if (portfolio.length === 0) {
            portfolioList.innerHTML = `
                <div class="empty-state">
                    <p>暂无持仓记录</p>
                    <button class="btn-primary" onclick="app.showAddTransaction()">添加第一笔交易</button>
                </div>
            `;
            return;
        }

        portfolioList.innerHTML = portfolio.map(stock => `
            <div class="stock-card" onclick="app.showStockDetail('${stock.stockCode}')">
                <div class="stock-header">
                    <div>
                        <div class="stock-code">${stock.stockCode}</div>
                        <div class="stock-name">${stock.stockName}</div>
                    </div>
                    <div class="stock-profit ${stock.totalProfit >= 0 ? 'positive' : 'negative'}">
                        ${stock.totalProfit >= 0 ? '+' : ''}${calculator.formatCurrency(stock.totalProfit)}
                    </div>
                </div>
                <div class="stock-details">
                    <div class="stock-detail-item">
                        <span class="stock-detail-label">持仓</span>
                        <span class="stock-detail-value">${stock.totalQuantity}股</span>
                    </div>
                    <div class="stock-detail-item">
                        <span class="stock-detail-label">成本价</span>
                        <span class="stock-detail-value">${calculator.formatCurrency(stock.avgPrice)}</span>
                    </div>
                    <div class="stock-detail-item">
                        <span class="stock-detail-label">市值</span>
                        <span class="stock-detail-value">${calculator.formatCurrency(stock.totalValue)}</span>
                    </div>
                    <div class="stock-detail-item">
                        <span class="stock-detail-label">盈亏率</span>
                        <span class="stock-detail-value ${stock.profitRate >= 0 ? 'positive' : 'negative'}">
                            ${stock.profitRate >= 0 ? '+' : ''}${calculator.formatPercent(stock.profitRate)}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * 渲染总结数据
     */
    renderSummary() {
        const stats = portfolioManager.getPortfolioStats();
        
        const totalProfitElement = document.getElementById('totalProfit');
        const profitRateElement = document.getElementById('profitRate');
        
        totalProfitElement.textContent = calculator.formatCurrency(stats.totalProfit);
        profitRateElement.textContent = calculator.formatPercent(stats.profitRate);
        
        totalProfitElement.className = `total-profit ${stats.totalProfit >= 0 ? 'positive' : 'negative'}`;
        profitRateElement.className = `profit-rate ${stats.totalProfit >= 0 ? 'positive' : 'negative'}`;
    }

    /**
     * 渲染交易历史
     */
    renderTransactions() {
        const transactions = transactionManager.getTransactions();
        const transactionsList = document.getElementById('transactionsList');
        
        if (transactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <p>暂无交易记录</p>
                    <button class="btn-primary" onclick="app.showAddTransaction()">添加交易记录</button>
                </div>
            `;
            return;
        }

        transactionsList.innerHTML = transactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-header">
                    <span class="transaction-type ${transaction.type}">
                        ${transaction.type === 'buy' ? '买入' : '卖出'}
                    </span>
                    <span class="transaction-date">${transaction.date}</span>
                </div>
                <div class="transaction-details">
                    <div>
                        <strong>${transaction.stockName}(${transaction.stockCode})</strong>
                        ${transaction.note ? `<br><small>${transaction.note}</small>` : ''}
                    </div>
                    <div class="transaction-amount">
                        ${transaction.quantity}股 × ${calculator.formatCurrency(transaction.price)}<br>
                        ${calculator.formatCurrency(transaction.amount)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * 渲染分析数据
     */
    renderAnalysis() {
        const portfolio = portfolioManager.getPortfolio();
        const stats = portfolioManager.getPortfolioStats();
        const distribution = portfolioManager.getPortfolioDistribution();
        
        // 这里可以添加图表渲染逻辑
        this.renderAnalysisStats(stats, distribution);
    }

    /**
     * 渲染分析统计
     * @param {Object} stats 统计数据
     * @param {Array} distribution 分布数据
     */
    renderAnalysisStats(stats, distribution) {
        const statsContainer = document.getElementById('analysisStats');
        
        statsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${portfolioManager.getPortfolio().length}</div>
                <div class="stat-label">持仓股票</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${calculator.formatCurrency(stats.totalValue)}</div>
                <div class="stat-label">总市值</div>
            </div>
            <div class="stat-item">
                <div class="stat-value ${stats.totalProfit >= 0 ? 'positive' : 'negative'}">${calculator.formatCurrency(stats.totalProfit)}</div>
                <div class="stat-label">总盈亏</div>
            </div>
            <div class="stat-item">
                <div class="stat-value ${stats.profitRate >= 0 ? 'positive' : 'negative'}">${calculator.formatPercent(stats.profitRate)}</div>
                <div class="stat-label">盈亏率</div>
            </div>
        `;
    }

    /**
     * 渲染设置页面
     */
    renderSettings() {
        const settings = storage.getSettings();
        document.getElementById('feeRate').value = settings.feeRate * 100;
    }

    /**
     * 显示添加交易模态框
     */
    showAddTransaction() {
        document.getElementById('transactionModal').classList.add('show');
        this.isModalOpen = true;
    }

    /**
     * 关闭模态框
     */
    closeModal() {
        document.getElementById('transactionModal').classList.remove('show');
        this.isModalOpen = false;
        document.getElementById('transactionForm').reset();
        this.setDefaultDate();
    }

    /**
     * 处理添加交易
     */
    handleAddTransaction() {
        const formData = new FormData(document.getElementById('transactionForm'));
        
        const transaction = {
            stockCode: formData.get('stockCode'),
            type: formData.get('transactionType'),
            price: parseFloat(formData.get('price')),
            quantity: parseInt(formData.get('quantity')),
            fee: parseFloat(formData.get('fee')),
            date: formData.get('transactionDate'),
            note: formData.get('note')
        };

        try {
            transactionManager.addTransaction(transaction);
            this.closeModal();
            this.showNotification('交易记录添加成功', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    /**
     * 更新股票名称
     * @param {string} stockCode 股票代码
     */
    updateStockName(stockCode) {
        const nameDisplay = document.getElementById('stockName');
        if (stockCode.trim()) {
            const stockName = storage.getStockName(stockCode);
            nameDisplay.textContent = stockName;
            
            // 如果找到股票名称，缓存它
            if (stockName !== stockCode) {
                storage.cacheStockName(stockCode, stockName);
            }
        } else {
            nameDisplay.textContent = '';
        }
    }

    /**
     * 更新交易类型
     * @param {string} type 交易类型
     */
    updateTransactionType(type) {
        // 可以根据交易类型调整UI
        console.log('Transaction type changed to:', type);
    }

    /**
     * 处理搜索
     * @param {string} keyword 搜索关键词
     */
    handleSearch(keyword) {
        const filteredPortfolio = portfolioManager.searchPortfolio(keyword);
        this.renderFilteredPortfolio(filteredPortfolio);
    }

    /**
     * 渲染过滤后的持仓
     * @param {Array} portfolio 过滤后的持仓
     */
    renderFilteredPortfolio(portfolio) {
        const portfolioList = document.getElementById('portfolioList');
        
        if (portfolio.length === 0) {
            portfolioList.innerHTML = `
                <div class="empty-state">
                    <p>未找到相关股票</p>
                </div>
            `;
            return;
        }

        // 复用renderPortfolio的逻辑，但使用过滤后的数据
        this.portfolio = portfolio;
        this.renderPortfolio();
    }

    /**
     * 处理设置操作
     * @param {string} action 操作类型
     */
    handleSettingAction(action) {
        switch (action) {
            case '导出数据':
                this.exportData();
                break;
            case '导入数据':
                this.importData();
                break;
            case '清空所有数据':
                this.clearAllData();
                break;
        }
    }

    /**
     * 导出数据
     */
    exportData() {
        storage.backupToFile();
        this.showNotification('数据导出成功', 'success');
    }

    /**
     * 导入数据
     */
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    await storage.importFromFile(file);
                    this.showNotification('数据导入成功', 'success');
                    this.updateUI();
                } catch (error) {
                    this.showNotification('数据导入失败: ' + error.message, 'error');
                }
            }
        };
        
        input.click();
    }

    /**
     * 清空所有数据
     */
    clearAllData() {
        if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
            storage.clearAllData();
            this.updateUI();
            this.showNotification('所有数据已清空', 'warning');
        }
    }

    /**
     * 显示通知
     * @param {string} message 消息内容
     * @param {string} type 消息类型
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 3000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * 检查PWA支持
     */
    checkPWA() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(registration => console.log('Service Worker registered'))
                .catch(error => console.log('Service Worker registration failed'));
        }

        // 检查是否已安装
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });
    }

    /**
     * 显示安装提示
     */
    showInstallPrompt() {
        // 这里可以添加安装提示UI
        console.log('App can be installed');
    }

    /**
     * 显示股票详情
     * @param {string} stockCode 股票代码
     */
    showStockDetail(stockCode) {
        const position = portfolioManager.getStockPosition(stockCode);
        if (position) {
            alert(`
股票详情：
代码：${position.stockCode}
名称：${position.stockName}
持仓：${position.totalQuantity}股
成本价：${calculator.formatCurrency(position.avgPrice)}
当前价：${calculator.formatCurrency(position.currentPrice)}
市值：${calculator.formatCurrency(position.totalValue)}
盈亏：${calculator.formatCurrency(position.totalProfit)}
盈亏率：${calculator.formatPercent(position.profitRate)}
            `);
        }
    }
}

// 创建全局应用实例
const app = new StockApp();

// 全局函数
function showAddTransaction() {
    app.showAddTransaction();
}

function closeModal() {
    app.closeModal();
}

function exportData() {
    app.exportData();
}

function importData() {
    app.importData();
}

function clearAllData() {
    app.clearAllData();
}