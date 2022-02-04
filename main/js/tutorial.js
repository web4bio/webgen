// Tutorial using intro.js

const startTutorial = () => {
	// See https://introjs.com/docs/intro/options#options
	const options = {
		showBullets: false,
		steps: [{
			element: document.querySelector("#tutorialAnchor"),
			title: 'Welcome!',
			intro: 'We are so happy to see you here! 👋',
		}, {
			element: document.querySelector('#tumorSelectorArea'),
			intro: 'Select one or more tumor types here.',
			position: 'top',
		}, {
			element: document.querySelector("#geneOneQuerySelectBox"),
			intro: 'Select one or more genes here.'
		}, {
			element: document.querySelector('#clinicalQuerySelectBox'),
			intro: 'Select metadata here.'
		}, {
			element: document.querySelector("#geneTwoQuerySelectBox"),
			intro: 'Select another gene (???)',
		}, {
			element: document.querySelector("#pathwaySelectBox"),
			intro: "Select a pathway here."
		}, {
			element: document.querySelector("#submitButton"),
			intro: "Click submit, and wait a few seconds for your plots!"
		}]
	};
	introJs().setOptions(options).start()
}
