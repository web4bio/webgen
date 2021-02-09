function fetchImage(){
    opt = document.getElementById('selImage').value;
    url = 'PNGs/paad/'+opt;
    var h = '<div><img id="imgID" src=">' + url + '"></div>'
    document.getElementById("showImg").innerHTML = h
}