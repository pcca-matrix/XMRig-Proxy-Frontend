# XMRig-Proxy-Frontend
Simple Mobile HTML Frontend for XMRig-proxy based on [Framework7](https://github.com/framework7io/framework7)

-It shows all the important informations and allow change pool and settings with xmrig-proxy API.

-Manage multiple proxy instances

-Switch Pool Every x minutes automatically or set the percentage of time spent on each pool

-Keep history of pool change with stats

Compatible with IOS, Android, Desktop (Chrome, Firefox, IE)

<img src="https://raw.githubusercontent.com/pcca-matrix/XMRig-Proxy-Frontend/master/xmrig-proxy/img/demo.png" width="200">

## Installation
You must have apache webserver with php 5.x or 7.x with extension sqlite3 and curl enabled.

sudo apt-get install apache2 libapache2-mod-php php-sqlite3 php-curl

extract directory xmrig-proxy to your webserver root

Sqlite Database directory shall be owned by www-data

sudo chown www-data /var/www/html/xmrig-proxy/php/

Add cronjob every 5 min to your crontab

*/5 * * * * /usr/bin/php /var/www/html/xmrig-proxy/php/cron.php

You must set an access token and set "restricted": false to the xmrig-proxy config.json

## Settings
Change http path in php/cron.php according to your webserver configuration

$php_path = "http://<i></i>127.0.0.1/xmrig-proxy";

Add proxies ip, port, token authorization and app_password in php/config.php

$proxy_list[0] = array("ip"=>"127.0.0.1", "port"=>"8000", "token"=>"SECRET", "label"=>"YOUR PROXY 1 LABEL");

$proxy_list[1] = array("ip"=>"127.0.0.1", "port"=>"8200", "token"=>"SECRET", "label"=>"YOUR PROXY 2 LABEL");

$app_password = "SECRET";

The app_password is the password asked when you open webapp. 

## Usage
For pool change , add all your pools to the xmrig-proxy config.json and select one from within the webapp.

Percentage change :

percentage is calculate on day (1440 min) , if you put 10% on pool#1 and 90% on pool#2 then proxy will stay on pool#1 for 144 mins and on pool#2 for 1296 mins.

Time change:

miner stay on pool for defined hours then swap to next pools.

## Bugs
If you found a Bug please let me know and create an Issue !

## Enhancements
Create an Issue with your Idea or open a Pull Request!

## WIP

Automatic switching pool to mine the most profitable coin

Add and remove pool from app

[Cryptonote Mining Pools](http://hashing.mine.nu)

* XMR: `44ZD1s12j8M6upWXGUS1R2YzXKiKpVmTzYKbrLYSp6pDWvW7C4ALfQ2VNyg6pt2tvA94Tu5kbcDLcLbTvjJBYk6zLFYmWM3`
* BTC: `1F2UpGsQETpyCCnMEBLFc5whDFAhgXJVU1`
