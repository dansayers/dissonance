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
  var waveTable = false;
  var chartUpdateTimer = null;
  var isPhoneDevice = navigator.userAgent.match(/Android|iPhone|iPod/i);
  var sliderOptions;
  var octavesRange = 1;
  var showLowOct = false;
  var noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var rootOctave = 4;
  var rootNote = 9;
  var rootCents = 0;
  var currentOscillators = [];
  var currentGainNodes = [];
  var noteFadeTime = 40;
  var mainVolume = 0.2;
  var fadeFPS = 180;
  
  google.visualization.events.addListener(chart, 'select', chartSelectHandler);
  $('#clear-button').fadeTo(0,0);
  $('#reset-button').hide();
  
  if (typeof AudioContext !== 'undefined') {
    ctx = new AudioContext();
  } else if (typeof webkitAudioContext !== 'undefined') {
    ctx = new webkitAudioContext();
  } else {
    usingWebAudio = false;
    $('#active-checkbox').attr('disabled', 'true');
  }
  
  function handleNumberEnter(e, $element) {
    var val = 1*$element.text();
    var $slider = $element.parents('.row-item').find('.ui-slider');
    var sliderOptions = $slider.slider('option');
    if (isNaN(val))
      val = sliderOptions.value;
    val = Math.max(sliderOptions.min, Math.min(sliderOptions.max, val));
    $slider.slider('value', val);
    if ($element.is('#add-num') && val == 0 || $.inArray(val, notes) != -1)
      return;
    sliderOptions.stop.call($slider, e, {value: val});
    if ($element.is('#add-num')) {
      notes.push(val);
      addNote(val);
      $slider.slider('option', 'value', 0);
      $slider.parents('.note-row').find('.cents-display').text('0');
      drawChart();
    }
  }
  
  function handleNoteEnter(e, $element) {
    var val = $element.text();
    var noteNum = $.inArray(val, noteNames);
    var $slider = $element.parents('.row-item').find('.ui-slider');
    var sliderOptions = $slider.slider('option');
    if (noteNum == -1)
      val = sliderOptions.value;
    $slider.slider('value', noteNum);
    sliderOptions.stop.call($slider, e, {value: noteNum});
  }
  
  function selectElementContents(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  
  function numberKeyDown(e, elt) {
    if (e.keyCode > 47 && e.keyCode < 58)
      return true;
    switch (e.keyCode) {
      case 8:   // Backspace
      case 46:  // Delete
      case 37:  // Left
      case 39:  // Right
      case 190: // Decimal point
        return true;
      break
      case 13: // Enter
        $(elt).blur();
        return false;
      break;
      case 38: // Up
        var $numberInputs;
        if ($(elt).is('.note-cents'))
          $numberInputs = $(".note-cents");
        else
          $numberInputs = $(".number-input:visible,.note-input:visible");
        var idx = $numberInputs.index(elt);
        var prev = $numberInputs.eq(Math.max(idx-1, 0));
        $(prev).click();
      break;
      case 9:  // Tab
      case 40: // Down
        var $numberInputs;
        if ($(elt).is('.note-cents'))
          $numberInputs = $(".note-cents");
        else
          $numberInputs = $(".number-input:visible,.note-input:visible");
        var idx = $numberInputs.index(elt);
        var next = $numberInputs.eq(idx+1);
        $(next).click();
      break;
    }
    return false;
  }
  
  function noteKeyDown(e, elt) {
    var c = String.fromCharCode(e.keyCode).toUpperCase();
    if (/[A-G]/.test(c)) {
      $(elt).text(c);
      $(elt).blur();
      return false;
    }
    switch (e.keyCode) {
      case 38: // Up
        var $numberInputs = $(".number-input:visible,.note-input:visible");
        var idx = $numberInputs.index(elt);
        var prev = $numberInputs.eq(Math.max(idx-1, 0));
        $(prev).click();
      break;
      case 40: // Down
      case 9:  // Tab
        var $numberInputs = $(".number-input:visible,.note-input:visible");
        var idx = $numberInputs.index(elt);
        var next = $numberInputs.eq(idx+1);
        $(next).click();
      break;
    }
    $(elt).blur();
    return false;
  }
  
  $(window).blur(function() {
    $(document.activeElement).blur();
  });
  
  $(".number-input")
    .keydown(function(e) {
      numberKeyDown(e, this);
    })
    .blur(function(e) {
      handleNumberEnter(e, $(this));
    })
    .click(function () {
      selectElementContents(this);
    })
    .mouseup(function (e) {
      e.preventDefault();
    });
  
  $(".note-input")
    .keydown(function(e) {
      noteKeyDown(e, this);
    })
    .blur(function(e) {
      handleNoteEnter(e, $(this));
    })
    .click(function () {
      selectElementContents(this);
    })
    .mouseup(function (e) {
      e.preventDefault();
    });
  
  $("label").click(function() {
    $(this).find('.number-input,.note-input').focus();
  });
  
  drawChart();
  $(window).resize(function() {
    drawChart();
  });
//  $('#chart_div').bind('gesturechange', function(e) {
//    e = e.originalEvent;
//    if (!e) return;
//    if (!e.scale) return;
//    var scale = Math.max(1, e.scale);
//    $('#chart_div').css('transform', 'scale('+scale+',1)');
//  });
  
  $('#symmetric-checkbox').change(function() {
    symmetric = $(this).is(':checked');
    $('#reset-button').fadeIn(100);
    updateNoteSound();
    drawChart();
  });
  
  $('#two-oct-checkbox').change(function() {
    octavesRange = 1+1*$(this).is(':checked');
    updateCentSliderRanges();
    drawChart();
  });
  
  $('#low-oct-checkbox').change(function() {
    showLowOct = $(this).is(':checked');
    updateCentSliderRanges();
    drawChart();
  });
  
  sliderOptions = {
    min: 1,
    max: 12,
    value: 6,
    step: 1,
    slide: function(event, ui) {
      $('#partials-num').text(ui.value);
    },
    stop: function(event, ui) {
      $('#partials-num').text(ui.value);
      numPartials = ui.value;
      updateNoteSound();
      $('#reset-button').fadeIn(100);;
      drawChart();
    }
  };
  if (!isPhoneDevice) sliderOptions.animate = true;
  $('#partials-slider')
    .on('mousedown', sliderMouseDown)
    .on('touchstart', sliderMouseDown)
    .slider(sliderOptions);

  sliderOptions = {
    min: 1,
    max: 6,
    value: rootOctave,
    step: 1,
    slide: function(event, ui) {
      $('#root-octave-num').text(ui.value);
    },
    stop: function(event, ui) {
      rootOctave = ui.value;
      $('#root-octave-num').text(rootOctave);
      $('#reset-button').fadeIn(100);
      updateBaseFreq();
      drawChart();
    }
  };
  if (!isPhoneDevice) sliderOptions.animate = true;
  $('#root-octave-slider')
    .on('mousedown', sliderMouseDown)
    .on('touchstart', sliderMouseDown)
    .slider(sliderOptions);
  
  sliderOptions = {
    min: 0,
    max: 11,
    value: rootNote,
    step: 1,
    slide: function(event, ui) {
      $('#root-note-name').text(noteNames[ui.value]);
    },
    stop: function(event, ui) {
      rootNote = ui.value;
      $('#root-note-name').text(noteNames[ui.value]);
      $('#reset-button').fadeIn(100);
      updateBaseFreq();
      drawChart();
    }
  };
  if (!isPhoneDevice) sliderOptions.animate = true;
  $('#root-note-slider')
    .on('mousedown', sliderMouseDown)
    .on('touchstart', sliderMouseDown)
    .slider(sliderOptions);
  
  sliderOptions = {
    min: -49,
    max: 50,
    value: rootCents,
    step: 1,
    slide: function(event, ui) {
      $('#root-cents-num').text(ui.value);
    },
    stop: function(event, ui) {
      rootCents = ui.value;
      $('#root-cents-num').text(rootCents);
      $('#reset-button').fadeIn(100);
      updateBaseFreq();
      drawChart();
    }
  };
  if (!isPhoneDevice) sliderOptions.animate = true;
  $('#root-cents-slider')
    .on('mousedown', sliderMouseDown)
    .on('touchstart', sliderMouseDown)
    .slider(sliderOptions);
  
  $('#dropoff-num').text(dropoff.toFixed(2));
  sliderOptions = {
    min: 0,
    max: 1,
    value: dropoff,
    step: 0.05,
    slide: function(event, ui) {
      $('#dropoff-num').text(ui.value.toFixed(2));
    },
    stop: function(event, ui) {
      dropoff = ui.value;
      updateNoteSound();
      $('#dropoff-num').text(ui.value.toFixed(2));
      $('#reset-button').fadeIn(100);
      drawChart();
    }
  };
  if (!isPhoneDevice) sliderOptions.animate = true;
  $('#dropoff-slider')
    .on('mousedown', sliderMouseDown)
    .on('touchstart', sliderMouseDown)
    .slider(sliderOptions);
  
  $('#clear-button').click(function() {
    notes = [];
    removeAllOscillators();
    addOscillator(0);
    drawChart();
    var $div = $('<div></div>');
    $(".note-row:not(#root-row):not(#note-template):not(#add-note)").remove();
    $('#clear-button').fadeTo(100,0);
  });
  
  $('#reset-button').click(function(e) {
    var $slider, val;
    
    if ($('#symmetric-checkbox').prop('checked'))
      $('#symmetric-checkbox').click();
    
    val = 0.2;
    $slider = $('#dropoff-slider');
    $slider.slider('value', val);
    $slider.slider('option', 'stop').call($slider, e, {value: val});
    
    val = 4;
    $slider = $('#root-octave-slider');
    $slider.slider('value', val);
    $slider.slider('option', 'stop').call($slider, e, {value: val});
    
    val = 9;
    $slider = $('#root-note-slider');
    $slider.slider('value', val);
    $slider.slider('option', 'stop').call($slider, e, {value: val});
    
    val = 0;
    $slider = $('#root-cents-slider');
    $slider.slider('value', val);
    $slider.slider('option', 'stop').call($slider, e, {value: val});
    
    val = 6;
    $slider = $('#partials-slider');
    $slider.slider('value', val);
    $slider.slider('option', 'stop').call($slider, e, {value: val});
    
    $('#reset-button').fadeOut(100);
  });
  
  function updateBaseFreq() {
    var centsFromA4 = rootCents + (rootNote - 9 + 12 * (rootOctave - 4)) * 100;
    baseFreq = 440 * Math.pow(2, centsFromA4 / 1200.0);
    removeAllOscillators();
    addAllOscillators();
  }
  
  function sliderMouseDown(e) {
    if ($(e.target).is('.ui-slider-handle'))
      return;
    e.stopImmediatePropagation();
    if (!e.offsetX)
      return;
    var $slider = $(e.target);
    if (!$slider.is('.ui-slider'))
      return;
    var $sliderHandle = $(e.target).find('.ui-slider-handle');
    var val = $slider.slider("option", "value");
    var step = $slider.slider("option", "step");
    if (e.offsetX > $sliderHandle.position().left) {
      var max = $slider.slider("option", "max");
      if (val >= max)
        return;
      val = val+step;
    } else {
      var min = $slider.slider("option", "min");
      if (val <= min)
        return;
      val = val-step;
    }
    $slider.slider("value", val);
    $slider.slider('option', 'stop').call($slider, e, {value: val});
  };
  
  function updateNoteSound() {
    var curve,
      curveSize = numPartials+1;
    if (symmetric)
      curveSize = 2*numPartials;
    curve = new Float32Array(curveSize);
    curve[0] = 0; // DC offset
    var amp = 1;
    for (var i = 1; i < curveSize; i++) {
      curve[i] = amp;
      amp *= dropoff;
      if (symmetric) i++;
    }
    waveTable = ctx.createWaveTable(curve, curve);
    removeAllOscillators();
    addAllOscillators();
  }
  
  $('#active-checkbox').change(function() {
    if ($(this).is(':checked'))
      addAllOscillators();
    else
      removeAllOscillators();
  });
  
  function addAllOscillators() {
    addOscillator(0);
    $.each(notes, function(i, note) {
      addOscillator(note);
    });
  }
  
  function audioFadeIn(g) {
    var fpsDelay = 1000.0/fadeFPS;
    var t = 0;
    g.gain.value = 0.0;
    var interval = setInterval(function() {
      t += fpsDelay;
      var angle = 0.5 * (1 - t / noteFadeTime) * Math.PI;
      if (t > noteFadeTime) {
        g.gain.value = mainVolume;
        clearInterval(interval);
        return;
      }
      g.gain.value = mainVolume*Math.cos(angle);
    }, fpsDelay);
  }
  
  function audioFadeOut(g, o) {
    var fpsDelay = 1000.0/fadeFPS;
    var t = 0;
    g.gain.value = mainVolume;
    var interval = setInterval(function() {
      t += fpsDelay;
      var angle = 0.5 * (1 - t / noteFadeTime) * Math.PI;
      if (t > noteFadeTime) {
        o.noteOff(0);
        clearInterval(interval);
        return;
      }
      g.gain.value = mainVolume*Math.sin(angle);
    }, fpsDelay);
  }
  
  function addOscillator(value) {
    if (!usingWebAudio) return;
    if (!waveTable) updateNoteSound();
    var o = ctx.createOscillator();
    console.log(o);
    o.setWaveTable(waveTable);
    console.log(waveTable);
    var g = ctx.createGainNode();
    console.log(g);
    o.frequency.value = baseFreq * Math.pow(2.0, value / 1200.0);
    o.connect(g);
    g.connect(ctx.destination);
    audioFadeIn(g);
    if ($('#active-checkbox').is(':checked'))
      o.noteOn(0);
    currentOscillators.push(o);
    currentGainNodes.push(g);
  }
  
  function changeOscillator(oldval, newval) {
    if (!usingWebAudio) return;
    $.each(currentOscillators, function(i, o) {
      if (!0 || oldval != Math.round(1200.0*Math.log(o.frequency.value / baseFreq) / 0.6931471806))
        return;
      removeOscillator(oldval);
      addOscillator(newval);
    });
  }
  
  function removeOscillator(value) {
    if (!usingWebAudio) return;
    $.each(currentOscillators, function(i, o) {
      if (!o) return;
      if (value != Math.round(1200.0*Math.log(o.frequency.value / baseFreq) / 0.6931471806))
        return;
      var g = currentGainNodes[i];
      var currentTime = ctx.currentTime;
      audioFadeOut(g, o);
      currentOscillators.splice(i, 1);
      currentGainNodes.splice(i, 1);
    });
  }
      
  function removeAllOscillators() {
    if (!usingWebAudio) return;
    $.each(currentOscillators, function(i, o) {
      var g = currentGainNodes[i];
      var currentTime = ctx.currentTime;
      audioFadeOut(g, o);
    });
    currentOscillators = [];
    currentGainNodes = [];
  }
  
  function drawChart() {
    $('.footer').hide();
    if (chartUpdateTimer != null)
      clearTimeout(chartUpdateTimer);
    chartUpdateTimer = setTimeout(function() {
      $('#chart_div').height(Math.min(300, $('#chart_div').width() * 0.5));
      var url = "data.php?"+$.param({
        np: numPartials,
        notes: notes,
        sym: symmetric,
        root: baseFreq,
        dropoff: dropoff,
        octs: octavesRange,
        slo: showLowOct
      });
//      console.log(url);
      $.ajax({
        url: url,
        dataType:"json",
        async: true,
        success: function(jsonData) {
          if (jsonData.error) {
            console.log('error: '+jsonData.error);
            return;
          }
          dataTable = new google.visualization.arrayToDataTable(jsonData.data);
          var max = dataTable.getColumnRange(1).max;
          var min = dataTable.getColumnRange(1).min;
          var chartHeightPercent = 80 - 10 * (octavesRange > 1);
          if (octavesRange > 1 && isPhoneDevice)
            chartHeightPercent = 80;
          var options = {
            title: '',
            hAxis: {
              gridlines: {count: 12*octavesRange+1},
              label: 'Cents',
              format: "#"
            },
            vAxis: {
              gridlines: {count: 0},
              viewWindowMode:'explicit',
              viewWindow: {
                max:max*1.01,
                min:min*0.95
              }
            },
            legend: 'none',
            chartArea: {'width': '94%', 'height': chartHeightPercent+'%'},
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
          if (!isPhoneDevice)
            options.animation = {
              duration: 400,
              easing: 'inAndOut'
            };
          dataTable.addColumn('number', 'Dissonance');
          var ind = 1200*showLowOct;
          var numRows = dataTable.getNumberOfRows();
          if (ind >= 0 && ind < numRows)
            dataTable.setCell(ind, 3, dataTable.getValue(ind, 1));
          $.each(notes, function(i, note) {
            var ind = Math.round(1200*showLowOct+note);
            if (ind >= 0 && ind < numRows)
              dataTable.setCell(ind, 3, dataTable.getValue(ind, 1));
          });

          chart.draw(dataTable, options);

          var listitems = $('.note-row:not(#root-row):not(#note-template):not(#add-note)').get();
          listitems.sort(function(a, b) {
            var av = parseInt($(a).find('.cents-display').text());
            var bv = parseInt($(b).find('.cents-display').text());
            if (av > bv) return 1;
            if (av < bv) return -1;
            return 0;
          });
          notes.sort();

          $.each(listitems, function(index, item) {
            $('#note-template').before(item); 
          });
        }
      });
    }, noteFadeTime);
    $('.iotic-logo').css('left', $('#page-title').offset().left+2+'px');
    $('.container').css('min-height', $(document).innerHeight()+'px');
    $('.footer').show();
  }
  
  function updateCentSliderRanges() {
    $('.cents-slider.ui-slider-horizontal').each(function() {
      var min = -1200*showLowOct;
      var max = 1200*(octavesRange-showLowOct);
      var val = $(this).slider('value');
      if (val > max || val < min)
        return;
      $(this).slider('option', {
        min: min,
        max: max
      });
    });
  }
  
  function centsSlider($slider, value, dontChangeNotes) {
    var $centsDisplay = $slider.parents('.note-row').find('.cents-display');
    $slider.data("value", value);
    var options = {
      min: -1200*showLowOct,
      max: 1200*(octavesRange-showLowOct),
      step: 1,
      value: value,
      slide: function(event, ui) {
        $centsDisplay.text(ui.value);
      },
      stop: function(event, ui) {
        var $centsDisplay = $slider.parents('.note-row').find('.cents-display');
        if (dontChangeNotes) {
            $centsDisplay.text(ui.value);
            $slider.data("value", ui.value);
            return;
        }
        var oldval = $slider.data("value");
        var index = notes.indexOf(oldval);
        if (index !== -1) {
            notes[index] = ui.value;
            changeOscillator(oldval, ui.value);
            drawChart();
            $centsDisplay.text(ui.value);
            $slider.data("value", ui.value);
        }
      }
    };
    if (!isPhoneDevice) options.animate = true;
    $slider
      .on('mousedown', sliderMouseDown)
      .on('touchstart', sliderMouseDown)
      .slider(options);
  }
  
  centsSlider($('#add-slider'), 0, true);
  $('#add-button').click(function() {
    var value = $('#add-slider').slider('value');
    if (value == 0 || $.inArray(value, notes) != -1)
      return;
    $('#add-slider').slider('option', 'value', 0);
    $('#add-slider').parents('.note-row').find('.cents-display').text('0');
    addNoteValue(value);
  });
  
  function addNote(value) {
    var $noteRow = $('#note-template').clone();
    $noteRow.attr({id: ''});
    $noteRow.find('.cents-display').text(value).addClass('note-cents');
    $('#note-template').before($noteRow);
    $noteRow.find('.cents-slider').each(function() {
      centsSlider($(this), value, false);
    });
    $noteRow.find(".number-input")
      .keydown(function(e) {
        numberKeyDown(e, this);
      })
      .blur(function(e) {
        handleNumberEnter(e, $(this))
      })
      .click(function () {
        selectElementContents(this);
      })
      .mouseup(function (e) {
        e.preventDefault();
      });

    $noteRow.show();
    addOscillator(value);
    $noteRow.find('.close').click(function() {
      var $noteRow = $(this).parents('.note-row');
      var value = parseFloat($noteRow.find('.cents-display').text());
      var position = $.inArray(value, notes);
      if (~position) {
        notes.splice(position, 1);
        removeNote(value);
        drawChart();
      }
    });
    
    if (notes.length == 1)
      $('#clear-button').fadeTo(100,1);
  }
  
  function removeNote(value) {
    $('.note-row').each(function() {
      if ($(this).is('#root-row') || $(this).is('#add-note'))
        return;
      if ($(this).find('.cents-display').text() != value)
        return;
      $(this).remove();
      removeOscillator(value);
      if (notes.length == 0)
        $('#clear-button').fadeTo(100,0);
    });
  }
  
  function addNoteValue(value) {
    var position = $.inArray(value, notes);
    if (position != -1) {
      notes.splice(position, 1);
      removeNote(value);
    } else {
      notes.push(value);
      addNote(value);
    }
    drawChart();
  }
  
  function chartSelectHandler() {
    var selection = chart.getSelection()[0];
    if (typeof(selection) == 'undefined') return;
    var value = dataTable.getValue(selection.row, 0);
    if (value == 0) return;
    addNoteValue(value);
  }
});
