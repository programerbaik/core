import "jest-extended";

import { app } from "@arkecosystem/core-container";
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import nock from "nock";
import { sendRequest } from "./__support__/request";
import { setUp, tearDown } from "./__support__/setup";

jest.mock("is-reachable", () => jest.fn(async () => true));

let peerMock;
let mockHost;

beforeAll(async () => {
    await setUp();

    peerMock = new Peer("1.0.0.99");
    peerMock.ports.p2p = 4003;
    peerMock.ports.api = 4003;

    app.resolvePlugin("p2p")
        .getStorage()
        .setPeer(peerMock);

    nock("http://localhost", { allowUnmocked: true });

    mockHost = nock(peerMock.url);
});

afterAll(async () => await tearDown());

afterEach(async () => nock.cleanAll());

describe("Blocks", () => {
    describe("POST blocks.latest", () => {
        it("should get the latest block", async () => {
            mockHost
                .get("/api/blocks")
                .query({ orderBy: "height:desc", limit: 1 })
                .reply(200, { data: [{ id: "123" }] });

            const response = await sendRequest("blocks.latest");

            expect(response.body.result.id).toBe("123");
        });

        it("should not find the latest block", async () => {
            mockHost.get("/api/blocks").reply(404, {});

            const response = await sendRequest("blocks.latest");

            expect(response.body.error.message).toBe("Latest block could not be found.");
        });
    });

    describe("POST blocks.info", () => {
        it("should get the block information", async () => {
            mockHost.get("/api/blocks/123").reply(200, { data: { id: "123" } });

            const response = await sendRequest("blocks.info", {
                id: "123",
            });

            expect(response.body.result.id).toBe("123");
        });

        it("should fail to get the block information", async () => {
            const response = await sendRequest("blocks.info", { id: "123" });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe("Block 123 could not be found.");
        });
    });

    describe("POST blocks.transactions", () => {
        it("should get the block transactions", async () => {
            mockHost
                .get("/api/blocks/123/transactions")
                .query({ orderBy: "timestamp:desc" })
                .reply(200, { meta: { totalCount: 1 }, data: [{ id: "123" }, { id: "123" }] });

            const response = await sendRequest("blocks.transactions", {
                id: "123",
            });

            expect(response.body.result.data).toHaveLength(2);
        });

        it("should fail to get the block transactions", async () => {
            const response = await sendRequest("blocks.transactions", { id: "123" });

            expect(response.body.error.code).toBe(404);
            expect(response.body.error.message).toBe("Block 123 could not be found.");
        });
    });
});
