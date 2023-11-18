import { Model } from "src/interface/model";

export interface GiftJson {
    id: string;
    name: string;
    amount: number;
    image_url: string;
    is_paid: boolean;
}

export class Gift implements Model<GiftJson> {
    id: string;
    name: string;
    amount: number;
    image_url: string;
    is_paid: boolean;

    constructor(info: GiftJson) {
        this.id = info.id;
        this.name = info.name;
        this.amount = info.amount;
        this.image_url = info.image_url;
        this.is_paid = info.is_paid;
    }

    json(): GiftJson {
        return {
            id: this.id,
            name: this.name,
            amount: this.amount,
            image_url: this.image_url,
            is_paid: this.is_paid,
        }
    }

    toString(): string {
        return this.name;
    }
}