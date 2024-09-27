use soroban_sdk::{contracttype, Address, Bytes, BytesN, Map, Vec};

#[contracttype]
#[derive(Debug, Clone, Eq, PartialEq, Ord, PartialOrd)]
pub struct SignerLimits(pub Map<Address, Option<Vec<SignerKey>>>);

#[contracttype]
#[derive(Debug, Clone, Eq, PartialEq, Ord, PartialOrd)]
pub enum SignerKey {
    Policy(Address),
    Ed25519(BytesN<32>),
    Secp256r1(Bytes),
}

#[contracttype]
#[derive(Debug, Clone, Eq, PartialEq, Ord, PartialOrd)]
pub enum SignerStorage {
    Persistent,
    Temporary,
}

#[contracttype]
#[derive(Debug, Clone, Eq, PartialEq, Ord, PartialOrd)]
pub enum Signer {
    Policy(Address, SignerLimits, SignerStorage),
    Ed25519(BytesN<32>, SignerLimits, SignerStorage),
    Secp256r1(Bytes, BytesN<65>, SignerLimits, SignerStorage),
}
