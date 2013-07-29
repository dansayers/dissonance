google.load("visualization", "1", {packages:["corechart"]});
$(function() {
  var baseFreq = 440;
  var dropoff = 0.8;
  var numPartials = 6;
  var notes = [];
  var all_components = [];
  var all_oscillators = [];
  var dataTable;
  var symmetric = false;
  var ctx = null;
  var usingWebAudio = true;
  var chart = new google.visualization.LineChart($('#chart_div')[0]);
  
  google.visualization.events.addListener(chart, 'select', chartSelectHandler);
  
  if (typeof AudioContext !== 'undefined') {
    ctx = new AudioContext();
  } else if (typeof webkitAudioContext !== 'undefined') {
    ctx = new webkitAudioContext();
  } else {
    usingWebAudio = false;
    $('.audio-control').hide();
  }
  
  drawChart();
  $(window).resize(drawChart);
  
  $('#active-checkbox').change(function() {
    if ($(this).is(':checked'))
      play();
    else
      stop();
  });
  
  $('#symmetric-checkbox').change(function() {
    symmetric = $(this).is(':checked');
    drawChart();
  });
  
  $('.num-partials li a').click(function(e) {
    e.preventDefault();
    numPartials = parseInt($(this).text());
    $('.num-partials-info').html($(this).text()+' <span class="caret"></span>');
    drawChart();
  });
  
  $('#tone-toggle').click(function() {
    var $tc = $('#tone-controls');
    if ($tc.is(':visible')) {
      $tc.fadeOut(400);
      $('#tone-toggle').removeClass('btn-primary');
    } else {
      $tc.fadeIn(400);
      $('#tone-toggle').addClass('btn-primary');
    }
  });
  
  var rootChangeTimer = null;
  var $rootControl = $('#root-control');
  $rootControl.bind('change keyup', function() {
    if (rootChangeTimer != null)
      clearTimeout(rootChangeTimer);
    rootChangeTimer = setTimeout(function() {
      baseFreq = 1*$rootControl.val();
      if (baseFreq < 20) baseFreq = 20;
      if (baseFreq > 20000) baseFreq = 20000;
      $rootControl.val(baseFreq);
      drawChart();
    }, 400);
  });
  
  var dropoffChangeTimer = null;
  var $dropoffControl = $('#dropoff-control');
  $dropoffControl.bind('change keyup', function() {
    if (dropoffChangeTimer != null)
      clearTimeout(dropoffChangeTimer);
    dropoffChangeTimer = setTimeout(function() {
      dropoff = 1*$dropoffControl.val();
      if (dropoff > 1) dropoff = 1;
      if (dropoff < 0) dropoff = 0;
      $dropoffControl.val(dropoff);
      drawChart();
    }, 400);
  });
  
  function stop() {
    if (!usingWebAudio) return;
    $.each(all_oscillators, function(i, o) {
      o.noteOff(0);
      // should also destroy them?
    });
    all_oscillators = [];
  }
  
  function play() {
    if (!usingWebAudio) return;
    stop();
    components = allComponents();
    $.each(components, function(i, component) {
      var o = ctx.createOscillator();
      var g = ctx.createGainNode();
      o.frequency.value = component.frequency;
      o.connect(g);
      g.gain.value = component.amplitude;
      g.connect(ctx.destination);
      o.noteOn(0);
      all_oscillators.push(o);
    });
  }
  
  function allComponents() {
    var components = noteSynth(baseFreq);
    $.each(notes, function(i, obj) {
      var noteFreq = baseFreq * Math.pow(2.0, obj / 1200.0);
      noteComps = noteSynth(noteFreq);
      $.each(noteComps, function(j, scNew) {
        var found = false;
        $.each(components, function(k, scOld) {
          if (scOld.frequency != scNew.frequency) return;
          components[k] = sinComponent(scOld.frequency, scOld.amplitude+scNew.amplitude);
          found = true;
        });
        if (!found)
          components.push(scNew);
      });
    });
    return components;
  }
  
  function sinComponent(freq, amp) {
    return {
      frequency: freq,
      amplitude: amp
    };
  }
  function noteSynth(baseFreq) {
    var freq = baseFreq,
      amp = 0.05,
      components = [];
    for (i=0; i<numPartials; i++) {
      var component = sinComponent(freq, amp);
      components.push(component);
      amp *= dropoff;
      if (symmetric)
        freq = baseFreq * (i * 2 + 3);
      else
        freq += baseFreq;
    }
    return components;
  }
  
  function drawChart() {
    $('#chart_div').height(Math.min(350, $('#chart_div').width() * 0.5));
    var url = "data.php?"+$.param({
      np: numPartials,
      notes: notes,
      sym: symmetric,
      root: baseFreq,
      dropoff: dropoff
    });
    console.log(url);
    if ($('#active-checkbox').is(':checked'))
      play();
    $.ajax({
      url: url,
      dataType:"json",
      async: true,
      success: function(jsonData) {
        if (jsonData.error) {
          console.log(jsonData.error);
          return;
        }
        dataTable = new google.visualization.arrayToDataTable(jsonData.data);
        var options = {
          title: '',
          hAxis: {gridlines: {count: 12}, label: 'Cents'},
          vAxis: {gridlines: {count: 0}},
          legend: 'none',
          chartArea: {'width': '95%', 'height': '80%'},
          pointSize: 0,
          lineWidth: 3,
          animation:{
            duration: 400,
            easing: 'inAndOut'
          },
          curveType: 'function',
          series: [{
              color: '#004ccc',
              pointSize: 0,
              lineWidth: 3
            }, {
              color: '#004ccc',
              pointSize: 6,
              lineWidth: 0
            }, {
              color: '#ffffff',
              pointSize: 3,
              lineWidth: 0
            }]
        };
        dataTable.addColumn('number', 'Dissonance');
        dataTable.setCell(0, 3, dataTable.getValue(0, 1));
        $.each(notes, function(i, note) {
          dataTable.setCell(note, 3, dataTable.getValue(note, 1));
        });
        
        chart.draw(dataTable, options);

        var listitems = $('.note-row:not(#note-template)').get();
        listitems.sort(function(a, b) {
          var av = parseInt($(a).find('.cents-display').text());
          var bv = parseInt($(b).find('.cents-display').text());
          if (av > bv) return 1;
          if (av < bv) return -1;
          return 0;
        });

        $.each(listitems, function(index, item) {
          $('#note-template').before(item); 
        });
      }
    });
  }
  
  function centsSlider($slider, value) {
    var $centsDisplay = $slider.parent().find('.cents-display');
    $slider.slider({
      min: 0,
      max: 1200,
      step: 1,
      value: value,
      slide: function(event, ui) {
        $centsDisplay.text(ui.value);
      },
      stop: function(event, ui) {
        var index = notes.indexOf(value);
        if (index !== -1) {
            notes[index] = ui.value;
            drawChart();
            centsSlider($slider, ui.value);
        }
      }
    });
  }
  
  function addNote(value) {
    var $noteRow = $('#note-template').clone();
    $noteRow.attr({id: ''});
    $noteRow.find('.cents-display').text(value);
    $('#note-template').before($noteRow);
    $noteRow.find('.cents-slider').each(function() {centsSlider($(this), value);});

    $noteRow.show();
    $noteRow.find('.close').click(function() {
      var $noteRow = $(this).parents('.note-row');
      var value = parseInt($noteRow.find('.cents-display').text());
      var position = $.inArray(value, notes);
      if (~position) {
        notes.splice(position, 1);
        removeNote(value);
        drawChart();
      }
    });
  }
  
  function removeNote(value) {
    $('.note-row').each(function() {
      if ($(this).find('.cents-display').text() != value)
        return;
      $(this).remove();
    });
  }
  
  function chartSelectHandler() {
    var selection = chart.getSelection()[0];
    if (typeof(selection) == 'undefined') return;
    var value = dataTable.getValue(selection.row, 0);
    var position = $.inArray(value, notes);
    if (~position) {
      notes.splice(position, 1);
      removeNote(value);
    } else {
      notes.push(value);
      addNote(value);
    }
    drawChart();
  }
});
