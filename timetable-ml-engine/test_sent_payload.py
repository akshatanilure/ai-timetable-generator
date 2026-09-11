import json
import main
import time

print("Loading real sent payload from ../scratch/sent_payload.json...")
with open("../scratch/sent_payload.json", "r") as f:
    payload_data = json.load(f)

print("Formatting request...")
# Convert MongoDB _id structure to simple string ids if needed
for sub in payload_data["subjects"]:
    if "_id" in sub and isinstance(sub["_id"], dict):
        sub["_id"] = sub["_id"]["$oid"]
for t in payload_data["teachers"]:
    if "_id" in t and isinstance(t["_id"], dict):
        t["_id"] = t["_id"]["$oid"]
for r in payload_data["rooms"]:
    if "_id" in r and isinstance(r["_id"], dict):
        r["_id"] = r["_id"]["$oid"]

request = main.GenerationRequest(**payload_data)
print("Request parsed successfully.")

print("Starting generation call...")
start_time = time.time()
res = main.generate_timetable(request)
end_time = time.time()

print(f"\n--- RESULTS ---")
print(f"Returned in {end_time - start_time:.4f} seconds.")
print("Status:", res.get("status"))
print("Conflicts:", res.get("conflicts"))
