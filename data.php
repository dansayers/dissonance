<?php

require('functions.php');

$rootFreq = 440;
$dropoff = 0.8;
$dronePartials = 6;
$symmetric = false;

if (isset($_GET['np']))
  $dronePartials = 1*$_GET['np'];
if (isset($_GET['root']))
  $rootFreq = 1*$_GET['root'];
if (isset($_GET['dropoff']))
  $dropoff = 1*$_GET['dropoff'];
$symmetric = (isset($_GET['sym']) && $_GET['sym']=='true');

$root = new Note($rootFreq, $dronePartials, $dropoff);

$sound = new Sound();
$sound->addNote($root, 1);

if (isset($_GET['notes'])) {
  foreach ($_GET['notes'] as $noteSemis) {
    $noteFreq = $rootFreq * pow(2.0, $noteSemis/1200.0);
    $extraNote = new Note($noteFreq, $dronePartials, $dropoff);
    $sound->addNote($extraNote, 1);
  }
}

$partialList = '';
foreach($sound->COMPONENT as $obj)
  $partialList .= $obj->FREQUENCY.','.$obj->AMPLITUDE.',';
$partialList = substr($partialList, 0, -1);

$note = new Note(1, $dronePartials, $dropoff);

$compareList = '';
foreach($note->COMPONENT as $obj)
  $compareList .= $obj->FREQUENCY.','.$obj->AMPLITUDE.',';
$compareList = substr($compareList, 0, -1);

$minrange = $rootFreq;
$maxrange = 2*$rootFreq;

$cmd = "./dissonance/dissonance -compare $compareList -partials $partialList -minrange $minrange -maxrange $maxrange";
//die($cmd);
exec($cmd, $json);
//die_r($json);
$data = json_decode($json[0], 1);
echo json_encode($data);
//die_r($data);

