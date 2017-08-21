var express = require('express');

var server = express();

server.use(express.static('./test_server/public'));
server.use('/build', express.static('./build'));
server.use('/build/graphics', express.static('./build/graphics'));

server.listen(80, function () {
  console.log('Example app listening on port 80!');
});
