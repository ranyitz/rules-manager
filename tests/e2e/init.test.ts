import {
  setupFromFixture,
  runCommand,
  fileExists,
  readTestFile,
} from "./helpers";
import fs from "fs-extra";
import path from "path";
import { testDir } from "./helpers";

describe("aicm init command with fixtures", () => {
  test("should create default config file", async () => {
    await setupFromFixture("init-empty");

    await runCommand("init");

    expect(fileExists("aicm.json")).toBe(true);

    const config = JSON.parse(readTestFile("aicm.json"));
    expect(config).toEqual({ rules: {} });
  });

  test("should not overwrite existing config", async () => {
    await setupFromFixture("init-empty");

    const customConfig = { ides: ["custom"], rules: {} };
    fs.writeJsonSync(path.join(testDir, "aicm.json"), customConfig);

    await runCommand("init");

    expect(fileExists("aicm.json")).toBe(true);

    const config = JSON.parse(readTestFile("aicm.json"));
    expect(config).toEqual(customConfig);
  });
});
