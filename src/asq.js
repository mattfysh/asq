define(function() {

	function asq(obj, methodName) {
		var q = [], fn, origFn;

		// wrap a callback
		function wrapCallback(cb) {
			return function() {
				cb.apply(null, arguments);
				q.shift();
				processNext();
			}
		}

		// gets the next item in the queue and sends it to the queued function
		function processNext() {
			var next = q[0];

			if (next) {
				// find and replace any function, assumed to be a callback
				for (var i = 0; i < next.length; i += 1) {
					if (typeof next[i] === 'function') {
						next[i] = wrapCallback(next[i]);
					}
				}

				// apply to original function
				fn.apply(null, next);
			}
		}

		// collect calls to the queued function
		function proxy() {
			var first = !q.length,
				args = [].slice.call(arguments);
			
			// add call to the queue
			q.push(args);

			if (first) {
				// there were no other items in the queue, process it
				processNext();
			}
		};

		// allow the original function to be restored to the object, unqueued
		function restore() {
			// restore the original function to the object
			obj[methodName] = origFn;
			// remove reference to allow garbage collection
			origFn = null;

		}

		// add a queue to the function
		if (!methodName) {
			// store reference to function
			fn = obj;
			// no context passed, return the queued function
			return proxy;
		} else {
			// wrap function in closure to give it the correct binding
			origFn = obj[methodName]
			fn = function() {
				// give the correct binding
				origFn.apply(obj, arguments);
			}
			// attach the queued function to the object
			proxy.restore = restore;
			obj[methodName] = proxy;
		}
	}

	return asq;

});