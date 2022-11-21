import { define } from 'be-decorated/DE.js';
import { register } from 'be-hive/register.js';
export class BeOpenAndShut extends EventTarget {
    #propChangeCallback;
    async subscribeToProp({ self, set, closestRef, proxy }) {
        if (self instanceof HTMLDialogElement) {
            this.#manageDialog(self);
            return [{ resolved: true }, { 'closeDialogIf': { on: 'click', of: self } }];
        }
        const ref = closestRef.deref();
        if (ref === undefined)
            return {
                closestRef: undefined,
            };
        const { isDefined } = await import('trans-render/lib/isDefined.js');
        await isDefined(ref);
        const propagator = ref.constructor.ceDef?.services?.propper?.stores?.get(ref);
        if (propagator !== undefined) {
            this.#propChangeCallback = propagator;
        }
        else {
            this.#propChangeCallback = new EventTarget();
            const { subscribe } = await import('trans-render/lib/subscribe2.js');
            subscribe(ref, set, this.#propChangeCallback);
        }
        return [{ resolved: true }, { compareVals: { on: set, of: this.#propChangeCallback } }];
    }
    closeDialogIf({ self }, e) {
        const rect = self.getBoundingClientRect();
        const clickedInDialog = (rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width);
        if (!clickedInDialog) {
            self.close();
        }
    }
    #manageDialog(self) {
        self.addEventListener('click', e => {
            // if(e.currentTarget === e.target){
            //     self.close();
            // }
        });
    }
    findClosest({ onClosest, self }) {
        const target = self.closest(onClosest);
        if (target === null)
            throw `${onClosest} 404`;
        return {
            closestRef: new WeakRef(target)
        };
    }
    compareVals({ closestRef, set, toVal }) {
        const ref = closestRef.deref();
        if (ref === undefined)
            return {
                closestRef: undefined,
            };
        const actualVal = ref[set];
        const valsDoNotMatch = actualVal !== toVal;
        const valsMatch = !valsDoNotMatch;
        return {
            valsMatch,
            valsDoNotMatch,
        };
    }
    //This seems to be too complicated to utilize the FROOP Orchestration / avoid side effects because:
    //1.  We need to turn off the listener only under certain conditions, so can't use "once"
    #outsideAbortController;
    addOutsideListener({ when, is, set, toVal, outsideClosest, self, proxy }) {
        const target = globalThis[when];
        if (this.#outsideAbortController !== undefined) {
            this.#outsideAbortController.abort();
        }
        this.#outsideAbortController = new AbortController();
        target.addEventListener(is, (e) => {
            const outside = self.closest(outsideClosest);
            const composedPath = e.composedPath();
            for (const trigger of composedPath) {
                if (!(trigger instanceof Element))
                    continue;
                if (outside?.contains(trigger))
                    return;
            }
            this.#outsideAbortController?.abort();
            if (proxy.closestRef === undefined)
                return;
            const ref = proxy.closestRef.deref();
            if (ref === undefined)
                return;
            ref[set] = toVal;
        }, {
            signal: this.#outsideAbortController.signal
        });
    }
    removeOutsideListener({}) {
        if (this.#outsideAbortController !== undefined) {
            this.#outsideAbortController.abort();
            this.#outsideAbortController = undefined;
        }
    }
    addLocalListener({ onEventType, self, proxy }) {
        return [{ resolved: true }, { compareVals: { on: onEventType, of: self } }];
    }
    async finale(proxy, target) {
        if (this.#outsideAbortController !== undefined) {
            this.#outsideAbortController.abort();
        }
    }
}
const tagName = 'be-open-and-shut';
const ifWantsToBe = 'open-and-shut';
const upgrade = '*';
define({
    config: {
        tagName,
        propDefaults: {
            upgrade,
            ifWantsToBe,
            virtualProps: [
                'set', 'onClosest', 'toVal', 'when', 'is',
                'outsideClosest', 'valsDoNotMatch', 'valsMatch', 'closestRef'
            ],
            forceVisible: ['dialog'],
            proxyPropDefaults: {
                set: 'open',
                onClosest: '*',
                toVal: false,
                when: 'document',
                is: 'click',
                outsideClosest: '*',
                valsDoNotMatch: false,
                valsMatch: true,
                onEventType: '',
            },
            primaryProp: 'onEventType'
        },
        actions: {
            findClosest: {
                ifAllOf: ['onClosest'],
                ifNoneOf: ['closestRef'],
            },
            subscribeToProp: {
                ifAllOf: ['set', 'closestRef',],
                ifNoneOf: ['onEventType']
            },
            compareVals: {
                ifAllOf: ['closestRef', 'set']
            },
            addOutsideListener: {
                ifAllOf: ['closestRef', 'set', 'when', 'valsDoNotMatch', 'outsideClosest']
            },
            removeOutsideListener: {
                ifAllOf: ['valsMatch'],
            },
            addLocalListener: 'onEventType'
        }
    },
    complexPropDefaults: {
        controller: BeOpenAndShut
    }
});
register(ifWantsToBe, upgrade, tagName);
