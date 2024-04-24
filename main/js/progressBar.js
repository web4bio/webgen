// example: 
// per = 0
// setInterval(() => {ProgressBar.setPercentage(per); per += 10;}, 1000)
// ProgressBar.cleanUp()

const ProgressBar = {
    id: 'progress-bar',
    percent: 0,
    setPercentage: function (newPercent,text) {
        if(!text) {
            document.getElementById("progress-bar").innerText = "";
        }
        else {
            document.getElementById("progress-bar").innerText = text;
        }
        if (newPercent >= 100)
            this.percent = 100
        else if (newPercent <= 0)
            this.percent = 0
        else
            this.percent = Math.round(newPercent)
        console.log(this.percent);
        this.rerender()
    },
    cleanUp: function () {
        this.percent = 0
        document.getElementById("progress-bar").innerText = "";
        this.rerender()
        console.log("Cleaned up")
    },
    rerender: function () {
        const ele = document.querySelector(`#${this.id}`)
        ele.style.setProperty('--progress', this.percent + '%')
    }
}
