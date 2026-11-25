// Starts one in-memory MongoDB for the whole test run; each test then gets a database of its own on it
// (see test-backend.ts). Nothing touches a real database. The first run downloads a mongod binary into
// node_modules/.cache, which takes a while once.
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    mongoUri: string;
  }
}

export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const mongo = await MongoMemoryServer.create();
  project.provide('mongoUri', mongo.getUri());
  return async () => {
    await mongo.stop();
  };
}
