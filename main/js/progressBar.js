// example: 
// per = 0
// setInterval(() => {ProgressBar.setPercentage(per); per += 10;}, 1000)
// ProgressBar.cleanUp()

const ProgressBar = {
    id: 'progress-bar',
    percent: 0,
    setPercentage: function (newPercent) {
        if (newPercent >= 100)
            this.percent = 100
        else if (newPercent <= 0)
            this.percent = 0
        else
            this.percent = Math.round(newPercent)
        this.rerender()
    },
    cleanUp: function () {
        this.percent = 0
        this.rerender()
    },
    rerender: function () {
        const ele = document.querySelector(`#${this.id}`)
        ele.style.setProperty('--progress', this.percent + '%')
    }
}
