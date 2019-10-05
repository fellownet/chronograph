'use strict';

const Homey = require('homey');
const Chronograph = require('./lib/chronograph.js');
const { LogLevel } = require('./lib/utils.js');

// Actions.
const TimerStart = require('./lib/timer/actions/timer_start.js');
const TimerResume = require('./lib/timer/actions/timer_resume.js');
const TimerAdjust = require('./lib/timer/actions/timer_adjust.js');
const TimerPause = require('./lib/timer/actions/timer_pause.js');
const TimerStop = require('./lib/timer/actions/timer_stop.js');
const TimerStopAll = require('./lib/timer/actions/timer_stop_all.js');
const StopwatchStart = require('./lib/stopwatch/actions/stopwatch_start.js');
const StopwatchResume = require('./lib/stopwatch/actions/stopwatch_resume.js');
const StopwatchAdjust = require('./lib/stopwatch/actions/stopwatch_adjust.js');
const StopwatchPause = require('./lib/stopwatch/actions/stopwatch_pause.js');
const StopwatchStop = require('./lib/stopwatch/actions/stopwatch_stop.js');
const StopwatchStopAll = require('./lib/stopwatch/actions/stopwatch_stop_all.js');
const TransitionStart = require('./lib/transition/actions/transition_start.js');
const TransitionResume = require('./lib/transition/actions/transition_resume.js');
const TransitionAdjust = require('./lib/transition/actions/transition_adjust.js');
const TransitionPause = require('./lib/transition/actions/transition_pause.js');
const TransitionStop = require('./lib/transition/actions/transition_stop.js');
const TransitionStopAll = require('./lib/transition/actions/transition_stop_all.js');


// Conditions.
const TimerCompare = require('./lib/timer/conditions/timer_compare.js');
const TimerRunning = require('./lib/timer/conditions/timer_running.js');
const StopwatchCompare = require('./lib/stopwatch/conditions/stopwatch_compare.js');
const StopwatchRunning = require('./lib/stopwatch/conditions/stopwatch_running.js');
const TransitionCompare = require('./lib/transition/conditions/transition_compare.js');
const TransitionRunning = require('./lib/transition/conditions/transition_running.js');

// Triggers.
const TimerStarted = require('./lib/timer/triggers/timer_started.js');
const TimerSplit = require('./lib/timer/triggers/timer_split.js');
const TimerFinished = require('./lib/timer/triggers/timer_finished.js');
const TimerStopped = require('./lib/timer/triggers/timer_stopped.js');
const StopwatchStarted = require('./lib/stopwatch/triggers/stopwatch_started.js');
const StopwatchSplit = require('./lib/stopwatch/triggers/stopwatch_split.js');
const StopwatchStopped = require('./lib/stopwatch/triggers/stopwatch_stopped.js');
const TransitionStarted = require('./lib/transition/triggers/transition_started.js');
const TransitionFinished = require('./lib/transition/triggers/transition_finished.js');
const TransitionStopped = require('./lib/transition/triggers/transition_stopped.js');

class Application extends Homey.App {
	onInit() {
		// Initializing cards.
		this.log('Initializing cards.');
		this._initializeCards();

		// Install event handlers.
		this.log('Installing event handlers.');
		this._installEventHandlers();

		// Restore chronographs from settings.
		this.log('Restoring chronographs.');
		this._restoreChronographs();

		this.log('Application is running.');
	}

