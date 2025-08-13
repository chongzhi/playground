// calculations.js
// 业务计算逻辑：持仓、余额、盈亏等

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
      stock.totalCost += tx.price * tx.quantity;
      stock.quantity += tx.quantity;
    } else {
      if (stock.quantity >= tx.quantity) {
        const costOfSoldShares = (stock.totalCost / stock.quantity) * tx.quantity;
        stock.totalCost -= costOfSoldShares;
        stock.quantity -= tx.quantity;
      } else {
        console.warn(
          `Attempted to sell ${tx.quantity} shares of ${tx.code}, but only ${stock.quantity} available.`
        );
        continue;
      }
    }

    stock.avgCost = stock.quantity > 0 ? stock.totalCost / stock.quantity : 0;
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
  const fee = Math.max(5, 0.02 * safeQty);
  return fee;
}

/**
 * 计算账户现金余额
 * @param {Array} transactions 
 * @param {number} initialFunds 
 */
export function calculateAccountBalance(transactions, initialFunds) {
  let balance = initialFunds ?? 0;
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  for (const tx of sortedTransactions) {
    const safePrice = Number.isFinite(tx.price) ? tx.price : 0;
    const safeQty = Number.isFinite(tx.quantity) ? tx.quantity : 0;
    const fee = calculateCommission(safeQty);
    if (tx.type === 'buy') {
      balance -= safePrice * safeQty + fee;
    } else {
      balance += safePrice * safeQty - fee;
    }
  }
  return balance;
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
    const currentPrice = userPrices[stock.code] || stock.avgCost;
    const currentValue = stock.quantity * currentPrice;
    const profit = currentValue - stock.totalCost;
    const profitPercent = stock.totalCost > 0 ? (profit / stock.totalCost) * 100 : 0;

    totalCost += stock.totalCost;
    totalValue += currentValue;

    stockProfits.push({
      ...stock,
      currentPrice,
      currentValue,
      profit,
      profitPercent,
    });
  }

  const totalProfit = totalValue - totalCost;
  const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  return {
    totalCost,
    totalValue,
    totalProfit,
    totalProfitPercent,
    stockProfits: stockProfits.sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit)),
  };
}
