import {BE, propDefaults, propInfo} from 'be-enhanced/BE.js';
import {BEConfig} from 'be-enhanced/types';
import {XE} from 'xtal-element/XE.js';
import {Actions, AllProps, AP, PAP, ProPAP, POA} from './types';
import {register} from 'be-hive/register.js';

export class BeOpenAndShut extends BE<AP, Actions> implements Actions{

    static  override get beConfig(){
        return {
            parse: true,
            primaryProp: 'onEventType'
        } as BEConfig
    }

    #propChangeCallback : EventTarget | undefined;
    async subscribeToProp(self: this): Promise<void | POA | PAP> {
        const {enhancedElement, set, closestRef} = self;
        if(enhancedElement instanceof HTMLDialogElement){
            this.#manageDialog(enhancedElement);
            return [{resolved: true}, {'closeDialogIf': {on: 'click', of: self}}] as POA;
        }
        const ref = closestRef!.deref();
        if(ref === undefined) return {
            closestRef: undefined,
        } as PAP;
        const {isDefined} = await import('trans-render/lib/isDefined.js');
        await isDefined(ref);
        const propagator = (ref.constructor as any).ceDef?.services?.propper?.stores?.get(ref);
        if(propagator !== undefined){
            this.#propChangeCallback = propagator as EventTarget;
        }else{
            this.#propChangeCallback = new EventTarget();
            const {subscribe} = await import('trans-render/lib/subscribe2.js'); 
            subscribe(ref, set!, this.#propChangeCallback);
        }
        return [{resolved: true}, {compareVals: {on: set!, of: this.#propChangeCallback}}] as PPE;
    }

    #manageDialog(self: HTMLDialogElement){
        self.addEventListener('click', e => {
            // if(e.currentTarget === e.target){
            //     self.close();
            // }
            
        });
    }

    closeDialogIf(self: this, e: MouseEvent): void {
        const {enhancedElement} = self;
        const rect = enhancedElement.getBoundingClientRect();

        const clickedInDialog = (
            rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width
        );

        if (!clickedInDialog ){
            (enhancedElement as HTMLDialogElement).close();
        }
    }

    findClosest(self: this): Partial<AllProps> {
        const {onClosest, enhancedElement} = self;
        const target = enhancedElement.closest(onClosest!);
        if(target === null) throw `${onClosest} 404`;
        return {
            closestRef: new WeakRef(target)
        }
    }

    compareVals(self: this): Partial<AllProps> {
        const {closestRef, set, toVal} = self;
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
    addOutsideListener(self: this): void {
        const {when, is, set, toVal, outsideClosest, enhancedElement} = self;
        const target = (<any>globalThis)[when!] as EventTarget;
        if(this.#outsideAbortController !== undefined){
            this.#outsideAbortController.abort();
        }
        this.#outsideAbortController = new AbortController();
        target.addEventListener(is!, (e) => {
            const outside = enhancedElement!.closest(outsideClosest!);
            const composedPath = e.composedPath();
            for(const trigger of composedPath){
                if(!(trigger instanceof Element)) continue;
                if(outside?.contains(trigger)) return;
            }
            
            this.#outsideAbortController?.abort();
            if(self.closestRef === undefined) return;
            const ref = self.closestRef.deref();
            if(ref === undefined) return;
            (<any>ref)[set!] = toVal;
        }, {
            signal: this.#outsideAbortController.signal
        });
    }

    removeOutsideListener(self: this): void {
        if(this.#outsideAbortController !== undefined){
            this.#outsideAbortController.abort();
            this.#outsideAbortController = undefined;
        }
    }

    addLocalListener(self: this): POA {
        const {onEventType, enhancedElement} = self;
        return [{resolved: true}, {compareVals: {on: onEventType, of: enhancedElement}}] as POA;
    }

    override detach(detachedElement: Element): void {
        if(this.#outsideAbortController !== undefined){
            this.#outsideAbortController.abort();
        }
    }
}

export interface BeOpenAndShut extends AllProps{}

const tagName = 'be-open-and-shut';
const ifWantsToBe = 'open-and-shut';
const upgrade = '*';

const xe = new XE<AP, Actions>({
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
        propInfo:{
            ...propInfo
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
    superclass: BeOpenAndShut
});

register(ifWantsToBe, upgrade, tagName);