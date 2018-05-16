// Dom7
var $$ = Dom7;

// Init App
var app = new Framework7({
  id: 'io.framework7.proxy',
  root: '#app',
  name: 'XMRig Proxy',
  theme: 'auto',
  routes: routes,
  notification: {
	title: '',
	titleRightText: '',
	subtitle: '',
	icon: '<i class="icon icon-xmrig"></i>',
	closeTimeout: 3000,
  }
});

var password = false;
if(localStorage.getItem('save-pass') == "true") password = localStorage.getItem('xmrig-pass');
var mainView = app.views.create('.view-main', {url: '/'});
var proxy_id = 0;
var refresh = false;
var configTimer = false;
var config_data = {};
var proxy_data = {};
var data_session = { "workers_set":[ {"sort_id":"12","sort_order":"asc"} ] };
var days = 1;
var refresh_ms = 35000;
window.onresize = function() { Plotly.Plots.resize('proxy_hashrate'); }

//-- Login Page Init
$$(document).on('page:init', '.page[data-name="login"]', function (e) {
	$('#enter_pass').on("click",function(){
		password = window.btoa( $$('input[name=password]').val() );
		app.request({url:'php/get_json.php', method:"POST", data:{cc:"check_password"}, headers:{'Authorization': password}, dataType:"json", 
			success: function (data) {
				if(data == true){
					if($$('input[name=keep_logged]').prop('checked') === true){
						localStorage.setItem('save-pass', true);
						localStorage.setItem('xmrig-pass', password);
					}
					mainView.router.refreshPage();
				}else{
					app.dialog.alert('Wrong Password!');
					$$('input[name=password]').val("");
				}
			},error: function(xhr, status){
				net_fail();
			}
		});	
	});
});

//-- Main Page Init
$$(document).on('page:init', '.page[data-name="main"]', function (e) {
	app.request.setup({ beforeSend() { StatsUpdate() }, headers: {'Authorization': password } });
	refresh = function(){ get_data(); graph(); };
	refresh();
	configTimer = setInterval(function(){ refresh() }, refresh_ms);
	
	$$('#mindays').on("click", function() {
		if(days > 1) { days--; graph(); }
		$('#numdays').text(days);
	});

	$$('#maxdays').on("click", function() {
		days++; graph();
		$('#numdays').text(days);
	});	

	$$('#disconnect').on("click", function(){
		app.dialog.confirm('Disconnect  ?', 'Confirm', function () {
			localStorage.removeItem('save-pass');
			localStorage.removeItem('xmrig-pass');
			password = false;
			clearInterval(configTimer);
			mainView.router.refreshPage();
		});
	});
	
	$$('#change_proxy').on("change", function(e) {
		proxy_id = this.value;
		$.each( $('.numeric-cell'), function( i ){ $(this).html(""); }); //-- clean html datas
		app.dialog.preloader('Changing proxy ...');
		refresh();
		setTimeout(function(){ app.dialog.close(); }, 2450);
	});
});

//-- Main Page Back Into View
$$(document).on('page:afterin', '.page[data-name="main"]', function (e) {
	refresh = function(){ get_data(); graph(); };
});
	
//-- Workers page Init
$$(document).on('page:init', '.page[data-name="workers"]', function (e) {
	$('.w_sort').on("click", function() {		
		var si = $$(this).find("i");
		if(si.hasClass("color-white")){
			//$('.w_sort').each(function(i, obj) { $(this).find("i").toggleClass("color-white color-blue") });
			si.toggleClass("color-white color-blue");
			data_session.workers_set.sort_order = "desc";	
		}else{
			si.toggleClass("color-blue color-white");
			data_session.workers_set.sort_order = "asc";
		}
		data_session.workers_set.sort_id = this.id.replace('sort', '');
		workers_list();
	});
	refresh = function(){workers_list()};
	refresh();
});

