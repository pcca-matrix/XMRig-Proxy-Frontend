<?php
//-- Http path of xmrig-remote 
$php_path = "http://127.0.0.1/xmrig-proxy";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL,$php_path."/php/get_json.php");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS,http_build_query(array('cc' => 'write_db')));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$server_output = curl_exec ($ch);
curl_close ($ch);

/******************************************************************/
/* 		Get jobs from Sqlite DB (auto-switching pool)	(WIP) 	  */
/******************************************************************/
function get_dbJobs(){
	
}
?>