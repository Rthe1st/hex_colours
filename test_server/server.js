var express = require('express');

var server = express();

server.use(express.static('./public'));
 server.use('/build', express.static('../build'));
 
server.listen(80, function () {
  console.log('Example app listening on port 80!')
});