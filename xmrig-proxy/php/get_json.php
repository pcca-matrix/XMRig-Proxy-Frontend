<?php
header('Content-Type: application/json');
if(!isset($_POST["cc"])) die;

//-- Array of proxies ip adresse, port and token
$proxy_list = array();
$proxy_list[0] = array("ip"=>"127.0.0.1", "port"=>"8115", "token"=>"SECRET");

switch($_POST['cc'])
{
    case 'read_db':
		$proxy_id = $_POST["proxy"];
		$db = new SQLite3('proxy.db');
		$days = intval($_POST["days"]);
		$date = strtotime(date('Y-m-d H:i:s'))-($days * 24 * 60 * 60);
		$date = date('Y-m-d H:i:s',$date);
		$proxy_adress = $proxy_list[$proxy_id]["ip"].":".$proxy_list[$proxy_id]["port"];	
		$results = $db->query("SELECT * FROM 'proxy_$proxy_adress' WHERE date >= '$date'");
		$i=0;
		$arr = array();
		while($row = $results->fetchArray()) {		
			$arr[$i]['date'] = $row['date'];
			$arr[$i]['value'] = $row['value'];
			$i++;
		}
		echo json_encode($arr);
    break;
   
    case 'write_db':
		$db = new SQLite3('proxy.db');
		foreach($proxy_list as $proxy){
			$address = $proxy["ip"].":".$proxy["port"];
			$db->query("CREATE TABLE IF NOT EXISTS 'proxy_$address' ('id_auto' INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 'date' DATETIME, 'value' NUMERIC);");			
			$endpoint = "summary";
			$arr = json_decode(get_curl_data($proxy["ip"], $proxy["port"], $endpoint, $proxy["token"]),true);
			if($arr['uptime'] > 0){
				$val = round($arr['hashrate']['total'][2]*1000,2);
				$date = date('Y-m-d H:i'); 
				$stm = "INSERT INTO 'proxy_$address' ('date' ,'value') VALUES('$date', '$val')";
				$db->query($stm);
			}
		}		
    break;
   
    case 'proxy_data':
		$proxy_id = $_POST["proxy"];
		$endpoint = $_POST["endpoint"];
		echo get_curl_data($proxy_list[$proxy_id]["ip"], $proxy_list[$proxy_id]["port"], $endpoint, $proxy_list[$proxy_id]["token"]);
    break;
	
	case 'put_data':
	    $proxy_id = $_POST["proxy"];
		$endpoint = $_POST["endpoint"];
		$url = "http://".$proxy_list[$proxy_id]["ip"].":".$proxy_list[$proxy_id]["port"]."/1/$endpoint";
		$token = $proxy_list[$proxy_id]["token"];
		$authorization = "Authorization: Bearer ".$token;
		$post_data = $_POST["json"];
		foreach($post_data as $k=>$v){
			if($v == "false")$post_data[$k] = false; if($v == "true")$post_data[$k] = true;
		}
		$data_json = json_encode($post_data);
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_HTTPHEADER, array(                                                                          
			'Content-Type: application/json',                                                                                
			'Content-Length: ' . strlen($data_json),
			$authorization) 
		);
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
		curl_setopt($ch, CURLOPT_POSTFIELDS,$data_json);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		$response  = curl_exec($ch);
		curl_close($ch);
		echo json_encode($response);
	break;

}

/******************************************************************/
/* 						FUNCTIONS								  */
/******************************************************************/
function get_curl_data($ip, $port, $endpoint, $token){
	$ch = curl_init();
	$authorization = "Authorization: Bearer ".$token;
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json' , $authorization ));
	curl_setopt ($ch, CURLOPT_URL, "http://$ip:$port/1/$endpoint");
	curl_setopt ($ch, CURLOPT_RETURNTRANSFER, 1);
	$data = curl_exec($ch);
	curl_close ($ch);
	return($data); 	
}
?>
