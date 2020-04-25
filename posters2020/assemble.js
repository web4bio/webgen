console.log('assemble.js loaded')

assemble=async(index='presentations.json')=>{
    console.log(`assembling slides from ${index}`)
    let div=document.getElementById('impress')
    let pres=await (await fetch(index)).json()
    console.log(`presentation decks: ${console.log(JSON.stringify(pres,null,3))}`)
    //debugger
    for(let i in pres){
        console.log(`assembling ${pres[i]}`)
        let h = await (await fetch(pres[i])).text()
        let newDivs=document.createElement('div')
        newDivs.innerHTML=h
        for(let j=0;j<newDivs.childElementCount;j++){
            let newDiv=newDivs.children[j]
            newDiv.className="step slide"
            div.appendChild(newDiv)
            console.log(i,j,newDiv.id)
        }
        //debugger
    }

    // final overview slide
    let overviewDiv = document.createElement('div')
    overviewDiv.innerHTML='<div id="overview" class="step" data-x="3000" data-y="1500" data-z="0" data-scale="10"></div>'
    div.appendChild(overviewDiv.children[0])
}

window.onload=_=>{assemble()}