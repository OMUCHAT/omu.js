import { Keyable } from "src/interface/keyable";
import { Model } from "src/interface/model";
import { Author, AuthorJson } from "./author";
import { Content } from "./content";
import { Gift, GiftJson } from "./gift";
import { Paid, PaidJson } from "./paid";


export interface MessageJson {
    room_id: string;
    id: string;
    content?: Content;
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

    constructor(info: MessageJson) {
        this.room_id = info.room_id;
        this.id = info.id;
        this.content = info.content;
        this.author = info.author && new Author(info.author);
        this.paid = info.paid && new Paid(info.paid);
        this.gift = info.gift && new Gift(info.gift);
        this.created_at = info.created_at ? new Date(info.created_at) : undefined;
    }

    key(): string {
        return `${this.room_id}#${this.id}`
    }

    json(): MessageJson {
        return {
            room_id: this.room_id,
            id: this.id,
            content: this.content,
            author: this.author && this.author.json(),
            paid: this.paid && this.paid.json(),
            gift: this.gift && this.gift.json(),
            created_at: this.created_at && this.created_at.getTime(),
        }
    }

    toString(): string {
        return `${this.author}: ${this.content}`
    }
}