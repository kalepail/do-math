import {
  AssembledTransaction,
  Client as ContractClient,
  type ClientOptions as ContractClientOptions,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  i128,
  Option,
} from '@stellar/stellar-sdk/contract';

export interface Client {
  /**
   * Construct and simulate a do_math transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  do_math: ({source, a, b, sac}: {source: string, a: i128, b: i128, sac: Option<string>}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

}
export class Client extends ContractClient {
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAAAAAAAHZG9fbWF0aAAAAAAEAAAAAAAAAAZzb3VyY2UAAAAAABMAAAAAAAAAAWEAAAAAAAALAAAAAAAAAAFiAAAAAAAACwAAAAAAAAADc2FjAAAAA+gAAAATAAAAAQAAAAs=" ]),
      options
    )
  }
  public readonly fromJSON = {
    do_math: this.txFromJSON<i128>
  }
}