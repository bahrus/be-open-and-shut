import {define, BeDecoratedProps, BeDecoratedCore} from 'be-decorated/be-decorated.js';
import {register} from 'be-hive/register.js';
import {Actions, PP, Proxy, VirtualProps} from './types';

export class BeOpenAndShut extends EventTarget implements Actions{
    closestRef: WeakRef<Element> | undefined;
    async subscribeToProp({self, set, onClosest, proxy}: PP): Promise<void> {
        const target = self.closest(onClosest!);
        if(target === null) throw `${onClosest} 404`;
        proxy.closestRef = new WeakRef(target);
        const {subscribe} = await import('trans-render/lib/subscribe.js');
        await subscribe(target, set!, () => {
            proxy.propChangeCnt++;
        });
        proxy.propChangeCnt++;
        proxy.resolved = true;
    }

    compareVals({closestRef, set, toVal}: PP){
        const ref = closestRef!.deref();
        if(ref === undefined) return;
        const actualVal = (<any>ref)[set!];
        const valsDoNotMatch = actualVal !== toVal;
        const valsMatch = !valsDoNotMatch;
        return {
            valsDoNotMatch,
            valsMatch,
        }
    }

    #outsideAbortController: AbortController | undefined;
    addOutsideListener({when, is, set, toVal, outsideClosest, self}: PP): void {
        const target = (<any>globalThis)[when!] as EventTarget;
        if(this.#outsideAbortController !== undefined){
            this.#outsideAbortController.abort();
        }
        this.#outsideAbortController = new AbortController();
        target.addEventListener(is!, (e) => {
            
            
            const outside = self!.closest(outsideClosest!);
            if(outside?.contains(e.target as Element)) return;
            if(this.closestRef === undefined) return;
            const ref = this.closestRef.deref();
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

    async finale(proxy: Element & VirtualProps, target: Element) {
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

define<VirtualProps & BeDecoratedProps<VirtualProps, Actions>, Actions>({
    config:{
        tagName,
        propDefaults:{
            upgrade,
            ifWantsToBe,
            virtualProps: [
                'set', 'onClosest', 'toVal', 'when', 'is', 
                'outsideClosest', 'valsDoNotMatch', 'valsMatch', 
                'propChangeCnt', 'closestRef', 'onEventType',
            ],
            proxyPropDefaults: {
                set: 'open',
                onClosest: '*',
                toVal: false,
                when: 'document',
                is: 'click',
                outsideClosest: '*',
                valsDoNotMatch: true,
                valsMatch: false,
                propChangeCnt: 0,
                onEventType: ''
            },
            primaryProp: 'onEventType'
        },
        actions:{
            subscribeToProp: {
                ifAllOf: ['set', 'onClosest']
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