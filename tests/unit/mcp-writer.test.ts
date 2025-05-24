import fs from "fs-extra";
import path from "node:path";
import { writeMcpServersToFile } from "../../src/utils/mcp-writer";

describe("MCP Writer", () => {
  const testDir = path.join(__dirname, "..", "..", "tmp-test", "mcp-writer");
  const mcpPath = path.join(testDir, "mcp.json");

  beforeEach(() => {
    fs.ensureDirSync(testDir);
    fs.removeSync(mcpPath);
  });

  afterEach(() => {
    fs.removeSync(testDir);
  });

  describe("writeMcpServersToFile", () => {
    test("should create new mcp.json file with aicm flag", () => {
      const mcpServers = {
        "test-server": {
          command: "./test.sh",
          env: { TOKEN: "test123" },
        },
      };

      writeMcpServersToFile(mcpServers, mcpPath);

      expect(fs.existsSync(mcpPath)).toBe(true);
      const config = fs.readJsonSync(mcpPath);
      expect(config.mcpServers["test-server"]).toMatchObject({
        command: "./test.sh",
        env: { TOKEN: "test123" },
        aicm: true,
      });
    });

    test("should preserve user servers when adding aicm servers", () => {
      // Setup existing file with user server
      const existingConfig = {
        mcpServers: {
          "user-server": {
            command: "./user.sh",
            env: { USER_TOKEN: "user123" },
          },
        },
        userSettings: {
          theme: "dark",
        },
      };
      fs.writeJsonSync(mcpPath, existingConfig, { spaces: 2 });

      // Add aicm server
      const mcpServers = {
        "aicm-server": {
          command: "./aicm.sh",
          env: { AICM_TOKEN: "aicm123" },
        },
      };

      writeMcpServersToFile(mcpServers, mcpPath);

      const finalConfig = fs.readJsonSync(mcpPath);

      // User server should be preserved without aicm flag
      expect(finalConfig.mcpServers["user-server"]).toMatchObject({
        command: "./user.sh",
        env: { USER_TOKEN: "user123" },
      });
      expect(finalConfig.mcpServers["user-server"].aicm).toBeUndefined();

      // AICM server should have aicm flag
      expect(finalConfig.mcpServers["aicm-server"]).toMatchObject({
        command: "./aicm.sh",
        env: { AICM_TOKEN: "aicm123" },
        aicm: true,
      });

      // Other settings should be preserved
      expect(finalConfig.userSettings).toMatchObject({ theme: "dark" });
    });

    test("should clean up stale aicm servers", () => {
      // Setup existing file with old aicm server
      const existingConfig = {
        mcpServers: {
          "user-server": {
            command: "./user.sh",
          },
          "old-aicm-server": {
            command: "./old.sh",
            aicm: true,
          },
          "current-aicm-server": {
            command: "./old-current.sh",
            aicm: true,
          },
        },
      };
      fs.writeJsonSync(mcpPath, existingConfig, { spaces: 2 });

      // Install new aicm configuration (doesn't include old-aicm-server)
      const mcpServers = {
        "current-aicm-server": {
          command: "./new-current.sh",
          env: { TOKEN: "updated" },
        },
        "new-aicm-server": {
          command: "./new.sh",
        },
      };

      writeMcpServersToFile(mcpServers, mcpPath);

      const finalConfig = fs.readJsonSync(mcpPath);

      // User server should be preserved
      expect(finalConfig.mcpServers["user-server"]).toBeDefined();

      // Old aicm server should be removed
      expect(finalConfig.mcpServers["old-aicm-server"]).toBeUndefined();

      // Current aicm server should be updated
      expect(finalConfig.mcpServers["current-aicm-server"]).toMatchObject({
        command: "./new-current.sh",
        env: { TOKEN: "updated" },
        aicm: true,
      });

      // New aicm server should be added
      expect(finalConfig.mcpServers["new-aicm-server"]).toMatchObject({
        command: "./new.sh",
        aicm: true,
      });
    });

    test("should skip canceled servers (set to false)", () => {
      const mcpServers = {
        "active-server": {
          command: "./active.sh",
        },
        "canceled-server": false as const,
      };

      writeMcpServersToFile(mcpServers, mcpPath);

      const config = fs.readJsonSync(mcpPath);
      expect(config.mcpServers["active-server"]).toMatchObject({
        command: "./active.sh",
        aicm: true,
      });
      expect(config.mcpServers["canceled-server"]).toBeUndefined();
    });
  });
});
