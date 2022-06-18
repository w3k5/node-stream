import express, { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { v4 as uuid } from 'uuid';
import util from 'util';
const cors = require('cors');
const writeFile = util.promisify(fs.writeFile);

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(cors());

app.get('/', (request: Request, response: Response) => {
  response.send('Express + TypeScript Server');
});

app.post('/upload', async (request: Request, response: Response) => {
  try {
    const filename = uuid();
    const isUploadFolderExist = await checkIsFolderExist('uploads');
    if (!isUploadFolderExist) {
      await createFolder('uploads');
    }
    const filePath = path.join(__dirname, 'uploads', `${filename}.zip`);
    await writeFile(filePath, '');
    const fileStream = fs.createWriteStream(filePath);
    request.on('data', (chunk) => {
      fileStream.write(chunk);
    });
    request.on('end', () => {
      console.log('Uploaded');
      fileStream.end();
      return response.send(`${filename}.zip`);
    });
    request.on('error', (error) => {
      console.log(error);
      return response.status(500).send(error);
    });
  } catch (error) {
    return response.status(500).send(error);
  }
});

app.get('/download', async (request: Request, response: Response) => {
  try {
    const { filename } = request.query;
    if (!filename) {
      return response.status(400).send('Filename is required');
    }
    const filePath = path.join(__dirname, 'uploads', `${filename}`);
    const isFileExist = await checkIsFileExist(`uploads/${filename}`);
    if (!isFileExist) {
      return response.status(404).send('File not found');
    }
    const fileStream = fs.createReadStream(filePath);
    response.writeHead(200, {
      'Content-Disposition': 'attachment;filename=' + filename,
      'Content-Type': 'application/zip',
    });
    fileStream.pipe(response);
    fileStream.on('error', (error) => {
      console.log('[write file error]', error);
      return response.status(500).send(error);
    });
  } catch (error) {
    return response.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

export const checkIsFolderExist = async (folderName: string) => {
  try {
    const filePath = path.join(__dirname, `${folderName}`);
    await fs.promises.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
};

export const createFolder = async (folderName: string) => {
  try {
    const filePath = path.join(__dirname, `${folderName}`);
    await fs.promises.mkdir(filePath);
    return true;
  } catch (error) {
    return false;
  }
};

export const checkIsFileExist = async (fileName: string) => {
  try {
    const filePath = path.join(__dirname, `${fileName}`);
    await fs.promises.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
};
