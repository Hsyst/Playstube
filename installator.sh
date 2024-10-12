#!/bin/bash
echo "Welcome to the Installator of Playstube, wait..."
sleep 5
clear
echo "Installing..."
echo "Type your password below: "
sudo apt update && apt upgrade -y
sudo apt install apache2 python3-full unzip -y
sudo apt install python3-flask-cors -y
pip install flask_cors
wget https://github.com/Hsyst/Playstube/raw/main/playstube-zipped.zip
sudo mv playstube-zipped.zip pla.zip
sudo chmod 777 pla.zip
unzip pla.zip
rm -r /var/www/html/*
cp -r * /var/www/html
rm -r *
sudo rm -r pla.zip
sudo rm -r /var/www/html/pla.zip
sudo wget https://github.com/Hsyst/Playstube/raw/main/playstube-start
sudo wget https://github.com/Hsyst/Playstube/raw/main/playstube-stop
sudo cp playstube-* /bin
sudo chmod 777 /bin/playstube-*
echo "Start and Stop commands installed succefully!"
sleep 3
clear
echo "Rebooting..."
echo "CTRL + C to Stop"
sleep 5
