document.getElementById('loadImage').onclick = function fetchData(){
    path = 'initial/test/a74b3a27-811a-4665-ac9a-fea1b6b65e0b_20664_46262.png';
    var img = new Image();
    img.src = path;
    console.log(img)
}
