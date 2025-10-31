// calculations.js
// 业务计算逻辑：持仓、余额、盈亏等

import { roundToDecimals, add, subtract, multiply, divide } from './precision.js';

/**
 * 根据交易记录计算当前持仓（FIFO - 先进先出法）
 * @param {Array<{id:string, code:string, name:string, type:'buy'|'sell', price:number, quantity:number, date:string}>} transactions 
 * @returns {Record<string, {code:string, name:string, quantity:number, totalCost:number, avgCost:number, lots:Array}>}
 */
export function calculateHoldings(transactions) {
  // 使用批次管理，每个股票维护一个买入批次队列
  const holdingsWithLots = {};
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  for (const tx of sortedTransactions) {
    // 确保交易价格精确到2位小数
    const normalizedPrice = roundToDecimals(tx.price);
    
    if (!holdingsWithLots[tx.code]) {
      holdingsWithLots[tx.code] = {
        code: tx.code,
        name: tx.name,
        lots: [], // 买入批次队列：[{price, quantity, date}, ...]
      };
    }
    const stock = holdingsWithLots[tx.code];

    if (tx.type === 'buy') {
      // 买入：添加新批次到队列末尾
      stock.lots.push({
        price: normalizedPrice,
        quantity: tx.quantity,
        date: tx.date,
      });
    } else {
      // 卖出：按 FIFO 从队列头部开始扣除
      let remainingToSell = tx.quantity;
      
      while (remainingToSell > 0 && stock.lots.length > 0) {
        const firstLot = stock.lots[0];
        
        if (firstLot.quantity <= remainingToSell) {
          // 这批全部卖出
          remainingToSell -= firstLot.quantity;
          stock.lots.shift(); // 移除第一批
        } else {
          // 这批部分卖出
          firstLot.quantity -= remainingToSell;
          remainingToSell = 0;
        }
      }
      
      if (remainingToSell > 0) {
        console.warn(
          `Attempted to sell ${tx.quantity} shares of ${tx.code}, but only ${tx.quantity - remainingToSell} available.`
        );
      }
    }
  }

  // 转换为最终格式：计算总数量、总成本、平均成本
  const holdings = {};
  for (const [code, stock] of Object.entries(holdingsWithLots)) {
    let totalQuantity = 0;
    let totalCost = 0;
    
    for (const lot of stock.lots) {
      totalQuantity += lot.quantity;
      totalCost = add(totalCost, multiply(lot.price, lot.quantity));
    }
    
    if (totalQuantity > 0) {
      holdings[code] = {
        code: stock.code,
        name: stock.name,
        quantity: totalQuantity,
        totalCost: roundToDecimals(totalCost),
        avgCost: roundToDecimals(divide(totalCost, totalQuantity)),
        lots: stock.lots, // 保留批次信息供调试或高级功能使用
      };
    }
  }

  return holdings;
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
