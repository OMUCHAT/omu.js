import type { Keyable } from 'src/interface/keyable';
import type { Model } from 'src/interface/model';

import type { AuthorJson } from './author';
import { Author } from './author';
import type { Content, ContentJson } from './content';
import { ContentComponent } from './content';
import type { GiftJson } from './gift';
import { Gift } from './gift';
import type { PaidJson } from './paid';
import { Paid } from './paid';

export interface MessageJson {
    room_id: string;
    id: string;
    content?: ContentJson;
    author?: AuthorJson;
    paid?: PaidJson;
    gift?: GiftJson;
    created_at?: number;
}

export class Message implements Keyable, Model<MessageJson> {
    room_id: string;
    id: string;
    content?: Content;
    author?: Author;
    paid?: Paid;
    gift?: Gift;
    created_at?: Date;

    constructor(options: {
        room_id: string;
        id: string;
        content?: Content;
        author?: Author;
        paid?: Paid;
        gift?: Gift;
        created_at?: Date;
    }) {
        this.room_id = options.room_id;
        this.id = options.id;
        this.content = options.content;
        this.author = options.author;
        this.paid = options.paid;
        this.gift = options.gift;
        this.created_at = options.created_at;
    }

    static fromJson(info: MessageJson): Message {
        return new Message({
            room_id: info.room_id,
            id: info.id,
            content: info.content && ContentComponent.fromJson(info.content),
            author: info.author && new Author(info.author),
            paid: info.paid && new Paid(info.paid),
            gift: info.gift && new Gift(info.gift),
            created_at: info.created_at ? new Date(info.created_at) : undefined,
        });
    }

    key(): string {
        return `${this.room_id}#${this.id}`;
    }

    json(): MessageJson {
        return {
            room_id: this.room_id,
            id: this.id,
            content: this.content && this.content.json(),
            author: this.author && this.author.json(),
            paid: this.paid && this.paid.json(),
            gift: this.gift && this.gift.json(),
            created_at: this.created_at && this.created_at.getTime(),
        };
    }

    toString(): string {
        return `${this.author}: ${this.content}`;
    }
}
