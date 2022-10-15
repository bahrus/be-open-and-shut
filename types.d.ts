import {MinimalProxy} from 'be-decorated/types';

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
    propChangeCnt: number;
    closestRef: WeakRef<Element> | undefined;
}

export type Proxy = Element & VirtualProps;

export interface ProxyProps extends VirtualProps{
    proxy: Proxy;
}

export type PP = ProxyProps;



export interface Actions{
    subscribeToProp(pp: PP): Promise<void>;
    findContainer(pp: PP): Partial<PP>;
    compareVals(pp: PP): void;
    addOutsideListener(pp: PP): void;
    removeOutsideListener(pp: PP): void;
    addLocalListener(pp: PP): void;
    finale(proxy: Proxy, target:Element): Promise<void>; 
}

