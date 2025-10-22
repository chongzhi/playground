// precision.js
// 金融计算精度工具 - 确保所有金额计算精确到2位小数

/**
 * 将数字四舍五入到指定小数位
 * @param {number} num - 要处理的数字
 * @param {number} decimals - 小数位数，默认2位
 * @returns {number}
 */
export function roundToDecimals(num, decimals = 2) {
  if (!Number.isFinite(num)) return 0;
  const multiplier = Math.pow(10, decimals);
  return Math.round(num * multiplier) / multiplier;
}

/**
 * 精确加法 - 避免浮点数精度问题
 * @param {number} a 
 * @param {number} b 
 * @returns {number}
 */
export function add(a, b) {
  const aFixed = roundToDecimals(a);
  const bFixed = roundToDecimals(b);
  // 转换为整数计算，避免浮点误差
  return roundToDecimals((aFixed * 100 + bFixed * 100) / 100);
}

/**
 * 精确减法
 * @param {number} a 
 * @param {number} b 
 * @returns {number}
 */
export function subtract(a, b) {
  const aFixed = roundToDecimals(a);
  const bFixed = roundToDecimals(b);
  return roundToDecimals((aFixed * 100 - bFixed * 100) / 100);
}

/**
 * 精确乘法
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function multiply(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  // 在计算过程中保持更高精度，只在最终结果四舍五入到2位小数
  const result = a * b;
  return roundToDecimals(result);
}

/**
 * 精确除法
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function divide(a, b) {
  if (b === 0 || !Number.isFinite(a) || !Number.isFinite(b)) return 0;
  // 在计算过程中保持更高精度，只在最终结果四舍五入到2位小数
  const result = a / b;
  return roundToDecimals(result);
}

/**
 * 格式化金额显示 - 保留2位小数
 * @param {number} amount 
 * @param {string} currency - 货币符号，默认 '$'
 * @returns {string}
 */
export function formatMoney(amount, currency = '$') {
  const fixed = roundToDecimals(amount);
  return `${currency}${fixed.toFixed(2)}`;
}

/**
 * 格式化百分比 - 保留2位小数
 * @param {number} percent 
 * @returns {string}
 */
export function formatPercent(percent) {
  const fixed = roundToDecimals(percent);
  return `${fixed.toFixed(2)}%`;
}

/**
 * 批量处理价格数据 - 确保所有价格字段都是2位小数
 * @param {Object} data 
 * @returns {Object}
 */
export function normalizePrices(data) {
  if (Array.isArray(data)) {
    return data.map(item => normalizePrices(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const normalized = {};
    for (const [key, value] of Object.entries(data)) {
      // 识别价格相关字段
      const isPriceField = ['price', 'cost', 'avgCost', 'totalCost', 
                           'currentPrice', 'value', 'totalValue', 
                           'currentValue', 'balance', 'funds', 'amount'].includes(key);
      
      if (isPriceField && typeof value === 'number') {
        normalized[key] = roundToDecimals(value);
      } else if (typeof value === 'object') {
        normalized[key] = normalizePrices(value);
      } else {
        normalized[key] = value;
      }
    }
    return normalized;
  }
  
  return data;
}

