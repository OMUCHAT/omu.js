import type { Model } from 'src/interface/model';

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

    constructor(options: {
        id: string;
        name: string;
        amount: number;
        image_url: string;
        is_paid: boolean;
    }) {
        this.id = options.id;
        this.name = options.name;
        this.amount = options.amount;
        this.image_url = options.image_url;
        this.is_paid = options.is_paid;
    }

    static fromJson(info: GiftJson): Gift {
        return new Gift({
            id: info.id,
            name: info.name,
            amount: info.amount,
            image_url: info.image_url,
            is_paid: info.is_paid,
        });
    }

    json(): GiftJson {
        return {
            id: this.id,
            name: this.name,
            amount: this.amount,
            image_url: this.image_url,
            is_paid: this.is_paid,
        };
    }

    toString(): string {
        return this.name;
    }
}
