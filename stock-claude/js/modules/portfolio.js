/**
 * 持仓管理模块
 * 处理持仓数据的更新和展示
 */

class PortfolioManager {
    constructor() {
        this.portfolio = [];
        this.listeners = [];
        this.init();
    }

    init() {
        this.updatePortfolio();
        
        // 监听交易记录变化
        transactionManager.addListener(() => {
            this.updatePortfolio();
        });
    }

    /**
     * 更新持仓数据
     */
    updatePortfolio() {
        const transactions = transactionManager.getTransactions();
        this.portfolio = calculator.calculatePortfolio(transactions);
        this.notifyListeners();
    }

    /**
     * 获取当前持仓
     * @returns {Array} 持仓数据数组
     */
    getPortfolio() {
        return this.portfolio;
    }

    /**
     * 获取单只股票持仓
     * @param {string} stockCode 股票代码
     * @returns {Object} 股票持仓数据
     */
    getStockPosition(stockCode) {
        return this.portfolio.find(p => p.stockCode === stockCode);
    }

    /**
     * 获取持仓统计
     * @returns {Object} 持仓统计数据
     */
    getPortfolioStats() {
        const stats = calculator.calculateTotalProfit(this.portfolio);
        const stockCount = this.portfolio.length;
        
        // 计算盈利和亏损的股票数量
        const profitableStocks = this.portfolio.filter(p => p.totalProfit > 0).length;
        const losingStocks = this.portfolio.filter(p => p.totalProfit < 0).length;
        const breakEvenStocks = this.portfolio.filter(p => p.totalProfit === 0).length;
        
        return {
            ...stats,
            stockCount: stockCount,
            profitableStocks: profitableStocks,
            losingStocks: losingStocks,
            breakEvenStocks: breakEvenStocks
        };
    }

    /**
     * 获取持仓排行
     * @param {string} sortBy 排序字段
     * @param {boolean} ascending 是否升序
     * @returns {Array} 排序后的持仓数据
     */
    getPortfolioRanking(sortBy = 'totalValue', ascending = false) {
        const sorted = [...this.portfolio];
        
        sorted.sort((a, b) => {
            const valueA = a[sortBy];
            const valueB = b[sortBy];
            
            if (ascending) {
                return valueA - valueB;
            } else {
                return valueB - valueA;
            }
        });
        
        return sorted;
    }

