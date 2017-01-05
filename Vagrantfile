# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure("2") do |config|

  config.ssh.insert_key = false

  config.vm.box = "ubuntu/trusty64"

  config.vm.network "forwarded_port", host: 80, guest: 80
  
  #config.vm.network "private_network", ip: "192.168.33.10"
  #host_ip: "192.168.0.*" cant be used because it screws with docker install

  config.vm.provision "shell", path: "provision.sh"
  
end