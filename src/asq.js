define(function() {

	function asq(obj, methodName) {
		var q = [], fn, origFn;

		// setup the function to call for each request
		if (!methodName) {
			fn = obj;
		} else {
			fn = function() {
				// give the correct binding
				origFn.apply(obj, arguments);
			}
		}

		function processQueue() {
			// wrap a callback
			function wrapCallback(cb) {
				return function() {
					cb.apply(null, arguments);
					q.shift();
					takeNext();
				}
			}

			// gets the next item in the queue and sends it to the queued function
			function takeNext() {
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

			// initiate the queue
			takeNext();
		}

		function proxy() {
			var first = !q.length,
				args = [].slice.call(arguments);
			
			// add call to the queue
			q.push(args);

			if (first) {
				// there were no other items in the queue, process it
				processQueue();
			}
		};

		function restore() {
			// restore the original function to the object
			obj[methodName] = origFn;
			// remove reference to allow garbage collection
			origFn = null;

		}

		if (!methodName) {
			// no context passed, return the queued function
			return proxy;
		} else {
			// setup closure variables and attach the queued function to the object
			origFn = obj[methodName]
			proxy.restore = restore;
			obj[methodName] = proxy;
		}
	}

	return asq;

});