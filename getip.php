<?php
$file = 'ips.json';

$ip = $_SERVER['REMOTE_ADDR'];

$ips = file_exists($file) ? json_decode(file_get_contents($file), true) : [];

if (!in_array($ip, $ips)) {
    $ips[] = $ip;
    file_put_contents($file, json_encode($ips));
}

echo json_encode([
    'ip' => $ip,
    'unique_visits' => count($ips)
]);
