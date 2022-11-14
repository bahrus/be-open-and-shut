import {define, BeDecoratedProps} from 'be-decorated/DE.js';
import {register} from 'be-hive/register.js';
import {Actions, PP, Proxy, PPE, PPP, ProxyProps} from './types';

export class BeOpenAndShut extends EventTarget implements Actions{

    #propChangeCallback : EventTarget | undefined;
    async subscribeToProp({self, set, closestRef, proxy}: PP) {
        if(self instanceof HTMLDialogElement){
            this.#manageDialog(self);
            return [{resolved: true}, {'closeDialogIf': {on: 'click', of: self}}] as PPE;;
        }
        const ref = closestRef!.deref();
        if(ref === undefined) return {
            closestRef: undefined,
        } as PPP;
        this.#propChangeCallback = new EventTarget();
        const {subscribe} = await import('trans-render/lib/subscribe2.js'); 
        subscribe(ref, set!, this.#propChangeCallback);
        return [{resolved: true}, {compareVals: {on: set!, of: this.#propChangeCallback}}] as PPE;
    }

    closeDialogIf({self}: PP, e: MouseEvent){
        const rect = self.getBoundingClientRect();

        const clickedInDialog = (
            rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width
        );

        if (!clickedInDialog ){
            (self as HTMLDialogElement).close();
        }
    }

    #manageDialog(self: HTMLDialogElement){
        self.addEventListener('click', e => {
            // if(e.currentTarget === e.target){
            //     self.close();
            // }
            
        });
    }

    findClosest({onClosest, self}: PP): Partial<PP> {
        const target = self.closest(onClosest!);
        if(target === null) throw `${onClosest} 404`;
        return {
            closestRef: new WeakRef(target)
        }
    }

    compareVals({closestRef, set, toVal}: PP){
        const ref = closestRef!.deref();
        if(ref === undefined) return {
            closestRef: undefined,
        };
        const actualVal = (<any>ref)[set!];
        const valsDoNotMatch = actualVal !== toVal;
        const valsMatch = !valsDoNotMatch;
        return {
            valsMatch,
            valsDoNotMatch,
        }
    }

    //This seems to be too complicated to utilize the FROOP Orchestration / avoid side effects because:
    //1.  We need to turn off the listener only under certain conditions, so can't use "once"
    #outsideAbortController: AbortController | undefined;
    addOutsideListener({when, is, set, toVal, outsideClosest, self, proxy}: PP): void {
        const target = (<any>globalThis)[when!] as EventTarget;
        if(this.#outsideAbortController !== undefined){
            this.#outsideAbortController.abort();
        }
        this.#outsideAbortController = new AbortController();
        target.addEventListener(is!, (e) => {
            
            
            const outside = self!.closest(outsideClosest!);
            if(outside?.contains(e.target as Element)) return;
            this.#outsideAbortController?.abort();
            if(proxy.closestRef === undefined) return;
            const ref = proxy.closestRef.deref();
            if(ref === undefined) return;
            (<any>ref)[set!] = toVal;
        }, {
            signal: this.#outsideAbortController.signal
        });
    }


    removeOutsideListener({}: PP){
        if(this.#outsideAbortController !== undefined){
            this.#outsideAbortController.abort();
            this.#outsideAbortController = undefined;
        }
    }

    addLocalListener({onEventType, self, proxy}: PP): PPE {
        return [{resolved: true}, {compareVals: {on: onEventType, of: self}}] as PPE;
    }

    async finale(proxy: Proxy, target: Element) {
        if(this.#outsideAbortController !== undefined){
            this.#outsideAbortController.abort();
        }
    }

}


const tagName = 'be-open-and-shut';
const ifWantsToBe = 'open-and-shut';
const upgrade = '*';

define<Proxy & BeDecoratedProps<Proxy, Actions>, Actions>({
    config:{
        tagName,
        propDefaults:{
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
        actions:{
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
    complexPropDefaults:{
        controller: BeOpenAndShut
    }
});

register(ifWantsToBe, upgrade, tagName);