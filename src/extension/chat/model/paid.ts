import { Model } from "src/interface/model";

export interface PaidJson {
    amount: number;
    currency: string;
}

export class Paid implements Model<PaidJson> {
    amount: number;
    currency: string;

    constructor(info: PaidJson) {
        this.amount = info.amount;
        this.currency = info.currency;
    }

    json(): PaidJson {
        return {
            amount: this.amount,
            currency: this.currency,
        }
    }

    toString(): string {
        return `${this.amount} ${this.currency}`;
    }
}