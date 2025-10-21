// storage.js
// 数据持久化与应用状态存取封装

import { roundToDecimals } from './precision.js';

export const STORAGE_KEYS = {
  TRANSACTIONS: 'stockTransactions',
  USER_PRICES: 'userStockPrices',
  INITIAL_FUNDS: 'initialFunds',
  EXCHANGE_RATE: 'exchangeRate',
  TAB_STATE: 'currentTab',
};

// 旧版本可能使用的键名（来自历史实现）
const LEGACY_KEYS = {
  TRANSACTIONS: 'stock_transactions',
  HOLDINGS: 'stock_holdings',
  SETTINGS: 'stock_settings',
};

/**
 * 如果检测到旧版本的本地存储且新键没有数据，则尝试迁移。
 * 该函数在模块加载时执行一次。
 */
function migrateFromLegacyStorageIfNeeded() {
  try {
    const hasNewTransactions = Boolean(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS));
    const legacyTransactionsRaw = localStorage.getItem(LEGACY_KEYS.TRANSACTIONS);
    if (!hasNewTransactions && legacyTransactionsRaw) {
      let legacyTransactions;
      try {
        legacyTransactions = JSON.parse(legacyTransactionsRaw) || [];
      } catch (error) {
        console.warn('Failed to parse legacy transactions, skip migration:', error);
        legacyTransactions = [];
      }

      if (Array.isArray(legacyTransactions) && legacyTransactions.length > 0) {
        const migrated = legacyTransactions.map((tx, index) => {
          const safeNumber = (v, fallback = 0) => {
            const n = typeof v === 'string' ? parseFloat(v) : v;
            return Number.isFinite(n) ? n : fallback;
          };
          const safeInt = (v, fallback = 0) => {
            const n = typeof v === 'string' ? parseInt(v, 10) : v;
            return Number.isFinite(n) ? n : fallback;
          };
          const normalizeType = (t) => {
            if (!t) return 'buy';
            const s = String(t).toLowerCase();
            if (s.includes('buy') || s === 'b' || s === 'in') return 'buy';
            if (s.includes('sell') || s === 's' || s === 'out') return 'sell';
            return 'buy';
          };

          const id = tx.id || tx.createTime || `${Date.now()}_${index}`;
          const code = tx.code || tx.symbol || tx.ticker || '';
          const name = tx.name || tx.stockName || '';
          const type = normalizeType(tx.type);
          const price = safeNumber(tx.price ?? tx.unitPrice ?? tx.avgPrice, 0);
          const quantity = safeInt(tx.quantity ?? tx.shares ?? tx.amount, 0);
          const date = (tx.date || (tx.createTime ? String(tx.createTime).slice(0, 10) : '') || new Date().toISOString().split('T')[0]);

          return { id, code: String(code).toUpperCase(), name, type, price, quantity, date };
        });

        // 仅在迁移后确实有有效数据时写入
        if (migrated.some(tx => tx.code && tx.quantity && tx.price)) {
          localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(migrated));
          console.info(`[storage] Migrated ${migrated.length} transactions from legacy storage.`);
        }
      }
    }

    // 如果旧设置里曾保存过 initialFunds / exchangeRate，则尝试迁移
    const hasInitialFunds = Boolean(localStorage.getItem(STORAGE_KEYS.INITIAL_FUNDS));
    const hasExchangeRate = Boolean(localStorage.getItem(STORAGE_KEYS.EXCHANGE_RATE));
    const legacySettingsRaw = localStorage.getItem(LEGACY_KEYS.SETTINGS);
    if ((!hasInitialFunds || !hasExchangeRate) && legacySettingsRaw) {
      try {
        const legacySettings = JSON.parse(legacySettingsRaw) || {};
        if (!hasInitialFunds && legacySettings.initialFunds != null) {
          localStorage.setItem(STORAGE_KEYS.INITIAL_FUNDS, String(legacySettings.initialFunds));
        }
        if (!hasExchangeRate && legacySettings.exchangeRate != null) {
          localStorage.setItem(STORAGE_KEYS.EXCHANGE_RATE, String(legacySettings.exchangeRate));
        }
      } catch (error) {
        // 忽略设置迁移错误
      }
    }
  } catch (error) {
    console.warn('Legacy storage migration failed:', error);
  }
}

// 模块加载时尝试迁移一次
migrateFromLegacyStorageIfNeeded();

// 交易记录
export function getTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('Failed to parse transactions from storage:', error);
    return [];
  }
}

export function saveTransactions(transactions) {
  // 确保所有价格字段都精确到2位小数
  const normalizedTransactions = transactions.map(tx => ({
    ...tx,
    price: roundToDecimals(tx.price)
  }));
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(normalizedTransactions));
}

// 用户自定义现价映射
export function getUserPrices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PRICES);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn('Failed to parse user prices from storage:', error);
    return {};
  }
}

export function saveUserPrices(userPrices) {
  // 确保所有价格都精确到2位小数
  const normalizedPrices = {};
  for (const [code, price] of Object.entries(userPrices)) {
    normalizedPrices[code] = roundToDecimals(price);
  }
  localStorage.setItem(STORAGE_KEYS.USER_PRICES, JSON.stringify(normalizedPrices));
}

// 初始资金
export function getInitialFunds() {
  const raw = localStorage.getItem(STORAGE_KEYS.INITIAL_FUNDS);
  const value = raw ? parseFloat(raw) : 0;
  return Number.isFinite(value) ? roundToDecimals(value) : 0;
}

export function setInitialFunds(value) {
  const normalized = roundToDecimals(value ?? 0);
  localStorage.setItem(STORAGE_KEYS.INITIAL_FUNDS, String(normalized));
}

// 汇率
export function getExchangeRate() {
  const raw = localStorage.getItem(STORAGE_KEYS.EXCHANGE_RATE);
  const value = raw ? parseFloat(raw) : 7.2;
  return Number.isFinite(value) ? roundToDecimals(value) : 7.2;
}

export function setExchangeRate(value) {
  const normalized = roundToDecimals(value ?? 7.2);
  localStorage.setItem(STORAGE_KEYS.EXCHANGE_RATE, String(normalized));
}

// 当前 Tab
export function getCurrentTab() {
  return localStorage.getItem(STORAGE_KEYS.TAB_STATE) || 'holdings';
}

export function setCurrentTab(tabName) {
  localStorage.setItem(STORAGE_KEYS.TAB_STATE, tabName);
}

// 仅清空本应用相关键，避免误删同域其他键
export function clearAppData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.USER_PRICES);
    localStorage.removeItem(STORAGE_KEYS.INITIAL_FUNDS);
    localStorage.removeItem(STORAGE_KEYS.EXCHANGE_RATE);
    localStorage.removeItem(STORAGE_KEYS.TAB_STATE);
  } catch (error) {
    console.warn('Failed to clear app data:', error);
  }
}
