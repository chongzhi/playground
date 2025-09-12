// ui.js
// DOM 渲染与事件交互

import { 
  getTransactions, saveTransactions,
  getUserPrices, saveUserPrices,
  getInitialFunds, setInitialFunds,
  getExchangeRate, setExchangeRate,
  getCurrentTab, setCurrentTab,
} from './storage.js';
import { calculateHoldings, calculateAccountBalance, calculateProfitAnalysis, calculateCommission } from './calculations.js';

export function bootstrapUI() {
  const views = {
    holdings: document.getElementById('holdings-view'),
    transaction: document.getElementById('transaction-view'),
    history: document.getElementById('history-view'),
    profit: document.getElementById('profit-view'),
    settings: document.getElementById('settings-view'),
  };

  const navButtons = {
    holdings: document.getElementById('nav-holdings'),
    add: document.getElementById('nav-add'),
    history: document.getElementById('nav-history'),
    profit: document.getElementById('nav-profit'),
    settings: document.getElementById('nav-settings'),
  };

  const headerTitle = document.getElementById('header-title');
  const transactionForm = document.getElementById('transaction-form');
  const holdingsList = document.getElementById('holdings-list');
  const historyList = document.getElementById('history-list');
  const historySummary = document.getElementById('history-summary');
  const historyStockFilter = document.getElementById('history-stock-filter');
  const filterModeHolding = document.getElementById('filter-mode-holding');
  const filterModeSold = document.getElementById('filter-mode-sold');
  const profitList = document.getElementById('profit-list');
  const cancelBtn = document.getElementById('cancel-btn');
  const buyCapacityHint = document.getElementById('buy-capacity-hint');

  const holdingsEmptyState = document.getElementById('holdings-empty-state');
  const historyEmptyState = document.getElementById('history-empty-state');
  const profitEmptyState = document.getElementById('profit-empty-state');

  // 本地状态
  let userPrices = getUserPrices();
  let initialFunds = getInitialFunds();
  let exchangeRate = getExchangeRate();
  let previousView = 'holdings';
  let historyFilterMode = 'holding'; // 'holding' or 'sold'

  function switchView(viewName) {
    if (viewName !== 'transaction') {
      previousView = viewName;
      setCurrentTab(viewName);
    }
    Object.values(views).forEach(v => v.classList.remove('active'));
    views[viewName].classList.add('active');

    Object.values(navButtons).forEach(btn => btn.classList.remove('active'));
    if (navButtons[viewName]) navButtons[viewName].classList.add('active');

    switch (viewName) {
      case 'holdings':
        headerTitle.textContent = '我的持仓';
        renderHoldings();
        break;
      case 'transaction':
        headerTitle.textContent = document.getElementById('transaction-id').value ? '修改交易' : '添加交易';
        updateBuyCapacityHint();
        break;
      case 'history':
        headerTitle.textContent = '历史记录';
        renderHistory();
        break;
      case 'profit':
        headerTitle.textContent = '盈亏分析';
        renderProfitAnalysisView();
        break;
      case 'settings':
        headerTitle.textContent = '设置';
        renderSettings();
        break;
    }
  }

  function switchToSellMode(code, name, price, quantity) {
    switchView('transaction');
    document.getElementById('stock-code').value = code;
    document.getElementById('stock-name').value = name;
    document.getElementById('transaction-type').value = 'sell';
    document.getElementById('transaction-price').value = price;
    document.getElementById('transaction-quantity').value = quantity;
    document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
    updateBuyCapacityHint();
  }

  function switchToBuyMode(code, name, price) {
    switchView('transaction');
    document.getElementById('stock-code').value = code;
    document.getElementById('stock-name').value = name;
    document.getElementById('transaction-type').value = 'buy';
    document.getElementById('transaction-price').value = price;
    document.getElementById('transaction-quantity').value = '';
    document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
    updateBuyCapacityHint();
  }

  function renderHoldings() {
    const transactions = getTransactions();
    const holdings = calculateHoldings(transactions);

    let totalValue = 0;
    Object.values(holdings).forEach(stock => {
      const currentPrice = userPrices[stock.code] || stock.avgCost;
      totalValue += stock.quantity * currentPrice;
    });

    const rmbValue = totalValue * exchangeRate;
    const accountBalance = calculateAccountBalance(transactions, initialFunds);
    const rmbBalance = accountBalance * exchangeRate;

    const totalAmount = totalValue + accountBalance;
    const rmbTotalAmount = totalAmount * exchangeRate;

    const totalPnl = totalAmount - initialFunds;
    const pnlPercent = initialFunds > 0 ? (totalPnl / initialFunds) * 100 : 0;

    document.getElementById('holdings-total-amount').innerHTML = `
      <div class="usd-value">$${totalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
      <div class="rmb-value">¥${rmbTotalAmount.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</div>
    `;

    const pnlColorClass = totalPnl > 0 ? 'positive' : totalPnl < 0 ? 'negative' : 'neutral';
    const pnlSign = totalPnl > 0 ? '+' : totalPnl < 0 ? '-' : '';
    const absPnl = Math.abs(totalPnl);
    document.getElementById('holdings-total-pnl').innerHTML = `
      <div class="holdings-label">整体盈亏</div>
      <div class="holdings-value ${pnlColorClass}">
        <div class="usd-value">${pnlSign}$${absPnl.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
      </div>
    `;

    const percentSign = pnlPercent > 0 ? '+' : pnlPercent < 0 ? '-' : '';
    const absPercent = Math.abs(pnlPercent);
    document.getElementById('holdings-total-pnl-percent').innerHTML = `
      <div class="holdings-label">盈亏比例</div>
      <div class="holdings-value ${pnlColorClass}">
        <div class="usd-value">${percentSign}${absPercent.toFixed(2)}%</div>
      </div>
    `;

    document.getElementById('holdings-total-value').innerHTML = `
      <div class="usd-value">$${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
    `;

    document.getElementById('account-balance').innerHTML = `
      <div class="usd-value">$${accountBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
    `;

    holdingsList.innerHTML = '';
    if (Object.keys(holdings).length === 0) {
      holdingsEmptyState.style.display = 'block';
      return;
    }
    holdingsEmptyState.style.display = 'none';

    const sortedHoldings = Object.values(holdings).sort((a, b) => {
      const pa = userPrices[a.code] || a.avgCost;
      const pb = userPrices[b.code] || b.avgCost;
      return b.quantity * pb - a.quantity * pa;
    });

    for (const stock of sortedHoldings) {
      const currentPrice = userPrices[stock.code] || stock.avgCost;
      const item = document.createElement('li');
      item.className = 'list-item';
      item.innerHTML = `
        <div class="item-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
          <div class="item-main-info">
            <div class="stock-name">${stock.name}</div>
            <div class="stock-code">${stock.code}</div>
          </div>
          <div class="action-buttons" style="flex-shrink: 0;">
            <button class="buy-btn" data-code="${stock.code}" data-name="${stock.name}" data-price="${currentPrice}">买入</button>
            <button class="sell-btn" data-code="${stock.code}" data-name="${stock.name}" data-price="${currentPrice}" data-quantity="${stock.quantity}">卖出</button>
          </div>
        </div>
        <div class="item-details">
          <div class="item-col-1"><span>持仓</span><span class="value-quantity">${stock.quantity.toLocaleString('en-US')}</span></div>
          <div class="item-col-2"><span>成本</span><span class="value-price">${stock.avgCost.toFixed(2)}</span></div>
          <div class="item-col-3"><span>现价</span><span class="value-price">${currentPrice.toFixed(2)}</span></div>
          <div class="item-col-4"><span>总市值</span><span class="value-total">${(stock.quantity * currentPrice).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span></div>
        </div>
      `;
      holdingsList.appendChild(item);
    }

    document.querySelectorAll('.sell-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const { code, name, price, quantity } = e.currentTarget.dataset;
        switchToSellMode(code, name, parseFloat(price), parseInt(quantity));
      });
    });

    document.querySelectorAll('.buy-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const { code, name, price } = e.currentTarget.dataset;
        switchToBuyMode(code, name, parseFloat(price));
      });
    });
  }

  function renderHistory() {
    const allTransactions = getTransactions()
      .slice()
      .sort((a, b) => {
        const da = new Date(a.date);
        const db = new Date(b.date);
        const va = isNaN(db) ? 0 : db.getTime();
        const vb = isNaN(da) ? 0 : da.getTime();
        return va - vb;
      });

    // 计算当前持仓股票
    const holdings = calculateHoldings(allTransactions);
    const holdingStocks = Object.keys(holdings);
    
    // 计算已清仓股票（在交易记录中但不在当前持仓中的股票）
    const allStocksInTransactions = Array.from(new Set(allTransactions.map(tx => tx.code)));
    const soldStocks = allStocksInTransactions.filter(code => !holdingStocks.includes(code));

    // 根据筛选模式确定可选股票
    let availableStocks = [];
    if (historyFilterMode === 'holding') {
      availableStocks = holdingStocks;
    } else if (historyFilterMode === 'sold') {
      availableStocks = soldStocks;
    }

    // 初始化/更新筛选项
    if (historyStockFilter) {
      // 获取与当前模式相关的交易记录中的股票信息
      let relevantTransactions = allTransactions;
      if (historyFilterMode === 'holding') {
        relevantTransactions = allTransactions.filter(tx => holdingStocks.includes(tx.code));
      } else if (historyFilterMode === 'sold') {
        relevantTransactions = allTransactions.filter(tx => soldStocks.includes(tx.code));
      }
      
      const uniqueStocks = Array.from(new Set(relevantTransactions.map(tx => `${tx.code}|${tx.name}`)))
        .filter(k => k && !k.startsWith('|'))
        .sort();
      const selected = historyStockFilter.value || '__all__';
      historyStockFilter.innerHTML = '<option value="__all__">全部</option>' +
        uniqueStocks.map(k => {
          const [code, name] = k.split('|');
          // 只显示当前模式下的股票
          if (!availableStocks.includes(code)) return '';
          const value = code;
          const label = name ? `${name} (${code})` : code;
          const isSelected = selected === code ? ' selected' : '';
          return `<option value="${value}"${isSelected}>${label}</option>`;
        }).join('');
      // 仅当在历史页面时显示头部筛选器
      const isHistoryActive = document.querySelector('#history-view').classList.contains('active');
      historyStockFilter.style.display = isHistoryActive ? 'block' : 'none';
    }

    const filterCode = historyStockFilter && historyStockFilter.value && historyStockFilter.value !== '__all__'
      ? historyStockFilter.value
      : null;
      
    // 根据筛选模式和具体股票筛选条件过滤交易记录
    let filteredTransactions = allTransactions;
    if (historyFilterMode === 'holding') {
      filteredTransactions = allTransactions.filter(tx => holdingStocks.includes(tx.code));
    } else if (historyFilterMode === 'sold') {
      filteredTransactions = allTransactions.filter(tx => soldStocks.includes(tx.code));
    }
    
    const transactions = (filterCode
      ? filteredTransactions.filter(tx => tx.code === filterCode)
      : filteredTransactions).map(tx => ({
        ...tx,
        price: Number.isFinite(tx.price) ? tx.price : Number(tx.price) || 0,
        quantity: Number.isFinite(tx.quantity) ? tx.quantity : parseInt(tx.quantity, 10) || 0,
        date: tx.date || '',
        type: tx.type === 'sell' ? 'sell' : 'buy',
        code: (tx.code || '').toString().toUpperCase(),
        name: tx.name || '',
      }));

    historyList.innerHTML = '';
    if (transactions.length === 0) {
      historyEmptyState.style.display = 'block';
      if (historySummary) historySummary.textContent = '';
      return;
    }
    historyEmptyState.style.display = 'none';

    for (const tx of transactions) {
      const priceNum = Number.isFinite(tx.price) ? tx.price : 0;
      const qtyNum = Number.isFinite(tx.quantity) ? tx.quantity : 0;
      const totalVal = priceNum * qtyNum;
      const item = document.createElement('li');
      item.className = `list-item transaction-type-${tx.type}`;
      item.innerHTML = `
        <div class="item-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
          <div class="item-main-info">
            <div class="stock-name">${tx.name} (${tx.code})</div>
            <div class="stock-code">${tx.date}</div>
          </div>
          <div class="action-buttons" >
            <button class="edit-btn" data-id="${tx.id}">修改</button>
            <button class="delete-btn" data-id="${tx.id}">删除</button>
          </div>
        </div>
        <div class="item-details">
          <div class="item-col-1"><span>类型</span><span>${tx.type === 'buy' ? '买入' : '卖出'}</span></div>
          <div class="item-col-2"><span>价格</span><span class="value-price">$${priceNum.toLocaleString('en-US')}</span></div>
          <div class="item-col-3"><span>数量</span><span class="value-quantity">${qtyNum.toLocaleString('en-US')}</span></div>
          <div class="item-col-4"><span>总值</span><span class="value-total">$${totalVal.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span></div>
        </div>
      `;

      const deleteBtn = item.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => deleteTransaction(tx.id));

      const editBtn = item.querySelector('.edit-btn');
      editBtn.addEventListener('click', () => editTransaction(tx.id));

      historyList.appendChild(item);
    }

    // 汇总盈亏（包含未卖出持仓的当前市值）
    if (historySummary) {
      let totalBuyCost = 0;   // 累计买入成本
      let totalSellIncome = 0; // 累计卖出收入
      for (const tx of transactions) {
        const priceNum = Number.isFinite(tx.price) ? tx.price : 0;
        const qtyNum = Number.isFinite(tx.quantity) ? tx.quantity : 0;
        const value = priceNum * qtyNum;
        if (tx.type === 'buy') totalBuyCost += value; else totalSellIncome += value;
      }

      // 计算筛选范围内的当前持仓与市值（仅使用有效的正数量交易）
      const ascending = [...transactions]
        .filter(tx => Number.isFinite(tx.quantity) && tx.quantity > 0)
        .sort((a, b) => {
          const da = new Date(a.date);
          const db = new Date(b.date);
          return (isNaN(da) ? 0 : da.getTime()) - (isNaN(db) ? 0 : db.getTime());
        });
      const partialHoldings = calculateHoldings(ascending);
      let holdingsMarketValue = 0;
      for (const stock of Object.values(partialHoldings)) {
        const currentPrice = userPrices[stock.code] || stock.avgCost;
        holdingsMarketValue += stock.quantity * currentPrice;
      }

      // 总盈亏 = 卖出收入 + 当前持仓市值 - 买入总成本
      const totalPnL = totalSellIncome + holdingsMarketValue - totalBuyCost;
      const pnlSign = totalPnL > 0 ? '+' : totalPnL < 0 ? '-' : '';
      const pnlAbs = Math.abs(totalPnL);
      // 以买入总额为基数的盈亏百分比
      const pnlPercent = totalBuyCost > 0 ? (totalPnL / totalBuyCost) * 100 : 0;
      const percentSign = pnlPercent > 0 ? '+' : pnlPercent < 0 ? '-' : '';
      const absPercent = Math.abs(pnlPercent);

      const title = filterCode ? `筛选：${filterCode}` : '全部交易汇总';
      historySummary.innerHTML = `${title} ｜ 买入总额：<span class="hs-val">$${totalBuyCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span> ｜ 卖出总额：<span class=\"hs-val\">$${totalSellIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span> ｜ 持仓市值：<span class=\"hs-val\">$${holdingsMarketValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span> ｜ 合计盈亏：<span class=\"pnl-val ${totalPnL>0?'positive':totalPnL<0?'negative':'neutral'}\">${pnlSign}$${pnlAbs.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${percentSign}${absPercent.toFixed(2)}%)</span>`;
    }
  }

  function deleteTransaction(transactionId) {
    if (confirm('确定要删除这条交易记录吗？')) {
      const transactions = getTransactions();
      const updated = transactions.filter(tx => tx.id !== transactionId);
      saveTransactions(updated);
      renderHistory();
      renderHoldings();
    }
  }

  function editTransaction(transactionId) {
    const transactions = getTransactions();
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx) return;
    document.getElementById('transaction-id').value = tx.id;
    document.getElementById('stock-code').value = tx.code;
    document.getElementById('stock-name').value = tx.name;
    document.getElementById('transaction-type').value = tx.type;
    document.getElementById('transaction-price').value = tx.price;
    document.getElementById('transaction-quantity').value = tx.quantity;
    document.getElementById('transaction-date').value = tx.date;
    switchView('transaction');
  }

  function renderPriceInputsInSettings() {
    const transactions = getTransactions();
    const holdings = calculateHoldings(transactions);
    const container = document.getElementById('price-inputs-settings');
    container.innerHTML = '';
    if (Object.keys(holdings).length === 0) {
      container.innerHTML = '<p class="no-holdings">暂无持仓记录</p>';
      return;
    }
    for (const stock of Object.values(holdings)) {
      const group = document.createElement('div');
      group.className = 'price-input-group';
      group.innerHTML = `
        <label for="price-${stock.code}">${stock.name} (${stock.code})</label>
        <div class="price-input-wrapper">
          <span class="currency-symbol">$</span>
          <input type="number" id="price-${stock.code}" class="price-input" step="0.01" min="0" placeholder="${stock.avgCost.toFixed(2)}" value="${userPrices[stock.code] || ''}">
        </div>
      `;
      container.appendChild(group);
    }
  }

  function renderSettings() {
    document.getElementById('initial-funds').value = initialFunds;
    document.getElementById('exchange-rate').value = exchangeRate;
    renderPriceInputsInSettings();
  }

  function renderProfitAnalysisView() {
    const transactions = getTransactions();
    const holdings = calculateHoldings(transactions);
    const profitData = calculateProfitAnalysis(holdings, userPrices);

    document.getElementById('total-value').textContent = `$${profitData.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    document.getElementById('total-cost').textContent = `$${profitData.totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

    const totalPnlElement = document.getElementById('total-pnl');
    const totalReturnElement = document.getElementById('total-return');

    if (Math.abs(profitData.totalProfit) < 0.01) {
      totalPnlElement.textContent = '持平';
      totalPnlElement.className = 'profit-value neutral';
    } else {
      totalPnlElement.textContent = `${profitData.totalProfit > 0 ? '+' : ''}$${profitData.totalProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
      totalPnlElement.className = `profit-value ${profitData.totalProfit > 0 ? 'positive' : 'negative'}`;
    }

    if (Math.abs(profitData.totalProfitPercent) < 0.01) {
      totalReturnElement.textContent = '持平';
      totalReturnElement.className = 'profit-value neutral';
    } else {
      totalReturnElement.textContent = `${profitData.totalProfitPercent > 0 ? '+' : ''}${profitData.totalProfitPercent.toFixed(2)}%`;
      totalReturnElement.className = `profit-value ${profitData.totalProfitPercent > 0 ? 'positive' : 'negative'}`;
    }

    profitList.innerHTML = '';
    if (profitData.stockProfits.length === 0) {
      profitEmptyState.style.display = 'block';
      return;
    }
    profitEmptyState.style.display = 'none';

    for (const stock of profitData.stockProfits) {
      const item = document.createElement('li');
      item.className = 'profit-item';
      item.innerHTML = `
        <div class="profit-item-header">
          <div class="stock-info">
            <div class="stock-name">${stock.name}</div>
            <div class="stock-code">${stock.code}</div>
          </div>
          <div class="profit-status ${stock.profit > 0.01 ? 'positive' : stock.profit < -0.01 ? 'negative' : 'neutral'}">
            ${stock.profit > 0.01 ? '盈利' : stock.profit < -0.01 ? '亏损' : '持平'}
          </div>
        </div>
        <div class="profit-item-details">
          <div class="profit-col"><span class="label">持仓</span><span class="value value-quantity">${stock.quantity.toLocaleString('en-US')}</span></div>
          <div class="profit-col"><span class="label">成本</span><span class="value value-cost">$${stock.avgCost.toFixed(2)}</span></div>
          <div class="profit-col"><span class="label">现价</span><span class="value value-current-price">$${stock.currentPrice.toFixed(2)}</span></div>
          <div class="profit-col"><span class="label">市值</span><span class="value value-market-value">$${stock.currentValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span></div>
          <div class="profit-col"><span class="label">盈亏</span><span class="value ${stock.profit > 0.01 ? 'positive' : stock.profit < -0.01 ? 'negative' : 'neutral'}">${stock.profit > 0.01 ? '+' : ''}${Math.abs(stock.profit) < 0.01 ? '持平' : `$${stock.profit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}</span></div>
          <div class="profit-col"><span class="label">收益率</span><span class="value ${stock.profitPercent > 0.01 ? 'positive' : stock.profitPercent < -0.01 ? 'negative' : 'neutral'}">${stock.profitPercent > 0.01 ? '+' : ''}${Math.abs(stock.profitPercent) < 0.01 ? '持平' : `${stock.profitPercent.toFixed(2)}%`}</span></div>
        </div>
      `;
      profitList.appendChild(item);
    }
  }

  // 实时提示：账户余额、预计佣金与基于当前价格的最大可买数量（含佣金）
  function updateBuyCapacityHint() {
    if (!buyCapacityHint) return;
    const type = document.getElementById('transaction-type').value;
    const price = parseFloat(document.getElementById('transaction-price').value);
    const qty = parseInt(document.getElementById('transaction-quantity').value, 10);
    const transactionId = document.getElementById('transaction-id').value;

    // 对于卖出也提示佣金，因此不再在此直接返回

    const all = getTransactions();
    let temp = [...all];
    if (transactionId) temp = temp.filter(tx => tx.id !== transactionId);
    const currentBalance = calculateAccountBalance(temp, initialFunds);

    const safePrice = Number.isFinite(price) && price > 0 ? price : 0;

    // 计算预计佣金（基于当前输入数量，若无数量则显示 0）
    const safeQty = Number.isInteger(qty) && qty > 0 ? qty : 0;
    const estimatedFee = safeQty > 0 ? calculateCommission(safeQty) : 0;

    buyCapacityHint.style.display = 'block';
    if (type === 'buy') {
      // 在计算最多可买时，需要考虑佣金：max q 满足 price*q + fee(q) <= balance
      // fee(q) = max(5, 0.02*q)
      // 分段求解：
      // 1) 若 q <= 250，则 fee=5，price*q + 5 <= balance => q <= (balance-5)/price
      // 2) 若 q > 250，则 fee=0.02*q，(price+0.02)*q <= balance => q <= balance/(price+0.02)
      let maxQuantity = 0;
      if (safePrice > 0) {
        const candidateA = Math.floor(Math.max(0, (currentBalance - 5) / safePrice));
        const candidateB = Math.floor(currentBalance / (safePrice + 0.02));
        // 校正候选满足对应区间条件
        const validA = candidateA <= 250 ? candidateA : 250;
        const validB = candidateB > 250 ? candidateB : 250;
        // 取两者中总成本含费不超过余额的最大值
        const totalCostA = validA * safePrice + (validA > 0 ? 5 : 0);
        const totalCostB = validB * safePrice + Math.max(5, 0.02 * validB);
        maxQuantity = 0;
        if (totalCostA <= currentBalance) maxQuantity = Math.max(maxQuantity, validA);
        if (totalCostB <= currentBalance) maxQuantity = Math.max(maxQuantity, validB);
      }
      const balanceText = `$${currentBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
      const feeText = `$${estimatedFee.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
      const maxQtyText = `${Math.max(0, maxQuantity).toLocaleString('en-US')}`;
      buyCapacityHint.textContent = `账户余额：${balanceText}，预计佣金：${feeText}，最多可买：${maxQtyText} 股`;
    } else {
      const feeText = `$${estimatedFee.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
      buyCapacityHint.textContent = `预计佣金：${feeText}`;
    }
  }

  // 事件绑定
  navButtons.holdings.addEventListener('click', () => switchView('holdings'));
  navButtons.add.addEventListener('click', () => {
    transactionForm.reset();
    document.getElementById('transaction-id').value = '';
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('transaction-date').value = `${yyyy}-${mm}-${dd}`;
    switchView('transaction');
    updateBuyCapacityHint();
  });
  navButtons.history.addEventListener('click', () => switchView('history'));
  if (historyStockFilter) {
    historyStockFilter.addEventListener('change', () => {
      renderHistory();
    });
  }
  if (filterModeHolding && filterModeSold) {
    filterModeHolding.addEventListener('click', () => {
      historyFilterMode = 'holding';
      filterModeHolding.classList.add('active');
      filterModeSold.classList.remove('active');
      renderHistory();
    });
    filterModeSold.addEventListener('click', () => {
      historyFilterMode = 'sold';
      filterModeSold.classList.add('active');
      filterModeHolding.classList.remove('active');
      renderHistory();
    });
  }
  navButtons.profit.addEventListener('click', () => switchView('profit'));
  navButtons.settings.addEventListener('click', () => switchView('settings'));

  document.getElementById('save-all-settings-btn').addEventListener('click', () => {
    const newInitialFunds = parseFloat(document.getElementById('initial-funds').value) || 0;
    const newExchangeRate = parseFloat(document.getElementById('exchange-rate').value) || 7.2;

    const transactions = getTransactions();
    const holdings = calculateHoldings(transactions);

    for (const stock of Object.values(holdings)) {
      const input = document.getElementById(`price-${stock.code}`);
      if (input && input.value) {
        userPrices[stock.code] = parseFloat(input.value);
      }
    }

    initialFunds = newInitialFunds;
    exchangeRate = newExchangeRate;

    setInitialFunds(initialFunds);
    setExchangeRate(exchangeRate);
    saveUserPrices(userPrices);

    renderHoldings();
    renderProfitAnalysisView();

    alert('所有设置已保存！');
    if (document.querySelector('#transaction-view').classList.contains('active')) {
      updateBuyCapacityHint();
    }
  });

  document.getElementById('export-data-btn').addEventListener('click', () => {
    const data = {
      transactions: getTransactions(),
      userPrices: userPrices,
      initialFunds: initialFunds,
      exchangeRate: exchangeRate,
    };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('import-data-btn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          if (data.transactions) saveTransactions(data.transactions);
          if (data.userPrices) {
            userPrices = data.userPrices;
            saveUserPrices(userPrices);
          }
          if (data.initialFunds !== undefined) {
            initialFunds = data.initialFunds;
            setInitialFunds(initialFunds);
          }
          if (data.exchangeRate !== undefined) {
            exchangeRate = data.exchangeRate;
            setExchangeRate(exchangeRate);
          }
          renderHoldings();
          renderHistory();
          renderSettings();
          alert('数据导入成功！');
        } catch (err) {
          alert('数据导入失败，请检查文件格式！');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });


  cancelBtn.addEventListener('click', () => {
    transactionForm.reset();
    switchView(previousView);
  });

  // 表单输入变更时实时更新提示 + 校验
  const priceInput = document.getElementById('transaction-price');
  const typeSelect = document.getElementById('transaction-type');
  const qtyInput = document.getElementById('transaction-quantity');
  const codeInput = document.getElementById('stock-code');
  const nameInput = document.getElementById('stock-name');
  const dateInput = document.getElementById('transaction-date');
  if (priceInput) priceInput.addEventListener('input', updateBuyCapacityHint);
  if (typeSelect) typeSelect.addEventListener('change', updateBuyCapacityHint);
  if (qtyInput) qtyInput.addEventListener('input', updateBuyCapacityHint);
  [priceInput, typeSelect, qtyInput, codeInput, nameInput, dateInput].forEach(el => {
    if (!el) return;
    ['input', 'change', 'blur'].forEach(evt => el.addEventListener(evt, () => el.setCustomValidity('')));
  });

  transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const transactionId = document.getElementById('transaction-id').value;

    // 清理旧的自定义错误并执行原生校验
    [codeInput, nameInput, typeSelect, priceInput, qtyInput, dateInput].forEach(el => el && el.setCustomValidity(''));
    if (!transactionForm.checkValidity()) {
      transactionForm.reportValidity();
      return;
    }

    // 读取并标准化数据
    const code = codeInput.value.trim().toUpperCase();
    const name = nameInput.value.trim();
    const type = typeSelect.value.trim();
    const price = parseFloat(priceInput.value.trim());
    const quantity = parseInt(qtyInput.value.trim(), 10);
    const date = dateInput.value.trim();

    // 业务校验
    if (!Number.isFinite(price) || price <= 0) {
      priceInput.setCustomValidity('价格必须是大于 0 的数字');
      priceInput.reportValidity();
      return;
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      qtyInput.setCustomValidity('数量必须是正整数');
      qtyInput.reportValidity();
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    if (date > todayStr) {
      dateInput.setCustomValidity('交易日期不能晚于今天');
      dateInput.reportValidity();
      return;
    }

    const transactionData = {
      id: transactionId || Date.now().toString(),
      code,
      name,
      type,
      price,
      quantity,
      date,
    };

    if (transactionData.type === 'buy') {
      const transactions = getTransactions();
      let temp = [...transactions];
      if (transactionId) temp = temp.filter(tx => tx.id !== transactionId);
      const currentBalance = calculateAccountBalance(temp, initialFunds);
      const fee = calculateCommission(transactionData.quantity);
      const totalCost = transactionData.price * transactionData.quantity + fee;
      if (totalCost > currentBalance) {
        // 使用与提示一致的含佣金最大可买数量
        const price = transactionData.price;
        const candidateA = Math.floor(Math.max(0, (currentBalance - 5) / price));
        const candidateB = Math.floor(currentBalance / (price + 0.02));
        const validA = candidateA <= 250 ? candidateA : 250;
        const validB = candidateB > 250 ? candidateB : 250;
        let maxQuantity = 0;
        const costA = validA * price + (validA > 0 ? 5 : 0);
        const costB = validB * price + Math.max(5, 0.02 * validB);
        if (costA <= currentBalance) maxQuantity = Math.max(maxQuantity, validA);
        if (costB <= currentBalance) maxQuantity = Math.max(maxQuantity, validB);
        if (qtyInput) {
          qtyInput.setCustomValidity(`余额不足，最多可买 ${Math.max(0, maxQuantity)} 股`);
          qtyInput.reportValidity();
        }
        return;
      }
    }

    if (transactionData.type === 'sell') {
      const transactions = getTransactions();
      let temp = [...transactions];
      if (transactionId) temp = temp.filter(tx => tx.id !== transactionId);
      const holdings = calculateHoldings(temp);
      const holding = holdings[transactionData.code];
      const available = holding ? holding.quantity : 0;
      if (transactionData.quantity > available) {
        if (qtyInput) {
          qtyInput.setCustomValidity(`持仓不足，当前可卖 ${available} 股`);
          qtyInput.reportValidity();
        }
        return;
      }
    }

    const transactions = getTransactions();
    if (transactionId) {
      const index = transactions.findIndex(tx => tx.id === transactionId);
      if (index !== -1) transactions[index] = transactionData;
    } else {
      transactions.push(transactionData);
    }
    saveTransactions(transactions);
    transactionForm.reset();
    switchView(previousView);
  });

  // 初始化渲染
  const savedTab = getCurrentTab();
  switchView(savedTab);

  // 首次根据当前视图显隐头部筛选器
  if (historyStockFilter) {
    const isHistoryActive = document.querySelector('#history-view').classList.contains('active');
    historyStockFilter.style.display = isHistoryActive ? 'block' : 'none';
  }

  // 跟随系统主题变化刷新当前视图
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const onThemeChange = () => {
    const currentView = document.querySelector('.view.active').id.replace('-view', '');
    if (currentView === 'holdings') renderHoldings();
    else if (currentView === 'history') renderHistory();
    else if (currentView === 'profit') renderProfitAnalysisView();
    else if (currentView === 'settings') renderSettings();
  };
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', onThemeChange);
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(onThemeChange);
  }
}
