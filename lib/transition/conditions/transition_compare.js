const Homey = require('homey');
const Chronograph = require('../../chronograph.js');
const { Utils, ChronographType } = require('../../utils.js');

class TransitionCompare extends Homey.FlowCardCondition {
	constructor(conditionId) {
		super(conditionId);

		this.register();
		this.registerRunListener(args => {
			let time = parseFloat(args.time);
			if (isNaN(time)) {
				return Promise.reject(new Error(Homey.__("invalid_duration")));
			}

			let id = Utils.generateId(ChronographType.TRANSITION, args.name);
			let transition = Chronograph.get(id);
			if (!!transition) {
				return Promise.resolve(transition.getDuration() > Utils.calculateDuration(time, args.unit));
			}

			return Promise.reject(new Error(Homey.__("transition_not_running", { "name": args.name })));
		});
	}
}

module.exports = TransitionCompare;
