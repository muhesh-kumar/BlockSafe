// import { ApiPromise, WsProvider } from "@polkadot/api";
// import { typesBundleForPolkadot, crustTypes } from "@crustio/type-definitions";
// import { Keyring } from "@polkadot/keyring";
// import { KeyringPair } from "@polkadot/keyring/types";

const polkadot = require("@polkadot/api");
const crustio = require("@crustio/type-definitions");
// const keyring = require("@polkadot/keyring");
const keyringPair = require("@polkadot/keyring/pair");

const { waitReady } = require("@polkadot/wasm-crypto");
const { Keyring } = require("@polkadot/api");

const crustChainEndpoint = "wss://rpc.crust.network";
const Wsprovider = new polkadot.WsProvider(crustChainEndpoint);

async function placeStorageOrder() {
  await waitReady();
  const api = new polkadot.ApiPromise({
    provider: Wsprovider,
    typesBundle: crustio.typesBundleForPolkadot,
  });
  await api.isReady;
  // 1. Construct place-storage-order tx
  //TODO: take from api
  // const fileCid = "QmXxiZnM4LBDTzcetpA3kTo7tgBHAwyqhEaVc3Sdn23P2G"; // IPFS CID, take `Qm123` as example
  const fileCid = api.cid;
  const fileSize = api.cumulativeSize; // Let's say 2 gb(in byte)
  console.log({ fileCid, fileSize });
  // DON'T CHANGE
  const tips = 0;
  const memo = "";
  const tx = api.tx.market.placeStorageOrder(fileCid, fileSize, tips, memo);

  const keyring = new Keyring({ type: "sr25519" });
  console.log(keyring);
  const krp = keyring.addFromUri(process.env.CRUST_WALLET_SEED_PHRASE);
  console.log(krp);

  await api.isReadyOrError;
  return new Promise((resolve, reject) => {
    tx.signAndSend(krp, ({ events = [], status }) => {
      console.log(`💸  Tx status: ${status.type}, nonce: ${tx.nonce}`);

      if (status.isInBlock) {
        events.forEach(({ event: { method, section } }) => {
          if (method === "ExtrinsicSuccess") {
            console.log(`✅  Place storage order success!`);
            resolve(true);
          }
        });
      } else {
        // Pass it
      }
    }).catch((e) => {
      reject(e);
    });
  });

  // 3. Send transaction
}

const res = placeStorageOrder();

