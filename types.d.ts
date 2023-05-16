import { ActionOnEventConfigs } from "trans-render/froop/types";
import {IBE} from 'be-enhanced/types';

export interface EndUserProps extends IBE{
    set?: string,
    onClosest?: string,
    toVal?: any,
    when?: string,
    is?: string,
    outsideClosest?: string,
    onEventType?: string,
}

export interface AllProps extends EndUserProps{
    valsDoNotMatch: boolean;
    valsMatch: boolean;
    closestRef: WeakRef<Element> | undefined;
}

export type AP = AllProps;

export type PAP = Partial<AP>;

export type ProPAP = Promise<PAP>;

export type POA = [PAP | undefined, ActionOnEventConfigs<PAP, Actions>]


export interface Actions{
    subscribeToProp(self: this): Promise<void | POA | PAP>;
    closeDialogIf(self: this, e: Event): void;
    findClosest(self: this): PAP;
    compareVals(self: this): PAP;
    addOutsideListener(self: this): void;
    removeOutsideListener(self: this): void;
    addLocalListener(self: this): POA;
    //finale(proxy: Proxy, target:Element): Promise<void>; 
}

