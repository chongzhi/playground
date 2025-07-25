// 持仓管理
class HoldingsManager {
    constructor() {
        this.storage = window.storage;
    }

    // 获取所有持仓
    getAllHoldings() {
        return this.storage.getHoldings();
    }

    // 获取特定股票的持仓
    getHoldingBySymbol(symbol) {
        const holdings = this.getAllHoldings();
        return holdings[symbol.toUpperCase()] || null;
    }

    // 获取持仓概况
    getHoldingsSummary() {
        const holdings = this.getAllHoldings();
        const holdingsList = Object.values(holdings);
        
        let totalValue = 0;
        let totalCost = 0;
        let totalRealizedProfit = 0;
        
        holdingsList.forEach(holding => {
            totalCost += holding.totalCost;
            totalValue += holding.quantity * holding.avgCost; // 无实时价格，暂用成本价
            totalRealizedProfit += holding.realizedProfit;
        });

        const unrealizedProfit = totalValue - totalCost;
        const totalProfit = totalRealizedProfit + unrealizedProfit;
        const profitRate = totalCost > 0 ? (totalProfit / totalCost) : 0;

        return {
            holdingsCount: holdingsList.length,
            totalValue,
            totalCost,
            totalRealizedProfit,
            unrealizedProfit,
            totalProfit,
            profitRate
        };
    }

    // 获取持仓列表（带排序）
    getHoldingsList(sortBy = 'symbol', sortOrder = 'asc') {
        const holdings = this.getAllHoldings();
        const holdingsList = Object.values(holdings);

        // 为每个持仓添加计算字段
        holdingsList.forEach(holding => {
            holding.currentValue = holding.quantity * holding.avgCost; // 暂用成本价
            holding.unrealizedProfit = holding.currentValue - holding.totalCost;
            holding.unrealizedProfitRate = holding.totalCost > 0 ? 
                (holding.unrealizedProfit / holding.totalCost) : 0;
            holding.totalProfit = holding.realizedProfit + holding.unrealizedProfit;
            holding.totalProfitRate = holding.totalCost > 0 ? 
                (holding.totalProfit / holding.totalCost) : 0;
        });

        // 排序
        holdingsList.sort((a, b) => {
            let aValue, bValue;
            
            switch(sortBy) {
                case 'symbol':
                    aValue = a.symbol;
                    bValue = b.symbol;
                    break;
                case 'name':
                    aValue = a.name;
                    bValue = b.name;
                    break;
                case 'quantity':
                    aValue = a.quantity;
                    bValue = b.quantity;
                    break;
                case 'avgCost':
                    aValue = a.avgCost;
                    bValue = b.avgCost;
                    break;
                case 'totalCost':
                    aValue = a.totalCost;
                    bValue = b.totalCost;
                    break;
                case 'currentValue':
                    aValue = a.currentValue;
                    bValue = b.currentValue;
                    break;
                case 'unrealizedProfit':
                    aValue = a.unrealizedProfit;
                    bValue = b.unrealizedProfit;
                    break;
                case 'totalProfit':
                    aValue = a.totalProfit;
                    bValue = b.totalProfit;
                    break;
                case 'lastTransactionDate':
                    aValue = new Date(a.lastTransactionDate);
                    bValue = new Date(b.lastTransactionDate);
                    break;
                default:
                    aValue = a.symbol;
                    bValue = b.symbol;
            }

            if (typeof aValue === 'string') {
                const comparison = aValue.localeCompare(bValue);
                return sortOrder === 'asc' ? comparison : -comparison;
            } else {
                return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
            }
        });

        return holdingsList;
    }

    // 搜索持仓
    searchHoldings(keyword) {
        const holdings = this.getAllHoldings();
        const holdingsList = Object.values(holdings);
        
        if (!keyword) return holdingsList;
        
        const searchTerm = keyword.toLowerCase();
        return holdingsList.filter(holding => 
            holding.symbol.toLowerCase().includes(searchTerm) ||
            holding.name.toLowerCase().includes(searchTerm)
        );
    }

    // 获取单个持仓的详细交易历史
    getHoldingTransactionHistory(symbol) {
        const transactions = window.transactionManager.getTransactionsBySymbol(symbol);
        
        // 按日期正序排列，计算累计持仓
        transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let cumulativeQuantity = 0;
        let cumulativeCost = 0;
        
        const history = transactions.map(transaction => {
            if (transaction.type === 'buy') {
                cumulativeQuantity += transaction.quantity;
                cumulativeCost += transaction.totalAmount;
            } else {
                const avgCost = cumulativeQuantity > 0 ? cumulativeCost / cumulativeQuantity : 0;
                const sellCost = transaction.quantity * avgCost;
                cumulativeQuantity -= transaction.quantity;
                cumulativeCost -= sellCost;
            }
            
            return {
                ...transaction,
                cumulativeQuantity: Math.max(0, cumulativeQuantity),
                avgCostAtTime: cumulativeQuantity > 0 ? cumulativeCost / cumulativeQuantity : 0
            };
        });
        
        return history;
    }

    // 计算持仓的成本分布
    getHoldingCostDistribution(symbol) {
        const transactions = window.transactionManager.getTransactionsBySymbol(symbol);
        const buyTransactions = transactions.filter(t => t.type === 'buy');
        
        // 按价格分组
        const priceGroups = {};
        let totalQuantity = 0;
        let totalCost = 0;
        
        buyTransactions.forEach(transaction => {
            const price = transaction.price;
            if (!priceGroups[price]) {
                priceGroups[price] = {
                    price,
                    quantity: 0,
                    totalAmount: 0,
                    transactions: []
                };
            }
            
            priceGroups[price].quantity += transaction.quantity;
            priceGroups[price].totalAmount += transaction.totalAmount;
            priceGroups[price].transactions.push(transaction);
            
            totalQuantity += transaction.quantity;
            totalCost += transaction.totalAmount;
        });
        
        // 计算各价格区间的占比
        const distribution = Object.values(priceGroups).map(group => ({
            ...group,
            percentage: totalQuantity > 0 ? (group.quantity / totalQuantity) : 0,
            avgPrice: group.quantity > 0 ? (group.totalAmount / group.quantity) : 0
        }));
        
        // 按价格排序
        distribution.sort((a, b) => a.price - b.price);
        
        return {
            distribution,
            summary: {
                totalQuantity,
                totalCost,
                avgCost: totalQuantity > 0 ? totalCost / totalQuantity : 0,
                priceRange: {
                    min: distribution.length > 0 ? distribution[0].price : 0,
                    max: distribution.length > 0 ? distribution[distribution.length - 1].price : 0
                }
            }
        };
    }

    // 导出持仓数据
    exportHoldingsData() {
        const holdings = this.getHoldingsList();
        const summary = this.getHoldingsSummary();
        
        return {
            summary,
            holdings,
            exportTime: new Date().toISOString()
        };
    }
}

// 创建全局实例
window.holdingsManager = new HoldingsManager();