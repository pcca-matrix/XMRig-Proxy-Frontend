<?php
//-- Webapp password
$app_password = "SECRET";

//-- Array of proxies ip adresse, port ,token and label
$proxy_list = array();
$proxy_list[0] = array("ip"=>"127.0.0.1", "port"=>"8000", "token"=>"SECRET", "label"=>"PROXY 1 LABEL");

$max_history = 150; //-- max history records per proxy for json file
$max_history_days = 180; //-- max days of graph history
?>