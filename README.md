# XMRig-Proxy-Frontend
Simple Mobile HTML Frontend for XMRig-proxy based on [Framework7](https://github.com/framework7io/framework7)
It shows all the important informations and allow change pool and settings with xmrig-proxy API.
Compatible with Ios, Android, Desktop

<img src="https://raw.githubusercontent.com/pcca-matrix/XMRig-Proxy-Frontend/master/xmrig-proxy/img/demo.png" width="200">

## Installation
You must have apache webserver with php 5.x or 7.x with extension sqlite3 and curl enabled.
sudo apt-get install apache2 libapache2-mod-php php-sqlite3 php-curl

extract directory xmrig-proxy to your webserver root

Sqlite Database directory shall be owned by www-data
sudo chown www-data /var/www/html/xmrig-proxy/php/

Add cronjob every 5 min to your crontab

*/5 * * * * /usr/bin/php /var/www/html/xmrig-proxy/php/cron.php

You must set access token and set "restricted": false to the xmrig-proxy config.json

## Settings
Change http path in php/cron.php according to your webserver configuration

$php_path = "http://127.0.0.1/xmrig-proxy";

Add proxies ip, port and token Authorization in php/get_json.php

$proxy_list[0] = array("ip"=>"127.0.0.1", "port"=>"8000", "token"=>"SECRET");

## Usage
For pool change , add all your pools to the xmrig-proxy config.json.

## Bugs
If you found a Bug please let me know and create an Issue !

## Enhancements
Create an Issue with your Idea or open a Pull Request!

## WIP
Switch Pool Every x minutes automatically or set the percentage of time spent on each pool
managing multiple proxies
add password protect
