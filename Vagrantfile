# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure("2") do |config|

  config.ssh.insert_key = false

  config.vm.box = "hashicorp/precise64"

  config.vm.network "forwarded_port", host: 8080, guest: 80

  config.vm.provision "shell", path: "provision.sh"

  config.vm.provider "virtualbox" do |v|
      v.memory = 2048
      v.cpus = 1
  end

end
