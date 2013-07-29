<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dissonance</title>
    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
    <script src="//netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/js/bootstrap.min.js"></script>
    <script src="js/jquery-ui-1.10.3.custom.min.js"></script>
    <script src="js/jquery.ui.touch-punch.min.js"></script>
    <script src="https://www.google.com/jsapi"></script>
    <script src="js/bootstrap-switch.js"></script>
    <script src="js/dissonance.js"></script>
    <link href="//netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/css/bootstrap-combined.min.css" rel="stylesheet" />
    <link href="css/bootstrap-switch.css" rel="stylesheet" />
    <link href="css/ui-lightness/jquery-ui-1.10.3.custom.css" rel="stylesheet" />
    <link href="css/dissonance.css" rel="stylesheet" />
  </head>
  <body>
    <div class="container">
    <form class="form-horizontal">
    <div class="row control-group">
        <div id="chart_div" class="span12"></div>
    </div>
    <div class="row">
      <div class="span12">
      </div>
    </div>
    <div class="row control-group">
      <table id="header-controls" class="table table-striped span12">
        <tr></tr>
        <tr>
          <td class="span2">
            <label class="control-label audio-control">Sound</label>
          </td>
          <td class="span2">
            <div class="switch pull-left audio-control">
              <input type="checkbox" id="active-checkbox" />
            </div>
          </td>
          <td>
            <button class="btn" id="tone-toggle" type="button">♩</button>
          </td>
        </tr>
      </table>
        <table id="tone-controls" class="table table-striped span12">
          <tr>
            <td class="span2">
              <label class="control-label">Partials</label>
            </td>
            <td class="span2">
              <div class="btn-group">
                <a class="num-partials-info btn dropdown-toggle" data-toggle="dropdown" href="#">
                  6
                  <span class="caret"></span>
                </a>
                <ul class="num-partials dropdown-menu">
                  <li><a href="#">1</a></li>
                  <li><a href="#">2</a></li>
                  <li><a href="#">3</a></li>
                  <li><a href="#">4</a></li>
                  <li><a href="#">5</a></li>
                  <li><a href="#">6</a></li>
                  <li><a href="#">8</a></li>
                  <li><a href="#">12</a></li>
                </ul>
              </div>
            </td>
            <td></td>
          </tr>
          <tr>
            <td>
              <label class="control-label">Dropoff</label>
            </td>
            <td>
              <input type="number" min="0" max="1" step="0.05" id="dropoff-control" class="span2" value="0.8" />
            </td>
            <td>
            </td>
          </tr>
          <tr>
            <td>
              <label class="control-label">Odd only</label>
            </td>
            <td>
              <div class="switch pull-left">
                <input type="checkbox" id="symmetric-checkbox" />
              </div>
            </td>
            <td></td>
          </tr>
          <tr>
            <td>
              <label class="control-label">Root (Hz)</label>
            </td>
            <td>
              <input type="number" min="20" max="20000" step="0.5" id="root-control" class="span2" value="440" />
            </td>
            <td>
            </td>
          </tr>
        </table>
      <table id="note-table" class="table table-striped span12">
        <tr id="note-template" class="note-row">
          <td class="span2">
            <label class="control-label">Cents</label>
          </td>
          <td class="span2">
            <div class="slider-container">
              <div class="cents-slider"></div>
              <div class="cents-display"></div>
            </div>
          </td>
          <td>
            <button type="button" class="close">×</button>
          </td>
        </tr>
      </table>
    </div>
    </form>
    </div>
  </body>
</html>