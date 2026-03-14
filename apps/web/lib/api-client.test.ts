import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api-client";

describe("api client", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  const jsonResponse = (status: number, body: unknown) =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    );

  describe("api.get", () => {
    it("正常なレスポンスの場合：GETリクエストを送信してパースしたJSONを返す", async () => {
      mockFetch.mockReturnValue(jsonResponse(200, { id: 1, name: "test" }));

      const result = await api.get("/todos");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/todos"),
        expect.objectContaining({ method: "GET" }),
      );
      expect(result).toEqual({ id: 1, name: "test" });
    });

    it("リクエストを送信する場合：Content-Type: application/json ヘッダーを付与する", async () => {
      mockFetch.mockReturnValue(jsonResponse(200, {}));

      await api.get("/todos");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("レスポンスが ok でない場合：ボディの error メッセージを投げる", async () => {
      mockFetch.mockReturnValue(jsonResponse(404, { error: "Not found" }));

      await expect(api.get("/todos/unknown")).rejects.toThrow("Not found");
    });

    it("レスポンスボディに error フィールドがない場合：statusText を投げる", async () => {
      mockFetch.mockReturnValue(
        Promise.resolve(
          new Response(null, {
            status: 500,
            statusText: "Internal Server Error",
          }),
        ),
      );

      await expect(api.get("/todos")).rejects.toThrow("Internal Server Error");
    });
  });

  describe("api.post", () => {
    it("ボディを指定した場合：JSON文字列に変換してPOSTリクエストを送信する", async () => {
      mockFetch.mockReturnValue(jsonResponse(201, { id: 1 }));
      const body = { title: "new todo" };

      await api.post("/todos", body);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(body),
        }),
      );
    });

    it("ボディを省略した場合：undefined のままPOSTリクエストを送信する", async () => {
      mockFetch.mockReturnValue(jsonResponse(201, {}));

      await api.post("/todos");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ method: "POST", body: undefined }),
      );
    });

    it("正常なレスポンスの場合：パースしたJSONを返す", async () => {
      mockFetch.mockReturnValue(jsonResponse(201, { id: 42 }));

      const result = await api.post("/todos", { title: "test" });

      expect(result).toEqual({ id: 42 });
    });
  });

  describe("api.patch", () => {
    it("ボディを指定した場合：JSON文字列に変換してPATCHリクエストを送信する", async () => {
      mockFetch.mockReturnValue(jsonResponse(200, { id: 1, updated: true }));
      const body = { title: "updated" };

      await api.patch("/todos/1", body);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      );
    });
  });

  describe("api.delete", () => {
    it("リクエストを送信する場合：DELETEリクエストを送信する", async () => {
      mockFetch.mockReturnValue(
        Promise.resolve(new Response(null, { status: 204 })),
      );

      await api.delete("/todos/1");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    it("204 No Content が返る場合：undefined を返す", async () => {
      mockFetch.mockReturnValue(
        Promise.resolve(new Response(null, { status: 204 })),
      );

      const result = await api.delete("/todos/1");

      expect(result).toBeUndefined();
    });
  });
});
