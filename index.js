const ipfsClient = require("ipfs-http-client");
const express = require("express");
const bodyparser = require("body-parser");
const fileupload = require("express-fileupload");
const fs = require("fs");
const path = require("path");
const placeStorageOrder = require("./storageOrder");
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

app.use(bodyparser.urlencoded({ extended: true }));
app.use(fileupload());

app.get("/", (req, res) => {
  res.render("index");
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

app.listen(3000, () => {
  console.log("SERVER is listening");
});
app.post("/upload", (req, res) => {
  const file = req.files.file;
  const fileName = req.body.fileName;
  const filePath = FILE_DIR + "/" + fileName;
  file.mv(filePath, async (err) => {
    if (err) {
      console.log("eRRor");
      return res.status(500).send(err);
    }
    const fileDetail = await addFileAuth(fileName, filePath);
    console.log(fileDetail);
    const size = fileDetail.cumulativeSize;
    const fileHash = fileDetail.cid;
    fs.unlink(filePath, (err) => {
      if (err) {
        console.log(err);
      }
    });
    res.render("upload", { fileName, fileHash, size });
  });
});

const addFile = async (file_name, file_path) => {
  const fileBuffer = fs.readFileSync(file_path);
  const fileAdded = await ipfs.add({
    path: file_path,
    content: fileBuffer,
  });

  console.log(fileAdded);
  const fileHash = fileAdded.cid;

  return fileHash;
};

const ethers = require("ethers");

async function addFileAuth(file_name, file_path) {
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

  // // 2. Add file to ipfs
  const { cid } = await ipfs.add({
    path: file_path,
    content: fileBuffer,
  });
  console.log("CIDDDDD");
  console.log(cid);

  // // 3. Get file status from ipfs
  const fileStat = await ipfs.files.stat("/ipfs/" + cid);
  console.log("FILESTAT");
  console.log(fileStat);
  await placeStorageOrder(fileStat.cid, fileStat.cumulativeSize);
  return {
    cumulativeSize: fileStat.cumulativeSize,
    cid: fileStat.cid,
  };
}
