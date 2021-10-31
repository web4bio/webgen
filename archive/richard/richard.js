console.log('richard.js is starting');

url_1 = 'https://api.gdc.cancer.gov/projects';

body_1 = ({
  'fields': "disease_type",
  'from': 0,
  'size': 42
  });
  
betterFetch = async function(url,body){
  let fetchData = { 
      method: 'POST', 
      body: JSON.stringify(body),
      headers:{'Content-Type':'application/json'}
  };
  let tmpData = (await fetch(url, fetchData)).json();
  return(tmpData);
};

getCaseCounts = function(projectData) {
  let caseCounts=[];
  projectData.data.hits.forEach(function(prj,i){
    caseCounts = caseCounts.concat({
      "label" : prj.id,
      "y" : prj.summary.case_count,})
    })
  return caseCounts
};

fibonacci = function(x) {
  if(x<2){
    return 1
  }
  let a = 1.0
  let b = 1.0
  let c = 2.0
  for(i = 2;i <= x; i++){
    c = a+b
    a = b
    b = c
  }
  return c
};

console.log('richard.js finished');
