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

app.get("/signin", (req, res) => {
  res.render("signin", {
    title: "Sign In",
  });
});

app.get("/signup", (req, res) => {
  res.render("signup", {
    title: "Sign Up",
  });
});

app.get("/upload", (req, res) => {
  res.render("upload", {
    title: "Upload",
  });
});

app.get("/file-uploaded", (req, res) => {
  res.render("file-uploaded", {
    title: "File Uploaded",
  });
});

app.listen(3000, () => {
  console.log("SERVER is listening");
});
app.post("/upload", (req, res) => {
  const file = req.files.file;
  const fileName = req.body.fileName;
  const account = req.body.account;
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
    await ipfs.files.mkdir("/" + dir_name);
  } catch (error) {
    console.error(error);
  }
  let result = await ipfs.files.stat("/" + dir_name);
  console.log("making direfctoryu");
  console.log(result);
  console.log("ls dir");
  result = await all(ipfs.files.ls("/example"));
  console.log(result);
  console.log(file_path);
  await ipfs.files.write("/" + file_name, fileBuffer, { create: true });
  console.log("ls dir");
  result = await all(ipfs.files.ls("/"));
  console.log(result);
  await ipfs.files.mv("/" + file_name, "/" + dir_name);
  result = await all(ipfs.files.ls("/" + dir_name));
  const cur_file = result.find((r) => r.name == file_name);
  console.log({ cur_file });
  await placeStorageOrder(cur_file.cid, cur_file.size);
  // const cid = result[0].cid;
  // const size = result[0].size;
  // get current account from cookies
  // // 2. Add file to ipfs
  // const { cid } = await ipfs.add({
  //   path: file_path,
  //   content: fileBuffer,
  // });
  // console.log("CIDDDDD");
  // console.log(cid);

  // // 3. Get file status from ipfs
  // const fileStat = await ipfs.files.stat("/ipfs/" + cid);
  // console.log("FILESTAT");
  // console.log(fileStat);
  // return {
  //   cumulativeSize: fileStat.cumulativeSize,
  //   cid: fileStat.cid,
  // };
  return { dir_name: dir_name, files: result };
}
