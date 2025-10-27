// calculations.js
// 业务计算逻辑：持仓、余额、盈亏等

import { roundToDecimals, add, subtract, multiply, divide } from './precision.js';

/**
 * 根据交易记录计算当前持仓（加权平均成本法）
 * @param {Array<{id:string, code:string, name:string, type:'buy'|'sell', price:number, quantity:number, date:string}>} transactions 
 * @returns {Record<string, {code:string, name:string, quantity:number, totalCost:number, avgCost:number}>}
 */
export function calculateHoldings(transactions) {
  const holdings = {};
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  for (const tx of sortedTransactions) {
    // 确保交易价格精确到2位小数
    const normalizedPrice = roundToDecimals(tx.price);
    
    if (!holdings[tx.code]) {
      holdings[tx.code] = {
        code: tx.code,
        name: tx.name,
        quantity: 0,
        totalCost: 0,
        avgCost: 0,
      };
    }
    const stock = holdings[tx.code];

    if (tx.type === 'buy') {
      // 使用精确计算：总成本 = 原成本 + 价格 × 数量
      const buyCost = multiply(normalizedPrice, tx.quantity);
      stock.totalCost = add(stock.totalCost, buyCost);
      stock.quantity += tx.quantity;
    } else {
      if (stock.quantity >= tx.quantity) {
        // 使用精确计算：卖出成本 = (总成本 / 数量) × 卖出数量
        const avgCost = divide(stock.totalCost, stock.quantity);
        const costOfSoldShares = multiply(avgCost, tx.quantity);
        stock.totalCost = subtract(stock.totalCost, costOfSoldShares);
        stock.quantity -= tx.quantity;
      } else {
        console.warn(
          `Attempted to sell ${tx.quantity} shares of ${tx.code}, but only ${stock.quantity} available.`
        );
        continue;
      }
    }

    // 计算平均成本，确保精度
    stock.avgCost = stock.quantity > 0 ? divide(stock.totalCost, stock.quantity) : 0;
    stock.totalCost = roundToDecimals(stock.totalCost);
    stock.avgCost = roundToDecimals(stock.avgCost);
  }

  return Object.fromEntries(
    Object.entries(holdings).filter(([_, s]) => s.quantity > 0)
  );
}

/**
 * 计算一笔交易的佣金（USD）：每股 0.02 美金，最低 5 美金
 * @param {number} quantity
 * @returns {number}
 */
export function calculateCommission(quantity) {
  const safeQty = Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
  const fee = multiply(0.02, safeQty);
  return roundToDecimals(Math.max(5, fee));
}

/**
 * 计算账户现金余额
 * @param {Array} transactions 
 * @param {number} initialFunds 
 */
export function calculateAccountBalance(transactions, initialFunds) {
  let balance = roundToDecimals(initialFunds ?? 0);
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  for (const tx of sortedTransactions) {
    const safePrice = Number.isFinite(tx.price) ? roundToDecimals(tx.price) : 0;
    const safeQty = Number.isFinite(tx.quantity) ? tx.quantity : 0;
    const fee = calculateCommission(safeQty);
    
    if (tx.type === 'buy') {
      // 买入：余额 = 余额 - (价格 × 数量) - 佣金
      const cost = multiply(safePrice, safeQty);
      balance = subtract(balance, add(cost, fee));
    } else {
      // 卖出：余额 = 余额 + (价格 × 数量) - 佣金
      const income = multiply(safePrice, safeQty);
      balance = add(balance, subtract(income, fee));
    }
  }
  return roundToDecimals(balance);
}

/**
 * 计算盈亏分析（未实现）
 * @param {Record<string, {code:string, name:string, quantity:number, totalCost:number, avgCost:number}>} holdings 
 * @param {Record<string, number>} userPrices 
 */
export function calculateProfitAnalysis(holdings, userPrices) {
  let totalCost = 0;
  let totalValue = 0;
  const stockProfits = [];

  for (const stock of Object.values(holdings)) {
    const currentPrice = userPrices[stock.code] || stock.avgCost;  // 保持完整精度
    const currentValue = multiply(stock.quantity, currentPrice);
    const profit = subtract(currentValue, stock.totalCost);
    // 收益率计算使用原生运算符保持精度，避免中间四舍五入
    const profitPercent = stock.totalCost > 0
      ? (profit / stock.totalCost) * 100
      : 0;

    totalCost = add(totalCost, stock.totalCost);
    totalValue = add(totalValue, currentValue);

    stockProfits.push({
      ...stock,
      currentPrice: roundToDecimals(currentPrice),  // 显示时格式化
      currentValue: roundToDecimals(currentValue),
      profit: roundToDecimals(profit),
      profitPercent: profitPercent, // 保持完整精度，显示时再格式化
    });
  }

  const totalProfit = subtract(totalValue, totalCost);
  // 总收益率计算使用原生运算符保持精度
  const totalProfitPercent = totalCost > 0 
    ? (totalProfit / totalCost) * 100
    : 0;

  return {
    totalCost: roundToDecimals(totalCost),
    totalValue: roundToDecimals(totalValue),
    totalProfit: roundToDecimals(totalProfit),
    totalProfitPercent: roundToDecimals(totalProfitPercent),
    stockProfits: stockProfits.sort((a, b) => b.profitPercent - a.profitPercent),
  };
}
