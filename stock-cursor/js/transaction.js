// 交易记录管理
class TransactionManager {
    constructor() {
        this.storage = window.storage;
    }

    // 添加交易记录
    addTransaction(transactionData) {
        // 验证数据
        if (!this.validateTransaction(transactionData)) {
            return { success: false, message: '交易数据验证失败' };
        }

        // 计算总金额
        const amount = transactionData.quantity * transactionData.price;
        const totalAmount = transactionData.type === 'buy' 
            ? amount + (transactionData.fee || 0)
            : amount - (transactionData.fee || 0);

        const transaction = {
            symbol: transactionData.symbol.toUpperCase(),
            name: transactionData.name,
            type: transactionData.type,
            quantity: parseFloat(transactionData.quantity),
            price: parseFloat(transactionData.price),
            amount: amount,
            totalAmount: totalAmount,
            fee: parseFloat(transactionData.fee) || 0,
            date: transactionData.date,
            note: transactionData.note || ''
        };

        const success = this.storage.addTransaction(transaction);
        
        if (success) {
            // 更新持仓
            this.updateHoldings();
            return { success: true, message: '交易记录添加成功' };
        } else {
            return { success: false, message: '保存失败' };
        }
    }

    // 更新交易记录
    updateTransaction(id, updatedData) {
        if (!this.validateTransaction(updatedData)) {
            return { success: false, message: '交易数据验证失败' };
        }

        const amount = updatedData.quantity * updatedData.price;
        const totalAmount = updatedData.type === 'buy' 
            ? amount + (updatedData.fee || 0)
            : amount - (updatedData.fee || 0);

        const updates = {
            symbol: updatedData.symbol.toUpperCase(),
            name: updatedData.name,
            type: updatedData.type,
            quantity: parseFloat(updatedData.quantity),
            price: parseFloat(updatedData.price),
            amount: amount,
            totalAmount: totalAmount,
            fee: parseFloat(updatedData.fee) || 0,
            date: updatedData.date,
            note: updatedData.note || ''
        };

        const success = this.storage.updateTransaction(id, updates);
        
        if (success) {
            this.updateHoldings();
            return { success: true, message: '交易记录更新成功' };
        } else {
            return { success: false, message: '更新失败' };
        }
    }

    // 删除交易记录
    deleteTransaction(id) {
        const success = this.storage.deleteTransaction(id);
        if (success) {
            this.updateHoldings();
            return { success: true, message: '交易记录删除成功' };
        } else {
            return { success: false, message: '删除失败' };
        }
    }

    // 获取所有交易记录
    getAllTransactions() {
        return this.storage.getTransactions();
    }

    // 根据股票代码获取交易记录
    getTransactionsBySymbol(symbol) {
        const transactions = this.getAllTransactions();
        return transactions.filter(t => t.symbol === symbol.toUpperCase());
    }

    // 获取交易记录（分页）
    getTransactionsPaged(page = 1, pageSize = 20, filters = {}) {
        let transactions = this.getAllTransactions();
        
        // 应用筛选
        if (filters.symbol) {
            transactions = transactions.filter(t => 
                t.symbol.includes(filters.symbol.toUpperCase())
            );
        }
        if (filters.type) {
            transactions = transactions.filter(t => t.type === filters.type);
        }
        if (filters.dateFrom) {
            transactions = transactions.filter(t => t.date >= filters.dateFrom);
        }
        if (filters.dateTo) {
            transactions = transactions.filter(t => t.date <= filters.dateTo);
        }

        // 按日期倒序排列
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 分页
        const total = transactions.length;
        const totalPages = Math.ceil(total / pageSize);
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const data = transactions.slice(start, end);

        return {
            data,
            pagination: {
                page,
                pageSize,
                total,
                totalPages
            }
        };
    }

    // 更新持仓信息
    updateHoldings() {
        const transactions = this.getAllTransactions();
        const holdings = {};

        // 按股票代码分组计算持仓
        transactions.forEach(transaction => {
            const symbol = transaction.symbol;
            
            if (!holdings[symbol]) {
                holdings[symbol] = {
                    symbol: symbol,
                    name: transaction.name,
                    quantity: 0,
                    totalCost: 0,
                    avgCost: 0,
                    totalBuyQuantity: 0,
                    totalSellQuantity: 0,
                    realizedProfit: 0,
                    lastTransactionDate: transaction.date
                };
            }

            const holding = holdings[symbol];
            
            if (transaction.type === 'buy') {
                holding.quantity += transaction.quantity;
                holding.totalCost += transaction.totalAmount;
                holding.totalBuyQuantity += transaction.quantity;
            } else if (transaction.type === 'sell') {
                // 计算已实现盈亏（简化计算：按平均成本）
                const avgCost = holding.totalCost / holding.quantity;
                const sellValue = transaction.quantity * transaction.price - transaction.fee;
                const sellCost = transaction.quantity * avgCost;
                holding.realizedProfit += (sellValue - sellCost);
                
                holding.quantity -= transaction.quantity;
                holding.totalCost -= sellCost;
                holding.totalSellQuantity += transaction.quantity;
            }

            // 更新平均成本
            if (holding.quantity > 0) {
                holding.avgCost = holding.totalCost / holding.quantity;
            } else {
                holding.avgCost = 0;
            }

            // 更新最后交易日期
            if (transaction.date > holding.lastTransactionDate) {
                holding.lastTransactionDate = transaction.date;
            }
        });

        // 移除已清仓的股票（数量为0或负数）
        Object.keys(holdings).forEach(symbol => {
            if (holdings[symbol].quantity <= 0) {
                delete holdings[symbol];
            }
        });

        this.storage.saveHoldings(holdings);
        return holdings;
    }

    // 验证交易数据
    validateTransaction(data) {
        if (!data.symbol || !Utils.validateStockCode(data.symbol)) {
            return false;
        }
        if (!data.name || data.name.trim() === '') {
            return false;
        }
        if (!data.type || !['buy', 'sell'].includes(data.type)) {
            return false;
        }
        if (!Utils.validateNumber(data.quantity, 0.01)) {
            return false;
        }
        if (!Utils.validateNumber(data.price, 0.01)) {
            return false;
        }
        if (!data.date) {
            return false;
        }
        return true;
    }

    // 获取交易统计
    getTransactionStats() {
        const transactions = this.getAllTransactions();
        const holdings = this.storage.getHoldings();
        
        let totalBuyAmount = 0;
        let totalSellAmount = 0;
        let totalFees = 0;
        let totalRealizedProfit = 0;
        let totalUnrealizedValue = 0; // 这里无法获取实时价格，暂时用成本价

        transactions.forEach(t => {
            totalFees += t.fee;
            if (t.type === 'buy') {
                totalBuyAmount += t.totalAmount;
            } else {
                totalSellAmount += t.amount - t.fee;
            }
        });

        Object.values(holdings).forEach(h => {
            totalRealizedProfit += h.realizedProfit;
            totalUnrealizedValue += h.quantity * h.avgCost;
        });

        return {
            totalTransactions: transactions.length,
            totalBuyAmount,
            totalSellAmount,
            totalFees,
            totalRealizedProfit,
            totalUnrealizedValue,
            holdingsCount: Object.keys(holdings).length
        };
    }
}

// 创建全局实例
window.transactionManager = new TransactionManager();