	_initializeCards() {
		this._cards = {
			// Actions.
			"timer_start": new TimerStart('timer_start'),
			"timer_start_v2": new TimerStart('timer_start_v2'),
			"timer_resume": new TimerResume('timer_resume'),
			"timer_resume_v2": new TimerResume('timer_resume_v2'),
			"timer_adjust": new TimerAdjust('timer_adjust'),
			"timer_adjust_v2": new TimerAdjust('timer_adjust_v2'),
			"timer_pause": new TimerPause('timer_pause'),
			"timer_stop": new TimerStop('timer_stop'),
			"timer_stop_all": new TimerStopAll('timer_stop_all'),
			"stopwatch_start": new StopwatchStart('stopwatch_start'),
			"stopwatch_resume": new StopwatchResume('stopwatch_resume'),
			"stopwatch_adjust": new StopwatchAdjust('stopwatch_adjust'),
			"stopwatch_adjust_v2": new StopwatchAdjust('stopwatch_adjust_v2'),
			"stopwatch_pause": new StopwatchPause('stopwatch_pause'),
			"stopwatch_stop": new StopwatchStop('stopwatch_stop'),
			"stopwatch_stop_all": new StopwatchStopAll('stopwatch_stop_all'),
			"transition_start": new TransitionStart('transition_start'),
			"transition_resume": new TransitionResume('transition_resume'),
			"transition_adjust": new TransitionAdjust('transition_adjust'),
			"transition_pause": new TransitionPause('transition_pause'),
			"transition_stop": new TransitionStop('transition_stop'),
			"transition_stop_all": new TransitionStopAll('transition_stop_all'),

			// Conditions.
			"timer_compare": new TimerCompare("timer_compare"),
			"timer_running": new TimerRunning("timer_running"),
			"stopwatch_compare": new StopwatchCompare("stopwatch_compare"),
			"stopwatch_running": new StopwatchRunning("stopwatch_running"),
			"transition_compare": new TransitionCompare("transition_compare"),
			"transition_running": new TransitionRunning("transition_running"),

			// Triggers.
			"timer_started": new TimerStarted('timer_started'),
			"timer_split": new TimerSplit('timer_split'),
			"timer_finished": new TimerFinished('timer_finished'),
			"timer_stopped": new TimerStopped('timer_stopped'),
			"stopwatch_started": new StopwatchStarted('stopwatch_started'),
			"stopwatch_split": new StopwatchSplit('stopwatch_split'),
			"stopwatch_stopped": new StopwatchStopped('stopwatch_stopped'),
			"transition_started": new TransitionStarted('transition_started'),
			"transition_finished": new TransitionFinished('transition_finished'),
			"transition_stopped": new TransitionStopped('transition_stopped')
		};
	}

	_installEventHandlers() {
		Chronograph.events.on('log', (chronograph, text, level) => {
			if (level >= LogLevel.WARNING) {
				this.error('[' + chronograph.getPrefix() + '] [' + chronograph.getName() + '] ' + text);
			} else {
				this.log('[' + chronograph.getPrefix() + '] [' + chronograph.getName() + '] ' + text);
			}
		});
		Chronograph.events.mon([ 'started', 'resumed', 'paused', 'updated', 'removed' ], (event, chronograph) => {
			let raw = {
				id: chronograph.getId(),
				prefix: chronograph.getPrefix(),
				name: chronograph.getName(),
				duration: chronograph.getDuration(),
				targetDuration: chronograph.getTargetDuration(),
				running: chronograph.isRunning(),
				removed: event == 'removed',
				now: (new Date()).getTime()
			};
			Homey.ManagerApi.realtime('chronograph_event', raw);
			let active = Homey.ManagerSettings.get('chronographs_active') || {};
			if (event == 'removed') {
				delete(active[chronograph.getId()]);
			} else {
				active[chronograph.getId()] = raw;
			}
			Homey.ManagerSettings.set('chronographs_active', active);
		});
	}

	_restoreChronographs() {
		let active = Homey.ManagerSettings.get('chronographs_active') || {};
		Object.values(active).forEach(raw => {
			let duration = raw.duration;
			if (raw.running) {
				duration += ((new Date()).getTime() - raw.now);
			}
			let chronograph;
			if (raw.targetDuration) {
				chronograph = new Chronograph(raw.prefix, raw.name, raw.targetDuration, 'milliseconds');
			} else {
				chronograph = new Chronograph(raw.prefix, raw.name);
			}

			let splits = Homey.ManagerSettings.get('timer_splits') || [];
			splits.forEach(split => {
				let reversedSplit = chronograph.getTargetDuration() - Utils.calculateDuration(split.time, split.unit);
				chronograph.addSplit(reversedSplit, 'milliseconds', split);
			});

			splits = Homey.ManagerSettings.get('stopwatch_splits') || [];
			splits.forEach(split => chronograph.addSplit(split.time, split.unit, split));

			chronograph.adjust(duration, 'milliseconds', true);
			if (raw.running) {
				chronograph.start(true);
			}
		});
	}
}

module.exports = Application;
