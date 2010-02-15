/**
 * @license 
 * form.validator @VERSION - HTML5 is here. Now use it.
 * 
 * Copyright (c) 2010 Tero Piirainen
 * http://flowplayer.org/tools/form/validator/
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * http://www.opensource.org/licenses
 * 
 * Since: Mar 2010
 * Date: @DATE 
 */
/*jslint evil: true */ 
(function($) {	

	$.tools = $.tools || {version: '@VERSION'};
		
	// globals
	var typeRe = /\[type=([a-z]+)\]/, 
		numRe = /^\d*$/,
		
		// http://net.tutsplus.com/tutorials/other/8-regular-expressions-you-should-know/
		emailRe = /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/i,
		urlRe = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i,
		v;
		 
	v = $.tools.validator = {
		
		conf: { 
			singleField: false, 			// validate all inputs at once
			allErrors: false, 			// show all error messages at once inside the container 
			speed: 'normal',				// message's fade-in speed
			
			message: '<div><span/></div>',
			position: 'top center',
			offset: [-10, 0], 
			relative: false,				// advanced position flag. rarely needed
			messageClass: 'error',		// error message element's class name
			errorClass: 'invalid',		// input field class name in case of validation error			
			
			lang: 'en',						// default language for error messages 
			effect: 'default',			// show/hide effect for error message. only 'default' is built-in
			
			// when to check for validity?
			events: {
				form:  'submit', 			// form events 				(VALID: click || keypress || mouseover)
				input: null,				// input field events 		(VALID: change || blur || keyup)
				error: 'keyup'				// :invalid input field 	(VALID: change || blur || keyup) 
			} 
		},
		
		/* set/add error message for specified matcher */
		setMessage: function(matcher, msg, lang) {			
			var key = matcher.key || matcher,
				 m = this.messages[key] || {};
				 
			m[lang || 'en'] = msg;			
			this.messages[key] = m;   
		},

		/* default error messages */
		messages: {
			"*": {en: "Invalid value"}		
		},
		
		/** 
		 * Adds a new validator 
		 */
		fn: function(matcher, msg, fn) {
			
			if ($.isFunction(msg)) { 
				fn = msg; 
			} else {
				v.setMessage(matcher, msg);		 
			}
				
			// check for "[type=xxx]" (not supported by jQuery)
			var test = typeRe(matcher);
			if (test) { matcher = isType(test[1]); }				
			fns.push([matcher, fn]);		 
		},

		/* Add new show/hide effect */
		addEffect: function(name, showFn, closeFn) {
			effects[name] = [showFn, closeFn];
		}  
	};
	
	/* calculate error message position relative to the input */  	
	function getPosition(trigger, el, conf) {	
		
		// get origin top/left position 
		var top = conf.relative ? trigger.position().top : trigger.offset().top, 
			 left = conf.relative ? trigger.position().left : trigger.offset().left,	 
			 pos = conf.position.split(/,?\s+/),
			 y = pos[0],
			 x = pos[1];

		top  -= el.outerHeight() - conf.offset[0];
		left += trigger.outerWidth() + conf.offset[1];
		
		// adjust Y		
		var height = el.outerHeight() + trigger.outerHeight();
		if (y == 'center') 	{ top += height / 2; }
		if (y == 'bottom') 	{ top += height; }
		
		// adjust X
		var width = el.outerWidth() + trigger.outerWidth();
		if (x == 'center') 	{ left -= width / 2; }
		if (x == 'left')   	{ left -= width; }	 
		
		return {top: top, left: left};
	}	
	
	
	var fns = [], effects = {
		
		'default' : [
			
			// show errors function
			function(errs, done) {
				
				var conf = this.getConf();
				
				// loop errors
				$.each(errs, function(i, err) {
						
					// add error class	
					var input = err.input;					
					input.addClass(conf.errorClass);
					
					// get handle to the error container
					var msg = input.data("msg.el"); 
					
					// create it if not present
					if (!msg) { 
						msg = $(conf.message).addClass(conf.messageClass).appendTo(document.body);
						input.data("msg.el", msg);
					}  
					
					// clear the container 
					msg.find("p").remove().css({visibility: 'hidden'});
					
					// populate messages
					$.each(err.messages, function() {                   
						msg.append("<p>" + this + "</p>");			
					});
					
					// make sure the width is sane (not the body's width)
					if (msg.outerWidth() == msg.parent().width()) {
						msg.add(msg.find("p")).css({display: 'inline'});		
					}
					
					// insert into correct position (relative to the field)
					var pos = getPosition(input, msg, conf); 
					 
					msg.css({ visibility: 'visible', position: 'absolute', top: pos.top, left: pos.left })
						.fadeIn(conf.speed);    
				
				});
						
				
			// hide errors function
			}, function(inputs, done) {
				var conf = this.getConf();				
				inputs.removeClass(conf.errorClass).each(function() {
					$(this).data("msg.el").css({visibility: 'hidden'});		
				});
			}
		]  
	};	
	
	
	/* [type=email] filter (or any other special type) simply does not work with jQuery. damn.  */
	function isType(type) { 
		function fn() {
			return this.getAttribute("type") == type;  	
		} 
		fn.key = "[type=" + type + "]";
		return fn;
	}
	
	
	/******* built-in HTML5 standard validators *********/
	
	v.fn(isType("email"), "Invalid email address", function(el, v) {
		return !v || emailRe.test(v);
	});
	
	v.fn(isType("url"), "Invalid URL", function(el, v) {
		return !v || urlRe.test(v);
	});
	
	v.fn(isType("number"), "Please supply a numeric value.", function(el, v) {
		return numRe.test(v);			
	});
	
	v.fn("[max]", "Maximum value is $1", function(el, v) {
		var max = el.attr("max");
		return parseFloat(v) <= parseFloat(max) ? true : max;
	});
	
	v.fn("[min]", "Minimum value is $1", function(el, v) {
		var min = el.attr("min");
		return parseFloat(v) >= parseFloat(min) ? true : min;
	});
	
	v.fn("[required]", "Please complete this mandatory field.", function(el, v) {
		return !!v; 			
	});
	
	v.fn("[pattern]", function(el) {
		var p = new RegExp(el.attr("pattern"));  
		return p.test(el.val()); 			
	});

	
	/******* built-in custom validators *********/
	v.fn("[data-equals]", "Value must equal to $1 field", function(el, v) {
		var name = el.attr("data-equals"),
			 f = this.getInputs().filter("[name=" + name + "]");
			 
		return f.val() === v ? true : f.attr("title") || name; 
	});

	v.fn("[data-requires]", "Required fields: $1", function(el, v) {
		
		var names = el.attr("data-requires").split(/,\s*/);
			 inputs = this.getInputs(), 
			 ret = [];
		
		$.each(names, function(i, name) {
			if (!inputs.filter("[name=" + name + "]").val()) { 
				ret.push(name); 
			}		
		}); 
		return ret.length ? ret.join(", ") : true; 
	});	

	
	function Validator(form, conf) {		
		
		// private variables
		var self = this, 
			 fire = form.add(this),
			 inputs = form.find(":input").not(":button, :submit") ;
			 
		if (!inputs.length) { throw "Validator: no input fields supplied"; }		

		
		// utility function
		function pushMessage(to, matcher, subs) {
			
			var key = matcher.key || matcher,
				 msg = v.messages[key] || v.messages["*"];
			
			if (conf.allErrors || !to.length) {
				
				// localization
				msg = msg[conf.lang];
								
				// substitution
				if (typeof subs == 'string') { subs = [subs]; }
				var matches = msg.match(/\$\d/g);
				
				if (matches) {
					$.each(matches, function(i) {
						msg = msg.replace(this, subs[i]);
					});
				} 
				to.push(msg);
			}
		}
		
		// API methods  
		$.extend(self, {

			getConf: function() {
				return conf;	
			},
			
			getInputs: function() {
				return inputs;	
			},		
			
//{{{  checkValidity() - flesh and bone of this tool
						
			/* @returns boolean */
			checkValidity: function(els, e) {
				
				els = els || inputs;    
				els = els.not(":hidden, :disabled, [readonly]");
				if (!els.length) { return true; }

				e = e || $.Event();

				// onBeforeValidate
				e.type = "onBeforeValidate";
				fire.trigger(e, [els]);				
				if (e.isDefaultPrevented()) { return e.result; }				
					
				var errs = [], 
					 event = conf.events.error + ".v";
				
				// loop trough the inputs
				els.each(function() {
						
					// field and it's error message container						
					var msgs = [], 
						 el = $(this).unbind(event).data("messages", msgs);					
					
					// loop all validator functions
					$.each(fns, function() {
						var fn = this, match = fn[0]; 
					
						// match found
						if (el.filter(match).length)  {  
							
							// execute a validator function
							var ret = fn[1].call(self, el, el.val());
							
							// validation failed. multiple substitutions can be returned with an array
							if (ret !== true) {								
								
								// onBeforeFail
								e.type = "onBeforeFail";
								fire.trigger(e, [el, match]);
								if (e.isDefaultPrevented()) { return false; }
								
								pushMessage(msgs, match, ret);	
							}							
						}
					});
					
					if (msgs.length) { 
						
						errs.push({input: el, messages: msgs});  
						
						// trigger HTML5 ininvalid event
						el.trigger("oninvalid", [msgs]);
						
						// begin validating upon error event type (such as keyup) 
						if (conf.events.error) {
							el.bind(event, function() {
								self.checkValidity(el);		
							});							
						} 					
					}
					
					if (conf.singleField && errs.length) { return false; }
					
				});
				
				
				// validation done. now check that we have a proper effect at hand
				var eff = effects[conf.effect];
				if (!eff) { throw "Validator: cannot find effect \"" + conf.effect + "\""; }
				
				// errors found
				if (errs.length) {					
					
					// onFail callback
					e.type = "onFail";					
					fire.trigger(e, [errs]); 
					
					// call the effect
					if (!e.isDefaultPrevented()) {						
						eff[0].call(self, errs);													
					}  
					
					return false;
					
				// no errors
				} else {		
					
					// call the effect
					eff[1].call(self, els);
					
					// onSuccess callback
					e.type = "onSuccess";					
					fire.trigger(e);
					
					els.unbind(event);
				}
				
				return true;				
			}
//}}} 
			
		});
		
		// callbacks	
		$.each("onBeforeValidate,onBeforeFail,onFail,onSuccess".split(","), function(i, name) {
				
			// configuration
			if ($.isFunction(conf[name]))  {
				$(self).bind(name, conf[name]);	
			}
			
			// API methods				
			self[name] = function(fn) {
				$(self).bind(name, fn);
				return self;
			};
		});	
		
		// form validation
		form.bind(conf.events.form, function(e) {
			if (!self.checkValidity()) { 
				return e.preventDefault(); 
			}
		});
		
		// Web Forms 2.0 compatibility
		form[0].checkValidity = self.checkValidity;
		
		// input validation
		if (conf.events.input) {
			inputs.bind(conf.events.input, function(e) {
				self.checkValidity($(this));
			});	
		}
		
		// oninvalid attribute. yea, yea. eval is evil. what can I do?
		inputs.filter("[oninvalid]").each(function() {
			$(this).oninvalid(new Function($(this).attr("oninvalid")));
		});
		
	}

	// $("input:eq(2)").oninvalid(function() { ... });
	$.fn.oninvalid = function( fn ){
		return this[fn ? "bind" : "trigger"]("oninvalid", fn);
	};

	
	// jQuery plugin initialization
	$.fn.validator = function(conf) {   
		
		// return existing instance
		var el = this.data("validator");
		if (el) { return el; } 
		
		// configuration
		conf = $.extend(true, {}, v.conf, conf);		
		
		// selector is a form		
		return this.each(function() {			
			el = new Validator($(this), conf);				
			$(this).data("validator", el);
		}); 
		
	};   
		
})(jQuery);
			
