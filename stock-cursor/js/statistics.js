// 统计分析模块
class StatisticsManager {
    constructor() {
        this.storage = window.storage;
        this.transactionManager = window.transactionManager;
        this.holdingsManager = window.holdingsManager;
    }

    // 获取总体统计
    getOverallStatistics() {
        const transactions = this.transactionManager.getAllTransactions();
        const holdings = this.holdingsManager.getAllHoldings();
        const summary = this.holdingsManager.getHoldingsSummary();
        
        // 交易次数统计
        const buyCount = transactions.filter(t => t.type === 'buy').length;
        const sellCount = transactions.filter(t => t.type === 'sell').length;
        
        // 交易金额统计
        const totalBuyAmount = transactions
            .filter(t => t.type === 'buy')
            .reduce((sum, t) => sum + t.totalAmount, 0);
        
        const totalSellAmount = transactions
            .filter(t => t.type === 'sell')
            .reduce((sum, t) => sum + (t.amount - t.fee), 0);
        
        // 手续费统计
        const totalFees = transactions.reduce((sum, t) => sum + t.fee, 0);
        
        // 平均交易金额
        const avgBuyAmount = buyCount > 0 ? totalBuyAmount / buyCount : 0;
        const avgSellAmount = sellCount > 0 ? totalSellAmount / sellCount : 0;
        
        return {
            // 基础数据
            totalTransactions: transactions.length,
            buyCount,
            sellCount,
            totalBuyAmount,
            totalSellAmount,
            totalFees,
            avgBuyAmount,
            avgSellAmount,
            
            // 持仓相关
            currentHoldingsCount: Object.keys(holdings).length,
            totalCurrentValue: summary.totalValue,
            totalCost: summary.totalCost,
            
            // 盈亏相关
            totalRealizedProfit: summary.totalRealizedProfit,
            totalUnrealizedProfit: summary.unrealizedProfit,
            totalProfit: summary.totalProfit,
            totalProfitRate: summary.profitRate,
            
            // 交易活跃度
            firstTransactionDate: this.getFirstTransactionDate(),
            lastTransactionDate: this.getLastTransactionDate(),
            tradingDays: this.getTradingDays()
        };
    }

