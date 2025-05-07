import { join } from "path";
import { loadAicmConfigCosmiconfig } from "../../src/utils/config";

describe("config loader", () => {
  const originalCwd = process.cwd();
  const fixtureRoot = join(__dirname, "../fixtures");

  afterEach(() => {
    process.chdir(originalCwd);
  });

  it("loads config from aicm.json", async () => {
    const fixtureDir = join(fixtureRoot, "windsurf-no-markers-updated");
    process.chdir(fixtureDir);
    const config = await loadAicmConfigCosmiconfig();
    expect(config).toBeTruthy();
    expect(config?.ides).toEqual(["windsurf"]);
    expect(config?.rules).toHaveProperty("no-marker-rule");
  });

  it("loads config from package.json (aicm key)", async () => {
    // Use a fixture that has package.json with aicm key
    const fixtureDir = join(fixtureRoot, "package-json-aicm");
    process.chdir(fixtureDir);
    const config = await loadAicmConfigCosmiconfig();
    expect(config).toBeTruthy();
    expect(config?.ides).toEqual(["windsurf"]);
    expect(config?.rules).toHaveProperty("pkg-rule");
  });

  it("returns null if no config found", async () => {
    // Use a fixture with no config files
    const fixtureDir = join(fixtureRoot, "no-config");
    process.chdir(fixtureDir);
    const config = await loadAicmConfigCosmiconfig();
    expect(config).toBeNull();
  });
});
