/**
 * 数据存储模块
 * 封装localStorage操作，提供统一的数据管理接口
 */

class StorageManager {
    constructor() {
        this.STORAGE_KEYS = {
            TRANSACTIONS: 'stock_transactions',
            PORTFOLIO: 'stock_portfolio',
            SETTINGS: 'stock_settings',
            STOCK_NAMES: 'stock_names_cache',
            BACKUP_DATE: 'last_backup_date'
        };
        
        this.DEFAULT_SETTINGS = {
            feeRate: 0.0003, // 万分之三
            currency: 'CNY',
            theme: 'light'
        };
    }

    /**
     * 保存交易记录
     * @param {Array} transactions 交易记录数组
     */
    saveTransactions(transactions) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
            return true;
        } catch (error) {
            console.error('保存交易记录失败:', error);
            return false;
        }
    }

    /**
     * 获取所有交易记录
     * @returns {Array} 交易记录数组
     */
    getTransactions() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.TRANSACTIONS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('获取交易记录失败:', error);
            return [];
        }
    }

    /**
     * 添加单条交易记录
     * @param {Object} transaction 交易记录对象
     * @returns {Object} 添加后的交易记录（包含生成的ID）
     */
    addTransaction(transaction) {
        const transactions = this.getTransactions();
        
        // 生成唯一ID
        const newTransaction = {
            id: this.generateId(),
            ...transaction,
            createdAt: new Date().toISOString()
        };
        
        transactions.push(newTransaction);
        
        if (this.saveTransactions(transactions)) {
            return newTransaction;
        }
        return null;
    }

    /**
     * 更新交易记录
     * @param {string} id 交易记录ID
     * @param {Object} updates 要更新的字段
     * @returns {boolean} 是否成功
     */
    updateTransaction(id, updates) {
        const transactions = this.getTransactions();
        const index = transactions.findIndex(t => t.id === id);
        
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updates };
            return this.saveTransactions(transactions);
        }
        return false;
    }

    /**
     * 删除交易记录
     * @param {string} id 交易记录ID
     * @returns {boolean} 是否成功
     */
    deleteTransaction(id) {
        const transactions = this.getTransactions();
        const filtered = transactions.filter(t => t.id !== id);
        
        if (filtered.length < transactions.length) {
            return this.saveTransactions(filtered);
        }
        return false;
    }

    /**
     * 获取持仓数据
     * @returns {Array} 持仓数据数组
     */
    getPortfolio() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.PORTFOLIO);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('获取持仓数据失败:', error);
            return [];
        }
    }

    /**
     * 保存持仓数据
     * @param {Array} portfolio 持仓数据数组
     * @returns {boolean} 是否成功
     */
    savePortfolio(portfolio) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.PORTFOLIO, JSON.stringify(portfolio));
            return true;
        } catch (error) {
            console.error('保存持仓数据失败:', error);
            return false;
        }
    }

    /**
     * 获取用户设置
     * @returns {Object} 用户设置对象
     */
    getSettings() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
            const saved = data ? JSON.parse(data) : {};
            return { ...this.DEFAULT_SETTINGS, ...saved };
        } catch (error) {
            console.error('获取设置失败:', error);
            return this.DEFAULT_SETTINGS;
        }
    }

    /**
     * 保存用户设置
     * @param {Object} settings 设置对象
     * @returns {boolean} 是否成功
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('保存设置失败:', error);
            return false;
        }
    }

    /**
     * 获取股票名称缓存
     * @returns {Object} 股票名称映射对象
     */
    getStockNames() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.STOCK_NAMES);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('获取股票名称缓存失败:', error);
            return {};
        }
    }

    /**
     * 保存股票名称到缓存
     * @param {string} code 股票代码
     * @param {string} name 股票名称
     */
    cacheStockName(code, name) {
        const cache = this.getStockNames();
        cache[code] = name;
        
        try {
            localStorage.setItem(this.STORAGE_KEYS.STOCK_NAMES, JSON.stringify(cache));
        } catch (error) {
            console.error('缓存股票名称失败:', error);
        }
    }

    /**
     * 获取股票名称
     * @param {string} code 股票代码
     * @returns {string} 股票名称
     */
    getStockName(code) {
        const cache = this.getStockNames();
        return cache[code] || code;
    }

    /**
     * 清空所有数据
     * @returns {boolean} 是否成功
     */
    clearAllData() {
        try {
            Object.values(this.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    }

    /**
     * 导出所有数据
     * @returns {Object} 所有数据对象
     */
    exportData() {
        return {
            transactions: this.getTransactions(),
            portfolio: this.getPortfolio(),
            settings: this.getSettings(),
            stockNames: this.getStockNames(),
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    /**
     * 导入数据
     * @param {Object} data 要导入的数据对象
     * @returns {boolean} 是否成功
     */
    importData(data) {
        try {
            if (data.transactions) {
                this.saveTransactions(data.transactions);
            }
            if (data.portfolio) {
                this.savePortfolio(data.portfolio);
            }
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            if (data.stockNames) {
                localStorage.setItem(this.STORAGE_KEYS.STOCK_NAMES, JSON.stringify(data.stockNames));
            }
            return true;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    generateId() {
        return 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 获取数据大小
     * @returns {Object} 各数据项大小
     */
    getDataSize() {
        const sizes = {};
        
        Object.keys(this.STORAGE_KEYS).forEach(key => {
            const data = localStorage.getItem(this.STORAGE_KEYS[key]);
            sizes[key] = data ? new Blob([data]).size : 0;
        });
        
        return sizes;
    }

    /**
     * 检查存储空间使用情况
     * @returns {Object} 存储使用情况
     */
    checkStorageUsage() {
        const usage = {};
        let total = 0;
        
        Object.keys(this.STORAGE_KEYS).forEach(key => {
            const size = this.getDataSize()[key];
            usage[key] = {
                size: size,
                formatted: this.formatBytes(size)
            };
            total += size;
        });
        
        return {
            total: total,
            formatted: this.formatBytes(total),
            details: usage,
            remaining: this.getRemainingSpace()
        };
    }

    /**
     * 格式化字节大小
     * @param {number} bytes 字节数
     * @returns {string} 格式化后的字符串
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 获取剩余存储空间（近似值）
     * @returns {string} 剩余空间提示
     */
    getRemainingSpace() {
        try {
            const testKey = '__storage_test__';
            const testData = 'a'.repeat(1000);
            let used = 0;
            
            // 简单估算
            Object.keys(this.STORAGE_KEYS).forEach(key => {
                const data = localStorage.getItem(this.STORAGE_KEYS[key]);
                if (data) used += data.length;
            });
            
            const estimatedRemaining = Math.max(0, 5000000 - used); // 约5MB限制
            return this.formatBytes(estimatedRemaining);
        } catch (error) {
            return '未知';
        }
    }

    /**
     * 备份数据到文件
     */
    backupToFile() {
        const data = this.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 从文件导入数据
     * @param {File} file 要导入的文件
     * @returns {Promise<boolean>} 导入结果
     */
    async importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    const result = this.importData(data);
                    resolve(result);
                } catch (error) {
                    console.error('解析导入文件失败:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('读取文件失败'));
            };
            
            reader.readAsText(file);
        });
    }
}

// 创建全局实例
const storage = new StorageManager();