    // 获取月度统计
    getMonthlyStatistics(year = new Date().getFullYear()) {
        const transactions = this.transactionManager.getAllTransactions();
        const monthlyData = {};
        
        // 初始化12个月的数据
        for (let month = 1; month <= 12; month++) {
            monthlyData[month] = {
                month,
                buyCount: 0,
                sellCount: 0,
                buyAmount: 0,
                sellAmount: 0,
                fees: 0,
                profit: 0,
                transactionCount: 0
            };
        }
        
        // 统计各月数据
        transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            if (transactionDate.getFullYear() === year) {
                const month = transactionDate.getMonth() + 1;
                const data = monthlyData[month];
                
                data.transactionCount++;
                data.fees += transaction.fee;
                
                if (transaction.type === 'buy') {
                    data.buyCount++;
                    data.buyAmount += transaction.totalAmount;
                } else {
                    data.sellCount++;
                    data.sellAmount += transaction.amount - transaction.fee;
                    // 简化盈亏计算
                    data.profit += transaction.amount - transaction.fee;
                }
            }
        });
        
        return Object.values(monthlyData);
    }

    // 获取股票表现统计
    getStockPerformanceStatistics() {
        const holdings = this.holdingsManager.getAllHoldings();
        const stockStats = [];
        
        Object.values(holdings).forEach(holding => {
            const transactions = this.transactionManager.getTransactionsBySymbol(holding.symbol);
            
            // 计算交易次数
            const buyCount = transactions.filter(t => t.type === 'buy').length;
            const sellCount = transactions.filter(t => t.type === 'sell').length;
            
            // 计算交易频率
            const firstDate = transactions.length > 0 ? 
                Math.min(...transactions.map(t => new Date(t.date))) : Date.now();
            const lastDate = transactions.length > 0 ? 
                Math.max(...transactions.map(t => new Date(t.date))) : Date.now();
            const daysSinceFirst = Math.max(1, (Date.now() - firstDate) / (1000 * 60 * 60 * 24));
            
            stockStats.push({
                symbol: holding.symbol,
                name: holding.name,
                quantity: holding.quantity,
                avgCost: holding.avgCost,
                totalCost: holding.totalCost,
                currentValue: holding.quantity * holding.avgCost,
                unrealizedProfit: holding.quantity * holding.avgCost - holding.totalCost,
                unrealizedProfitRate: holding.totalCost > 0 ? 
                    ((holding.quantity * holding.avgCost - holding.totalCost) / holding.totalCost) : 0,
                realizedProfit: holding.realizedProfit,
                totalProfit: holding.realizedProfit + (holding.quantity * holding.avgCost - holding.totalCost),
                totalProfitRate: holding.totalCost > 0 ? 
                    ((holding.realizedProfit + (holding.quantity * holding.avgCost - holding.totalCost)) / holding.totalCost) : 0,
                buyCount,
                sellCount,
                totalTransactions: buyCount + sellCount,
                firstTransactionDate: Utils.formatDate(new Date(firstDate)),
                lastTransactionDate: Utils.formatDate(new Date(lastDate)),
                tradingFrequency: (buyCount + sellCount) / daysSinceFirst * 30 // 每月交易次数
            });
        });
        
        return stockStats;
    }

    // 获取盈亏分布
    getProfitDistribution() {
        const stockStats = this.getStockPerformanceStatistics();
        const distribution = {
            profitable: stockStats.filter(s => s.totalProfit > 0),
            breakeven: stockStats.filter(s => s.totalProfit === 0),
            losing: stockStats.filter(s => s.totalProfit < 0)
        };
        
        const totalStocks = stockStats.length;
        
        return {
            distribution,
            summary: {
                profitableCount: distribution.profitable.length,
                breakevenCount: distribution.breakeven.length,
                losingCount: distribution.losing.length,
                profitableRate: totalStocks > 0 ? distribution.profitable.length / totalStocks : 0,
                totalProfitFromWinners: distribution.profitable.reduce((sum, s) => sum + s.totalProfit, 0),
                totalLossFromLosers: distribution.losing.reduce((sum, s) => sum + s.totalProfit, 0)
            }
        };
    }

    // 获取时间段统计
    getTimeRangeStatistics(startDate, endDate) {
        const transactions = this.transactionManager.getAllTransactions();
        const rangeTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date >= new Date(startDate) && date <= new Date(endDate);
        });
        
        const buyTransactions = rangeTransactions.filter(t => t.type === 'buy');
        const sellTransactions = rangeTransactions.filter(t => t.type === 'sell');
        
        const totalBuyAmount = buyTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
        const totalSellAmount = sellTransactions.reduce((sum, t) => sum + (t.amount - t.fee), 0);
        const totalFees = rangeTransactions.reduce((sum, t) => sum + t.fee, 0);
        
        // 获取期间内的唯一股票
        const uniqueStocks = [...new Set(rangeTransactions.map(t => t.symbol))];
        
        return {
            period: {
                startDate,
                endDate,
                days: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
            },
            transactions: {
                total: rangeTransactions.length,
                buyCount: buyTransactions.length,
                sellCount: sellTransactions.length
            },
            amounts: {
                totalBuyAmount,
                totalSellAmount,
                totalFees,
                netFlow: totalBuyAmount - totalSellAmount
            },
            stocks: {
                uniqueCount: uniqueStocks.length,
                symbols: uniqueStocks
            },
            activity: {
                avgTransactionsPerDay: rangeTransactions.length / Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))),
                avgBuyAmountPerTransaction: buyTransactions.length > 0 ? totalBuyAmount / buyTransactions.length : 0,
                avgSellAmountPerTransaction: sellTransactions.length > 0 ? totalSellAmount / sellTransactions.length : 0
            }
        };
    }

    // 辅助方法：获取第一笔交易日期
    getFirstTransactionDate() {
        const transactions = this.transactionManager.getAllTransactions();
        if (transactions.length === 0) return null;
        
        const dates = transactions.map(t => new Date(t.date));
        return Utils.formatDate(new Date(Math.min(...dates)));
    }

    // 辅助方法：获取最后一笔交易日期
    getLastTransactionDate() {
        const transactions = this.transactionManager.getAllTransactions();
        if (transactions.length === 0) return null;
        
        const dates = transactions.map(t => new Date(t.date));
        return Utils.formatDate(new Date(Math.max(...dates)));
    }

    // 辅助方法：计算交易天数
    getTradingDays() {
        const firstDate = this.getFirstTransactionDate();
        const lastDate = this.getLastTransactionDate();
        
        if (!firstDate || !lastDate) return 0;
        
        const first = new Date(firstDate);
        const last = new Date(lastDate);
        return Math.ceil((last - first) / (1000 * 60 * 60 * 24)) + 1;
    }

    // 导出统计报告
    exportStatisticsReport() {
        const overall = this.getOverallStatistics();
        const monthly = this.getMonthlyStatistics();
        const stockPerformance = this.getStockPerformanceStatistics();
        const profitDistribution = this.getProfitDistribution();
        
        return {
            reportDate: new Date().toISOString(),
            overall,
            monthly,
            stockPerformance,
            profitDistribution
        };
    }
}

// 创建全局实例
window.statisticsManager = new StatisticsManager();