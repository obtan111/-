const fs = require('fs');

// 读取源文件
let content = fs.readFileSync('D:/edge下载/page.tsx', 'utf8');

// 替换第一行的引号
content = content.replace("'use client';", '"use client";');

// 写入目标文件
fs.writeFileSync('src/app/page.tsx', content, 'utf8');

console.log('File copied successfully!');
console.log('Total lines:', content.split('\n').length);