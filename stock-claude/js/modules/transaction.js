/**
 * 交易记录管理模块
 * 处理交易记录的增删改查操作
 */

class TransactionManager {
    constructor() {
        this.transactions = storage.getTransactions();
        this.listeners = [];
    }

    /**
     * 添加交易记录
     * @param {Object} transactionData 交易数据
     * @returns {Object} 添加的交易记录
     */
    addTransaction(transactionData) {
        const transaction = {
            stockCode: transactionData.stockCode,
            stockName: transactionData.stockName || storage.getStockName(transactionData.stockCode),
            type: transactionData.type,
            price: parseFloat(transactionData.price),
            quantity: parseInt(transactionData.quantity),
            amount: parseFloat(transactionData.price) * parseInt(transactionData.quantity),
            fee: parseFloat(transactionData.fee || 0),
            date: transactionData.date,
            note: transactionData.note || '',
            tags: transactionData.tags || []
        };

        // 验证数据
        if (!this.validateTransaction(transaction)) {
            throw new Error('交易数据验证失败');
        }

        // 检查卖出数量是否超过持仓
        if (transaction.type === 'sell') {
            const availableQuantity = this.getAvailableQuantity(transaction.stockCode);
            if (transaction.quantity > availableQuantity) {
                throw new Error(`卖出数量超过可卖数量，当前可卖：${availableQuantity}股`);
            }
        }

        const savedTransaction = storage.addTransaction(transaction);
        if (savedTransaction) {
            this.transactions = storage.getTransactions();
            this.notifyListeners();
            return savedTransaction;
        }
        return null;
    }

