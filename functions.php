<?php

$lasttime = microtime(1);
profileTime('start');
//define('PROFILE', 1);

function die_r($obj) {
  echo '<plaintext>';
  print_r($obj);
  exit();
}

function profileTime($msg) {
  global $lasttime;
  if (!defined('PROFILE')) return;
  $now = microtime(1);
  echo number_format(($now - $lasttime)*1000, 4).": ".$msg."<br />";
  $lasttime = $now;
}

class SinComponent {
  public $FREQUENCY;
  public $AMPLITUDE;
  
  public function __construct($freq, $amp) {
    $this->FREQUENCY = $freq;
    $this->AMPLITUDE = $amp;
  }
  
  public function roughness(SinComponent $that) {
    $A_min = min($this->AMPLITUDE, $that->AMPLITUDE);
    $A_max = max($this->AMPLITUDE, $that->AMPLITUDE);
//    $A_min = exp($A_min);
//    $A_max = exp($A_max);
    $F_min = min($this->FREQUENCY, $that->FREQUENCY);
    $F_max = max($this->FREQUENCY, $that->FREQUENCY);
    
    $X = $A_min * $A_max;
    
    $Y = 2 * $A_min / ($A_min + $A_max);
    
    $b1 = 3.5;
    $b2 = 5.75;
    $s1 = 0.0207;
    $s2 = 18.96;
    $s  = 0.24 / ($s1 * $F_min + $s2);
    
    $Z = exp(-$b1 * $s * ($F_max - $F_min)) - exp(-$b2 * $s * ($F_max - $F_min));
    
    $R = pow($X, 0.1) * 0.5 * pow($Y, 3.11) * $Z;
    
    return $R;
  }
}

class Note {
  public $COMPONENT;
  public $PARTIALS;
  public $DROPOFF;
  public $FUNDAMENTAL;
  
  public function __construct($fundamental, $partials = 6, $dropoff = 0.8) {
    $this->FUNDAMENTAL = $fundamental;
    $this->PARTIALS = $partials;
    $this->COMPONENT =  array();
    $this->DROPOFF = $dropoff;
    $this->calculateComponents();
  }
  
  public function calculateComponents() {
    global $symmetric;
    for ($i = 0; $i < $this->PARTIALS; $i++) {
      if ($symmetric)
        $this->COMPONENT[$i] = new SinComponent(($i*2+1)*$this->FUNDAMENTAL, pow($this->DROPOFF, $i));
      else
        $this->COMPONENT[$i] = new SinComponent(($i+1)*$this->FUNDAMENTAL, pow($this->DROPOFF, $i));
    }
  }
  
  public function roughness(Note $that) {
    $R = 0;
    foreach ($this->COMPONENT as $thisComponent) {
      foreach ($that->COMPONENT as $thatComponent) {
        $R += $thisComponent->roughness($thatComponent);
      }
    }
    return $R;
  }
}

class Sound {
  public $COMPONENT;
  private $FREQ_AMPS;
  
  public function __construct() {
    $this->FREQ_AMPS = array();
    $this->COMPONENT = array();
  }
  
  public function addNote(Note $note, $scale = 1) {
    foreach ($note->COMPONENT as $thisComponent) {
      if (isset($this->FREQ_AMPS[''.$thisComponent->FREQUENCY]))
        $this->FREQ_AMPS[''.$thisComponent->FREQUENCY] += $thisComponent->AMPLITUDE*$scale;
      else
        $this->FREQ_AMPS[''.$thisComponent->FREQUENCY] = $thisComponent->AMPLITUDE*$scale;
    }
    $this->COMPONENT = array();
    ksort($this->FREQ_AMPS);
    foreach ($this->FREQ_AMPS as $freq => $amp) {
      $this->COMPONENT[] = new SinComponent($freq, $amp);
    }
  }
  
  public function roughness() {
    $R = 0;
    $temp = $this->COMPONENT;
    foreach ($this->COMPONENT as $thisComponent) {
      foreach ($temp as $thatComponent) {
        $R += $thisComponent->roughness($thatComponent);
      }
    }
    return $R;
  }
}
