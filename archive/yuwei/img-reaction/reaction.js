// create canvas
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// get slider
var slider = document.getElementById("scale");

// create image object
var img = new Image();

// set param
var img_w = 400;
var img_h = 400;
canvas.width = 400;
canvas.height = 400;


//load ...
window.onload = function(){
    var scale_value = slider.value;
    img.src = "PNGs/case1.png";
    img.onload = function(){
        drawImageByScale(scale_value);
        slider.oninput = function(){
            scale_value = slider.value;
            drawImageByScale(scale_value)
        }
    }
}

function drawImageByScale(scale_value){
    var imgW = img_w * scale_value;
    var imgH = img_h * scale_value;

    dx = canvas.width / 2 - imgW / 2;
    dy = canvas.height / 2 - imgH / 2;

    ctx.clearRect(0,0, canvas.width, canvas.height);
    ctx.drawImage(img, dx, dy, imgW, imgH)
}

function dragEvent(){
    
}