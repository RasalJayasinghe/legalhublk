import argparse, os
from . import gazettes, extra_gazettes
from .list_scraper import run as run_list
from .forms_notices_scraper import run_forms, run_notices
from .acts_bills_scraper import run_acts, run_bills
from .huggingface_scraper import run_hf_acts_full, run_hf_acts_chunks
from .github_repo_scraper import run_github_acts, run_github_extraordinary_gazettes, run_github_bills
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

    # Hugging Face dataset commands
    hf_full = sub.add_parser("hf-acts-full")
    hf_full.add_argument("--out", type=str, default="public/data/hf-acts-full")
    
    hf_chunks = sub.add_parser("hf-acts-chunks")
    hf_chunks.add_argument("--out", type=str, default="public/data/hf-acts-chunks")

    # GitHub repository data commands
    gh_acts = sub.add_parser("github-acts")
    gh_acts.add_argument("--out", type=str, default="public/data/github-acts")
    
    gh_ex_gaz = sub.add_parser("github-extraordinary-gazettes")
    gh_ex_gaz.add_argument("--out", type=str, default="public/data/github-extraordinary-gazettes")
    
    gh_bills = sub.add_parser("github-bills")
    gh_bills.add_argument("--out", type=str, default="public/data/github-bills")

    merge = sub.add_parser("merge-latest")
    merge.add_argument("--root", type=str, default="public/data")

    args = ap.parse_args()

    if args.cmd == "gazettes":
        gazettes.run(args.from_year, args.to_year, args.out)
    elif args.cmd == "extra-gazettes":
        extra_gazettes.run(args.from_year, args.to_year, args.out)
    elif args.cmd == "forms":
        run_forms(args.out)
    elif args.cmd == "notices":
        run_notices(args.out)
    elif args.cmd == "acts":
        run_acts(args.out)
    elif args.cmd == "bills":
        run_bills(args.out)
    elif args.cmd == "hf-acts-full":
        run_hf_acts_full(args.out)
    elif args.cmd == "hf-acts-chunks":
        run_hf_acts_chunks(args.out)
    elif args.cmd == "github-acts":
        run_github_acts(args.out)
    elif args.cmd == "github-extraordinary-gazettes":
        run_github_extraordinary_gazettes(args.out)
    elif args.cmd == "github-bills":
        run_github_bills(args.out)
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