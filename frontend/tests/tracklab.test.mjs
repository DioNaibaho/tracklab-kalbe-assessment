import test from "node:test";
import assert from "node:assert/strict";

const NEXT_BASE_URL = "http://localhost:3000";
const DOTNET_LOGGER_URL = "http://localhost:5050/api/logs";

function encodePagingFilterBase64(filterMap) {
  const formatted = {};
  for (const [key, values] of Object.entries(filterMap)) {
    if (values && values.length > 0) {
      formatted[key] = values.join("||");
    }
  }
  return Buffer.from(JSON.stringify(formatted), "utf-8").toString("base64");
}

test("Unit Test: X-Paging-Include Base64 encoder sesuai spesifikasi Kalbe", () => {
  const encoded = encodePagingFilterBase64({
    tracker_code: ["REQ-ACC", "REQ-CREATE"],
    module_flow: ["CA"],
  });

  const decoded = JSON.parse(Buffer.from(encoded, "base64").toString("utf-8"));
  assert.deepEqual(decoded, {
    tracker_code: "REQ-ACC||REQ-CREATE",
    module_flow: "CA",
  });
});

test("Integration Test: Backend .NET Logger menerima & menyimpan audit log", async () => {
  const payload = {
    username: "assessment.it",
    action: "AUTOMATED_TEST",
    module: "TEST_SUITE",
    endpoint: "/api/logs",
    details: "Verifikasi integrasi automated test Node.js -> .NET SQLite",
    statusCode: 201,
  };

  const postRes = await fetch(DOTNET_LOGGER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  assert.equal(postRes.status, 201);
  const postJson = await postRes.json();
  assert.equal(postJson.success, true);

  const getRes = await fetch(`${DOTNET_LOGGER_URL}?search=AUTOMATED_TEST`);
  assert.equal(getRes.status, 200);
  const getJson = await getRes.json();
  assert.ok(getJson.data.items.length >= 1);
});

test("Integration Test: Next.js Feature CRUD (Create -> Read -> Update -> Delete)", async () => {
  // 1. CREATE
  const createRes = await fetch(`${NEXT_BASE_URL}/api/feature/trackers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: "TEST-TRK-99",
      description: "Automated Test Tracker",
      action_type: "none",
      module_flow: "CA",
      order: 99,
      mandays: 1,
    }),
  });
  assert.equal(createRes.status, 201);
  const created = await createRes.json();
  const createdId = created.data.id;
  assert.ok(createdId);

  // 2. READ dengan X-Paging-* headers
  const readRes = await fetch(`${NEXT_BASE_URL}/api/feature/trackers`, {
    headers: {
      "X-Paging-Offset": "0",
      "X-Paging-Limit": "10",
      "X-Paging-SortBy": "order",
      "X-Paging-SortOrder": "DESC",
      "X-Paging-Search": "TEST-TRK-99",
    },
  });
  assert.equal(readRes.status, 200);
  const readJson = await readRes.json();
  assert.equal(readJson.data.items[0].code, "TEST-TRK-99");

  // 3. UPDATE
  const updateRes = await fetch(`${NEXT_BASE_URL}/api/feature/trackers`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: createdId,
      description: "Automated Test Tracker Updated",
    }),
  });
  assert.equal(updateRes.status, 200);

  // 4. DELETE
  const deleteRes = await fetch(
    `${NEXT_BASE_URL}/api/feature/trackers?id=${createdId}`,
    { method: "DELETE" }
  );
  assert.equal(deleteRes.status, 200);
});