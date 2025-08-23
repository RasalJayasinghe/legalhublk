import argparse, os
from . import gazettes, extra_gazettes
from .list_scraper import run as run_list
from .common.io import write_all_latest

def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)

    g = sub.add_parser("gazettes")
    g.add_argument("--from-year", type=int, default=2004)
    g.add_argument("--to-year", type=int, default=2025)
    g.add_argument("--out", type=str, default="public/data/gazettes")

    eg = sub.add_parser("extra-gazettes")
    eg.add_argument("--from-year", type=int, default=2004)
    eg.add_argument("--to-year", type=int, default=2025)
    eg.add_argument("--out", type=str, default="public/data/extra-gazettes")

    for k in ["acts","bills","forms","notices"]:
        p = sub.add_parser(k)
        p.add_argument("--out", type=str, default=f"public/data/{k}")

    merge = sub.add_parser("merge-latest")
    merge.add_argument("--root", type=str, default="public/data")

    args = ap.parse_args()

    if args.cmd == "gazettes":
        gazettes.run(args.from_year, args.to_year, args.out)
    elif args.cmd == "extra-gazettes":
        extra_gazettes.run(args.from_year, args.to_year, args.out)
    elif args.cmd in {"acts","bills","forms","notices"}:
        run_list(args.cmd, args.out)
    elif args.cmd == "merge-latest":
        # read per-type latest and build fast "all/latest.json"
        import json, glob
        buckets = {}
        for path in glob.glob(os.path.join(args.root,"*","latest.json")):
            with open(path,"r",encoding="utf-8") as f:
                data = json.load(f)["documents"]
            buckets[os.path.basename(os.path.dirname(path))] = data
        write_all_latest(buckets, args.root, latest_n=300)

if __name__ == "__main__":
    main()