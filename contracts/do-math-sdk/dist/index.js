import { Client as ContractClient, Spec as ContractSpec, } from '@stellar/stellar-sdk/contract';
export class Client extends ContractClient {
    options;
    constructor(options) {
        super(new ContractSpec(["AAAAAAAAAAAAAAAHZG9fbWF0aAAAAAAEAAAAAAAAAAZzb3VyY2UAAAAAABMAAAAAAAAAAWEAAAAAAAALAAAAAAAAAAFiAAAAAAAACwAAAAAAAAADc2FjAAAAA+gAAAATAAAAAQAAAAs="]), options);
        this.options = options;
    }
    fromJSON = {
        do_math: (this.txFromJSON)
    };
}
