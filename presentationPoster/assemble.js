console.log('assemble.js loaded')

assemble=async(index='presentations.json')=>{
    console.log(`assembling slides from ${index}`)
    let div=document.getElementById('intro').parentElement
    let pres=await (await fetch(index)).json()
    console.log(JSON.stringify(pres,null,3))
    let c=0 // count
    let r = 2000 // radius
    let n=pres.length
    for(let i=0;i<n;i++){   // n html files
        console.log(`assembling ${pres[i]}`)
        let h = await (await fetch(pres[i])).text()
        h = h.replace(/\n/g,'').replace(/(>[\s\n\r]+)/g,'>').replace(/([\s\n\r]+<)/g,'<')
        let newDivs=document.createElement('div')
        newDivs.innerHTML=h
        let m=newDivs.childElementCount
        for(let j=0;j<m;j++){    // m divs in ith html file
            let newDiv=newDivs.children[0]
            newDiv.className="step slide"
            if(!newDiv.getAttribute('data-z')){
                newDiv.setAttribute('data-x',Math.round(r*Math.cos(Math.PI*(i*360/n)/180)))
                newDiv.setAttribute('data-y',Math.round(r*Math.sin(Math.PI*(i*360/n)/180)))
                newDiv.setAttribute('data-z',2000-j*3000)
                newDiv.setAttribute('data-rotate',90+i*360/n)
                //newDiv.setAttribute('data-x',Math.round(Math.random()*2000-1000))
                //newDiv.setAttribute('data-y',Math.round(Math.random()*2000-1000))
                //newDiv.setAttribute('data-z',Math.round(Math.random()*2000-1000))

            }
            div.appendChild(newDiv)
            console.log(c,i,j,newDiv.id,newDiv)
            c++
        }

        //debugger
    }

    // final overview slide
    let overviewDiv = document.createElement('div')
    overviewDiv.innerHTML='<div id="overview" class="step" data-x="0000" data-y="0" data-z="460" data-rotate-x="0" data-rotate-y="-7" data-rotate-y="-10" data-rotate-z="-15" data-scale="7"></div>'
    div.appendChild(overviewDiv.children[0])
}

window.onload=_=>{assemble()}