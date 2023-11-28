import type { ExtensionType } from 'src/extension';

import type { Serializable } from '../interface';

export interface EventJson<T = any> {
    readonly type: string;
    readonly data: T;
}

export interface EventType<T = any, D = any> {
    readonly type: string;
    serializer: Serializable<T, D>;
}

export class ExtensionEventType<T = any, D = any> implements EventType<T, D> {
    public readonly extensionType: ExtensionType;
    public readonly type: string;
    public serializer: Serializable<T, D>;

    constructor(
        extensionType: ExtensionType,
        type: string,
        serializer: Serializable<T, D>,
    ) {
        this.extensionType = extensionType;
        this.type = `${extensionType.info.key()}:${type}`;
        this.serializer = serializer;
    }
}