//-- Change pool page Init
$$(document).on('page:init', '.page[data-name="ch_pool"]', function (e) {
	$$('.title_proxy').html("Proxy <b>" + config_data.proxy_infos[proxy_id].label +"</b>" );
	get_job();	
	$.each( config_data.pools, function( i, item ){
		$('select[name=pool]').append($("<option></option>").attr("value",i).text(item.url));
		$$('#percent_pool').append(
		'<div class="item-input-wrap">'+
			item.url+'<input class="percent_input" name="'+item.url+'" type="number" placeholder="Enter percentage" validate pattern="[0-9]*" data-error-message="Only numbers please!">'+
		'</div>');
	});
	$('.percent_input').on('change', function(e){
		$('#submit_pool').show();		
	});
	
	$('#submit_pool').on('click', function(){
		var formData = app.form.convertToData('#ch_pool-form');
		var job_datas = { loop_time:formData.loop_time, pools:[], pool_hashes:proxy_data.results.hashes_total, pool_shares:proxy_data.results.accepted };
		var tot = 0;
		$.each( $('.percent_input'), function( i ){
			if(this.value) tot+=parseInt(this.value);
			job_datas.pools[i] = {"url":this.name, "percent":this.value};			
		});
		if( !(tot==100 || tot==0) ){
			app.dialog.alert('Total must be 100% for % switching!');
			return false;
		}
		if(formData.loop_time > 0 && tot != 0){
			app.dialog.alert( 'You can\'t use 2 events' );
			return false;
		}
		if(formData.loop_time > 0 || (tot == 0 && formData.loop_time == 0) ){
			delete job_datas.pools;
		}
		app.dialog.confirm('Confirm change ?', 'Confirm', function () {
			app.request.post('php/get_json.php', { cc:"write_job", proxy:proxy_id, job_datas:job_datas, proxy_pool:config_data.pools[0]}, function (data) {
				app.notification.create({text: 'Job saved successfully'}).open();
				$('#submit_pool').hide();
				get_data();
				//setTimeout(function(){ get_job(); }, 5000);			
			},"json");
		});
	});
	
	$('select[name=pool]').on('change', function(e){
		var index = this.value;
		app.dialog.confirm('to '+$(this).find(":selected").text()+' ?', 'Change Pool', function () {
			var selected_pool = config_data.pools[index].url;
				app.dialog.preloader('Changing pool ...');
				app.request.post('php/get_json.php', {cc:"put_data",  mode:'switch', proxy:proxy_id, proxy_config_data:config_data, summary_array:proxy_data, new_pool:selected_pool}, function (data) {
					if(data){
						app.dialog.close();
						$("#act_pool").html( config_data.pools[index].url );
						app.notification.create({text: 'Pool changed successfully'}).open();
						get_data();
						//setTimeout(function(){ get_job(); }, 5000);	ne fonctionne pas	
					}
				},"json");
		}, function(){
			$("select[name=pool]").val(0);
		});
	});
	
	$("input[name=loop_time]").on("change", function(){ 
		$('#submit_pool').show();	
	});
})

//-- Settings page Init
$$(document).on('page:init', '.page[data-name="settings"]', function (e) {	
	get_data();	
	$$('.delete_file').on("click", function(e){	
		delete_file($(this).data().name, $(this).data().file, proxy_id)
	});	
	$$('.title_proxy').html("Proxy <b>" + config_data.proxy_infos[proxy_id].label +"</b>" );
	$.each( config_data, function( key, val ){				
		if(typeof val === 'object'){
			$.each( val, function( k, v ){
				if(key == "pools"){
					//console.log(v["url"]);
				}
				if(key == "api")$("[name='api:"+k+"']").val(v);
			});	
		}else{
			if(val === true){
				$("[name='"+key+"']").prop("checked",true);
			}else{	
				$("[name='"+key+"']").val(val);
			}
		}
	});
	
	$("#proxy-form-settings :input").on("change",function(){ $('#submit').show() });
	
	$('#submit').on("click", function(){
		app.dialog.preloader('Sending datas...');
		var formData = app.form.convertToData("#proxy-form-settings");
		$.each( formData, function(key, val ){
			if(Array.isArray(val)){ // for f7 checkbox
				if(val.length > 0) val = true; else val = false;
			}
			if(key.indexOf(':') >= 0){
				config_data[key.split(":")[0] ][key.split(":")[1]] = val;
			}else{
				config_data[key] = val;
			}
		});

		app.request.post('php/get_json.php', {cc:"put_data",  mode:'setting', proxy: proxy_id, proxy_config_data:config_data}, function (data) {
			app.dialog.close();
			app.notification.create({text: 'Settings saved successfully'}).open();
			$('#submit').hide();
		},"json");
		
	});
})

