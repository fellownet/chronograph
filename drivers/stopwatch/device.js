'use strict';

const Homey = require('homey');
const { ChronographType } = require('../../lib/utils.js');
const Device = require('../../lib/device.js');

class StopwatchDevice extends Device {
	getStartCards() {
		return Homey.ManagerSettings.get('stopwatch_start_cards') || [];
	}

	getResumeCards() {
		return Homey.ManagerSettings.get('stopwatch_resume_cards') || [];
	}

	getChronographType() {
		return ChronographType.STOPWATCH;
	}
}

module.exports = StopwatchDevice;
