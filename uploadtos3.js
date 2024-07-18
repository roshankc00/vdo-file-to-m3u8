const AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS__ACCESS_KEY,
  },
});

const bucketName = process.env.AWS_UPLOAD_S3_BUCKET_NAME;
const localFolderPath = `output/${process.env.TRANSCODED_S3_OBJECT_KEY}`;
const s3FolderPath = process.env.TRANSCODED_S3_OBJECT_KEY;

async function uploadFile(filePath, s3Key) {
  const fileContent = fs.readFileSync(filePath);

  const params = {
    Bucket: bucketName,
    Key: s3Key,
    Body: fileContent,
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        console.log(`Uploaded ${filePath} to ${data.Location}`);
        resolve(data);
      }
    });
  });
}

async function uploadDirectory(localDir, s3Dir) {
  try {
    if (!fs.existsSync(localDir)) {
      console.log(`Local directory "${localDir}" not found.`);
      return;
    }

    const files = fs.readdirSync(localDir);
    for (const file of files) {
      const filePath = path.join(localDir, file);
      const key = path.join(s3Dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        await uploadFile(filePath, key);
      } else if (stat.isDirectory()) {
        await uploadDirectory(filePath, key);
      }
    }
    console.log(`Upload of ${localDir} to S3 completed.`);
  } catch (err) {
    console.error("Error uploading directory:", err);
  }
}

async function main() {
  try {
    await uploadDirectory(localFolderPath, s3FolderPath);
    console.log("Upload to S3 complete.");
  } catch (err) {
    console.error("Error uploading to S3:", err);
  }
}

main();
