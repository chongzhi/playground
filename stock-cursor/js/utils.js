// 工具函数库
class Utils {
    // 生成唯一ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 格式化金额，保留2位小数
    static formatMoney(amount) {
        return Number(amount).toFixed(2);
    }

    // 格式化日期
    static formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        switch(format) {
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'MM-DD':
                return `${month}-${day}`;
            case 'YYYY/MM/DD':
                return `${year}/${month}/${day}`;
            default:
                return `${year}-${month}-${day}`;
        }
    }

    // 获取今天的日期字符串
    static getTodayString() {
        return this.formatDate(new Date());
    }

    // 计算百分比
    static formatPercent(value) {
        return (value * 100).toFixed(2) + '%';
    }

    // 计算盈亏颜色类
    static getProfitColorClass(value) {
        if (value > 0) return 'profit-positive';
        if (value < 0) return 'profit-negative';
        return 'profit-neutral';
    }

    // 防抖函数
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 显示提示消息
    static showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }

    // 确认对话框
    static confirm(message) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'confirm-modal';
            modal.innerHTML = `
                <div class="confirm-content">
                    <p>${message}</p>
                    <div class="confirm-buttons">
                        <button class="btn btn-secondary" data-action="cancel">取消</button>
                        <button class="btn btn-primary" data-action="confirm">确认</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.addEventListener('click', (e) => {
                if (e.target.dataset.action === 'confirm') {
                    resolve(true);
                } else if (e.target.dataset.action === 'cancel') {
                    resolve(false);
                }
                modal.remove();
            });
        });
    }

    // 验证股票代码格式
    static validateStockCode(code) {
        // 简单的股票代码验证：6位数字或字母数字组合
        const pattern = /^[A-Za-z0-9]{2,10}$/;
        return pattern.test(code);
    }

    // 验证数字
    static validateNumber(value, min = 0) {
        const num = parseFloat(value);
        return !isNaN(num) && num >= min;
    }

    // 深拷贝
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
}

// 导出给其他模块使用
window.Utils = Utils;