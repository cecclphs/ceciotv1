var fs = require('fs');
var csvWriter = require('csv-write-stream')
const moment = require('moment');

var writer = csvWriter({ headers: ["id", "name","epoch"],sendHeaders: false})
writer.pipe(fs.createWriteStream('/home/pi/ceciot/access.csv', {flags: 'a'}))
writer.write([3,'Chin Zhe Ying',moment().valueOf()])
writer.end()
