
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }

    new Set();
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    new Map();

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const _boolean_attributes = [
        'allowfullscreen',
        'allowpaymentrequest',
        'async',
        'autofocus',
        'autoplay',
        'checked',
        'controls',
        'default',
        'defer',
        'disabled',
        'formnovalidate',
        'hidden',
        'inert',
        'ismap',
        'loop',
        'multiple',
        'muted',
        'nomodule',
        'novalidate',
        'open',
        'playsinline',
        'readonly',
        'required',
        'reversed',
        'selected'
    ];
    /**
     * List of HTML boolean attributes (e.g. `<input disabled>`).
     * Source: https://html.spec.whatwg.org/multipage/indices.html
     */
    new Set([..._boolean_attributes]);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.58.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Card.svelte generated by Svelte v3.58.0 */

    const file$4 = "src\\Card.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "card svelte-cs03zp");
    			toggle_class(div, "search", /*cardType*/ ctx[0] == "search");
    			toggle_class(div, "header", /*cardType*/ ctx[0] == "header");
    			toggle_class(div, "output", /*cardType*/ ctx[0] == "output");
    			toggle_class(div, "main", /*cardType*/ ctx[0] == "main");
    			add_location(div, file$4, 4, 0, 60);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*cardType*/ 1) {
    				toggle_class(div, "search", /*cardType*/ ctx[0] == "search");
    			}

    			if (!current || dirty & /*cardType*/ 1) {
    				toggle_class(div, "header", /*cardType*/ ctx[0] == "header");
    			}

    			if (!current || dirty & /*cardType*/ 1) {
    				toggle_class(div, "output", /*cardType*/ ctx[0] == "output");
    			}

    			if (!current || dirty & /*cardType*/ 1) {
    				toggle_class(div, "main", /*cardType*/ ctx[0] == "main");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Card', slots, ['default']);
    	let { cardType = "output" } = $$props;
    	const writable_props = ['cardType'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('cardType' in $$props) $$invalidate(0, cardType = $$props.cardType);
    		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ cardType });

    	$$self.$inject_state = $$props => {
    		if ('cardType' in $$props) $$invalidate(0, cardType = $$props.cardType);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cardType, $$scope, slots];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { cardType: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get cardType() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cardType(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Header.svelte generated by Svelte v3.58.0 */

    const file$3 = "src\\Header.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let img0;
    	let img0_src_value;
    	let t;
    	let img1;
    	let img1_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img0 = element("img");
    			t = space();
    			img1 = element("img");
    			if (!src_url_equal(img0.src, img0_src_value = "./img/clip.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Clip");
    			attr_dev(img0, "class", "clip svelte-ex3xr6");
    			add_location(img0, file$3, 1, 4, 11);
    			if (!src_url_equal(img1.src, img1_src_value = "./img/title.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Simple Dictionary Title");
    			attr_dev(img1, "class", "title svelte-ex3xr6");
    			add_location(img1, file$3, 2, 4, 67);
    			attr_dev(div, "class", "svelte-ex3xr6");
    			add_location(div, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img0);
    			append_dev(div, t);
    			append_dev(div, img1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\CardBodyComponents\Output.svelte generated by Svelte v3.58.0 */
    const file$2 = "src\\CardBodyComponents\\Output.svelte";
    const get_example_slot_changes = dirty => ({});
    const get_example_slot_context = ctx => ({});
    const get_meaning_slot_changes = dirty => ({});
    const get_meaning_slot_context = ctx => ({});
    const get_pos_slot_changes = dirty => ({});
    const get_pos_slot_context = ctx => ({});
    const get_phonetic_slot_changes = dirty => ({});
    const get_phonetic_slot_context = ctx => ({});
    const get_word_slot_changes = dirty => ({});
    const get_word_slot_context = ctx => ({});

    // (7:0) <Card {cardType}>
    function create_default_slot$2(ctx) {
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let p0;
    	let t3;
    	let t4;
    	let div2;
    	let p1;
    	let t6;
    	let t7;
    	let div3;
    	let p2;
    	let t9;
    	let current;
    	const word_slot_template = /*#slots*/ ctx[1].word;
    	const word_slot = create_slot(word_slot_template, ctx, /*$$scope*/ ctx[2], get_word_slot_context);
    	const phonetic_slot_template = /*#slots*/ ctx[1].phonetic;
    	const phonetic_slot = create_slot(phonetic_slot_template, ctx, /*$$scope*/ ctx[2], get_phonetic_slot_context);
    	const pos_slot_template = /*#slots*/ ctx[1].pos;
    	const pos_slot = create_slot(pos_slot_template, ctx, /*$$scope*/ ctx[2], get_pos_slot_context);
    	const meaning_slot_template = /*#slots*/ ctx[1].meaning;
    	const meaning_slot = create_slot(meaning_slot_template, ctx, /*$$scope*/ ctx[2], get_meaning_slot_context);
    	const example_slot_template = /*#slots*/ ctx[1].example;
    	const example_slot = create_slot(example_slot_template, ctx, /*$$scope*/ ctx[2], get_example_slot_context);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			if (word_slot) word_slot.c();
    			t0 = space();
    			div1 = element("div");
    			if (phonetic_slot) phonetic_slot.c();
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "|";
    			t3 = space();
    			if (pos_slot) pos_slot.c();
    			t4 = space();
    			div2 = element("div");
    			p1 = element("p");
    			p1.textContent = "Meaning";
    			t6 = space();
    			if (meaning_slot) meaning_slot.c();
    			t7 = space();
    			div3 = element("div");
    			p2 = element("p");
    			p2.textContent = "Example";
    			t9 = space();
    			if (example_slot) example_slot.c();
    			attr_dev(div0, "class", "word svelte-1yyuc8f");
    			add_location(div0, file$2, 7, 4, 118);
    			add_location(p0, file$2, 12, 8, 258);
    			attr_dev(div1, "class", "detail svelte-1yyuc8f");
    			add_location(div1, file$2, 10, 4, 189);
    			attr_dev(p1, "class", "meaning-example-header svelte-1yyuc8f");
    			add_location(p1, file$2, 16, 8, 349);
    			attr_dev(div2, "class", "meaning svelte-1yyuc8f");
    			add_location(div2, file$2, 15, 4, 318);
    			attr_dev(p2, "class", "meaning-example-header svelte-1yyuc8f");
    			add_location(p2, file$2, 20, 8, 481);
    			attr_dev(div3, "class", "example svelte-1yyuc8f");
    			add_location(div3, file$2, 19, 4, 450);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);

    			if (word_slot) {
    				word_slot.m(div0, null);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);

    			if (phonetic_slot) {
    				phonetic_slot.m(div1, null);
    			}

    			append_dev(div1, t1);
    			append_dev(div1, p0);
    			append_dev(div1, t3);

    			if (pos_slot) {
    				pos_slot.m(div1, null);
    			}

    			insert_dev(target, t4, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, p1);
    			append_dev(div2, t6);

    			if (meaning_slot) {
    				meaning_slot.m(div2, null);
    			}

    			insert_dev(target, t7, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, p2);
    			append_dev(div3, t9);

    			if (example_slot) {
    				example_slot.m(div3, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (word_slot) {
    				if (word_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						word_slot,
    						word_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(word_slot_template, /*$$scope*/ ctx[2], dirty, get_word_slot_changes),
    						get_word_slot_context
    					);
    				}
    			}

    			if (phonetic_slot) {
    				if (phonetic_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						phonetic_slot,
    						phonetic_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(phonetic_slot_template, /*$$scope*/ ctx[2], dirty, get_phonetic_slot_changes),
    						get_phonetic_slot_context
    					);
    				}
    			}

    			if (pos_slot) {
    				if (pos_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						pos_slot,
    						pos_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(pos_slot_template, /*$$scope*/ ctx[2], dirty, get_pos_slot_changes),
    						get_pos_slot_context
    					);
    				}
    			}

    			if (meaning_slot) {
    				if (meaning_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						meaning_slot,
    						meaning_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(meaning_slot_template, /*$$scope*/ ctx[2], dirty, get_meaning_slot_changes),
    						get_meaning_slot_context
    					);
    				}
    			}

    			if (example_slot) {
    				if (example_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						example_slot,
    						example_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(example_slot_template, /*$$scope*/ ctx[2], dirty, get_example_slot_changes),
    						get_example_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(word_slot, local);
    			transition_in(phonetic_slot, local);
    			transition_in(pos_slot, local);
    			transition_in(meaning_slot, local);
    			transition_in(example_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(word_slot, local);
    			transition_out(phonetic_slot, local);
    			transition_out(pos_slot, local);
    			transition_out(meaning_slot, local);
    			transition_out(example_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (word_slot) word_slot.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (phonetic_slot) phonetic_slot.d(detaching);
    			if (pos_slot) pos_slot.d(detaching);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div2);
    			if (meaning_slot) meaning_slot.d(detaching);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div3);
    			if (example_slot) example_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(7:0) <Card {cardType}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				cardType: /*cardType*/ ctx[0],
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Output', slots, ['word','phonetic','pos','meaning','example']);
    	let cardType = "output";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Output> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ Card, cardType });

    	$$self.$inject_state = $$props => {
    		if ('cardType' in $$props) $$invalidate(0, cardType = $$props.cardType);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cardType, slots, $$scope];
    }

    class Output extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Output",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\CardBodyComponents\Search.svelte generated by Svelte v3.58.0 */
    const file$1 = "src\\CardBodyComponents\\Search.svelte";

    // (16:0) <Card {cardType}>
    function create_default_slot$1(ctx) {
    	let input;
    	let t0;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "Submit";
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-l4ddlr");
    			add_location(input, file$1, 16, 4, 369);
    			attr_dev(button, "tabindex", "0");
    			attr_dev(button, "class", "svelte-l4ddlr");
    			add_location(button, file$1, 17, 4, 454);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*newWord*/ ctx[0]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    					listen_dev(input, "keyup", prevent_default(/*enterKey*/ ctx[3]), false, true, false, false),
    					listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*newWord*/ 1 && input.value !== /*newWord*/ ctx[0]) {
    				set_input_value(input, /*newWord*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(16:0) <Card {cardType}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				cardType: /*cardType*/ ctx[2],
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope, newWord*/ 65) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Search', slots, []);
    	const dispatcher = createEventDispatcher();
    	let newWord = "";
    	let cardType = "search";

    	const enterKey = e => {
    		if (e.keyCode == 13) {
    			dispatcher("getWord", newWord);
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Search> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		newWord = this.value;
    		$$invalidate(0, newWord);
    	}

    	const click_handler = () => dispatcher("getWord", newWord);

    	$$self.$capture_state = () => ({
    		Card,
    		createEventDispatcher,
    		dispatcher,
    		newWord,
    		cardType,
    		enterKey
    	});

    	$$self.$inject_state = $$props => {
    		if ('newWord' in $$props) $$invalidate(0, newWord = $$props.newWord);
    		if ('cardType' in $$props) $$invalidate(2, cardType = $$props.cardType);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [newWord, dispatcher, cardType, enterKey, input_input_handler, click_handler];
    }

    class Search extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Search",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.58.0 */
    const file = "src\\App.svelte";

    // (37:3) 
    function create_word_slot(ctx) {
    	let p;
    	let t_value = /*wordInfo*/ ctx[0].word + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "slot", "word");
    			add_location(p, file, 36, 3, 1047);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*wordInfo*/ 1 && t_value !== (t_value = /*wordInfo*/ ctx[0].word + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_word_slot.name,
    		type: "slot",
    		source: "(37:3) ",
    		ctx
    	});

    	return block;
    }

    // (38:3) 
    function create_phonetic_slot(ctx) {
    	let p;
    	let t_value = /*wordInfo*/ ctx[0].phonetic + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "slot", "phonetic");
    			add_location(p, file, 37, 3, 1085);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*wordInfo*/ 1 && t_value !== (t_value = /*wordInfo*/ ctx[0].phonetic + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_phonetic_slot.name,
    		type: "slot",
    		source: "(38:3) ",
    		ctx
    	});

    	return block;
    }

    // (39:3) 
    function create_pos_slot(ctx) {
    	let p;
    	let t_value = /*wordInfo*/ ctx[0].pos + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "slot", "pos");
    			add_location(p, file, 38, 3, 1131);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*wordInfo*/ 1 && t_value !== (t_value = /*wordInfo*/ ctx[0].pos + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pos_slot.name,
    		type: "slot",
    		source: "(39:3) ",
    		ctx
    	});

    	return block;
    }

    // (40:3) 
    function create_meaning_slot(ctx) {
    	let p;
    	let t_value = /*wordInfo*/ ctx[0].meaning + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "slot", "meaning");
    			add_location(p, file, 39, 3, 1167);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*wordInfo*/ 1 && t_value !== (t_value = /*wordInfo*/ ctx[0].meaning + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_meaning_slot.name,
    		type: "slot",
    		source: "(40:3) ",
    		ctx
    	});

    	return block;
    }

    // (41:3) 
    function create_example_slot(ctx) {
    	let p;
    	let t_value = /*wordInfo*/ ctx[0].example + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "slot", "example");
    			add_location(p, file, 40, 3, 1211);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*wordInfo*/ 1 && t_value !== (t_value = /*wordInfo*/ ctx[0].example + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_example_slot.name,
    		type: "slot",
    		source: "(41:3) ",
    		ctx
    	});

    	return block;
    }

    // (34:1) <Card {cardType}>
    function create_default_slot(ctx) {
    	let search;
    	let t;
    	let output;
    	let current;
    	search = new Search({ $$inline: true });
    	search.$on("getWord", /*getWord*/ ctx[2]);

    	output = new Output({
    			props: {
    				$$slots: {
    					example: [create_example_slot],
    					meaning: [create_meaning_slot],
    					pos: [create_pos_slot],
    					phonetic: [create_phonetic_slot],
    					word: [create_word_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(search.$$.fragment);
    			t = space();
    			create_component(output.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(search, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(output, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const output_changes = {};

    			if (dirty & /*$$scope, wordInfo*/ 9) {
    				output_changes.$$scope = { dirty, ctx };
    			}

    			output.$set(output_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(search.$$.fragment, local);
    			transition_in(output.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(search.$$.fragment, local);
    			transition_out(output.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(search, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(output, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(34:1) <Card {cardType}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let header;
    	let t;
    	let card;
    	let current;
    	header = new Header({ $$inline: true });

    	card = new Card({
    			props: {
    				cardType: /*cardType*/ ctx[1],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(header.$$.fragment);
    			t = space();
    			create_component(card.$$.fragment);
    			attr_dev(main, "class", "svelte-1smbn0");
    			add_location(main, file, 31, 0, 960);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t);
    			mount_component(card, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope, wordInfo*/ 9) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(card);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const dictAPI = "https://api.dictionaryapi.dev/api/v2/entries/en/";

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let cardType = "main";

    	let wordInfo = {
    		word: "Your Word",
    		phonetic: "Phonetic",
    		pos: "Part of Speech",
    		meaning: "Here you will see the meaning of the word.",
    		example: "Here, if present, you will see an example usage of the word."
    	};

    	const getWord = e => {
    		fetch(`${dictAPI}${e.detail}`).then(response => response.json()).then(data => {
    			$$invalidate(0, wordInfo.word = e.detail, wordInfo);
    			$$invalidate(0, wordInfo.phonetic = data[0].phonetics[0].text || "", wordInfo);
    			$$invalidate(0, wordInfo.pos = data[0].meanings[0].partOfSpeech || "", wordInfo);
    			$$invalidate(0, wordInfo.meaning = data[0].meanings[0].definitions[0].definition || "", wordInfo);
    			$$invalidate(0, wordInfo.example = data[0].meanings[0].definitions[0].example || "", wordInfo);
    		});
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Card,
    		Header,
    		Output,
    		Search,
    		cardType,
    		wordInfo,
    		dictAPI,
    		getWord
    	});

    	$$self.$inject_state = $$props => {
    		if ('cardType' in $$props) $$invalidate(1, cardType = $$props.cardType);
    		if ('wordInfo' in $$props) $$invalidate(0, wordInfo = $$props.wordInfo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [wordInfo, cardType, getWord];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
