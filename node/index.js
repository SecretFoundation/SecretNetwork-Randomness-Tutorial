import { SecretNetworkClient, Wallet } from "secretjs";
import * as fs from "fs";
// import dotenv from "dotenv";
// dotenv.config();

// const wallet = new Wallet(process.env.MNEMONIC);
const wallet = new Wallet("desk pigeon hammer sleep only mistake stool december offer patrol once vacant");
const contract_wasm = fs.readFileSync("../optimized-wasm/rng_template.wasm.gz");

const secretjs = new SecretNetworkClient({
  chainId: "pulsar-3",
  url: "https://api.pulsar3.scrttestnet.com",
  wallet: wallet,
  walletAddress: wallet.address,
});

// Declare global variables for codeId and contractCodeHash
let codeId;
let contractCodeHash;

let upload_contract = async () => {
  let tx = await secretjs.tx.compute.storeCode(
    {
      sender: wallet.address,
      wasm_byte_code: contract_wasm,
      source: "",
      builder: "",
    },
    {
      gasLimit: 4_000_000,
    }
  );

  codeId = Number(
    tx.arrayLog.find((log) => log.type === "message" && log.key === "code_id")
      .value
  );
  console.log("codeId: ", codeId);

  contractCodeHash = (
    await secretjs.query.compute.codeHashByCodeId({ code_id: codeId })
  ).code_hash;
  console.log(`Contract hash: ${contractCodeHash}`);
};

let instantiate_contract = async () => {
  if (!codeId || !contractCodeHash) {
    throw new Error("codeId or contractCodeHash is not set.");
  }

  const initMsg = { flip: 1 };
  let tx = await secretjs.tx.compute.instantiateContract(
    {
      code_id: codeId,
      sender: wallet.address,
      code_hash: contractCodeHash,
      init_msg: initMsg,
      label: "rng tutorial" + Math.ceil(Math.random() * 10000),
    },
    {
      gasLimit: 400_000,
    }
  );

  //Find the contract_address in the logs
  const contractAddress = tx.arrayLog.find(
    (log) => log.type === "message" && log.key === "contract_address"
  ).value;

  console.log(contractAddress);
};

upload_contract()
  .then(() => {
    instantiate_contract();
  })
  .catch((error) => {
    console.error("Error:", error);
  });

let try_flip = async () => {
  const flip_tx = await secretjs.tx.compute.executeContract(
    {
      sender: wallet.address,
      contract_address: "secret194jga9whdutqsjxpvjxg0ykvm09290ql7qdudx",
      msg: {
        flip: {},
      },
      code_hash: "ff6dd6a0e1dc8950ff74d12b07a3dc14c50dae3812f335f1d61e5f08226e662e",
    },
    { gasLimit: 100_000 }
  );

  console.log(flip_tx);
};
// try_flip();

let query_flip = async () => {
  let flip_tx = await secretjs.query.compute.queryContract({
    contract_address: "secret194jga9whdutqsjxpvjxg0ykvm09290ql7qdudx",
    code_hash: "ff6dd6a0e1dc8950ff74d12b07a3dc14c50dae3812f335f1d61e5f08226e662e",
    query: {
      get_flip: {},
    },
  });
  console.log(flip_tx);
};

// query_flip();
