<?php

/***
 * @copyright 2017 Ruben Schulz
 * @author    Ruben Schulz <info@rubenschulz.nl>
 * @package   VPS Health
 * @link      http://www.rubenschulz.nl/
 * @version   1.0
***/


/*** Init system ***/
	// Define API key
	define('API_KEY',                     'vps-health');

	// Set CORS headers
	header('Access-Control-Allow-Origin:  *');
	header('Access-Control-Allow-Methods: GET, OPTIONS');
	header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, X-API-Key');
	header('Access-Control-Max-Age:       86400');

	// Set cache headers
	header('Cache-Control:                no-store, no-cache, must-revalidate, max-age=0');
	header('Cache-Control:                post-check=0, pre-check=0');
	header('Pragma:                       no-cache');

	// Set error reporting & zlib output compression
	error_reporting(E_ALL);
	ini_set('display_errors', true);
	ini_set('zlib.output_compression', true);

	// Set default timezone
	date_default_timezone_set('Europe/Amsterdam');



/*** Functions ***/
	function getServerStatus(){
		// Get server status
		$server_status                    = array();
		$server_status['server_name']     = $_SERVER['SERVER_NAME'];
		$server_status['timestamp']       = date('c');
		$server_status['server_status']   = 'up';
		$server_status['database_status'] = getDatabaseStatus();
		$server_status['cores']           = getServerCores(); 
		$server_status['load']            = getServerLoad($server_status['cores']);
		$server_status['cpu']             = getServerCPU(); 
		$server_status['memory']          = getServerMemory(); 
		$server_status['disk']            = getServerDisk();
		$server_status['uptime']          = getServerUptime();

		// Output
		return $server_status;
	}

	function getServerCores(){
		// Get server cores
		$cores = shell_exec('cat /proc/cpuinfo | grep processor | wc -l');
		$cores = intval(trim($cores));

		// Output
		return !empty($cores) ? $cores : NULL;
	}

	function getServerLoad($cores){
		// Get server load
		$load_avg = sys_getloadavg();

		// Set cores
		$cores    = $cores ? $cores : 1;

		// Calculate load percentage
		$load                 = array();
		$load['min_1']        = $load_avg[0];
		$load['min_5']        = $load_avg[1];
		$load['min_15']       = $load_avg[2];

		$load['usage_pct_1']  = round(($load['min_1']  * 100) / $cores);
		$load['usage_pct_5']  = round(($load['min_5']  * 100) / $cores);
		$load['usage_pct_15'] = round(($load['min_15'] * 100) / $cores);

		// Output
		return $load;
	}

	function getServerCPU(){
	 	// Get server_status cpu
		$cpu_totals_1 = shell_exec('cat /proc/stat | grep "cpu "');
		$cpu_totals_1 = trim(str_replace('  ', ' ', $cpu_totals_1));
		$cpu_totals_1 = explode(' ', $cpu_totals_1);

		// Sleep 1 second
		sleep(1);

	 	// Get server_status cpu
		$cpu_totals_2 = shell_exec('cat /proc/stat | grep "cpu "');
		$cpu_totals_2 = trim(str_replace('  ', ' ', $cpu_totals_2));
		$cpu_totals_2 = explode(' ', $cpu_totals_2);

		if(!empty($cpu_totals_1[1]) && !empty($cpu_totals_2[1])){
			// Calculate cpu usage
			$cpu               = array();
			$cpu['user']       = !empty($cpu_totals_1[1])  ? $cpu_totals_2[1]  - $cpu_totals_1[1]  : NULL;
			$cpu['nice']       = !empty($cpu_totals_1[2])  ? $cpu_totals_2[2]  - $cpu_totals_1[2]  : NULL;
			$cpu['system']     = !empty($cpu_totals_1[3])  ? $cpu_totals_2[3]  - $cpu_totals_1[3]  : NULL;
			$cpu['idle']       = !empty($cpu_totals_1[4])  ? $cpu_totals_2[4]  - $cpu_totals_1[4]  : NULL;
			$cpu['iowait']     = !empty($cpu_totals_1[5])  ? $cpu_totals_2[5]  - $cpu_totals_1[5]  : NULL;
			$cpu['irq']        = !empty($cpu_totals_1[6])  ? $cpu_totals_2[6]  - $cpu_totals_1[6]  : NULL;
			$cpu['softirq']    = !empty($cpu_totals_1[7])  ? $cpu_totals_2[7]  - $cpu_totals_1[7]  : NULL;
			$cpu['steal']      = !empty($cpu_totals_1[8])  ? $cpu_totals_2[8]  - $cpu_totals_1[8]  : NULL;
			$cpu['guest']      = !empty($cpu_totals_1[9])  ? $cpu_totals_2[9]  - $cpu_totals_1[9]  : NULL;
			$cpu['guest_nice'] = !empty($cpu_totals_1[10]) ? $cpu_totals_2[10] - $cpu_totals_1[10] : NULL;

			$cpu['total']      = $cpu['user'] + $cpu['nice'] + $cpu['system'] + $cpu['idle'] + $cpu['iowait'] + $cpu['irq'] + $cpu['softirq'] + $cpu['steal'];
			$cpu['free']       = $cpu['idle'] + $cpu['iowait'];
			$cpu['used']       = $cpu['total'] - $cpu['free'];
			$cpu['usage_pct']  = round(($cpu['used'] / $cpu['total']) * 100);
		}

		// Output	 
		return !empty($cpu) ? $cpu : NULL;
	}

	function getServerMemory(){
	 	// Get server memory
		$free            = shell_exec('free');
		$free_lines      = explode("\n", $free);

		if(!empty($free_lines[1])){
			// Get totals
			$free_totals = explode(" ", $free_lines[1]);
			$free_totals = array_merge(array_filter($free_totals));

			// Calculate memory usage
			$memory              = array();
			$memory['total']     = !empty($free_totals[1]) ? $free_totals[1] * 1024 : NULL;
			$memory['used']      = !empty($free_totals[2]) ? $free_totals[2] * 1024 : NULL;
			$memory['free']      = !empty($free_totals[3]) ? $free_totals[3] * 1024 : NULL;
			$memory['shared']    = !empty($free_totals[4]) ? $free_totals[4] * 1024 : NULL;
			$memory['buffer']    = !empty($free_totals[5]) ? $free_totals[5] * 1024 : NULL;
			$memory['available'] = !empty($free_totals[6]) ? $free_totals[6] * 1024 : NULL;
			$memory['usage_pct'] = round(($memory['used'] / $memory['total']) * 100);
		}

		// Output	 
		return !empty($memory) ? $memory : NULL;
	}

	function getServerDisk(){
		// Get server disk
		$disk_total = disk_total_space('./');
		$disk_free  = disk_free_space('./');

		// Calculate memory usage
		$disk                = array();
		$disk['total']       = $disk_total;
		$disk['free']        = $disk_free;
		$disk['used']        = $disk['total'] - $disk['free'];
		$disk['usage_pct']   = round(($disk['used'] / $disk['total']) * 100);
		
		// Output
		return $disk;
	}

	function getServerUptime(){
		// Get server uptime
		$server_uptime = shell_exec('uptime');
		$server_uptime = trim(str_replace('  ', ' ', $server_uptime));
		$server_uptime = explode(' ', $server_uptime);

		// Get days and hours
		if(!empty($server_uptime[2])){
			$days = $server_uptime[2];
			$time = explode(':', $server_uptime[4]);

			// Set uptime
			$uptime            = array();
			$uptime['days']    = $days;
			$uptime['hours']   = !empty($time[1]) ? $time[0]                       : '0';
			$uptime['minutes'] = !empty($time[1]) ? str_replace(',', '', $time[1]) : $time[0];
		}

		// Output
		return !empty($uptime) ? $uptime : NULL;
	}

	function getDatabaseStatus(){
		// Get database status
		$database = shell_exec('service mysqld status');

		// Output
		return !empty($database) ? 'up' : 'down';
	}

	function formatBytes($size, $precision = 2){
		// Calculate values
		$base     = log($size, 1024);
		$suffixes = array('Bytes', 'KB', 'MB', 'GB', 'TB');   

		// Output
		return round(pow(1024, $base - floor($base)), $precision).' '.$suffixes[floor($base)];
	}



/*** Actions ***/
		// Get server status
		$output = getServerStatus();

		// Output
		echo json_encode($output, JSON_PRETTY_PRINT);	


	// Check API key
	if($_SERVER['REQUEST_METHOD'] == 'OPTIONS' || 
	   (!empty($_SERVER['HTTP_X_API_KEY']) && $_SERVER['HTTP_X_API_KEY'] == API_KEY)){
		// Set header
		header('Content-type: application/json');

		// Get server status
		$output = getServerStatus();

		// Output
		echo json_encode($output);	

	}else{
		// Invalid request
		header('HTTP/1.0 401 Unauthorized');
		header('Content-type: text/plain; charset=UTF-8');

		// Output
		echo 'Unauthorized - Public access is prohibited';

	}

?>