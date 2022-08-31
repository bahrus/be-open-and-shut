import {MinimalProxy} from 'be-decorated/types';

export interface BeOpenAndShutEndUserProps {
    set: string,
    onClosest: string,
    toVal: any,
    when: string,
    is: string,
    outsideClosest: string,
    onEventType: string
}

export interface BeOpenAndShutVirtualProps extends BeOpenAndShutEndUserProps, MinimalProxy{
    valsDoNotMatch: boolean;
    valsMatch: boolean;
    propChangeCnt: number;
    closestRef: WeakRef<Element> | undefined;
}

export interface BeSidelinedProps extends BeOpenAndShutVirtualProps{
    proxy: Element & BeOpenAndShutVirtualProps
}

export interface BeOpenAndShutActions{
    subscribeToProp(self: this): Promise<void>;
    compareVals(self: this): void;
    addOutsideListener(self: this): void;
    removeOutsideListener(self: this): void;
    addLocalListener(self: this): void;
    finale(proxy: Element & BeOpenAndShutVirtualProps, target:Element): Promise<void>; 
}

