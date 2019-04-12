console.log('jonas.js loaded')

jonas = function(){
    // ini
    if(typeof(dataDiv)){
        console.log('jonas.js found a div to display stuff', dataDiv)
        fetch('../TCGA.PAAD.mutect.fea333b5-78e0-43c8-bf76-4c78dd3fac92.DR-10.0.somatic.maf')
        .then(x=>{
            x.text().then(txt=>{
                jonas.parseTxt(txt)
            })
        })
    }
    
}

jonas.parseTxt=txt=>{
    debugger
}

window.onload=jonas

