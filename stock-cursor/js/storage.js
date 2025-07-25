// 本地存储管理
class StorageManager {
    constructor() {
        this.keys = {
            transactions: 'stock_transactions',
            holdings: 'stock_holdings',
            settings: 'stock_settings'
        };
        this.init();
    }

    // 初始化存储
    init() {
        if (!this.getTransactions()) {
            this.saveTransactions([]);
        }
        if (!this.getHoldings()) {
            this.saveHoldings({});
        }
        if (!this.getSettings()) {
            this.saveSettings({
                currency: 'CNY',
                theme: 'light',
                autoBackup: true
            });
        }
    }

    // 保存数据到localStorage
    saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    }

    // 从localStorage读取数据
    loadData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('读取数据失败:', error);
            return null;
        }
    }

    // 交易记录相关
    getTransactions() {
        return this.loadData(this.keys.transactions) || [];
    }

    saveTransactions(transactions) {
        return this.saveData(this.keys.transactions, transactions);
    }

    addTransaction(transaction) {
        const transactions = this.getTransactions();
        transaction.id = Utils.generateId();
        transaction.createTime = new Date().toISOString();
        transactions.push(transaction);
        return this.saveTransactions(transactions);
    }

    updateTransaction(id, updatedTransaction) {
        const transactions = this.getTransactions();
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updatedTransaction };
            return this.saveTransactions(transactions);
        }
        return false;
    }

    deleteTransaction(id) {
        const transactions = this.getTransactions();
        const filteredTransactions = transactions.filter(t => t.id !== id);
        return this.saveTransactions(filteredTransactions);
    }

    // 持仓相关
    getHoldings() {
        return this.loadData(this.keys.holdings) || {};
    }

    saveHoldings(holdings) {
        return this.saveData(this.keys.holdings, holdings);
    }

    // 设置相关
    getSettings() {
        return this.loadData(this.keys.settings) || {};
    }

    saveSettings(settings) {
        return this.saveData(this.keys.settings, settings);
    }

    // 数据导出
    exportData() {
        const data = {
            transactions: this.getTransactions(),
            holdings: this.getHoldings(),
            settings: this.getSettings(),
            exportTime: new Date().toISOString(),
            version: '1.0'
        };
        return JSON.stringify(data, null, 2);
    }

    // 数据导入
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.transactions) {
                this.saveTransactions(data.transactions);
            }
            if (data.holdings) {
                this.saveHoldings(data.holdings);
            }
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            
            return true;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }

    // 清空所有数据
    clearAllData() {
        localStorage.removeItem(this.keys.transactions);
        localStorage.removeItem(this.keys.holdings);
        localStorage.removeItem(this.keys.settings);
        this.init();
    }

    // 获取存储大小
    getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length;
            }
        }
        return total;
    }
}

// 创建全局实例
window.storage = new StorageManager();