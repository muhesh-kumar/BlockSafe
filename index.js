const ipfsClient = require("ipfs-http-client");
const express = require("express");
const bodyparser = require("body-parser");
const fileupload = require("express-fileupload");
const fs = require("fs");
const path = require("path");
const placeStorageOrder = require("./storageOrder");
const cookieParser = require("cookie-parser");
const all = require("it-all");
// var Web3 = require("web3");
// var web3 = new Web3(Web3.givenProvider || "https://rpc-mumbai.matic.today");
// web3.eth.getAccounts(console.log);

// var web3 = new Web3(window.ethereum);
require("dotenv").config();
let account;
console.log(ipfsClient);
const ipfs = ipfsClient.create({
  host: "localhost",
  port: "5001",
  protocol: "http",
});

const FILE_DIR = "files";
const app = express();
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(fileupload());

// index route
app.get("/", (req, res) => {
  res.render("index", {
    title: "Home",
  });
});

app.get("/about", (req, res) => {
  res.render("about", {
    title: "About Us",
  });
});

app.get("/contact", (req, res) => {
  res.render("contact", {
    title: "Contact Us",
  });
});

app.get("/upload", (req, res) => {
  res.render("upload", {
    title: "Upload",
  });
});

app.get("/view-uploads", async (req, res) => {
  // console.log(account);
  // let result = await getFilesFromDir(account);
  // console.log({ result });
  res.render("view-uploads", {
    title: " See Uploads",
  });
});
app.post("/view-uploads", async (req, res) => {
  const account = req.body.account;
  console.log({ account });
  let result = await getFilesFromDir(account);
  res.render("file-uploaded", { title: " File Uploaded", dir: result });
});

app.listen(3000, () => {
  console.log("SERVER is listening");
});
app.post("/upload", (req, res) => {
  const file = req.files.file;
  const fileName = req.body.fileName;
  account = req.body.account;
  console.log("account from form");
  console.log(account);
  const filePath = FILE_DIR + "/" + fileName;
  file.mv(filePath, async (err) => {
    if (err) {
      console.log("eRRor");
      return res.status(500).send(err);
    }
    const filesDetail = await addFileAuth(fileName, filePath, account);
    console.log(filesDetail);
    // const size = fileDetail.cumulativeSize;
    // const fileHash = fileDetail.cid;
    fs.unlink(filePath, (err) => {
      if (err) {
        console.log(err);
      }
    });
    res.render("file-uploaded", {
      title: "File Uploaded",
      dir: filesDetail,
    });
  });
});
const ethers = require("ethers");
const { dir } = require("console");

async function addFileAuth(file_name, file_path, dir_name) {
  const pair = ethers.Wallet.createRandom();
  console.log(pair);
  const sig = await pair.signMessage(pair.address);
  console.log(sig);
  const authHeaderRaw = `eth-${pair.address}:${sig}`;
  console.log(authHeaderRaw);
  const authHeader = Buffer.from(authHeaderRaw).toString("base64");
  console.log(authHeader);
  const ipfsW3GW = "https://crustipfs.xyz";

  const fileBuffer = fs.readFileSync(file_path);

  const ipfs = ipfsClient.create({
    url: `${ipfsW3GW}/api/v0`,
    headers: {
      authorization: `Basic ${authHeader}`,
    },
  });
  // try to create the directory
  try {
    console.log("making directory");
    await ipfs.files.mkdir("/" + dir_name);
  } catch (error) {
    console.log("directory already exists: " + dir_name);
    console.log(error);
  }
  let result = await ipfs.files.stat("/" + dir_name);
  console.log("Checking Directory: " + dir_name);
  console.log(result);
  console.log("Path of file (locally) " + file_path);
  console.log(file_path);
  console.log("writing file to root (IPFS)");
  await ipfs.files.write("/" + file_name, fileBuffer, { create: true });
  console.log("ls root");
  result = await all(ipfs.files.ls("/"));
  console.log(result);
  await ipfs.files.mv("/" + file_name, "/" + dir_name);
  result = await all(ipfs.files.ls("/" + dir_name));
  const cur_file = result.find((r) => r.name == file_name);
  console.log({ cur_file });
  // IMP: don't change or remove this line
  await placeStorageOrder(cur_file.cid, cur_file.size);
  return { dir_name: dir_name, files: result };
}
async function getFilesFromDir(dirName) {
  dirName = String(dirName).toLowerCase();
  console.log({ dirName });
  const pair = ethers.Wallet.createRandom();
  const sig = await pair.signMessage(pair.address);
  const authHeaderRaw = `eth-${pair.address}:${sig}`;
  const authHeader = Buffer.from(authHeaderRaw).toString("base64");
  const ipfsW3GW = "https://crustipfs.xyz";
  const ipfs = ipfsClient.create({
    url: `${ipfsW3GW}/api/v0`,
    headers: {
      authorization: `Basic ${authHeader}`,
    },
  });
  let result = await all(ipfs.files.ls("/" + dirName));
  return { dir_name: dirName, files: result };
}
