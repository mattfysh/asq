describe('asq', function() {

	var asq, callback, clock;

	beforeEach(function() {
		clock = sinon.useFakeTimers();
		asq = testr('asq');
		callback = sinon.spy();
	});

	afterEach(function() {
		clock.restore();
	});

	it('is defined as a function', function() {
		expect(asq).toBeDefined();
		expect(typeof asq).toBe('function');
	});

	describe('no context', function() {

		var asqFn, asyncFn;

		beforeEach(function() {
			asyncFn = sinon.spy(function(cb) {
				setTimeout(function() {
					cb('result');
				}, 2000);
			});
			asqFn = asq(asyncFn);
		});

		it('returns a function', function() {
			expect(asqFn).toBeDefined();
			expect(asqFn).not.toBe(asyncFn);
		});

		it('executes original function when queued fn is called', function() {
			asqFn(callback);
			expect(asyncFn.called).toBe(true);
			expect(callback.called).toBe(false);
			clock.tick(2000);
			expect(callback.called).toBe(true);
		});

		it('does not execute original function, until previous call is complete', function() {
			asqFn(callback);
			asqFn(callback);
			asqFn(callback);
			expect(callback.callCount).toBe(0);
			clock.tick(2000);
			expect(callback.callCount).toBe(1);
			clock.tick(2000);
			expect(callback.callCount).toBe(2);
			clock.tick(2000);
			expect(callback.callCount).toBe(3);
		});

		it('passes result to callback given', function() {
			asqFn(callback);
			clock.tick(2000);
			expect(callback.args[0][0]).toBe('result');
		});

	});

	describe('method with context', function() {

		var asqFn, contextFn, obj;

		beforeEach(function() {
			obj = {
				val: 2,
				contextFn: function(cb) {
					var val = this.val;
					setTimeout(function() {
						cb(val);
					}, 2000);
				}
			};
			contextFn = sinon.spy(obj, 'contextFn');
			asqFn = asq(obj, 'contextFn');
		});

		it('doesnt return function', function() {
			expect(asqFn).toBeUndefined();
		});

		it('keeps correct this value', function() {
			obj.contextFn(callback);
			expect(callback.called).toBe(false);
			clock.tick(2000);
			expect(callback.called).toBe(true);
			expect(callback.args[0][0]).toBe(2);
		});

		it('queues calls', function() {
			obj.contextFn(callback);
			obj.contextFn(callback);
			expect(callback.callCount).toBe(0);
			clock.tick(2000);
			expect(callback.callCount).toBe(1);
			clock.tick(2000);
			expect(callback.callCount).toBe(2);
		})

		it('offers a restore', function() {
			obj.contextFn.restore();
			obj.contextFn(callback);
			obj.contextFn(callback);
			expect(contextFn.callCount).toBe(2);
			clock.tick(2000);
			expect(callback.callCount).toBe(2);
		})

	});

	describe('signature search', function() {

		var asqFn, complexSig, errCallback;

		beforeEach(function() {
			complexSig = sinon.spy(function(val, cb, err) {
				if (val === 2) {
					cb(val);
				} else {
					err(val);
				}
			});
			asqFn = asq(complexSig);
			errCallback = sinon.spy();
		});

		it('finds callback in arguments', function() {
			asqFn(1, callback, errCallback);
			expect(errCallback.called).toBe(true);
			expect(errCallback.args[0][0]).toBe(1);
		});

		it('routes to the correct callback', function() {
			asqFn(2, callback, errCallback);
			expect(errCallback.called).toBe(false);
		});

	});

});