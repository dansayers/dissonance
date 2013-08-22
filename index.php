<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<!--    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0" />-->
    <title>Dissonance</title>
    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
    <script src="//netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/js/bootstrap.min.js"></script>
    <script src="js/jquery-ui-1.10.3.custom.min.js"></script>
    <script src="js/jquery.ui.touch-punch.min.js"></script>
    <script src="https://www.google.com/jsapi"></script>
    <script src="js/bootstrap-switch.js"></script>
    <script src="js/dissonance.js"></script>
    <script>var skipLinkProcessing = 1;</script>
    <script src="/js/ga.js"></script>
    <link href="//netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/css/bootstrap-combined.min.css" rel="stylesheet" />
    <link href="css/bootstrap-switch.css" rel="stylesheet" />
    <link href="css/ui-lightness/jquery-ui-1.10.3.custom.css" rel="stylesheet" />
    <link href="css/dissonance.css" rel="stylesheet" />
  </head>
  <body>
    <div class="header"><a href="/"><img class="iotic-logo" src="img/iotic-logo.png" /></a></div>
    <div class="container">
      <div class="row-fluid">
        <div class="span12">
          <h1 id="page-title">Dissonance</h1>
        </div>
      </div>
      <div class="row-fluid">
        <div id="chart_div" class="span12"></div>
      </div>
      <div class="row-fluid">
        <ul class="nav nav-tabs" data-tabs="tabs">
          <li class="active"><a href="#sound-settings" data-toggle="tab">Sound</a></li>
          <li><a href="#notes-list" data-toggle="tab">Notes</a></li>
          <li><a href="#range" data-toggle="tab">Range</a></li>
          <li><a href="#about" data-toggle="tab">About</a></li>
        </ul>
      </div>
      <div id="my-tab-content" class="tab-content">
        <div id="sound-settings" class="tab-pane active">
          <div class="row-fluid row-item audio-control">
            <div class="span2">
              <label class="control-label">Sound</label>
            </div>
            <div class="span8">
              <div class="switch audio-control pull-left">
                <input type="checkbox" id="active-checkbox" />
              </div>
              <button type="button" id="reset-button" class="btn btn-primary">Reset</button>
            </div>
          </div>
          <div class="row-fluid row-item">
            <div class="span2">
              <label class="control-label">Volume (<span contenteditable class="number-input" id="volume-num">80</span>dB)</label>
            </div>
            <div class="span10">
              <div id="volume-slider"></div>
            </div>
          </div>
          <div class="row-fluid row-item">
            <div class="span2">
              <label class="control-label">Partials (<span contenteditable class="number-input" id="partials-num">6</span>)</label>
            </div>
            <div class="span10">
              <div id="partials-slider"></div>
            </div>
          </div>
          <div class="row-fluid row-item">
            <div class="span2">
              <label class="control-label">Tone (<span contenteditable class="number-input" id="dropoff-num">0.20</span>)</label>
            </div>
            <div class="span10">
              <div id="dropoff-slider"></div>
            </div>
          </div>
          <div class="row-fluid row-item">
            <div class="span2">
              <label class="control-label">Only odd</label>
            </div>
            <div class="span10">
              <div class="switch">
                <input type="checkbox" id="symmetric-checkbox" />
              </div>
            </div>
          </div>
          <div class="row-fluid row-item">
            <div class="span2">
                <label class="control-label">Root octave (<span contenteditable class="number-input" id="root-octave-num">4</span>)</label>
            </div>
            <div class="span10">
                <div id="root-octave-slider"></div>
            </div>
          </div>
          <div class="row-fluid row-item">
            <div class="span2">
                <label class="control-label">Root note (<span contenteditable class="note-input" id="root-note-name">A</span>)</label>
            </div>
            <div class="span10">
                <div id="root-note-slider"></div>
            </div>
          </div>
          <div class="row-fluid row-item">
            <div class="span2">
                <label class="control-label">Root cents (<span contenteditable class="number-input" id="root-cents-num">0</span>)</label>
            </div>
            <div class="span10">
                <div id="root-cents-slider"></div>
            </div>
          </div>
        </div>
        <div id="notes-list" class="tab-pane">
          <div class="row-fluid row-item note-row" id="root-row">
            <div class="span2">
              <label class="control-label">Root - 0 cents</label>
            </div>
            <div class="span10">
              <button type="button" id="clear-button" class="btn btn-primary">Clear</button>
            </div>
          </div>
          <div id="add-note" class="row-fluid row-item note-row">
            <div class="span2">
              <label class="control-label"><span contenteditable id="add-num" class="number-input cents-display note-cents">0</span> cents</label>
            </div>
            <div class="span10 note-controls">
              <div id="add-slider" class="cents-slider"></div>
            </div>
            <button type="button" id="add-button" class="close pull-right">+</button>
          </div>
          <div id="note-template" class="row-fluid row-item note-row">
            <div class="span2">
              <label class="control-label"><span contenteditable class="number-input cents-display"></span> cents</label>
            </div>
            <div class="span10 note-controls">
              <div class="cents-slider"></div>
            </div>
            <button type="button" class="close pull-right">×</button>
          </div>
        </div>
        <div id="range" class="tab-pane">
          <div class="row-fluid row-item">
            <div class="span2">
              <label class="control-label">Two octaves</label>
            </div>
            <div class="span10">
              <div class="switch">
                <input type="checkbox" id="two-oct-checkbox" />
              </div>
            </div>
          </div>
          <div class="row-fluid row-item">
            <div class="span2">
              <label class="control-label">Lower octave</label>
            </div>
            <div class="span10">
              <div class="switch">
                <input type="checkbox" id="low-oct-checkbox" />
              </div>
            </div>
          </div>
        </div>
        <div id="about" class="tab-pane">
          <div class="row-fluid row-item">
            <div class="span12">
              <h2>What is this?</h2>
              <blockquote>
                <p>Agreeable consonances are pairs of tones which strike the ear with a certain regularity; this regularity consists in the fact that the pulses delivered by the two tones, in the same interval of time, shall be commensurable in number, so as not to keep the ear drum in perpetual torment, bending in two different directions in order to yield to the ever-discordant impulses.</p>
                <small>Galileo Galilei, 1638</small>
              </blockquote>
              <p>This page is an interactive demonstration of the human physiological perception of musical dissonance - according to recent thinking. If you have a browser that supports it (Chrome, Safari), you should be able to hear sounds while you play with the settings, by turning on the Sound switch under the "Sound" tab, above. You can then get started by clicking on points of the curve above, to add notes.</p>
              <p>To start, there is a single note set to 440Hz - at the 'zero' position of the graph above. The graph shows an approximate scale of human-perceived dissonance when adding similar but differently pitched notes. The x-axis measures pitch in cents - hundredths of a semitone - and the vertical grey lines mark off semitones. The dips (local minima) of the graph are indicated by dots. Clicking on these will add notes that should sound consonant, or at least "minimally dissonant" compared to nearby pitches. The curve will update to reflect the new, combined sound. You can also click on the curve at any other point (e.g. dissonance maxima) to see what other tunings and collections of notes sound like. You can add, delete or edit notes using the notes tab. Slider values can by fine-tuned by clicking in the track to the left and right of the slider 'handle'.</p>
              <p>There are more options for the basic note sound, under "Sound". Here you can change the pitch of the root note, the number of harmonic partials in each note, the dropoff (how quickly the partials of a note get quieter as they get higher), and also there is an option to use only odd partials - as in the sound of a square or triangular wave.</p>
              <p>This app was built with the intention of exploring theories of dissonance perception advanced by <a href="http://archive.org/details/onsensationston00elligoog">Helmholtz (1895)</a>, <a href="http://pubman.mpdl.mpg.de/pubman/item/escidoc:66382:5/component/escidoc:468040/Plomp_Levelt_Tonal_1965.pdf">Plomp & Levelt (1965)</a>, <a href="http://sethares.engr.wisc.edu/consemi.html">Sethares (1993)</a>, <a href="http://www.acousticslab.org/papers/Vassilakis2005SRE.pdf">Vassilakis (2005)</a> and others. The roughness calculation used here is that of <a href="http://www.acousticslab.org/learnmoresra/moremodel.html">Vassilakis</a>. The app was inspired by a question on the <a href="https://www.facebook.com/groups/239947772713025/">Microtonal Music and Theory Facebook group</a> and <a href="http://music.stackexchange.com/questions/4439/is-there-a-way-to-measure-the-consonance-or-dissonance-of-a-chord">this Stack Exchange question and accepted answer</a>. If you have any questions or comments please <a href="mailto:i[at]iotic[dot]com">contact me</a>.</p>
            </div>
          </div>
        </div>
      </div>
      <div class="bottom-pad"></div>
      <div class="row-fluid footer">
        <div class="row-fluid">
          <div class="span12 footer-content">
            © D Sayers 2013
          </div>
        </div>
      </div>
    </div>
  </body>
</html>