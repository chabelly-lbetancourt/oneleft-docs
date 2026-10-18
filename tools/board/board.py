"""Board helper (project 4). Usage: board.py 'repo#n|Tipo|MoSCoW|puntos|sprint|Status|tiempo' ...  (empty value = unchanged)
   or board.py 'repo#n|||||Done|tiempo'  to set only the status and the time spent."""
import json, subprocess, sys
O = "chabelly-lbetancourt"; P = "4"; PID = "PVT_kwHOE24Rys4Bk6wT"
sh = lambda *a: subprocess.run(a, capture_output=True, text=True, check=True).stdout
F = {f["name"]: f for f in json.loads(sh("gh", "project", "field-list", P, "--owner", O, "--format", "json"))["fields"]}
items = json.loads(sh("gh", "project", "item-list", P, "--owner", O, "--limit", "500", "--format", "json"))["items"]
iters = json.loads(sh("gh", "api", "graphql", "-f", "query=query{node(id:\"%s\"){... on ProjectV2{field(name:\"Sprint\"){... on ProjectV2IterationField{configuration{iterations{id title} completedIterations{id title}}}}}}}" % PID))["data"]["node"]["field"]["configuration"]
iters = {i["title"]: i["id"] for i in iters["iterations"] + iters["completedIterations"]}
opt = lambda f, v: next(o["id"] for o in F[f]["options"] if o["name"] == v)
def edit(item, field, *args):
    sh("gh", "project", "item-edit", "--id", item, "--project-id", PID, "--field-id", F[field]["id"], *args)
for spec in sys.argv[1:]:
    parts = (spec.split("|") + [""] * 7)[:7]
    key, tipo, mos, pts, spr, status, spent = parts
    repo, n = key.split("#")
    item = next((i["id"] for i in items if i.get("content", {}).get("repository") == f"{O}/oneleft-{repo}" and i["content"].get("number") == int(n)), None)
    if item is None:
        url = f"https://github.com/{O}/oneleft-{repo}/issues/{n}"
        item = json.loads(sh("gh", "project", "item-add", P, "--owner", O, "--url", url, "--format", "json"))["id"]
    if tipo: edit(item, "Tipo", "--single-select-option-id", opt("Tipo", tipo))
    if mos: edit(item, "Prioridad (MoSCoW)", "--single-select-option-id", opt("Prioridad (MoSCoW)", mos))
    if pts: edit(item, "Puntos", "--number", pts)
    if spr: edit(item, "Sprint", "--iteration-id", iters["Sprint " + spr])
    if status: edit(item, "Status", "--single-select-option-id", opt("Status", status))
    if spent: edit(item, "Tiempo invertido", "--number", spent)
    print(key, "ok", "|".join(parts[1:]))
