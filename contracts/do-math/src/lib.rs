#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env, Vec};
use webauthn_wallet_interface::{types::Signer, WebAuthnClient};

mod types;

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn add_signers(env: Env, webauthn_wallet: Address, signers: Vec<Signer>) {
        webauthn_wallet.require_auth();

        let wallet = WebAuthnClient::new(&env, &webauthn_wallet);

        for signer in signers.iter() {
            wallet.add(&signer);
        }
    }
    pub fn do_math(_env: Env, source: Address, a: i128, b: i128) -> i128 {
        source.require_auth();
        a + b
    }
}