    /**
     * 更新交易记录
     * @param {string} id 交易记录ID
     * @param {Object} updates 更新数据
     * @returns {boolean} 是否成功
     */
    updateTransaction(id, updates) {
        const index = this.transactions.findIndex(t => t.id === id);
        if (index === -1) {
            return false;
        }

        const updatedTransaction = {
            ...this.transactions[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        if (!this.validateTransaction(updatedTransaction)) {
            throw new Error('交易数据验证失败');
        }

        const success = storage.updateTransaction(id, updatedTransaction);
        if (success) {
            this.transactions = storage.getTransactions();
            this.notifyListeners();
        }
        return success;
    }

    /**
     * 删除交易记录
     * @param {string} id 交易记录ID
     * @returns {boolean} 是否成功
     */
    deleteTransaction(id) {
        const transaction = this.getTransaction(id);
        if (!transaction) {
            return false;
        }

        // 检查是否可以删除（卖出记录需要对应的买入记录）
        if (transaction.type === 'sell') {
            const relatedTransactions = this.getRelatedTransactions(transaction);
            if (relatedTransactions.length > 0) {
                throw new Error('该卖出记录有关联的买入记录，无法删除');
            }
        }

        const success = storage.deleteTransaction(id);
        if (success) {
            this.transactions = storage.getTransactions();
            this.notifyListeners();
        }
        return success;
    }

    /**
     * 获取所有交易记录
     * @param {Object} filters 筛选条件
     * @returns {Array} 交易记录数组
     */
    getTransactions(filters = {}) {
        let filteredTransactions = [...this.transactions];

        // 按股票代码筛选
        if (filters.stockCode) {
            filteredTransactions = filteredTransactions.filter(t => 
                t.stockCode === filters.stockCode
            );
        }

        // 按交易类型筛选
        if (filters.type) {
            filteredTransactions = filteredTransactions.filter(t => 
                t.type === filters.type
            );
        }

        // 按日期范围筛选
        if (filters.startDate) {
            filteredTransactions = filteredTransactions.filter(t => 
                new Date(t.date) >= new Date(filters.startDate)
            );
        }

        if (filters.endDate) {
            filteredTransactions = filteredTransactions.filter(t => 
                new Date(t.date) <= new Date(filters.endDate)
            );
        }

        // 按日期排序（最新的在前）
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        return filteredTransactions;
    }

    /**
     * 获取单条交易记录
     * @param {string} id 交易记录ID
     * @returns {Object} 交易记录
     */
    getTransaction(id) {
        return this.transactions.find(t => t.id === id);
    }

    /**
     * 获取某只股票的交易记录
     * @param {string} stockCode 股票代码
     * @returns {Array} 交易记录数组
     */
    getStockTransactions(stockCode) {
        return this.transactions.filter(t => t.stockCode === stockCode);
    }

    /**
     * 获取可卖出数量
     * @param {string} stockCode 股票代码
     * @returns {number} 可卖出数量
     */
    getAvailableQuantity(stockCode) {
        const stockTransactions = this.getStockTransactions(stockCode);
        let totalBuy = 0;
        let totalSell = 0;

        stockTransactions.forEach(transaction => {
            if (transaction.type === 'buy') {
                totalBuy += transaction.quantity;
            } else if (transaction.type === 'sell') {
                totalSell += transaction.quantity;
            }
        });

        return Math.max(0, totalBuy - totalSell);
    }

    /**
     * 获取相关交易记录
     * @param {Object} transaction 交易记录
     * @returns {Array} 相关交易记录
     */
    getRelatedTransactions(transaction) {
        if (transaction.type !== 'sell') {
            return [];
        }

        // 获取该股票的所有交易记录
        const stockTransactions = this.getStockTransactions(transaction.stockCode);
        
        // 筛选出在该卖出交易之前的买入记录
        return stockTransactions.filter(t => 
            t.type === 'buy' && 
            new Date(t.date) <= new Date(transaction.date)
        );
    }

    /**
     * 验证交易数据
     * @param {Object} transaction 交易数据
     * @returns {boolean} 是否有效
     */
    validateTransaction(transaction) {
        if (!transaction.stockCode || transaction.stockCode.trim() === '') {
            return false;
        }

        if (!transaction.type || !['buy', 'sell'].includes(transaction.type)) {
            return false;
        }

        if (!transaction.price || transaction.price <= 0) {
            return false;
        }

        if (!transaction.quantity || transaction.quantity <= 0) {
            return false;
        }

        if (!transaction.date) {
            return false;
        }

        return true;
    }

    /**
     * 搜索交易记录
     * @param {string} keyword 搜索关键词
     * @returns {Array} 搜索结果
     */
    searchTransactions(keyword) {
        if (!keyword || keyword.trim() === '') {
            return this.getTransactions();
        }

        const searchTerm = keyword.toLowerCase();
        
        return this.transactions.filter(transaction => 
            transaction.stockCode.toLowerCase().includes(searchTerm) ||
            transaction.stockName.toLowerCase().includes(searchTerm) ||
            (transaction.note && transaction.note.toLowerCase().includes(searchTerm))
        );
    }

    /**
     * 获取交易统计
     * @returns {Object} 交易统计数据
     */
    getTransactionStats() {
        const totalTransactions = this.transactions.length;
        const buyTransactions = this.transactions.filter(t => t.type === 'buy').length;
        const sellTransactions = this.transactions.filter(t => t.type === 'sell').length;
        
        const totalAmount = this.transactions.reduce((sum, t) => sum + t.amount, 0);
        const totalFee = this.transactions.reduce((sum, t) => sum + (t.fee || 0), 0);
        
        return {
            totalTransactions,
            buyTransactions,
            sellTransactions,
            totalAmount,
            totalFee,
            averageAmount: totalTransactions > 0 ? totalAmount / totalTransactions : 0
        };
    }

    /**
     * 获取交易记录摘要
     * @returns {Object} 交易记录摘要
     */
    getTransactionSummary() {
        const stats = this.getTransactionStats();
        const latestTransaction = this.transactions[0];
        const oldestTransaction = this.transactions[this.transactions.length - 1];
        
        return {
            ...stats,
            latestTransaction: latestTransaction,
            oldestTransaction: oldestTransaction,
            dateRange: oldestTransaction && latestTransaction ? {
                start: oldestTransaction.date,
                end: latestTransaction.date
            } : null
        };
    }

    /**
     * 添加数据变更监听器
     * @param {Function} callback 回调函数
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * 移除数据变更监听器
     * @param {Function} callback 回调函数
     */
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * 通知监听器数据变更
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.transactions);
            } catch (error) {
                console.error('通知监听器失败:', error);
            }
        });
    }

    /**
     * 清空所有交易记录
     * @returns {boolean} 是否成功
     */
    clearAllTransactions() {
        const success = storage.saveTransactions([]);
        if (success) {
            this.transactions = [];
            this.notifyListeners();
        }
        return success;
    }

    /**
     * 导出交易记录
     * @returns {string} CSV格式的交易记录
     */
    exportToCSV() {
        const headers = ['股票代码', '股票名称', '交易类型', '价格', '数量', '金额', '手续费', '日期', '备注'];
        const rows = this.transactions.map(t => [
            t.stockCode,
            t.stockName,
            t.type === 'buy' ? '买入' : '卖出',
            t.price,
            t.quantity,
            t.amount,
            t.fee || 0,
            t.date,
            t.note || ''
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        return csvContent;
    }

    /**
     * 获取交易记录按日期分组
     * @returns {Object} 按日期分组的交易记录
     */
    getTransactionsByDate() {
        const grouped = {};
        
        this.transactions.forEach(transaction => {
            const date = transaction.date;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(transaction);
        });
        
        return grouped;
    }
}

// 创建全局实例
const transactionManager = new TransactionManager();