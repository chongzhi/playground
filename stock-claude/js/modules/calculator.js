/**
 * 盈亏计算模块
 * 提供股票交易相关的计算功能
 */

class Calculator {
    constructor() {
        this.settings = storage.getSettings();
    }

    /**
     * 计算持仓数据
     * @param {Array} transactions 交易记录
     * @returns {Array} 持仓数据
     */
    calculatePortfolio(transactions) {
        const portfolio = {};
        
        // 按股票代码分组
        const stockTransactions = this.groupByStock(transactions);
        
        Object.keys(stockTransactions).forEach(code => {
            const stockData = this.calculateStockData(stockTransactions[code]);
            if (stockData.totalQuantity > 0) {
                portfolio[code] = stockData;
            }
        });
        
        return Object.values(portfolio).sort((a, b) => b.totalValue - a.totalValue);
    }

    /**
     * 按股票代码分组交易记录
     * @param {Array} transactions 交易记录
     * @returns {Object} 分组后的交易记录
     */
    groupByStock(transactions) {
        return transactions.reduce((groups, transaction) => {
            const code = transaction.stockCode;
            if (!groups[code]) {
                groups[code] = [];
            }
            groups[code].push(transaction);
            return groups;
        }, {});
    }

    /**
     * 计算单只股票的持仓数据
     * @param {Array} transactions 单只股票的交易记录
     * @returns {Object} 股票持仓数据
     */
    calculateStockData(transactions) {
        let totalQuantity = 0;
        let totalCost = 0;
        let totalValue = 0;
        let totalProfit = 0;
        let totalFee = 0;
        
        // 按日期排序
        const sortedTransactions = transactions.sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );
        
        let remainingShares = [];
        
        sortedTransactions.forEach(transaction => {
            const price = parseFloat(transaction.price);
            const quantity = parseInt(transaction.quantity);
            const fee = parseFloat(transaction.fee || 0);
            
            if (transaction.type === 'buy') {
                // 买入：添加到剩余股票
                remainingShares.push({
                    price: price,
                    quantity: quantity,
                    fee: fee
                });
                totalCost += price * quantity + fee;
                totalQuantity += quantity;
                totalFee += fee;
            } else if (transaction.type === 'sell') {
                // 卖出：先进先出
                let sellQuantity = quantity;
                let sellCost = 0;
                
                while (sellQuantity > 0 && remainingShares.length > 0) {
                    const oldest = remainingShares[0];
                    
                    if (oldest.quantity <= sellQuantity) {
                        sellCost += oldest.price * oldest.quantity;
                        sellQuantity -= oldest.quantity;
                        remainingShares.shift();
                    } else {
                        sellCost += oldest.price * sellQuantity;
                        oldest.quantity -= sellQuantity;
                        sellQuantity = 0;
                    }
                }
                
                const sellAmount = price * quantity - fee;
                totalProfit += sellAmount - sellCost;
                totalQuantity -= quantity;
                totalFee += fee;
            }
        });
        
        // 计算剩余股票的成本
        let remainingCost = 0;
        remainingShares.forEach(share => {
            remainingCost += share.price * share.quantity + share.fee;
        });
        
        const currentPrice = this.getCurrentPrice(transactions[0].stockCode) || 0;
        const avgPrice = totalQuantity > 0 ? remainingCost / totalQuantity : 0;
        totalValue = totalQuantity * currentPrice;
        
        const unrealizedProfit = totalValue - remainingCost;
        const totalProfitWithUnrealized = totalProfit + unrealizedProfit;
        const profitRate = remainingCost > 0 ? (totalProfitWithUnrealized / remainingCost) * 100 : 0;
        
