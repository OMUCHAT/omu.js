import { Keyable } from "src/interface/keyable";
import { Model } from "src/interface/model";

export interface RoleJson {
    id: string;
    name: string;
    color: string;
    icon_url: string;
    is_owner: boolean;
    is_moderator: boolean;
}

export class Role implements Keyable, Model<RoleJson> {
    id: string;
    name: string;
    color: string;
    icon_url: string;
    is_owner: boolean;
    is_moderator: boolean;

    constructor(info: RoleJson) {
        this.id = info.id;
        this.name = info.name;
        this.color = info.color;
        this.icon_url = info.icon_url;
        this.is_owner = info.is_owner;
        this.is_moderator = info.is_moderator;
    }

    key(): string {
        return this.id;
    }

    json(): RoleJson {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            icon_url: this.icon_url,
            is_owner: this.is_owner,
            is_moderator: this.is_moderator,
        }
    }

    toString(): string {
        return this.name;
    }
}