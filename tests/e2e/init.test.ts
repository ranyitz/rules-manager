import path from "path";
import fs from "fs-extra";
import {
  setupFromFixture,
  runCommand,
  fileExists,
  readTestFile,
  testDir,
} from "./helpers";

test("should create default config file", async () => {
  await setupFromFixture("no-config");

  const { stdout, code } = await runCommand("init");

  expect(code).toBe(0);
  expect(stdout).toContain("Configuration file location:");

  expect(fileExists("aicm.json")).toBe(true);

  const config = JSON.parse(readTestFile("aicm.json"));
  expect(config).toEqual({ rulesDir: "rules" });
});

test("should not overwrite existing config", async () => {
  await setupFromFixture("no-config");

  const customConfig = { rulesDir: "custom-rules" };
  fs.writeJsonSync(path.join(testDir, "aicm.json"), customConfig);

  const { stdout, code } = await runCommand("init");

  expect(code).toBe(0);
  expect(stdout).toContain("Configuration file already exists!");

  expect(fileExists("aicm.json")).toBe(true);

  const config = JSON.parse(readTestFile("aicm.json"));
  expect(config).toEqual(customConfig);
});
