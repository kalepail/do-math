import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from '@stellar/stellar-sdk/minimal/contract';
if (typeof window !== 'undefined') {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const Errors = {};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initalizing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAAAAAAAAAAAHZG9fbWF0aAAAAAAEAAAAAAAAAAZzb3VyY2UAAAAAABMAAAAAAAAAAWEAAAAAAAALAAAAAAAAAAFiAAAAAAAACwAAAAAAAAADc2FjAAAAA+gAAAATAAAAAQAAAAs="]), options);
        this.options = options;
    }
    fromJSON = {
        do_math: (this.txFromJSON)
    };
}
