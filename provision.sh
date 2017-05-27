apt-get install -y curl
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
apt-get install -y nodejs
#think this doesn't work cause /vagrant isn't mapped at vagrant up?
npm install gulp --global
npm install ava --global
cd /vagrant
npm install /vagrant --no-bin-link
#--manual steps:
#cd /vagrant
#----start gulp
#gulp
#----start server
#sudo nodejs --use_strict --harmony /vagrant/test_server/server.js
