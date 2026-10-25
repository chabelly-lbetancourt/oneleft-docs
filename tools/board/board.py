"""Board helper (project 4). Usage: board.py 'repo#n|Tipo|MoSCoW|puntos|sprint|Status|tiempo' ...  (empty value = unchanged)
   or board.py 'repo#n|||||Done|tiempo'  to set only the status and the time spent.
   Each card is found through its issue (one small query), never by reading the whole board: that used up the
   GraphQL limit of GitHub. An issue that is not on the board yet is added."""
import json, subprocess, sys
O = "chabelly-lbetancourt"; P = "4"; PID = "PVT_kwHOE24Rys4Bk6wT"
sh = lambda *a: subprocess.run(a, capture_output=True, text=True, check=True).stdout
graphql = lambda query: json.loads(sh("gh", "api", "graphql", "-f", "query=" + query))["data"]
F = {f["name"]: f for f in json.loads(sh("gh", "project", "field-list", P, "--owner", O, "--format", "json"))["fields"]}
iters = graphql("query{node(id:\"%s\"){... on ProjectV2{field(name:\"Sprint\"){... on ProjectV2IterationField{configuration{iterations{id title} completedIterations{id title}}}}}}}" % PID)["node"]["field"]["configuration"]
iters = {i["title"]: i["id"] for i in iters["iterations"] + iters["completedIterations"]}
opt = lambda f, v: next(o["id"] for o in F[f]["options"] if o["name"] == v)
def edit(item, field, *args):
    sh("gh", "project", "item-edit", "--id", item, "--project-id", PID, "--field-id", F[field]["id"], *args)
def item_of(repo, n):
    issue = graphql('query{repository(owner:"%s",name:"oneleft-%s"){issue(number:%s){id projectItems(first:10){nodes{id project{number}}}}}}' % (O, repo, n))["repository"]["issue"]
    item = next((x["id"] for x in issue["projectItems"]["nodes"] if str(x["project"]["number"]) == P), None)
    if item is None:
        item = graphql('mutation{addProjectV2ItemById(input:{projectId:"%s",contentId:"%s"}){item{id}}}' % (PID, issue["id"]))["addProjectV2ItemById"]["item"]["id"]
    return item
for spec in sys.argv[1:]:
    parts = (spec.split("|") + [""] * 7)[:7]
    key, tipo, mos, pts, spr, status, spent = parts
    repo, n = key.split("#")
    item = item_of(repo, n)
    if tipo: edit(item, "Tipo", "--single-select-option-id", opt("Tipo", tipo))
    if mos: edit(item, "Prioridad (MoSCoW)", "--single-select-option-id", opt("Prioridad (MoSCoW)", mos))
    if pts: edit(item, "Puntos", "--number", pts)
    if spr: edit(item, "Sprint", "--iteration-id", iters["Sprint " + spr])
    if status: edit(item, "Status", "--single-select-option-id", opt("Status", status))
    if spent: edit(item, "Tiempo invertido", "--number", spent)
    print(key, "ok", "|".join(parts[1:]))
