import { Keyable } from "src/interface/keyable";
import { Model } from "src/interface/model";
import { Role, RoleJson } from "./role";

export interface AuthorJson {
    id: string;
    name: string;
    avatar_url: string;
    roles: RoleJson[];
}

export class Author implements Keyable, Model<AuthorJson> {
    id: string;
    name: string;
    avatar_url: string;
    roles: Role[];

    constructor(info: AuthorJson) {
        this.id = info.id;
        this.name = info.name;
        this.avatar_url = info.avatar_url;
        this.roles = info.roles.map(role => new Role(role));
    }

    key(): string {
        return this.id;
    }

    json(): AuthorJson {
        return {
            id: this.id,
            name: this.name,
            avatar_url: this.avatar_url,
            roles: this.roles.map(role => role.json()),
        }
    }

    toString(): string {
        return this.name;
    }
}