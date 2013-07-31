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
    if ($element.is('#root-num'))
      val = Math.log(val);
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
  
  function selectElementContents(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  
  function numberKeyDown(e, elt) {
//    console.log(e.keyCode);
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
//      case 9:  // Tab
      case 38: // Up
        var $numberInputs;
        if ($(elt).is('.note-cents'))
          $numberInputs = $(".note-cents");
        else
          $numberInputs = $(".number-input:visible");
        var idx = $numberInputs.index(elt);
        console.log($(elt));
        var prev = $numberInputs.eq(Math.max(idx-1, 0));
        $(prev).click();
      break;
      case 40: // Down
        var $numberInputs;
        if ($(elt).is('.note-cents'))
          $numberInputs = $(".note-cents");
        else
          $numberInputs = $(".number-input");
        console.log($(elt));
        var idx = $numberInputs.index(elt);
        var next = $numberInputs.eq(idx+1);
        $(next).click();
      break;
    }
    return false;
  }
  
  $(window).blur(function() {
    $(".number-input").blur();
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
  $("label").click(function() {
    $(this).find('.number-input').focus();
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
  
  $('#active-checkbox').change(function() {
    if ($(this).is(':checked'))
      play();
    else
      stop();
  });
  
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
    min: Math.log(27.5),
    max: Math.log(9956.06348),
    value: Math.log(440),
    step: Math.log(Math.pow(2, 1/12.0)),
    slide: function(event, ui) {
      $('#root-num').text(Math.exp(ui.value).toFixed(1));
    },
    stop: function(event, ui) {
      baseFreq = Math.exp(ui.value);
      $('#root-num').text(baseFreq.toFixed(1));
      $('#reset-button').fadeIn(100);
      drawChart();
    }
  };
  if (!isPhoneDevice) sliderOptions.animate = true;
  $('#root-slider')
    .on('mousedown', sliderMouseDown)
    .on('touchstart', sliderMouseDown)
    .slider(sliderOptions);
  
  sliderOptions = {
    min: 0,
    max: 1,
    value: 0.2,
    step: 0.05,
    slide: function(event, ui) {
      $('#dropoff-num').text(ui.value.toFixed(2));
    },
    stop: function(event, ui) {
      dropoff = 1-ui.value;
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
    
    val = Math.log(440);
    $slider = $('#root-slider');
    $slider.slider('value', val);
    $slider.slider('option', 'stop').call($slider, e, {value: val});
    
    val = 6;
    $slider = $('#partials-slider');
    $slider.slider('value', val);
    $slider.slider('option', 'stop').call($slider, e, {value: val});
    
    $('#reset-button').fadeOut(100);
  });
  
  function sliderMouseDown(e) { // disable clicks on track
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
  
  function stop() {
    if (!usingWebAudio) return;
    $.each(all_oscillators, function(i, o) {
      o.noteOff(0);
      // should also destroy them?
    });
    all_oscillators = [];
  }
  
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
  }
  
  function play() {
    if (!usingWebAudio) return;
    stop();
    
    if (!waveTable) updateNoteSound();
    for (var i = 0; i < notes.length+1; i++) {
      var o = ctx.createOscillator();
      o.setWaveTable(waveTable);
      var g = ctx.createGainNode();
      if (i == 0)
        o.frequency.value = baseFreq;
      else
        o.frequency.value = baseFreq * Math.pow(2.0, notes[i-1] / 1200.0);
      o.connect(g);
      g.gain.value = 0.1;
      g.connect(ctx.destination);
      o.noteOn(0);
      all_oscillators.push(o);
    }
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
      console.log(url);
      if ($('#active-checkbox').is(':checked'))
        play();
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
//          var min = dataTable.getColumnRange(1).min;
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
                min:0//min*0.95
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
            var ind = 1200*showLowOct+note;
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
    }, 200);
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
        var index = notes.indexOf($slider.data("value"));
        if (index !== -1) {
            notes[index] = ui.value;
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
      $(this).remove()
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
    addNoteValue(value);
  }
});
