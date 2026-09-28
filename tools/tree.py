#!/usr/bin/env python3
"""Prints the tree of a directory, compacting chains of folders with a single child
(like the IntelliJ package view). Usage: tree.py <dir> [comma,separated,names,to,skip]"""
import os, sys
root = sys.argv[1] if len(sys.argv) > 1 else "."
skip = {".git", "target", "node_modules", ".idea", ".mvn", ".angular", "dist", ".DS_Store"} | set(filter(None, (sys.argv[2] if len(sys.argv) > 2 else "").split(",")))
def entries(d):
    return sorted([e for e in os.listdir(d) if e not in skip and e != "package-info.java"],
                  key=lambda e: (not os.path.isdir(os.path.join(d, e)), e))
def walk(d, pre=""):
    es = entries(d)
    for i, e in enumerate(es):
        last = i == len(es) - 1
        p, name = os.path.join(d, e), e
        while os.path.isdir(p) and len(entries(p)) == 1 and os.path.isdir(os.path.join(p, entries(p)[0])):
            nxt = entries(p)[0]; name += ("." if "java/" in name and name.split("/")[-1] not in ("java",) else "/") + nxt; p = os.path.join(p, nxt)
        print(pre + ("└── " if last else "├── ") + name + ("/" if os.path.isdir(p) else ""))
        if os.path.isdir(p) and e != ".github":
            walk(p, pre + ("    " if last else "│   "))
print(os.path.basename(os.path.abspath(root)) + "/")
walk(root)
