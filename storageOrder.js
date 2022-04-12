const { Keyring } = require("@polkadot/api");
const { ApiPromise, WsProvider } = require("@polkadot/api");
const {
  typesBundleForPolkadot,
  crustTypes,
} = require("@crustio/type-definitions");
const crustChainEndpoint = "wss://rpc.crust.network";

const api = new ApiPromise({
  provider: new WsProvider(crustChainEndpoint),
  typesBundle: typesBundleForPolkadot,
});

async function placeStorageOrder(cid, size) {
  // 1. Construct place-storage-order tx
  const fileCid = cid; // IPFS CID, take `Qm123` as example
  const fileSize = size; // Let's say 2 gb(in byte)
  const tips = 0;
  const memo = "";
  console.log({ fileCid, fileSize });
  const tx = api.tx.market.placeStorageOrder(fileCid, fileSize, tips, memo);

  // 2. Load seeds(account)
  const seeds = process.env.CRUST_WALLET_SEED_PHRASE;
  const kr = new Keyring({ type: "sr25519" });
console.log(seeds);
  // const krp = kr.addFromUri(seeds);
  const krp = kr.addFromUri(seeds);

  // 3. Send transaction
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
}
module.exports = placeStorageOrder;
