const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'dist/glcore.js');

fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) throw err;

    // 定义一个替换函数，它接受原始数据和替换规则数组
    function replaceStrings(data, replacements) {
        replacements.forEach(replacement => {
            data = data.replace(new RegExp(replacement.from, 'g'), replacement.to);
        });
        return data;
    }

    // 定义替换规则数组，每个规则是一个对象，包含 from 和 to 属性
    const replacements = [
        { from: 'maptalks', to: 'mapgeoglThree' },
        { from: 'MAPTALKS', to: 'MAPGEOGLTHREE' },
        { from: '1.0.0-rc.40', to: '1.0.0' }
        // 添加更多的替换规则
    ];

    // 使用 replaceStrings 函数替换所有字符串
    const result = replaceStrings(data, replacements);

    // 将替换后的内容写回文件
    fs.writeFile(filePath, result, 'utf8', (err) => {
        if (err) throw err;
        console.log('字符串替换完成');
    });
});
