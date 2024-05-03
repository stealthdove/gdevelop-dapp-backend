// insert seed data

import { PrismaClient } from '@prisma/client';
import Replicate from 'replicate';

const prisma = new PrismaClient();

async function main() {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_KEY as string,
  });

  let response = await replicate.request("/hardware", {
    method: "GET",
  });
  const hardwares = await response.json();
  await prisma.hardware.deleteMany();
  await prisma.hardware.createMany({
    data: hardwares
  });

  let models: any[] = [];
  await prisma.collection.deleteMany()
  await prisma.modelR.deleteMany();

  let pageUrl = "/models";
  while (true) {
    const replicateModels = await(await replicate.request(pageUrl, {
      method: "GET",
    })).json();
    models = models.concat(replicateModels['results']);
    if(replicateModels['next']) {
      pageUrl = replicateModels['next'].replace("https://api.replicate.com/v1",'');
    } else {
      break;
    }
  }

  const collections = await(await replicate.request("/collections", {
    method: "GET",
  })).json();
  await Promise.all(collections['results'].map(async (collection: any) => {
    const collectionCreated = await prisma.collection.create({
      data: collection
    });
    const collectionModels = await(await replicate.request(`/collections/${collection['slug']}`, {
      method: "GET",
    })).json();
    collectionModels['models'].map((collectionModel: any) => {
      const ind = models.findIndex((model) => model.url === collectionModel.url)
      if (ind !== -1) {
        if ('collection_id' in models[ind]) {
          models[ind]['collection_id'].push(collectionCreated.id);
        } else {
          models[ind]['collection_id'] = [collectionCreated.id];
        }
      }
    })
  }));

  await prisma.modelR.createMany({
    data: models.map(model => ({
      ...model,
    }))
  });

  await prisma.$disconnect();
}

main()
.catch((e) => {
    throw e;
})
.finally(async () => {
    await prisma.$disconnect();
});
