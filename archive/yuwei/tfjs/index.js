/* generate img json and html */

fs = require("fs");

console.log("index.js loaded at" + Date());

fs = require("fs")
dirObj={}

function writeCatalog(path){
    path = path || "PNGs";
    console.log("path: "+path);
    var ls = [];
    var h = '<ol>';
    fs.readdirSync(path).forEach(d=>{
        // check hidden file
        if((d[0]!=='.')&&(!d.match(/.*\.json/))&&(!d.match(/.*\.html/))){
            // <li><a href = 'TCGA-3C-290283.png'> TCGA-3C-290283.png</a></li>
            h += '<li><a href="'+d+'">'+d+'</a></li>';
            let st = fs.statSync(path+'/'+d);
            if(st.isDirectory()){
                writeCatalog(path+'/'+d)
            }else{
                buildDir(path+'/'+d, st.size)
            }
            ls.push(d)
        }
    })
    h += '</ol>';
    fs.writeFileSync(path+'/index.json',JSON.stringify(ls,null,3));
    fs.writeFileSync(path+'/index.html',h)
}

buildDir=function(path,val){
    if(typeof(val)=='string'){
        val='"'+val+'"'
    }else if(typeof(val)=='object'){
        val=JSON.stringify(val)
    }

    path=path.split('/')
    for(var i=0 ; i<path.length ; i++){
        if(!eval('dirObj'+JSON.stringify(path.slice(0,i+1)).replace(/","/g,'"]["'))){
            eval('dirObj'+JSON.stringify(path.slice(0,i+1)).replace(/","/g,'"]["')+'={}')
        }
        if(i==(path.length-1)){
            let str='dirObj'+JSON.stringify(path.slice(0,i+1)).replace(/","/g,'"]["')+'='+val
            //console.log(str)
            try{
                eval(str)
            }catch(err){
                Error(err)
                debugger
            }
        }
    }
}

writeCatalog()
fs.writeFileSync('dir.json',JSON.stringify(dirObj,null,3))
console.log('catalog finished:',dirObj)




/*---------------------------------------------------------------------------------*/
