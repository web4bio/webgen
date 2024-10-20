// globals
var canvas;
var ctx;
var slider;

// create image object
var img = new Image();
img.crossOrigin = 'anonymous'

// set param
var img_w = 400;
var img_h = 400;
var dx, dy = 0;

window.onload = function () {
  canvas = document.getElementById("canvas")
  canvas.width = 400;
  canvas.height = 400;
  ctx = canvas.getContext("2d")
  slider = document.getElementById("scale")
  posOfSlider = document.getElementById("pos")
}


function main(url) {
  var scale_value = slider.value;
  console.log(scale_value)
  img.src = url;
  img.onload = function () {
    drawImageByScale(scale_value);
    slider.oninput = function () {
      scale_value = slider.value;
      posOfSlider.innerHTML = scale_value
      drawImageByScale(scale_value)
      dragEvent()
    }
  }
}

function drawImageByScale(scale_value) {
  var imgW = img_w * scale_value;
  var imgH = img_h * scale_value;


  dx = canvas.width / 2 - imgW / 2;
  dy = canvas.height / 2 - imgH / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, imgW, imgH)
}

function dragEvent() {
  scale_value = slider.value;
  var dragging;
  canvas.onmousedown = function (e1) {
    dragging = true;
    // get position when mouse click down
    x_1 = e1.clientX;
    y_1 = e1.clientY;
    canvas.onmousemove = function (e2) {
      if (dragging) {
        // current image size
        var imgW = img_w * scale_value;
        var imgH = img_h * scale_value;
        // current mouse position
        x_2 = e2.clientX;
        y_2 = e2.clientY;
        // the displacement
        var x = x_2 - x_1;
        var y = y_2 - y_1;
        // location after the displacement
        loc_x = dx + x;
        loc_y = dy + y;
        // make sure image won't be dragged out of the canvas
        bound = canvas.width / 2 - imgH / 2;
        if (loc_x < 2 * bound) {
          loc_x = 2 * bound;
        };
        if (loc_x > 0) {
          loc_x = 0;
        };
        if (loc_y < 2 * bound) {
          loc_y = 2 * bound;
        };
        if (loc_y > 0) {
          loc_y = 0;
        }
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, loc_x, loc_y, imgW, imgH);

    }
    // renew position
    dx = loc_x;
    dy = loc_y;
    console.log({ dx, dy })

    // once stop dragging, stop all
    canvas.onmouseleave = function () {
      dragging = false;
      canvas.onmousemove = null;
    }
    canvas.onmouseup = function () {
      dragging = false;
      canvas.onmousemove = null;
    }
  };
}

function windowToCanvas(x, y) {
  var box = canvas.getBoundingClientRect();
  return {
    x: x - box.left - (box.width - canvas.width) / 2,
    y: y - box.top - (box.height - canvas.height) / 2
  }
}
