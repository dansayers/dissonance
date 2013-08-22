<?php

require('functions.php');

$rootFreq = 440;
$dropoff = 0.8;
$dronePartials = 6;
$symmetric = false;
$octavesRange = 1;
$showLowOctave = 1;
$mainVolume = 7.943282347;

if (isset($_GET['np']))
  $dronePartials = 1*$_GET['np'];
if (isset($_GET['root']))
  $rootFreq = 1*$_GET['root'];
if (isset($_GET['dropoff']))
  $dropoff = 1*$_GET['dropoff'];
if (isset($_GET['octs']))
  $octavesRange = 1*$_GET['octs'];
if (isset($_GET['slo']))
  $showLowOctave = 1*($_GET['slo'] == 'true');
if (isset($_GET['vol']))
  $mainVolume = 7.943282347*$_GET['vol'];
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
//$note = new Note(1, 1, $dropoff);

$compareList = '';
foreach($note->COMPONENT as $obj)
  $compareList .= $obj->FREQUENCY.','.$obj->AMPLITUDE.',';
$compareList = substr($compareList, 0, -1);

$minrange = $rootFreq / (1+$showLowOctave);
$maxrange = pow(2, $octavesRange-$showLowOctave)*$rootFreq;

$cmd = "./dissonance/dissonance -compare $compareList -partials $partialList -rootfreq $rootFreq -minrange $minrange -maxrange $maxrange";
//die($cmd);
exec($cmd, $json);
//die_r($json);
$data = json_decode($json[0], 1);
echo json_encode($data);
//die_r($data);

