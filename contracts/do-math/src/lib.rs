#![no_std]

use soroban_sdk::{token, contract, contractimpl, Address, Env};

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn do_math(env: Env, source: Address, a: i128, b: i128, sac: Option<Address>) -> i128 {
        source.require_auth();

        if let Some(sac) = sac {
            token::Client::new(&env, &sac).transfer(&source, &source, &1);
        }
        
        a + b
    }
}
