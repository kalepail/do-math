<script lang="ts">
    import { onMount } from "svelte";
    import { xdr, scValToNative, Keypair, Operation, Address, hash } from "@stellar/stellar-sdk";
    import { Client } from "do-math-sdk";
    import base64url from "base64url";
    import { PasskeyServer, PasskeyKit, SACClient } from "passkey-kit";

    const pk_server = new PasskeyServer({
        rpcUrl: import.meta.env.PUBLIC_RPC_URL,
        launchtubeUrl: import.meta.env.PUBLIC_LAUNCHTUBE_URL,
        launchtubeJwt: import.meta.env.PUBLIC_LAUNCHTUBE_JWT,
        mercuryUrl: import.meta.env.PUBLIC_MERCURY_URL,
        mercuryJwt: import.meta.env.PUBLIC_MERCURY_JWT,
    });

    const pk_wallet = new PasskeyKit({
        rpcUrl: import.meta.env.PUBLIC_RPC_URL,
        networkPassphrase: import.meta.env.PUBLIC_PASSPHRASE,
        factoryContractId: import.meta.env.PUBLIC_FACTORY,
    });

    const contract = new Client({
        rpcUrl: import.meta.env.PUBLIC_RPC_URL,
        networkPassphrase: import.meta.env.PUBLIC_PASSPHRASE,
        contractId: import.meta.env.PUBLIC_DO_MATH,
    });

    const sac = new SACClient({
        rpcUrl: import.meta.env.PUBLIC_RPC_URL,
        networkPassphrase: import.meta.env.PUBLIC_PASSPHRASE,
    });

    const native = sac.getSACClient(import.meta.env.PUBLIC_NATIVE)

    let keypair: Keypair;
    let keyId_: string;
    let contractId_: string;

    let a: number;
    let b: number;

    let loading: Map<string, boolean> = new Map()

    onMount(() => {
        const keyId = localStorage.getItem("dm:keyId");
        const secret = localStorage.getItem("dm:ed25519");

        if (keyId) {
            connectWallet(keyId);
        }

        if (secret) {
            keypair = Keypair.fromSecret(secret);
        } else {
            keypair = Keypair.random();
            localStorage.setItem("dm:ed25519", keypair.secret());
        }

        refresh();
    });

    async function createWallet() {
        const { keyId, contractId, built } = await pk_wallet.createWallet(
            "Do Math",
            "Do Math",
        );

        keyId_ = base64url(keyId);

        localStorage.setItem("dm:keyId", keyId_);

        const res = await pk_server.send(built);

        console.log(res);

        contractId_ = contractId;
    }
    async function connectWallet(keyId?: string) {
        const { keyId: kid, contractId } = await pk_wallet.connectWallet({
            keyId,
        });

        keyId_ = base64url(kid);

        if (!keyId) {
            localStorage.setItem("dm:keyId", keyId_);
        }

        contractId_ = contractId;
    }

    async function doMath() {
        try {
            loading.set("doMath", true);
            loading = loading

            const at = await contract.do_math({
                source: contractId_,
                a: BigInt(a),
                b: BigInt(b),
            });

            await pk_wallet.sign(at, { keyId: keyId_ });
            const res = await pk_server.send(at.built!);

            console.log(res);

            const meta = xdr.TransactionMeta.fromXDR(res.resultMetaXdr, "base64");
            const result = scValToNative(meta.v3().sorobanMeta()!.returnValue());

            alert(`${a} + ${b} = ${result}`);
        } finally {
            loading.set("doMath", false);
            loading = loading
        }
    }
    async function doMath_Ed25519() {
        try {
            loading.set("doMath_Ed25519", true);
            loading = loading

            const at = await contract.do_math({
                source: contractId_,
                a: BigInt(a),
                b: BigInt(b),
            });
            
            await pk_wallet.sign(at, { keypair });
            const res = await pk_server.send(at.built!);

            console.log(res);

            const meta = xdr.TransactionMeta.fromXDR(res.resultMetaXdr, "base64");
            const result = scValToNative(meta.v3().sorobanMeta()!.returnValue());

            alert(`${a} + ${b} = ${result}`);
        } catch {
            alert("❌ Failed to do math");
        } finally {
            loading.set("doMath_Ed25519", false);
            loading = loading
        }
    }
    async function doMath_Policy() {
        try {
            loading.set("doMath_Policy", true);
            loading = loading

            const at = await contract.do_math({
                source: contractId_,
                a: BigInt(a),
                b: BigInt(b),
            });

            await pk_wallet.sign(at, { keypair });
            await pk_wallet.sign(at, { policy: import.meta.env.PUBLIC_DO_MATH_POLICY });
            const res = await pk_server.send(at.built!);

            console.log(res);

            const meta = xdr.TransactionMeta.fromXDR(res.resultMetaXdr, "base64");
            const result = scValToNative(meta.v3().sorobanMeta()!.returnValue());

            alert(`${a} + ${b} = ${result}`);
        } finally {
            loading.set("doMath_Policy", false);
            loading = loading
        }
    }

    async function addSigner_Ed25519() {
        try {
            loading.set("addSigner_Ed25519", true);
            loading = loading

            const limits = new Map();

            const at = await pk_wallet.wallet!.add({
                signer: {
                    tag: "Ed25519",
                    values: [
                        keypair.rawPublicKey(),
                        [limits],
                        {
                            tag: "Temporary",
                            values: undefined,
                        },
                    ],
                },
            });

            await pk_wallet.sign(at, { keyId: keyId_ });
            const res = await pk_server.send(at.built!);

            console.log(res);
        } finally {
            loading.set("addSigner_Ed25519", false);
            loading = loading
        }
    }
    async function addSigner_Policy() {
        try {
            loading.set("addSigner_Policy", true);
            loading = loading

            const ed25519_limits = new Map();
            const policy_limits = new Map();

            // ed25519 key can call do_math contract but only if it also calls the do_math policy
            ed25519_limits.set(import.meta.env.PUBLIC_DO_MATH, [{
                tag: "Policy",
                values: [import.meta.env.PUBLIC_DO_MATH_POLICY]
            }]);
            // do_math policy can call do_math contract but only if it also calls the ed25519 signer
            policy_limits.set(import.meta.env.PUBLIC_DO_MATH, [{
                tag: "Ed25519",
                values: [keypair.rawPublicKey()]
            }]);

            const at = await contract.add_signers({
                webauthn_wallet: contractId_,
                signers: [
                    {
                        tag: "Ed25519",
                        values: [
                            keypair.rawPublicKey(),
                            [ed25519_limits],
                            {
                                tag: "Temporary",
                                values: undefined,
                            },
                        ]
                    },
                    {
                        tag: "Policy",
                        values: [
                            import.meta.env.PUBLIC_DO_MATH_POLICY,
                            [policy_limits],
                            {
                                tag: "Temporary",
                                values: undefined,
                            },
                        ],
                    }
                ]
            })

            await pk_wallet.sign(at, { keyId: keyId_ });
            const res = await pk_server.send(at.built!);

            console.log(res);
        } finally {
            loading.set("addSigner_Policy", false);
            loading = loading
        }
    }

    async function transfer_Ed25519() {
        try {
            loading.set("transfer_Ed25519", true);
            loading = loading

            const at = await native.transfer({
                from: contractId_,
                to: contractId_,
                amount: BigInt(1),
            })

            await pk_wallet.sign(at, { keypair });
            const res = await pk_server.send(at.built!);

            console.log(res);

            alert("😱 Transfer complete");
        } catch {
            alert("❌ Failed to transfer");
        } finally {
            loading.set("transfer_Ed25519", false);
            loading = loading
        }
    }

    function refresh() {
        a = parseInt(Math.random().toString().slice(2, 5));
        b = parseInt(Math.random().toString().slice(2, 5));
    }
    function signOut() {
        keyId_ = "";
        contractId_ = "";
        localStorage.removeItem("dm:keyId");
        localStorage.removeItem("dm:ed25519");
        window.location.reload();
    }