    /**
     * 搜索持仓股票
     * @param {string} keyword 搜索关键词
     * @returns {Array} 搜索结果
     */
    searchPortfolio(keyword) {
        if (!keyword || keyword.trim() === '') {
            return this.portfolio;
        }

        const searchTerm = keyword.toLowerCase();
        
        return this.portfolio.filter(position => 
            position.stockCode.toLowerCase().includes(searchTerm) ||
            position.stockName.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * 获取持仓分布
     * @returns {Object} 持仓分布数据
     */
    getPortfolioDistribution() {
        const totalValue = this.portfolio.reduce((sum, p) => sum + p.totalValue, 0);
        
        const distribution = this.portfolio.map(position => ({
            stockCode: position.stockCode,
            stockName: position.stockName,
            value: position.totalValue,
            percentage: totalValue > 0 ? (position.totalValue / totalValue) * 100 : 0,
            profit: position.totalProfit,
            profitRate: position.profitRate
        }));
        
        return distribution.sort((a, b) => b.value - a.value);
    }

    /**
     * 获取行业分布（模拟数据）
     * @returns {Array} 行业分布数据
     */
    getIndustryDistribution() {
        // 这里应该是根据股票代码获取行业信息
        // 目前返回模拟数据
        const industryMap = {
            '000001': '银行',
            '600519': '白酒',
            '601398': '银行',
            '000858': '白酒',
            '002415': '科技'
        };
        
        const industryData = {};
        
        this.portfolio.forEach(position => {
            const industry = industryMap[position.stockCode] || '其他';
            
            if (!industryData[industry]) {
                industryData[industry] = {
                    industry: industry,
                    totalValue: 0,
                    stockCount: 0,
                    stocks: []
                };
            }
            
            industryData[industry].totalValue += position.totalValue;
            industryData[industry].stockCount++;
            industryData[industry].stocks.push(position);
        });
        
        const totalValue = this.portfolio.reduce((sum, p) => sum + p.totalValue, 0);
        
        return Object.values(industryData).map(industry => ({
            ...industry,
            percentage: totalValue > 0 ? (industry.totalValue / totalValue) * 100 : 0
        })).sort((a, b) => b.totalValue - a.totalValue);
    }

    /**
     * 获取盈亏排行
     * @param {string} type 排行类型 ('profit', 'profitRate', 'value')
     * @returns {Array} 排行数据
     */
    getProfitRanking(type = 'profit') {
        return this.getPortfolioRanking(type === 'profit' ? 'totalProfit' : type, false);
    }

    /**
     * 获取盈亏分布统计
     * @returns {Object} 盈亏分布数据
     */
    getProfitDistribution() {
        const profitableStocks = this.portfolio.filter(p => p.totalProfit > 0);
        const losingStocks = this.portfolio.filter(p => p.totalProfit < 0);
        const breakEvenStocks = this.portfolio.filter(p => p.totalProfit === 0);
        
        const totalProfit = profitableStocks.reduce((sum, p) => sum + p.totalProfit, 0);
        const totalLoss = Math.abs(losingStocks.reduce((sum, p) => sum + p.totalProfit, 0));
        
        return {
            profitableCount: profitableStocks.length,
            losingCount: losingStocks.length,
            breakEvenCount: breakEvenStocks.length,
            totalProfit: totalProfit,
            totalLoss: totalLoss,
            averageProfit: profitableStocks.length > 0 ? totalProfit / profitableStocks.length : 0,
            averageLoss: losingStocks.length > 0 ? totalLoss / losingStocks.length : 0,
            maxProfit: profitableStocks.length > 0 ? Math.max(...profitableStocks.map(p => p.totalProfit)) : 0,
            maxLoss: losingStocks.length > 0 ? Math.min(...losingStocks.map(p => p.totalProfit)) : 0
        };
    }

    /**
     * 计算持仓成本
     * @param {string} stockCode 股票代码
     * @returns {number} 持仓成本
     */
    calculateCostBasis(stockCode) {
        const position = this.getStockPosition(stockCode);
        return position ? position.avgPrice : 0;
    }

    /**
     * 检查是否持有某只股票
     * @param {string} stockCode 股票代码
     * @returns {boolean} 是否持有
     */
    hasPosition(stockCode) {
        return this.portfolio.some(p => p.stockCode === stockCode);
    }

    /**
     * 获取持仓变化趋势
     * @param {number} days 天数
     * @returns {Array} 趋势数据
     */
    getPortfolioTrend(days = 30) {
        // 这里应该是根据历史数据计算持仓变化
        // 目前返回模拟数据
        const trend = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            const dateStr = date.toISOString().split('T')[0];
            const totalValue = this.portfolio.reduce((sum, p) => {
                // 模拟价格波动
                const randomFactor = 0.95 + Math.random() * 0.1;
                return sum + (p.totalValue * randomFactor);
            }, 0);
            
            trend.push({
                date: dateStr,
                totalValue: totalValue,
                totalProfit: totalValue - this.portfolio.reduce((sum, p) => sum + p.totalCost, 0)
            });
        }
        
        return trend;
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
                callback(this.portfolio);
            } catch (error) {
                console.error('通知监听器失败:', error);
            }
        });
    }

    /**
     * 获取持仓预警
     * @returns {Array} 预警信息
     */
    getPortfolioAlerts() {
        const alerts = [];
        
        // 检查大幅亏损的股票
        this.portfolio.forEach(position => {
            if (position.profitRate < -10) {
                alerts.push({
                    type: 'warning',
                    message: `${position.stockName}(${position.stockCode}) 亏损超过10%`,
                    stockCode: position.stockCode,
                    profitRate: position.profitRate
                });
            }
            
            if (position.profitRate > 20) {
                alerts.push({
                    type: 'info',
                    message: `${position.stockName}(${position.stockCode}) 盈利超过20%`,
                    stockCode: position.stockCode,
                    profitRate: position.profitRate
                });
            }
        });
        
        return alerts;
    }

    /**
     * 获取投资建议（模拟数据）
     * @returns {Array} 投资建议
     */
    getInvestmentAdvice() {
        const advice = [];
        const stats = this.getPortfolioStats();
        
        // 基于当前持仓情况给出建议
        if (stats.stockCount > 10) {
            advice.push({
                type: 'warning',
                message: '持仓股票过多，建议适当精简'
            });
        }
        
        if (stats.profitRate < -5) {
            advice.push({
                type: 'danger',
                message: '整体亏损较大，建议重新评估投资策略'
            });
        }
        
        if (stats.stockCount === 0) {
            advice.push({
                type: 'info',
                message: '当前无持仓，可以考虑开始投资'
            });
        }
        
        const profitableRate = stats.stockCount > 0 ? 
            (stats.profitableStocks / stats.stockCount) * 100 : 0;
        
        if (profitableRate > 70) {
            advice.push({
                type: 'success',
                message: '大部分股票盈利，投资表现良好'
            });
        }
        
        return advice;
    }
}

// 创建全局实例
const portfolioManager = new PortfolioManager();