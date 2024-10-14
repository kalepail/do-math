<script lang="ts">
    import { onMount } from "svelte";
    import { xdr, scValToNative, Keypair } from "@stellar/stellar-sdk/minimal";
    import { Client } from "do-math-sdk";
    import { PasskeyServer, PasskeyKit, SACClient, SignerStore, PasskeyClient, type SignerLimits, SignerKey } from "passkey-kit";
    import { fundPubkey, fundSigner } from "../lib/common";

    let url: URL

    const pk_server = new PasskeyServer({
        rpcUrl: import.meta.env.PUBLIC_RPC_URL,
        launchtubeUrl: import.meta.env.PUBLIC_LAUNCHTUBE_URL,
        launchtubeJwt: import.meta.env.PUBLIC_LAUNCHTUBE_JWT,
    });

    const pk_wallet = new PasskeyKit({
        rpcUrl: import.meta.env.PUBLIC_RPC_URL,
        networkPassphrase: import.meta.env.PUBLIC_PASSPHRASE,
        factoryContractId: import.meta.env.PUBLIC_FACTORY,
    });

    const sac = new SACClient({
        rpcUrl: import.meta.env.PUBLIC_RPC_URL,
        networkPassphrase: import.meta.env.PUBLIC_PASSPHRASE,
    });

    const contract = new Client({
        rpcUrl: import.meta.env.PUBLIC_RPC_URL,
        contractId: import.meta.env.PUBLIC_DO_MATH,
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
        url = new URL(location.href);

        const keyId = url.searchParams.get("keyId") || undefined;
        const contractId = url.searchParams.get("contractId") || undefined;
        const secret = url.searchParams.get("secret");

        if (keyId) {
            connectWallet(keyId).then(() => fundWallet());
        } else if (contractId) {
            // will be missing keyId_ but that's fine, just won't be able to sign with a passkey
            pk_wallet.wallet = new PasskeyClient({
                contractId,
                rpcUrl: import.meta.env.PUBLIC_RPC_URL,
                networkPassphrase: import.meta.env.PUBLIC_PASSPHRASE,
            })

            contractId_ = contractId;

            fundWallet();
        }   

        if (secret) {
            keypair = Keypair.fromSecret(secret);
        } else {
            keypair = Keypair.random();
            url.searchParams.set("secret", keypair.secret());
            history.pushState({}, '', url);
        }

        refresh();
    });

    async function createWallet() {
        try {
            loading.set("createWallet", true);
            loading = loading

            const { keyId_base64, contractId, built } = await pk_wallet.createWallet(
                "Do Math",
                "Do Math",
            );

            keyId_ = keyId_base64;

            const res = await pk_server.send(built);

            console.log(res);

            url.searchParams.set("keyId", keyId_);
            history.pushState({}, '', url);

            contractId_ = contractId;

            fundWallet();
        } finally {
            loading.set("createWallet", false);
            loading = loading
        }
    }
    async function connectWallet(keyId: string) {
        const { keyId_base64, contractId } = await pk_wallet.connectWallet({ keyId });

        keyId_ = keyId_base64;

        if (!keyId) {
            url.searchParams.set("keyId", keyId_);
            history.pushState({}, '', url);
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
                sac: undefined // import.meta.env.PUBLIC_NATIVE
            });

            await pk_wallet.sign(at, { keyId: keyId_ });
            const res = await pk_server.send(at.built!);

            console.log(res);

            const meta = xdr.TransactionMeta.fromXDR(res.resultMetaXdr, "base64");
            const result = scValToNative(meta.v3().sorobanMeta()!.returnValue());

            alert(`${a} + ${b} = ${result}`);

            refresh();
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
                sac: undefined // import.meta.env.PUBLIC_NATIVE
            });
            
            await pk_wallet.sign(at, { keypair });
            const res = await pk_server.send(at.built!);

            console.log(res);

            const meta = xdr.TransactionMeta.fromXDR(res.resultMetaXdr, "base64");
            const result = scValToNative(meta.v3().sorobanMeta()!.returnValue());

            alert(`${a} + ${b} = ${result}`);

            refresh();
        } catch {
            alert("❌ Failed to do math");
        } finally {
            loading.set("doMath_Ed25519", false);
            loading = loading
        }
    }

    async function addSigner_Ed25519() {
        try {
            loading.set("addSigner_Ed25519", true);
            loading = loading

            const at = await pk_wallet.addEd25519(keypair.publicKey(), new Map(), SignerStore.Temporary);

            await pk_wallet.sign(at, { keyId: keyId_ });
            const res = await pk_server.send(at.built!);

            console.log(res);
        } finally {
            loading.set("addSigner_Ed25519", false);
            loading = loading
        }
    }
    async function attach_Policy() {
        try {
            loading.set("attach_Policy", true);
            loading = loading

            const ed25519_limits: SignerLimits = new Map();

            // ed25519 key can call do_math contract but only if it also calls the do_math policy
            ed25519_limits.set(import.meta.env.PUBLIC_DO_MATH, [SignerKey.Policy(import.meta.env.PUBLIC_DO_MATH_POLICY)])

            const at = await pk_wallet.addEd25519(
                keypair.publicKey(), 
                ed25519_limits,
                SignerStore.Temporary
            );

            await pk_wallet.sign(at, { keyId: keyId_ });
            const res = await pk_server.send(at.built!);

            console.log(res);
        } finally {
            loading.set("attach_Policy", false);
            loading = loading
        }
    }

    async function fundWallet() {
        const amount = await native.balance({
            id: contractId_,
        })
        .then(({ result }) => result)
        .catch(() => BigInt(0))

        if (amount > 1)
            return
        
        const { built, ...transfer } = await native.transfer({
			to: contractId_,
			from: fundPubkey,
			amount: BigInt(10_000_000),
		});

		await transfer.signAuthEntries({
			address: fundPubkey,
			signAuthEntry: fundSigner.signAuthEntry,
		});

		const res = await pk_server.send(built!);

		console.log(res);
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
        location.assign(location.origin);
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
        
        {#if keyId_}
            <button class="bg-black text-white px-2 py-1 rounded" on:click={doMath}>
                {#if loading.get("doMath")}
                    ...
                {:else}
                    Do Math
                {/if}
            </button>
        
        {/if}

        <button class="bg-black text-white px-2 py-1 rounded" on:click={doMath_Ed25519}>
            {#if loading.get("doMath_Ed25519")}
                ...
            {:else}
                Do Math (Ed25519)
            {/if}
        
        </button>
    </div>

    {#if keyId_}
        <br />

        <div>
            <button class="bg-black text-white px-2 py-1 rounded" on:click={addSigner_Ed25519}>
                {#if loading.get("addSigner_Ed25519")}
                    ...
                {:else}
                    Add Signer (Ed25519)
                {/if}
            </button>
            <button class="bg-black text-white px-2 py-1 rounded" on:click={attach_Policy}>
                {#if loading.get("attach_Policy")}
                    ...
                {:else}
                    Attach Policy
                {/if}
            </button>
        </div>

    {/if}

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

    {#if keypair}    
        <br>

        <div>
            <a class="bg-black text-white px-2 py-1 rounded" href={location.origin + `?contractId=${contractId_}&secret=${keypair.secret()}`} target="_blank" rel="nofollow">
                Share (Ed25519)
            </a>
        </div>
    {/if}
{:else}
    <button class="bg-black text-white px-2 py-1 rounded mt-2" on:click={createWallet}>
        {#if loading.get("createWallet")}
            ...
        {:else}
            Sign Up
        {/if}
    </button>
{/if}
