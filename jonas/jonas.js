console.log('jonas.js loaded')

jonas = function(){
    // ini
    if(typeof(dataDiv)){
        console.log('jonas.js found a div to display stuff', dataDiv)
        fetch('../TCGA.PAAD.mutect.fea333b5-78e0-43c8-bf76-4c78dd3fac92.DR-10.0.somatic.maf')
        .then(x=>{
            x.text().then(txt=>{
                dataDiv.textContent=jonas.parseTxt(txt).splice(0,100)
            })
        })
    }
    
}

jonas.parseTxt=txt=>{
    // counting for now, more later
    let c = txt.split('\n').map(line=>line.length)
    //dataDiv.textContent=c.splice(0,100)
    return c
}

window.onload=jonas