//-- History Page Init
$$(document).on('page:init', '.page[data-name="history"]', function (e) {
	$$('.title_proxy').html("Proxy <b>" + config_data.proxy_infos[proxy_id].label +"</b>" );
		app.request.post('php/get_json.php', {cc:"get_history", proxy:proxy_id}, function (data) {		
			var history_html = "";
			if(data == "false"){
				history_html = "<td colspan=4>No auto pool change history!</td>";
			}else{
				var tothashes = 0; var tottime = 0; var totshares = 0;
				$.each( data, function(i, item ){
					var item_hashes = item.hashes;
					if(item_hashes < 0)item_hashes = 0;
					history_html+='<tr>'+
						'<td>'+ (item.pool != null ? item.pool.split(':')[0] : "??") +'</td>'+
						'<td>'+ new Date(item.start * 1000).getDate()+ " " +time(item.start) + '</td>'+
						'<td>'+ secondstotime(item.time_on, true) +'</td>'+
						'<td>'+ (item_hashes > 0 ? getReadableHashRateString(item_hashes) : "----") +'</td>'+
						'<td>'+ (item.shares ? item.shares : "") +'</td>'+
					  '</tr>';
					tothashes+=parseInt(item_hashes);
					tottime+=parseInt(item.time_on);					
					totshares+=parseInt(item.shares);					
				});
				history_html+="<tr style='color:rgba(255,255,255,.54)'><td colspan=2>Totals:" + data.length + "</td><td>"+secondstotime(tottime, true)+"</td><td>"+getReadableHashRateString(tothashes)+"</td>";
				history_html+="<td>"+totshares+"</td></tr>";
			}
			$$("#pool_history").html(history_html); 
		},"json");	
});

//-- functions
function delete_file(name, file, proxy_id){
	app.dialog.confirm('Delete ' + name +' datas?', 'Delete', function () {		
		app.request.post('php/get_json.php', {cc:"delete_file", file:file, proxy:proxy_id}, function (data) {
			app.notification.create({text: 'File deleted successfully'}).open();
			mainView.router.refreshPage();
		},"json");
	});	
}

function net_fail(){
	app.dialog.preloader('Network Error ...');
	  setTimeout(function () {
		app.dialog.close();
	  }, 3000);
}

function get_job(){
	app.request.post('php/get_json.php', {cc:"get_job", proxy:proxy_id}, function (data) {		
		if(!data) return false;
		var pool_elapse = proxy_data.uptime;
		var pool_hashes = proxy_data.results.hashes_total;
		var pool_shares = proxy_data.results.accepted;
		if(data.pool_time) pool_elapse = Math.floor(Date.now() / 1000)-parseInt(data.pool_time); 
		if(data.pool_hashes) pool_hashes =  pool_hashes-parseInt(data.pool_hashes);
		if(data.pool_shares) pool_shares =  pool_shares-parseInt(data.pool_shares);
		var pool_mode = "None";
		$("#pool_timeon").html(secondstotime(pool_elapse, true));
		$("#pool_shares").html(pool_shares);
		$("input[name=loop_time]").val(data.loop_time);		
		
		if(data.pools && data.pools.length > 0){
			var pool_perc = data.pools[0].percent;
			if(pool_perc) pool_mode = "%";
			$("#pool_remain").html( secondstotime( (1440/100) * pool_perc * 60 - pool_elapse, true) );
			$.each(data.pools, function( i, item ){
				$("input[name='"+item.url+"']").val( item.percent );	
			})
		}		
		
		if(pool_hashes < 0) pool_hashes = "----"; else pool_hashes = getReadableHashRateString(pool_hashes);	
	    $("#pool_hashes").html(pool_hashes);
		if(parseInt(data.loop_time) > 0){
			pool_mode = "Time";
			var remaining = parseInt(data.loop_time)*3600 - pool_elapse;
			$("#pool_remain").html( secondstotime( (remaining > 0 ? remaining : "0"), true ) );
		}
		$("#pool_mode").html(pool_mode);
	},"json");
}

