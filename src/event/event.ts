import { Serializer } from "../interface";

export interface EventJson<T = any> {
    readonly type: string;
    readonly data: T;
}

export interface EventType<T = any, D = any> {
    readonly type: string;
    serializer: Serializer<T, D>;
}
