import {MinimalProxy, EventConfigs} from 'be-decorated/types';

export interface EndUserProps {
    set?: string,
    onClosest?: string,
    toVal?: any,
    when?: string,
    is?: string,
    outsideClosest?: string,
    onEventType?: string,
}

export interface VirtualProps extends EndUserProps, MinimalProxy{
    valsDoNotMatch: boolean;
    valsMatch: boolean;
    //propChangeCnt: number;
    closestRef: WeakRef<Element> | undefined;
}

export type Proxy = Element & VirtualProps;

export interface ProxyProps extends VirtualProps{
    proxy: Proxy;
}

export type PP = ProxyProps;

export type PPP = Partial<PP>;

export type PPE = [PPP, EventConfigs<Proxy, Actions>];

export interface Actions{
    subscribeToProp(pp: PP): Promise<void | PPE | PPP>;
    closeDialogIf(pp: PP, e: Event): void;
    findClosest(pp: PP): Partial<PP>;
    compareVals(pp: PP): PPP;
    addOutsideListener(pp: PP): void;
    removeOutsideListener(pp: PP): void;
    addLocalListener(pp: PP): PPE;
    finale(proxy: Proxy, target:Element): Promise<void>; 
}

