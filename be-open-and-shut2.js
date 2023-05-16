import { BE, propDefaults, propInfo } from 'be-enhanced/BE.js';
import { XE } from 'xtal-element/XE.js';
import { register } from 'be-hive/register.js';
export class BeOpenAndShut extends BE {
    static get beConfig() {
        return {
            parse: true,
            primaryProp: 'onEventType'
        };
    }
    #propChangeCallback;
    async subscribeToProp(self) {
        const { enhancedElement, set, closestRef } = self;
        if (enhancedElement instanceof HTMLDialogElement) {
            this.#manageDialog(enhancedElement);
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
    #manageDialog(self) {
        self.addEventListener('click', e => {
            // if(e.currentTarget === e.target){
            //     self.close();
            // }
        });
    }
    closeDialogIf(self, e) {
        const { enhancedElement } = self;
        const rect = enhancedElement.getBoundingClientRect();
        const clickedInDialog = (rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width);
        if (!clickedInDialog) {
            enhancedElement.close();
        }
    }
    findClosest(self) {
        const { onClosest, enhancedElement } = self;
        const target = enhancedElement.closest(onClosest);
        if (target === null)
            throw `${onClosest} 404`;
        return {
            closestRef: new WeakRef(target)
        };
    }
    compareVals(self) {
        const { closestRef, set, toVal } = self;
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
    addOutsideListener(self) {
        const { when, is, set, toVal, outsideClosest, enhancedElement } = self;
        const target = globalThis[when];
        if (this.#outsideAbortController !== undefined) {
            this.#outsideAbortController.abort();
        }
        this.#outsideAbortController = new AbortController();
        target.addEventListener(is, (e) => {
            const outside = enhancedElement.closest(outsideClosest);
            const composedPath = e.composedPath();
            for (const trigger of composedPath) {
                if (!(trigger instanceof Element))
                    continue;
                if (outside?.contains(trigger))
                    return;
            }
            this.#outsideAbortController?.abort();
            if (self.closestRef === undefined)
                return;
            const ref = self.closestRef.deref();
            if (ref === undefined)
                return;
            ref[set] = toVal;
        }, {
            signal: this.#outsideAbortController.signal
        });
    }
    removeOutsideListener(self) {
        if (this.#outsideAbortController !== undefined) {
            this.#outsideAbortController.abort();
            this.#outsideAbortController = undefined;
        }
    }
    addLocalListener(self) {
        const { onEventType, enhancedElement } = self;
        return [{ resolved: true }, { compareVals: { on: onEventType, of: enhancedElement } }];
    }
    detach(detachedElement) {
        if (this.#outsideAbortController !== undefined) {
            this.#outsideAbortController.abort();
        }
    }
}
const tagName = 'be-open-and-shut';
const ifWantsToBe = 'open-and-shut';
const upgrade = '*';
const xe = new XE({
    config: {
        tagName,
        propDefaults: {
            ...propDefaults,
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
        propInfo: {
            ...propInfo
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
    superclass: BeOpenAndShut
});
register(ifWantsToBe, upgrade, tagName);
