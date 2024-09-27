import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "NIL",
  }
} as const

export type SignerLimits = readonly [Map<string, Option<Array<SignerKey>>>];
export type SignerKey = {tag: "Policy", values: readonly [string]} | {tag: "Ed25519", values: readonly [Buffer]} | {tag: "Secp256r1", values: readonly [Buffer]};

export type SignerStorage = {tag: "Persistent", values: void} | {tag: "Temporary", values: void};

export type Signer = {tag: "Policy", values: readonly [string, SignerLimits, SignerStorage]} | {tag: "Ed25519", values: readonly [Buffer, SignerLimits, SignerStorage]} | {tag: "Secp256r1", values: readonly [Buffer, Buffer, SignerLimits, SignerStorage]};

export const Errors = {

}

export interface Client {
  /**
   * Construct and simulate a add_signers transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  add_signers: ({webauthn_wallet, signers}: {webauthn_wallet: string, signers: Array<Signer>}, options?: {
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
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a do_math transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  do_math: ({source, a, b}: {source: string, a: i128, b: i128}, options?: {
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
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAADFNpZ25lckxpbWl0cwAAAAEAAAAAAAAAATAAAAAAAAPsAAAAEwAAA+gAAAPqAAAH0AAAAAlTaWduZXJLZXkAAAA=",
        "AAAAAgAAAAAAAAAAAAAACVNpZ25lcktleQAAAAAAAAMAAAABAAAAAAAAAAZQb2xpY3kAAAAAAAEAAAATAAAAAQAAAAAAAAAHRWQyNTUxOQAAAAABAAAD7gAAACAAAAABAAAAAAAAAAlTZWNwMjU2cjEAAAAAAAABAAAADg==",
        "AAAAAgAAAAAAAAAAAAAADVNpZ25lclN0b3JhZ2UAAAAAAAACAAAAAAAAAAAAAAAKUGVyc2lzdGVudAAAAAAAAAAAAAAAAAAJVGVtcG9yYXJ5AAAA",
        "AAAAAgAAAAAAAAAAAAAABlNpZ25lcgAAAAAAAwAAAAEAAAAAAAAABlBvbGljeQAAAAAAAwAAABMAAAfQAAAADFNpZ25lckxpbWl0cwAAB9AAAAANU2lnbmVyU3RvcmFnZQAAAAAAAAEAAAAAAAAAB0VkMjU1MTkAAAAAAwAAA+4AAAAgAAAH0AAAAAxTaWduZXJMaW1pdHMAAAfQAAAADVNpZ25lclN0b3JhZ2UAAAAAAAABAAAAAAAAAAlTZWNwMjU2cjEAAAAAAAAEAAAADgAAA+4AAABBAAAH0AAAAAxTaWduZXJMaW1pdHMAAAfQAAAADVNpZ25lclN0b3JhZ2UAAAA=",
        "AAAAAAAAAAAAAAALYWRkX3NpZ25lcnMAAAAAAgAAAAAAAAAPd2ViYXV0aG5fd2FsbGV0AAAAABMAAAAAAAAAB3NpZ25lcnMAAAAD6gAAB9AAAAAGU2lnbmVyAAAAAAAA",
        "AAAAAAAAAAAAAAAHZG9fbWF0aAAAAAADAAAAAAAAAAZzb3VyY2UAAAAAABMAAAAAAAAAAWEAAAAAAAALAAAAAAAAAAFiAAAAAAAACwAAAAEAAAAL" ]),
      options
    )
  }
  public readonly fromJSON = {
    add_signers: this.txFromJSON<null>,
        do_math: this.txFromJSON<i128>
  }
}