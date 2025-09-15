const fs = require('fs');

const data = JSON.parse(fs.readFileSync('d:\\Project\\avalon_map\\ava.json', 'utf8'));
const newData = data.map(item => {
    if (item.img) delete item.img;
    return item;
});
fs.writeFileSync('d:\\Project\\avalon_map\\ava.json', JSON.stringify(newData, null, 4));
console.log('Đã ghi đè file ava.json!');