        return {
            stockCode: transactions[0].stockCode,
            stockName: transactions[0].stockName || storage.getStockName(transactions[0].stockCode),
            totalQuantity: totalQuantity,
            avgPrice: avgPrice,
            currentPrice: currentPrice,
            totalValue: totalValue,
            totalCost: remainingCost,
            unrealizedProfit: unrealizedProfit,
            realizedProfit: totalProfit,
            totalProfit: totalProfitWithUnrealized,
            profitRate: profitRate,
            totalFee: totalFee
        };
    }

    /**
     * 获取当前价格（模拟数据）
     * @param {string} stockCode 股票代码
     * @returns {number} 当前价格
     */
    getCurrentPrice(stockCode) {
        // 这里应该是从API获取实时价格
        // 目前返回模拟数据
        const mockPrices = {
            '000001': 11.50,
            '600519': 1678.00,
            '601398': 4.85,
            '000858': 156.78,
            '002415': 32.45
        };
        
        return mockPrices[stockCode] || (10 + Math.random() * 100).toFixed(2);
    }

    /**
     * 计算总盈亏
     * @param {Array} portfolio 持仓数据
     * @returns {Object} 总盈亏数据
     */
    calculateTotalProfit(portfolio) {
        let totalValue = 0;
        let totalCost = 0;
        let totalProfit = 0;
        let totalFee = 0;
        
        portfolio.forEach(stock => {
            totalValue += stock.totalValue;
            totalCost += stock.totalCost;
            totalProfit += stock.totalProfit;
            totalFee += stock.totalFee;
        });
        
        const profitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
        
        return {
            totalValue: totalValue,
            totalCost: totalCost,
            totalProfit: totalProfit,
            totalFee: totalFee,
            profitRate: profitRate
        };
    }

    /**
     * 计算月度收益
     * @param {Array} transactions 交易记录
     * @returns {Array} 月度收益数据
     */
    calculateMonthlyReturns(transactions) {
        const monthlyData = {};
        
        // 按月份分组
        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    month: monthKey,
                    buyAmount: 0,
                    sellAmount: 0,
                    fee: 0,
                    realizedProfit: 0
                };
            }
            
            const amount = transaction.price * transaction.quantity;
            const fee = parseFloat(transaction.fee || 0);
            
            if (transaction.type === 'buy') {
                monthlyData[monthKey].buyAmount += amount + fee;
            } else if (transaction.type === 'sell') {
                monthlyData[monthKey].sellAmount += amount - fee;
            }
            
            monthlyData[monthKey].fee += fee;
        });
        
        // 计算每月的实际收益
        Object.keys(monthlyData).forEach(month => {
            const data = monthlyData[month];
            data.realizedProfit = data.sellAmount - data.buyAmount;
        });
        
        // 按月份排序
        return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    }

    /**
     * 计算胜率
     * @param {Array} transactions 交易记录
     * @returns {Object} 胜率数据
     */
    calculateWinRate(transactions) {
        const stockTransactions = this.groupByStock(transactions);
        let totalTrades = 0;
        let profitableTrades = 0;
        let totalProfit = 0;
        let totalLoss = 0;
        
        Object.keys(stockTransactions).forEach(code => {
            const trades = this.calculateStockTrades(stockTransactions[code]);
            totalTrades += trades.length;
            
            trades.forEach(trade => {
                if (trade.profit > 0) {
                    profitableTrades++;
                    totalProfit += trade.profit;
                } else {
                    totalLoss += Math.abs(trade.profit);
                }
            });
        });
        
        const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
        const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;
        
        return {
            totalTrades: totalTrades,
            profitableTrades: profitableTrades,
            winRate: winRate,
            totalProfit: totalProfit,
            totalLoss: totalLoss,
            profitFactor: profitFactor
        };
    }

    /**
     * 计算单次交易的盈亏
     * @param {Array} transactions 单只股票的交易记录
     * @returns {Array} 交易盈亏数据
     */
    calculateStockTrades(transactions) {
        const trades = [];
        let remainingShares = [];
        
        const sortedTransactions = transactions.sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );
        
        sortedTransactions.forEach(transaction => {
            const price = parseFloat(transaction.price);
            const quantity = parseInt(transaction.quantity);
            const fee = parseFloat(transaction.fee || 0);
            
            if (transaction.type === 'buy') {
                remainingShares.push({
                    price: price,
                    quantity: quantity,
                    fee: fee,
                    date: transaction.date
                });
            } else if (transaction.type === 'sell') {
                let sellQuantity = quantity;
                let sellCost = 0;
                let buyCost = 0;
                
                const matchedTrades = [];
                
                while (sellQuantity > 0 && remainingShares.length > 0) {
                    const oldest = remainingShares[0];
                    
                    if (oldest.quantity <= sellQuantity) {
                        buyCost += oldest.price * oldest.quantity;
                        sellQuantity -= oldest.quantity;
                        matchedTrades.push(oldest);
                        remainingShares.shift();
                    } else {
                        buyCost += oldest.price * sellQuantity;
                        oldest.quantity -= sellQuantity;
                        matchedTrades.push({ ...oldest, quantity: sellQuantity });
                        sellQuantity = 0;
                    }
                }
                
                const sellAmount = price * quantity - fee;
                const profit = sellAmount - buyCost;
                
                trades.push({
                    stockCode: transaction.stockCode,
                    stockName: transaction.stockName,
                    sellDate: transaction.date,
                    buyDates: matchedTrades.map(t => t.date),
                    sellPrice: price,
                    buyPrice: buyCost / quantity,
                    quantity: quantity,
                    profit: profit,
                    profitRate: buyCost > 0 ? (profit / buyCost) * 100 : 0
                });
            }
        });
        
        return trades;
    }

    /**
     * 格式化数字
     * @param {number} num 数字
     * @param {number} decimals 小数位数
     * @returns {string} 格式化后的字符串
     */
    formatNumber(num, decimals = 2) {
        return parseFloat(num).toFixed(decimals);
    }

    /**
     * 格式化百分比
     * @param {number} rate 百分比
     * @param {number} decimals 小数位数
     * @returns {string} 格式化后的百分比字符串
     */
    formatPercent(rate, decimals = 2) {
        return parseFloat(rate).toFixed(decimals) + '%';
    }

    /**
     * 格式化金额
     * @param {number} amount 金额
     * @returns {string} 格式化后的金额字符串
     */
    formatCurrency(amount) {
        return '¥' + parseFloat(amount).toFixed(2);
    }

    /**
     * 更新设置
     * @param {Object} settings 设置对象
     */
    updateSettings(settings) {
        this.settings = { ...this.settings, ...settings };
    }
}

// 创建全局实例
const calculator = new Calculator();