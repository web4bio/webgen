console.log("canSelector loaded");

async function getJSON(url){
    url = url || 'https://github.com/web4bio/webgen/blob/Imaging_Stuff/archive/yuwei/tfjs/PNGs/paad/index.json';
    return (await fetch(url))
}

function fetchOpt(div){
    selImgs = getJSON()
    var h = 'Select Tissue:<select id="selImage">';
    for(var i=0; i<selImgs.length; i++){
        h+='<option value="' + selImgs[i] + '">' + selImgs[i] + '<option'
    }
    h += '</selection>';
    div.innerHTML = h
}


