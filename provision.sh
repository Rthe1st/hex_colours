curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
apt-get install -y nodejs
node install gulp --global

npm install . --dev
cd /vagrant/test_server

nodejs --use_strict --harmony_scoping ./server.js