function workers_list(){
	app.request.post('php/get_json.php', {cc:"proxy_data", endpoint: 'workers', proxy: proxy_id}, function (data) {	
		
		if(!data || data.error){
			net_fail();
			return false;
		}
		data.workers.sort( JSONSortOrder(data_session.workers_set.sort_id, data_session.workers_set.sort_order) );
		var hash_list="";
		$.each( data.hashrate.total, function( i, item ){
			if(i<5)hash_list+="<td>"+getReadableHashRateString(item*1000)+"/s</td>";
		});
		var connected = 0;
		for(var i = 0; i < data.workers.length; ++i){
			if(data.workers[i][2] == 1)
				connected++;
		}
		$$('.title_proxy').html("Proxy <b>" + config_data.proxy_infos[proxy_id].label +"</b> - Workers: " + connected + " / " + data.workers.length );
		$$('#worker_list').html("");
		var tot_hashes = 0;
		$.each( data.workers, function( i, item ){
			$$('#worker_list').append('<li '+(item[2] == 0 ? "style='background-color:#686868'" :"")+'>'+
			  '<div class="item-content">'+
				'<div class="item-inner">'+
				  '<div class="item-title-row" style="font-size:14px">'+
					'<div class="item-title">' + item[0].substr(0,8) +( item[0].length > 8 ? ".."+item[0].substr(-4) :"") + '</div>'+
					'<div class="item-after">('+item[2]+') '+item[1]+'</div>'+
				  '</div>'+
				  '<div class="item-subtitle" style="font-size:11px;color: rgba(255,255,255,.54)">'+
					$.timeago(new Date(item[7]).toISOString())+ 
					' - '+getReadableHashRateString(item[6])+' ('+item[3]+')'+' ('+item[4]+')'+' ('+item[5]+')'+
				  '</div>'+
						'<div class="item-row" style="font-size:11px;font-weight:bold">'+
						  '<div class="item-cell">1m</div>'+
						  '<div class="item-cell">10m</div>'+
						  '<div class="item-cell">1h</div>'+
						  '<div class="item-cell">12h</div>'+
						  '<div class="item-cell">24h</div>'+
						'</div>'+
						'<div class="item-row" style="font-size:11px;color: rgba(255,255,255,.54)">'+
						  '<div class="item-cell" style="align-self:auto">'+getReadableHashRateString(item[8]*1000)+"/s"+'</div>'+
						  '<div class="item-cell" style="align-self:auto">'+getReadableHashRateString(item[9]*1000)+"/s"+'</div>'+
						  '<div class="item-cell" style="align-self:auto">'+getReadableHashRateString(item[10]*1000)+"/s"+'</div>'+
						  '<div class="item-cell" style="align-self:auto">'+getReadableHashRateString(item[11]*1000)+"/s"+'</div>'+
						  '<div class="item-cell" style="align-self:auto">'+getReadableHashRateString(item[12]*1000)+"/s"+'<div><span id="'+item[0].replace(".","_")+'" class="inlinesparkline"></span></div></div>'+
						'</div>'+
				'</div>'+
			  '</div>'+
			'</li>'
			);
			tot_hashes+=item[6];
		});
		hash_list+="<td>"+getReadableHashRateString(tot_hashes)+"/s</td>";
		$$('#w_hashrates').html(hash_list);		
		
		$.each( data.workers, function( i, item ){
			var result = $.grep(data.workers_stats, function(e){ return e.id === item[0]  });
			if(result.length)$('#'+item[0].replace(".","_") ).text(result[0].datas);
		});
		
		$('.inlinesparkline').sparkline(
			'html',
			{
				type: 'line',
				width: '90%',
				height: '40',
				lineColor: '#1F77B4',
				fillColor: '#1E4A69',
				spotColor: null,
				minSpotColor: null,
				maxSpotColor: null,
				highlightLineColor: '#1E4A69',
				spotRadius: 3,
				drawNormalOnTop: false,
				chartRangeMin: 0,
				tooltipFormat: '<b>{{y}}</b>, {{offset:names}}'
			}
		);
		
	},"json");
}

function graph(){
	app.request.post('php/get_json.php', {cc:"read_db", proxy:proxy_id, days:days}, 
		function (data) {
			var X = []; var Y = [];
			for (var reading = 0; reading < data.length-2; reading++) {
				X.push(data[reading].date);
				Y.push( data[reading].value/1000 );
			}			
			var trace1 = {
			  x: X,
			  y: Y,
			  fill: 'tozeroy',
			  type: 'scatter'
			};
			var data = [trace1];
	
			var layout = {
				paper_bgcolor: "#1E1E1E",
				plot_bgcolor: "#1E1E1E",
				margin: {
					l:40,
					r:20,
					t:10,
					b:30
				},
				autosize: true,
				height: "260",
				showlegend: false,
				  xaxis: {
					autorange: true,
					showgrid: false,
					zeroline: false,
					showline: false,
					autotick: true,
					ticks: '',
					showticklabels: true
				  },
				  yaxis: {
					autorange: true,
					showgrid: true,
					zeroline: true,
					showline: true,
					autotick: true,
					ticks: '',
					tickformat: ".2f",
					showticklabels: true
				  }
			};
			Plotly.newPlot('proxy_hashrate', data, layout, {displaylogo: false, displayModeBar: false});
		},"json");
}

