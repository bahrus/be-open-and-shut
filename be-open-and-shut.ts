import {define, BeDecoratedProps} from 'be-decorated/DE.js';
import {register} from 'be-hive/register.js';
import {Actions, PP, Proxy, PPE, PPP} from './types';

export class BeOpenAndShut extends EventTarget implements Actions{

    #propChangeCallback : EventTarget | undefined;
    async subscribeToProp({self, set, closestRef, proxy}: PP) {
        const ref = closestRef!.deref();
        if(ref === undefined) return {
            closestRef: undefined,
        } as PPP;
        this.#propChangeCallback = new EventTarget();
        const {subscribe} = await import('trans-render/lib/subscribe2.js'); 
        subscribe(ref, set!, this.#propChangeCallback);
        return [{resolved: true}, {compareVals: {on: set!, of: this.#propChangeCallback}}] as PPE;
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

    #localAbortController: AbortController | undefined;
    addLocalListener({onEventType, self, proxy}: PP): void {
        if(this.#localAbortController !== undefined){
            this.#localAbortController.abort();
        }
        this.#localAbortController = new AbortController();
        self.addEventListener(onEventType!, e => {
            proxy.propChangeCnt++;
        }, {
            signal: this.#localAbortController.signal,
        })
    }

    async finale(proxy: Proxy, target: Element) {
        const {unsubscribe} = await import('trans-render/lib/subscribe.js');
        unsubscribe(target);
        if(this.#localAbortController !== undefined){
            this.#localAbortController.abort();
        }
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
                'outsideClosest', 'valsDoNotMatch', 'valsMatch', 'propChangeCnt', 'closestRef'
            ],
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
                propChangeCnt: 0,
            },
            primaryProp: 'onEventType'
        },
        actions:{
            findClosest: {
                ifAllOf: ['onClosest'],
                ifNoneOf: ['closestRef'],
            },
            subscribeToProp: {
                ifAllOf: ['set', 'closestRef', 'propChangeCnt'],
                ifNoneOf: ['onEventType']
            },
            compareVals: {
                ifAllOf: ['propChangeCnt', 'closestRef', 'set']
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