// 调试脚本：验证增量计算逻辑

// 模拟数据
const week43Cumulative = {
  signed_premium_yuan: 33890000, // 3389万（累计）
};

const week44Cumulative = {
  signed_premium_yuan: 34650000, // 3465万（累计）
};

// 计算增量
const increment = week44Cumulative.signed_premium_yuan - week43Cumulative.signed_premium_yuan;
const incrementWan = Math.round(increment / 10000);

console.log('第43周累计签单保费:', week43Cumulative.signed_premium_yuan / 10000, '万元');
console.log('第44周累计签单保费:', week44Cumulative.signed_premium_yuan / 10000, '万元');
console.log('第44周增量（应该显示的值）:', incrementWan, '万元');
console.log('');
console.log('如果显示3465万，说明使用了累计值而不是增量值');
console.log('如果显示76万，说明正确使用了增量值');