</script>

<h1 class="text-2xl font-bold">Do Math</h1>

{#if contractId_}
    <p>
        {contractId_}
        <button class="bg-black text-white px-2 py-1 rounded" on:click={signOut}>Sign Out</button>
    </p>

    <br />

    <div>
        <button on:click={refresh}>🔄</button>
        <input class="border border-black rounded px-2 py-1" type="number" name="a" id="a" bind:value={a} />
        +
        <input class="border border-black rounded px-2 py-1" type="number" name="b" id="b" bind:value={b} />
        <button class="bg-black text-white px-2 py-1 rounded" on:click={doMath}>
            {#if loading.get("doMath")}
                ...
            {:else}
                Do Math
            {/if}
        </button>
        <button class="bg-black text-white px-2 py-1 rounded" on:click={doMath_Ed25519}>
            {#if loading.get("doMath_Ed25519")}
                ...
            {:else}
                Do Math (Ed25519)
            {/if}
        </button>
        <button class="bg-black text-white px-2 py-1 rounded" on:click={doMath_Policy}>
            {#if loading.get("doMath_Policy")}
                ...
            {:else}
                Do Math (Policy)
            {/if}
        </button>
    </div>

    <br />

    <div>
        <button class="bg-black text-white px-2 py-1 rounded" on:click={addSigner_Ed25519}>
            {#if loading.get("addSigner_Ed25519")}
                ...
            {:else}
                Add Signer (Ed25519)
            {/if}
        </button>
        <button class="bg-black text-white px-2 py-1 rounded" on:click={addSigner_Policy}>
            {#if loading.get("addSigner_Policy")}
                ...
            {:else}
                Add Signer (Policy)
            {/if}
        </button>
    </div>

    <br />

    <div>
        <button class="bg-black text-white px-2 py-1 rounded" on:click={transfer_Ed25519}>
            {#if loading.get("transfer_Ed25519")}
                ...
            {:else}
                Transfer (Ed25519)
            {/if}
        </button>
    </div>
{:else}
    <button class="bg-black text-white px-2 py-1 rounded" on:click={createWallet}>Sign Up</button>
    <!-- <button on:click={() => connectWallet()}>Sign In</button> -->
{/if}
