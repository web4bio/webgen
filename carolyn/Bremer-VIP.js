betterFetch = async function(url,body){
    let fetchData = { 
        method: 'POST', 
        body: JSON.stringify(body),
        headers:{'Content-Type':'application/json'}
        };
    let tmpData = (await fetch(url, body)).json();
    return(tmpData);
    };

addX = function(response) {
    let x_axis = [];
    //x_axis.push(response.expression_log2)

    response.forEach(function(response) {
        x_axis.push(response.expression_log2)
    })
    return x_axis
};

addText = function(response) {
    let text = [];
    //response.forEach(function(text) {
        text.push(response.tcga_participant_barcode)
    //})
    return text;
};

addY = function(response) {
    let y_axis = [];
    //response.forEach(function(y_axis) {
        y_axis.push(response.expression_log2)
    //})
    return y_axis;
}