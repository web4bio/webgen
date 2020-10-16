
const betterFetch = async (url, body) => {
  const fetchData = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  }
  const tmpData = (await fetch(url, fetchData)).json()
  return tmpData
}

const projectData = async () => {
  let url = 'https://api.gdc.cancer.gov/projects'
  let body = ({
    'fields': "disease_type,name,program.name,project_id,summary.case_count",
    'from': 0,
    'size': 1000
  })
  return (await betterFetch(url, body))
}

const getCaseCounts = (projectData) => {
  let caseCounts = [];
  projectData.data.hits.forEach(function (prj, i) {
    // for each hit (project)
    caseCounts = caseCounts.concat(prj.id)
  })
  return caseCounts
}

const fileData = async (cohort) => {
  let url = 'https://api.gdc.cancer.gov/files'
  let body = ({
    'filters': {
      "op": "and",
      "content": [{
        "op": "in",
        "content": {
          "field": "cases.project.project_id",
          "value": cohort // "TCGA-PAAD" in [string]
        }
      }, {
        "op": "in",
        "content": {
          "field": "access",
          "value": ["open"]
        }
      }, {
        "op": "in",
        "content": {
          "field": "data_format",
          "value": ["SVS"]
        }
      }]
    },
    //'fields': "data_type,file_name,file_id,data_category,type,experimental_strategy",
    'from': 0,
    'size': 10000
  })
  return (await betterFetch(url, body))
}

export default { projectData, getCaseCounts, fileData }