import type { Keyable } from 'src/interface/keyable';
import type { Model } from 'src/interface/model';

import type { RoleJson } from './role';
import { Role } from './role';

export interface AuthorJson {
    id: string;
    name: string;
    avatar_url: string;
    roles?: RoleJson[];
}

export class Author implements Keyable, Model<AuthorJson> {
    id: string;
    name: string;
    avatar_url: string;
    roles?: Role[];

    constructor(options: {
        id: string;
        name: string;
        avatar_url: string;
        roles?: Role[];
    }) {
        this.id = options.id;
        this.name = options.name;
        this.avatar_url = options.avatar_url;
        this.roles = options.roles;
    }

    static fromJson(info: AuthorJson): Author {
        return new Author({
            id: info.id,
            name: info.name,
            avatar_url: info.avatar_url,
            roles: info.roles?.map(role => new Role(role)),
        });
    }

    key(): string {
        return this.id;
    }

    json(): AuthorJson {
        return {
            id: this.id,
            name: this.name,
            avatar_url: this.avatar_url,
            roles: this.roles?.map(role => role.json()),
        };
    }

    toString(): string {
        return this.name;
    }
}