function get_data(){
	app.request.post('php/get_json.php', {cc:"proxy_data",  endpoint: 'summary', proxy: proxy_id}, function (data) {
		if(!data || data.error ){
			net_fail();
			return false;
		}
		proxy_data = data; // set global proxy_data 
		if(data.config_data) config_data = data.config_data; // set global config_data
		var proxy_list = "";
		$.each(data.config_data.proxy_infos, function( i, item ){
			proxy_list+='<option value="'+i+'" ' + (i == proxy_id ? "selected" : "") + '>'+item.label+'</option>';
		});
		$$("#act_pool").html( config_data.pools[0].url );
		$$('#change_proxy').html(proxy_list);
		$$("#bar_infos").html( " - " + getReadableHashRateString( (data.results.hashes_total / data.uptime))+"/s Wrk. "+data.miners.now );
		$$("#worker_id").html( data.worker_id );
		$$("#uptime").html( secondstotime(data.uptime) );
		$$("#workers").html( "Now: <b>"+data.miners.now+"</b> - Max: <b>"+data.miners.max+"</b>");
		$$("#tothash").html(getReadableHashRateString(data.results.hashes_total));
		$$("#avghash").html(getReadableHashRateString( (data.results.hashes_total / data.uptime))+"/s");
		$$("#accepted").html(data.results.accepted);
		$$("#invalid").html(data.results.invalid);
		$$("#rejected").html(data.results.rejected);
		$$("#expired").html(data.results.expired);
		$$("#avgT").html(data.results.avg_time+" ms");
		$$("#latency").html(data.results.latency);			
		$$("#donated").html(data.donated);			
		$$("#donatelevel").html(data.donate_level);					
		$$("#up_tot").html(data.upstreams.total);			
		$$("#up_active").html(data.upstreams.active);			
		$$("#up_error").html(data.upstreams.error);			
		$$("#up_ratio").html(data.upstreams.ratio);			
		$$("#up_sleep").html(data.upstreams.sleep);			
		var best_list="";
		var bl = data.results.best;
		$.each( bl, function( i, item ){
			best_list+='<tr><td class="label-cell">'+(i+1)+'</td><td class="numeric-cell">'+parseInt(item)+'</td></tr>';
		});		
		var hash_list="";
		$.each( data.hashrate.total, function( i, item ){
			if(i<5)hash_list+="<td>"+getReadableHashRateString(item*1000)+"/s</td>";
		});			
		setTimeout(function(){
			$$("#ten_best").html(best_list);
			$$('#hashrate').html(hash_list);
		},500);		
	},"json");
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function time(s) {
	var tzoffset = new Date(s * 1e3).getTimezoneOffset()*60;
    return new Date((s-tzoffset) * 1e3).toISOString().slice(-13, -5);
}

function secondstotime(secs , mode)
{
	var seconds = parseInt(secs, 10);
	var days = Math.floor(seconds / (3600*24));
	seconds  -= days*3600*24;
	var hrs   = Math.floor(seconds / 3600);
	seconds  -= hrs*3600;
	var mnts = Math.floor(seconds / 60);
	seconds  -= mnts*60;
	if(mode)
		return (days >=1 ? days : "") + ( new Date(secs*1000)).toUTCString().match(/(\d\d:\d\d:\d\d)/)[0];
	else
		return days+" days, "+hrs+" Hrs, "+mnts+" Minutes, "+seconds+" Seconds";
}


function getReadableHashRateString(hashrate) {
	hashrates = hashrate || 0;
	var i = 0;
	var byteUnits = [' H', ' Kh', ' Mh', ' Gh', ' Th', ' Ph' ];
	while(hashrates >=1000) {
		hashrates = hashrates / 1000;
		i++;
	}
	return parseFloat(hashrates).toFixed(2) + byteUnits[i];
}

function JSONSortOrder(prop, order){
   return function(a,b){
      if( a[prop] > b[prop]){
          return (order == "asc" ? 1 : -1);
      }else if( a[prop] < b[prop] ){
          return (order == "asc" ? -1 : 1)
      }
      return 0;
   }
}

function StatsUpdate(){
	var stats_update = $$(".upd_sign");
	if(!stats_update) return true;
	$$(stats_update).css({ "transition":"opacity 100ms ease-out","opacity":"1" });
	setTimeout(function(){
	$$(stats_update).css({"transition":"opacity 4000ms linear","opacity":"0"});
	}, 500);	
}
